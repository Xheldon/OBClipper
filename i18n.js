const messages = {
  en: {
    // Options page
    "options.title": "Obsidian Clipper Settings",
    "options.subtitle": "Configure Obsidian API connection & Profiles",
    "api.title": "Obsidian API Config",
    "api.pluginLink": "Local REST API Plugin",
    "api.pluginHint": '(or search "Local REST API" in Obsidian plugin marketplace)',
    "api.urlLabel": "API URL",
    "api.keyLabel": "API Key",
    "api.keyPlaceholder": "Get from Obsidian plugin settings",
    "api.saveBtn": "Save API Config",
    "profiles.title": "Profiles",
    "profiles.addBtn": "+ New Profile",
    "profile.nameLabel": "Profile Name",
    "profile.namePlaceholder": "e.g. Blog Posts",
    "profile.unnamed": "Unnamed Profile",
    "profile.deleteBtn": "Delete",
    "profile.deleteConfirm": 'Delete Profile "{name}"?',
    "profile.autoMatch": "Auto-match URLs",
    "profile.urlPatternsLabel": "Match URLs (one per line, supports * wildcard)",
    "profile.selectorsLabel": "Variables & Selectors",
    "profile.helpVarName": "<b>Variable name</b>: Reference in template via {{name}}",
    "profile.helpSelector": "<b>CSS Selector</b>: Locate page elements, e.g. h1.title",
    "profile.helpAttr": "<b>Attribute</b>: Element attribute (e.g. src, href), leave empty for text content. For attachments, defaults to src",
    "profile.helpAttachment": "<b>Attachment</b>: Download URL value and save to attachment folder",
    "profile.helpTransform": "<b>JS Expression</b>: Process extracted value, variable 'value' is the text",
    "profile.addVarBtn": "+ Add Variable",
    "profile.showTransform": "Show JS transform code",
    "profile.templateLabel": "File Template (use {{variable}} to reference)",
    "profile.vaultPathLabel": "Save Path (relative to Vault root, e.g. Articles/{{title}}.md)",
    "profile.attachPathLabel": "Attachment Path (relative to Vault root, e.g. Attachments/)",
    "profile.saveBtn": "Save Profile",
    "selector.varName": "Variable",
    "selector.cssSelector": "CSS Selector",
    "selector.attr": "Attribute",
    "selector.attachmentLabel": "Attach",
    "selector.attachmentTitle": "Mark as attachment (value is URL, will download & save)",
    "selector.transformPlaceholder": "e.g. value.split('|')[0].trim()",
    "io.title": "Import / Export Config",
    "io.exportBtn": "Export All Config",
    "io.importBtn": "Import Config",
    "hint.saved": "Saved",
    "hint.exported": "Exported",
    "hint.imported": "Imported, page will reload",
    "hint.importFail": "Import failed: ",
    "hint.invalidConfig": "Invalid config file",
    "hint.noPath": "Please configure save path first",
    // Popup page
    "popup.settings": "Settings",
    "popup.selectProfile": "Select Profile",
    "popup.previewVars": "Preview Variables",
    "popup.savePath": "Save Path",
    "popup.extractBtn": "Extract & Save",
    "popup.saving": "Saving…",
    "popup.saved": "Saved to Obsidian!",
    "popup.emptyText": "No Profiles configured yet. Please create one in Settings.",
    "popup.openSettings": "Open Settings",
    "popup.unnamed": "Unnamed",
    "popup.autoMatched": "(auto-matched)",
    "popup.extractFail": "Extract failed: ",
    "popup.noPath": "Please configure save path first",
    "popup.empty": "(empty)",
    "popup.attachBadge": "Attach",
    "popup.attachmentError": 'Variable "{name}" marked as attachment, but no attachment path configured',
    "popup.attachDownloadFail": 'Attachment "{name}" download failed: ',
    "popup.obsidianApiError": "Obsidian API error",
    "popup.downloadFail": "Download attachment failed",
  },
  zh: {
    // Options page
    "options.title": "Obsidian Clipper 设置",
    "options.subtitle": "配置 Obsidian API 连接 & Profile",
    "api.title": "Obsidian API 配置",
    "api.pluginLink": "Local REST API 插件",
    "api.pluginHint": '（也可在 Obsidian 插件市场搜索 "Local REST API" 安装）',
    "api.urlLabel": "API 地址",
    "api.keyLabel": "API Key",
    "api.keyPlaceholder": "在 Obsidian 插件设置中获取",
    "api.saveBtn": "保存 API 配置",
    "profiles.title": "Profiles",
    "profiles.addBtn": "+ 新建 Profile",
    "profile.nameLabel": "Profile 名称",
    "profile.namePlaceholder": "例如：博客文章",
    "profile.unnamed": "未命名 Profile",
    "profile.deleteBtn": "删除",
    "profile.deleteConfirm": "确定删除 Profile「{name}」吗？",
    "profile.autoMatch": "自动匹配网址",
    "profile.urlPatternsLabel": "匹配网址（每行一个，支持 * 通配符）",
    "profile.selectorsLabel": "变量 & 选择器",
    "profile.helpVarName": "<b>变量名</b>：在模板中通过 {{变量名}} 引用",
    "profile.helpSelector": "<b>CSS 选择器</b>：用于定位页面元素，如 h1.title",
    "profile.helpAttr": "<b>属性</b>：填写元素属性名（如 src、href），留空则取文本内容。附件类型默认取 src",
    "profile.helpAttachment": "<b>附件</b>：勾选后值将作为 URL 下载并保存到附件目录",
    "profile.helpTransform": "<b>JS 表达式</b>：对提取值进行二次处理，变量 value 为提取的文本",
    "profile.addVarBtn": "+ 添加变量",
    "profile.showTransform": "显示 JS 处理代码",
    "profile.templateLabel": "文件模板（使用 {{变量名}} 引用）",
    "profile.vaultPathLabel": "保存路径（相对 Vault 根目录，如：Articles/{{title}}.md）",
    "profile.attachPathLabel": "附件存储路径（相对 Vault 根目录，如：Attachments/）",
    "profile.saveBtn": "保存 Profile",
    "selector.varName": "变量名",
    "selector.cssSelector": "CSS 选择器",
    "selector.attr": "属性",
    "selector.attachmentLabel": "附件",
    "selector.attachmentTitle": "标记为附件（值为 URL，将下载保存）",
    "selector.transformPlaceholder": "如：value.split('|')[0].trim()",
    "io.title": "导入 / 导出配置",
    "io.exportBtn": "导出全部配置",
    "io.importBtn": "导入配置",
    "hint.saved": "已保存",
    "hint.exported": "已导出",
    "hint.imported": "已导入，页面将刷新",
    "hint.importFail": "导入失败: ",
    "hint.invalidConfig": "无效的配置文件",
    "hint.noPath": "请先配置保存路径",
    // Popup page
    "popup.settings": "设置",
    "popup.selectProfile": "选择 Profile",
    "popup.previewVars": "预览变量",
    "popup.savePath": "保存路径",
    "popup.extractBtn": "提取并保存",
    "popup.saving": "保存中…",
    "popup.saved": "已保存到 Obsidian!",
    "popup.emptyText": "还没有配置 Profile，请先去设置页面创建。",
    "popup.openSettings": "打开设置",
    "popup.unnamed": "未命名",
    "popup.autoMatched": "(自动匹配)",
    "popup.extractFail": "提取变量失败: ",
    "popup.noPath": "请先配置保存路径",
    "popup.empty": "(空)",
    "popup.attachBadge": "附件",
    "popup.attachmentError": "变量「{name}」标记为附件，但未配置附件存储路径",
    "popup.attachDownloadFail": "附件「{name}」下载失败: ",
    "popup.obsidianApiError": "Obsidian API 错误",
    "popup.downloadFail": "下载附件失败",
  },
};

let currentLang = "en";

function t(key, params) {
  let text = messages[currentLang]?.[key] || messages.en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

async function loadLang() {
  const { lang } = await chrome.storage.local.get(["lang"]);
  currentLang = lang || "en";
  return currentLang;
}

async function saveLang(lang) {
  currentLang = lang;
  await chrome.storage.local.set({ lang });
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
}
