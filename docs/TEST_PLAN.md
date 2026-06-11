# Test Plan

Use this checklist before pushing to GitHub or submitting to the Chrome Web Store.

## Install locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the extension folder containing `manifest.json`.
5. Confirm the extension loads without errors.

## Export all selected by default

1. Open two or more Chrome windows.
2. Create at least one tab group in one window.
3. Click the extension icon.
4. Click Open window selector.
5. Confirm all windows are selected by default.
6. Confirm all tab groups are selected by default.
7. Click Download .json.
8. Open the file in a text editor.
9. Confirm the file contains selected windows, tabs, and groups.

## Unselect a window

1. Open the selector.
2. Unselect one window.
3. Download `.json`.
4. Confirm the file omits that window and its tabs.
5. Confirm the warning panel explains that omitted items will not be restored.

## Unselect a tab group

1. Open a window containing at least one tab group and at least one ungrouped tab.
2. Unselect one tab group.
3. Download `.json`.
4. Confirm the unselected group and its tabs are omitted.
5. Confirm ungrouped tabs in the selected window remain included.
6. Import the file.
7. Confirm only selected groups are restored.

## No selection

1. Click Select none.
2. Confirm export buttons are disabled.
3. Confirm the status panel says Not ready and gives the reason.

## Import

1. Export a selected session.
2. Open the popup.
3. Choose the exported file.
4. Click Import selected file.
5. Confirm new Chrome windows open.
6. Confirm current windows remain open.
7. Confirm tab groups are restored when possible.

## Internal URLs

1. Include a tab such as `chrome://settings` if Chrome exposes it.
2. Export and import.
3. Confirm blocked URLs produce placeholder tabs instead of breaking import.

## Windows 11 display behavior

1. Export with Save window size/position enabled.
2. Import on the same monitor layout.
3. Confirm window position/size is approximately restored.
4. Change display scaling or monitor layout, if available.
5. Import again and confirm the extension does not crash if geometry cannot be restored exactly.

## JavaScript syntax check

Optional local check if Node.js is installed:

```powershell
node --check background.js
node --check popup.js
node --check export.js
node --check unrestored.js
```
