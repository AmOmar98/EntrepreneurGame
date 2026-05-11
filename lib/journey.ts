// Phase 2 / Plan 02 - Journey data layer.
// Single source of truth for the /journey page: resolves the connected Player,
// fetches today's missions + their deliverable templates, computes statuses.
// Dual-mode (DATA-03): in demo mode (no Supabase env) returns an empty payload
// rather than leaking seed names into the UI.
import { createClient } from "@/utils/supabase/server";
import type {
  DeliverableTemplate,
  LevelId,
  Mission,
  Player,
  RubricCriterion,
  SubmissionStatus,
  Verdict,
} from "@/lib/types";

export type DeliverableStatus = "a_rendre" | SubmissionStatus;

export type JourneyDeliverable = {
  template: DeliverableTemplate;
  status: DeliverableStatus;
  latestSubmissionId: string | null;
  // R1 revised (2026-05-11) — Player-facing XP awarded for this deliverable.
  // Rules: +100 for first submission, +rubric total_score on latest evaluation,
  // +50 if verdict=validate_v1, +100 if verdict=validate_v2 (50 base + 50 V2 bonus).
  earnedXp: number;
};

export type MissionStatus = "a_venir" | "en_cours" | "passe";

export type JourneyMission = {
  mission: Mission;
  status: MissionStatus;
  deliverables: JourneyDeliverable[];
};

export type JourneyData = {
  player: Player | null;
  levelLabel: string;
  missions: JourneyMission[];
  empty: boolean;
};

// ============================================================================
// Pure helpers (deterministic, easy to reason about)
// ============================================================================

// One-hour window: a mission is "en_cours" between scheduledAt and scheduledAt+1h.
const MISSION_DURATION_MS = 60 * 60 * 1000;

export function missionStatus(scheduledAt: string | null, now: Date): MissionStatus {
  if (!scheduledAt) return "a_venir";
  const t = new Date(scheduledAt).getTime();
  if (Number.isNaN(t)) return "a_venir";
  const n = now.getTime();
  if (n < t) return "a_venir";
  if (n <= t + MISSION_DURATION_MS) return "en_cours";
  return "passe";
}

export function computeDeliverableStatus(
  submissions: { id: string; version: number; status: SubmissionStatus }[],
): { status: DeliverableStatus; latestSubmissionId: string | null } {
  if (submissions.length === 0) {
    return { status: "a_rendre", latestSubmissionId: null };
  }
  const latest = submissions.reduce((acc, cur) => (cur.version > acc.version ? cur : acc));
  return { status: latest.status, latestSubmissionId: latest.id };
}

const LEVEL_LABELS: Record<LevelId, string> = {
  L0_diagnostic: "Niveau 0 - Diagnostic",
  L1_problem: "Niveau 1 - Probleme",
  L2_solution: "Niveau 2 - Solution",
  L3_market: "Niveau 3 - Marche",
  L4_business_model: "Niveau 4 - Modele economique",
  L5_pitch: "Niveau 5 - Pitch",
  L6_traction: "Niveau 6 - Traction",
  L7_alumni: "Niveau 7 - Alumni",
};

export function levelLabel(levelId: LevelId): string {
  return LEVEL_LABELS[levelId] ?? String(levelId);
}

const LEVEL_ORDS: Record<LevelId, number> = {
  L0_diagnostic: 0,
  L1_problem: 1,
  L2_solution: 2,
  L3_market: 3,
  L4_business_model: 4,
  L5_pitch: 5,
  L6_traction: 6,
  L7_alumni: 7,
};

/**
 * Numeric ordinal (0..7) for a LevelId. Mirrors database/schema.sql ord values.
 * Used by the admin radar (Phase 9 GMR-02) and any UI that needs to compare levels.
 */
export function levelOrd(levelId: LevelId): number {
  return LEVEL_ORDS[levelId] ?? 0;
}

