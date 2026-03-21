import { t, loadLang, applyI18n } from "../shared/i18n.js";
import { AI_PROFILE_ID, getMatchedAIChatSite } from "../shared/ai-chat-config.js";
import { loadConfig } from "../shared/config.js";
import { matchUrl, renderTemplate, renderPathTemplate } from "../shared/template-utils.js";
import { escapeHtml, truncate } from "../shared/ui-helpers.js";

// ---- Status UI ----

function showStatus(msg, type) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "status " + type;
  el.style.display = "";
}

function hideStatus() {
  document.getElementById("status").style.display = "none";
}

// ---- Extract page content via defuddle ----

async function extractContent(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["lib/defuddle.js"],
    });
  } catch (e) {
    console.warn("[OBClipper] Failed to inject defuddle:", e.message);
    return "";
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (typeof Defuddle === "undefined") return "";
        try {
          const attempts = [
            { markdown: true },
            { markdown: true, removeHiddenElements: false },
            { markdown: true, removeHiddenElements: false, removeLowScoring: false, removePartialSelectors: false },
          ];
          for (const opts of attempts) {
            const result = new Defuddle(document, opts).parse();
            if (result.content && result.wordCount > 0) {
              return result.content;
            }
          }
          return "";
        } catch (e) {
          return "";
        }
      },
    });
    return results[0]?.result || "";
  } catch (e) {
    console.warn("[OBClipper] Content extraction failed:", e.message);
    return "";
  }
}

// ---- Extract AI chat content ----

async function extractAIChatContent(tabId, siteConfig) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["lib/defuddle.js"],
    });
  } catch (e) {
    console.warn("[OBClipper] Failed to inject defuddle for AI chat:", e.message);
    return "";
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (userSel, assistantSel, stripSel) => {
        if (!userSel || !assistantSel) return "";

        function htmlToMarkdown(html) {
          if (typeof Defuddle === "undefined") return html;
          try {
            const doc = new DOMParser().parseFromString(
              `<!DOCTYPE html><html><body><article>${html}</article></body></html>`, "text/html"
            );
            const result = new Defuddle(doc, {
              markdown: true,
              removeHiddenElements: false,
              removeLowScoring: false,
              removePartialSelectors: false,
            }).parse();
            return (result.content || html).trim();
          } catch (e) {
            return html;
          }
        }

        function toCallout(type, md) {
          const lines = md.split("\n");
          const header = type === "user" ? "> [!faq] User" : "> [!info] AI";
          return header + "\n" + lines.map((l) => "> " + l).join("\n");
        }

        const combined = `${userSel}, ${assistantSel}`;
        const allEls = document.querySelectorAll(combined);
        if (!allEls.length) return "";

        const blocks = [];
        for (const el of allEls) {
          const isUser = el.matches(userSel);
          const isAssistant = el.matches(assistantSel);
          if (!isUser && !isAssistant) continue;

          let html;
          if (isUser && stripSel) {
            const clone = el.cloneNode(true);
            clone.querySelectorAll(stripSel).forEach((n) => n.remove());
            html = clone.innerHTML;
          } else {
            html = el.innerHTML;
          }

          if (!html.trim()) continue;
          const md = htmlToMarkdown(html);
          if (!md.trim()) continue;
          blocks.push(toCallout(isUser ? "user" : "assistant", md));
        }

        return blocks.join("\n\n");
      },
      args: [siteConfig.userSelector, siteConfig.assistantSelector, siteConfig.userStripSelector || ""],
    });
    return results[0]?.result || "";
  } catch (e) {
    console.warn("[OBClipper] AI chat extraction failed:", e.message);
    return "";
  }
}

// ---- Extract variables from the active tab ----

