// Phase 7 / Plan 07-01 - Journey progression helpers.
// Pure helpers consumed by the refactored /journey page to compute:
//   - the "next step" CTA target (priority: a_rendre, then feedback_received)
//   - the per-level state (done/current/locked) used by JourneyTrack
//
// Phase 14 / Plan 02: LEVEL_IDS, SHORT_LABELS, getShortLevelLabel removed.
// getLevelStates now accepts a levels: Level[] parameter (sorted by ord) so
// callers can pass the DB-fetched array rather than the hardcoded constant.
//
// Domain types (LevelId, Level) come from lib/types.ts.
// JourneyMission / JourneyDeliverable come from lib/journey.ts.
import type { JourneyDeliverable, JourneyMission } from "@/lib/journey";
import type { Level, LevelId } from "@/lib/types";

export type LevelState = "done" | "current" | "locked";

export type NextStep = {
  template: JourneyDeliverable["template"];
  mission: JourneyMission["mission"];
  status: JourneyDeliverable["status"];
};

// Short level number "0".."7" extracted from level id string (e.g. "L3_market" -> "3").
// Regex on id string -- still valid after LevelId = string.
export function getLevelNumber(levelId: LevelId): string {
  return levelId.charAt(1);
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
//   - "done" if it appears before currentLevel in ord order
//   - "locked" otherwise (i.e. after currentLevel)
//
// Phase 14 / Plan 02: accepts levels: Level[] (sorted by ord ASC) instead of
// the removed LEVEL_IDS constant. Caller fetches levels from getLevels()
// (lib/levels.ts) and passes the array here.
export function getLevelStates(levels: Level[], currentLevel: LevelId): Map<LevelId, LevelState> {
  const map = new Map<LevelId, LevelState>();
  const ordered = [...levels].sort((a, b) => a.ord - b.ord);
  const currentIdx = ordered.findIndex((l) => l.id === currentLevel);
  for (let i = 0; i < ordered.length; i++) {
    const id = ordered[i].id;
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