// Same calendar day in local time. We do not store timezone separately; pilot
// runs in a single TZ (Africa/Casablanca) and the server runs UTC, so this is
// intentionally a "best effort" same-date match.
function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ============================================================================
// Row mappers (snake_case -> camelCase, mirrors the pattern used in app/actions.ts)
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
    scoreProject: typeof row.score_project === "string" ? Number(row.score_project) : row.score_project,
    scoreEngagement:
      typeof row.score_engagement === "string" ? Number(row.score_engagement) : row.score_engagement,
    onboardedAt: row.onboarded_at,
  };
}

type MissionRow = {
  id: string;
  event_id: string;
  level_id: LevelId;
  ord: number;
  kind: Mission["kind"];
  title: string;
  scheduled_at: string | null;
};

function mapMission(row: MissionRow): Mission {
  return {
    id: row.id,
    eventId: row.event_id,
    levelId: row.level_id,
    ord: row.ord,
    kind: row.kind,
    title: row.title,
    scheduledAt: row.scheduled_at,
  };
}

type DeliverableTemplateRow = {
  id: string;
  mission_id: string;
  slug: string;
  title: string;
  description: string;
  rubric: RubricCriterion[] | null;
  max_score: number;
  ord: number;
};

function mapDeliverableTemplate(row: DeliverableTemplateRow): DeliverableTemplate {
  return {
    id: row.id,
    missionId: row.mission_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    rubric: Array.isArray(row.rubric) ? row.rubric : [],
    maxScore: row.max_score,
    ord: row.ord,
  };
}

// ============================================================================
// Server-side accessors
// ============================================================================

export async function getPlayerForUser(userId: string): Promise<Player | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: membership, error: memberErr } = await supabase
    .from("player_members")
    .select("player_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (memberErr || !membership) return null;

  const { data: playerRow, error: playerErr } = await supabase
    .from("players")
    .select(
      "id, cohort_id, slug, name, idea, current_level, status, score_project, score_engagement, onboarded_at",
    )
    .eq("id", membership.player_id)
    .maybeSingle();
  if (playerErr || !playerRow) return null;

  return mapPlayer(playerRow as PlayerRow);
}

const EMPTY: JourneyData = { player: null, levelLabel: "", missions: [], empty: true };

