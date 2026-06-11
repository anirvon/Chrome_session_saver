# Chrome Session Saver

Chrome Session Saver is a Manifest V3 Chrome extension that exports and imports open Chrome windows, tabs, and tab groups using local `sessions.json` or `sessions.txt` files.

Version `0.2.0` adds a full-page selective export interface. You can choose whole windows and, where present, whole tab groups. Individual tabs are intentionally not exposed as checkboxes in this version.

## Features

- Export selected Chrome windows to a local `.json` or `.txt` file.
- Select or unselect whole windows before exporting.
- Select or unselect whole Chrome tab groups inside selected windows.
- Include ungrouped tabs automatically when their window is selected.
- Preserve tab order, tab URLs, titles, pinned state, active tab state, muted state, window type, optional window geometry, and tab group metadata.
- Import a saved session into new Chrome windows without closing or overwriting current windows.
- Restore tab group title, color, and collapsed state when possible.
- Show warnings before export when selected URLs or browser limitations may affect import.
- Use local files only; no account, no server, no sync, no analytics, and no remote code.

## Permissions

The extension requests only:

```json
[
  "tabs",
  "tabGroups"
]
```

### `tabs`

Required to read open tab URLs, titles, order, pinned state, active state, and muted state so the extension can export and later restore the user's selected browser session.

### `tabGroups`

Required to read and restore Chrome tab group metadata, including group membership, group title, group color, and collapsed state.

The extension does not request host permissions and does not inject scripts into webpages.

## Local testing

1. Download or clone this repository.
2. Open Chrome.
3. Go to `chrome://extensions`.
4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Select the repository folder containing `manifest.json`.
7. Pin **Chrome Session Saver** to the toolbar.
8. Click the extension icon.
9. Click **Open window selector**.
10. Select the windows and tab groups you want to save.
11. Click **Download .json** or **Download .txt**.
12. To test import, click the extension icon again, choose the exported file, and click **Import selected file**.

## Creating a Chrome Web Store ZIP

The Chrome Web Store upload ZIP must contain `manifest.json` at the root of the ZIP, not inside an extra parent folder.

From PowerShell on Windows 11, run this from inside the extension folder:

```powershell
Compress-Archive -Path * -DestinationPath ..\chrome-session-saver-0.2.0-webstore.zip -Force
```

Check the ZIP root:

```powershell
tar -tf ..\chrome-session-saver-0.2.0-webstore.zip | Select-Object -First 20
```

The first files should look like:

```text
manifest.json
background.js
popup.html
popup.js
export.html
export.js
styles.css
...
```

## Selective export behavior

The full-page selector works at two levels:

1. **Window selection** — selecting a window includes its ungrouped tabs and any selected groups inside that window.
2. **Tab group selection** — selecting a tab group includes all tabs in that group. Unselecting a group omits all tabs in that group.

Individual tab selection is not part of version `0.2.0`.

The extension automatically excludes its own extension pages, such as the export page, so those pages are not accidentally written into the session file.

## Import behavior

Import always opens saved sessions in new Chrome windows. It never closes or overwrites existing windows.

Some URLs may not be restorable directly by a Chrome extension. Examples include some `chrome://`, `chrome-extension://`, `edge://`, `about:`, and `file://` URLs. When Chrome blocks a URL, the extension creates an explanatory placeholder tab containing the original URL so the user can copy it manually.

## File format

The extension saves JSON data. Files may be named `.json` or `.txt`; both contain the same JSON structure.

The exported file includes:

- schema and schema version
- export timestamp
- selected windows
- selected tabs
- selected tab groups
- limitations and warnings
- selection metadata describing omitted windows/groups/tabs

## Privacy

Session files can contain sensitive browsing information, including tab URLs and page titles. Treat exported files as private.

The extension does not transmit exported data. Everything stays local to the user's browser and downloaded files.

See [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) for the full policy draft.

## Version history

### 0.2.0

- Renamed extension to **Chrome Session Saver**.
- Added a full-page selective export UI.
- Added window-level and tab-group-level export selection.
- Added export/import warnings.
- Removed the default "Ready" status panel from the popup.
- Kept permissions unchanged: `tabs` and `tabGroups` only.

### 0.1.0

- Initial local export/import prototype.
