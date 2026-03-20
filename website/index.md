---
layout: home
hero:
  name: OBClipper
  text: Clip Web to Obsidian
  tagline: Extract web content with custom CSS selectors and save it to your Obsidian vault in one click.
  image:
    src: /logo.webp
    alt: OBClipper
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Community Profiles
      link: /community
    - theme: alt
      text: vs Official Web Clipper?
      link: "#vs-official"
features:
  - icon: "\u2702\uFE0F"
    title: Smart Extraction
    details: Use CSS selectors to extract exactly what you need from any webpage. Support for custom variables, templates, and JS transforms.
  - icon: "\uD83E\uDD16"
    title: AI Chat Clipping
    details: Clip conversations from Claude, ChatGPT, and Gemini as beautifully formatted Obsidian callout blocks.
  - icon: "\uD83D\uDD17"
    title: Auto-link
    details: Automatically link vault filenames found in clipped content, turning your notes into a connected knowledge graph.
  - icon: "\uD83D\uDCE6"
    title: Attachment Download
    details: Download and save images and attachments alongside your notes with multi-strategy fallback for reliable extraction.
  - icon: "\u2601\uFE0F"
    title: Config Sync
    details: Sync your profiles and settings across Chrome browsers via your Google account.
  - icon: "\uD83C\uDF10"
    title: Community Profiles
    details: Browse and import ready-made profiles from the community, or share your own extraction configs.
---

<div id="vs-official" class="compare-section">
  <h2 class="compare-title">vs Official Web Clipper</h2>
  <p class="compare-subtitle">What makes OBClipper different from the official Obsidian Web Clipper?</p>
  <div class="compare-grid">
    <div class="compare-card">
      <div class="compare-icon">🎯</div>
      <h3>Simpler Configuration</h3>
      <p>The official clipper has too many options: open behavior, save behavior, shortcuts, reading mode, and more. OBClipper does one thing well — clip and save to Obsidian.</p>
    </div>
    <div class="compare-card">
      <div class="compare-icon">🔓</div>
      <h3>More Flexible Properties</h3>
      <p>The official clipper only lets you use a fixed set of fields as YAML properties. OBClipper supports those too, but also lets you extract any content from the page via CSS selectors to use as custom YAML properties.</p>
    </div>
    <div class="compare-card">
      <div class="compare-icon">💬</div>
      <h3>AI Chat Aware</h3>
      <p>The official clipper treats AI chat pages like any other webpage. OBClipper has dedicated support to save conversations from Claude, ChatGPT, and Gemini as structured dialogue.</p>
    </div>
  </div>
</div>
