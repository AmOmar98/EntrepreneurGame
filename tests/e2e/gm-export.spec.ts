// GM CSV export flow — demo mode E2E.
// Flow: GameMaster navigates to /admin/export/players.csv to download the
// players export. In demo mode (no Supabase env) the route bypasses the role
// gate and returns 200 with a header-only CSV (COLUMNS.join(",") + CRLF).
//
// Demo-mode behavior (app/admin/export/players.csv/route.ts lines 26-35):
//   hasSupabaseEnv() === false → skips role gate → getPlayersExportRows() returns []
//   → body = COLUMNS.join(",") + "\r\n" → csvResponse("players.csv", body) → 200.
//
// Key assertion: response body contains the CSV header token "team_slug"
// confirming the route works end-to-end without Supabase.
//
// Implementation note: page.goto throws "Download is starting" for
// Content-Disposition:attachment responses. Use the Playwright `request` API
// (direct HTTP, no browser download interception) to fetch the CSV.
import { test, expect } from "@playwright/test";

test.describe("GM CSV export — demo mode", () => {
  test("/admin/export/players.csv returns 200 with CSV header in demo mode", async ({
    request,
  }) => {
    const response = await request.get("/admin/export/players.csv");

    // Route must return 200 — no redirect, no auth gate in demo mode.
    expect(response.status()).toBe(200);

    // Body must contain the CSV header token "team_slug" (first column).
    const body = await response.text();
    expect(
      body,
      "CSV body must contain header token team_slug",
    ).toContain("team_slug");
  });
});
