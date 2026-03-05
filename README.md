# OBClipper - Save to Obsidian

A Chrome browser extension that extracts content from any webpage using custom CSS selectors and saves it to your Obsidian Vault via the [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin.

## What Problem It Solves

Found a great article, video, or resource online and want to save it to Obsidian, but tired of manually copying, formatting, and downloading images every time? OBClipper lets you configure extraction rules (Profiles) for different websites — one click to extract title, author, cover image, etc., format them with your template, and save to Obsidian.

## Installation

### 1. Install the Obsidian Plugin

Search for **Local REST API** in Obsidian's community plugins and install it, or visit the [GitHub page](https://github.com/coddingtonbear/obsidian-local-rest-api) for manual installation.

### 2. Install the Browser Extension

Currently requires loading in developer mode:

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select this repository's directory

## Usage

### Configure API Connection

Open the extension's settings page (click the gear icon in the top right of the popup), and enter the URL and API Key provided by Local REST API.

### Create a Profile

Each Profile defines a set of extraction rules. You can create different Profiles for different websites.

- **Profile Name**: A label for easy identification, e.g. "Blog Posts", "Video Collection"
- **Auto-match URLs**: When enabled, the Profile is automatically selected when visiting a matching URL (supports `*` wildcard)
- **Variables & Selectors**: Define what to extract from the page
  - **Variable Name**: Reference in templates via `{{name}}`
  - **CSS Selector**: Locate page elements, e.g. `h1.title`, `#player`
  - **Attribute**: Extract an element attribute (e.g. `src`, `href`, `poster`); leave empty for text content
  - **Attachment**: When checked, the value is treated as a URL and downloaded to the attachment directory
  - **JS Expression**: Post-process the extracted value, e.g. `value.split(' ')[0].trim()`
- **File Template**: Use `{{variable}}` to compose the final saved file content
- **Save Path**: Path relative to the Vault root, also supports variables, e.g. `Clippings/{{title}}.md`

### Built-in Variables

Available in templates and paths without needing CSS selectors:

| Variable | Description |
|----------|-------------|
| `{{URL}}` | Current page URL |
| `{{TITLE}}` | Current page title |
| `{{DATE}}` | Current date (YYYY-MM-DD) |
| `{{TIMESTAMP}}` | Current timestamp (ISO format) |

### Extract & Save

1. Click the OBClipper extension icon on the target webpage
2. Select the appropriate Profile (auto-matched if configured)
3. Preview the extracted variables and save path
4. Click "Extract & Save"

## Import / Export

At the bottom of the settings page, you can export all configuration as a JSON file, or import a previous configuration for easy backup and migration.
