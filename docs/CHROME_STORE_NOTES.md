# Chrome Web Store Submission Notes

## Package

Upload a ZIP file with `manifest.json` at the root of the ZIP.

Recommended PowerShell command from inside the extension folder:

```powershell
Compress-Archive -Path * -DestinationPath ..\chrome-session-saver-0.2.0-webstore.zip -Force
```

## Version

Current version: `0.2.0`

Every future Web Store update must increment the `version` value in `manifest.json`.

## Permissions

Current permissions:

```json
[
  "tabs",
  "tabGroups"
]
```

No new permissions were added for v0.2.0.

## Privacy notes

The extension handles browsing-related data because session files can contain tab URLs and titles. Disclose this clearly in the Web Store privacy section.

Key points to include:

- The extension reads open tab URLs/titles only to export and restore user-selected browser sessions.
- Exported session data is saved only to local files created by user action.
- Import reads only the file selected by the user.
- No browsing data is sent to the developer or any third party.
- No analytics, telemetry, advertising, or tracking are used.
- No account or login is required.

## Data use answers

Likely data category: Web history or browsing activity, depending on the current Chrome Web Store form wording.

Purpose: App functionality.

Data handling:

- Not sold.
- Not shared with third parties.
- Not used for advertising.
- Not used for analytics.
- Not transmitted off-device by the extension.

## Review notes for v0.2.0

Suggested reviewer note:

> Version 0.2.0 adds a full-page selector that lets users choose which Chrome windows and whole tab groups to include before exporting a local session file. No new permissions were added. The extension still uses only `tabs` and `tabGroups`, does not request host permissions, does not inject scripts into webpages, and does not transmit data externally.

## Files reviewers may inspect

- `manifest.json`
- `background.js`
- `popup.html`
- `popup.js`
- `export.html`
- `export.js`
- `styles.css`
- `PRIVACY_POLICY.md`
