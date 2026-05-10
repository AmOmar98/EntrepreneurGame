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
