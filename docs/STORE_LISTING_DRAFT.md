# Chrome Web Store listing draft

## Name

Session TXT/JSON Saver

## Short description

Save and restore Chrome windows, tabs, and tab groups using a local sessions.json or sessions.txt file.

## Detailed description

Session TXT/JSON Saver is a simple local session manager for Chrome.

Use it to export your currently open Chrome windows, tabs, and tab groups to a local `sessions.json` or `sessions.txt` file. Later, import that file to reopen the saved session in new Chrome windows.

Features:

- Export all accessible normal Chrome windows.
- Preserve tab order within each window.
- Preserve Chrome tab groups, including group title, color, and collapsed state.
- Preserve pinned tabs, active tabs, muted tabs, and optional window size/position.
- Import saved sessions into new windows without closing your current tabs.
- Uses local files only.
- No account, no sync service, no analytics, no cloud upload.

Important privacy note: exported session files contain tab URLs and tab titles. Treat them like browsing-history data and store them privately.

Known limitations:

- Some internal browser pages such as `chrome://settings` cannot be reopened directly by extensions. If Chrome blocks a URL, the extension opens a placeholder tab showing the original URL.
- Incognito windows are only available if the user explicitly enables the extension in incognito mode.
- Chrome does not expose custom user-assigned window names through the standard extension API, so custom window names cannot be saved or restored.

## Single purpose field

This extension exports the user's currently open Chrome windows, tabs, and tab groups to a local session file and imports that local file to reopen the saved session in new Chrome windows.

## Permission justification field draft

### tabs

Required to read open tab URLs and titles for the exported session file and to create/update tabs when importing a saved session.

### tabGroups

Required to read and restore Chrome tab groups, including group title, color, and collapsed state.

## Data use disclosure draft

This extension handles tab URLs, tab titles, tab order, window metadata, and tab group metadata only for the purpose of exporting/importing a local session file. The extension does not transmit data to external servers, does not use analytics, does not sell data, and does not share data with third parties.
