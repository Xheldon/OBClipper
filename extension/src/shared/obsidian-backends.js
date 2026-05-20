import { t } from "./i18n.js";

const BACKEND_LOCAL_REST = "local-rest";
const BACKEND_VAULT_ECHO = "vault-echo";
const DEFAULT_BACKEND_TYPE = BACKEND_LOCAL_REST;

const OBSIDIAN_BACKENDS = {
  [BACKEND_LOCAL_REST]: {
    labelKey: "api.backend.localRest",
    linkKey: "api.localRestLink",
    hintKey: "api.backendHint.localRest",
    keyPlaceholderKey: "api.keyPlaceholder.localRest",
    defaultUrl: "https://127.0.0.1:27124",
    docsUrl: "https://github.com/coddingtonbear/obsidian-local-rest-api",
  },
  [BACKEND_VAULT_ECHO]: {
    labelKey: "api.backend.vaultEcho",
    linkKey: "api.vaultEchoLink",
    hintKey: "api.backendHint.vaultEcho",
    keyPlaceholderKey: "api.keyPlaceholder.vaultEcho",
    defaultUrl: "http://127.0.0.1:8787",
    docsUrl: "https://github.com/Xheldon/VaultEcho",
  },
};

function normalizeBackendType(type) {
  return OBSIDIAN_BACKENDS[type] ? type : DEFAULT_BACKEND_TYPE;
}

function defaultApiBackends() {
  return Object.fromEntries(
    Object.entries(OBSIDIAN_BACKENDS).map(([type, meta]) => [
      type,
      { apiUrl: meta.defaultUrl, apiKey: "" },
    ])
  );
}

function normalizeApiBackends(apiBackends, legacyUrl, legacyKey, legacyBackend = DEFAULT_BACKEND_TYPE) {
  const normalized = defaultApiBackends();

  if (apiBackends && typeof apiBackends === "object") {
    for (const type of Object.keys(OBSIDIAN_BACKENDS)) {
      const source = apiBackends[type];
      if (!source || typeof source !== "object") continue;
      normalized[type] = {
        apiUrl: String(source.apiUrl || source.url || OBSIDIAN_BACKENDS[type].defaultUrl).trim(),
        apiKey: String(source.apiKey ?? source.key ?? ""),
      };
    }
  }

  if (legacyUrl !== undefined || legacyKey !== undefined) {
    const type = normalizeBackendType(legacyBackend);
    if (!apiBackends || !apiBackends[type]) {
      normalized[type] = {
        apiUrl: String(legacyUrl || OBSIDIAN_BACKENDS[type].defaultUrl).trim(),
        apiKey: String(legacyKey || ""),
      };
    }
  }

  return normalized;
}

function activeApiConfig(config) {
  const type = normalizeBackendType(config.apiBackend);
  const backends = normalizeApiBackends(config.apiBackends, config.apiUrl, config.apiKey, type);
  const active = backends[type] || defaultApiBackends()[type];
  return {
    type,
    apiUrl: active.apiUrl || OBSIDIAN_BACKENDS[type].defaultUrl,
    apiKey: active.apiKey || "",
  };
}

function backendMeta(type) {
  return OBSIDIAN_BACKENDS[normalizeBackendType(type)];
}

function isVaultEchoBackend(config) {
  return activeApiConfig(config).type === BACKEND_VAULT_ECHO;
}

function joinUrl(baseUrl, path) {
  return `${String(baseUrl || "").replace(/\/+$/, "")}${path}`;
}

