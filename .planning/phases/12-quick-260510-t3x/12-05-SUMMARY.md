---
phase: "12-quick-260510-t3x"
plan: "12-05"
subsystem: "types"
tags: [t3x-expansion, types, bonus-events, moscow-cards, wave-2]
requirements:
  - T3X-EXPANSION-TS-TYPES
dependency-graph:
  requires:
    - "12-02 (bonus_events DDL + enums applied prod)"
    - "12-03 (moscow_cards DDL + enum applied prod)"
  provides:
    - "BonusType / BonusStatus / MultiplierScope / BonusEvent (TS shapes for bonus claim flow)"
    - "MoscowBucket / MoscowCard (TS shapes for Kanban DnD persistence)"
    - "BONUS_DEFAULTS reference map (per-type defaults for claimBonusEventFlow)"
    - "BONUS_MULTIPLIER_CAP = 3.0 (anti-stacking guard for lib/score.ts)"
  affects:
    - "12-06 (app/actions.ts will import BonusEvent + MoscowCard + BONUS_DEFAULTS)"
    - "12-07 (lib/score.ts will import BONUS_MULTIPLIER_CAP for Math.min cap)"
    - "12-08 (UI components consume BonusEvent / MoscowCard shapes)"
    - "12-09 (DnD Kanban consumes MoscowCard shape)"
tech-stack:
  added: []
  patterns:
    - "String-literal union TS = Postgres enum mirror (existing convention)"
    - "camelCase TS row shapes mapping snake_case Postgres columns (existing convention)"
    - "Reference const map (BONUS_DEFAULTS) co-located with type definitions for type-safe lookups"
key-files:
  created: []
  modified:
    - "lib/types.ts (+94 lines, 0 deletions — append-only new section)"
decisions:
  - "Followed PLAN.md must_haves over orchestrator objective spec for BONUS_DEFAULTS shape: PLAN.md specifies camelCase `{ multiplierFactor, scope, titleFr }` which aligns with CLAUDE.md convention 'snake_case (project_id, doc_url) distinct from camelCase TypeScript field names'. The orchestrator objective's snake_case version would have violated the codebase's own convention for TS types."
  - "ASCII pure in titleFr strings (e.g., 'developpement' not 'développement') per CLAUDE.md 'avoid accented characters in code-resident strings' convention."
  - "Appended new section at end of lib/types.ts rather than interspersing — keeps T3X expansion isolated from v0.2 types, makes future cleanup easy."
metrics:
  duration: "~5 min"
  completed: "2026-05-10T21:55:00Z"
  tasks-completed: 2
  files-changed: 1
  lines-added: 94
  lines-removed: 0
---

# Phase 12 Plan 05: TS Types for bonus_events + moscow_cards Summary

Added 5 TypeScript types (BonusType, BonusStatus, MultiplierScope, BonusEvent, MoscowBucket, MoscowCard) and 2 const exports (BONUS_DEFAULTS, BONUS_MULTIPLIER_CAP) to `lib/types.ts` as single source of truth, mirroring exactly the Postgres enums and tables applied in Plans 12-02 and 12-03.

## Types Added

### Enums (string-literal unions, mirror Postgres enums)

| TS export | Values | SQL enum |
| --------- | ------ | -------- |
| `BonusType` | `"bonus_verbatims_terrain" \| "bonus_dev_plan" \| "bonus_prototype_draft"` | `public.bonus_type` |
| `BonusStatus` | `"draft" \| "submitted" \| "validated" \| "rejected"` | `public.bonus_status` |
| `MultiplierScope` | `"next_deliverable" \| "rest_of_event"` | `public.multiplier_scope` |
| `MoscowBucket` | `"must" \| "should" \| "could" \| "wont"` | `public.moscow_bucket` |

### Row shapes (camelCase TS mapping snake_case Postgres)

**`BonusEvent`** (16 fields) — mirror `public.bonus_events`:
- `id`, `projectId`, `type`, `title`, `description`, `docUrl`, `status`
- `multiplierFactor` (number, [1.00..3.00], R1 never displayed as number to Player)
- `multiplierScope`, `multiplierConsumedAt`, `claimedAt`, `claimedBy`
- `reviewedBy`, `reviewedAt`, `feedback`, `createdAt`, `updatedAt`

**`MoscowCard`** (11 fields) — mirror `public.moscow_cards`:
- `id`, `projectId`, `deliverableTemplateId`, `bucket`, `ord`
- `feature`, `pourquoi`, `contrainte`
- `createdBy`, `createdAt`, `updatedAt`

## BONUS_DEFAULTS Values (D-03)

