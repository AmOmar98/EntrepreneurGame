// Phase 5 / Plan 02 - Results data layer (JURY-03).
// Server-side queries for /results: combined ranking based on the average
// PitchScore (mean over jurors) and players.score_project, weighted 50/50 by
// default. Dual-mode (DATA-03): demo mode (no Supabase env) returns empty.
import { createClient } from "@/utils/supabase/server";
import type { Player, LevelId } from "@/lib/types";

// ============================================================================
// Public types
// ============================================================================

export type RankingRow = {
  rank: number;
  player: Player;
  pitchAvg: number; // arithmetic mean of PitchScore.total_score (0..100); 0 when no juror has scored
  pitchJurorCount: number;
  scoreProject: number; // copy of player.score_project
  combined: number; // pitchWeight * pitchAvg + (1 - pitchWeight) * scoreProject
};

export const DEFAULT_PITCH_WEIGHT = 0.5;

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

type PitchScoreLite = {
  player_id: string;
  total_score: number | string;
};

// ============================================================================
// Helpers
// ============================================================================

function clampWeight(w: number | undefined): number {
  if (typeof w !== "number" || Number.isNaN(w)) return DEFAULT_PITCH_WEIGHT;
  if (w < 0) return 0;
  if (w > 1) return 1;
  return w;
}

function dense(rows: Omit<RankingRow, "rank">[]): RankingRow[] {
  // Dense ranking: ties share the same rank, next rank is +1 (no skip).
  // Tie-break already applied in caller's sort.
  let lastCombined: number | null = null;
  let currentRank = 0;
  return rows.map((row) => {
    if (lastCombined === null || row.combined !== lastCombined) {
      currentRank += 1;
      lastCombined = row.combined;
    }
    return { ...row, rank: currentRank };
  });
}

// ============================================================================
// Server-side accessors
// ============================================================================

export async function isResultsPublished(): Promise<{
  eventId: string | null;
  publishedAt: string | null;
}> {
  const supabase = await createClient();
  if (!supabase) return { eventId: null, publishedAt: null };

  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id, results_published_at")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eventErr) {
    console.error("[results] events query failed", eventErr);
    return { eventId: null, publishedAt: null };
  }
  if (!eventRow) return { eventId: null, publishedAt: null };
  const row = eventRow as { id: string; results_published_at: string | null };
  return { eventId: row.id, publishedAt: row.results_published_at };
}

export async function computeRanking(opts?: { pitchWeight?: number }): Promise<{
  eventId: string | null;
  publishedAt: string | null;
  rows: RankingRow[];
}> {
  const pitchWeight = clampWeight(opts?.pitchWeight);
  const projectWeight = 1 - pitchWeight;

  const supabase = await createClient();
  if (!supabase) return { eventId: null, publishedAt: null, rows: [] };

  // 1. Resolve current event (latest by starts_at).
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id, results_published_at")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eventErr) {
    console.error("[results] events query failed", eventErr);
    return { eventId: null, publishedAt: null, rows: [] };
  }
  if (!eventRow) return { eventId: null, publishedAt: null, rows: [] };
  const event = eventRow as { id: string; results_published_at: string | null };
  const eventId = event.id;
  const publishedAt = event.results_published_at;

  // 2. Cohorts of this event -> players.
  const { data: cohortRows, error: cohortErr } = await supabase
    .from("cohorts")
    .select("id")
    .eq("event_id", eventId);
  if (cohortErr) {
    console.error("[results] cohorts query failed", cohortErr);
    return { eventId, publishedAt, rows: [] };
  }
  const cohortIds = (cohortRows ?? []).map((r) => (r as { id: string }).id);
  if (cohortIds.length === 0) return { eventId, publishedAt, rows: [] };

  const { data: playerRows, error: playerErr } = await supabase
    .from("players")
    .select(
      "id, cohort_id, slug, name, idea, current_level, status, score_project, score_engagement, onboarded_at",
    )
    .in("cohort_id", cohortIds)
    .order("name", { ascending: true });
  if (playerErr) {
    console.error("[results] players query failed", playerErr);
    return { eventId, publishedAt, rows: [] };
  }
  const players = ((playerRows ?? []) as PlayerRow[]).map(mapPlayer);
  if (players.length === 0) return { eventId, publishedAt, rows: [] };

  // 3. Pitch scores for this event.
  const { data: scoreRows, error: scoreErr } = await supabase
    .from("pitch_scores")
    .select("player_id, total_score")
    .eq("event_id", eventId);
  if (scoreErr) {
    console.error("[results] pitch_scores query failed", scoreErr);
    return { eventId, publishedAt, rows: [] };
  }

  // 4. Aggregate pitch scores per player (mean + count).
  const sumByPlayer = new Map<string, number>();
  const countByPlayer = new Map<string, number>();
  for (const r of (scoreRows ?? []) as PitchScoreLite[]) {
    const total = typeof r.total_score === "string" ? Number(r.total_score) : r.total_score;
    if (Number.isNaN(total)) continue;
    sumByPlayer.set(r.player_id, (sumByPlayer.get(r.player_id) ?? 0) + total);
    countByPlayer.set(r.player_id, (countByPlayer.get(r.player_id) ?? 0) + 1);
  }

  // 5. Build rows.
  const rowsUnranked: Omit<RankingRow, "rank">[] = players.map((player) => {
    const count = countByPlayer.get(player.id) ?? 0;
    const sum = sumByPlayer.get(player.id) ?? 0;
    const pitchAvg = count > 0 ? sum / count : 0;
    const scoreProject = player.scoreProject;
    const combined = pitchWeight * pitchAvg + projectWeight * scoreProject;
    return {
      player,
      pitchAvg,
      pitchJurorCount: count,
      scoreProject,
      combined,
    };
  });

  // 6. Sort: combined desc, pitchAvg desc, name asc.
  rowsUnranked.sort((a, b) => {
    if (b.combined !== a.combined) return b.combined - a.combined;
    if (b.pitchAvg !== a.pitchAvg) return b.pitchAvg - a.pitchAvg;
    return a.player.name.localeCompare(b.player.name);
  });

  return { eventId, publishedAt, rows: dense(rowsUnranked) };
}
