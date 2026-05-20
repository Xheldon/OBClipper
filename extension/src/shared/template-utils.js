function matchUrl(pattern, url) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp("^" + escaped + "$").test(url);
}

function resolveTemplateValue(vars, key) {
  if (Object.prototype.hasOwnProperty.call(vars, key)) return vars[key];
  return "";
}

function renderTemplate(template, vars) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => resolveTemplateValue(vars, key) ?? "");
}

const WINDOWS_RESERVED_BASENAMES = /^(con|prn|aux|nul|conin\$|conout\$|com[1-9\u00b9\u00b2\u00b3]|lpt[1-9\u00b9\u00b2\u00b3])$/i;

function sanitizeForPath(str) {
  return String(str ?? "")
    .replace(/[\u0000-\u001f\u007f-\u009f<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
}

function normalizeRenderedPath(path, vars) {
  const fallbackBase = "Untitled";
  const rawSegments = String(path || "").split("/");
  const segments = rawSegments.map((segment) => sanitizePathSegment(segment));
  const dirs = segments
    .slice(0, -1)
    .filter(Boolean);

  let filename = segments[segments.length - 1] || "";
  if (!hasFilenameStem(filename)) {
    filename = fallbackBase + extensionFromFilename(rawSegments[rawSegments.length - 1]);
  }

  return [...dirs, filename].join("/");
}

function sanitizePathSegment(segment) {
  const clean = sanitizeForPath(segment);
  if (clean === "." || clean === "..") return "";
  if (isWindowsReservedPathSegment(clean)) return "";
  return clean;
}

function isWindowsReservedPathSegment(segment) {
  const basename = String(segment || "").split(".")[0];
  return WINDOWS_RESERVED_BASENAMES.test(basename);
}

function hasFilenameStem(filename) {
  const value = String(filename || "").trim();
  if (!value) return false;
  if (/^\.+(?:md)?$/i.test(value)) return false;
  return value.replace(/\.md$/i, "").replace(/\.+$/g, "").trim().length > 0;
}

function extensionFromFilename(filename) {
  const match = String(filename || "").trim().match(/(\.[A-Za-z0-9][A-Za-z0-9_-]{0,15})$/);
  return match ? match[1] : ".md";
}

function renderPathTemplate(template, vars) {
  const sanitized = {};
  for (const [k, v] of Object.entries(vars)) {
    sanitized[k] = sanitizeForPath(v);
  }
  return normalizeRenderedPath(renderTemplate(template, sanitized), sanitized);
}

export { matchUrl, renderTemplate, sanitizeForPath, renderPathTemplate };
