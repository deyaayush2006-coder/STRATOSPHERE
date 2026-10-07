import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["{app,components,lib}/**/*.test.{js,jsx}"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.js"],
      exclude: ["lib/**/*.test.js"],
      reporter: ["text-summary", "lcov"],
    },
  },
});
