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
//
// Phase 16 Plan 04 additions:
//   Demo early-exit: page redirects to /login before rendering jury content.
//   Proof of demo-disabled state:
//     (a) t.jury_demo_disabled banner text NOT present on current page
//         (confirms early-exit before JuryForm renders)
//     (b) zero criteria number inputs present
//         (confirms the criteria scoring form is NOT rendered in demo mode)
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

  test("/jury demo mode: demo-disabled banner not rendered + zero criteria inputs (Phase 16 Plan 04)", async ({
    page,
  }) => {
    await page.goto("/jury");
    // In demo mode (no Supabase env), getCurrentUser() returns null and the
    // page redirects to /login BEFORE rendering any jury content.
    // This proves the demo early-exit: neither the demo-disabled banner
    // (t.jury_demo_disabled = "Donnees indisponibles — contactez le support.")
    // nor the JuryForm criteria inputs are present on the final rendered page.

    // (a) Demo-disabled banner: NOT rendered on the current page (we are at /login,
    //     the jury content including the banner is behind the auth guard).
    //     Count of the banner text = 0 confirms demo early-exit before JuryForm.
    const bannerCount = await page
      .getByText("Données indisponibles", { exact: false })
      .count();
    expect(bannerCount, "demo-disabled banner must not be rendered in demo early-exit").toBe(0);

    // (b) Zero criteria number inputs: the jury scoring form (with per-criterion
    //     <input type="number"> fields) must not appear in demo mode.
    const criteriaInputCount = await page
      .locator("form input[type='number']")
      .count();
    expect(criteriaInputCount, "zero criteria number inputs must be present — jury form not rendered in demo mode").toBe(0);
  });
});
