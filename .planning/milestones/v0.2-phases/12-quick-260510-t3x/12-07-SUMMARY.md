---
phase: "12-quick-260510-t3x"
plan: "12-07"
subsystem: "scoring"
tags: [t3x, bonus, multiplier, D-03, pure-function, R1]
requirements:
  - T3X-EXPANSION-MULTIPLIER-MECHANISM
dependency_graph:
  requires:
    - "12-02 (BonusEvent type + BONUS_MULTIPLIER_CAP in lib/types.ts)"
    - "12-05 (BonusEvent migration + claimBonusEventFlow context)"
  provides:
    - "lib/score.ts applyBonusMultiplier(args) pure helper"
    - "lib/score.ts hasActiveBonus(args) boolean helper for Player badge"
  affects:
    - "Plan 12-08 (Player UI consumes hasActiveBonus for qualitative badge)"
    - "Plan 12-10/Mentor or GM UI (consumes applyBonusMultiplier for displayed boostedScore)"
tech_stack:
  added: []
  patterns:
    - "Pure functions (no side effects, deterministic)"
    - "Single-object parameter for 3+ field signatures (CLAUDE.md convention)"
    - "Max-factor anti-stacking (NOT product)"
    - "Math.min cap enforcement"
    - "ISO 8601 string lexicographic comparison (no Date arithmetic)"
key_files:
  created: []
  modified:
    - "lib/score.ts"
decisions:
  - "Multiplier mechanism is CLIENT-SIDE-ONLY pure TS (no DB trigger modification): keeps recalc_player_score() SQL trigger intact, multiplier is a meta-signal not a ranking boost. Owner v0.3 decision required to impact ranking."
  - "Anti-stacking: pick MAX factor among applicable events, never product."
  - "ISO string lexicographic comparison used (b.claimedAt >= submission.submittedAt) instead of Date.parse - safer + deterministic for ISO 8601 UTC."
metrics:
  duration: "~5min"
  completed: "2026-05-10"
  tasks_completed: 2
  files_modified: 1
---

# Phase 12 Plan 07: applyBonusMultiplier + hasActiveBonus pure helpers Summary

**One-liner:** Added two pure, side-effect-free helpers to `lib/score.ts` — `applyBonusMultiplier` (Mentor/GM-facing boostedScore computation with max-factor anti-stacking + BONUS_MULTIPLIER_CAP=3.0 Math.min enforcement) and `hasActiveBonus` (Player-facing boolean for qualitative "Boost actif" badge, R1-safe).

## 2 Functions Added

### `applyBonusMultiplier(args)` — Mentor/GM display

Signature:
```ts
applyBonusMultiplier(args: {
  rawScore: number;
  bonusEvents: BonusEvent[];
  submission: Pick<Submission, "submittedAt" | "playerId">;
  eventEndsAt?: string;
}): { boostedScore: number; applied: string | null }
```

Filters applicable bonuses (own player via `projectId === playerId`, `status='validated'`, `multiplierConsumedAt === null`, `claimedAt < submittedAt`, scope rules), picks MAX factor among applicable events (anti-stacking), caps via `Math.min(winner.multiplierFactor, BONUS_MULTIPLIER_CAP)`, returns `{boostedScore, applied: bonusEventId|null}`.

### `hasActiveBonus(args)` — Player badge (R1-safe)

Signature:
```ts
hasActiveBonus(args: {
  bonusEvents: BonusEvent[];
  playerId: string;
  eventEndsAt?: string;
}): boolean
```

Returns **boolean only** — never exposes `multiplierFactor` numerically to Player UI. Drives the qualitative "Boost actif" badge in Plan 12-08.

## Decision T-3 (locked)

**Multiplier does NOT impact ranking.** `lib/results.ts` computeRanking() continues to consume `players.score_project` directly from the DB (recalculated by `recalc_player_score()` SQL trigger), which is unaware of bonus multipliers. The multiplier mechanism added here is purely a pedagogical meta-signal:

- **Mentor/GM UIs** may display `boostedScore` (gated `isGameMaster`/`isMentor`)
- **Player UI** only sees `hasActiveBonus → true/false` and renders a qualitative badge

If the owner wants the multiplier to impact the final classification, that is a **v0.3 decision out of T3X scope**. Rationale: modifying `recalc_player_score()` SQL trigger in T-3 is risky and was explicitly out of scope per Plan 12-07 frontmatter.

