# Profiles 配置

Profile 是 OBClipper 的核心。每个 Profile 定义了如何从特定类型的网页中提取内容。

## Profile 结构

一个 Profile 包含：

- **名称** — 描述性名称（如「博客文章」「GitHub Issues」）
- **URL 自动匹配** — URL 模式，用于自动选择此 Profile
- **变量与选择器** — 用 CSS 选择器从页面提取数据
- **模板** — 使用 `{{variable}}` 语法的 Markdown 模板
- **保存路径** — 文件在 Vault 中的保存位置
- **附件路径** — 下载的附件保存位置

## 变量与选择器

每个变量包含：

| 字段 | 说明 |
|------|------|
| **变量名** | 在模板中使用的名称，如 `author` |
| **CSS 选择器** | 用于定位元素的选择器，如 `.post-author` |
| **属性** | 可选：提取元素属性而非文本（如 `href`、`src`） |
| **附件** | 标记为附件 — 值（URL）将被下载并保存 |
| **JS 转换** | 可选：用 JavaScript 表达式转换值，使用 `value` 引用提取的文本 |

### 内置变量

以下变量无需定义选择器即可使用：

| 变量 | 说明 |
|------|------|
| `{{TITLE}}` | 页面标题 |
| `{{URL}}` | 页面 URL |
| `{{CONTENT}}` | 完整页面内容（通过 defuddle 提取，转换为 Markdown） |
| `{{DATE}}` | 当前日期（`YYYY-MM-DD`） |
| `{{TIMESTAMP}}` | 当前时间戳（`YYYY-MM-DD HH:mm:ss`） |

## URL 模式

URL 模式支持 `*` 通配符匹配：

```
https://example.com/posts/*
https://*.github.com/*/issues/*
```

当你访问匹配的页面时，OBClipper 会自动选择对应的 Profile。

## 模板

模板使用 `{{variable}}` 语法配合 Markdown：

```markdown
---
title: {{TITLE}}
author: {{author}}
url: {{URL}}
date: {{DATE}}
---

{{CONTENT}}
```

## 保存路径

保存路径相对于 Vault 根目录，支持变量：

```
Articles/{{TITLE}}.md
Blog/{{author}}/{{TITLE}}.md
```

## JS 转换

启用「显示 JS 转换代码」后，可以添加 JavaScript 表达式来转换提取的值。变量 `value` 包含原始提取的文本：

```javascript
// 获取 | 前的部分
value.split('|')[0].trim()

// 转为小写
value.toLowerCase()

// 提取数字
parseInt(value.replace(/[^\d]/g, ''))
```

转换在沙箱 iframe 中运行，确保安全。

## 默认 Profile

你可以将一个 Profile 标记为**默认 Profile**。当没有 URL 模式匹配当前页面时，将使用默认 Profile。
