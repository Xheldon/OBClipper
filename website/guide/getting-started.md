# Getting Started

## Prerequisites

- **Chrome browser** (or any Chromium-based browser)
- **Obsidian** with the [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin installed and enabled

## Install OBClipper

### From Chrome Web Store

> Coming soon — the extension is not yet published.

### Manual Install (Developer Mode)

1. Download or clone the [OBClipper repository](https://github.com/Xheldon/OBClipper)
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer Mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the OBClipper directory
5. The extension icon will appear in your toolbar

## Configure Obsidian API

1. In Obsidian, install the **Local REST API** plugin from the community plugin marketplace
2. Enable the plugin and copy the **API Key** from its settings
3. Click the OBClipper extension icon → click the **gear icon** (⚙) to open Settings
4. Enter the API URL (default: `https://127.0.0.1:27124`) and paste your API Key
5. Click **Save API Config**

## Your First Clip

1. Navigate to any webpage you want to clip
2. Click the OBClipper extension icon
3. Select a Profile (or use the default one)
4. Click **Extract & Save**
5. The page content will be saved to your Obsidian vault!

## Next Steps

- [Create custom Profiles](./profiles) to extract specific content from different websites
- [Set up AI Chat clipping](./ai-chat) for Claude, ChatGPT, and Gemini conversations
- [Enable Auto-link](./auto-link) to automatically create wiki-links in clipped content
