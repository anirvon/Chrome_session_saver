# Changelog

All notable changes to **Chrome Session Saver** are documented in this file.

This project loosely follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) style and uses semantic versioning for extension releases.

## [0.2.1] - 2026-06-10

### Added

- Restored fast, direct full-session export actions in the popup:
  - **Download full session .json**
  - **Download full session .txt**
- Kept the full-page selector available from the popup through **Open window selector**.
- Added a per-window **+** expand/collapse control in the full-page selector.
- Added expanded per-window detail view showing:
  - ungrouped tabs
  - tab groups
  - individual tabs inside each window/group
- Added individual tab selection inside the expanded window view.
- Added partial-selection behavior for window checkboxes:
  - checked = all tabs in that window are selected
  - unchecked = no tabs in that window are selected
  - indeterminate = some tabs in that window are selected
- Added partial-selection behavior for tab-group checkboxes:
  - checked = all tabs in that group are selected
  - unchecked = no tabs in that group are selected
  - indeterminate = some tabs in that group are selected
- Added export warnings for partially selected tab groups, so users know that the restored group will contain only the selected tabs.
- Added import-risk warnings to direct full-session exports, not only selective exports.

### Changed

- The popup now supports both common workflows:
  - immediate full-session export
  - detailed selective export through the full-page selector
- Selective export now supports window-level, group-level, and optional individual-tab-level selection while keeping the default view compact.
- Partial tab groups are exported and restored as groups containing only the selected tabs.
- Documentation and test instructions were updated to cover direct export, expanded tab selection, partial window selection, and partial group selection.

### Fixed

- Reintroduced the direct full-session download workflow that was unintentionally missing from the initial v0.2.0 selector-focused interface.
- Improved status behavior so the status panel remains hidden by default and appears only for success, warning, error, or not-ready states.

### Permissions

- No new Chrome permissions were added.
- The extension still uses only:
  - `tabs`
  - `tabGroups`

## [0.2.0] - 2026-06-10

### Added

- Renamed the extension from **Session TXT Saver** to **Chrome Session Saver**.
- Added a full-page export selector (`export.html` / `export.js`) instead of relying only on the compact popup.
- Added window-level selective export.
- Added tab-group-level selective export.
- Selected all windows by default so the user can start from a complete session and unselect/reselect as needed.
- Preserved Chrome tab group metadata for selected windows and selected groups, including:
  - group title
  - group color
  - collapsed state
  - group membership
- Added export-time warnings for cases that may not restore perfectly, including:
  - omitted windows
  - omitted tab groups
  - omitted tabs
  - internal Chrome URLs that may not reopen normally
  - `file://` URLs that may not reopen depending on browser settings and local file availability
  - incognito windows
  - popup windows
  - possible window geometry differences after import, especially on Windows 11 or after display changes
- Added updated Chrome Web Store documentation for the selective export feature.
- Added updated test-plan coverage for selective export.

### Changed

- The popup was simplified to launch the full-page selector.
- The selector view was designed to be more comfortable for users with many windows/tabs than a small popup UI.
- Export filtering was implemented so the saved session contains only the selected windows/groups while remaining compatible with the existing import logic.
- The default status/notification panel was changed so it no longer shows a passive **Ready** message by default.
- Status UI now appears only when there is a meaningful message, such as an error, warning, success, or not-ready state.
- Project documentation, store listing draft, privacy language, and review notes were updated to use the new extension name.

### Permissions

- No new Chrome permissions were added.
- The extension continued to use only:
  - `tabs`
  - `tabGroups`

## [0.1.0] - 2026-06-10

### Added

- Initial working local Chrome extension prototype under the name **Session TXT Saver**.
- Manifest V3 extension structure with no build system and no external dependencies.
- Popup UI for core session actions.
- Full-session export of currently open Chrome windows, tabs, and tab groups.
- Export support for local session files:
  - `sessions.json`
  - `sessions.txt`
- Import support for user-selected `.json` or `.txt` session files.
- Session schema including:
  - schema version
  - saved timestamp
  - browser/app metadata
  - windows
  - tabs
  - tab URLs
  - tab titles
  - tab order
  - active tab state
  - pinned tab state
  - tab group membership
  - tab group metadata
- Restore support for:
  - new Chrome windows
  - tab ordering
  - pinned tabs
  - active tabs where possible
  - Chrome tab groups
  - tab group title, color, and collapsed state
- Placeholder/restoration-warning page for tabs that Chrome extensions cannot reopen directly or reliably.
- Basic error handling for invalid or unsupported session files.
- Basic import summary/reporting after restore.
- Extension icons.
- `README.md` with local testing instructions.
- Chrome Web Store preparation notes.
- Privacy policy draft.
- Store listing draft.
- Test plan.
- Sample session file.
- MIT license.

### Design / Privacy

- Kept the extension local-first.
- Did not require an account, cloud service, server, analytics, or telemetry.
- Did not use remotely hosted code.
- Avoided broad host permissions.
- Avoided the `downloads` permission by using user-initiated Blob downloads from the popup.

### Permissions

- Initial permissions:
  - `tabs`
  - `tabGroups`