## R1 Preservation

- Both functions include explicit JSDoc disclaimers (`R1 PRESERVED` markers at line 64 and line 119 of `lib/score.ts`).
- `applyBonusMultiplier` returns `boostedScore` (number) BUT the JSDoc explicitly states: *"MUST NOT be displayed Player-side as a number. Plan 08+ UI consumes `applied` (string|null) to render a qualitative 'Boost actif' badge instead."*
- `hasActiveBonus` returns BOOLEAN — structurally impossible to leak `multiplierFactor` value to Player.

**R1 audit on diff:** `multiplierFactor` accessed only inside `applyBonusMultiplier` body (reduce + Math.min). `hasActiveBonus` never reads `multiplierFactor`. No Player-facing string assembled with the numeric value.

## Cap Mechanism

```ts
const factor = Math.min(winner.multiplierFactor, BONUS_MULTIPLIER_CAP);
```

`BONUS_MULTIPLIER_CAP = 3.0` imported from `lib/types.ts` (Plan 12-02 landed in `df1080d`). No hardcoded `3.0` in `lib/score.ts`.

## Pure Functions Verified

Grep on `lib/score.ts` for `createClient|supabase|revalidatePath|console\.` returns **no matches**. No I/O, no DB calls, no side effects. Deterministic outputs for given inputs — suitable for future unit tests.

## Backward Compatibility

- `sumPlayerScoreProject` signature **UNCHANGED** (line 19 of `lib/score.ts`):
  ```ts
  export function sumPlayerScoreProject(evaluations: Evaluation[], submissions: Submission[]): number
  ```
- `combineScores` signature **UNCHANGED** (line 41).
- `scoreFromEvaluation` signature **UNCHANGED**.
- `lib/results.ts` (the consumer cited in success criteria) reads `players.score_project` directly from the Supabase row mapper (`mapPlayer` at line 51) — it does **not** import `sumPlayerScoreProject`. Backward-compat verdict: **PASS** (no consumer broken).

## Files Modified

| File          | Change                                                            |
| ------------- | ----------------------------------------------------------------- |
| `lib/score.ts` | +91/-1 lines: 1 import added (BonusEvent + BONUS_MULTIPLIER_CAP), 2 new exported functions, existing 3 functions intact |

## Verification

- `npm run typecheck` → exit 0
- `npx eslint lib/score.ts` → exit 0 (clean)
- `npm run lint` (whole repo) → exit 1, but 6 errors are **pre-existing** in `scripts/provision-agreentech-cohort.cjs` + `smoketest/scripts/create-test-accounts.cjs` (`require()` style imports), unrelated to this plan. Out of scope per Rule: scope boundary.

## Commit

| Hash      | Message                                                                                |
| --------- | -------------------------------------------------------------------------------------- |
| `411eadb` | `feat(t3x-score): add applyBonusMultiplier + hasActiveBonus pure functions (D-03)` |

## Deviations from Plan

None — plan executed exactly as written. Two functions added (`applyBonusMultiplier` + `hasActiveBonus`) per Task 1 specification, atomic commit per Task 2 specification, auto-approved checkpoint per AUTO-MODE flag in invocation prompt.

## Next Consumers

- **Plan 12-08** — Player UI consumes `hasActiveBonus({bonusEvents, playerId, eventEndsAt})` → renders qualitative "Boost actif" badge (no numeric exposure).
- **Plan 12-10 (Mentor or GM)** — UI consumes `applyBonusMultiplier({rawScore, bonusEvents, submission, eventEndsAt})` → displays `boostedScore` numeric (gated `isGameMaster`).

## Self-Check: PASSED

- `lib/score.ts`: FOUND
- Commit `411eadb`: FOUND
- `applyBonusMultiplier` export: FOUND (line 78)
- `hasActiveBonus` export: FOUND (line 122)
- `BONUS_MULTIPLIER_CAP` import + usage: FOUND (lines 2, 110)
- `sumPlayerScoreProject` preserved: FOUND (line 19)
- `combineScores` preserved: FOUND (line 41)
- R1 JSDoc disclaimers: FOUND (lines 64, 119)
- Math.min cap enforcement: FOUND (line 110)
- No side effects (`createClient|supabase|revalidatePath|console.`): NONE
