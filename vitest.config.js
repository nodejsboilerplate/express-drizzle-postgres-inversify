import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    env: {
      NODE_ENV: "test",
    },
    include: ["src/tests/**/*.test.ts"],
    environment: "node",
    globals: true,
    globalSetup: "./src/tests/setup.ts",
  },
});
