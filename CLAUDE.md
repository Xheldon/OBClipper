# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OBClipper is a Chrome browser extension (Manifest V3) that extracts content from webpages using custom CSS selectors and saves it to an Obsidian vault via the Local REST API plugin. Written in vanilla JavaScript with no build system — the extension loads directly from source files.

## Development

**No build step required.** Load the extension directly in Chrome:
1. `chrome://extensions/` → Enable Developer Mode → Load Unpacked → select this directory
2. After code changes, click the refresh button on the extension card to reload

**Dependencies:** `npm install` (only dependency is `defuddle` for content extraction; the bundled version lives at `lib/defuddle.js`)

**No automated tests or linter** are configured.

**Debugging:** Right-click the extension popup → Inspect for popup DevTools. For the service worker: `chrome://extensions/` → click "Service Worker" link.

## Architecture

### Extension Entry Points
- **manifest.json** — Manifest V3 config; permissions: `storage`, `activeTab`, `scripting`, `<all_urls>`
- **background.js** — Service worker handling message-based fetch bridging (CORS bypass for attachment downloads)
- **popup.html/js** — Main UI: profile selection, variable extraction, preview, and save-to-Obsidian flow
- **options.html/js** — Settings page: API config, profile CRUD, AI chat config, import/export

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
- **i18n.js** — Runtime internationalization (English + Simplified Chinese) using `data-i18n` attributes
- **ai-chat-config.js** — Per-site selector configs for AI chat extraction
- **sandbox.html/js** — Sandboxed context for executing user-defined JS transforms safely
- **lib/extract-content.js** — Content extraction helper used with defuddle
- **styles.css** — Shared theme and component styles

### Attachment Download
Multi-strategy fallback: canvas-based fetch with crossOrigin → DOM image extraction → background service worker fetch (CORS bypass). Images converted to base64 then uploaded as blobs.

### Storage
All configuration persisted in `chrome.storage.local`. Supports full JSON import/export from the settings page.
