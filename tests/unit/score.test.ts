// Unit tests for pure scoring logic in lib/score.ts.
// These functions have no Supabase dependencies and can be tested in Node.
// consumeBonusMultiplier and hasActiveBonus are excluded (Supabase-bound or
// use Date.now() side effects that don't affect pure score calculation).
import { describe, it, expect } from "vitest";
import { scoreFromEvaluation, combineScores, applyBonusMultiplier } from "@/lib/score";
import type { Evaluation, Player, BonusEvent } from "@/lib/types";

// Minimal Evaluation shape for testing pure lib/score.ts functions
const baseEvaluation: Evaluation = {
  id: "00000000-0000-0000-0000-000000000001",
  submissionId: "00000000-0000-0000-0000-000000000002",
  evaluatorId: "00000000-0000-0000-0000-000000000003",
  scores: { c1: 10, c2: 15, c3: 20 },
  totalScore: 45,
  feedback: "Good work",
  verdict: "validate_v1",
};

describe("scoreFromEvaluation", () => {
  it("sums all rubric subscores from the scores map", () => {
    const result = scoreFromEvaluation(baseEvaluation);
    // c1=10 + c2=15 + c3=20 = 45
    expect(result).toBe(45);
  });

  it("returns 0 for empty scores map", () => {
    const result = scoreFromEvaluation({ ...baseEvaluation, scores: {} });
    expect(result).toBe(0);
  });
});

describe("combineScores", () => {
  it("returns correct project, engagement, and total values", () => {
    const player: Pick<Player, "scoreProject" | "scoreEngagement"> = {
      scoreProject: 80,
      scoreEngagement: 175,
    };
    const result = combineScores(player);
    expect(result.project).toBe(80);
    expect(result.engagement).toBe(175);
    expect(result.total).toBe(255);
  });

  it("total equals project + engagement (exact numeric assertion)", () => {
    const player: Pick<Player, "scoreProject" | "scoreEngagement"> = {
      scoreProject: 120,
      scoreEngagement: 50,
    };
    const result = combineScores(player);
    expect(result.total).toBe(170);
  });
});

describe("applyBonusMultiplier", () => {
  const submission = {
    submittedAt: "2026-05-20T10:00:00Z",
    playerId: "player-1",
  };

  it("returns rawScore unchanged when no bonus events", () => {
    const result = applyBonusMultiplier({
      rawScore: 100,
      bonusEvents: [],
      submission,
    });
    expect(result.boostedScore).toBe(100);
    expect(result.applied).toBeNull();
  });

  it("returns rawScore unchanged when rawScore <= 0", () => {
    const result = applyBonusMultiplier({
      rawScore: 0,
      bonusEvents: [],
      submission,
    });
    expect(result.boostedScore).toBe(0);
    expect(result.applied).toBeNull();
  });

  it("applies a 2x multiplier for a valid next_deliverable bonus", () => {
    const bonusEvent: BonusEvent = {
      id: "bonus-1",
      projectId: "player-1",
      type: "bonus_verbatims_terrain",
      title: "Verbatims bonus",
      description: "10 verbatims",
      docUrl: null,
      status: "validated",
      multiplierFactor: 2.0,
      multiplierScope: "next_deliverable",
      multiplierConsumedAt: null,
      claimedAt: "2026-05-19T10:00:00Z",  // before submission
      claimedBy: "player-1",
      reviewedBy: "mentor-1",
      reviewedAt: "2026-05-19T12:00:00Z",
      feedback: "",
      createdAt: "2026-05-19T09:00:00Z",
      updatedAt: "2026-05-19T12:00:00Z",
    };
    const result = applyBonusMultiplier({
      rawScore: 50,
      bonusEvents: [bonusEvent],
      submission,
    });
    // 50 * 2.0 = 100
    expect(result.boostedScore).toBe(100);
    expect(result.applied).toBe("bonus-1");
  });
});