async function extractVariables(selectors) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const [content, builtinBase] = await Promise.all([
    extractContent(tab.id),
    Promise.resolve({
      URL: tab.url || "",
      TITLE: tab.title || "",
      DATE: new Date().toISOString().split("T")[0],
      TIMESTAMP: new Date().toISOString(),
    }),
  ]);

  const builtinVars = { ...builtinBase, CONTENT: content };

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (sels) => {
      // Normalize special whitespace: replace all Unicode whitespace with regular space, collapse multiples
      function cleanText(s) {
        return s.replace(/[\s\u00A0\u2000-\u200F\u2028\u2029\u202F\u205F\u3000\uFEFF]+/g, " ").trim();
      }
      const out = {};
      for (const { name, selector, attr, attachment } of sels) {
        try {
          const el = document.querySelector(selector);
          if (!el) {
            out[name] = "";
          } else if (attr) {
            out[name] = el.getAttribute(attr) || "";
          } else if (attachment) {
            out[name] = el.getAttribute("src") || el.getAttribute("href") || "";
          } else {
            out[name] = cleanText(el.textContent);
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

  const transformEntries = selectors.filter((s) => s.transform);
  if (transformEntries.length === 0) return rawVars;

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
  // Encode each path segment separately so '/' is preserved
  const encodedPath = filePath.split("/").map(s => encodeURIComponent(s)).join("/");
  const url = `${apiUrl}/vault/${encodedPath}`;
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
    throw new Error(`${t("popup.obsidianApiError")} (${resp.status}): ${text}`);
  }
}

async function fileExists(apiUrl, apiKey, filePath) {
  const encodedPath = filePath.split("/").map(s => encodeURIComponent(s)).join("/");
  const url = `${apiUrl}/vault/${encodedPath}`;
  try {
    const resp = await fetch(url, {
      method: "HEAD",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return resp.ok;
  } catch (e) {
    return false;
  }
}

async function findAvailablePath(apiUrl, apiKey, dir, baseName, ext) {
  let filePath = dir + baseName + ext;
  if (!(await fileExists(apiUrl, apiKey, filePath))) return filePath;

  let i = 1;
  while (true) {
    filePath = dir + baseName + "-" + i + ext;
    if (!(await fileExists(apiUrl, apiKey, filePath))) return filePath;
    i++;
    if (i > 100) break;
  }
  return filePath;
}

// ---- Auto-link vault filenames ----

let _vaultFileCache = null;
let _vaultFileCacheTime = 0;
const VAULT_FILE_CACHE_TTL = 60000; // 1 minute

async function fetchAllVaultFiles(apiUrl, apiKey, excludeFolders) {
  // Return cached result if still fresh
  if (_vaultFileCache && (Date.now() - _vaultFileCacheTime) < VAULT_FILE_CACHE_TTL) {
    return filterFileNames(_vaultFileCache, excludeFolders);
  }

  const allFiles = [];
  const headers = { Authorization: `Bearer ${apiKey}` };

  async function listDir(dirPath) {
    const encodedPath = dirPath.split("/").map(s => encodeURIComponent(s)).join("/");
    const url = `${apiUrl}/vault/${encodedPath}`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) return;
    const data = await resp.json();
    const files = data.files || [];
    for (const f of files) {
      const fullPath = dirPath ? dirPath + f : f;
      if (f.endsWith("/")) {
        await listDir(fullPath);
      } else if (f.endsWith(".md")) {
        allFiles.push(fullPath);
      }
    }
  }

  await listDir("");
  _vaultFileCache = allFiles;
  _vaultFileCacheTime = Date.now();
  return filterFileNames(allFiles, excludeFolders);
}

function filterFileNames(allFiles, excludeFolders) {
  const excludes = excludeFolders
    .split(",")
    .map(f => f.trim())
    .filter(Boolean);

  const names = [];
  for (const filePath of allFiles) {
    const excluded = excludes.some(folder => {
      const prefix = folder.endsWith("/") ? folder : folder + "/";
      return filePath.startsWith(prefix);
    });
    if (excluded) continue;
    const parts = filePath.split("/");
    const basename = parts[parts.length - 1].replace(/\.md$/, "");
    if (basename) names.push(basename);
  }

  // Sort by length descending so longer names match first
  names.sort((a, b) => b.length - a.length);
  return [...new Set(names)];
}

function autoLinkContent(content, fileNames) {
  if (!content || !fileNames.length) return content;

  let result = content;
  for (const name of fileNames) {
    // Escape special regex characters in the filename
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Don't match if already wrapped in [[...]]
    const regex = new RegExp(`(?<!\\[\\[)${escaped}(?!\\]\\])`);
    if (regex.test(result)) {
      result = result.replace(regex, `[[${name}]]`);
    }
  }
  return result;
}

// Download image by drawing it on a canvas in the page context
async function fetchImageViaPage(fileUrl) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: async (url) => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const loaded = new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error("img load failed"));
        });
        img.src = url;
        await loaded;

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        let dataUrl;
        if (url.includes(".webp")) {
          dataUrl = canvas.toDataURL("image/webp", 1);
        } else if (url.includes(".jpg") || url.includes(".jpeg")) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        } else {
          dataUrl = canvas.toDataURL("image/png");
        }
        const contentType = dataUrl.substring(5, dataUrl.indexOf(";"));
        return { base64: dataUrl, contentType };
      } catch (e) {
        return { error: e.message };
      }
    },
    args: [fileUrl],
  });
  return results[0].result;
}

