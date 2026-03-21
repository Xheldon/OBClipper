function showHint(el, msg, duration = 2000) {
  el.textContent = msg;
  if (duration > 0) {
    setTimeout(() => {
      el.textContent = "";
    }, duration);
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export { showHint, escapeHtml, truncate };
