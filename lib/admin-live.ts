// Phase 9 / GMR-01 + GMR-02 + GMR-08 — Admin live mode data layer.
// Aggregates everything the admin live mode needs in one round-trip block:
//   - per-team radar nodes (id, score, level, activity state)
//   - recent events for the game-flow ticker (last 50, latest first)
//   - recent validated events used by computeHackStatus()
//
// Dual-mode (DATA-03): demo mode (no Supabase env) returns empty defaults
// so the admin page renders without leaking seed data.
import { createClient } from "@/utils/supabase/server";
import { levelOrd } from "@/lib/journey";
import {
  computeTeamActivityState,
  latestActivityMs,
  type TeamActivityState,
} from "@/lib/team-activity";
import type { HackStatusEvent } from "@/lib/hack-status";
import type { LevelId, SubmissionStatus } from "@/lib/types";

// ============================================================================
// Public types
// ============================================================================

export type AdminLiveTeam = {
  id: string;
  name: string;
  slug: string;
  idea: string | null;
  currentLevel: LevelId;
  level: number; // 0..7 numeric mirror of currentLevel for radar
  scoreProject: number;
  state: TeamActivityState;
  minutesSinceActivity: number | null;
  membersCount: number;
  submittedCount: number;
  validatedCount: number;
  // Initials for avatar cluster (best-effort: derived from member emails / names).
  memberInitials: string[];
};

export type GameFlowEntry = {
  id: string;
  at: string; // ISO
  team: string; // team display name
  // FR copy fragments — composer-friendly.
  kind: "submission_v1" | "submission_v2" | "validated" | "evaluation" | "comment";
  label: string;
  // Optional accent colour token for the dot ('green' | 'amber' | 'red' | 'blue').
  tone: "green" | "amber" | "red" | "blue";
};

export type AdminLiveSnapshot = {
  teams: AdminLiveTeam[];
  gameFlow: GameFlowEntry[];
  recentValidatedEvents: HackStatusEvent[];
};

// ============================================================================
// Internal row shapes
// ============================================================================

type PlayerRow = {
  id: string;
  slug: string;
  name: string;
  idea: string | null;
  current_level: LevelId;
  score_project: number | string;
};

type SubmissionRow = {
  id: string;
  player_id: string;
  status: SubmissionStatus;
  submitted_at: string;
  deliverable_template_id: string;
};

type EvaluationRow = {
  id: string;
  submission_id: string;
  evaluator_id: string;
  verdict: string;
  created_at: string;
};

type CommentRow = {
  id: string;
  submission_id: string;
  user_id: string;
  created_at: string;
};

