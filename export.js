/*
 * Full-page selective export UI for Chrome Session Saver.
 *
 * v0.2.0 intentionally supports window-level and tab-group-level selection.
 * It does not expose individual tab checkboxes. For selected windows, ungrouped
 * tabs are included automatically; grouped tabs are included only when their
 * whole tab group is selected.
 */

const statusEl = document.getElementById("status");
const warningsPanel = document.getElementById("warnings");
const warningsListEl = document.getElementById("warnings-list");
const summaryEl = document.getElementById("summary");
const windowListEl = document.getElementById("window-list");
const refreshButton = document.getElementById("refresh-session");
const selectAllButton = document.getElementById("select-all");
const selectNoneButton = document.getElementById("select-none");
const downloadJsonButton = document.getElementById("download-json");
const downloadTxtButton = document.getElementById("download-txt");

let fullSession = null;
let selectionState = new Map();

refreshButton.addEventListener("click", captureAndRender);
selectAllButton.addEventListener("click", () => setAllWindowsSelected(true));
selectNoneButton.addEventListener("click", () => setAllWindowsSelected(false));
downloadJsonButton.addEventListener("click", () => exportSelectedSession("json"));
downloadTxtButton.addEventListener("click", () => exportSelectedSession("txt"));

document.getElementById("include-popup-windows").addEventListener("change", captureAndRender);
document.getElementById("include-window-geometry").addEventListener("change", captureAndRender);
document.getElementById("include-incognito").addEventListener("change", captureAndRender);

captureAndRender();

function getCheckbox(id) {
  return document.getElementById(id).checked;
}

function setBusy(isBusy) {
  refreshButton.disabled = isBusy;
  selectAllButton.disabled = isBusy;
  selectNoneButton.disabled = isBusy;
  downloadJsonButton.disabled = isBusy;
  downloadTxtButton.disabled = isBusy;
}

function clearStatus() {
  statusEl.textContent = "";
  statusEl.className = "status hidden";
}

