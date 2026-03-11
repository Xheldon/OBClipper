const AI_PROFILE_ID = "__ai_chat__";

const AI_CHAT_SITES = [
  {
    id: "claude",
    name: "Claude",
    urlPatterns: ["https://claude.ai/*"],
    titleSelector: "",
    userSelector: "",
    assistantSelector: "",
    userStripSelector: "",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    urlPatterns: ["https://chatgpt.com/*"],
    titleSelector: "",
    userSelector: "",
    assistantSelector: "",
    userStripSelector: "",
  },
  {
    id: "gemini",
    name: "Gemini",
    urlPatterns: ["https://gemini.google.com/app/*"],
    titleSelector: "[data-test-id='conversation-title']",
    userSelector: ".user-query-container .query-content",
    assistantSelector: ".response-container-content .response-content structured-content-container",
    userStripSelector: ".cdk-visually-hidden",
  },
];

function getMatchedAIChatSite(url, siteOverrides) {
  for (const site of AI_CHAT_SITES) {
    const overrides = siteOverrides?.[site.id] || {};
    const merged = { ...site, ...overrides };
    for (const pattern of site.urlPatterns) {
      const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      if (new RegExp("^" + escaped + "$").test(url)) {
        return merged;
      }
    }
  }
  return null;
}

function getAllAIChatUrlPatterns() {
  return AI_CHAT_SITES.flatMap((s) => s.urlPatterns);
}
