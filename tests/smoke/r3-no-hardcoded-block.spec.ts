// R3 — No hardcoded inter-mission blocking.
// CLAUDE.md cardinal: aucun blocage inter-mission codé en dur — pas de
// `disabled` DOM, pas de `blocks_progression_to` actif. Utiliser
// `eic-locked-hint--amber` / tooltip ambre à la place.
//
// Demo-mode note: the journey index may render the empty-state when no seed
// player is attached. We still check the rule on every interactive element:
// no Player-facing CTA should have a `disabled` attribute that isn't paired
// with the amber locked hint affordance.
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
});
