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
import type { PitchScore, Player, LevelId } from "@/lib/types";

// ============================================================================
// Public types
// ============================================================================

export type JuryPlayerRow = {
  player: Player;
  existing: PitchScore | null;
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
}> {
  const supabase = await createClient();
  if (!supabase) return { eventId: null, rows: [] };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { eventId: null, rows: [] };

  // 1. Resolve current event (latest by starts_at - mirror lib/mentor.ts).
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id, pitch_order_json")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eventErr) {
    console.error("[jury] events query failed", eventErr);
    return { eventId: null, rows: [] };
  }
  if (!eventRow) return { eventId: null, rows: [] };
  const eventId = (eventRow as { id: string }).id;
  const pitchOrder =
    ((eventRow as { pitch_order_json?: PitchOrder | null }).pitch_order_json ??
      null) as PitchOrder | null;

  // 2. Fetch cohorts of this event, then players in those cohorts.
  const { data: cohortRows, error: cohortErr } = await supabase
    .from("cohorts")
    .select("id")
    .eq("event_id", eventId);
  if (cohortErr) {
    console.error("[jury] cohorts query failed", cohortErr);
    return { eventId, rows: [] };
  }
  const cohortIds = (cohortRows ?? []).map((r) => (r as { id: string }).id);
  if (cohortIds.length === 0) return { eventId, rows: [] };

  const { data: playerRows, error: playerErr } = await supabase
    .from("players")
    .select(
      "id, cohort_id, slug, name, idea, current_level, status, score_project, score_engagement, onboarded_at",
    )
    .in("cohort_id", cohortIds)
    .order("name", { ascending: true });
  if (playerErr) {
    console.error("[jury] players query failed", playerErr);
    return { eventId, rows: [] };
  }
  const playersUnsorted = ((playerRows ?? []) as PlayerRow[]).map(mapPlayer);
  if (playersUnsorted.length === 0) return { eventId, rows: [] };

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
    return { eventId, rows: [] };
  }
  const scoresByPlayer = new Map<string, PitchScore>();
  for (const r of (scoreRows ?? []) as PitchScoreRow[]) {
    scoresByPlayer.set(r.player_id, mapPitchScore(r));
  }

  const rows: JuryPlayerRow[] = players.map((player) => ({
    player,
    existing: scoresByPlayer.get(player.id) ?? null,
  }));
  return { eventId, rows };
}
