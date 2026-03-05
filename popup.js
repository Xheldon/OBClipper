// ---- Helpers ----

async function loadConfig() {
  const { apiUrl, apiKey, profiles } = await chrome.storage.local.get([
    "apiUrl",
    "apiKey",
    "profiles",
  ]);
  return {
    apiUrl: apiUrl || "https://127.0.0.1:27124",
    apiKey: apiKey || "",
    profiles: profiles || [],
  };
}

function matchUrl(pattern, url) {
  // Convert wildcard pattern to regex
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp("^" + escaped + "$").test(url);
}

function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

function showStatus(msg, type) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "status " + type;
  el.style.display = "";
}

function hideStatus() {
  document.getElementById("status").style.display = "none";
}

// ---- Extract variables from the active tab ----

async function extractVariables(selectors) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Built-in variables
  const builtinVars = {
    URL: tab.url || "",
    TITLE: tab.title || "",
    DATE: new Date().toISOString().split("T")[0],
    TIMESTAMP: new Date().toISOString(),
  };

  // Step 1: Extract raw values from page (supports attr for element attributes)
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sels) => {
      const out = {};
      for (const { name, selector, attr } of sels) {
        try {
          const el = document.querySelector(selector);
          if (!el) {
            out[name] = "";
          } else if (attr) {
            out[name] = el.getAttribute(attr) || "";
          } else {
            out[name] = el.textContent.trim();
          }
        } catch (e) {
          out[name] = "";
        }
      }
      return out;
    },
    args: [selectors],
  });
  const rawVars = { ...builtinVars, ...results[0].result };

  // Step 2: If any transforms, run them in page context via a second injection.
  // We build a dynamic function body string and inject it using chrome.scripting.executeScript
  // with world:"MAIN". Code injected this way by an extension bypasses the page's CSP.
  const transformEntries = selectors.filter((s) => s.transform);
  if (transformEntries.length === 0) return rawVars;

  // Build transform map to send as arg
  const transformMap = {};
  for (const { name, transform } of transformEntries) {
    transformMap[name] = transform;
  }

  const transformed = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: (vars, tMap) => {
      const result = { ...vars };
      for (const [name, expr] of Object.entries(tMap)) {
        try {
          const value = vars[name];
          result[name] = new Function("value", "return (" + expr + ")")(value);
        } catch (e) {
          result[name] = "";
        }
      }
      return result;
    },
    args: [rawVars, transformMap],
  });
  return transformed[0].result;
}

// ---- Save to Obsidian ----

async function saveToObsidian(apiUrl, apiKey, filePath, content, contentType = "text/markdown") {
  const url = `${apiUrl}/vault/${encodeURIComponent(filePath)}`;
  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": contentType,
    },
    body: content,
  });
  if (!resp.ok && resp.status !== 204) {
    const text = await resp.text();
    throw new Error(`Obsidian API 错误 (${resp.status}): ${text}`);
  }
}