type MemberRow = {
  player_id: string;
  user_id: string;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

// ============================================================================
// Public accessor
// ============================================================================

/**
 * Pulls a coherent snapshot for the admin live mode.
 * One snapshot = one render — the page is reloaded manually (no Realtime).
 */
export async function getAdminLiveSnapshot(): Promise<AdminLiveSnapshot> {
  const empty: AdminLiveSnapshot = {
    teams: [],
    gameFlow: [],
    recentValidatedEvents: [],
  };

  const supabase = await createClient();
  if (!supabase) return empty;

  // 1. Resolve current event.
  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eventErr || !eventRow) return empty;
  const eventId = (eventRow as { id: string }).id;

  // 2. Cohorts -> players.
  const { data: cohortRows } = await supabase
    .from("cohorts")
    .select("id")
    .eq("event_id", eventId);
  const cohortIds = (cohortRows ?? []).map((r) => (r as { id: string }).id);
  if (cohortIds.length === 0) return empty;

  const { data: playerRows } = await supabase
    .from("players")
    .select("id, slug, name, idea, current_level, score_project")
    .in("cohort_id", cohortIds)
    .order("score_project", { ascending: false });
  const players = (playerRows ?? []) as PlayerRow[];
  if (players.length === 0) return empty;
  const playerIds = players.map((p) => p.id);
  const playerNameById = new Map<string, string>(
    players.map((p) => [p.id, p.name]),
  );

  // 3. Submissions for these players (recent first, capped).
  const { data: subRows } = await supabase
    .from("submissions")
    .select("id, player_id, status, submitted_at, deliverable_template_id")
    .in("player_id", playerIds)
    .order("submitted_at", { ascending: false })
    .limit(200);
  const submissions = (subRows ?? []) as SubmissionRow[];

  // 4. Evaluations for these submissions (recent first).
  const submissionIds = submissions.map((s) => s.id);
  let evaluations: EvaluationRow[] = [];
  if (submissionIds.length > 0) {
    const { data: evalRows } = await supabase
      .from("evaluations")
      .select("id, submission_id, evaluator_id, verdict, created_at")
      .in("submission_id", submissionIds)
      .order("created_at", { ascending: false })
      .limit(200);
    evaluations = (evalRows ?? []) as EvaluationRow[];
  }

  // 5. Evaluation comments (Phase 8) for these submissions.
  let comments: CommentRow[] = [];
  if (submissionIds.length > 0) {
    const { data: commentRows } = await supabase
      .from("evaluation_comments")
      .select("id, submission_id, user_id, created_at")
      .in("submission_id", submissionIds)
      .order("created_at", { ascending: false })
      .limit(200);
    comments = (commentRows ?? []) as CommentRow[];
  }

  // 6. Player members (initials cluster).
  const { data: memberRows } = await supabase
    .from("player_members")
    .select("player_id, user_id")
    .in("player_id", playerIds);
  const members = (memberRows ?? []) as MemberRow[];
  const memberUserIds = Array.from(new Set(members.map((m) => m.user_id)));

  let profiles: ProfileRow[] = [];
  if (memberUserIds.length > 0) {
    const { data: profRows } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", memberUserIds);
    profiles = (profRows ?? []) as ProfileRow[];
  }
  const profileById = new Map(profiles.map((p) => [p.user_id, p]));

  // 7. Build per-team activity + counts.
  const subsByPlayer = new Map<string, SubmissionRow[]>();
  for (const s of submissions) {
    const list = subsByPlayer.get(s.player_id) ?? [];
    list.push(s);
    subsByPlayer.set(s.player_id, list);
  }

  // Build a map: submission_id -> player_id (to attribute evaluation/comment activity to a team).
  const playerBySubmission = new Map<string, string>();
  for (const s of submissions) playerBySubmission.set(s.id, s.player_id);

  const evalsByPlayer = new Map<string, EvaluationRow[]>();
  for (const e of evaluations) {
    const pid = playerBySubmission.get(e.submission_id);
    if (!pid) continue;
    const list = evalsByPlayer.get(pid) ?? [];
    list.push(e);
    evalsByPlayer.set(pid, list);
  }
  const commentsByPlayer = new Map<string, CommentRow[]>();
  for (const c of comments) {
    const pid = playerBySubmission.get(c.submission_id);
    if (!pid) continue;
    const list = commentsByPlayer.get(pid) ?? [];
    list.push(c);
    commentsByPlayer.set(pid, list);
  }

  const membersByPlayer = new Map<string, MemberRow[]>();
  for (const m of members) {
    const list = membersByPlayer.get(m.player_id) ?? [];
    list.push(m);
    membersByPlayer.set(m.player_id, list);
  }

  const now = new Date();
  const teams: AdminLiveTeam[] = players.map((p) => {
    const pSubs = subsByPlayer.get(p.id) ?? [];
    const pEvals = evalsByPlayer.get(p.id) ?? [];
    const pComments = commentsByPlayer.get(p.id) ?? [];
    const lastMs = latestActivityMs([
      ...pSubs.map((s) => s.submitted_at),
      ...pEvals.map((e) => e.created_at),
      ...pComments.map((c) => c.created_at),
    ]);
    const activity = computeTeamActivityState(lastMs, now);
    const validatedCount = pSubs.filter((s) => s.status === "validated").length;
    const submittedCount = pSubs.length;
    const teamMembers = membersByPlayer.get(p.id) ?? [];
    const memberInitials = teamMembers
      .slice(0, 4)
      .map((m) => initialsFromProfile(profileById.get(m.user_id)));
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      idea: p.idea,
      currentLevel: p.current_level,
      level: levelOrd(p.current_level),
      scoreProject:
        typeof p.score_project === "string"
          ? Number(p.score_project)
          : p.score_project,
      state: activity.state,
      minutesSinceActivity: activity.minutesSinceActivity,
      membersCount: teamMembers.length,
      submittedCount,
      validatedCount,
      memberInitials,
    };
  });

  // 8. Game flow ticker — flatten + sort the most recent 50 events.
  const flow: GameFlowEntry[] = [];
  for (const s of submissions) {
    const teamName = playerNameById.get(s.player_id) ?? "—";
    const isV2 = s.status === "submitted_v2";
    flow.push({
      id: `sub-${s.id}`,
      at: s.submitted_at,
      team: teamName,
      kind: isV2 ? "submission_v2" : "submission_v1",
      label: isV2 ? "a soumis sa V2" : "a soumis un livrable",
      tone: "amber",
    });
    if (s.status === "validated") {
      flow.push({
        id: `validated-${s.id}`,
        at: s.submitted_at, // best proxy in absence of a separate validated_at column
        team: teamName,
        kind: "validated",
        label: "livrable validé",
        tone: "green",
      });
    }
  }
  for (const e of evaluations) {
    const pid = playerBySubmission.get(e.submission_id);
    if (!pid) continue;
    const teamName = playerNameById.get(pid) ?? "—";
    flow.push({
      id: `eval-${e.id}`,
      at: e.created_at,
      team: teamName,
      kind: "evaluation",
      label: verdictToFr(e.verdict),
      tone: e.verdict === "reject" ? "red" : "blue",
    });
  }
  for (const c of comments) {
    const pid = playerBySubmission.get(c.submission_id);
    if (!pid) continue;
    const teamName = playerNameById.get(pid) ?? "—";
    flow.push({
      id: `comment-${c.id}`,
      at: c.created_at,
      team: teamName,
      kind: "comment",
      label: "commentaire mentor",
      tone: "blue",
    });
  }
  flow.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const gameFlow = flow.slice(0, 50);

  // 9. Recent validated events for hack-status euphorique trigger.
  const recentValidatedEvents: HackStatusEvent[] = evaluations
    .filter(
      (e) => e.verdict === "validate_v1" || e.verdict === "validate_v2",
    )
    .map((e) => ({
      at: e.created_at,
      kind: "submission_validated" as const,
    }));

  return { teams, gameFlow, recentValidatedEvents };
}

// ============================================================================
// Internal helpers
// ============================================================================

function initialsFromProfile(profile: ProfileRow | undefined): string {
  if (!profile) return "??";
  const source = profile.full_name?.trim() || profile.email?.trim() || "";
  if (!source) return "??";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) {
    const head = parts[0].slice(0, 2).toUpperCase();
    return head.padEnd(2, head[0] ?? "?");
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function verdictToFr(verdict: string): string {
  switch (verdict) {
    case "validate_v1":
      return "V1 validée";
    case "validate_v2":
      return "V2 validée";
    case "request_v2":
      return "V2 demandée";
    case "reject":
      return "soumission rejetée";
    default:
      return "évaluation enregistrée";
  }
}
