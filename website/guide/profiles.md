# Profiles

Profiles are the core of OBClipper. Each profile defines how to extract content from a specific type of webpage.

## Profile Structure

A profile consists of:

- **Name** — A descriptive name (e.g., "Blog Posts", "GitHub Issues")
- **Auto-match URLs** — URL patterns to automatically select this profile
- **Variables & Selectors** — CSS selectors that extract data from the page
- **Template** — A Markdown template using `{{variable}}` syntax
- **Save Path** — Where to save the file in your vault
- **Attachment Path** — Where to save downloaded attachments

## Variables & Selectors

Each variable has:

| Field | Description |
|-------|------------|
| **Variable Name** | Name used in templates, e.g., `author` |
| **CSS Selector** | CSS selector to find the element, e.g., `.post-author` |
| **Attribute** | Optional: extract an attribute instead of text (e.g., `href`, `src`) |
| **Attachment** | Mark as attachment — the value (URL) will be downloaded and saved |
| **JS Transform** | Optional: JavaScript expression to transform the value. Use `value` to reference the extracted text |

### Built-in Variables

These variables are always available without defining selectors:

| Variable | Description |
|----------|------------|
| `{{TITLE}}` | Page title |
| `{{URL}}` | Page URL |
| `{{CONTENT}}` | Full page content (extracted via defuddle, converted to Markdown) |
| `{{DATE}}` | Current date (`YYYY-MM-DD`) |
| `{{TIMESTAMP}}` | Current timestamp (`YYYY-MM-DD HH:mm:ss`) |

## URL Patterns

URL patterns support `*` wildcard matching:

```
https://example.com/posts/*
https://*.github.com/*/issues/*
```

When you visit a page matching a pattern, OBClipper automatically selects the corresponding profile.

## Template

Templates use `{{variable}}` syntax with Markdown:

```markdown
---
title: {{TITLE}}
author: {{author}}
url: {{URL}}
date: {{DATE}}
---

{{CONTENT}}
```

## Save Path

The save path is relative to your vault root and supports variables:

```
Articles/{{TITLE}}.md
Blog/{{author}}/{{TITLE}}.md
```

## JS Transform

Enable "Show JS transform code" to add JavaScript expressions that transform extracted values. The variable `value` contains the raw extracted text:

```javascript
// Get first part before |
value.split('|')[0].trim()

// Convert to lowercase
value.toLowerCase()

// Extract number
parseInt(value.replace(/[^\d]/g, ''))
```

Transforms run in a sandboxed iframe for security.

## Default Profile

You can mark one profile as the **Default Profile**. It will be used when no URL pattern matches the current page.
