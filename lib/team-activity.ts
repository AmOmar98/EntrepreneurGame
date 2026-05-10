// Phase 9 / GMR-01 + GMR-02 — Team activity helper.
// Computes a coarse activity state (active / idle / stale) for a team
// based on its last activity timestamp (latest of submissions, evaluations,
// or evaluation_comments). Pure helper — no Supabase access here.

export type TeamActivityState = "active" | "idle" | "stale";

export type TeamActivity = {
  state: TeamActivityState;
  minutesSinceActivity: number | null; // null when never active
};

/**
 * Compute the activity state for a single team given the most recent
 * activity timestamp (in milliseconds since epoch) and "now".
 *
 * Thresholds (matches GMR-08 narrative — bandeau status "inquiet" if ≥3
 * teams stale > 15 min):
 *   - active: < 5 minutes since last activity
 *   - idle:   5 - 15 minutes
 *   - stale:  > 15 minutes (or no recorded activity at all)
 */
export function computeTeamActivityState(
  lastActivityMs: number | null,
  now: Date | number = new Date(),
): TeamActivity {
  const nowMs = typeof now === "number" ? now : now.getTime();
  if (lastActivityMs == null || Number.isNaN(lastActivityMs)) {
    return { state: "stale", minutesSinceActivity: null };
  }
  const diffMs = Math.max(0, nowMs - lastActivityMs);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 5) return { state: "active", minutesSinceActivity: minutes };
  if (minutes <= 15) return { state: "idle", minutesSinceActivity: minutes };
  return { state: "stale", minutesSinceActivity: minutes };
}

/**
 * Convenience helper: derive the latest activity timestamp from a list of
 * candidate ISO strings (typically the most recent submission.submitted_at,
 * evaluation.created_at, evaluation_comments.created_at for a given player).
 * Returns null if all entries are null/invalid.
 */
export function latestActivityMs(
  candidates: Array<string | null | undefined>,
): number | null {
  let max: number | null = null;
  for (const iso of candidates) {
    if (!iso) continue;
    const ms = new Date(iso).getTime();
    if (Number.isNaN(ms)) continue;
    if (max === null || ms > max) max = ms;
  }
  return max;
}