export async function getJourneyData(userId: string, now: Date = new Date()): Promise<JourneyData> {
  const supabase = await createClient();
  if (!supabase) return EMPTY;

  const player = await getPlayerForUser(userId);
  if (!player) return EMPTY;

  // Resolve event via cohort.
  const { data: cohortRow } = await supabase
    .from("cohorts")
    .select("event_id")
    .eq("id", player.cohortId)
    .maybeSingle();
  if (!cohortRow) {
    return { player, levelLabel: levelLabel(player.currentLevel), missions: [], empty: true };
  }
  const eventId = (cohortRow as { event_id: string }).event_id;

  // Fetch missions for this event ordered.
  const { data: missionRows } = await supabase
    .from("missions")
    .select("id, event_id, level_id, ord, kind, title, scheduled_at")
    .eq("event_id", eventId)
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("level_id", { ascending: true })
    .order("ord", { ascending: true });

  const allMissions = ((missionRows ?? []) as MissionRow[]).map(mapMission);

  // Filter to today's missions (or unscheduled, treated as "a_venir" today).
  const todayMissions = allMissions.filter((m) => {
    if (!m.scheduledAt) return true;
    const dt = new Date(m.scheduledAt);
    if (Number.isNaN(dt.getTime())) return false;
    return sameLocalDay(dt, now);
  });

  // Fallback : pre-pilot preview / post-pilot recap. When no mission lands on
  // "today" (smoke pre-13 May, J-1 rehearsal, post-event recap), display the
  // full mission list so the Player can still see the parcours instead of an
  // empty page. On the actual event days the today-filter above takes over.
  const displayMissions = todayMissions.length > 0 ? todayMissions : allMissions;

  if (displayMissions.length === 0) {
    return { player, levelLabel: levelLabel(player.currentLevel), missions: [], empty: true };
  }

  const missionIds = displayMissions.map((m) => m.id);

  // Fetch deliverable templates linked to today's missions. Phase 9 / GMR-06:
  // filter out templates with is_active=false so the GameMaster can hide them
  // from the Player parcours without deleting them. The column has default
  // true (DDL in database/migrations/09-gamemaster-live.sql), so this stays
  // backward compatible even when the migration has not been applied yet —
  // is_active is simply absent from the returned rows in that case, treated
  // as `true` server-side.
  const { data: tplRows } = await supabase
    .from("deliverable_templates")
    .select("id, mission_id, slug, title, description, rubric, max_score, ord, is_active")
    .in("mission_id", missionIds)
    .order("ord", { ascending: true });
  const templates = ((tplRows ?? []) as (DeliverableTemplateRow & { is_active?: boolean | null })[])
    .filter((row) => row.is_active === undefined || row.is_active === null || row.is_active === true)
    .map(mapDeliverableTemplate);

  // Fetch this player's submissions for these templates.
  const tplIds = templates.map((t) => t.id);
  let submissions: { id: string; deliverable_template_id: string; version: number; status: SubmissionStatus }[] = [];
  if (tplIds.length > 0) {
    const { data: subRows } = await supabase
      .from("submissions")
      .select("id, deliverable_template_id, version, status")
      .eq("player_id", player.id)
      .in("deliverable_template_id", tplIds);
    submissions = (subRows ?? []) as typeof submissions;
  }

  // R1 revised — fetch latest evaluation per template (across all versions) to
  // compute Player-facing XP. One round-trip, group client-side.
  const subIdToTplId = new Map<string, string>();
  for (const s of submissions) subIdToTplId.set(s.id, s.deliverable_template_id);
  const subIds = submissions.map((s) => s.id);
  const latestEvalByTplId = new Map<string, { totalScore: number; verdict: Verdict }>();
  if (subIds.length > 0) {
    const { data: evalRows } = await supabase
      .from("evaluations")
      .select("submission_id, total_score, verdict, created_at")
      .in("submission_id", subIds)
      .order("created_at", { ascending: false });
    for (const r of (evalRows ?? []) as {
      submission_id: string;
      total_score: number | null;
      verdict: Verdict;
      created_at: string;
    }[]) {
      const tplId = subIdToTplId.get(r.submission_id);
      if (!tplId) continue;
      if (latestEvalByTplId.has(tplId)) continue; // first row per template (DESC order)
      latestEvalByTplId.set(tplId, {
        totalScore: Number(r.total_score ?? 0),
        verdict: r.verdict,
      });
    }
  }

  // Group templates by mission, attach status.
  const tplByMission = new Map<string, DeliverableTemplate[]>();
  for (const tpl of templates) {
    const arr = tplByMission.get(tpl.missionId) ?? [];
    arr.push(tpl);
    tplByMission.set(tpl.missionId, arr);
  }

  const subByTemplate = new Map<string, typeof submissions>();
  for (const s of submissions) {
    const arr = subByTemplate.get(s.deliverable_template_id) ?? [];
    arr.push(s);
    subByTemplate.set(s.deliverable_template_id, arr);
  }

  const missions: JourneyMission[] = displayMissions.map((mission) => {
    const tpls = tplByMission.get(mission.id) ?? [];
    const deliverables: JourneyDeliverable[] = tpls.map((template) => {
      const subs = subByTemplate.get(template.id) ?? [];
      const { status, latestSubmissionId } = computeDeliverableStatus(
        subs.map((s) => ({ id: s.id, version: s.version, status: s.status })),
      );
      // R1 revised — Player-facing XP per deliverable.
      // +100 base on first submission (any version), +score from latest eval,
      // +50 if verdict=validate_v1, +100 if verdict=validate_v2 (50 base + 50 V2 bonus).
      let earnedXp = 0;
      if (subs.length > 0) {
        earnedXp += 100;
        const evalEntry = latestEvalByTplId.get(template.id);
        if (evalEntry) {
          earnedXp += evalEntry.totalScore;
          if (evalEntry.verdict === "validate_v1") earnedXp += 50;
          if (evalEntry.verdict === "validate_v2") earnedXp += 100;
        }
      }
      return { template, status, latestSubmissionId, earnedXp };
    });
    return {
      mission,
      status: missionStatus(mission.scheduledAt, now),
      deliverables,
    };
  });

  return {
    player,
    levelLabel: levelLabel(player.currentLevel),
    missions,
    empty: false,
  };
}
