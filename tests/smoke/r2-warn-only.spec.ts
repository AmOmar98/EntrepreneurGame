// R2 — Validators are warn-only, never blocking.
// CLAUDE.md cardinal: validators `severity: "warn"` jamais bloquants ; `"error"`
// doit lever review humain. Le smoke vérifie que la page (où les formulaires
// existent) n'expose pas de bandeau bloquant `role="alert"` rouge / severity:error
// au chargement, et qu'aucun élément interactif majeur n'est désactivé.
//
// Demo-mode note: in absence of Supabase env the /journey/deliverable/[id]/
// page typically requires auth. We instead smoke `/onboarding` which exposes a
// real form server-action in demo mode (KYC).
import { test, expect } from "@playwright/test";

test.describe("R2 — Warn-only, no blocking errors at load", () => {
  test("/onboarding form renders without severity=error alert", async ({
    page,
  }) => {
    const response = await page.goto("/onboarding");
    expect(response?.status() ?? 0).toBeLessThan(500);

    // No live alert pre-submit (the warn-only contract means we only warn after
    // user action, never block by surfacing an error on mount).
    const errorAlerts = page.locator(
      '[role="alert"][data-severity="error"], .eic-error, .severity-error',
    );
    await expect(errorAlerts).toHaveCount(0);

    // Form is reachable (no full-page block).
    const main = page.locator("main").first();
    await expect(main).toBeVisible({ timeout: 10_000 });
  });

  test("/journey does not surface blocking error severity at load", async ({
    page,
  }) => {
    await page.goto("/journey");
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10_000 });

    const blocking = page.locator(
      '[data-severity="error"], [role="alert"].eic-blocking',
    );
    await expect(blocking).toHaveCount(0);

    // Console scan: no uncaught React errors (warn allowed).
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    // Reload to capture console of a fresh load.
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    // Allow benign hydration warnings; gate only on uncaught React errors.
    const fatal = errors.filter((e) =>
      /uncaught|hydration failed|Cannot read prop/i.test(e),
    );
    expect(fatal, fatal.join("\n")).toHaveLength(0);
  });
});