// Fallback: find an already-rendered <img> on the page with matching src
async function fetchImageFromDom(fileUrl) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: (url) => {
      try {
        const imgs = document.querySelectorAll("img");
        let img = null;
        for (const el of imgs) {
          if (el.src === url || el.currentSrc === url) {
            img = el;
            break;
          }
        }
        if (!img) {
          const urlPath = new URL(url).pathname;
          for (const el of imgs) {
            try {
              if (new URL(el.src).pathname === urlPath) {
                img = el;
                break;
              }
            } catch (e) { /* skip */ }
          }
        }
        if (!img || !img.naturalWidth) return { error: "img not found in DOM" };

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const contentType = "image/png";
          return { base64: dataUrl, contentType };
        } catch (e) {
          return { error: "canvas tainted: " + e.message };
        }
      } catch (e) {
        return { error: e.message };
      }
    },
    args: [fileUrl],
  });
  return results[0].result;
}

async function downloadAndSaveAttachment(apiUrl, apiKey, attachmentDir, fileUrl, desiredName) {
  // Strategy 1: canvas with crossOrigin (new Image load)
  let resp = await fetchImageViaPage(fileUrl);

  // Strategy 2: grab from existing DOM <img> element (already loaded, no new request)
  if (!resp || resp.error) {
    resp = await fetchImageFromDom(fileUrl);
  }

  // Strategy 3: background service worker fetch
  if (!resp || resp.error) {
    resp = await chrome.runtime.sendMessage({
      type: "fetch",
      url: fileUrl,
      options: { responseType: "binary" },
    });
  }

  if (!resp || resp.error) throw new Error(`${t("popup.downloadFail")}: ${resp?.error || fileUrl}`);
  if (!resp.base64) throw new Error(`${t("popup.downloadFail")}: ${fileUrl}`);

  // Determine extension from URL or content-type
  const urlPath = new URL(fileUrl).pathname;
  const urlFilename = urlPath.split("/").pop() || "";
  let ext = "";
  if (urlFilename.includes(".")) {
    ext = "." + urlFilename.split(".").pop();
  } else {
    const ct = resp.contentType || "";
    const guessed = ct.split("/")[1]?.split(";")[0] || "bin";
    ext = "." + guessed;
  }

  const baseName = (desiredName || "attachment").replace(/[\\/:*?"<>|]/g, "_").trim() || "attachment";

  const dir = attachmentDir.endsWith("/") ? attachmentDir : attachmentDir + "/";
  const filePath = await findAvailablePath(apiUrl, apiKey, dir, baseName, ext);

  // Convert base64 data URL back to blob
  const dataUrlResp = await fetch(resp.base64);
  const blob = await dataUrlResp.blob();

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
  await loadLang();
  applyI18n();

  currentConfig = await loadConfig();
  const profiles = currentConfig.profiles;

  document.getElementById("openOptions").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  document.getElementById("goOptions")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  const aiEnabled = currentConfig.aiProfile.enabled !== false;
  const hasProfiles = profiles.length > 0 || aiEnabled;

  if (!hasProfiles) {
    $mainView.style.display = "none";
    $emptyView.style.display = "";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab?.url || "";

  // Check user profiles for auto-match first
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

  // Then check AI profile
  if (!autoMatchedId && aiEnabled) {
    const aiSite = getMatchedAIChatSite(currentUrl);
    if (aiSite) {
      autoMatchedId = AI_PROFILE_ID;
    }
  }

  const selectedId = autoMatchedId
    || (currentConfig.defaultProfileId && profiles.some((p) => p.id === currentConfig.defaultProfileId)
        ? currentConfig.defaultProfileId
        : null);

  // Add AI profile option to dropdown (if enabled)
  if (aiEnabled) {
    const opt = document.createElement("option");
    opt.value = AI_PROFILE_ID;
    opt.textContent = t("popup.aiChat");
    if (autoMatchedId === AI_PROFILE_ID) {
      opt.textContent += " " + t("popup.autoMatched");
    }
    $select.appendChild(opt);
  }

  profiles.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name || t("popup.unnamed");
    if (p.id === autoMatchedId) {
      opt.textContent += " " + t("popup.autoMatched");
    } else if (!autoMatchedId && p.id === currentConfig.defaultProfileId) {
      opt.textContent += " " + t("popup.default");
    }
    $select.appendChild(opt);
  });

  if (selectedId) {
    $select.value = selectedId;
  }

  $select.addEventListener("change", () => onProfileSelected());
  $extractBtn.addEventListener("click", () => doExtractAndSave());

  onProfileSelected();
}

function isAIProfile() {
  return $select.value === AI_PROFILE_ID;
}

async function onProfileSelected() {
  hideStatus();
  currentVars = null;
  $preview.style.display = "none";
  $extractBtn.disabled = true;

  const isAI = isAIProfile();
  const profile = isAI ? null : currentConfig.profiles.find((p) => p.id === $select.value);
  if (!isAI && !profile) return;

  try {
    const selectors = isAI ? (currentConfig.aiProfile.selectors || []) : profile.selectors;
    currentVars = await extractVariables(selectors);

    if (isAI) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const siteConfig = getMatchedAIChatSite(tab.url);
      if (siteConfig) {
        currentVars.CONTENT = await extractAIChatContent(tab.id, siteConfig);
        if (siteConfig.titleSelector) {
          const titleResult = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (sel) => {
              try { const el = document.querySelector(sel); return el?.textContent?.trim() || ""; }
              catch (e) { return ""; }
            },
            args: [siteConfig.titleSelector],
          });
          const extracted = titleResult[0]?.result;
          if (extracted) currentVars.TITLE = extracted;
        }
      }
    }

    // Render preview
    $varPreview.innerHTML = "";
    const $contentField = document.getElementById("contentPreviewField");
    const $contentPreview = document.getElementById("contentPreview");
    $contentField.style.display = "none";

    for (const [key, val] of Object.entries(currentVars)) {
      if (key === "CONTENT") {
        $contentPreview.textContent = val || t("popup.empty");
        $contentField.style.display = "";
        continue;
      }
      const sels = isAI ? (currentConfig.aiProfile.selectors || []) : profile.selectors;
      const sel = sels.find((s) => s.name === key);
      const badge = sel?.attachment ? ` <span class="att-badge">${t("popup.attachBadge")}</span>` : "";
      const displayVal = val || `<span class="var-empty">${t("popup.empty")}</span>`;
      const row = document.createElement("div");
      row.className = "var-row";
      row.innerHTML = `<span class="var-key">${escapeHtml(key)}:${badge}</span><span class="var-val" title="${escapeHtml(truncate(val, 200))}">${val ? escapeHtml(truncate(val, 50)) : displayVal}</span>`;
      $varPreview.appendChild(row);
    }

    const DEFAULT_PATH = "Clipper/{{TITLE}}.md";
    const DEFAULT_AI_PATH = "AI Chat/{{TITLE}}.md";
    const vaultPath = isAI
      ? (currentConfig.aiProfile.vaultPath || DEFAULT_AI_PATH)
      : (profile.vaultPath || DEFAULT_PATH);
    const path = renderPathTemplate(vaultPath, currentVars);
    $pathPreview.textContent = path;

    $preview.style.display = "";
    $extractBtn.disabled = false;
  } catch (e) {
    showStatus(t("popup.extractFail") + e.message, "error");
  }
}

