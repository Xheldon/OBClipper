# 快速开始

## 前提条件

- **Chrome 浏览器**（或任何基于 Chromium 的浏览器）
- **Obsidian** 并安装启用 [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) 插件

## 安装 OBClipper

### 从 Chrome Web Store 安装

> 即将上线 — 插件尚未发布。

### 手动安装（开发者模式）

1. 下载或克隆 [OBClipper 仓库](https://github.com/Xheldon/OBClipper)
2. 在 Chrome 中打开 `chrome://extensions/`
3. 开启右上角的**开发者模式**
4. 点击**加载已解压的扩展程序**，选择 OBClipper 目录
5. 扩展图标将出现在工具栏中

## 配置 Obsidian API

1. 在 Obsidian 中，从社区插件市场安装 **Local REST API** 插件
2. 启用插件并从其设置中复制 **API Key**
3. 点击 OBClipper 扩展图标 → 点击**齿轮图标**（⚙）打开设置
4. 输入 API URL（默认：`https://127.0.0.1:27124`）并粘贴 API Key
5. 点击**保存 API 配置**

## 第一次剪藏

1. 打开任意你想剪藏的网页
2. 点击 OBClipper 扩展图标
3. 选择一个 Profile（或使用默认的）
4. 点击**提取并保存**
5. 页面内容将被保存到你的 Obsidian 仓库！

## 下一步

- [创建自定义 Profile](./profiles) 来提取不同网站的特定内容
- [设置 AI 对话剪藏](./ai-chat) 来剪藏 Claude、ChatGPT 和 Gemini 对话
- [启用自动双链](./auto-link) 来自动在剪藏内容中创建 wiki 链接
