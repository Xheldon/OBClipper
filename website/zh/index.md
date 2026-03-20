---
layout: home
hero:
  name: OBClipper
  text: 网页剪藏到 Obsidian
  tagline: 使用自定义 CSS 选择器提取网页内容，一键保存到你的 Obsidian 仓库。
  image:
    src: /logo.webp
    alt: OBClipper
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: 社区 Profiles
      link: /zh/community
    - theme: alt
      text: 与官方 Web Clipper 有什么区别？
      link: "#vs-official"
features:
  - icon: "\u2702\uFE0F"
    title: 智能提取
    details: 使用 CSS 选择器从任意网页精准提取所需内容，支持自定义变量、模板和 JS 转换。
  - icon: "\uD83E\uDD16"
    title: AI 对话剪藏
    details: 将 Claude、ChatGPT、Gemini 的对话剪藏为格式优美的 Obsidian Callout 块。
  - icon: "\uD83D\uDD17"
    title: 自动双链
    details: 自动识别剪藏内容中与 Vault 文件同名的文本并转为双链，构建你的知识图谱。
  - icon: "\uD83D\uDCE6"
    title: 附件下载
    details: 自动下载并保存图片和附件，多策略回退机制确保稳定提取。
  - icon: "\u2601\uFE0F"
    title: 配置同步
    details: 通过 Google 账户在多台 Chrome 浏览器之间同步你的 Profiles 和设置。
  - icon: "\uD83C\uDF10"
    title: 社区 Profiles
    details: 浏览并一键导入社区分享的 Profile 配置，或分享你自己的配置。
---

<div id="vs-official" class="compare-section">
  <h2 class="compare-title">与官方 Web Clipper 有什么区别？</h2>
  <p class="compare-subtitle">OBClipper 相比 Obsidian 官方 Web Clipper 的不同之处</p>
  <div class="compare-grid">
    <div class="compare-card">
      <div class="compare-icon">🎯</div>
      <h3>配置更简单</h3>
      <p>官方 Clipper 配置项繁多：打开行为、保存行为、快捷键、阅读模式等等。OBClipper 只做一件事——剪藏并保存到 Obsidian。</p>
    </div>
    <div class="compare-card">
      <div class="compare-icon">🔓</div>
      <h3>属性更自由</h3>
      <p>官方 Clipper 只能将固定的几个字段作为 YAML 属性。OBClipper 不仅支持这些固定属性，还允许你通过 CSS 选择器从页面中提取任意内容作为自定义 YAML 属性。</p>
    </div>
    <div class="compare-card">
      <div class="compare-icon">💬</div>
      <h3>AI 对话特别处理</h3>
      <p>官方 Clipper 对 AI 聊天页面的处理与普通页面无异。OBClipper 专门针对 Claude、ChatGPT、Gemini 等主流 AI 聊天界面，以对话形式保存聊天记录。</p>
    </div>
  </div>
</div>
