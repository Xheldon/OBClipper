# Advanced

## JS Transform & Sandbox

User-defined JavaScript transforms run in a **sandboxed iframe** for security. The transform expression receives the extracted value as `value` and should return the transformed result.

```javascript
// Extract domain from URL
new URL(value).hostname

// Format date
new Date(value).toISOString().slice(0, 10)

// Clean up whitespace
value.replace(/\s+/g, ' ').trim()
```

## Import / Export

### Full Config Export

From Settings → **Import / Export**, you can:

- **Export All Config** — Downloads a JSON file with all settings, profiles, and API config
- **Import Config** — Upload a previously exported JSON file to restore settings

### Single Profile Export

Each profile has an **Export** button next to the Delete button. This downloads just that one profile as a JSON file — useful for sharing to the [Community Profiles](/community) collection.

## Config Sync

Sync your profiles and settings across Chrome browsers using your Google account:

- **Push to Cloud** — Uploads profiles, AI chat config, and auto-link settings to Chrome's sync storage
- **Pull from Cloud** — Downloads and applies the synced config

::: tip
API URL and API Key are **never synced** — they stay local to each device, since the Obsidian REST API address may differ between machines.
:::

## Attachment Download

When a variable is marked as **Attachment**, OBClipper treats its value as a URL and downloads the file. The download uses a multi-strategy fallback:

1. **Canvas fetch** — Loads the image with `crossOrigin` and extracts via canvas
2. **DOM image extraction** — Reads image data directly from the page DOM
3. **Background service worker** — Uses the extension's background script to bypass CORS restrictions

Downloaded attachments are converted to base64 and uploaded to your vault at the configured attachment path.

## Content Extraction

OBClipper uses [defuddle](https://github.com/kepano/defuddle) to extract the main content from web pages. It automatically:

- Removes navigation, ads, and boilerplate
- Converts HTML to clean Markdown
- Preserves formatting, links, and images
