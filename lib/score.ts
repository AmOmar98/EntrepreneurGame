import type { Evaluation, Player, Submission, BonusEvent } from "@/lib/types";
import { BONUS_MULTIPLIER_CAP } from "@/lib/types";

/** Sum the rubric subscores from an evaluation's scores map. */
export function scoreFromEvaluation(evaluation: Evaluation): number {
  return Object.values(evaluation.scores).reduce(
    (acc, n) => acc + (typeof n === "number" ? n : 0),
    0,
  );
}

/**
 * For each deliverable_template, take the highest evaluation totalScore amongst
 * the player's validated submissions, then sum across templates.
 *
 * This mirrors the DB-side `recalc_player_score()` (database/triggers.sql).
 * Use this for client/UI display only; the authoritative recalc lives in DB.
 */
export function sumPlayerScoreProject(
  evaluations: Evaluation[],
  submissions: Submission[],
): number {
  const bestByTemplate = new Map<string, number>();
  for (const sub of submissions) {
    if (sub.status !== "validated") continue;
    const evals = evaluations.filter((e) => e.submissionId === sub.id);
    if (evals.length === 0) continue;
    const best = Math.max(...evals.map((e) => e.totalScore));
    const prev = bestByTemplate.get(sub.deliverableTemplateId) ?? -Infinity;
    if (best > prev) bestByTemplate.set(sub.deliverableTemplateId, best);
  }
  return Array.from(bestByTemplate.values()).reduce((a, b) => a + b, 0);
}

export type ScoreBreakdown = {
  project: number;
  engagement: number;
  total: number;
};

export function combineScores(
  p: Pick<Player, "scoreProject" | "scoreEngagement">,
): ScoreBreakdown {
  return {
    project: p.scoreProject,
    engagement: p.scoreEngagement,
    total: p.scoreProject + p.scoreEngagement,
  };
}

// ============================================================================
// Phase 14 — Scoring d'engagement livrables (paliers 100/25/50)
// ============================================================================
//
// Décisions advisor lockées (cf. .planning/phases/14-scoring-engagement-livrables/ADVISOR-VERDICT-DISCUSS.md) :
//   Q1=A : badges qualitatifs Player (ZÉRO chiffre brut côté Player)
//   Q3=A : helper TS miroir du trigger DB `recalc_player_engagement`
//   Q5=A : Soumis/Reviewed irréversibles ; Validé recalculé par verdict le
//          plus récent par template.
//
// Contrat de l'array `evaluations` : doit être ORDONNÉ par recency DESC
// (latest first), e.g. via `.order('updated_at', { ascending: false })`
// côté server, OU dans l'ordre seed pour le mode demo. Le helper prend
// la PREMIÈRE evaluation de chaque template comme verdict courant.
//
// R1 : la valeur numérique retournée par `sumPlayerScoreEngagement` NE DOIT
//      JAMAIS être rendue côté Player en chiffres ni en composante d'un
//      classement. Player surface = badges qualitatifs via
//      `getEngagementMilestones()`. Mentor/GM surface peut afficher
//      numériquement (cf. lib/admin-*.ts + colonne admin GM).

const SUBMITTED_POINTS = 100;
const REVIEWED_POINTS = 25;
const VALIDATED_POINTS = 50;

type EngagementMilestones = {
  /** Au moins une submission existe pour ce (player, template). +100, irréversible. */
  submitted: boolean;
  /** Au moins une evaluation existe pour ≥1 submission de ce template. +25, irréversible. */
  reviewed: boolean;
  /** Verdict le plus récent par template = validate_v1 ou validate_v2. +50, recalculable. */
  validated: boolean;
};

/**
 * Calcule les 3 paliers d'engagement pour un (player, template) donné.
 * Usage : surface Player /journey/deliverable/[id]/page.tsx pour render
 * 3 badges qualitatifs (Soumis ✓ / Lu par le mentor ✓ / Validé ✓), zéro chiffre.
 *
 * @param templateId — deliverable_template_id ciblé.
 * @param submissions — submissions du Player (toutes templates confondus, le helper filtre).
 * @param evaluations — evaluations du Player ORDONNÉES par recency DESC (latest first).
 */
