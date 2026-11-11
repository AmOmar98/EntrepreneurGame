// Mentor eval flow — demo mode E2E.
// Flow: Mentor navigates to /mentor (dashboard) and /mentor/submission/<id>
// (evaluation detail). In demo mode (no Supabase env) both pages gracefully
// degrade: empty rows / redirect to /login, never a 5xx crash.
//
// Demo-mode behavior: app/mentor/* pages check hasSupabaseEnv() and short-circuit
// with an empty/disabled view when no backend is present.
//
// Demo seed submission UUID: 00000000-0000-0000-0000-000000000001
import { test, expect } from "@playwright/test";

const DEMO_SUBMISSION_ID = "00000000-0000-0000-0000-000000000001";

test.describe("Mentor eval — demo mode smoke", () => {
  test("/mentor does not 5xx in demo mode", async ({ page }) => {
    const response = await page.goto("/mentor");
    // Expected: 200 with empty/disabled state, or redirect. Never 5xx.
    expect(response?.status() ?? 0).toBeLessThan(500);
  });

  test("/mentor/submission/<demo-id> does not 5xx in demo mode", async ({
    page,
  }) => {
    const response = await page.goto(
      `/mentor/submission/${DEMO_SUBMISSION_ID}`,
    );
    // Expected: redirect to /login (302) or 404 — auth required for submission
    // detail. Never a 5xx crash.
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});
