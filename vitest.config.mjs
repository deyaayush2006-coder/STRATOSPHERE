import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  // Same JSX runtime as Next, so components render in tests without importing React.
  esbuild: { jsx: "automatic" },
  test: {
    include: ["tests/**/*.test.{js,mjs}", "lib/**/*.test.{js,mjs}"],
    exclude: ["tests/smoke/**", "node_modules/**"],
    environment: "node",
    testTimeout: 20_000,
  },
});