export function getEngagementMilestones(
  templateId: string,
  submissions: Submission[],
  evaluations: Evaluation[],
): EngagementMilestones {
  const templateSubmissions = submissions.filter(
    (s) => s.deliverableTemplateId === templateId,
  );
  const submitted = templateSubmissions.length > 0;
  if (!submitted) {
    return { submitted: false, reviewed: false, validated: false };
  }

  const templateSubmissionIds = new Set(templateSubmissions.map((s) => s.id));
  const templateEvaluations = evaluations.filter((e) =>
    templateSubmissionIds.has(e.submissionId),
  );
  const reviewed = templateEvaluations.length > 0;
  if (!reviewed) {
    return { submitted: true, reviewed: false, validated: false };
  }

  // Latest evaluation = first in array (caller contract: ordered DESC by recency).
  const latestVerdict = templateEvaluations[0]?.verdict;
  const validated =
    latestVerdict === "validate_v1" || latestVerdict === "validate_v2";

  return { submitted: true, reviewed: true, validated };
}

/**
 * Agrège la `score_engagement` d'un Player : somme des paliers atteints
 * sur tous les templates qu'il a touchés. Miroir strict du trigger DB
 * `public.recalc_player_engagement` (database/migrations/202605110007_phase14_engagement_trigger.sql).
 *
 * Usage : UI dual-mode demo (hasSupabaseEnv()===false). En mode Supabase,
 * la valeur autoritative vient de `players.score_engagement` via trigger DB —
 * ce helper sert pour cohérence d'affichage admin/preview.
 *
 * R1 : NE PAS rendre la valeur retournée côté Player.
 *
 * @param submissions — toutes les submissions du Player.
 * @param evaluations — toutes les evaluations du Player ORDONNÉES par recency DESC.
 */
export function sumPlayerScoreEngagement(
  submissions: Submission[],
  evaluations: Evaluation[],
): number {
  const templateIds = new Set(submissions.map((s) => s.deliverableTemplateId));
  let total = 0;
  for (const templateId of templateIds) {
    const m = getEngagementMilestones(templateId, submissions, evaluations);
    if (m.submitted) total += SUBMITTED_POINTS;
    if (m.reviewed) total += REVIEWED_POINTS;
    if (m.validated) total += VALIDATED_POINTS;
  }
  return total;
}

/**
 * Apply bonus multiplier to a raw score for UI display purposes (Mentor/GM).
 *
 * D-03 mechanism :
 *   - bonus_events with status='validated' and multiplier_consumed_at=null
 *     are "active" for the project.
 *   - For multiplier_scope='next_deliverable' : the first validated submission
 *     after the bonus claimedAt consumes the multiplier (highest factor wins).
 *   - For multiplier_scope='rest_of_event' : the multiplier persists until
 *     eventEndsAt (passed by caller).
 *   - Global cap : BONUS_MULTIPLIER_CAP (3.0) - anti-stacking abuse. Pick the
 *     MAX factor among applicable events, NEVER the product (no stacking).
 *
 * R1 PRESERVED : the returned `boostedScore` is a number - it MUST NOT be
 * displayed Player-side as a number. Plan 08+ UI consumes `applied` (string|null)
 * to render a qualitative "Boost actif" badge instead. Mentor/GM UIs may show
 * the numeric value (gated isGameMaster).
 *
 * Pure function : no DB mutations, no side effects. Caller must fetch
 * bonusEvents (via server component or client-side query) and pass them in.
 *
 * IMPORTANT (D-03 single-shot semantics) : after this call, when scope is
 * `next_deliverable` and `applied !== null`, the caller MUST persist
 * consumption via `consumeBonusMultiplier(supabase, applied)`. Otherwise the
 * same bonus would re-apply to every subsequent submission. See
 * `consumeBonusMultiplier` below for the canonical caller pattern.
 *
 * @param args.rawScore         The raw evaluation total_score for this submission.
 * @param args.bonusEvents      All bonus_events for the player (filtered server-side).
 * @param args.submission       The submission whose score is being boosted (needs submittedAt + playerId).
 * @param args.eventEndsAt      Optional ISO string for event.ends_at (used for rest_of_event scope).
 * @returns boostedScore (capped at rawScore * BONUS_MULTIPLIER_CAP), applied (bonusEvent.id or null).
 */
