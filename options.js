// ---- Storage helpers ----

async function loadConfig() {
  const { apiUrl, apiKey, profiles, defaultProfileId, aiProfile } = await chrome.storage.local.get([
    "apiUrl",
    "apiKey",
    "profiles",
    "defaultProfileId",
    "aiProfile",
  ]);
  return {
    apiUrl: apiUrl || "https://127.0.0.1:27124",
    apiKey: apiKey || "",
    profiles: profiles || [],
    defaultProfileId: defaultProfileId || null,
    aiProfile: aiProfile || { enabled: true, template: "", vaultPath: "", selectors: [] },
  };
}

async function saveApiConfig(url, key) {
  await chrome.storage.local.set({ apiUrl: url, apiKey: key });
}

async function saveProfiles(profiles) {
  await chrome.storage.local.set({ profiles });
}

// ---- Generate unique ID ----

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---- Render ----

const $profileList = document.getElementById("profileList");

function createSelectorRow(varName = "", selector = "", transform = "", attr = "", attachment = false, { simple = false } = {}) {
  const tpl = document.getElementById("selectorRowTpl");
  const row = tpl.content.cloneNode(true).querySelector(".selector-row");
  row.querySelector(".var-name").value = varName;
  row.querySelector(".var-selector").value = selector;
  row.querySelector(".var-transform").value = transform;
  row.querySelector(".var-attr").value = attr;
  row.querySelector(".var-attachment").checked = attachment;
  row.querySelector(".remove-selector-btn").addEventListener("click", () => {
    row.remove();
  });
  if (simple) {
    row.querySelector(".var-attr").remove();
    row.querySelector(".attachment-check").remove();
  }
  applyI18nInEl(row);
  return row;
}

function applyI18nInEl(el) {
  el.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  el.querySelectorAll("[data-i18n-html]").forEach((node) => {
    node.innerHTML = t(node.dataset.i18nHtml);
  });
  el.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  el.querySelectorAll("[data-i18n-title]").forEach((node) => {
    node.title = t(node.dataset.i18nTitle);
  });
}

function createProfileEditor(profile) {
  const tpl = document.getElementById("profileEditorTpl");
  const el = tpl.content.cloneNode(true).querySelector(".profile-editor");
  el.dataset.id = profile.id;

  el.querySelector(".profile-name").value = profile.name || "";

  // Collapsible header
  const collapseHeader = el.querySelector(".profile-collapse-header");
  const collapseName = el.querySelector(".profile-collapse-name");
  collapseName.textContent = profile.name || t("profile.unnamed");
  collapseHeader.addEventListener("click", (e) => {
    if (e.target.closest(".delete-profile-btn")) return;
    el.classList.toggle("collapsed");
  });
  el.querySelector(".profile-name").addEventListener("input", (e) => {
    collapseName.textContent = e.target.value.trim() || t("profile.unnamed");
  });
  if (!profile.name) {
    el.classList.remove("collapsed");
  }
  el.querySelector(".template-input").value = profile.template || "";
  el.querySelector(".vault-path").value = profile.vaultPath || "";
  el.querySelector(".attachment-path").value = profile.attachmentPath || "";

  // Auto match
  const toggle = el.querySelector(".auto-match-toggle");
  const urlField = el.querySelector(".url-patterns-field");
  toggle.checked = !!profile.autoMatch;
  urlField.style.display = profile.autoMatch ? "" : "none";
  toggle.addEventListener("change", () => {
    urlField.style.display = toggle.checked ? "" : "none";
  });
  el.querySelector(".url-patterns").value = (profile.urlPatterns || []).join(
    "\n"
  );

  // Default profile
  const defaultToggle = el.querySelector(".default-profile-toggle");
  defaultToggle.checked = !!profile._isDefault;
  defaultToggle.addEventListener("change", async () => {
    if (defaultToggle.checked) {
      document.querySelectorAll(".default-profile-toggle").forEach((t) => {
        if (t !== defaultToggle) t.checked = false;
      });
      await chrome.storage.local.set({ defaultProfileId: profile.id });
    } else {
      await chrome.storage.local.set({ defaultProfileId: null });
    }
  });

  // Selectors
  const selectorList = el.querySelector(".selector-list");
  const hasAnyTransform = (profile.selectors || []).some((s) => s.transform);
  (profile.selectors || []).forEach((s) => {
    selectorList.appendChild(createSelectorRow(s.name, s.selector, s.transform || "", s.attr || "", !!s.attachment));
  });

  el.querySelector(".add-selector-btn").addEventListener("click", () => {
    selectorList.appendChild(createSelectorRow());
    updateTransformVisibility(el);
  });

  // Show/hide transform toggle
  const showTransformToggle = el.querySelector(".show-transform-toggle");
  showTransformToggle.checked = hasAnyTransform;
  updateTransformVisibility(el);
  showTransformToggle.addEventListener("change", () => {
    updateTransformVisibility(el);
  });

  // Delete
  el.querySelector(".delete-profile-btn").addEventListener("click", async () => {
    if (!confirm(t("profile.deleteConfirm", { name: profile.name || t("profile.unnamed") }))) return;
    el.remove();
    const cfg = await loadConfig();
    cfg.profiles = cfg.profiles.filter((p) => p.id !== profile.id);
    await saveProfiles(cfg.profiles);
    if (cfg.defaultProfileId === profile.id) {
      await chrome.storage.local.set({ defaultProfileId: null });
    }
  });

  // Save
  el.querySelector(".save-profile-btn").addEventListener("click", async () => {
    const updated = readProfileFromEditor(el);
    const cfg = await loadConfig();
    const idx = cfg.profiles.findIndex((p) => p.id === updated.id);
    if (idx >= 0) {
      cfg.profiles[idx] = updated;
    } else {
      cfg.profiles.push(updated);
    }
    await saveProfiles(cfg.profiles);
    showHint(el.querySelector(".profile-save-hint"), t("hint.saved"));
  });

  // Apply i18n to cloned template
  applyI18nInEl(el);

  return el;
}

