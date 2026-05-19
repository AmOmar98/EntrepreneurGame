// Phase 5 / Plan 01 - Jury data layer (JURY-01).
// Server-side queries for /jury: list cohort Players + the connected juror's
// existing PitchScore row (if any) for the current event.
// Dual-mode (DATA-03): demo mode (no Supabase env) returns empty result.
//
// V10 (polish/design-v2-match): players are now ordered by
// events.pitch_order_json {playerId: slot} ascending when present.
// Falls back to name ASC when no order has been set by the GameMaster.
import { createClient } from "@/utils/supabase/server";
import { getPlayerSlot, type PitchOrder } from "@/lib/pitch-order";
import { getCurrentPitchModeState } from "@/lib/pitch-mode";
import { isCurrentUserJuror } from "@/lib/jurors";
import type { PitchScore, Player, LevelId, PitchModeState } from "@/lib/types";

// ============================================================================
// Public types
// ============================================================================

/**
 * Aggregate of all jurors' scores for a single player, visible to jurors
 * only when `pitch_mode_state = 'closed'` or results are published. RLS
 * (`pitch_scores_select_visibility`) enforces this server-side.
 */
export type JuryAggregate = {
  c1Avg: number;
  c2Avg: number;
  c3Avg: number;
  c4Avg: number;
  /** Weighted average on /100 (sum × 5 / 4 — mirrors lib/results.ts pitchAvg). */
  avg100: number;
  jurorCount: number;
};

export type JuryPlayerRow = {
  player: Player;
  existing: PitchScore | null;
  /** Populated only when `pitchModeState === 'closed'`. */
  aggregate: JuryAggregate | null;
};

// ============================================================================
// Row mappers (snake_case -> camelCase)
// ============================================================================

type PlayerRow = {
  id: string;
  cohort_id: string;
  slug: string;
  name: string;
  idea: string | null;
  current_level: LevelId;
  status: Player["status"];
  score_project: number | string;
  score_engagement: number | string;
  onboarded_at: string | null;
};

function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    cohortId: row.cohort_id,
    slug: row.slug,
    name: row.name,
    idea: row.idea,
    currentLevel: row.current_level,
    status: row.status,
    scoreProject:
      typeof row.score_project === "string" ? Number(row.score_project) : row.score_project,
    scoreEngagement:
      typeof row.score_engagement === "string"
        ? Number(row.score_engagement)
        : row.score_engagement,
    onboardedAt: row.onboarded_at,
  };
}

type PitchScoreRow = {
  id: string;
  event_id: string;
  player_id: string;
  juror_id: string;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  total_score: number | string;
};

export function mapPitchScore(row: PitchScoreRow): PitchScore {
  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    jurorId: row.juror_id,
    c1: row.c1,
    c2: row.c2,
    c3: row.c3,
    c4: row.c4,
    c5: row.c5,
    totalScore: typeof row.total_score === "string" ? Number(row.total_score) : row.total_score,
  };
}

// ============================================================================
// Server-side accessor
// ============================================================================

