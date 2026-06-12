// Submit-deliverable flow — demo mode E2E.
// Flow: Player views the journey map (/journey) and navigates to a deliverable
// detail page (/journey/deliverable/<id>). In demo mode the journey index renders
// with the in-memory seed fallback; the deliverable detail redirects to /login
// (or renders empty) because getUser() is unavailable without Supabase.
//
// Cardinal rules enforced by this spec:
//   R1 (CLAUDE.md) — score is NOT visible on /journey index outside deliverable
//   detail. Assert no "/100" pattern on the journey body.
//   R3 (CLAUDE.md) — no hardcoded <a disabled> blocking on the journey index.
//
// Demo seed deliverable UUID: 00000000-0000-0000-0000-000000000001
import { test, expect } from "@playwright/test";

const DEMO_DELIVERABLE_ID = "00000000-0000-0000-0000-000000000001";

test.describe("Submit-deliverable flow — demo mode", () => {
  test("/journey index renders main.eic-journey and has no disabled anchors (R3)", async ({
    page,
  }) => {
    await page.goto("/journey");
    // Journey SSR mounts <main class="eic-journey"> even in empty-state.
    await expect(page.locator("main.eic-journey")).toBeVisible({
      timeout: 10_000,
    });

    // R3: <a disabled> is not valid HTML and indicates a hardcoded block.
    const disabledAnchors = page.locator("a[disabled]");
    await expect(disabledAnchors).toHaveCount(0);
  });

  test("/journey index does not expose score pattern to Player (R1)", async ({
    page,
  }) => {
    await page.goto("/journey");
    await expect(page.locator("main.eic-journey")).toBeVisible({
      timeout: 10_000,
    });

    const bodyText = await page.locator("body").innerText();
    // R1: score fractions like "85/100" or "120/140" must not appear on the
    // journey index. Score is only permitted on the deliverable detail page.
    expect(
      bodyText,
      "Score pattern NN/100 must not appear on /journey (R1)",
    ).not.toMatch(/\d{1,3}\s*\/\s*100/);
  });

  test("/journey/deliverable/<demo-id> does not 5xx in demo mode", async ({
    page,
  }) => {
    const response = await page.goto(
      `/journey/deliverable/${DEMO_DELIVERABLE_ID}`,
    );
    // Expected: redirect to /login (302) or 404. Never a 5xx crash.
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});
