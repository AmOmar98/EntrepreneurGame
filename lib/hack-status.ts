// Phase 9 / GMR-08 — Hack status helper.
// Distills the cohort's collective pulse into 4 narrative states used by
// the admin status banner and the Pixel mascot.
// Pure helper — accepts already-computed team activity states + recent events.

import type { TeamActivityState } from "@/lib/team-activity";

export type HackStatus = "serein" | "concentre" | "inquiet" | "euphorique";

export type HackStatusEvent = {
  // ISO string or epoch ms — both accepted via toMs() below.
  at: string | number;
  kind: "submission_validated" | "submission" | "evaluation" | "comment";
};

export type HackStatusMicroAction = {
  label: string;
  href?: string;
};

export type HackStatusResult = {
  status: HackStatus;
  // Counts driving the decision (useful for tooltips / debug).
  staleCount: number;
  idleCount: number;
  activeCount: number;
  recentValidatedCount: number; // last 5 minutes
  microAction: HackStatusMicroAction | null;
};

function toMs(at: string | number): number {
  return typeof at === "number" ? at : new Date(at).getTime();
}

/**
 * Decide the hack-wide status from per-team activity states + recent events.
 *
 * Rules (in evaluation order, first match wins):
 *   - euphorique : ≥2 validated submissions in the last 5 minutes
 *   - inquiet    : ≥3 teams in `stale` (>15 min)
 *   - concentre  : ≥40% of teams currently in `idle` (review phase)
 *   - serein     : default
 */
export function computeHackStatus(
  teams: Array<{ state: TeamActivityState }>,
  recentEvents: HackStatusEvent[],
  now: Date | number = new Date(),
): HackStatusResult {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const total = teams.length;

  let activeCount = 0;
  let idleCount = 0;
  let staleCount = 0;
  for (const t of teams) {
    if (t.state === "active") activeCount++;
    else if (t.state === "idle") idleCount++;
    else staleCount++;
  }

  const fiveMinAgo = nowMs - 5 * 60_000;
  const recentValidatedCount = recentEvents.filter(
    (e) => e.kind === "submission_validated" && toMs(e.at) >= fiveMinAgo,
  ).length;

  let status: HackStatus = "serein";
  if (recentValidatedCount >= 2) status = "euphorique";
  else if (staleCount >= 3) status = "inquiet";
  else if (total > 0 && idleCount / total >= 0.4) status = "concentre";

  // Micro-action surfaced next to the banner (GMR-08).
  let microAction: HackStatusMicroAction | null = null;
  if (status === "inquiet" && staleCount > 0) {
    microAction = {
      label: `Réveiller les ${staleCount} équipes`,
      href: "/admin/announce?targets=stale",
    };
  } else if (status === "euphorique") {
    microAction = {
      label: "Diffuser une célébration",
      href: "/admin/announce?kind=celebration",
    };
  }

  return {
    status,
    staleCount,
    idleCount,
    activeCount,
    recentValidatedCount,
    microAction,
  };
}
