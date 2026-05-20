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
import type {
  PitchScore,
  Player,
  LevelId,
  PitchModeState,
  SubmissionStatus,
} from "@/lib/types";

// ============================================================================
// quick-260520-124 V4 — PitchScore extension with optional comments.
// lib/types.ts is deny-protected ; we extend at consumer level instead.
// ============================================================================

// quick-260520-124 ext (2026-05-20) — verdict literal union for jury panel.
// 4 valeurs autorisees, side-channel CHECK constraint cote DB.
export type Verdict = "not_convinced" | "needs_work" | "convinced" | "favorite";

export type PitchScoreWithComments = PitchScore & {
  commentC1?: string | null;
  commentC2?: string | null;
  commentC3?: string | null;
  commentC4?: string | null;
  commentC5?: string | null;
  commentGlobal?: string | null;
  /** quick-260520-124 ext — true = brouillon (defaut nouveau row), false = vote valide. */
  isDraft?: boolean;
  /** quick-260520-124 ext — verdict global cote panel, null si non choisi. */
  verdict?: Verdict | null;
};

// SubmissionRef — slim shape passed to V4 jury session for deliverable links.
export type SubmissionRef = {
  id: string;
  levelId: LevelId;
  templateSlug: string;
  templateTitle: string;
  status: SubmissionStatus;
  proofUrl: string | null;
  submittedAt: string;
};

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
  existing: PitchScoreWithComments | null;
  /** Populated only when `pitchModeState === 'closed'`. */
  aggregate: JuryAggregate | null;
  /** quick-260520-124 V4 — list of submissions for this player (links opened by jury during pitch). */
  submissions: SubmissionRef[];
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
  // quick-260520-124 V4 — optional, present only when migration applied.
  comment_c1?: string | null;
  comment_c2?: string | null;
  comment_c3?: string | null;
  comment_c4?: string | null;
  comment_c5?: string | null;
  comment_global?: string | null;
  // quick-260520-124 ext (2026-05-20) — is_draft + verdict (optional pre-migration).
  is_draft?: boolean | null;
  verdict?: Verdict | null;
};

