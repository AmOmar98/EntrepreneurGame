// Admin engine editor routes — demo mode E2E smoke (Phase 15 — ENGINE-01/02/03/04).
//
// In demo mode (no Supabase env):
//   - createClient() returns null → getCurrentUser() returns null
//   - Admin pages either redirect to /login or render with the demo notice pill
//   - Both are valid — this spec verifies no 5xx (server error) and that the
//     routes are reachable without crashing on the new Phase 15 column reads.
//
// These 3 editor routes were added in Phase 15 plans 01-04:
//   /admin/events        — AdminEventsTable + create/clone/activate forms
//   /admin/levels        — AdminLevelsEditor + CRUD level forms
//   /admin/events/[id]/missions — AdminMissionsEditor + template rubric builder
//
// Key Phase 15 guards being exercised:
//   - Defensive column reads (composer_kind ?? "simple", soft_recommends_before
//     fallback, auto_validate ?? false) don't crash on missing columns
//   - The admin_engine_demo_disabled pill is rendered on these pages when
//     the user is authenticated in demo mode (Supabase configured = false)
//
// R3 note: admin pages are GM-only — no Player-facing disabled blocking expected.
import { test, expect } from "@playwright/test";

// A plausible but non-existent event ID for the dynamic route test.
const DEMO_EVENT_ID = "00000000-0000-4000-a000-000000000001";

test.describe("Admin engine editor routes — demo mode", () => {
  test("/admin/events does not 5xx in demo mode", async ({ page }) => {
    const response = await page.goto("/admin/events");
    // Must not be a 5xx server error — routes must be crash-free in demo mode.
    expect(response?.status() ?? 0).toBeLessThan(500);
    // Page renders (or redirects to login) — <main> or <body> must be present.
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
  });

  test("/admin/levels does not 5xx in demo mode", async ({ page }) => {
    const response = await page.goto("/admin/levels");
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
  });

  test("/admin/events/[id]/missions does not 5xx in demo mode", async ({
    page,
  }) => {
    const response = await page.goto(
      `/admin/events/${DEMO_EVENT_ID}/missions`,
    );
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
  });

  test("/login renders main element (AppShell entry point intact)", async ({
    page,
  }) => {
    await page.goto("/login");
    const main = page.locator("main").first();
    await expect(main).toBeVisible({ timeout: 10_000 });
  });
});
