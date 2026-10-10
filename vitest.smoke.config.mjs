import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tests/smoke/**/*.test.mjs"], environment: "node", testTimeout: 30_000, retry: 0 },
});
