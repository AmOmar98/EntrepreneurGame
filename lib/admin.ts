// Phase 4 / Plan 01 - Admin (GameMaster) data layer.
// Server-side queries for /admin: cohort overview (one row per Player) and
// global counters (livrables soumis / total, en attente revue, valides).
// Dual-mode (DATA-03): demo mode (no Supabase env) returns empty / zero defaults
// rather than leaking seed data.
import { createClient } from "@/utils/supabase/server";
import { levelLabel } from "@/lib/journey";
import type { LevelId, Player, SubmissionStatus } from "@/lib/types";

// ============================================================================
// Public types
// ============================================================================

export type CohortRowStatus = "en_avance" | "a_l_heure" | "retard";

export type CohortRow = {
  player: Player;
  levelLabel: string;
  status: CohortRowStatus;
  // First non-validated and non-submitted deliverable_template title (by mission ord, then template ord).
  // null when every template has a submission in (validated, submitted_v1, submitted_v2).
  nextDeliverableTitle: string | null;
};

export type GlobalCounters = {
  totalSubmissions: number;
  pendingReview: number; // status in ('submitted_v1','submitted_v2') AND no evaluation row yet
  validated: number; // submissions where status='validated'
  totalDeliverableSlots: number; // playersCount * deliverable_templates of current event
};

// ============================================================================
// Row mappers (snake_case -> camelCase, mirrors lib/mentor.ts)
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

// Submission statuses considered "in flight" (count toward "next deliverable" being not-needed).
const IN_FLIGHT_STATUSES: SubmissionStatus[] = ["submitted_v1", "submitted_v2", "validated"];
const PENDING_STATUSES: SubmissionStatus[] = ["submitted_v1", "submitted_v2"];

// ============================================================================
// Internal helpers
// ============================================================================

type MissionRow = {
  id: string;
  ord: number;
  level_id: LevelId;
  scheduled_at: string | null;
};

type TemplateRow = {
  id: string;
  mission_id: string;
  title: string;
  ord: number;
};

type SubmissionRow = {
  id: string;
  player_id: string;
  deliverable_template_id: string;
  status: SubmissionStatus;
};

// ============================================================================
// Server-side accessors
// ============================================================================

/**
 * Returns one row per Player in the current event's cohorts, with the
 * first non-validated deliverable as "next" and a heuristic status.
 * Empty array when Supabase is not configured or when no event/cohort exists.
 */
