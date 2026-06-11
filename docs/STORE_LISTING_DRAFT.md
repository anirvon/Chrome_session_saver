# Chrome Web Store Listing Draft

## Name

Chrome Session Saver

## Short description

Export and import selected Chrome windows, tabs, and tab groups using local session files.

## Detailed description

Chrome Session Saver helps you save and restore Chrome browsing sessions using local `sessions.json` or `sessions.txt` files.

Download the full current Chrome session directly from the popup, or use the full-page selector to choose which Chrome windows to export. The selector shows windows and tab groups by default, and each window row has a + button that expands the row to show individual tabs for finer selection.

Features:

- Export selected Chrome windows to a local `.json` or `.txt` file
- Select or unselect whole windows before export
- Select or unselect whole tab groups inside selected windows
- Expand a window row with the + button to select or unselect individual tabs
- Preserve tab order, tab URLs, tab titles, pinned state, active tab state, muted state, window type, optional window geometry, and tab group metadata
- Restore saved sessions into new Chrome windows without closing current windows
- Restore tab group title, color, and collapsed state when possible
- Show warnings for browser limitations that may affect import
- Work locally with no account, no cloud sync, no analytics, and no external server

Privacy summary:

Chrome Session Saver reads open tab URLs and titles only to provide the user-facing export and import features. Exported session files are created only when the user chooses to download them. Session data is not uploaded, transmitted, sold, shared, or used for advertising or analytics.

## Category

Productivity

## Suggested screenshots

1. Popup showing direct full-session download, the Open window selector button, and import controls.
2. Full-page selector with multiple windows and tab groups.
3. Expanded window row showing individual tab checkboxes.
4. Warning panel showing export/import limitations.
5. Import result showing restored window/tab/group counts.

## Single purpose statement

Chrome Session Saver lets users export selected Chrome windows, tab groups, and tabs to a local session file and later import that file to restore the saved windows, tabs, and tab groups.

## Permission justification

### tabs

Required to read open tab URLs, titles, tab order, pinned state, active state, and muted state so the extension can export and later restore the user's selected browser session.

### tabGroups

Required to read and restore Chrome tab group metadata, including group membership, title, color, and collapsed state.

## Reviewer notes

To test:

1. Install the extension.
2. Open several normal Chrome windows with several tabs.
3. Create at least one Chrome tab group.
4. Click the extension icon.
5. Click **Open window selector**.
6. Select or unselect windows and tab groups.
7. Click the **+** button on a window row and select or unselect individual tabs.
8. Click **Download .json**.
9. Open the extension popup again.
10. Choose the downloaded file.
11. Click **Import selected file**.
12. Confirm that new Chrome windows/tabs open and selected tab groups are restored.

The extension does not require login, accounts, payment, network access, or external services. It does not transmit session data.