function encodeVaultPath(filePath) {
  return String(filePath || "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function authHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}

async function responseError(response) {
  const text = await response.text();
  let message = text;
  try {
    const data = JSON.parse(text);
    message = data.error || data.message || data.result?.error || text;
  } catch {
    // Keep raw text.
  }
  return new Error(`${t("popup.obsidianApiError")} (${response.status}): ${message}`);
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    if (!response.ok) throw new Error(`${t("popup.obsidianApiError")} (${response.status}): ${text}`);
    throw new Error(`${t("popup.obsidianApiError")}: invalid JSON response`);
  }
}

function ensureVaultEchoOk(response, data) {
  if (!response.ok || data.ok === false || data.result?.ok === false) {
    const message = data.error || data.message || data.result?.error || JSON.stringify(data);
    throw new Error(`${t("popup.obsidianApiError")} (${response.status}): ${message}`);
  }
}

async function saveLocalRestFile(backend, filePath, content, contentType) {
  const encodedPath = encodeVaultPath(filePath);
  const response = await fetch(joinUrl(backend.apiUrl, `/vault/${encodedPath}`), {
    method: "PUT",
    headers: {
      ...authHeaders(backend.apiKey),
      "Content-Type": contentType,
    },
    body: content,
  });

  if (!response.ok && response.status !== 204) {
    throw await responseError(response);
  }

  return { path: filePath };
}

async function saveVaultEchoMarkdown(backend, filePath, content) {
  const response = await fetch(joinUrl(backend.apiUrl, "/v1/api/files/write"), {
    method: "POST",
    headers: {
      ...authHeaders(backend.apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: filePath, content: String(content ?? "") }),
  });
  const data = await readJsonResponse(response);
  ensureVaultEchoOk(response, data);
  return { path: data.result?.path || filePath };
}

async function uploadVaultEchoAttachment(backend, blob, filename, alt) {
  const form = new FormData();
  form.append("type", attachmentTypeForContentType(blob.type));
  form.append("alt", alt || filenameWithoutExtension(filename));
  form.append("file", blob, filename);

  const response = await fetch(joinUrl(backend.apiUrl, "/v1/api/attachments/upload"), {
    method: "POST",
    headers: authHeaders(backend.apiKey),
    body: form,
  });
  const data = await readJsonResponse(response);
  ensureVaultEchoOk(response, data);
  return { path: data.path || data.result?.path || filename };
}

async function saveFileToObsidian(config, filePath, content, contentType = "text/markdown") {
  const backend = activeApiConfig(config);
  if (backend.type === BACKEND_VAULT_ECHO) {
    if (content instanceof Blob) {
      return uploadVaultEchoAttachment(backend, content, basename(filePath), filenameWithoutExtension(filePath));
    }
    return saveVaultEchoMarkdown(backend, filePath, content);
  }
  return saveLocalRestFile(backend, filePath, content, contentType);
}

async function saveAttachmentToObsidian(config, filePath, blob, alt = "") {
  const backend = activeApiConfig(config);
  if (backend.type === BACKEND_VAULT_ECHO) {
    return uploadVaultEchoAttachment(backend, blob, basename(filePath), alt);
  }
  return saveLocalRestFile(backend, filePath, blob, blob.type || "application/octet-stream");
}

async function fileExistsInObsidian(config, filePath) {
  const backend = activeApiConfig(config);
  try {
    if (backend.type === BACKEND_VAULT_ECHO) {
      const url = new URL(joinUrl(backend.apiUrl, "/v1/api/files/read"));
      url.searchParams.set("path", filePath);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: authHeaders(backend.apiKey),
      });
      if (!response.ok) return false;
      const data = await readJsonResponse(response);
      return data.ok !== false && data.result?.ok !== false;
    }

    const encodedPath = encodeVaultPath(filePath);
    const response = await fetch(joinUrl(backend.apiUrl, `/vault/${encodedPath}`), {
      method: "HEAD",
      headers: authHeaders(backend.apiKey),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function basename(filePath) {
  return String(filePath || "").split("/").filter(Boolean).pop() || "attachment";
}

function filenameWithoutExtension(filePath) {
  const name = basename(filePath);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

function attachmentTypeForContentType(contentType = "") {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("video/")) return "video";
  return "file";
}

export {
  BACKEND_LOCAL_REST,
  BACKEND_VAULT_ECHO,
  DEFAULT_BACKEND_TYPE,
  OBSIDIAN_BACKENDS,
  activeApiConfig,
  backendMeta,
  defaultApiBackends,
  fileExistsInObsidian,
  isVaultEchoBackend,
  normalizeApiBackends,
  normalizeBackendType,
  saveAttachmentToObsidian,
  saveFileToObsidian,
};
