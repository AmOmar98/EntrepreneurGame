import type { Evaluation, Player, Submission } from "@/lib/types";

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
