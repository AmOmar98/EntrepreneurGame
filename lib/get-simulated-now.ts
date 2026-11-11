/**
 * ENGINE-07 — Date-injection helper for GM-controlled scheduled_date simulations.
 *
 * IMPORTANT — Server context only:
 *   This function calls `cookies()` from `next/headers` which is ONLY valid in:
 *   - React Server Components
 *   - Server Actions (`"use server"` modules)
 *   - Route Handlers
 *
 *   Do NOT call this from client components, plain Node.js scripts, or any
 *   context where the Next.js request lifecycle is not active. In those cases,
 *   use `Date.now()` directly.
 *
 * GM-only override:
 *   The simulate_date cookie is set by the /admin pages for GameMasters only.
 *   The override has NO effect on Player surfaces — `lib/admin.ts` is only
 *   called from admin server components, ensuring players are unaffected.
 *
 * Usage:
 *   const now = await getSimulatedNow();
 *   // now = override epoch ms when GM has ?simulate_date=YYYY-MM-DD active
 *   //      = Date.now() otherwise
 */

import { cookies } from "next/headers";

const SIMULATE_DATE_COOKIE = "gsd_simulate_date";

/**
 * Returns the current epoch time in milliseconds.
 *
 * When the GM has set a simulate_date cookie (YYYY-MM-DD format), returns the
 * epoch ms for midnight UTC of that date instead of real Date.now().
 * Falls back to Date.now() on any invalid/absent value.
 */
export async function getSimulatedNow(): Promise<number> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SIMULATE_DATE_COOKIE)?.value;
    if (!raw) return Date.now();

    // Validate YYYY-MM-DD format
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) return Date.now();

    const ms = Date.parse(raw + "T00:00:00.000Z");
    if (Number.isNaN(ms)) return Date.now();

    return ms;
  } catch {
    // next/headers throws outside request context (e.g. during static build).
    return Date.now();
  }
}

/**
 * Returns the current simulated date string (YYYY-MM-DD) or null.
 * Used by admin pages to display the amber simulation-active pill.
 */
export async function getSimulateDateDisplay(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SIMULATE_DATE_COOKIE)?.value;
    if (!raw) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    return match ? raw : null;
  } catch {
    return null;
  }
}
