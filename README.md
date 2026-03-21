# OBClipper - Save to Obsidian

A Chrome browser extension that extracts content from any webpage using custom CSS selectors and saves it to your Obsidian Vault via the [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin.

[中文文档](README_zh.md) | [Documentation Site](https://obclipper.pages.dev)

## What Problem It Solves

Found a great article, video, or resource online and want to save it to Obsidian, but tired of manually copying, formatting, and downloading images every time? OBClipper lets you configure extraction rules (Profiles) for different websites — one click to extract title, author, cover image, etc., format them with your template, and save to Obsidian.

## Features

- **Profile System** — Create different extraction rules for different websites, with URL auto-matching
- **AI Chat Export** — Built-in support for exporting Claude, ChatGPT, and Gemini conversations
- **Attachment Download** — Automatically download images and other attachments to your vault
- **Auto-link** — Automatically link vault filenames found in clipped content as `[[wikilinks]]`
- **Community Profiles** — Browse and one-click import extraction rules shared by the community
- **Config Sync** — Sync profiles and settings across Chrome browsers via your Google account
- **i18n** — English and Simplified Chinese interface

## Installation

### 1. Install the Obsidian Plugin

Search for **Local REST API** in Obsidian's community plugins and install it, or visit the [GitHub page](https://github.com/coddingtonbear/obsidian-local-rest-api) for manual installation.

### 2. Install the Browser Extension

Currently requires loading in developer mode:

1. Download or clone this repository
2. Install dependencies and build:
   ```bash
   cd extension
   npm install
   npm run build
   ```
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the `extension/dist` directory

## Usage

### Configure API Connection

Open the extension's settings page (click the gear icon in the top right of the popup), and enter the URL and API Key provided by Local REST API.

### Create a Profile

Each Profile defines a set of extraction rules. You can create different Profiles for different websites.

- **Profile Name**: A label for easy identification, e.g. "Blog Posts", "Video Collection"
- **Auto-match URLs**: When enabled, the Profile is automatically selected when visiting a matching URL (supports `*` wildcard)
- **Default Profile**: Used when no URL pattern matches
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
| `{{CONTENT}}` | Main content of the page in Markdown (extracted via [defuddle](https://github.com/kepano/defuddle)) |
| `{{DATE}}` | Current date (YYYY-MM-DD) |
| `{{TIMESTAMP}}` | Current timestamp (ISO format) |

### Extract & Save

1. Click the OBClipper extension icon on the target webpage
2. Select the appropriate Profile (auto-matched if configured)
3. Preview the extracted variables and save path
4. Click "Extract & Save"

### AI Chat Export

OBClipper has built-in support for exporting AI chat conversations from:
- **Claude** (claude.ai)
- **ChatGPT** (chatgpt.com)
- **Gemini** (gemini.google.com)

Enable the AI Chat profile in settings, configure the save path and template, then use it like any other profile.

### Import / Export & Sync

- **Import / Export**: Export all configuration as a JSON file, or import a previous configuration for backup and migration
- **Config Sync**: Push/pull profiles and settings across Chrome browsers via your Google account (API URL and Key stay local)

## Development

```bash
cd extension
npm install
npm run dev    # Watch mode — auto-rebuilds on file changes
npm run build  # Production build → extension/dist/
```

Load `extension/dist` as an unpacked extension in Chrome for testing.

### Project Structure

```
OBClipper/
├── extension/               # Chrome extension
│   ├── src/                 # Source code
│   │   ├── popup/           # Extension popup UI
│   │   ├── options/         # Settings page
│   │   ├── background/      # Service worker
│   │   ├── sandbox/         # Sandboxed JS transform context
│   │   ├── shared/          # i18n, AI chat config
│   │   └── styles/          # Shared CSS
│   ├── public/              # Static assets (icons, lib)
│   ├── dist/                # Build output (load this in Chrome)
│   ├── manifest.json
│   └── vite.config.js
├── website/                 # Documentation site (VitePress)
└── README.md
```

## License

ISC
