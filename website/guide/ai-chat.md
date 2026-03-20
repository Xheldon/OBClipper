# AI Chat Clipping

OBClipper includes a special mode for clipping AI conversations from popular chat interfaces.

## Supported Platforms

- **Claude** (claude.ai)
- **ChatGPT** (chatgpt.com)
- **Google Gemini** (gemini.google.com)

## How It Works

When you visit a supported AI chat page and click OBClipper, the AI Chat profile automatically activates. It:

1. Detects the chat platform based on URL patterns
2. Extracts each message using platform-specific CSS selectors
3. Identifies user vs. assistant messages
4. Formats them as Obsidian **callout blocks**:

```markdown
> [!quote] User
> How do I use OBClipper?

> [!info] Assistant
> OBClipper is a Chrome extension that...
```

## Configuration

In the extension Settings page, the **AI Chat** section lets you:

- **Enable/Disable** — Toggle AI chat clipping on or off
- **YAML Properties** — Add custom variables extracted via CSS selectors (e.g., conversation title, model name)
- **Template** — Customize the file template (the conversation content `{{CONTENT}}` is auto-appended at the end)
- **Save Path** — Set where AI chat clips are saved (e.g., `AI Chat/{{TITLE}}.md`)

## Tips

- The conversation title is automatically extracted as `{{TITLE}}`
- You can add YAML front matter via the template for better organization
- Use the save path variable to organize by date: `AI Chat/{{DATE}}/{{TITLE}}.md`
