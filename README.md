# Session TXT/JSON Saver

A small, dependency-free Chrome extension that exports and imports your open Chrome windows, tabs, and tab groups using a local `sessions.json` or `sessions.txt` file.

This is a first working local prototype. It is designed to be loaded as an unpacked extension during development and later polished for the Chrome Web Store.

## What it does

- Exports accessible open Chrome windows and tabs.
- Preserves window grouping by Chrome window.
- Preserves tab order within each window.
- Preserves Chrome tab groups, including group title, color, and collapsed state.
- Preserves pinned tabs, active tabs, muted tabs, and basic window size/position where Chrome allows it.
- Imports a saved session into new Chrome windows.
- Does **not** close or overwrite your current windows during import.
- Does **not** upload session files anywhere.
- Does **not** use a server, cloud account, analytics, or external JavaScript.

## Important privacy note

The exported file contains your tab URLs and tab titles. Treat `sessions.json` or `sessions.txt` like browsing-history data. Store it somewhere private.

## Requirements

- Google Chrome on desktop.
- Chrome 89 or newer for the `chrome.tabGroups` API.
- Tested structurally as a Manifest V3 extension. It should work on Windows 11, macOS, and Linux because it uses Chrome APIs rather than operating-system-specific paths.

## Install locally on Windows 11

1. Download and unzip this project.
2. Open Chrome.
3. Go to:

   ```text
   chrome://extensions
   ```

4. Turn on **Developer mode** in the top-right corner.
5. Click **Load unpacked**.
6. Select the unzipped `session-txt-saver` folder. Select the folder itself, not the `.zip` file.
7. Pin the extension to your toolbar if desired.
8. Click the extension icon and test **Download .json** or **Download .txt**.

## How to export a session

1. Open the Chrome windows and tabs you want to save.
2. Click the Session Saver extension icon.
3. Choose export options.
4. Click **Download .json** or **Download .txt**.
5. Chrome will download a file like:

   ```text
   sessions-20260604-153012.json
   ```

The `.txt` file contains the same JSON data as the `.json` file. The `.txt` option is included because you asked for a `sessions.txt` workflow.

## How to import a session

1. Click the Session Saver extension icon.
2. Choose a saved `sessions.json` or `sessions.txt` file.
3. Choose restore options.
4. Click **Import selected file**.
5. The extension opens the saved session in new Chrome windows.

Your existing windows are not closed or replaced.

## Known limitations

Chrome intentionally restricts what extensions can do. These limitations are expected:

- Some `chrome://...` pages, extension pages, and browser-internal pages may not be restorable by an extension. When that happens, the extension opens a local placeholder page showing the original URL.
- Incognito windows are only visible to the extension if you explicitly enable the extension in incognito mode from `chrome://extensions`. Importing incognito windows also requires the import checkbox and Chrome permission.
- Chrome's extension API does not expose user-assigned Chrome window names, so this extension cannot save or restore custom window names.
- If you import on a different monitor layout, saved window positions may not match perfectly. The code sanitizes extreme coordinates to behave better on Windows 11 multi-monitor setups.
- Tab favicons are not restored; Chrome reloads them normally when each page loads.
- This first version does not sync, auto-save, schedule backups, or use a native companion program.

## File format

The file is JSON, even when saved as `.txt`. The root object contains:

- `schema`
- `schemaVersion`
- `savedAt`
- `windows[]`
- each window's `tabs[]`
- each window's `groups[]`

See `docs/sample-session.json` for a small example.

## Project structure

```text
session-txt-saver/
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── styles.css
├── unrestored.html
├── unrestored.js
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── docs/
    ├── CHROME_STORE_NOTES.md
    ├── PRIVACY_POLICY_DRAFT.md
    ├── STORE_LISTING_DRAFT.md
    ├── TEST_PLAN.md
    └── sample-session.json
```

## Development notes

This extension has no build step. After editing files:

1. Go to `chrome://extensions`.
2. Click the reload icon on the Session Saver card.
3. Reopen the popup.

To debug:

- Right-click the popup and choose **Inspect**.
- Go to `chrome://extensions`, find the extension, and inspect the service worker for background errors.

## Permissions used

```json
"permissions": ["tabs", "tabGroups"]
```

Why:

- `tabs`: needed to read tab URLs/titles and to create/update tabs during import.
- `tabGroups`: needed to read and restore Chrome tab group titles, colors, and collapsed state.

No host permissions are requested. No downloads permission is requested; the popup uses a local `Blob` download initiated by the user's click.
