// Background service worker — handles fetch requests that may be blocked by CORS in popup

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