function updateTransformVisibility(profileEl) {
  const show = profileEl.querySelector(".show-transform-toggle").checked;
  profileEl.querySelectorAll(".selector-row-transform").forEach((el) => {
    el.style.display = show ? "" : "none";
  });
}

function readProfileFromEditor(el) {
  const rows = el.querySelectorAll(".selector-row");
  const selectors = [];
  rows.forEach((row) => {
    const name = row.querySelector(".var-name").value.trim();
    const selector = row.querySelector(".var-selector").value.trim();
    const transform = row.querySelector(".var-transform").value.trim();
    const attr = row.querySelector(".var-attr").value.trim();
    const attachment = row.querySelector(".var-attachment").checked;
    if (name && selector) selectors.push({ name, selector, transform, attr, attachment });
  });

  const urlText = el.querySelector(".url-patterns").value.trim();
  const urlPatterns = urlText
    ? urlText.split("\n").map((l) => l.trim()).filter(Boolean)
    : [];

  return {
    id: el.dataset.id,
    name: el.querySelector(".profile-name").value.trim(),
    autoMatch: el.querySelector(".auto-match-toggle").checked,
    urlPatterns,
    selectors,
    template: el.querySelector(".template-input").value,
    vaultPath: el.querySelector(".vault-path").value.trim(),
    attachmentPath: el.querySelector(".attachment-path").value.trim(),
  };
}

function showHint(el, msg) {
  el.textContent = msg;
  setTimeout(() => {
    el.textContent = "";
  }, 2000);
}

// ---- Language switcher ----

function updateLangButtons() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
}

// ---- Init ----