export function applyBonusMultiplier(args: {
  rawScore: number;
  bonusEvents: BonusEvent[];
  submission: Pick<Submission, "submittedAt" | "playerId">;
  eventEndsAt?: string;
}): { boostedScore: number; applied: string | null } {
  const { rawScore, bonusEvents, submission, eventEndsAt } = args;
  if (rawScore <= 0) return { boostedScore: rawScore, applied: null };

  // Filter applicable bonuses : own player, validated, claimed before submission, not consumed
  const applicable = bonusEvents.filter((b) => {
    if (b.projectId !== submission.playerId) return false;
    if (b.status !== "validated") return false;
    if (b.multiplierConsumedAt !== null) return false;
    if (b.claimedAt >= submission.submittedAt) return false;
    if (
      b.multiplierScope === "rest_of_event" &&
      eventEndsAt &&
      submission.submittedAt > eventEndsAt
    ) {
      return false;
    }
    return true;
  });

  if (applicable.length === 0) return { boostedScore: rawScore, applied: null };

  // Take max factor (no stacking)
  const winner = applicable.reduce((best, cur) =>
    cur.multiplierFactor > best.multiplierFactor ? cur : best,
  );

  const factor = Math.min(winner.multiplierFactor, BONUS_MULTIPLIER_CAP);
  const boostedScore = Math.round(rawScore * factor * 100) / 100; // 2 decimals
  return { boostedScore, applied: winner.id };
}

/**
 * Persist consumption of a `next_deliverable`-scoped bonus multiplier.
 *
 * `applyBonusMultiplier` is a PURE function (no side effects). After computing
 * the boosted score, the caller MUST invoke this helper to mark the winning
 * bonus as consumed in the DB — otherwise the same `next_deliverable` bonus
 * would re-apply to every subsequent submission, defeating the documented
 * D-03 single-shot semantics.
 *
 * The UPDATE is conditional on `multiplier_consumed_at IS NULL` to make
 * concurrent `evaluations` inserts race-safe (first writer wins, others no-op).
 *
 * Caller pattern :
 *
 * ```typescript
 * const { boostedScore, applied } = applyBonusMultiplier({ ... });
 * if (applied) {
 *   await consumeBonusMultiplier(supabase, applied);
 * }
 * ```
 *
 * NOTE for v0.3 hardening : prefer moving consumption to the DB-side
 * `trg_evaluation_recalc` trigger (database/triggers.sql) so the UPDATE is
 * atomic with score recompute. This helper is the application-level fallback.
 *
 * @param supabase  Supabase client (server-side, service role or RLS-permitted).
 * @param bonusEventId  The `applied` value returned by `applyBonusMultiplier`.
 * @returns `{ ok: true }` if consumed (or already consumed by a concurrent write), `{ ok: false, error }` on DB error.
 */
export async function consumeBonusMultiplier(
  supabase: {
    from: (table: string) => {
      update: (patch: Record<string, unknown>) => {
        eq: (col: string, val: string) => {
          is: (col: string, val: null) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
  },
  bonusEventId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("bonus_events")
    .update({ multiplier_consumed_at: new Date().toISOString() })
    .eq("id", bonusEventId)
    .is("multiplier_consumed_at", null);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Player-facing helper : returns whether at least one validated bonus_event
 * is currently active (not consumed) for the given player.
 *
 * R1 PRESERVED : returns a BOOLEAN, never a number. Drive the qualitative
 * "Boost actif" badge in Plan 08 Player UI.
 */
export function hasActiveBonus(args: {
  bonusEvents: BonusEvent[];
  playerId: string;
  eventEndsAt?: string;
}): boolean {
  const { bonusEvents, playerId, eventEndsAt } = args;
  const now = new Date().toISOString();
  return bonusEvents.some((b) => {
    if (b.projectId !== playerId) return false;
    if (b.status !== "validated") return false;
    if (b.multiplierConsumedAt !== null) return false;
    if (b.multiplierScope === "rest_of_event" && eventEndsAt && now > eventEndsAt) {
      return false;
    }
    return true;
  });
}
