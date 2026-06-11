// Jury pitch flow — demo mode E2E.
// Flow: Staff/jury member navigates to /jury. In demo mode getCurrentUser()
// redirects to /login (302) because no session exists — this is expected and
// must not surface as a 5xx crash.
//
// Cardinal rule enforced:
//   R1 (CLAUDE.md) — rank signals like "rang #3" must NOT appear anywhere
//   visible to users even in fallback/redirect pages (leaderboard interdit).
//
// Demo-mode behavior (app/jury/page.tsx lines 30-31):
//   await getCurrentUser() → returns null in demo mode → redirect("/login").
//   302 is acceptable; 5xx is not.
import { test, expect } from "@playwright/test";

test.describe("Jury pitch flow — demo mode", () => {
  test("/jury does not 5xx in demo mode (302 to /login allowed)", async ({
    page,
  }) => {
    const response = await page.goto("/jury");
    // Expected: 302 redirect to /login or 200 with disabled state.
    // Never a 5xx.
    expect(response?.status() ?? 0).toBeLessThan(500);
  });

  test("/jury landing page does not leak rank signal (R1)", async ({
    page,
  }) => {
    await page.goto("/jury");
    const bodyText = (await page.locator("body").innerText()).toLowerCase();

    // R1: rank/leaderboard signals are forbidden on any Player-facing or
    // staff-facing surface outside explicitly authorised GM/jury contexts.
    // In demo mode the page redirects, so body text is minimal /login content.
    expect(bodyText, "rang #N pattern must not appear (R1)").not.toMatch(
      /\brang\s*#?\d+/i,
    );
    expect(bodyText, "leaderboard must not appear (R1)").not.toMatch(
      /\bleaderboard\b/i,
    );
  });
});
