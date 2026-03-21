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

export { matchUrl, renderTemplate, sanitizeForPath, renderPathTemplate };
