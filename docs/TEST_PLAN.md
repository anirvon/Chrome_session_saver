# Test plan

Use this checklist before trusting the extension with real sessions or submitting to the Chrome Web Store.

## Local load test

- [ ] Open `chrome://extensions`.
- [ ] Enable Developer mode.
- [ ] Load the unpacked `session-txt-saver` folder.
- [ ] Confirm no manifest errors appear.
- [ ] Open the popup.
- [ ] Confirm popup UI loads without console errors.

## Export tests

- [ ] Export one normal window with 2-3 normal tabs.
- [ ] Export two or more normal windows.
- [ ] Export a window containing a pinned tab.
- [ ] Export a window containing a muted tab.
- [ ] Export a window containing one tab group.
- [ ] Export a window containing multiple tab groups.
- [ ] Export as `.json`.
- [ ] Export as `.txt`.
- [ ] Open the exported file in a text editor and confirm it is valid JSON.

## Import tests

- [ ] Import the exported `.json` file.
- [ ] Import the exported `.txt` file.
- [ ] Confirm new windows are created.
- [ ] Confirm current windows were not closed.
- [ ] Confirm tab order is reasonable.
- [ ] Confirm tab groups are restored.
- [ ] Confirm group title/color/collapsed state is restored.
- [ ] Confirm pinned tabs are restored when the checkbox is enabled.
- [ ] Confirm muted tabs are restored when the checkbox is enabled.
- [ ] Confirm active tab restoration works.

## Error handling tests

- [ ] Try importing a non-JSON `.txt` file.
- [ ] Try importing an empty file.
- [ ] Try importing a JSON object without `windows`.
- [ ] Save and restore a `chrome://settings` or `chrome://extensions` page and confirm a placeholder tab appears if Chrome blocks it.

## Windows 11-specific tests

- [ ] Export/import on a single monitor.
- [ ] Export/import on multiple monitors.
- [ ] Export/import after changing Windows display scaling.
- [ ] Export/import after disconnecting an external monitor.
- [ ] Verify restored windows do not appear completely off-screen.

## Incognito tests

- [ ] Confirm incognito windows are not captured by default.
- [ ] Enable the extension in incognito mode.
- [ ] Export with the incognito checkbox enabled.
- [ ] Import with the incognito restore checkbox enabled.
- [ ] Confirm behavior is acceptable if Chrome denies incognito restore.
