# Chrome Web Store notes

These notes are for preparing this local prototype for eventual Chrome Web Store submission.

## Extension single purpose

Suggested single-purpose statement:

> Session TXT/JSON Saver lets users export their currently open Chrome windows, tabs, and tab groups to a local session file, and later import that local file into new Chrome windows.

Keep this single purpose visible in the store listing and the popup UI.

## Permissions justification

Current manifest permissions:

```json
"permissions": ["tabs", "tabGroups"]
```

### `tabs`

Needed because the extension must read the user's open tab URLs and titles in order to write them to the local session file. It also uses tab APIs to create, activate, pin, and mute restored tabs during import.

### `tabGroups`

Needed to read and restore Chrome tab groups, including group title, color, and collapsed state.

## Permissions deliberately not requested

- No `host_permissions` such as `<all_urls>`.
- No `downloads` permission. Downloads are created from the popup using a user-initiated local Blob download.
- No `storage` permission. The extension does not store session data internally.
- No `history` permission.
- No `bookmarks` permission.
- No `cookies` permission.
- No network permissions.

## Data handling summary

The extension handles browsing data only for the user-facing purpose of exporting/importing a local session file.

Data handled:

- Tab URLs.
- Tab titles.
- Window layout metadata.
- Tab group titles, colors, and collapsed state.
- Pinned/active/muted state.

Data not handled:

- Page contents.
- Cookies.
- Passwords.
- Form data.
- Browsing history beyond currently open tabs.
- Analytics or telemetry.

Data sharing:

- No data is uploaded.
- No data is sold.
- No third parties receive data.
- The user controls the exported file.

## Privacy policy requirement

Because this extension handles user browsing data, prepare a public privacy policy URL before submission. A draft is provided in `PRIVACY_POLICY_DRAFT.md`. Edit it for your real developer name, contact address, and hosting location.

## Suggested store category

Productivity.

## Suggested screenshots

1. Popup export controls.
2. Popup import controls.
3. Example downloaded `sessions.json` file opened in a text editor.
4. Restored Chrome window with tab groups.
5. Placeholder page for a non-restorable internal URL.

## Manual pre-submission checklist

- [ ] Load unpacked extension in a clean Chrome profile.
- [ ] Export one window with ungrouped tabs.
- [ ] Export multiple windows.
- [ ] Export grouped tabs.
- [ ] Export pinned tabs.
- [ ] Import the exported `.json` file.
- [ ] Import the exported `.txt` file.
- [ ] Verify import opens new windows and does not close current windows.
- [ ] Verify bad/malformed JSON shows a friendly error.
- [ ] Verify a `chrome://settings` or `chrome://extensions` saved URL becomes a placeholder tab if Chrome blocks direct restore.
- [ ] Verify no remote scripts, analytics, or network calls exist.
- [ ] Update version number in `manifest.json`.
- [ ] Create final icons and screenshots.
- [ ] Host privacy policy publicly.
- [ ] Fill out the Chrome Web Store data-use certification accurately.

## Store package note

For a real Web Store upload, create a `.zip` containing the extension files. You may include documentation files, but many developers upload only the files needed to run the extension. Do not include unrelated local test data or private session files.
