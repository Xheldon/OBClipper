import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [
    webExtension(),
  ],
});