export function mapPitchScore(row: PitchScoreRow): PitchScoreWithComments {
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
    commentC1: row.comment_c1 ?? null,
    commentC2: row.comment_c2 ?? null,
    commentC3: row.comment_c3 ?? null,
    commentC4: row.comment_c4 ?? null,
    commentC5: row.comment_c5 ?? null,
    commentGlobal: row.comment_global ?? null,
    // quick-260520-124 ext — is_draft + verdict (tolerant : undefined if migration not applied).
    isDraft: row.is_draft ?? undefined,
    verdict: row.verdict ?? null,
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

  // quick-260520-124 ext (#9) — smart upNext queue.
  // Priority order :
  //   1. GameMaster `pitch_order_json` slot ASC (when set)
  //   2. Among non-slotted (or no order at all) : players ranked by level DESC
  //      then score_project DESC. Tie-break on name ASC.
  // Rationale : juror naturally sees the most advanced teams first
  // ("matures d'abord") in absence of an explicit GM-set order.
  const levelRank: Record<LevelId, number> = {
    L0_diagnostic: 0,
    L1_problem: 1,
    L2_solution: 2,
    L3_market: 3,
    L4_business_model: 4,
    L5_pitch: 5,
    L6_traction: 6,
    L7_alumni: 7,
  };
  const players = [...playersUnsorted].sort((a, b) => {
    const sa = getPlayerSlot(pitchOrder, a.id);
    const sb = getPlayerSlot(pitchOrder, b.id);
    if (sa !== null && sb !== null) return sa - sb;
    if (sa !== null) return -1;
    if (sb !== null) return 1;
    // Smart fallback : level DESC, then score_project DESC, then name ASC.
    const dl = (levelRank[b.currentLevel] ?? -1) - (levelRank[a.currentLevel] ?? -1);
    if (dl !== 0) return dl;
    const ds = (b.scoreProject ?? 0) - (a.scoreProject ?? 0);
    if (ds !== 0) return ds;
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
  const scoresByPlayer = new Map<string, PitchScoreWithComments>();
  for (const r of (scoreRows ?? []) as PitchScoreRow[]) {
    scoresByPlayer.set(r.player_id, mapPitchScore(r));
  }

  // 3.b quick-260520-124 V4 — fetch comments separately. Tolerant : if the
  // migration has not been applied yet, the query errors and we silently
  // proceed without comments (existing rows still load via the legacy SELECT
  // above). This keeps V1/V3 unaffected.
  const { data: commentRows } = await supabase
    .from("pitch_scores")
    .select(
      "player_id, comment_c1, comment_c2, comment_c3, comment_c4, comment_c5, comment_global",
    )
    .eq("event_id", eventId)
    .eq("juror_id", user.id);
  if (commentRows) {
    for (const cr of commentRows as Array<{
      player_id: string;
      comment_c1?: string | null;
      comment_c2?: string | null;
      comment_c3?: string | null;
      comment_c4?: string | null;
      comment_c5?: string | null;
      comment_global?: string | null;
    }>) {
      const existing = scoresByPlayer.get(cr.player_id);
      if (existing) {
        existing.commentC1 = cr.comment_c1 ?? null;
        existing.commentC2 = cr.comment_c2 ?? null;
        existing.commentC3 = cr.comment_c3 ?? null;
        existing.commentC4 = cr.comment_c4 ?? null;
        existing.commentC5 = cr.comment_c5 ?? null;
        existing.commentGlobal = cr.comment_global ?? null;
      }
    }
  }

  // 3.b.ext quick-260520-124 ext — fetch is_draft + verdict separately, same
  // tolerant pattern (silent skip if migration not applied yet).
  const { data: draftRows } = await supabase
    .from("pitch_scores")
    .select("player_id, is_draft, verdict")
    .eq("event_id", eventId)
    .eq("juror_id", user.id);
  if (draftRows) {
    for (const dr of draftRows as Array<{
      player_id: string;
      is_draft?: boolean | null;
      verdict?: Verdict | null;
    }>) {
      const existing = scoresByPlayer.get(dr.player_id);
      if (existing) {
        existing.isDraft = dr.is_draft ?? undefined;
        existing.verdict = dr.verdict ?? null;
      }
    }
  }

  // 3.c quick-260520-124 V4 — fetch all submissions for the cohort's players,
  // joined to deliverable_templates + missions for level + ord ordering.
  const submissionsByPlayer = new Map<string, SubmissionRef[]>();
  const playerIds = players.map((p) => p.id);
  if (playerIds.length > 0) {
    const { data: subRows, error: subErr } = await supabase
      .from("submissions")
      .select(
        "id, player_id, proof_url, status, submitted_at, deliverable_template_id, deliverable_templates(slug, title, ord, missions(level_id))",
      )
      .in("player_id", playerIds);
    if (subErr) {
      console.error("[jury] submissions query failed", subErr);
    } else {
      type SubRow = {
        id: string;
        player_id: string;
        proof_url: string | null;
        status: SubmissionStatus;
        submitted_at: string;
        deliverable_template_id: string;
        // Supabase nested join returns arrays for joined tables ; we coerce
        // to first element when present.
        deliverable_templates:
          | {
              slug: string;
              title: string;
              ord: number | null;
              missions:
                | { level_id: LevelId }
                | { level_id: LevelId }[]
                | null;
            }
          | {
              slug: string;
              title: string;
              ord: number | null;
              missions:
                | { level_id: LevelId }
                | { level_id: LevelId }[]
                | null;
            }[]
          | null;
      };
      const flat: Array<SubmissionRef & { playerId: string; ord: number }> = [];
      for (const r of (subRows ?? []) as unknown as SubRow[]) {
        const rawTpl = r.deliverable_templates;
        const tpl = Array.isArray(rawTpl) ? rawTpl[0] ?? null : rawTpl;
        const rawMissions = tpl?.missions ?? null;
        const mission = Array.isArray(rawMissions)
          ? rawMissions[0] ?? null
          : rawMissions;
        const levelId: LevelId = mission?.level_id ?? "L0_diagnostic";
        flat.push({
          id: r.id,
          playerId: r.player_id,
          levelId,
          templateSlug: tpl?.slug ?? "",
          templateTitle: tpl?.title ?? "",
          status: r.status,
          proofUrl: r.proof_url,
          submittedAt: r.submitted_at,
          ord: tpl?.ord ?? 0,
        });
      }
      // Sort by level ASC then template.ord ASC (stable).
      const levelOrder: Record<LevelId, number> = {
        L0_diagnostic: 0,
        L1_problem: 1,
        L2_solution: 2,
        L3_market: 3,
        L4_business_model: 4,
        L5_pitch: 5,
        L6_traction: 6,
        L7_alumni: 7,
      };
      flat.sort((a, b) => {
        const dl = (levelOrder[a.levelId] ?? 99) - (levelOrder[b.levelId] ?? 99);
        if (dl !== 0) return dl;
        return a.ord - b.ord;
      });
      for (const s of flat) {
        const arr = submissionsByPlayer.get(s.playerId) ?? [];
        arr.push({
          id: s.id,
          levelId: s.levelId,
          templateSlug: s.templateSlug,
          templateTitle: s.templateTitle,
          status: s.status,
          proofUrl: s.proofUrl,
          submittedAt: s.submittedAt,
        });
        submissionsByPlayer.set(s.playerId, arr);
      }
    }
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
    submissions: submissionsByPlayer.get(player.id) ?? [],
  }));
  return { eventId, rows, pitchModeState, notInvited: false };
}
