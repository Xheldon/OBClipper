// This page runs in a sandboxed context where eval/new Function is allowed.
// It receives raw values + transform expressions from the popup via postMessage,
// executes the transforms, and sends results back.
window.addEventListener("message", (e) => {
  const { id, vars, transforms } = e.data;
  const result = {};
  for (const name in vars) {
    let value = vars[name];
    const expr = transforms[name];
    if (expr) {
      try {
        value = new Function("value", "return (" + expr + ")")(value);
      } catch (err) {
        // Silent fail: keep empty string, log error
        console.warn(`[Obsidian Clipper] Transform error for "${name}":`, err.message);
        value = "";
      }
    }
    result[name] = value;
  }
  e.source.postMessage({ id, result }, "*");
});
