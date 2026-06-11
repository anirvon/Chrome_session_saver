/*
 * Popup UI for Chrome Session Saver.
 *
 * The popup stays intentionally compact. Export selection happens on a full
 * extension page because real browser sessions can contain many windows and
 * tab groups. Import still works directly from the popup.
 */

const statusEl = document.getElementById("status");
const openSelectorButton = document.getElementById("open-selector");
const importButton = document.getElementById("import-session");
const sessionFileInput = document.getElementById("session-file");

openSelectorButton.addEventListener("click", openSelectorPage);
importButton.addEventListener("click", importSelectedSession);

function getCheckbox(id) {
  return document.getElementById(id).checked;
}

function setBusy(isBusy) {
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
