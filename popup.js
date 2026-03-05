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
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp("^" + escaped + "$").test(url);
}

function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

function sanitizeForPath(str) {
  return str
    .replace(/[\\:*?"<>|]/g, "_")
    .replace(/\.\.\//g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderPathTemplate(template, vars) {
  const sanitized = {};
  for (const [k, v] of Object.entries(vars)) {
    sanitized[k] = sanitizeForPath(v);
  }
  return renderTemplate(template, sanitized);
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

  const builtinVars = {
    URL: tab.url || "",
    TITLE: tab.title || "",
    DATE: new Date().toISOString().split("T")[0],
    TIMESTAMP: new Date().toISOString(),
  };

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

// Download image by drawing it on a canvas in the page context
// This works because the <img> is already loaded by the page (with correct referer/cookies)
// We just need to extract the pixel data via canvas
async function fetchImageViaPage(fileUrl) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: async (url) => {
      try {
        // Create an image element and load it (browser uses page's context for the request)
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

        // Try to get as original format; fall back to png
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

// Fallback: find an already-rendered <img> on the page with matching src and draw it to canvas
async function fetchImageFromDom(fileUrl) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: (url) => {
      try {
        // Find the img element on the page that matches the URL
        const imgs = document.querySelectorAll("img");
        let img = null;
        for (const el of imgs) {
          if (el.src === url || el.currentSrc === url) {
            img = el;
            break;
          }
        }
        // Also try matching by partial path
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
        // No crossOrigin set on the original img, so canvas is not tainted
        // (same-origin images or images served without CORS headers still work)
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

  if (profiles.length === 0) {
    $mainView.style.display = "none";
    $emptyView.style.display = "";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab?.url || "";

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

  profiles.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name || t("popup.unnamed");
    if (p.id === autoMatchedId) {
      opt.textContent += " " + t("popup.autoMatched");
    }
    $select.appendChild(opt);
  });

  if (autoMatchedId) {
    $select.value = autoMatchedId;
  }

  $select.addEventListener("change", () => onProfileSelected());
  $extractBtn.addEventListener("click", () => doExtractAndSave());

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

    $varPreview.innerHTML = "";
    for (const [key, val] of Object.entries(currentVars)) {
      const sel = profile.selectors.find((s) => s.name === key);
      const badge = sel?.attachment ? ` <span class="att-badge">${t("popup.attachBadge")}</span>` : "";
      const displayVal = val || `<span class="var-empty">${t("popup.empty")}</span>`;
      const row = document.createElement("div");
      row.className = "var-row";
      row.innerHTML = `<span class="var-key">${escapeHtml(key)}:${badge}</span><span class="var-val" title="${escapeHtml(val)}">${val ? escapeHtml(truncate(val, 50)) : displayVal}</span>`;
      $varPreview.appendChild(row);
    }

    const path = renderPathTemplate(profile.vaultPath || "", currentVars);
    $pathPreview.textContent = path || `(${t("popup.noPath")})`;

    $preview.style.display = "";
    $extractBtn.disabled = false;
  } catch (e) {
    showStatus(t("popup.extractFail") + e.message, "error");
  }
}

async function doExtractAndSave() {
  const profile = currentConfig.profiles.find((p) => p.id === $select.value);
  if (!profile || !currentVars) return;

  $extractBtn.disabled = true;
  $extractBtn.textContent = t("popup.saving");
  hideStatus();

  try {
    const varsForTemplate = { ...currentVars };
    const attachmentSelectors = profile.selectors.filter((s) => s.attachment);

    for (const sel of attachmentSelectors) {
      const url = varsForTemplate[sel.name];
      if (!url) continue;

      if (!profile.attachmentPath) {
        throw new Error(t("popup.attachmentError", { name: sel.name }));
      }

      try {
        const attachName = varsForTemplate["title"] || profile.name || "attachment";
        const savedPath = await downloadAndSaveAttachment(
          currentConfig.apiUrl,
          currentConfig.apiKey,
          renderPathTemplate(profile.attachmentPath, varsForTemplate),
          url,
          attachName
        );
        varsForTemplate[sel.name] = savedPath;
      } catch (e) {
        console.warn(`[Obsidian-Clipper] ${t("popup.attachDownloadFail", { name: sel.name })}`, e.message);
        // Keep original URL so template still has a usable value
      }
    }

    const content = renderTemplate(profile.template || "", varsForTemplate);
    const filePath = renderPathTemplate(profile.vaultPath || "", varsForTemplate);

    if (!filePath) {
      showStatus(t("popup.noPath"), "error");
      $extractBtn.disabled = false;
      $extractBtn.textContent = t("popup.extractBtn");
      return;
    }

    await saveToObsidian(
      currentConfig.apiUrl,
      currentConfig.apiKey,
      filePath,
      content
    );
    showStatus(t("popup.saved"), "success");
  } catch (e) {
    showStatus(e.message, "error");
  }

  $extractBtn.disabled = false;
  $extractBtn.textContent = t("popup.extractBtn");
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
