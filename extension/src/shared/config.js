// ---- Storage helpers ----

async function loadConfig() {
  const { apiUrl, apiKey, profiles, defaultProfileId, aiProfile, autoLinkEnabled, autoLinkExcludeFolders } = await chrome.storage.local.get([
    "apiUrl",
    "apiKey",
    "profiles",
    "defaultProfileId",
    "aiProfile",
    "autoLinkEnabled",
    "autoLinkExcludeFolders",
  ]);
  return {
    apiUrl: apiUrl || "https://127.0.0.1:27124",
    apiKey: apiKey || "",
    profiles: profiles || [],
    defaultProfileId: defaultProfileId || null,
    aiProfile: aiProfile || { enabled: true, template: "", vaultPath: "", selectors: [] },
    autoLinkEnabled: autoLinkEnabled !== undefined ? autoLinkEnabled : true,
    autoLinkExcludeFolders: autoLinkExcludeFolders || "",
  };
}

async function saveApiConfig(url, key) {
  await chrome.storage.local.set({ apiUrl: url, apiKey: key });
}

async function saveProfiles(profiles) {
  await chrome.storage.local.set({ profiles });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export { loadConfig, saveApiConfig, saveProfiles, uid };
