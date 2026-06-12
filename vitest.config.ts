// vitest.config.ts  (plain .ts, NOT .mts — repo is "type":"commonjs")
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",           // server actions run in Node, not jsdom
    include: ["tests/unit/**/*.test.ts"],
    globals: false,                // explicit imports only
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),  // mirrors tsconfig paths "@/*" -> "./*"
    },
  },
});
