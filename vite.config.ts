import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    target: "esnext",
    minify: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "logseqTaskTransitionPlugin",
      formats: ["iife"],
      fileName: () => "index.js",
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