async function doExtractAndSave() {
  const isAI = isAIProfile();
  const profile = isAI ? null : currentConfig.profiles.find((p) => p.id === $select.value);
  if (!isAI && !profile) return;
  if (!currentVars) return;

  $extractBtn.disabled = true;
  $extractBtn.textContent = t("popup.saving");
  hideStatus();

  try {
    const varsForTemplate = { ...currentVars };

    // Auto-link vault filenames in CONTENT
    if (currentConfig.autoLinkEnabled && varsForTemplate.CONTENT) {
      try {
        const fileNames = await fetchAllVaultFiles(
          currentConfig.apiUrl,
          currentConfig.apiKey,
          currentConfig.autoLinkExcludeFolders
        );
        varsForTemplate.CONTENT = autoLinkContent(varsForTemplate.CONTENT, fileNames);
      } catch (e) {
        console.warn("[OBClipper] Auto-link failed:", e.message);
      }
    }

    if (isAI) {
      const ai = currentConfig.aiProfile;
      const templatePart = renderTemplate(ai.template || "", varsForTemplate);
      const fileContent = templatePart
        ? templatePart + "\n\n" + (varsForTemplate.CONTENT || "")
        : (varsForTemplate.CONTENT || "");
      const filePath = renderPathTemplate(ai.vaultPath || "AI Chat/{{TITLE}}.md", varsForTemplate);

      await saveToObsidian(currentConfig.apiUrl, currentConfig.apiKey, filePath, fileContent);
    } else {
      const attachmentSelectors = profile.selectors.filter((s) => s.attachment);
      for (const sel of attachmentSelectors) {
        const url = varsForTemplate[sel.name];
        if (!url) continue;
        const attachDir = profile.attachmentPath || "Attachment/";
        try {
          const attachName = varsForTemplate["TITLE"] || profile.name || "attachment";
          const savedPath = await downloadAndSaveAttachment(
            currentConfig.apiUrl, currentConfig.apiKey,
            renderPathTemplate(attachDir, varsForTemplate),
            url, attachName
          );
          varsForTemplate[sel.name] = savedPath;
        } catch (e) {
          console.warn(`[OBClipper] ${t("popup.attachDownloadFail", { name: sel.name })}`, e.message);
        }
      }
      const content = renderTemplate(profile.template || "", varsForTemplate);
      const filePath = renderPathTemplate(profile.vaultPath || "Clipper/{{TITLE}}.md", varsForTemplate);
      await saveToObsidian(currentConfig.apiUrl, currentConfig.apiKey, filePath, content);
    }

    showStatus(t("popup.saved"), "success");
  } catch (e) {
    showStatus(e.message, "error");
  }

  $extractBtn.disabled = false;
  $extractBtn.textContent = t("popup.extractBtn");
}

init();