| BonusType | multiplierFactor | scope | titleFr |
| --------- | ---------------- | ----- | ------- |
| `bonus_verbatims_terrain` | 1.5 | `next_deliverable` | 3 verbatims terrain agriculteurs |
| `bonus_dev_plan` | 1.5 | `next_deliverable` | Plan de developpement (roadmap technique) |
| `bonus_prototype_draft` | 2.0 | `next_deliverable` | Prototype draft (croquis / wireframe / photo) |

All `titleFr` strings ASCII-pure (no accented characters) per CLAUDE.md convention.

## BONUS_MULTIPLIER_CAP = 3.0

Justification (D-03 anti-stacking abuse):
- DB CHECK constraint already enforces `[1.00..3.00]` per row.
- This global cap is the upper bound for *applied* multiplier in `lib/score.ts` (Plan 07) when stacking multiple validated bonuses via `Math.min(BONUS_MULTIPLIER_CAP, applicableFactor)`.
- Prevents abuse where a Player claims all 3 bonuses (1.5 + 1.5 + 2.0 = 5.0) and would otherwise get 5x score multiplier.

## Mirror SQL ↔ TS Verification

- `bonus_type` enum: 3 values in SQL migration, 3 values in TS `BonusType` union — aligned.
- `bonus_status` enum: 4 values both sides — aligned.
- `multiplier_scope` enum: 2 values both sides — aligned.
- `moscow_bucket` enum: 4 values both sides — aligned.
- All snake_case Postgres columns mapped to camelCase TS fields per CLAUDE.md convention.

## R1 Preservation Note

`multiplierFactor: number` is intentionally typed as number for type-safe DB row reads, but JSDoc explicitly states "R1: never display as number to Player". Plan 12-08 (UI components) is responsible for enforcing this via qualitative "Boost actif" badge — this Plan 12-05 only defines the type shape.

## npm Checks

- `npm run typecheck` — exit 0 (clean).
- `npx eslint lib/types.ts` — exit 0 (clean).
- `npm run lint` (full repo) — 6 pre-existing errors in `scripts/provision-agreentech-cohort.cjs` and `smoketest/scripts/create-test-accounts.cjs` (`@typescript-eslint/no-require-imports`). These are out of scope for this plan per CLAUDE.md scope boundary — logged as pre-existing, no auto-fix attempted.

## Files Modified

- `lib/types.ts` — 94 lines added at end of file, 0 deletions. All existing types (`AppRole`, `LevelId`, `RubricCriterion`, `DeliverableTemplate`, `Submission`, `Evaluation`, `PitchScore`, etc.) preserved unchanged.

## Deviations from Plan

**None affecting outcome.** One spec resolution recorded:

- The orchestrator objective and PLAN.md must_haves differed on `BONUS_DEFAULTS` field naming. The orchestrator objective said `{ multiplier_factor, multiplier_scope }` snake_case. The PLAN.md must_haves specified `{ multiplierFactor: number; scope: MultiplierScope; titleFr: string }` camelCase. I followed PLAN.md (the authoritative plan-file being executed), which aligns with CLAUDE.md convention "camelCase TypeScript field names — distinct from snake_case Postgres columns". This keeps the codebase convention consistent.

## Next Consumers

- **Plan 12-06** — `app/actions.ts:claimBonusEventFlow` will import `BonusEvent` + `BonusType` + `BONUS_DEFAULTS`; `reorderMoscowCardsFlow` will import `MoscowCard` + `MoscowBucket`.
- **Plan 12-07** — `lib/score.ts:applyBonusMultipliers` will import `BonusEvent` + `BONUS_MULTIPLIER_CAP` and use `Math.min(BONUS_MULTIPLIER_CAP, factor)` to cap stacking.
- **Plan 12-08** — UI components for bonus claim list + Player-facing "Boost actif" badge consume `BonusEvent` + `BONUS_DEFAULTS[type].titleFr`.
- **Plan 12-09** — DnD Kanban (`@dnd-kit/core`) component consumes `MoscowCard` for column rendering and reorder semantics.

## Threat Flags

None. This plan adds TypeScript type declarations only — no new runtime code, no new network endpoints, no new auth paths, no new file access patterns. Trust boundary unchanged.

## Self-Check: PASSED

- File `lib/types.ts` exists and contains all 8 expected exports (verified via Grep at lines 175, 180, 182, 184, 213, 239, 246, 248).
- Commit `df1080d` exists in `git log` (verified).
- `npm run typecheck` clean (exit 0).
- `npx eslint lib/types.ts` clean (exit 0).
- R1 grep audit clean (`/140`, `percentile`, `rank ` → 0 hits).
- SQL ↔ TS enum mirror verified for `bonus_type`, `bonus_status`, `multiplier_scope`, `moscow_bucket`.
