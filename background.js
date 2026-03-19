// Background service worker — handles fetch requests that may be blocked by CORS in popup

// ---- External message handler (community profile import) ----

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg.type === "importProfile" && msg.profile) {
    handleImportProfile(msg.profile).then(sendResponse).catch((e) => sendResponse({ success: false, error: e.message }));
    return true;
  }
});

async function handleImportProfile(profile) {
  const { profiles } = await chrome.storage.local.get("profiles");
  const list = profiles || [];
  const newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const imported = {
    id: newId,
    name: profile.name || "",
    autoMatch: !!profile.autoMatch,
    urlPatterns: profile.urlPatterns || [],
    selectors: profile.selectors || [],
    template: profile.template || "",
    vaultPath: profile.vaultPath || "",
    attachmentPath: profile.attachmentPath || "",
    source: "community",
  };
  list.push(imported);
  await chrome.storage.local.set({ profiles: list });
  // Open options page scrolled to new profile
  chrome.tabs.create({ url: chrome.runtime.getURL(`options.html?highlight=${newId}`) });
  return { success: true, id: newId };
}

// ---- Internal message handler ----

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "fetch") {
    doFetch(msg.url, msg.options)
      .then(sendResponse)
      .catch((e) => sendResponse({ error: e.message }));
    return true; // keep channel open for async response
  }
});

async function doFetch(url, options = {}) {
  // Build fetch init with optional headers (e.g. Referer for anti-hotlink)
  const init = {};
  if (options.headers) {
    init.headers = options.headers;
  }
  const resp = await fetch(url, init);
  const contentType = resp.headers.get("content-type") || "";

  if (!resp.ok) {
    const text = await resp.text();
    return { ok: false, status: resp.status, text, contentType };
  }

  // For binary content (images, etc), return as base64 data URL
  if (
    contentType.startsWith("image/") ||
    contentType.startsWith("audio/") ||
    contentType.startsWith("video/") ||
    contentType === "application/octet-stream" ||
    options.responseType === "binary"
  ) {
    const blob = await resp.blob();
    const base64 = await blobToBase64(blob);
    return { ok: true, status: resp.status, base64, contentType: blob.type || contentType };
  }

  // For text content
  const text = await resp.text();
  return { ok: true, status: resp.status, text, contentType };
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
