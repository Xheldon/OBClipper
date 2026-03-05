# OBClipper - Save to Obsidian

一个 Chrome 浏览器扩展，通过自定义 CSS 选择器从任意网页提取内容，并借助 [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) 插件一键保存到你的 Obsidian Vault 中。

## 它解决了什么问题

网上看到好文章、视频、资料想收藏到 Obsidian，但每次都要手动复制粘贴、整理格式、下载图片？OBClipper 让你针对不同网站配置提取规则（Profile），点击一下就能把标题、作者、封面等信息按你的模板格式化后存入 Obsidian。

## 安装

### 1. 安装 Obsidian 插件

在 Obsidian 的社区插件中搜索 **Local REST API** 并安装启用，或前往 [GitHub 页面](https://github.com/coddingtonbear/obsidian-local-rest-api) 手动安装。

### 2. 安装浏览器扩展

目前需要以开发者模式加载：

1. 下载或 clone 本仓库到本地
2. 打开 Chrome，进入 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」，选择本仓库目录

## 使用方法

### 配置 API 连接

打开扩展的设置页面（点击扩展图标右上角 ⚙），填入 Local REST API 提供的地址和 API Key。

### 创建 Profile

每个 Profile 对应一套提取规则，你可以为不同网站创建不同的 Profile。

- **Profile 名称**：方便识别，如「博客文章」「视频收藏」
- **自动匹配网址**：开启后，访问匹配的网址时会自动选中该 Profile（支持 `*` 通配符）
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
| `{{DATE}}` | 当前日期（YYYY-MM-DD） |
| `{{TIMESTAMP}}` | 当前时间（ISO 格式） |

### 提取并保存

1. 在目标网页上点击 OBClipper 扩展图标
2. 选择对应的 Profile（如果配置了自动匹配会自动选中）
3. 预览提取到的变量值和保存路径
4. 点击「提取并保存」

## 导入 / 导出

在设置页面底部可以导出全部配置为 JSON 文件，也可以导入之前的配置，方便备份和迁移。
