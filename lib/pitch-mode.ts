// quick-260519-jpr - Pitch mode visibility helpers (Wave 2 Agent #3).
// Centralises the "who can see what" matrix for pitch scores & ranking
// based on events.pitch_mode_state (off|live|closed) and
// events.results_published_at. R1 cardinal preserved: Players and
// non-juror mentors never see ranking nor aggregated scores.
//
// State machine recap:
//   - off    : pre-event preparation, jurors only see own draft scores
//   - live   : pitches happening, jurors only see their own scores
//   - closed : pitches over, jurors see aggregated mean across jurors
//   - published (results_published_at !== null) : everyone authenticated
//     sees the full ranking (handled by lib/results.ts service-role bypass)

import { createClient } from "@/utils/supabase/server";
import type { PitchModeState } from "@/lib/types";

// ============================================================================
// Server-side accessor
// ============================================================================

export async function getCurrentPitchModeState(): Promise<{
  eventId: string | null;
  state: PitchModeState;
  closedAt: string | null;
  publishedAt: string | null;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return { eventId: null, state: "off", closedAt: null, publishedAt: null };
  }

  const { data: eventRow, error } = await supabase
    .from("events")
    .select("id, pitch_mode_state, pitch_mode_closed_at, results_published_at")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[pitch-mode] events query failed", error);
    return { eventId: null, state: "off", closedAt: null, publishedAt: null };
  }
  if (!eventRow) {
    return { eventId: null, state: "off", closedAt: null, publishedAt: null };
  }

  const row = eventRow as {
    id: string;
    pitch_mode_state: PitchModeState | null;
    pitch_mode_closed_at: string | null;
    results_published_at: string | null;
  };
  return {
    eventId: row.id,
    state: (row.pitch_mode_state ?? "off") as PitchModeState,
    closedAt: row.pitch_mode_closed_at,
    publishedAt: row.results_published_at,
  };
}

// ============================================================================
// Pure visibility predicates (no I/O — caller fetches context once)
// ============================================================================

/**
 * Can the requester see other jurors' pitch scores aggregated (i.e. the mean
 * across all jurors for each player) ?
 * - GameMaster: always true
 * - Published results (publishedAt !== null) AND requester is juror : true
 * - state === 'closed' AND requester is juror : true
 * - Everyone else (Player, mentor non-juror, juror during off/live) : false
 */
export function canSeeOtherJurorsScores(
  state: PitchModeState,
  isJuror: boolean,
  isGameMaster: boolean,
  publishedAt: string | null,
): boolean {
  if (isGameMaster) return true;
  if (publishedAt !== null && isJuror) return true;
  if (state === "closed" && isJuror) return true;
  return false;
}

/**
 * Can the requester see the full combined ranking (every player, ordered) ?
 * - GameMaster: always true
 * - Published AND requester is juror : true
 * - Player and mentor non-juror : NEVER (R1 cardinal — score visible Player
 *   only on the deliverable detail page).
 */
export function canSeeFullRanking(
  isJuror: boolean,
  isGameMaster: boolean,
  publishedAt: string | null,
): boolean {
  if (isGameMaster) return true;
  if (publishedAt !== null && isJuror) return true;
  return false;
}