async function fileExists(apiUrl, apiKey, filePath) {
  const url = `${apiUrl}/vault/${encodeURIComponent(filePath)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  return resp.ok;
}

async function findAvailablePath(apiUrl, apiKey, dir, baseName, ext) {
  let filePath = dir + baseName + ext;
  if (!(await fileExists(apiUrl, apiKey, filePath))) return filePath;

  let i = 1;
  while (true) {
    filePath = dir + baseName + "-" + i + ext;
    if (!(await fileExists(apiUrl, apiKey, filePath))) return filePath;
    i++;
    if (i > 100) break; // safety limit
  }
  return filePath;
}

async function downloadAndSaveAttachment(apiUrl, apiKey, attachmentDir, fileUrl, desiredName) {
  // Download the file
  const resp = await fetch(fileUrl);
  if (!resp.ok) throw new Error(`下载附件失败 (${resp.status}): ${fileUrl}`);
  const blob = await resp.blob();

  // Determine extension from URL or content-type
  const urlPath = new URL(fileUrl).pathname;
  const urlFilename = urlPath.split("/").pop() || "";
  let ext = "";
  if (urlFilename.includes(".")) {
    ext = "." + urlFilename.split(".").pop();
  } else {
    const ct = resp.headers.get("content-type") || "";
    const guessed = ct.split("/")[1]?.split(";")[0] || "bin";
    ext = "." + guessed;
  }

  // Use desired name (from template vars, e.g. title) as base filename
  // Sanitize: remove characters not allowed in filenames
  const baseName = (desiredName || "attachment").replace(/[\\/:*?"<>|]/g, "_").trim() || "attachment";

  const dir = attachmentDir.endsWith("/") ? attachmentDir : attachmentDir + "/";
  const filePath = await findAvailablePath(apiUrl, apiKey, dir, baseName, ext);

  await saveToObsidian(apiUrl, apiKey, filePath, blob, blob.type || "application/octet-stream");
  return filePath;
}

// ---- Main ----

const $select = document.getElementById("profileSelect");
const $extractBtn = document.getElementById("extractBtn");
const $preview = document.getElementById("previewSection");
const $varPreview = document.getElementById("varPreview");
const $pathPreview = document.getElementById("pathPreview");
const $mainView = document.getElementById("mainView");
const $emptyView = document.getElementById("emptyView");

let currentConfig = null;
let currentVars = null;

async function init() {
  currentConfig = await loadConfig();
  const profiles = currentConfig.profiles;

  // Open options links
  document.getElementById("openOptions").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  document.getElementById("goOptions")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  if (profiles.length === 0) {
    $mainView.style.display = "none";
    $emptyView.style.display = "";
    return;
  }

  // Get current tab URL for auto-matching
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab?.url || "";

  // Find auto-matched profile
  let autoMatchedId = null;
  for (const p of profiles) {
    if (
      p.autoMatch &&
      p.urlPatterns &&
      p.urlPatterns.some((pat) => matchUrl(pat, currentUrl))
    ) {
      autoMatchedId = p.id;
      break;
    }
  }

  // Populate select
  profiles.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name || "未命名";
    if (p.id === autoMatchedId) {
      opt.textContent += " (自动匹配)";
    }
    $select.appendChild(opt);
  });

  if (autoMatchedId) {
    $select.value = autoMatchedId;
  }

  $select.addEventListener("change", () => onProfileSelected());
  $extractBtn.addEventListener("click", () => doExtractAndSave());

  // Trigger initial selection
  onProfileSelected();
}

async function onProfileSelected() {
  hideStatus();
  currentVars = null;
  $preview.style.display = "none";
  $extractBtn.disabled = true;

  const profile = currentConfig.profiles.find((p) => p.id === $select.value);
  if (!profile || !profile.selectors.length) return;

  try {
    currentVars = await extractVariables(profile.selectors);

    // Show variable preview
    $varPreview.innerHTML = "";
    for (const [key, val] of Object.entries(currentVars)) {
      const sel = profile.selectors.find((s) => s.name === key);
      const badge = sel?.attachment ? ' <span class="att-badge">附件</span>' : "";
      const displayVal = val || '<span class="var-empty">(空)</span>';
      const row = document.createElement("div");
      row.className = "var-row";
      row.innerHTML = `<span class="var-key">${escapeHtml(key)}:${badge}</span><span class="var-val" title="${escapeHtml(val)}">${val ? escapeHtml(truncate(val, 50)) : displayVal}</span>`;
      $varPreview.appendChild(row);
    }

    // Show path preview
    const path = renderTemplate(profile.vaultPath || "", currentVars);
    $pathPreview.textContent = path || "(未配置路径)";

    $preview.style.display = "";
    $extractBtn.disabled = false;
  } catch (e) {
    showStatus("提取变量失败: " + e.message, "error");
  }
}

async function doExtractAndSave() {
  const profile = currentConfig.profiles.find((p) => p.id === $select.value);
  if (!profile || !currentVars) return;

  $extractBtn.disabled = true;
  $extractBtn.textContent = "保存中…";
  hideStatus();

  try {
    // Process attachments: download and save, replace var value with vault path
    const varsForTemplate = { ...currentVars };
    const attachmentSelectors = profile.selectors.filter((s) => s.attachment);

    for (const sel of attachmentSelectors) {
      const url = varsForTemplate[sel.name];
      if (!url) continue;

      if (!profile.attachmentPath) {
        throw new Error(`变量「${sel.name}」标记为附件，但未配置附件存储路径`);
      }

      try {
        // Use title var (or profile name) as attachment filename
        const attachName = varsForTemplate["title"] || profile.name || "attachment";
        const savedPath = await downloadAndSaveAttachment(
          currentConfig.apiUrl,
          currentConfig.apiKey,
          renderTemplate(profile.attachmentPath, varsForTemplate),
          url,
          attachName
        );
        varsForTemplate[sel.name] = savedPath;
      } catch (e) {
        console.warn(`[Obsidian-Clipper] 附件「${sel.name}」下载失败:`, e.message);
        varsForTemplate[sel.name] = "";
      }
    }

    const content = renderTemplate(profile.template || "", varsForTemplate);
    const filePath = renderTemplate(profile.vaultPath || "", varsForTemplate);

    if (!filePath) {
      showStatus("请先配置保存路径", "error");
      $extractBtn.disabled = false;
      $extractBtn.textContent = "提取并保存";
      return;
    }

    await saveToObsidian(
      currentConfig.apiUrl,
      currentConfig.apiKey,
      filePath,
      content
    );
    showStatus("已保存到 Obsidian!", "success");
  } catch (e) {
    showStatus(e.message, "error");
  }

  $extractBtn.disabled = false;
  $extractBtn.textContent = "提取并保存";
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

init();
