// Onboarding flow — demo mode E2E.
// Flow: Player lands on /onboarding. In demo mode (no Supabase env) the page
// renders a static disabled <main> message — no form is shown. This test locks
// the dual-mode demo guarantee (CLAUDE.md): the page must respond without 5xx
// and mount <main> so the app is fully navigable without a backend.
//
// Demo-mode behavior (app/onboarding/page.tsx lines 34-41):
//   hasSupabaseEnv() === false → renders <main> with title + disabled message.
//   No form, no redirect to /login — just a static server render.
import { test, expect } from "@playwright/test";

test.describe("Onboarding flow — demo mode", () => {
  test("/onboarding renders without error in demo mode", async ({ page }) => {
    const response = await page.goto("/onboarding");
    // Must not be a 5xx server error.
    expect(response?.status() ?? 0).toBeLessThan(500);

    // <main> must be visible — demo mode renders the static disabled message
    // inside a <main> element (no form, no redirect).
    const main = page.locator("main").first();
    await expect(main).toBeVisible({ timeout: 10_000 });
  });
});
