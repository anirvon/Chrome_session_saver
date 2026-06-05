/*
 * Session TXT/JSON Saver - background service worker
 *
 * This file contains all Chrome API work that should keep running even if the
 * popup closes. The popup sends messages here for capture/import operations.
 *
 * Manifest V3 notes:
 * - Service workers are event-driven and may be stopped when idle.
 * - Keep all code local in the extension package; do not load remote code.
 */

const EXTENSION_NAME = "Session TXT/JSON Saver";
const EXTENSION_VERSION = "0.1.0";
const SCHEMA_ID = "session-txt-json-saver";
const SCHEMA_VERSION = 1;
const NO_GROUP_ID = -1;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (!message || typeof message.type !== "string") {
        throw new Error("Invalid request sent to background service worker.");
      }

      if (message.type === "CAPTURE_SESSION") {
        const session = await captureCurrentSession(message.options || {});
        sendResponse({ ok: true, session });
        return;
      }

      if (message.type === "IMPORT_SESSION") {
        const result = await importSession(message.session, message.options || {});
        sendResponse({ ok: true, result });
        return;
      }

      throw new Error(`Unknown request type: ${message.type}`);
    } catch (error) {
      sendResponse({ ok: false, error: getErrorMessage(error) });
    }
  })();

  // Required because sendResponse is called asynchronously.
  return true;
});

/**
 * Promise wrapper for callback-style Chrome APIs.
 */
