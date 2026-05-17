// R1 — Score is NOT visible on Player-facing surfaces.
// CLAUDE.md cardinal: score visible UNIQUEMENT sur la page de détail d'un
// livrable (`app/journey/deliverable/[id]/`). Invisible partout ailleurs côté
// Player (`/journey` index, `/results`, badges, milestones, navbar, mascot,
// dashboards). Rank/percentile/leaderboard interdit même sur le détail.
//
// Demo-mode note: without Supabase env the seed fallback renders the empty
// journey state (`journey_empty_account` copy). We still assert the absence of
// score signals to lock the contract.
import { test, expect } from "@playwright/test";

const PLAYER_VISIBLE_SCORE_PATTERNS = [
  /\b\d{1,3}\s*\/\s*100\b/, // "85/100"
  /\b\d{1,3}\s*\/\s*140\b/, // "120/140" (jury max)
  /\bpercentile\b/i,
  /\bclassement\b/i,
  /\bleaderboard\b/i,
  /\brang\s*#?\d+/i, // "rang #3"
];

test.describe("R1 — Player journey hides score & rank", () => {
  test("/journey index renders without score/rank/percentile signals", async ({
    page,
  }) => {
    await page.goto("/journey");
    // Wait for SSR markup; empty-state still mounts <main class="eic-journey">.
    await expect(page.locator("main.eic-journey")).toBeVisible({
      timeout: 10_000,
    });

    const bodyText = (await page.locator("body").innerText()).toLowerCase();

    for (const pattern of PLAYER_VISIBLE_SCORE_PATTERNS) {
      expect(
        bodyText,
        `Pattern ${pattern} must not appear on /journey (Player surface)`,
      ).not.toMatch(pattern);
    }

    // Defensive: no data-testid leak of a score widget.
    const scoreNodes = page.locator(
      '[data-score], [data-rank], [data-percentile]',
    );
    await expect(scoreNodes).toHaveCount(0);
  });

  test("results page must not leak rank to Player in demo mode", async ({
    page,
  }) => {
    const response = await page.goto("/results");
    // Page should respond (200, 302, or 401 — anything but 500).
    expect(response?.status() ?? 0).toBeLessThan(500);

    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    // Even on the demo-disabled banner, no rank/leaderboard text.
    expect(bodyText).not.toMatch(/\brang\s*#?\d+/i);
    expect(bodyText).not.toMatch(/\bleaderboard\b/i);
  });
});
