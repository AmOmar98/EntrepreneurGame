// Phase 4 / Plan 03 - Admin Player detail data layer.
// Server-side accessor returning everything the GameMaster needs to diagnose
// a single Player on /admin/players/[id]: meta + members + submissions +
// evaluations. Mirrors the conventions of lib/admin.ts and lib/mentor.ts.
// Dual-mode safe: returns null when Supabase env is absent.
import { createClient } from "@/utils/supabase/server";
import { levelLabel } from "@/lib/journey";
import type {
  Evaluation,
  LevelId,
  Player,
  PlayerMember,
  Submission,
  SubmissionKind,
  SubmissionStatus,
  TeamRole,
  Verdict,
} from "@/lib/types";

// ============================================================================
// Public types
// ============================================================================

export type PlayerDetailMember = {
  member: PlayerMember;
  email: string | null;
  fullName: string | null;
};

export type PlayerDetailSubmission = {
  submission: Submission;
  templateTitle: string;
  evaluations: Evaluation[];
};

export type PlayerDetail = {
  player: Player;
  levelLabel: string;
  members: PlayerDetailMember[];
  submissions: PlayerDetailSubmission[];
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

type PlayerMemberRow = {
  id: string;
  player_id: string;
  user_id: string;
  role: PlayerMember["role"];
  team_role: TeamRole;
  joined_at: string;
};

function mapMember(row: PlayerMemberRow): PlayerMember {
  return {
    id: row.id,
    playerId: row.player_id,
    userId: row.user_id,
    role: row.role,
    teamRole: row.team_role,
    joinedAt: row.joined_at,
  };
}

type ProfileRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
};

type SubmissionRow = {
  id: string;
  player_id: string;
  deliverable_template_id: string;
  version: number;
  kind: SubmissionKind;
  proof_url: string | null;
  proof_text: string | null;
  status: SubmissionStatus;
  submitted_by: string;
  submitted_at: string;
};

function mapSubmission(row: SubmissionRow): Submission {
  const base = {
    id: row.id,
    playerId: row.player_id,
    deliverableTemplateId: row.deliverable_template_id,
    kind: row.kind,
    proofUrl: row.proof_url,
    proofText: row.proof_text,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
  };
  if (row.version === 2) {
    return { ...base, version: 2 };
  }
  return { ...base, version: 1 };
}

type EvaluationRow = {
  id: string;
  submission_id: string;
  evaluator_id: string;
  scores: Record<string, number> | null;
  total_score: number | string;
  feedback: string | null;
  verdict: Verdict;
};

function mapEvaluation(row: EvaluationRow): Evaluation {
  return {
    id: row.id,
    submissionId: row.submission_id,
    evaluatorId: row.evaluator_id,
    scores: row.scores ?? {},
    totalScore: typeof row.total_score === "string" ? Number(row.total_score) : row.total_score,
    feedback: row.feedback ?? "",
    verdict: row.verdict,
  };
}

type TemplateRow = {
  id: string;
  title: string;
};

// ============================================================================
// UUID validation helper
// ============================================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// ============================================================================
// Server-side accessor
// ============================================================================

/**
 * Returns the full Player detail aggregate (meta + members + submissions +
 * evaluations) for the GameMaster detail page, or null when:
 *   - Supabase is not configured (demo mode);
 *   - the playerId is not a valid UUID;
 *   - the Player does not exist.
 * Errors are logged via console.error and never thrown.
 */
export async function getPlayerDetail(playerId: string): Promise<PlayerDetail | null> {
  if (!playerId || !isUuid(playerId)) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  // 1. Player row.
  const { data: playerRow, error: playerErr } = await supabase
    .from("players")
    .select(
      "id, cohort_id, slug, name, idea, current_level, status, score_project, score_engagement, onboarded_at",
    )
    .eq("id", playerId)
    .maybeSingle();
  if (playerErr) {
    console.error("[admin-player-detail] players query failed", playerErr);
    return null;
  }
  if (!playerRow) return null;
  const player = mapPlayer(playerRow as PlayerRow);

  // 2. PlayerMembers + profiles (email / full_name).
  let members: PlayerDetailMember[] = [];
  const { data: memberRows, error: memberErr } = await supabase
    .from("player_members")
    .select("id, player_id, user_id, role, team_role, joined_at")
    .eq("player_id", playerId)
    .order("joined_at", { ascending: true });
  if (memberErr) {
    console.error("[admin-player-detail] player_members query failed", memberErr);
  } else {
    const memberRowList = (memberRows ?? []) as PlayerMemberRow[];
    const userIds = memberRowList.map((r) => r.user_id);
    const profileByUserId = new Map<string, ProfileRow>();
    if (userIds.length > 0) {
      const { data: profileRows, error: profileErr } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);
      if (profileErr) {
        console.error("[admin-player-detail] profiles query failed", profileErr);
      } else {
        for (const p of (profileRows ?? []) as ProfileRow[]) {
          profileByUserId.set(p.user_id, p);
        }
      }
    }
    members = memberRowList.map((row) => {
      const profile = profileByUserId.get(row.user_id) ?? null;
      return {
        member: mapMember(row),
        email: profile?.email ?? null,
        fullName: profile?.full_name ?? null,
      };
    });
  }

  // 3. Submissions (ordered desc), then templates + evaluations.
  let submissions: PlayerDetailSubmission[] = [];
  const { data: subRows, error: subErr } = await supabase
    .from("submissions")
    .select(
      "id, player_id, deliverable_template_id, version, kind, proof_url, proof_text, status, submitted_by, submitted_at",
    )
    .eq("player_id", playerId)
    .order("submitted_at", { ascending: false });
  if (subErr) {
    console.error("[admin-player-detail] submissions query failed", subErr);
  } else {
    const subRowList = (subRows ?? []) as SubmissionRow[];
    const templateIds = Array.from(new Set(subRowList.map((r) => r.deliverable_template_id)));
    const titleByTemplateId = new Map<string, string>();
    if (templateIds.length > 0) {
      const { data: tplRows, error: tplErr } = await supabase
        .from("deliverable_templates")
        .select("id, title")
        .in("id", templateIds);
      if (tplErr) {
        console.error("[admin-player-detail] deliverable_templates query failed", tplErr);
      } else {
        for (const t of (tplRows ?? []) as TemplateRow[]) {
          titleByTemplateId.set(t.id, t.title);
        }
      }
    }

    const submissionIds = subRowList.map((r) => r.id);
    const evaluationsBySubmissionId = new Map<string, Evaluation[]>();
    if (submissionIds.length > 0) {
      const { data: evalRows, error: evalErr } = await supabase
        .from("evaluations")
        .select("id, submission_id, evaluator_id, scores, total_score, feedback, verdict")
        .in("submission_id", submissionIds);
      if (evalErr) {
        console.error("[admin-player-detail] evaluations query failed", evalErr);
      } else {
        for (const row of (evalRows ?? []) as EvaluationRow[]) {
          const ev = mapEvaluation(row);
          const arr = evaluationsBySubmissionId.get(ev.submissionId) ?? [];
          arr.push(ev);
          evaluationsBySubmissionId.set(ev.submissionId, arr);
        }
      }
    }

    submissions = subRowList.map((row) => ({
      submission: mapSubmission(row),
      templateTitle: titleByTemplateId.get(row.deliverable_template_id) ?? "",
      evaluations: evaluationsBySubmissionId.get(row.id) ?? [],
    }));
  }

  return {
    player,
    levelLabel: levelLabel(player.currentLevel),
    members,
    submissions,
  };
}