function setStatus(message, kind = "") {
  if (!message) {
    clearStatus();
    return;
  }
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`.trim();
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      if (!response) {
        reject(new Error("No response from background service worker."));
        return;
      }
      if (!response.ok) {
        reject(new Error(response.error || "Unknown extension error."));
        return;
      }
      resolve(response);
    });
  });
}

async function captureAndRender() {
  setBusy(true);
  clearStatus();
  clearWarnings();
  summaryEl.textContent = "Loading windows...";
  windowListEl.textContent = "";

  try {
    const options = {
      includePopupWindows: getCheckbox("include-popup-windows"),
      includeWindowGeometry: getCheckbox("include-window-geometry"),
      includeIncognito: getCheckbox("include-incognito"),
      excludeOwnExtensionPages: true
    };

    const response = await sendMessage({ type: "CAPTURE_SESSION", options });
    fullSession = response.session;
    initializeSelectionState(fullSession);
    renderWindowList();
    refreshDerivedUi();
  } catch (error) {
    fullSession = null;
    selectionState = new Map();
    windowListEl.textContent = "";
    summaryEl.textContent = "No session loaded.";
    setStatus(`Not ready: Could not read current Chrome windows. ${error.message}`, "error");
    setDownloadButtonsEnabled(false);
  } finally {
    setBusy(false);
    refreshDerivedUi();
  }
}

function initializeSelectionState(session) {
  selectionState = new Map();
  for (const win of session.windows || []) {
    const windowKey = getWindowKey(win);
    selectionState.set(windowKey, {
      selected: true,
      groups: new Map((win.groups || []).map((group) => [group.groupKey, true]))
    });
  }
}

function renderWindowList() {
  windowListEl.textContent = "";

  if (!fullSession || !Array.isArray(fullSession.windows) || fullSession.windows.length === 0) {
    const empty = document.createElement("section");
    empty.className = "empty-state card";
    empty.textContent = "No accessible Chrome windows were found. Try refreshing, or allow incognito access if you are trying to export incognito windows.";
    windowListEl.appendChild(empty);
    return;
  }

  for (const [displayIndex, win] of fullSession.windows.entries()) {
    const windowKey = getWindowKey(win);
    const state = selectionState.get(windowKey);
    const tabCount = countTabs(win);
    const groupCount = countGroups(win);
    const ungroupedCount = countUngroupedTabs(win);

    const article = document.createElement("article");
    article.className = "window-card card";

    const header = document.createElement("div");
    header.className = "window-card-header";

    const label = document.createElement("label");
    label.className = "window-checkbox-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(state && state.selected);
    checkbox.dataset.windowKey = windowKey;
    checkbox.addEventListener("change", () => {
      const current = selectionState.get(windowKey);
      current.selected = checkbox.checked;
      selectionState.set(windowKey, current);
      renderWindowList();
      refreshDerivedUi();
    });

    const title = document.createElement("span");
    title.className = "window-title";
    title.textContent = buildWindowTitle(win, displayIndex, tabCount, groupCount);

    label.appendChild(checkbox);
    label.appendChild(title);
    header.appendChild(label);

    const meta = document.createElement("div");
    meta.className = "window-meta";
    meta.textContent = buildWindowMeta(win, ungroupedCount);
    header.appendChild(meta);

    article.appendChild(header);

    if (groupCount > 0) {
      const groupsSection = document.createElement("div");
      groupsSection.className = "groups-section";

      const groupIntro = document.createElement("p");
      groupIntro.className = "help small";
      groupIntro.textContent = "Grouped tabs are included only when their whole group is selected.";
      groupsSection.appendChild(groupIntro);

      for (const group of win.groups) {
        const groupState = state.groups.get(group.groupKey) !== false;
        const groupLabel = document.createElement("label");
        groupLabel.className = "group-checkbox-label";

        const groupCheckbox = document.createElement("input");
        groupCheckbox.type = "checkbox";
        groupCheckbox.checked = groupState;
        groupCheckbox.disabled = !state.selected;
        groupCheckbox.dataset.windowKey = windowKey;
        groupCheckbox.dataset.groupKey = group.groupKey;
        groupCheckbox.addEventListener("change", () => {
          const current = selectionState.get(windowKey);
          current.groups.set(group.groupKey, groupCheckbox.checked);
          selectionState.set(windowKey, current);
          refreshDerivedUi();
        });

        const groupText = document.createElement("span");
        groupText.textContent = buildGroupTitle(group);

        groupLabel.appendChild(groupCheckbox);
        groupLabel.appendChild(groupText);
        groupsSection.appendChild(groupLabel);
      }

      article.appendChild(groupsSection);
    }

    windowListEl.appendChild(article);
  }
}

function buildWindowTitle(win, displayIndex, tabCount, groupCount) {
  const parts = [`Window ${displayIndex + 1}`];
  if (win.incognito) parts.push("incognito");
  if (win.type && win.type !== "normal") parts.push(win.type);
  parts.push(`${tabCount} tab${tabCount === 1 ? "" : "s"}`);
  parts.push(`${groupCount} group${groupCount === 1 ? "" : "s"}`);
  return parts.join(" • ");
}

function buildWindowMeta(win, ungroupedCount) {
  const bits = [];
  if (ungroupedCount > 0) {
    bits.push(`${ungroupedCount} ungrouped tab${ungroupedCount === 1 ? "" : "s"} included when this window is selected`);
  } else {
    bits.push("No ungrouped tabs");
  }
  if (win.state) bits.push(`state: ${win.state}`);
  if (win.geometry && win.geometry.width && win.geometry.height) {
    bits.push(`${win.geometry.width}×${win.geometry.height}`);
  }
  return bits.join(" • ");
}

function buildGroupTitle(group) {
  const name = group.title && group.title.trim() ? group.title.trim() : "Untitled group";
  const count = group.tabCount || 0;
  const color = group.color || "grey";
  const collapsed = group.collapsed ? "collapsed" : "expanded";
  return `${name} • ${count} tab${count === 1 ? "" : "s"} • ${color} • ${collapsed}`;
}

function setAllWindowsSelected(selected) {
  for (const [windowKey, state] of selectionState.entries()) {
    state.selected = selected;
    for (const groupKey of state.groups.keys()) {
      state.groups.set(groupKey, selected);
    }
    selectionState.set(windowKey, state);
  }
  renderWindowList();
  refreshDerivedUi();
}

function refreshDerivedUi() {
  if (!fullSession) {
    setDownloadButtonsEnabled(false);
    return;
  }

  const selectedSession = buildSelectedSession();
  const counts = countSession(selectedSession);
  const warnings = buildWarnings(selectedSession);

  summaryEl.textContent = `${counts.windows} selected window(s), ${counts.tabs} tab(s), ${counts.groups} tab group(s).`;
  renderWarnings(warnings);

  if (counts.tabs === 0) {
    setStatus("Not ready: Select at least one window containing at least one tab before exporting.", "warning");
    setDownloadButtonsEnabled(false);
  } else {
    clearStatus();
    setDownloadButtonsEnabled(true);
  }
}

function setDownloadButtonsEnabled(enabled) {
  downloadJsonButton.disabled = !enabled;
  downloadTxtButton.disabled = !enabled;
}

function buildSelectedSession() {
  if (!fullSession) return null;

  const selectedWindows = [];
  const omitted = {
    windows: 0,
    groups: 0,
    tabs: 0,
    emptySelectedWindows: 0
  };

  for (const win of fullSession.windows || []) {
    const windowKey = getWindowKey(win);
    const state = selectionState.get(windowKey);
    if (!state || !state.selected) {
      omitted.windows += 1;
      omitted.tabs += countTabs(win);
      omitted.groups += countGroups(win);
      continue;
    }

    const selectedGroupKeys = new Set();
    for (const group of win.groups || []) {
      if (state.groups.get(group.groupKey) !== false) {
        selectedGroupKeys.add(group.groupKey);
      } else {
        omitted.groups += 1;
      }
    }

    const selectedTabs = [];
    for (const tab of win.tabs || []) {
      if (!tab.groupKey || selectedGroupKeys.has(tab.groupKey)) {
        selectedTabs.push({ ...tab });
      } else {
        omitted.tabs += 1;
      }
    }

    if (selectedTabs.length === 0) {
      omitted.emptySelectedWindows += 1;
      continue;
    }

    ensureExactlyOneActiveTab(selectedTabs);

    const selectedGroups = (win.groups || [])
      .filter((group) => selectedGroupKeys.has(group.groupKey))
      .filter((group) => selectedTabs.some((tab) => tab.groupKey === group.groupKey))
      .map((group) => ({
        ...group,
        tabCount: selectedTabs.filter((tab) => tab.groupKey === group.groupKey).length
      }));

    selectedWindows.push({
      ...win,
      tabs: selectedTabs,
      groups: selectedGroups
    });
  }

  ensureAtLeastOneFocusedWindow(selectedWindows);

  const selectedSession = {
    ...fullSession,
    exportedBy: {
      ...(fullSession.exportedBy || {}),
      name: "Chrome Session Saver",
      version: "0.2.0",
      manifestVersion: 3
    },
    savedAt: new Date().toISOString(),
    suggestedFilenameBase: `chrome-session-selected-${nowForFilename()}`,
    selection: {
      mode: "selected-windows-and-tab-groups",
      individualTabsSelectable: false,
      ungroupedTabsBehavior: "Ungrouped tabs are included automatically when their window is selected.",
      omitted
    },
    windows: selectedWindows
  };

  selectedSession.warnings = buildWarnings(selectedSession);
  return selectedSession;
}

function ensureExactlyOneActiveTab(tabs) {
  const activeTabs = tabs.filter((tab) => tab.active);
  if (activeTabs.length === 1) return;
  for (const tab of tabs) tab.active = false;
  if (tabs.length > 0) tabs[0].active = true;
}

function ensureAtLeastOneFocusedWindow(windows) {
  if (windows.length === 0) return;
  if (windows.some((win) => win.focused)) return;
  windows[0].focused = true;
}

function buildWarnings(session) {
  if (!session) return [];

  const warnings = [];
  const counts = countSession(session);
  const originalCounts = countSession(fullSession);
  const omitted = session.selection && session.selection.omitted ? session.selection.omitted : {};

  if (counts.tabs === 0) {
    warnings.push("No tabs are currently selected. Export is disabled until at least one selected window contains at least one tab.");
  }

  if ((omitted.windows || 0) > 0 || (omitted.groups || 0) > 0 || (omitted.tabs || 0) > 0) {
    warnings.push(
      `This export is selective. It omits ${omitted.windows || 0} window(s), ${omitted.groups || 0} tab group(s), and ${omitted.tabs || 0} tab(s); omitted items will not be restored on import.`
    );
  }

  if ((omitted.emptySelectedWindows || 0) > 0) {
    warnings.push(`${omitted.emptySelectedWindows} selected window(s) became empty after group filtering and will not be written to the file.`);
  }

  const selectedProblemUrls = collectPotentiallyUnrestorableUrls(session);
  if (selectedProblemUrls.internal > 0) {
    warnings.push(`${selectedProblemUrls.internal} selected tab(s) use internal browser or extension URLs that Chrome may not allow this extension to reopen directly. Import will create placeholder tabs for URLs Chrome rejects.`);
  }
  if (selectedProblemUrls.file > 0) {
    warnings.push(`${selectedProblemUrls.file} selected tab(s) use file:// URLs. Restoring local files may require enabling file URL access for the extension.`);
  }

  const incognitoWindows = session.windows.filter((win) => win.incognito).length;
  if (incognitoWindows > 0) {
    warnings.push(`${incognitoWindows} selected incognito window(s) are included. Importing them as incognito requires this extension to be allowed in incognito mode and the import option to be enabled.`);
  }

  const popupWindows = session.windows.filter((win) => win.type === "popup").length;
  if (popupWindows > 0) {
    warnings.push(`${popupWindows} selected popup window(s) are included. Chrome may restore popup dimensions/placement differently from the original.`);
  }

  if (session.captureOptions && session.captureOptions.includeWindowGeometry) {
    warnings.push("Window size and position are saved, but restoration can vary on Windows 11 if monitors, display scaling, or virtual desktops have changed.");
  }

  if (originalCounts.tabs > 0 && counts.tabs < originalCounts.tabs) {
    warnings.push("Only the selected subset is written to this file. There is no hidden copy of omitted tabs in the exported JSON/TXT.");
  }

  return uniqueStrings(warnings);
}

