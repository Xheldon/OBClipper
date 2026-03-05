// ---- Storage helpers ----

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

function createSelectorRow(varName = "", selector = "", transform = "", attr = "", attachment = false) {
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
  return row;
}

function createProfileEditor(profile) {
  const tpl = document.getElementById("profileEditorTpl");
  const el = tpl.content.cloneNode(true).querySelector(".profile-editor");
  el.dataset.id = profile.id;

  el.querySelector(".profile-name").value = profile.name || "";
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
    if (!confirm(`确定删除 Profile「${profile.name || "未命名"}」吗？`)) return;
    el.remove();
    const cfg = await loadConfig();
    cfg.profiles = cfg.profiles.filter((p) => p.id !== profile.id);
    await saveProfiles(cfg.profiles);
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
    showHint(el.querySelector(".profile-save-hint"), "已保存");
  });

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

// ---- Init ----

async function init() {
  const cfg = await loadConfig();

  document.getElementById("apiUrl").value = cfg.apiUrl;
  document.getElementById("apiKey").value = cfg.apiKey;

  document.getElementById("saveApiBtn").addEventListener("click", async () => {
    const url = document.getElementById("apiUrl").value.trim();
    const key = document.getElementById("apiKey").value.trim();
    await saveApiConfig(url, key);
    showHint(document.getElementById("apiSaveHint"), "已保存");
  });

  cfg.profiles.forEach((p) => {
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
    showHint(document.getElementById("ioHint"), "已导出");
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
        throw new Error("无效的配置文件");
      }
      await chrome.storage.local.set({
        apiUrl: data.apiUrl || "https://127.0.0.1:27124",
        apiKey: data.apiKey || "",
        profiles: data.profiles,
      });
      showHint(document.getElementById("ioHint"), "已导入，页面将刷新");
      setTimeout(() => location.reload(), 800);
    } catch (err) {
      showHint(document.getElementById("ioHint"), "导入失败: " + err.message);
    }
    $importFile.value = "";
  });
}

init();
