# Auto-link

Auto-link automatically converts mentions of your vault file names in clipped content into Obsidian `[[wiki-links]]`.

## How It Works

When you clip a page, OBClipper:

1. Fetches the list of file names from your Obsidian vault (via Local REST API)
2. Scans the clipped Markdown content for matching file names
3. Replaces the **first occurrence** of each match with a `[[wiki-link]]`

This turns your clipped notes into connected knowledge without manual effort.

## Configuration

In Settings → **Auto-link**:

- **Enable** — Toggle the feature on or off
- **Exclude folders** — Comma-separated list of vault folders to skip (e.g., `Templates, Archive/old`)

Excluded folders prevent files in those paths from being linked, reducing noise from template files or archived content.

## Example

If your vault contains a file named `Obsidian.md`, and you clip a page that mentions "Obsidian", the clipped content will contain `[[Obsidian]]` instead of plain text.
