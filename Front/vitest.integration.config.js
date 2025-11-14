import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config.js";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const targetGlobs = [
  "src/pages/Customer/Cart.jsx",
  "src/pages/Customer/Checkout.jsx",
  "src/pages/Customer/CustomerOrders.jsx",
  "src/pages/Customer/TrackOrder.jsx",
];

const { test: baseTest = {}, ...rest } = baseConfig;
const baseCoverage = baseTest.coverage ?? {};

export default defineConfig({
  ...rest,
  test: {
    ...baseTest,
    includeSource: targetGlobs,
    coverage: {
      ...baseCoverage,
      include: targetGlobs,
      exclude: [],
      lines: 100,
      statements: 100,
      functions: 100,
      branches: 100,
    },
  },
});
