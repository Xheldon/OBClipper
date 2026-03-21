# OBClipper - Save to Obsidian

一个 Chrome 浏览器扩展，通过自定义 CSS 选择器从任意网页提取内容，并借助 [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) 插件一键保存到你的 Obsidian Vault 中。

[English](README.md) | [文档站点(WIP)](https://obclipper.pages.dev)

## 它解决了什么问题

网上看到好文章、视频、资料想收藏到 Obsidian，但每次都要手动复制粘贴、整理格式、下载图片？OBClipper 让你针对不同网站配置提取规则（Profile），点击一下就能把标题、作者、封面等信息按你的模板格式化后存入 Obsidian。

## 功能特性

- **Profile 系统** — 为不同网站创建不同的提取规则，支持 URL 自动匹配
- **AI 对话导出** — 内置支持导出 Claude、ChatGPT、Gemini 对话记录
- **附件下载** — 自动下载图片等附件到 Vault 中
- **自动双链** — 自动将剪藏内容中出现的 Vault 文件名识别为 `[[双链]]`
- **社区 Profile** — 浏览并一键导入社区分享的提取规则
- **配置同步** — 通过 Google 账号在多台 Chrome 浏览器之间同步配置
- **国际化** — 支持中英文界面

## 安装

### 1. 安装 Obsidian 插件

在 Obsidian 的社区插件中搜索 **Local REST API** 并安装启用，或前往 [GitHub 页面](https://github.com/coddingtonbear/obsidian-local-rest-api) 手动安装。

### 2. 安装浏览器扩展

目前需要以开发者模式加载：

1. 下载或 clone 本仓库到本地
2. 安装依赖并构建：
   ```bash
   cd extension
   npm install
   npm run build
   ```
3. 打开 Chrome，进入 `chrome://extensions/`
4. 开启右上角「开发者模式」
5. 点击「加载已解压的扩展程序」，选择 `extension/dist` 目录

## 使用方法

### 配置 API 连接

打开扩展的设置页面（点击扩展图标右上角 ⚙），填入 Local REST API 提供的地址和 API Key。

### 创建 Profile

每个 Profile 对应一套提取规则，你可以为不同网站创建不同的 Profile。

- **Profile 名称**：方便识别，如「博客文章」「视频收藏」
- **自动匹配网址**：开启后，访问匹配的网址时会自动选中该 Profile（支持 `*` 通配符）
- **默认 Profile**：当没有网址匹配时使用
- **变量 & 选择器**：定义要从页面提取的内容
  - **变量名**：在模板中通过 `{{变量名}}` 引用
  - **CSS 选择器**：定位页面元素，如 `h1.title`、`#player`
  - **属性**：提取元素属性（如 `src`、`href`、`poster`），留空则取文本内容
  - **附件**：勾选后会将值作为 URL 下载保存到附件目录
  - **JS 表达式**：对提取值做二次处理，如 `value.split(' ')[0].trim()`
- **文件模板**：使用 `{{变量名}}` 组织最终保存的文件内容
- **保存路径**：相对 Vault 根目录的路径，同样支持变量，如 `Clippings/{{title}}.md`

### 内置变量

无需通过选择器提取，可直接在模板和路径中使用：

| 变量 | 说明 |
|------|------|
| `{{URL}}` | 当前页面 URL |
| `{{TITLE}}` | 当前页面标题 |
| `{{CONTENT}}` | 页面主要内容的 Markdown 格式（通过 [defuddle](https://github.com/kepano/defuddle) 提取） |
| `{{DATE}}` | 当前日期（YYYY-MM-DD） |
| `{{TIMESTAMP}}` | 当前时间（ISO 格式） |

### 提取并保存

1. 在目标网页上点击 OBClipper 扩展图标
2. 选择对应的 Profile（如果配置了自动匹配会自动选中）
3. 预览提取到的变量值和保存路径
4. 点击「提取并保存」

### AI 对话导出

OBClipper 内置支持导出以下 AI 对话：
- **Claude** (claude.ai)
- **ChatGPT** (chatgpt.com)
- **Gemini** (gemini.google.com)

在设置中启用 AI 对话 Profile，配置保存路径和模板后即可使用。

### 导入 / 导出 & 同步

- **导入 / 导出**：导出全部配置为 JSON 文件，或导入之前的配置，方便备份和迁移
- **配置同步**：通过 Google 账号在多台 Chrome 浏览器之间推送/拉取配置（API 地址和 Key 始终保留在本地）

## 开发

```bash
cd extension
npm install
npm run dev    # Watch 模式 — 修改代码自动重新构建
npm run build  # 生产构建 → extension/dist/
```

在 Chrome 中加载 `extension/dist` 目录作为未打包扩展进行测试。

### 项目结构

```
OBClipper/
├── extension/               # Chrome 扩展
│   ├── src/                 # 源代码
│   │   ├── popup/           # 扩展弹出窗口 UI
│   │   ├── options/         # 设置页面
│   │   ├── background/      # Service Worker
│   │   ├── sandbox/         # 沙箱 JS 转换上下文
│   │   ├── shared/          # 国际化、AI 对话配置
│   │   └── styles/          # 共享样式
│   ├── public/              # 静态资源（图标、库文件）
│   ├── dist/                # 构建输出（在 Chrome 中加载此目录）
│   ├── manifest.json
│   └── vite.config.js
├── website/                 # 文档站点（VitePress）
└── README.md
```

## License

GPL
