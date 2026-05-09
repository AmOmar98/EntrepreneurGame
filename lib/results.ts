// Phase 5 / Plan 02 - Results data layer (JURY-03).
// Server-side queries for /results: combined ranking based on the average
// PitchScore (mean over jurors) and players.score_project, weighted 50/50 by
// default. Dual-mode (DATA-03): demo mode (no Supabase env) returns empty.
//
// Post-publish visibility (Finding 1, smoke 2026-05-09): once
// events.results_published_at is set, the ranking must be visible to ALL
// authenticated users (Players included). RLS on `players` filters per
// player_member, which would only show each Player their own row. We bypass
// that with a service-role client *only after publication* — the page route
// itself is still gated by middleware auth and the role check in
// app/results/page.tsx, so we are not exposing data publicly.
import { createClient as createServiceClient } from "@supabase/supabase-js";
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
// Service-role client builder (post-publish bypass — see file header).
// Returns null when SUPABASE_SERVICE_ROLE_KEY is missing/placeholder; in that
// case computeRanking falls back to the RLS-aware client (preview-only).
// ============================================================================

type ServiceClient = ReturnType<typeof createServiceClient>;

function buildServiceClient(): ServiceClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === "replace-me") return null;
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
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

  const rlsClient = await createClient();
  if (!rlsClient) return { eventId: null, publishedAt: null, rows: [] };

  // 1. Resolve current event (latest by starts_at). RLS-aware — events SELECT
  // is open to all authenticated users.
  const { data: eventRow, error: eventErr } = await rlsClient
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

  // Post-publish, prefer service-role to bypass RLS on players + pitch_scores
  // so every authenticated user (Players included) sees the full ranking. The
  // page itself stays gated by middleware auth + the in-page non-GM/published
  // check in app/results/page.tsx, so we never expose data anonymously.
  //
  // Defensive fallback: if SUPABASE_SERVICE_ROLE_KEY is missing OR misconfigured
  // (e.g. the env var was set to the anon key by mistake — observed in prod
  // 2026-05-09: cohorts query "permission denied" via service client because
  // anon role has no SELECT grant on public.cohorts), retry every query through
  // the RLS-aware client. Players see only their own row in that degraded mode
  // but the page still renders.
  const useServiceRole = publishedAt !== null;
  const serviceClient = useServiceRole ? buildServiceClient() : null;

  async function fetchCohortsAndPlayers(client: NonNullable<typeof rlsClient>) {
    const { data: cohortRows, error: cohortErr } = await client
      .from("cohorts")
      .select("id")
      .eq("event_id", eventId);
    if (cohortErr) return { error: cohortErr, players: [] as Player[] };
    const cohortIds = (cohortRows ?? []).map((r) => (r as { id: string }).id);
    if (cohortIds.length === 0) return { error: null, players: [] as Player[] };
    const { data: playerRows, error: playerErr } = await client
      .from("players")
      .select(
        "id, cohort_id, slug, name, idea, current_level, status, score_project, score_engagement, onboarded_at",
      )
      .in("cohort_id", cohortIds)
      .order("name", { ascending: true });
    if (playerErr) return { error: playerErr, players: [] as Player[] };
    const mapped = ((playerRows ?? []) as PlayerRow[]).map(mapPlayer);
    return { error: null, players: mapped };
  }

  let players: Player[] = [];
  let usedFallback = false;
  if (serviceClient) {
    const r = await fetchCohortsAndPlayers(serviceClient);
    if (r.error) {
      console.error("[results] service-role query failed, falling back to RLS", r.error);
      usedFallback = true;
    } else {
      players = r.players;
    }
  }
  if (serviceClient === null || usedFallback) {
    const r = await fetchCohortsAndPlayers(rlsClient);
    if (r.error) {
      console.error("[results] cohorts query failed", r.error);
      return { eventId, publishedAt, rows: [] };
    }
    players = r.players;
  }
  if (players.length === 0) return { eventId, publishedAt, rows: [] };

  // 3. Pitch scores for this event. Same fallback strategy as above.
  async function fetchPitchScores(client: NonNullable<typeof rlsClient>) {
    return client.from("pitch_scores").select("player_id, total_score").eq("event_id", eventId);
  }

  let scoreRowsResolved: PitchScoreLite[] = [];
  if (serviceClient && !usedFallback) {
    const { data, error } = await fetchPitchScores(serviceClient);
    if (error) {
      const { data: rlsData, error: rlsErr } = await fetchPitchScores(rlsClient);
      if (rlsErr) {
        console.error("[results] pitch_scores query failed", rlsErr);
        return { eventId, publishedAt, rows: [] };
      }
      scoreRowsResolved = (rlsData ?? []) as PitchScoreLite[];
    } else {
      scoreRowsResolved = (data ?? []) as PitchScoreLite[];
    }
  } else {
    const { data, error } = await fetchPitchScores(rlsClient);
    if (error) {
      console.error("[results] pitch_scores query failed", error);
      return { eventId, publishedAt, rows: [] };
    }
    scoreRowsResolved = (data ?? []) as PitchScoreLite[];
  }

  // 4. Aggregate pitch scores per player (mean + count).
  const sumByPlayer = new Map<string, number>();
  const countByPlayer = new Map<string, number>();
  for (const r of scoreRowsResolved) {
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