function collectPotentiallyUnrestorableUrls(session) {
  const result = { internal: 0, file: 0 };
  for (const win of session.windows || []) {
    for (const tab of win.tabs || []) {
      const url = String(tab.url || tab.pendingUrl || "");
      if (/^file:/i.test(url)) {
        result.file += 1;
      } else if (/^(chrome|chrome-extension|edge|about):/i.test(url)) {
        result.internal += 1;
      }
    }
  }
  return result;
}

function renderWarnings(warnings) {
  clearWarnings();
  if (!warnings || warnings.length === 0) return;

  for (const warning of warnings) {
    const li = document.createElement("li");
    li.textContent = warning;
    warningsListEl.appendChild(li);
  }
  warningsPanel.classList.remove("hidden");
}

function clearWarnings() {
  warningsListEl.textContent = "";
  warningsPanel.classList.add("hidden");
}

async function exportSelectedSession(extension) {
  if (!fullSession) {
    setStatus("Not ready: No captured session is available. Refresh the window list first.", "warning");
    return;
  }

  const selectedSession = buildSelectedSession();
  const counts = countSession(selectedSession);
  if (counts.tabs === 0) {
    setStatus("Not ready: Select at least one window containing at least one tab before exporting.", "warning");
    return;
  }

  try {
    const json = JSON.stringify(selectedSession, null, 2);
    const filenameBase = selectedSession.suggestedFilenameBase || "chrome-session-selected";
    const filename = `${filenameBase}.${extension}`;
    downloadTextFile(filename, json, "application/json;charset=utf-8");
    setStatus(
      `Downloaded ${filename}\nSaved ${counts.windows} window(s), ${counts.tabs} tab(s), and ${counts.groups} tab group(s).`,
      "success"
    );
  } catch (error) {
    setStatus(`Export failed: ${error.message}`, "error");
  }
}

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Let Chrome start the download before revoking the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function countSession(session) {
  if (!session || !Array.isArray(session.windows)) return { windows: 0, tabs: 0, groups: 0 };
  return {
    windows: session.windows.length,
    tabs: session.windows.reduce((sum, win) => sum + countTabs(win), 0),
    groups: session.windows.reduce((sum, win) => sum + countGroups(win), 0)
  };
}

function countTabs(win) {
  return Array.isArray(win.tabs) ? win.tabs.length : 0;
}

function countGroups(win) {
  return Array.isArray(win.groups) ? win.groups.length : 0;
}

function countUngroupedTabs(win) {
  return (win.tabs || []).filter((tab) => !tab.groupKey).length;
}

function getWindowKey(win) {
  return `window-${win.savedWindowIndex}`;
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

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}