function chromeCall(fn, ...args) {
  return new Promise((resolve, reject) => {
    try {
      fn(...args, (result) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
        } else {
          resolve(result);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function getErrorMessage(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  return error.message || String(error);
}

function nowForFilename() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    "-",
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds())
  ].join("");
}

/**
 * Capture normal and popup Chrome windows that are visible to this extension.
 * Incognito windows are only visible if the user enabled this extension in
 * incognito mode in chrome://extensions.
 */
async function captureCurrentSession(options) {
  const includeWindowGeometry = options.includeWindowGeometry !== false;
  const includePopupWindows = options.includePopupWindows !== false;
  const includeIncognito = options.includeIncognito === true;

  const windowTypes = includePopupWindows ? ["normal", "popup"] : ["normal"];
  const allWindows = await chromeCall(chrome.windows.getAll, {
    populate: true,
    windowTypes
  });

  const visibleWindows = allWindows.filter((win) => {
    if (!includeIncognito && win.incognito) return false;
    return Array.isArray(win.tabs) && win.tabs.length > 0;
  });

  const session = {
    schema: SCHEMA_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedBy: {
      name: EXTENSION_NAME,
      version: EXTENSION_VERSION,
      manifestVersion: 3
    },
    savedAt: new Date().toISOString(),
    suggestedFilenameBase: `sessions-${nowForFilename()}`,
    captureOptions: {
      includeWindowGeometry,
      includePopupWindows,
      includeIncognito
    },
    limitations: [
      "Some internal browser pages such as chrome:// URLs may not be restorable by extensions.",
      "Incognito windows are only available if the extension is enabled in incognito mode.",
      "Chrome does not expose user-assigned window names through the standard extension windows API."
    ],
    windows: []
  };

  let savedWindowIndex = 0;
  for (const win of visibleWindows) {
    const windowRecord = await serializeWindow(win, savedWindowIndex, includeWindowGeometry);
    session.windows.push(windowRecord);
    savedWindowIndex += 1;
  }

  return session;
}

async function serializeWindow(win, savedWindowIndex, includeWindowGeometry) {
  const tabs = [...(win.tabs || [])].sort((a, b) => (a.index || 0) - (b.index || 0));
  const groupIds = new Set();

  for (const tab of tabs) {
    if (typeof tab.groupId === "number" && tab.groupId !== NO_GROUP_ID) {
      groupIds.add(tab.groupId);
    }
  }

  const rawGroups = new Map();
  for (const groupId of groupIds) {
    try {
      const group = await chromeCall(chrome.tabGroups.get, groupId);
      rawGroups.set(groupId, group);
    } catch (error) {
      // A group could disappear while the user is changing tabs. Keep going.
      console.warn(`Could not read tab group ${groupId}:`, error);
    }
  }

  const groupIdToKey = new Map();
  const groupFirstTabIndex = new Map();
  let groupSeq = 0;

  for (const tab of tabs) {
    if (typeof tab.groupId !== "number" || tab.groupId === NO_GROUP_ID) continue;
    if (!rawGroups.has(tab.groupId)) continue;
    if (!groupIdToKey.has(tab.groupId)) {
      groupIdToKey.set(tab.groupId, `window-${savedWindowIndex}-group-${groupSeq}`);
      groupFirstTabIndex.set(tab.groupId, tab.index || 0);
      groupSeq += 1;
    }
  }

  const serializedTabs = tabs.map((tab) => serializeTab(tab, groupIdToKey));

  const serializedGroups = [...rawGroups.entries()]
    .filter(([groupId]) => groupIdToKey.has(groupId))
    .map(([groupId, group]) => ({
      groupKey: groupIdToKey.get(groupId),
      title: group.title || "",
      color: group.color || "grey",
      collapsed: Boolean(group.collapsed),
      firstTabIndex: groupFirstTabIndex.get(groupId) ?? 0
    }))
    .sort((a, b) => a.firstTabIndex - b.firstTabIndex);

  const windowRecord = {
    savedWindowIndex,
    type: win.type || "normal",
    state: win.state || "normal",
    focused: Boolean(win.focused),
    incognito: Boolean(win.incognito),
    alwaysOnTop: Boolean(win.alwaysOnTop),
    tabs: serializedTabs,
    groups: serializedGroups
  };

  if (includeWindowGeometry) {
    windowRecord.geometry = {
      left: numberOrNull(win.left),
      top: numberOrNull(win.top),
      width: numberOrNull(win.width),
      height: numberOrNull(win.height)
    };
  }

  return windowRecord;
}

function serializeTab(tab, groupIdToKey) {
  const groupKey = (typeof tab.groupId === "number" && tab.groupId !== NO_GROUP_ID)
    ? groupIdToKey.get(tab.groupId) || null
    : null;

  return {
    savedTabIndex: tab.index ?? 0,
    url: tab.url || tab.pendingUrl || "chrome://newtab/",
    pendingUrl: tab.pendingUrl || null,
    title: tab.title || "",
    pinned: Boolean(tab.pinned),
    active: Boolean(tab.active),
    highlighted: Boolean(tab.highlighted),
    audible: Boolean(tab.audible),
    muted: Boolean(tab.mutedInfo && tab.mutedInfo.muted),
    discarded: Boolean(tab.discarded),
    autoDiscardable: tab.autoDiscardable !== false,
    groupKey
  };
}

function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function validateSession(session) {
  if (!session || typeof session !== "object") {
    throw new Error("The selected file is not a valid session object.");
  }

  if (!Array.isArray(session.windows)) {
    throw new Error("The selected file does not contain a windows array.");
  }

  if (session.schemaVersion && session.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `This session file uses schemaVersion ${session.schemaVersion}, but this extension only supports up to ${SCHEMA_VERSION}.`
    );
  }
}

/**
 * Restore a session into new Chrome windows. This function never closes or
 * overwrites the user's current tabs.
 */
async function importSession(session, options) {
  validateSession(session);

  const restorePinnedTabs = options.restorePinnedTabs !== false;
  const restoreMutedTabs = options.restoreMutedTabs !== false;
  const restoreGroups = options.restoreGroups !== false;
  const restoreWindowGeometry = options.restoreWindowGeometry !== false;
  const focusFirstRestoredWindow = options.focusFirstRestoredWindow !== false;
  const allowIncognitoRestore = options.allowIncognitoRestore === true;

  let incognitoAllowed = false;
  try {
    incognitoAllowed = await chromeCall(chrome.extension.isAllowedIncognitoAccess);
  } catch (error) {
    incognitoAllowed = false;
  }

  const report = {
    windowsRequested: session.windows.length,
    windowsCreated: 0,
    tabsRequested: 0,
    tabsCreated: 0,
    groupsRequested: 0,
    groupsCreated: 0,
    unrestoredUrls: [],
    warnings: []
  };

  const createdWindowIds = [];

  for (const [windowOffset, savedWindow] of session.windows.entries()) {
    const tabs = Array.isArray(savedWindow.tabs) ? savedWindow.tabs : [];
    const groups = Array.isArray(savedWindow.groups) ? savedWindow.groups : [];
    report.tabsRequested += tabs.length;
    report.groupsRequested += groups.length;

    if (tabs.length === 0) {
      report.warnings.push(`Skipped saved window ${windowOffset + 1} because it contained no tabs.`);
      continue;
    }

    const importWindowResult = await createWindowFromSavedWindow(savedWindow, tabs[0], {
      restoreWindowGeometry,
      allowIncognitoRestore,
      incognitoAllowed,
      report
    });

    const { windowId, firstTabId } = importWindowResult;
    createdWindowIds.push(windowId);
    report.windowsCreated += 1;
    report.tabsCreated += 1;

    const createdTabsBySavedIndex = new Map();
    createdTabsBySavedIndex.set(0, firstTabId);

    await applyTabProperties(firstTabId, tabs[0], {
      restorePinnedTabs,
      restoreMutedTabs
    });

    for (let i = 1; i < tabs.length; i += 1) {
      const savedTab = tabs[i];
      const tabId = await createTabSafely({
        windowId,
        savedTab,
        active: false,
        report
      });

      if (tabId !== null) {
        createdTabsBySavedIndex.set(i, tabId);
        report.tabsCreated += 1;
        await applyTabProperties(tabId, savedTab, {
          restorePinnedTabs,
          restoreMutedTabs
        });
      }
    }

    if (restoreGroups && groups.length > 0) {
      await restoreTabGroups({
        windowId,
        tabs,
        groups,
        createdTabsBySavedIndex,
        report
      });
    }

    await restoreActiveTab({
      windowId,
      tabs,
      createdTabsBySavedIndex
    });

    await restoreWindowState(savedWindow, windowId, restoreWindowGeometry, report);
  }

  if (focusFirstRestoredWindow && createdWindowIds.length > 0) {
    try {
      await chromeCall(chrome.windows.update, createdWindowIds[0], { focused: true });
    } catch (error) {
      report.warnings.push(`Could not focus the first restored window: ${getErrorMessage(error)}`);
    }
  }

  return report;
}

async function createWindowFromSavedWindow(savedWindow, firstSavedTab, context) {
  const { restoreWindowGeometry, allowIncognitoRestore, incognitoAllowed, report } = context;
  const createData = {
    url: normalizeUrlForOpen(firstSavedTab.url),
    focused: false,
    type: savedWindow.type === "popup" ? "popup" : "normal"
  };

  if (savedWindow.incognito) {
    if (allowIncognitoRestore && incognitoAllowed) {
      createData.incognito = true;
    } else {
      report.warnings.push(
        "A saved incognito window was restored as a normal window because incognito restore was not enabled or not allowed."
      );
    }
  }

  if (restoreWindowGeometry && savedWindow.state === "normal" && savedWindow.geometry) {
    const geometry = sanitizeGeometry(savedWindow.geometry);
    Object.assign(createData, geometry);
  }

  let createdWindow;
  try {
    createdWindow = await chromeCall(chrome.windows.create, createData);
  } catch (error) {
    report.unrestoredUrls.push({
      url: firstSavedTab.url || "",
      title: firstSavedTab.title || "",
      reason: getErrorMessage(error)
    });

    createdWindow = await chromeCall(chrome.windows.create, {
      ...createData,
      url: buildUnrestoredUrl(firstSavedTab, getErrorMessage(error))
    });
  }

  const firstTab = Array.isArray(createdWindow.tabs) && createdWindow.tabs.length > 0
    ? createdWindow.tabs[0]
    : null;

  if (!firstTab || typeof firstTab.id !== "number") {
    throw new Error("Chrome created a window, but did not return a usable first tab ID.");
  }

  return { windowId: createdWindow.id, firstTabId: firstTab.id };
}

async function createTabSafely({ windowId, savedTab, active, report }) {
  const createData = {
    windowId,
    url: normalizeUrlForOpen(savedTab.url),
    active: Boolean(active)
  };

  try {
    const createdTab = await chromeCall(chrome.tabs.create, createData);
    return createdTab.id;
  } catch (error) {
    report.unrestoredUrls.push({
      url: savedTab.url || "",
      title: savedTab.title || "",
      reason: getErrorMessage(error)
    });

    try {
      const fallbackTab = await chromeCall(chrome.tabs.create, {
        windowId,
        url: buildUnrestoredUrl(savedTab, getErrorMessage(error)),
        active: false
      });
      return fallbackTab.id;
    } catch (fallbackError) {
      report.warnings.push(
        `Could not create fallback tab for ${savedTab.url || "unknown URL"}: ${getErrorMessage(fallbackError)}`
      );
      return null;
    }
  }
}

async function applyTabProperties(tabId, savedTab, options) {
  const updateData = {};

  if (options.restorePinnedTabs && savedTab.pinned) {
    updateData.pinned = true;
  }

  if (options.restoreMutedTabs && savedTab.muted) {
    updateData.muted = true;
  }

  if (Object.keys(updateData).length > 0) {
    try {
      await chromeCall(chrome.tabs.update, tabId, updateData);
    } catch (error) {
      console.warn(`Could not restore tab properties for tab ${tabId}:`, error);
    }
  }
}

async function restoreTabGroups({ windowId, tabs, groups, createdTabsBySavedIndex, report }) {
  for (const group of groups) {
    if (!group || !group.groupKey) continue;

    const tabIds = [];
    for (let i = 0; i < tabs.length; i += 1) {
      if (tabs[i].groupKey === group.groupKey && createdTabsBySavedIndex.has(i)) {
        tabIds.push(createdTabsBySavedIndex.get(i));
      }
    }

    if (tabIds.length === 0) continue;

    try {
      const newGroupId = await chromeCall(chrome.tabs.group, {
        tabIds,
        createProperties: { windowId }
      });

      const updateData = {
        title: typeof group.title === "string" ? group.title : "",
        color: sanitizeGroupColor(group.color),
        collapsed: Boolean(group.collapsed)
      };

      await chromeCall(chrome.tabGroups.update, newGroupId, updateData);
      report.groupsCreated += 1;
    } catch (error) {
      report.warnings.push(
        `Could not restore tab group "${group.title || group.groupKey}": ${getErrorMessage(error)}`
      );
    }
  }
}

async function restoreActiveTab({ windowId, tabs, createdTabsBySavedIndex }) {
  const savedActiveIndex = tabs.findIndex((tab) => tab.active);
  if (savedActiveIndex < 0 || !createdTabsBySavedIndex.has(savedActiveIndex)) return;

  const tabId = createdTabsBySavedIndex.get(savedActiveIndex);
  try {
    await chromeCall(chrome.tabs.update, tabId, { active: true });
  } catch (error) {
    console.warn(`Could not restore active tab ${tabId}:`, error);
  }
}

async function restoreWindowState(savedWindow, windowId, restoreWindowGeometry, report) {
  if (!restoreWindowGeometry) return;

  const state = savedWindow.state;
  if (!["normal", "maximized", "fullscreen"].includes(state)) return;
  if (state === "normal") return;

  try {
    await chromeCall(chrome.windows.update, windowId, { state });
  } catch (error) {
    report.warnings.push(`Could not restore window state "${state}": ${getErrorMessage(error)}`);
  }
}

function sanitizeGeometry(geometry) {
  const result = {};

  // Avoid extreme off-screen or malformed values. This helps when importing on
  // another Windows 11 monitor layout or after changing display scaling.
  if (isSafeWindowCoordinate(geometry.left)) result.left = Math.round(geometry.left);
  if (isSafeWindowCoordinate(geometry.top)) result.top = Math.round(geometry.top);
  if (isSafeWindowSize(geometry.width)) result.width = Math.round(geometry.width);
  if (isSafeWindowSize(geometry.height)) result.height = Math.round(geometry.height);

  return result;
}

function isSafeWindowCoordinate(value) {
  return typeof value === "number" && Number.isFinite(value) && value > -10000 && value < 10000;
}

function isSafeWindowSize(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 150 && value <= 10000;
}

function sanitizeGroupColor(color) {
  const validColors = new Set([
    "grey",
    "blue",
    "red",
    "yellow",
    "green",
    "pink",
    "purple",
    "cyan",
    "orange"
  ]);
  return validColors.has(color) ? color : "grey";
}

function normalizeUrlForOpen(url) {
  if (typeof url !== "string" || url.trim() === "") {
    return "chrome://newtab/";
  }

  const trimmed = url.trim();

  // Common valid browser URLs. For other schemes, try them first; Chrome will
  // reject disallowed URLs, and the caller will create an explanatory fallback.
  if (/^(https?|file|chrome|chrome-extension|edge|about):/i.test(trimmed)) {
    return trimmed;
  }

  // Treat bare domains or search text safely by opening a search query instead
  // of passing malformed input to chrome.tabs.create().
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

function buildUnrestoredUrl(savedTab, reason) {
  const data = {
    url: savedTab.url || "",
    title: savedTab.title || "",
    reason: reason || "Chrome did not allow this URL to be opened by an extension."
  };
  return `${chrome.runtime.getURL("unrestored.html")}#${encodeURIComponent(JSON.stringify(data))}`;
}
