// R3 — No hardcoded inter-mission blocking.
// CLAUDE.md cardinal: aucun blocage inter-mission codé en dur — pas de
// `disabled` DOM, pas de `blocks_progression_to` actif. Utiliser
// `eic-locked-hint--amber` / tooltip ambre à la place.
//
// Demo-mode note: the journey index may render the empty-state when no seed
// player is attached. We still check the rule on every interactive element:
// no Player-facing CTA should have a `disabled` attribute that isn't paired
// with the amber locked hint affordance.
//
// Phase 15 extension: the new GM editor routes (/admin/events, /admin/levels,
// /admin/events/[id]/missions) and the soft_recommends_before amber hint on
// the Player deliverable page must NOT introduce new hard-block patterns.
// In demo mode these pages redirect to /login, so the assertion covers
// the login page (the fallback render path).
import { test, expect } from "@playwright/test";

test.describe("R3 — No hardcoded blocking, amber hint affordance only", () => {
  test("/journey navigation links are not disabled", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });

    // Anchor tags should never carry a `disabled` attr (it's not valid on <a>,
    // so any leak is a hardcoded block.)
    const disabledAnchors = page.locator("a[disabled]");
    await expect(disabledAnchors).toHaveCount(0);

    // For buttons, count any disabled ones and assert they all sit inside
    // the amber locked-hint container (the sanctioned affordance).
    const disabledButtons = page.locator("button[disabled]");
    const count = await disabledButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = disabledButtons.nth(i);
      const insideAmber = await btn.evaluate((el) =>
        Boolean(el.closest(".eic-locked-hint--amber")),
      );
      expect(
        insideAmber,
        "disabled <button> must sit inside .eic-locked-hint--amber per R3",
      ).toBe(true);
    }
  });

  test("known Player routes do not 5xx", async ({ page }) => {
    const routes = ["/journey", "/onboarding", "/login"];
    for (const route of routes) {
      const res = await page.goto(route);
      expect(
        res?.status() ?? 0,
        `${route} returned ${res?.status()}`,
      ).toBeLessThan(500);
    }
  });

  // Phase 15: /admin/events does not 5xx in demo mode
  test("/admin/events does not 5xx in demo mode (Phase 15 — ENGINE-04)", async ({
    page,
  }) => {
    const res = await page.goto("/admin/events");
    expect(
      res?.status() ?? 0,
      `/admin/events returned ${res?.status()} — must be < 500`,
    ).toBeLessThan(500);
  });

  // Phase 15: /admin/levels does not 5xx in demo mode
  test("/admin/levels does not 5xx in demo mode (Phase 15 — LEVELS-04)", async ({
    page,
  }) => {
    const res = await page.goto("/admin/levels");
    expect(
      res?.status() ?? 0,
      `/admin/levels returned ${res?.status()} — must be < 500`,
    ).toBeLessThan(500);
  });

  // Phase 15: /admin/events/[id]/missions does not 5xx in demo mode
  test("/admin/events/[id]/missions does not 5xx in demo mode (Phase 15 — ENGINE-01/02)", async ({
    page,
  }) => {
    const res = await page.goto(
      "/admin/events/00000000-0000-4000-a000-000000000001/missions",
    );
    expect(
      res?.status() ?? 0,
      `/admin/events/[id]/missions returned ${res?.status()} — must be < 500`,
    ).toBeLessThan(500);
  });

  // Phase 15: soft_recommends_before amber hint must NOT produce a disabled
  // anchor or blocking disabled button on the Player deliverable page.
  // In demo mode the page redirects to /login; this verifies no 5xx.
  test("/journey/deliverable/[id] does not 5xx (soft_recommends_before hint — R3)", async ({
    page,
  }) => {
    const DEMO_DELIVERABLE_ID = "00000000-0000-0000-0000-000000000001";
    const res = await page.goto(`/journey/deliverable/${DEMO_DELIVERABLE_ID}`);
    expect(
      res?.status() ?? 0,
      "Deliverable page with soft_recommends_before must not 5xx",
    ).toBeLessThan(500);
  });
});