async function init() {
  await loadLang();
  applyI18n();
  updateLangButtons();

  // Language switcher
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await saveLang(btn.dataset.lang);
      location.reload();
    });
  });

  const cfg = await loadConfig();

  document.getElementById("apiUrl").value = cfg.apiUrl;
  document.getElementById("apiKey").value = cfg.apiKey;

  document.getElementById("saveApiBtn").addEventListener("click", async () => {
    const url = document.getElementById("apiUrl").value.trim();
    const key = document.getElementById("apiKey").value.trim();
    await saveApiConfig(url, key);
    showHint(document.getElementById("apiSaveHint"), t("hint.saved"));
  });

  // ---- AI Chat Profile ----
  initAIProfileEditor(cfg.aiProfile);

  cfg.profiles.forEach((p) => {
    p._isDefault = (p.id === cfg.defaultProfileId);
    $profileList.appendChild(createProfileEditor(p));
  });

  document.getElementById("addProfileBtn").addEventListener("click", () => {
    const newProfile = {
      id: uid(),
      name: "",
      autoMatch: false,
      urlPatterns: [],
      selectors: [{ name: "", selector: "" }],
      template: "",
      vaultPath: "",
    };
    $profileList.appendChild(createProfileEditor(newProfile));
  });

  // Export
  document.getElementById("exportBtn").addEventListener("click", async () => {
    const cfg = await loadConfig();
    const blob = new Blob([JSON.stringify(cfg, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "obsidian-clipper-config.json";
    a.click();
    URL.revokeObjectURL(url);
    showHint(document.getElementById("ioHint"), t("hint.exported"));
  });

  // Import
  const $importFile = document.getElementById("importFile");
  document.getElementById("importBtn").addEventListener("click", () => {
    $importFile.click();
  });
  $importFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.profiles || !Array.isArray(data.profiles)) {
        throw new Error(t("hint.invalidConfig"));
      }
      await chrome.storage.local.set({
        apiUrl: data.apiUrl || "https://127.0.0.1:27124",
        apiKey: data.apiKey || "",
        profiles: data.profiles,
      });
      showHint(document.getElementById("ioHint"), t("hint.imported"));
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      showHint(document.getElementById("ioHint"), t("hint.importFail") + err.message);
    }
    $importFile.value = "";
  });

  // ---- Config Sync ----

  document.getElementById("syncPushBtn").addEventListener("click", async () => {
    try {
      const cur = await loadConfig();
      const syncData = {
        profiles: cur.profiles,
        defaultProfileId: cur.defaultProfileId,
        aiProfile: cur.aiProfile,
      };
      await chrome.storage.sync.set({ syncedConfig: JSON.stringify(syncData) });
      showHint(document.getElementById("syncHint"), t("sync.pushOk"));
    } catch (e) {
      showHint(document.getElementById("syncHint"), t("sync.pushFail") + e.message);
    }
  });

  document.getElementById("syncPullBtn").addEventListener("click", async () => {
    if (!confirm(t("sync.confirmPull"))) return;
    try {
      const { syncedConfig } = await chrome.storage.sync.get("syncedConfig");
      if (!syncedConfig) {
        throw new Error(t("sync.noRemote"));
      }
      const data = JSON.parse(syncedConfig);
      if (!data.profiles || !Array.isArray(data.profiles)) {
        throw new Error(t("hint.invalidConfig"));
      }
      const cur = await loadConfig();
      await chrome.storage.local.set({
        profiles: data.profiles,
        defaultProfileId: data.defaultProfileId || null,
        aiProfile: data.aiProfile || cur.aiProfile,
      });
      showHint(document.getElementById("syncHint"), t("sync.pullOk"));
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      showHint(document.getElementById("syncHint"), t("sync.pullFail") + e.message);
    }
  });
}

// ---- AI Chat Profile Editor ----

function initAIProfileEditor(ai) {
  const $enabled = document.getElementById("aiEnabled");
  const $body = document.getElementById("aiBody");
  const $urlList = document.getElementById("aiUrlList");
  const $selectorList = document.getElementById("aiSelectorList");
  const $template = document.getElementById("aiTemplate");
  const $vaultPath = document.getElementById("aiVaultPath");

  // Enable toggle
  $enabled.checked = ai.enabled !== false;
  $body.style.display = $enabled.checked ? "" : "none";
  $enabled.addEventListener("change", () => {
    $body.style.display = $enabled.checked ? "" : "none";
  });

  // Built-in URL list (read-only display)
  AI_CHAT_SITES.forEach((site) => {
    site.urlPatterns.forEach((pat) => {
      const div = document.createElement("div");
      div.className = "ai-url-item";
      div.innerHTML = `<code>${pat}</code>`;
      $urlList.appendChild(div);
    });
  });

  // YAML selectors
  (ai.selectors || []).forEach((s) => {
    $selectorList.appendChild(createSelectorRow(s.name, s.selector, s.transform || "", "", false, { simple: true }));
  });
  document.getElementById("aiAddSelectorBtn").addEventListener("click", () => {
    $selectorList.appendChild(createSelectorRow("", "", "", "", false, { simple: true }));
    updateAITransformVisibility();
  });

  const $aiTransformToggle = document.getElementById("aiShowTransform");
  function updateAITransformVisibility() {
    const show = $aiTransformToggle.checked;
    $selectorList.querySelectorAll(".selector-row-transform").forEach((el) => {
      el.style.display = show ? "" : "none";
    });
  }
  $aiTransformToggle.addEventListener("change", updateAITransformVisibility);
  updateAITransformVisibility();

  // Template
  $template.value = ai.template || "";

  // Vault path
  $vaultPath.value = ai.vaultPath || "";

  // Save button
  document.getElementById("aiSaveBtn").addEventListener("click", async () => {
    const selectors = [];
    $selectorList.querySelectorAll(".selector-row").forEach((row) => {
      const name = row.querySelector(".var-name").value.trim();
      const selector = row.querySelector(".var-selector").value.trim();
      const transform = row.querySelector(".var-transform")?.value.trim() || "";
      if (name && selector) selectors.push({ name, selector, transform });
    });

    const aiProfile = {
      enabled: $enabled.checked,
      template: $template.value,
      vaultPath: $vaultPath.value.trim(),
      selectors,
    };
    await chrome.storage.local.set({ aiProfile });
    showHint(document.getElementById("aiSaveHint"), t("hint.saved"));
  });
}

init();
