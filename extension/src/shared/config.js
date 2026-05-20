import {
  DEFAULT_BACKEND_TYPE,
  activeApiConfig,
  normalizeApiBackends,
  normalizeBackendType,
} from "./obsidian-backends.js";

// ---- Storage helpers ----

async function loadConfig() {
  const {
    apiBackend,
    apiBackends,
    apiUrl,
    apiKey,
    profiles,
    defaultProfileId,
    aiProfile,
  } = await chrome.storage.local.get([
    "apiBackend",
    "apiBackends",
    "apiUrl",
    "apiKey",
    "profiles",
    "defaultProfileId",
    "aiProfile",
  ]);

  const normalizedBackend = normalizeBackendType(apiBackend || DEFAULT_BACKEND_TYPE);
  const normalizedBackends = normalizeApiBackends(apiBackends, apiUrl, apiKey, normalizedBackend);
  const active = activeApiConfig({
    apiBackend: normalizedBackend,
    apiBackends: normalizedBackends,
  });

  return {
    apiBackend: normalizedBackend,
    apiBackends: normalizedBackends,
    apiUrl: active.apiUrl,
    apiKey: active.apiKey,
    profiles: profiles || [],
    defaultProfileId: defaultProfileId || null,
    aiProfile: aiProfile || { enabled: true, template: "", vaultPath: "", selectors: [] },
  };
}

async function saveApiConfig(backendType, url, key) {
  const { apiBackend: storedBackend, apiBackends, apiUrl, apiKey } = await chrome.storage.local.get([
    "apiBackend",
    "apiBackends",
    "apiUrl",
    "apiKey",
  ]);
  const apiBackend = normalizeBackendType(backendType);
  const normalizedBackends = normalizeApiBackends(
    apiBackends,
    apiUrl,
    apiKey,
    storedBackend || DEFAULT_BACKEND_TYPE
  );
  normalizedBackends[apiBackend] = {
    apiUrl: String(url || "").trim(),
    apiKey: String(key || ""),
  };
  await chrome.storage.local.set({
    apiBackend,
    apiBackends: normalizedBackends,
    // Legacy keys are kept in sync for old exports and older extension builds.
    apiUrl: normalizedBackends[apiBackend].apiUrl,
    apiKey: normalizedBackends[apiBackend].apiKey,
  });
}

function apiConfigStorageFromImport(data) {
  const apiBackend = normalizeBackendType(data.apiBackend || DEFAULT_BACKEND_TYPE);
  const apiBackends = normalizeApiBackends(data.apiBackends, data.apiUrl, data.apiKey, apiBackend);
  const active = activeApiConfig({ apiBackend, apiBackends });
  return {
    apiBackend,
    apiBackends,
    apiUrl: active.apiUrl,
    apiKey: active.apiKey,
  };
}

async function saveProfiles(profiles) {
  await chrome.storage.local.set({ profiles });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export { apiConfigStorageFromImport, loadConfig, saveApiConfig, saveProfiles, uid };
