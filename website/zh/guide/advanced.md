# 高级功能

## JS 转换与沙箱

用户定义的 JavaScript 转换在**沙箱 iframe** 中运行，确保安全。转换表达式接收提取的值作为 `value`，应返回转换后的结果。

```javascript
// 从 URL 提取域名
new URL(value).hostname

// 格式化日期
new Date(value).toISOString().slice(0, 10)

// 清理空白字符
value.replace(/\s+/g, ' ').trim()
```

## 导入 / 导出

### 全量配置导出

在设置 → **导入 / 导出** 中：

- **导出全部配置** — 下载包含所有设置、Profile 和 API 配置的 JSON 文件
- **导入配置** — 上传之前导出的 JSON 文件以恢复设置

### 单个 Profile 导出

每个 Profile 的删除按钮旁边都有一个**导出**按钮，可以单独下载该 Profile 的 JSON 文件 — 方便提交到[社区 Profile 集合](/zh/community)。

## 配置同步

通过 Google 账户在多台 Chrome 浏览器之间同步 Profile 和设置：

- **推送到云端** — 将 Profile、AI 对话配置和自动双链设置上传到 Chrome 同步存储
- **从云端拉取** — 下载并应用同步的配置

::: tip
API URL 和 API Key **永远不会被同步** — 它们保留在每台设备本地，因为不同设备的 Obsidian REST API 地址可能不同。
:::

## 附件下载

当变量被标记为**附件**时，OBClipper 将其值视为 URL 并下载文件。下载使用多策略回退：

1. **Canvas fetch** — 使用 `crossOrigin` 加载图片并通过 canvas 提取
2. **DOM 图片提取** — 直接从页面 DOM 读取图片数据
3. **后台 Service Worker** — 使用扩展的后台脚本绕过 CORS 限制

下载的附件会转换为 base64 并上传到你 Vault 的配置附件路径。

## 内容提取

OBClipper 使用 [defuddle](https://github.com/kepano/defuddle) 从网页中提取主要内容。它会自动：

- 移除导航、广告和样板内容
- 将 HTML 转换为干净的 Markdown
- 保留格式、链接和图片
