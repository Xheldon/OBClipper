# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OBClipper is a Chrome browser extension (Manifest V3) that extracts content from webpages using custom CSS selectors and saves it to an Obsidian vault via the Local REST API plugin. Written in vanilla JavaScript with Vite as the build tool.

## Project Structure

```
OBClipper/
├── extension/           # Chrome extension
│   ├── src/             # Source code (edit here)
│   │   ├── popup/       # popup.html, popup.js, popup.css
│   │   ├── options/     # options.html, options.js, options.css
│   │   ├── background/  # background.js (service worker)
│   │   ├── sandbox/     # sandbox.html, sandbox.js
│   │   ├── shared/      # i18n.js, ai-chat-config.js
│   │   └── styles/      # styles.css (shared theme)
│   ├── public/          # Static assets (copied as-is to dist/)
│   │   ├── icons/       # Extension icons
│   │   └── lib/         # defuddle.js, extract-content.js
│   ├── dist/            # Build output (gitignored) — upload this to Chrome Web Store
│   ├── manifest.json    # Manifest V3 config
│   ├── vite.config.js   # Vite build config
│   └── package.json     # Extension dependencies & scripts
├── website/             # VitePress documentation site
└── CLAUDE.md
```

## Development

**Build commands** (run from `extension/` directory):
- `npm run build` — Production build → outputs to `extension/dist/`
- `npm run dev` — Watch mode, auto-rebuilds on file changes

**Dependencies:** `cd extension && npm install`

**Loading in Chrome:** `chrome://extensions/` → Enable Developer Mode → Load Unpacked → select `extension/dist/`

**No automated tests or linter** are configured.

**Debugging:** Right-click the extension popup → Inspect for popup DevTools. For the service worker: `chrome://extensions/` → click "Service Worker" link.

## Architecture

### Extension Entry Points
- **manifest.json** — Manifest V3 config; permissions: `storage`, `activeTab`, `scripting`, `<all_urls>`
- **src/background/background.js** — Service worker handling message-based fetch bridging (CORS bypass for attachment downloads)
- **src/popup/popup.html/js** — Main UI: profile selection, variable extraction, preview, and save-to-Obsidian flow
- **src/options/options.html/js** — Settings page: API config, profile CRUD, AI chat config, import/export

### Data Flow
1. User clicks extension icon → popup loads config from `chrome.storage.local`
2. Auto-matching checks URL against profile patterns
3. Variables extracted via CSS selectors (`chrome.scripting.executeScript` into page context)
4. Page content extracted via defuddle (HTML → Markdown)
5. Template rendered with `{{variable}}` interpolation
6. File saved to Obsidian via PUT to Local REST API

### Profile System
Profiles define extraction rules per site: CSS selectors → variables, optional JS transforms, file template with `{{variable}}` syntax, save path, attachment download paths. Built-in variables: `{{URL}}`, `{{TITLE}}`, `{{CONTENT}}`, `{{DATE}}`, `{{TIMESTAMP}}`.

### AI Chat Profile
Special extraction mode for AI conversations (Claude, ChatGPT, Gemini). Site-specific selectors configured in `ai-chat-config.js`. Extracts user/assistant messages as Obsidian callout blocks.

### Key Supporting Files
- **src/shared/i18n.js** — Runtime internationalization (English + Simplified Chinese) using `data-i18n` attributes
- **src/shared/ai-chat-config.js** — Per-site selector configs for AI chat extraction
- **src/sandbox/sandbox.html/js** — Sandboxed context for executing user-defined JS transforms safely
- **public/lib/defuddle.js** — Bundled defuddle library (copied to dist as-is, injected into pages via chrome.scripting.executeScript)
- **src/styles/styles.css** — Shared theme and component styles

### Attachment Download
Multi-strategy fallback: canvas-based fetch with crossOrigin → DOM image extraction → background service worker fetch (CORS bypass). Images converted to base64 then uploaded as blobs.

### Storage
All configuration persisted in `chrome.storage.local`. Supports full JSON import/export from the settings page.