export async function getCohortOverview(): Promise<CohortRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  // 1. Resolve current event (mirror mentor.ts).
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eventErr) {
    console.error("[admin] events query failed", eventErr);
    return [];
  }
  if (!eventRow) return [];
  const eventId = (eventRow as { id: string }).id;

  // 2. Cohorts of this event, then players in those cohorts.
  const { data: cohortRows, error: cohortErr } = await supabase
    .from("cohorts")
    .select("id")
    .eq("event_id", eventId);
  if (cohortErr) {
    console.error("[admin] cohorts query failed", cohortErr);
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
    console.error("[admin] players query failed", playerErr);
    return [];
  }
  const players = ((playerRows ?? []) as PlayerRow[]).map(mapPlayer);
  if (players.length === 0) return [];

  // 3. Missions of this event (ord + scheduled_at to compute "expected progress").
  const { data: missionRows, error: missionErr } = await supabase
    .from("missions")
    .select("id, ord, level_id, scheduled_at")
    .eq("event_id", eventId)
    .order("ord", { ascending: true });
  if (missionErr) {
    console.error("[admin] missions query failed", missionErr);
    return [];
  }
  const missions = (missionRows ?? []) as MissionRow[];
  const missionIds = missions.map((m) => m.id);
  const missionOrdById = new Map<string, number>();
  for (const m of missions) missionOrdById.set(m.id, m.ord);

  // 4. Deliverable templates for these missions, sorted by mission.ord then template.ord.
  let templates: TemplateRow[] = [];
  if (missionIds.length > 0) {
    const { data: tplRows, error: tplErr } = await supabase
      .from("deliverable_templates")
      .select("id, mission_id, title, ord")
      .in("mission_id", missionIds);
    if (tplErr) {
      console.error("[admin] deliverable_templates query failed", tplErr);
      return [];
    }
    templates = ((tplRows ?? []) as TemplateRow[]).slice().sort((a, b) => {
      const aOrd = missionOrdById.get(a.mission_id) ?? 0;
      const bOrd = missionOrdById.get(b.mission_id) ?? 0;
      if (aOrd !== bOrd) return aOrd - bOrd;
      return a.ord - b.ord;
    });
  }

  // 5. All submissions for these players (one round-trip).
  const playerIds = players.map((p) => p.id);
  let submissions: SubmissionRow[] = [];
  if (playerIds.length > 0) {
    const { data: subRows, error: subErr } = await supabase
      .from("submissions")
      .select("id, player_id, deliverable_template_id, status")
      .in("player_id", playerIds);
    if (subErr) {
      console.error("[admin] submissions query failed", subErr);
      return [];
    }
    submissions = (subRows ?? []) as SubmissionRow[];
  }

  // Bucket submissions per (player, template) - keep latest "best" status per pair.
  // For "next deliverable" we only need to know whether a player has any in-flight or validated
  // submission for a given template. Use a Set keyed by `${playerId}::${templateId}`.
  const inFlightSet = new Set<string>();
  const validatedByPlayer = new Map<string, number>();
  for (const s of submissions) {
    if (IN_FLIGHT_STATUSES.includes(s.status)) {
      inFlightSet.add(`${s.player_id}::${s.deliverable_template_id}`);
    }
    if (s.status === "validated") {
      validatedByPlayer.set(s.player_id, (validatedByPlayer.get(s.player_id) ?? 0) + 1);
    }
  }

  // Count submissions per player (any status) for the "retard" heuristic.
  const submittedByPlayer = new Map<string, number>();
  for (const s of submissions) {
    submittedByPlayer.set(s.player_id, (submittedByPlayer.get(s.player_id) ?? 0) + 1);
  }

  // 6. Compute "elapsed missions" = missions whose scheduled_at <= now (null = future).
  const now = Date.now();
  let elapsedMissions = 0;
  for (const m of missions) {
    if (!m.scheduled_at) continue;
    const t = new Date(m.scheduled_at).getTime();
    if (!Number.isNaN(t) && t <= now) elapsedMissions++;
  }

  // 7. Build rows.
  const rows: CohortRow[] = players.map((player) => {
    // Next deliverable = first template (mission-ord, template-ord) with NO in-flight submission.
    let nextTitle: string | null = null;
    for (const tpl of templates) {
      if (!inFlightSet.has(`${player.id}::${tpl.id}`)) {
        nextTitle = tpl.title;
        break;
      }
    }

    // Pilot heuristic for status (see plan §Task 1):
    //   retard    : submittedCount === 0 AND elapsedMissions > 0
    //   en_avance : validatedCount >= elapsedMissions + 1
    //   a_l_heure : otherwise
    // This is intentionally simple for Day-1; a richer per-mission expectation
    // computation can land in V2.
    const submittedCount = submittedByPlayer.get(player.id) ?? 0;
    const validatedCount = validatedByPlayer.get(player.id) ?? 0;
    let status: CohortRowStatus;
    if (submittedCount === 0 && elapsedMissions > 0) {
      status = "retard";
    } else if (validatedCount >= elapsedMissions + 1) {
      status = "en_avance";
    } else {
      status = "a_l_heure";
    }

    return {
      player,
      levelLabel: levelLabel(player.currentLevel),
      status,
      nextDeliverableTitle: nextTitle,
    };
  });

  return rows;
}

