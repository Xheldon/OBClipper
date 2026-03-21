(() => {
  try {
    if (typeof Defuddle === "undefined") {
      return { error: "Defuddle not loaded" };
    }
    const result = new Defuddle(document, { markdown: true }).parse();
    return { content: result.content || "" };
  } catch (e) {
    return { error: e.message };
  }
})();
