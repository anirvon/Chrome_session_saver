/*
 * Popup UI for Session TXT/JSON Saver.
 *
 * The popup only handles user interaction and local file reading/downloading.
 * Chrome session capture/import work is delegated to background.js.
 */

const statusEl = document.getElementById("status");
const exportJsonButton = document.getElementById("export-json");
const exportTxtButton = document.getElementById("export-txt");
const importButton = document.getElementById("import-session");
const sessionFileInput = document.getElementById("session-file");

exportJsonButton.addEventListener("click", () => exportSession("json"));
exportTxtButton.addEventListener("click", () => exportSession("txt"));
importButton.addEventListener("click", importSelectedSession);

function getCheckbox(id) {
  return document.getElementById(id).checked;
}

function setBusy(isBusy) {
  exportJsonButton.disabled = isBusy;
  exportTxtButton.disabled = isBusy;
  importButton.disabled = isBusy;
}

function setStatus(message, kind = "") {
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

async function exportSession(extension) {
  setBusy(true);
  setStatus("Capturing current Chrome windows and tabs...");

  try {
    const options = {
      includePopupWindows: getCheckbox("include-popup-windows"),
      includeWindowGeometry: getCheckbox("include-window-geometry"),
      includeIncognito: getCheckbox("include-incognito")
    };

    const response = await sendMessage({ type: "CAPTURE_SESSION", options });
    const session = response.session;
    const json = JSON.stringify(session, null, 2);
    const filenameBase = session.suggestedFilenameBase || "sessions";
    const filename = `${filenameBase}.${extension}`;

    downloadTextFile(filename, json, "application/json;charset=utf-8");

    const windowCount = session.windows.length;
    const tabCount = session.windows.reduce((sum, win) => sum + (win.tabs ? win.tabs.length : 0), 0);
    const groupCount = session.windows.reduce((sum, win) => sum + (win.groups ? win.groups.length : 0), 0);

    setStatus(
      `Downloaded ${filename}\nSaved ${windowCount} window(s), ${tabCount} tab(s), and ${groupCount} tab group(s).`,
      "success"
    );
  } catch (error) {
    setStatus(`Export failed: ${error.message}`, "error");
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

async function importSelectedSession() {
  const file = sessionFileInput.files && sessionFileInput.files[0];
  if (!file) {
    setStatus("Choose a sessions.json or sessions.txt file first.", "warning");
    return;
  }

  setBusy(true);
  setStatus(`Reading ${file.name}...`);

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

    setStatus("Importing session into new Chrome windows...");
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