/**
 * Aggregate counters across the current event:
 *   - totalSubmissions: all submissions for players of the event
 *   - pendingReview: submitted_v1/submitted_v2 with no evaluation row yet
 *   - validated: submissions with status='validated'
 *   - totalDeliverableSlots: playersCount * deliverable_templates of event
 */
export async function getGlobalCounters(): Promise<GlobalCounters> {
  const zero: GlobalCounters = {
    totalSubmissions: 0,
    pendingReview: 0,
    validated: 0,
    totalDeliverableSlots: 0,
  };
  const supabase = await createClient();
  if (!supabase) return zero;

  // Resolve current event.
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eventErr) {
    console.error("[admin] events query failed", eventErr);
    return zero;
  }
  if (!eventRow) return zero;
  const eventId = (eventRow as { id: string }).id;

  // Cohorts -> players.
  const { data: cohortRows, error: cohortErr } = await supabase
    .from("cohorts")
    .select("id")
    .eq("event_id", eventId);
  if (cohortErr) {
    console.error("[admin] cohorts query failed", cohortErr);
    return zero;
  }
  const cohortIds = (cohortRows ?? []).map((r) => (r as { id: string }).id);
  if (cohortIds.length === 0) return zero;

  const { data: playerRows, error: playerErr } = await supabase
    .from("players")
    .select("id")
    .in("cohort_id", cohortIds);
  if (playerErr) {
    console.error("[admin] players query failed", playerErr);
    return zero;
  }
  const playerIds = (playerRows ?? []).map((r) => (r as { id: string }).id);
  const playersCount = playerIds.length;

  // Missions -> deliverable templates count.
  const { data: missionRows, error: missionErr } = await supabase
    .from("missions")
    .select("id")
    .eq("event_id", eventId);
  if (missionErr) {
    console.error("[admin] missions query failed", missionErr);
    return zero;
  }
  const missionIds = (missionRows ?? []).map((r) => (r as { id: string }).id);

  let templatesCount = 0;
  if (missionIds.length > 0) {
    const { count, error: tplErr } = await supabase
      .from("deliverable_templates")
      .select("id", { count: "exact", head: true })
      .in("mission_id", missionIds);
    if (tplErr) {
      console.error("[admin] deliverable_templates count failed", tplErr);
      return zero;
    }
    templatesCount = count ?? 0;
  }

  const totalDeliverableSlots = playersCount * templatesCount;

  if (playerIds.length === 0) {
    return { totalSubmissions: 0, pendingReview: 0, validated: 0, totalDeliverableSlots };
  }

  // Submissions for these players.
  const { data: subRows, error: subErr } = await supabase
    .from("submissions")
    .select("id, status")
    .in("player_id", playerIds);
  if (subErr) {
    console.error("[admin] submissions query failed", subErr);
    return { totalSubmissions: 0, pendingReview: 0, validated: 0, totalDeliverableSlots };
  }
  const submissions = (subRows ?? []) as { id: string; status: SubmissionStatus }[];
  const totalSubmissions = submissions.length;
  const validated = submissions.filter((s) => s.status === "validated").length;

  // Pending review = submitted_v1/submitted_v2 with no evaluation row.
  const pendingCandidates = submissions.filter((s) => PENDING_STATUSES.includes(s.status));
  let pendingReview = 0;
  if (pendingCandidates.length > 0) {
    const candidateIds = pendingCandidates.map((s) => s.id);
    const { data: evalRows, error: evalErr } = await supabase
      .from("evaluations")
      .select("submission_id")
      .in("submission_id", candidateIds);
    if (evalErr) {
      console.error("[admin] evaluations query failed", evalErr);
      return { totalSubmissions, pendingReview: 0, validated, totalDeliverableSlots };
    }
    const evaluatedSet = new Set(
      (evalRows ?? []).map((r) => (r as { submission_id: string }).submission_id),
    );
    pendingReview = pendingCandidates.filter((s) => !evaluatedSet.has(s.id)).length;
  }

  return { totalSubmissions, pendingReview, validated, totalDeliverableSlots };
}
