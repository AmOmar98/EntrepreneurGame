// Unit tests for dynamic + retro-compat normalizePitchScore in lib/results.ts.
// Phase 16 Plan 02: JURY-08 retro-compat + dynamic criteria normalization.
// These functions are pure and have no Supabase dependencies.
//
// Fixture labels:
//   "retro-compat AgreenTech 4-crit" — c5=0, total_score /80 -> *1.25 -> /100
//   "retro-compat Digi 5-crit"       — c5>0, total_score /100, no scaling
//   "dynamic"                        — scores jsonb, sum/maxTotal * 100
import { describe, it, expect } from "vitest";
import { normalizePitchScore } from "@/lib/results";
import type { PitchCriterion } from "@/lib/pitch-criteria";

// Minimal criteria fixtures
const CRITERIA_4: PitchCriterion[] = [
  { id: "c1", eventId: "ev1", key: "innovation", label: "Innovation", max: 20, ord: 0 },
  { id: "c2", eventId: "ev1", key: "faisabilite", label: "Faisabilite", max: 20, ord: 1 },
  { id: "c3", eventId: "ev1", key: "modele", label: "Modele", max: 20, ord: 2 },
  { id: "c4", eventId: "ev1", key: "equipe", label: "Equipe", max: 20, ord: 3 },
];

const CRITERIA_DYNAMIC: PitchCriterion[] = [
  { id: "a", eventId: "ev2", key: "a", label: "A", max: 20, ord: 0 },
  { id: "b", eventId: "ev2", key: "b", label: "B", max: 20, ord: 1 },
];

describe("normalizePitchScore — retro-compat AgreenTech 4-crit (scores null, c5=0)", () => {
  it("returns 100 for total_score=80 with c5=0 (4-crit *1.25 hack)", () => {
    const r = { player_id: "p1", total_score: 80, c5: 0, scores: null };
    expect(normalizePitchScore(r, CRITERIA_4)).toBe(100);
  });

  it("returns 0 for NaN total_score", () => {
    const r = { player_id: "p1", total_score: NaN, c5: 0, scores: null };
    expect(normalizePitchScore(r, CRITERIA_4)).toBe(0);
  });
});

describe("normalizePitchScore — retro-compat Digi 5-crit (scores null, c5>0)", () => {
  it("returns 90 for total_score=90 with c5=10 (no scaling)", () => {
    const r = { player_id: "p1", total_score: 90, c5: 10, scores: null };
    expect(normalizePitchScore(r, CRITERIA_4)).toBe(90);
  });
});

describe("normalizePitchScore — dynamic (scores jsonb present)", () => {
  it("returns 82.5 for scores {a:15,b:18} with maxTotal=40", () => {
    const r = { player_id: "p1", total_score: 33, c5: 0, scores: { a: 15, b: 18 } };
    // (15+18) / 40 * 100 = 33/40*100 = 82.5
    expect(normalizePitchScore(r, CRITERIA_DYNAMIC)).toBeCloseTo(82.5, 5);
  });

  it("returns 0 when maxTotal is 0 (empty criteria)", () => {
    const r = { player_id: "p1", total_score: 0, c5: 0, scores: { a: 10 } };
    expect(normalizePitchScore(r, [])).toBe(0);
  });
});

describe("normalizePitchScore — string total_score (DB returns string)", () => {
  it("handles string total_score=80 with c5=0 (4-crit retro-compat)", () => {
    const r = { player_id: "p1", total_score: "80", c5: "0", scores: null };
    expect(normalizePitchScore(r, CRITERIA_4)).toBe(100);
  });
});
