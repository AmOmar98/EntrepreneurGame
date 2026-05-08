// Phase 3 / Plan 01 - Mentor data layer.
// Server-side queries for /mentor: list cohorte Players with current Project score,
// submitted-vs-total deliverables counter, and per-Player submissions awaiting
// review by the connected mentor.
// Dual-mode (DATA-03): demo mode (no Supabase env) returns [] - no seed leak.
import { createClient } from "@/utils/supabase/server";
import { levelLabel } from "@/lib/journey";
import type { LevelId, Player, SubmissionStatus } from "@/lib/types";

// ============================================================================
// Public types
// ============================================================================

export type MentorPlayerOverview = {
  player: Player;
  levelLabel: string;
  submittedCount: number;
  totalDeliverables: number;
  pendingSubmissionIds: string[];
};

// ============================================================================
// Row mappers (snake_case -> camelCase, mirrors lib/journey.ts)
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

// Submissions whose status indicates "awaiting verdict from a mentor".
const PENDING_STATUSES: SubmissionStatus[] = ["submitted_v1", "submitted_v2"];

// ============================================================================
// Server-side accessor
// ============================================================================

export async function getMentorPlayersOverview(
  opts?: { onlyPending?: boolean },
): Promise<MentorPlayerOverview[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  // Identify the connected user (used to scope "pending for me" submissions).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Resolve current event (single seed event for the pilot - EVENT-01).
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eventErr) {
    console.error("[mentor] events query failed", eventErr);
    return [];
  }
  if (!eventRow) return [];
  const eventId = (eventRow as { id: string }).id;

  // 2. Fetch cohorts of this event, then players in those cohorts.
  const { data: cohortRows, error: cohortErr } = await supabase
    .from("cohorts")
    .select("id")
    .eq("event_id", eventId);
  if (cohortErr) {
    console.error("[mentor] cohorts query failed", cohortErr);
    return [];
  }
  const cohortIds = (cohortRows ?? []).map((r) => (r as { id: string }).id);
  if (cohortIds.length === 0) return [];

  const { data: playerRows, error: playerErr } = await supabase
    .from("players")
    .select(
      "id, cohort_id, slug, name, idea, current_level, status, score_project, score_engagement, onboarded_at",
    )
    .in("cohort_id", cohortIds)
    .order("name", { ascending: true });
  if (playerErr) {
    console.error("[mentor] players query failed", playerErr);
    return [];
  }
  const players = ((playerRows ?? []) as PlayerRow[]).map(mapPlayer);
  if (players.length === 0) return [];

  // 3. Total deliverable_templates attached to missions of this event.
  const { data: missionRows, error: missionErr } = await supabase
    .from("missions")
    .select("id")
    .eq("event_id", eventId);
  if (missionErr) {
    console.error("[mentor] missions query failed", missionErr);
    return [];
  }
  const missionIds = (missionRows ?? []).map((r) => (r as { id: string }).id);

  let totalDeliverables = 0;
  if (missionIds.length > 0) {
    const { count, error: tplErr } = await supabase
      .from("deliverable_templates")
      .select("id", { count: "exact", head: true })
      .in("mission_id", missionIds);
    if (tplErr) {
      console.error("[mentor] deliverable_templates count failed", tplErr);
      return [];
    }
    totalDeliverables = count ?? 0;
  }

  // 4. Fetch all submissions for these players (one round-trip), bucket in memory.
  const playerIds = players.map((p) => p.id);
  const { data: subRows, error: subErr } = await supabase
    .from("submissions")
    .select("id, player_id, status")
    .in("player_id", playerIds);
  if (subErr) {
    console.error("[mentor] submissions query failed", subErr);
    return [];
  }
  type SubRow = { id: string; player_id: string; status: SubmissionStatus };
  const submissions = (subRows ?? []) as SubRow[];

  // 5. Fetch evaluations authored by the connected user (to know which subs are
  //    already reviewed by ME). Scope by submission ids we just loaded.
  const submissionIds = submissions.map((s) => s.id);
  let evaluatedByMe = new Set<string>();
  if (submissionIds.length > 0) {
    const { data: evalRows, error: evalErr } = await supabase
      .from("evaluations")
      .select("submission_id")
      .eq("evaluator_id", user.id)
      .in("submission_id", submissionIds);
    if (evalErr) {
      console.error("[mentor] evaluations query failed", evalErr);
      return [];
    }
    evaluatedByMe = new Set(
      (evalRows ?? []).map((r) => (r as { submission_id: string }).submission_id),
    );
  }

  // Aggregate per-player counters and pending submission ids.
  const submittedByPlayer = new Map<string, number>();
  const pendingByPlayer = new Map<string, string[]>();
  for (const s of submissions) {
    submittedByPlayer.set(s.player_id, (submittedByPlayer.get(s.player_id) ?? 0) + 1);
    if (PENDING_STATUSES.includes(s.status) && !evaluatedByMe.has(s.id)) {
      const arr = pendingByPlayer.get(s.player_id) ?? [];
      arr.push(s.id);
      pendingByPlayer.set(s.player_id, arr);
    }
  }

  const rows: MentorPlayerOverview[] = players.map((player) => ({
    player,
    levelLabel: levelLabel(player.currentLevel),
    submittedCount: submittedByPlayer.get(player.id) ?? 0,
    totalDeliverables,
    pendingSubmissionIds: pendingByPlayer.get(player.id) ?? [],
  }));

  if (opts?.onlyPending) {
    return rows.filter((r) => r.pendingSubmissionIds.length > 0);
  }
  return rows;
}
