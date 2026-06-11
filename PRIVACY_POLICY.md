# Privacy Policy

**Effective date:** June 10, 2026  
**Extension name:** Chrome Session Saver  
**Developer:** Chrome Session Saver contributors  
**Contact:** Use the contact method listed in the Chrome Web Store listing or repository for this extension.

## Overview

Chrome Session Saver is a Chrome extension that helps users export and restore open Chrome windows, tabs, and tab groups using a local session file, such as `sessions.json` or `sessions.txt`.

The extension is designed to work locally in the user's browser. It does not require an account, does not use a remote server, does not sync data to the cloud, and does not sell user data.

## Data the Extension Accesses

To provide its core session export and import features, Chrome Session Saver may access the following information from the user's currently open Chrome browser session:

- Open browser window information
- Open tab URLs
- Open tab titles
- Tab order
- Active tab state
- Pinned tab state
- Muted tab state
- Chrome tab group membership
- Chrome tab group metadata, such as group title, color, and collapsed state

This information is accessed only when needed to perform a user-requested action, such as exporting selected windows, tab groups, and tabs or restoring a user-selected session file.

## How the Data Is Used

Chrome Session Saver uses the data listed above only for the following purposes:

- To display a local selector for open windows, tab groups, and, when expanded by the user, individual tabs
- To create a local session file containing the user's selected windows, tabs, and tab groups
- To restore windows, tabs, and tab groups from a user-selected session file
- To show status messages and warnings in the extension interface

The extension does not use browsing data for advertising, profiling, analytics, tracking, or any purpose unrelated to saving and restoring browser sessions.

## Local Files and User Control

When the user exports a session, Chrome Session Saver creates a local file, such as `sessions.json` or `sessions.txt`, using the browser's normal download behavior.

The exported session file may contain sensitive browsing information, including tab URLs and page titles. Users are responsible for where they save, store, share, or delete exported session files.

When the user imports a session, the extension reads only the file that the user explicitly selects through the browser's file picker.

## Data Collection and Transmission

Chrome Session Saver does not collect, transmit, upload, sell, rent, or share user data.

Specifically:

- No browsing data is sent to the developer.
- No browsing data is sent to third-party servers.
- No analytics or telemetry are collected.
- No advertising identifiers are collected.
- No personal information is requested or stored by the developer.
- No account or login is required.

## Chrome Permissions

Chrome Session Saver requests only the Chrome permissions needed to provide its core functionality.

### `tabs`

The `tabs` permission is used to read information about open tabs, including URLs, titles, tab order, active state, pinned state, and muted state. This is necessary to export and later restore the user's selected browser session.

### `tabGroups`

The `tabGroups` permission is used to read and restore Chrome tab group information, including group title, color, collapsed state, and which tabs belong to each group.

The extension does not request broad host permissions and does not inject scripts into webpages.

## Remote Code

Chrome Session Saver does not load or execute remotely hosted code. All extension code is included in the extension package.

## Data Retention

Chrome Session Saver does not retain user data on any developer-controlled server.

Exported session files are stored only where the user chooses to save them through the browser's download process. The user can delete these files at any time using their operating system's file manager.

## Data Sharing

Chrome Session Saver does not share user data with third parties.

The extension does not sell user data, does not transfer user data for advertising purposes, and does not use user data for creditworthiness, lending, or any unrelated secondary purpose.

## Limited Use Disclosure

Chrome Session Saver's use of information received from Chrome APIs is limited to providing the user-facing session export and import features described in this policy and in the Chrome Web Store listing.

The extension does not use Chrome API data for advertising, tracking, profiling, analytics, or any other purpose unrelated to saving and restoring browser sessions.

## Security

Chrome Session Saver is designed to minimize data exposure by keeping session data local to the user's browser and user-controlled files.

Users should treat exported session files as private because they may contain browsing information such as URLs and page titles.

## Children's Privacy

Chrome Session Saver is a general-purpose browser utility and is not directed to children. The extension does not knowingly collect personal information from children.

## Changes to This Privacy Policy

This privacy policy may be updated from time to time. If the policy changes, the updated version will be posted in the extension's repository and, where applicable, linked from the Chrome Web Store listing.

## Contact

For questions about this privacy policy or the extension's privacy practices, contact:

Use the contact method listed in the Chrome Web Store listing or repository for this extension.
