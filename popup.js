/*
 * Popup UI for Chrome Session Saver.
 *
 * The popup keeps the fast path fast: users can immediately download the full
 * current session. Selective export still opens a full extension page because
 * real browser sessions can contain many windows and tab groups.
 */

const statusEl = document.getElementById("status");
const downloadFullJsonButton = document.getElementById("download-full-json");
const downloadFullTxtButton = document.getElementById("download-full-txt");
const openSelectorButton = document.getElementById("open-selector");
const importButton = document.getElementById("import-session");
const sessionFileInput = document.getElementById("session-file");

downloadFullJsonButton.addEventListener("click", () => exportFullSession("json"));
downloadFullTxtButton.addEventListener("click", () => exportFullSession("txt"));
openSelectorButton.addEventListener("click", openSelectorPage);
importButton.addEventListener("click", importSelectedSession);

function getCheckbox(id) {
  return document.getElementById(id).checked;
}

function setBusy(isBusy) {
  downloadFullJsonButton.disabled = isBusy;
  downloadFullTxtButton.disabled = isBusy;
  openSelectorButton.disabled = isBusy;
  importButton.disabled = isBusy;
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

async function exportFullSession(extension) {
  setBusy(true);
  clearStatus();

  try {
    const response = await sendMessage({
      type: "CAPTURE_SESSION",
      options: {
        includePopupWindows: true,
        includeWindowGeometry: true,
        includeIncognito: false,
        excludeOwnExtensionPages: true
      }
    });

    const session = response.session;
    const counts = countSession(session);

    if (counts.tabs === 0) {
      setStatus("Not ready: No accessible Chrome tabs were found to export.", "warning");
      return;
    }

    const json = JSON.stringify(session, null, 2);
    const filenameBase = session.suggestedFilenameBase || `chrome-session-${nowForFilename()}`;
    const filename = `${filenameBase}.${extension}`;
    downloadTextFile(filename, json, "application/json;charset=utf-8");

    let message = `Downloaded ${filename}\nSaved ${counts.windows} window(s), ${counts.tabs} tab(s), and ${counts.groups} tab group(s).`;
    if (Array.isArray(session.warnings) && session.warnings.length > 0) {
      message += `\n\nWarnings saved in file:\n- ${session.warnings.slice(0, 3).join("\n- ")}`;
      if (session.warnings.length > 3) {
        message += `\n- ...and ${session.warnings.length - 3} more.`;
      }
    }

    setStatus(message, session.warnings && session.warnings.length ? "warning" : "success");
  } catch (error) {
    setStatus(`Export failed: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function openSelectorPage() {
  setBusy(true);
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL("export.html"), active: true });
    window.close();
  } catch (error) {
    setStatus(`Not ready: Could not open selector page. ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function importSelectedSession() {
  const file = sessionFileInput.files && sessionFileInput.files[0];
  if (!file) {
    setStatus("Not ready: Choose a sessions.json or sessions.txt file first.", "warning");
    return;
  }

  setBusy(true);
  setStatus(`Reading ${file.name}...`, "info");

  try {
    const text = await file.text();
    const session = JSON.parse(text);

    const options = {
      restoreWindowGeometry: getCheckbox("restore-window-geometry"),
      restoreGroups: getCheckbox("restore-groups"),
      restorePinnedTabs: getCheckbox("restore-pinned-tabs"),
      restoreMutedTabs: getCheckbox("restore-muted-tabs"),
      focusFirstRestoredWindow: getCheckbox("focus-first-restored-window"),
      allowIncognitoRestore: getCheckbox("allow-incognito-restore")
    };

    setStatus("Importing session into new Chrome windows...", "info");
    const response = await sendMessage({ type: "IMPORT_SESSION", session, options });
    const report = response.result;

    let message =
      `Import complete.\n` +
      `Created ${report.windowsCreated}/${report.windowsRequested} window(s), ` +
      `${report.tabsCreated}/${report.tabsRequested} tab(s), and ` +
      `${report.groupsCreated}/${report.groupsRequested} group(s).`;

    if (report.unrestoredUrls.length > 0) {
      message += `\n\n${report.unrestoredUrls.length} URL(s) could not be opened directly. ` +
        `They were replaced with explanatory placeholder tabs.`;
    }

    if (report.warnings.length > 0) {
      message += `\n\nWarnings:\n- ${report.warnings.slice(0, 5).join("\n- ")}`;
      if (report.warnings.length > 5) {
        message += `\n- ...and ${report.warnings.length - 5} more.`;
      }
    }

    setStatus(message, report.warnings.length || report.unrestoredUrls.length ? "warning" : "success");
  } catch (error) {
    const hint = error instanceof SyntaxError
      ? " The file must contain JSON, even if its filename ends in .txt."
      : "";
    setStatus(`Import failed: ${error.message}.${hint}`, "error");
  } finally {
    setBusy(false);
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
    tabs: session.windows.reduce((sum, win) => sum + (Array.isArray(win.tabs) ? win.tabs.length : 0), 0),
    groups: session.windows.reduce((sum, win) => sum + (Array.isArray(win.groups) ? win.groups.length : 0), 0)
  };
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
