import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: resolve(rootDir, "./vitest.setup.js"),
    alias: {
      "@": resolve(rootDir, "./src"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html", "json-summary"],
      reportsDirectory: resolve(rootDir, "./coverage"),
      include: [
        "scripts/**/*.mjs",
        "src/pages/**/*.{js,jsx}",
      ],
      exclude: [
        "**/*.d.ts",
      ],
      lines: 80,
      functions: 80,
      statements: 80,
      branches: 70,
    },
    css: false,
  },
});
