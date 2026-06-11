// Quick 260517-psd — Playwright smoke harness (demo mode only).
// Boots `next dev -p 3001` automatically via webServer config; no Supabase env
// expected, app falls back to in-memory seed (lib/seed/). Single chromium project.
// Phase 13-03: testDir widened to "./tests" to cover both tests/smoke and tests/e2e.
import { defineConfig, devices } from "@playwright/test";

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  // Only discover Playwright spec files under tests/smoke and tests/e2e.
  // Excludes tests/unit (Vitest .test.ts files) which use vitest imports.
  testMatch: ["**/smoke/**/*.spec.ts", "**/e2e/**/*.spec.ts"],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Force demo mode by NOT loading .env.local. Next.js auto-loads .env.local
    // if present, but `hasSupabaseEnv()` checks `NEXT_PUBLIC_SUPABASE_URL`
    // which we explicitly leave undefined here.
    command: `npm run dev -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Sentinel: empty values trigger hasSupabaseEnv() === false.
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
});
