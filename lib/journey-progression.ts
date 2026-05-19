// Phase 7 / Plan 07-01 - Journey progression helpers.
// Pure helpers consumed by the refactored /journey page to compute:
//   - the "next step" CTA target (priority: a_rendre, then feedback_received)
//   - the per-level state (done/current/locked) used by JourneyTrack
//   - short FR labels per LevelId (wireframe-aligned, e.g. "Diagnostic")
//
// Domain types (LevelId, SubmissionStatus) come from lib/types.ts.
// JourneyMission / JourneyDeliverable come from lib/journey.ts.
import type { JourneyDeliverable, JourneyMission } from "@/lib/journey";
import type { LevelId } from "@/lib/types";

export type LevelState = "done" | "current" | "locked";

export type NextStep = {
  template: JourneyDeliverable["template"];
  mission: JourneyMission["mission"];
  status: JourneyDeliverable["status"];
};

// Ordered list of all LevelIds (L0 -> L7). Single source of truth for
// progression iteration in JourneyTrack.
export const LEVEL_IDS: LevelId[] = [
  "L0_diagnostic",
  "L1_problem",
  "L2_solution",
  "L3_market",
  "L4_business_model",
  "L5_pitch",
  "L6_traction",
  "L7_alumni",
];

// Short FR labels matching the wireframe (player-screens.jsx). The verbose
// labels still live in lib/journey.ts:LEVEL_LABELS for legacy callers.
const SHORT_LABELS: Record<LevelId, string> = {
  L0_diagnostic: "Diagnostic",
  L1_problem: "Problème",
  L2_solution: "Solution",
  L3_market: "Marché",
  L4_business_model: "Modèle éco.",
  L5_pitch: "Pitch",
  L6_traction: "Traction",
  L7_alumni: "Alumni",
};

// Short level number "0".."7" (used in track nodes).
export function getLevelNumber(levelId: LevelId): string {
  return levelId.charAt(1);
}

export function getShortLevelLabel(levelId: LevelId): string {
  return SHORT_LABELS[levelId] ?? String(levelId);
}

// Priority-ordered: "a_rendre" missions come first (player must submit V1),
// then "feedback_received" (V2 to redo), then "submitted_v1" (in review,
// no immediate action - we don't surface this as a CTA).
const NEXT_STEP_PRIORITY: JourneyDeliverable["status"][] = [
  "a_rendre",
  "feedback_received",
  "submitted_v2",
];

export function getNextStep(missions: JourneyMission[]): NextStep | null {
  // Walk priority statuses in order; first match wins.
  for (const wantedStatus of NEXT_STEP_PRIORITY) {
    for (const m of missions) {
      const match = m.deliverables.find((d) => d.status === wantedStatus);
      if (match) {
        return {
          template: match.template,
          mission: m.mission,
          status: match.status,
        };
      }
    }
  }
  return null;
}

// Compute per-level state. A level is:
//   - "current" if it === currentLevel
//   - "done" if it appears before currentLevel in LEVEL_IDS order
//   - "locked" otherwise (i.e. after currentLevel)
export function getLevelStates(currentLevel: LevelId): Map<LevelId, LevelState> {
  const map = new Map<LevelId, LevelState>();
  const currentIdx = LEVEL_IDS.indexOf(currentLevel);
  for (let i = 0; i < LEVEL_IDS.length; i++) {
    const id = LEVEL_IDS[i];
    if (currentIdx === -1) {
      // Defensive: unknown level -> mark all locked.
      map.set(id, "locked");
      continue;
    }
    if (i < currentIdx) map.set(id, "done");
    else if (i === currentIdx) map.set(id, "current");
    else map.set(id, "locked");
  }
  return map;
}

// XP earned per level — sums JourneyDeliverable.earnedXp computed in
// lib/journey.ts:getJourneyData. Pre-aggregation lives there because the
// rules need access to evaluations rows (score + verdict).
// Rules (R1 revised 2026-05-11): +100 on first submit, +rubric total on
// latest eval, +50 if validate_v1, +100 if validate_v2 (50 base + 50 V2).
export function getLevelXp(missions: JourneyMission[], levelId: LevelId): number {
  let xp = 0;
  for (const m of missions) {
    if (m.mission.levelId !== levelId) continue;
    for (const d of m.deliverables) {
      xp += d.earnedXp;
    }
  }
  return xp;
}

// Total earned XP across the whole journey (sum of per-deliverable earnedXp).
export function getTotalEarnedXp(missions: JourneyMission[]): number {
  let xp = 0;
  for (const m of missions) {
    for (const d of m.deliverables) {
      xp += d.earnedXp;
    }
  }
  return xp;
}
