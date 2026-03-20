# AI 对话剪藏

OBClipper 内置了针对主流 AI 对话界面的特殊剪藏模式。

## 支持的平台

- **Claude** (claude.ai)
- **ChatGPT** (chatgpt.com)
- **Google Gemini** (gemini.google.com)

## 工作原理

当你访问支持的 AI 对话页面并点击 OBClipper 时，AI Chat Profile 会自动激活：

1. 根据 URL 模式检测聊天平台
2. 使用平台特定的 CSS 选择器提取每条消息
3. 识别用户和助手消息
4. 格式化为 Obsidian **Callout 块**：

```markdown
> [!quote] User
> 如何使用 OBClipper？

> [!info] Assistant
> OBClipper 是一个 Chrome 扩展...
```

## 配置

在扩展设置页的 **AI Chat** 部分，你可以：

- **启用/禁用** — 开关 AI 对话剪藏功能
- **YAML 属性** — 添加通过 CSS 选择器提取的自定义变量（如对话标题、模型名称）
- **模板** — 自定义文件模板（对话内容 `{{CONTENT}}` 会自动追加到末尾）
- **保存路径** — 设置 AI 对话剪藏的保存位置（如 `AI Chat/{{TITLE}}.md`）

## 使用技巧

- 对话标题会自动提取为 `{{TITLE}}`
- 你可以通过模板添加 YAML Front Matter 以便更好地组织笔记
- 使用日期变量组织保存路径：`AI Chat/{{DATE}}/{{TITLE}}.md`