export async function getJuryOverview(): Promise<{
  eventId: string | null;
  rows: JuryPlayerRow[];
  pitchModeState: PitchModeState;
  notInvited: boolean;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return { eventId: null, rows: [], pitchModeState: "off", notInvited: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { eventId: null, rows: [], pitchModeState: "off", notInvited: false };
  }

  // 1. Resolve current event (latest by starts_at - mirror lib/mentor.ts).
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id, pitch_order_json")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eventErr) {
    console.error("[jury] events query failed", eventErr);
    return { eventId: null, rows: [], pitchModeState: "off", notInvited: false };
  }
  if (!eventRow) {
    return { eventId: null, rows: [], pitchModeState: "off", notInvited: false };
  }
  const eventId = (eventRow as { id: string }).id;
  const pitchOrder =
    ((eventRow as { pitch_order_json?: PitchOrder | null }).pitch_order_json ??
      null) as PitchOrder | null;

  // 1.b Fetch pitch mode + jury membership in parallel.
  const [{ state: pitchModeState }, juror] = await Promise.all([
    getCurrentPitchModeState(),
    isCurrentUserJuror(eventId),
  ]);

  // 1.c Non-juror authenticated user: early return with empty rows so the
  // /jury page renders the "not invited" banner (UI: jury_not_invited).
  if (!juror) {
    return { eventId, rows: [], pitchModeState, notInvited: true };
  }

  // 2. Fetch cohorts of this event, then players in those cohorts.
  const { data: cohortRows, error: cohortErr } = await supabase
    .from("cohorts")
    .select("id")
    .eq("event_id", eventId);
  if (cohortErr) {
    console.error("[jury] cohorts query failed", cohortErr);
    return { eventId, rows: [], pitchModeState, notInvited: false };
  }
  const cohortIds = (cohortRows ?? []).map((r) => (r as { id: string }).id);
  if (cohortIds.length === 0) {
    return { eventId, rows: [], pitchModeState, notInvited: false };
  }

  const { data: playerRows, error: playerErr } = await supabase
    .from("players")
    .select(
      "id, cohort_id, slug, name, idea, current_level, status, score_project, score_engagement, onboarded_at",
    )
    .in("cohort_id", cohortIds)
    .order("name", { ascending: true });
  if (playerErr) {
    console.error("[jury] players query failed", playerErr);
    return { eventId, rows: [], pitchModeState, notInvited: false };
  }
  const playersUnsorted = ((playerRows ?? []) as PlayerRow[]).map(mapPlayer);
  if (playersUnsorted.length === 0) {
    return { eventId, rows: [], pitchModeState, notInvited: false };
  }

  // Sort by GameMaster-set pitch order when present; players without a slot
  // go after those with one. Stable tie-breaker on name ASC.
  const players = [...playersUnsorted].sort((a, b) => {
    const sa = getPlayerSlot(pitchOrder, a.id);
    const sb = getPlayerSlot(pitchOrder, b.id);
    if (sa !== null && sb !== null) return sa - sb;
    if (sa !== null) return -1;
    if (sb !== null) return 1;
    return a.name.localeCompare(b.name);
  });

  // 3. Fetch pitch_scores authored by the connected juror for this event.
  const { data: scoreRows, error: scoreErr } = await supabase
    .from("pitch_scores")
    .select("id, event_id, player_id, juror_id, c1, c2, c3, c4, c5, total_score")
    .eq("event_id", eventId)
    .eq("juror_id", user.id);
  if (scoreErr) {
    console.error("[jury] pitch_scores query failed", scoreErr);
    return { eventId, rows: [], pitchModeState, notInvited: false };
  }
  const scoresByPlayer = new Map<string, PitchScore>();
  for (const r of (scoreRows ?? []) as PitchScoreRow[]) {
    scoresByPlayer.set(r.player_id, mapPitchScore(r));
  }

  // 4. Closed mode only: fetch all jurors' scores to compute per-player
  // aggregates. RLS (`pitch_scores_select_visibility`) only authorises the
  // wider SELECT once `events.pitch_mode_state = 'closed'` (or results are
  // published), so this read is privacy-safe in live/off mode (returns []).
  const aggregateByPlayer = new Map<string, JuryAggregate>();
  if (pitchModeState === "closed") {
    const { data: allScoreRows, error: aggErr } = await supabase
      .from("pitch_scores")
      .select("player_id, c1, c2, c3, c4")
      .eq("event_id", eventId);
    if (aggErr) {
      console.error("[jury] pitch_scores aggregate query failed", aggErr);
    } else {
      const buckets = new Map<
        string,
        { c1Sum: number; c2Sum: number; c3Sum: number; c4Sum: number; count: number }
      >();
      for (const r of (allScoreRows ?? []) as Array<{
        player_id: string;
        c1: number;
        c2: number;
        c3: number;
        c4: number;
      }>) {
        const b = buckets.get(r.player_id) ?? {
          c1Sum: 0,
          c2Sum: 0,
          c3Sum: 0,
          c4Sum: 0,
          count: 0,
        };
        b.c1Sum += Number(r.c1) || 0;
        b.c2Sum += Number(r.c2) || 0;
        b.c3Sum += Number(r.c3) || 0;
        b.c4Sum += Number(r.c4) || 0;
        b.count += 1;
        buckets.set(r.player_id, b);
      }
      for (const [playerId, b] of buckets) {
        const c1Avg = b.c1Sum / b.count;
        const c2Avg = b.c2Sum / b.count;
        const c3Avg = b.c3Sum / b.count;
        const c4Avg = b.c4Sum / b.count;
        // 4 critères × 20 = 80 max ; normalise × 5/4 → /100 (cf. lib/results.ts).
        const avg100 = ((c1Avg + c2Avg + c3Avg + c4Avg) * 5) / 4;
        aggregateByPlayer.set(playerId, {
          c1Avg,
          c2Avg,
          c3Avg,
          c4Avg,
          avg100,
          jurorCount: b.count,
        });
      }
    }
  }

  const rows: JuryPlayerRow[] = players.map((player) => ({
    player,
    existing: scoresByPlayer.get(player.id) ?? null,
    aggregate: aggregateByPlayer.get(player.id) ?? null,
  }));
  return { eventId, rows, pitchModeState, notInvited: false };
}
