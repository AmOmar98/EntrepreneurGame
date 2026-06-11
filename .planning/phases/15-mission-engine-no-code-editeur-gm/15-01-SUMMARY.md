---
phase: 15-mission-engine-no-code-editeur-gm
plan: "01"
subsystem: engine-foundation
tags: [migration, types, schemas, tdd, engine, valid-01, r2]
dependency_graph:
  requires: [14-04]
  provides: [engine-column-contracts, validationRuleSchema, composerKindSchema, DeliverableTemplate-extended]
  affects: [lib/journey.ts, lib/seed/deliverableTemplates.ts, supabase/migrations]
tech_stack:
  added: []
  patterns: [additive-migration, tdd-red-green, defensive-defaults, warn-only-structural]
key_files:
  created:
    - supabase/migrations/20260611230000_phase15_engine_columns.sql
  modified:
    - lib/types.ts
    - lib/schemas.ts
    - lib/journey.ts
    - lib/seed/deliverableTemplates.ts
    - tests/unit/actions-schemas.test.ts
decisions:
  - "DeliverableTemplate required fields (not optional): all callers must supply defaults — mapper pattern in journey.ts demonstrates the pre-migration defensive approach"
  - "lib/journey.ts mapDeliverableTemplate extended with defensive defaults — required because types are non-optional but DB columns may not exist yet in PROD"
  - "validationRules field in DeliverableTemplateRow maps to unknown[] to avoid importing ValidationRule in journey.ts; mapper returns [] (safe, no loss)"
metrics:
  duration: "12min"
  completed: "2026-06-11"
  tasks: 3
  files: 5
---

# Phase 15 Plan 01: Engine Columns Foundation Summary

Data foundation for the no-code mission engine: additive migration with 5 behaviour columns on deliverable_templates, a DB CHECK that makes severity:'error' impossible (VALID-01/R2), backfill of the 13 Digi templates with real OneDrive URLs, trigger generalization from slug literal to auto_validate column, and matching TypeScript types + Zod schemas + demo seed defaults.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write additive engine-columns migration | a8ce401 | supabase/migrations/20260611230000_phase15_engine_columns.sql |
| 2 RED | Failing tests for validationRuleSchema + composerKindSchema | 8b709a7 | tests/unit/actions-schemas.test.ts |
| 2 GREEN | Extend DeliverableTemplate type + add schemas | 69f528e | lib/types.ts, lib/schemas.ts, lib/journey.ts |
| 3 | Demo seed safe defaults | 466422e | lib/seed/deliverableTemplates.ts |

## What Was Built

**Migration** (`supabase/migrations/20260611230000_phase15_engine_columns.sql`):
- 5 additive columns: `composer_kind text NOT NULL DEFAULT 'simple'`, `template_url text`, `auto_validate boolean NOT NULL DEFAULT false`, `soft_recommends_before uuid FK`, `validation_rules jsonb NOT NULL DEFAULT '[]'`
- `validation_rules_severity_warn_only` CHECK: severity must be 'warn' via NOT EXISTS + jsonb_array_elements (DB-side VALID-01)
- `composer_kind_valid_values` CHECK: restricted to ('simple','moscow','multi_url')
- Backfill of all 15 Digi-Hackathon slugs with real OneDrive URLs, composer_kind (moscow-v1 → 'moscow', fiches-entretien-v1 → 'multi_url', rest → 'simple'), auto_validate (only fiches-entretien-v1)
- `fn_auto_eval_fiches_entretien` generalized: checks `auto_validate = true` from deliverable_templates instead of slug literal 'fiches-entretien-v1' (ENGINE-05)
- G01 UUID `59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334` retained as canonical system evaluator
- PROD apply deferred to operator checkpoint (batched with 20260611220000)

**TypeScript types** (`lib/types.ts`):
- `ComposerKind = "simple" | "moscow" | "multi_url"` — mirrors DB CHECK
- `ValidationRule = { rule: string; severity: "warn"; message: string }` — severity locked to "warn" at compile time
- `DeliverableTemplate` extended with 5 new fields (required, non-optional)

**Zod schemas** (`lib/schemas.ts`):
- `composerKindSchema = z.enum(["simple","moscow","multi_url"])` — T-15-02 elevation prevention
- `validationRuleSchema = z.object({ rule: z.string().min(1), severity: z.literal("warn"), message: z.string().min(1) })` — VALID-01 structural guarantee: `z.literal("warn")` makes severity:'error' impossible at parse time, mirroring the DB CHECK

**Mapper defaults** (`lib/journey.ts`):
- `DeliverableTemplateRow` extended with optional phase-15 columns
- `mapDeliverableTemplate` adds defensive defaults for pre-migration window

**Demo seed** (`lib/seed/deliverableTemplates.ts`):
- Both entries now satisfy extended `DeliverableTemplate` type with `composerKind: "simple"`, `templateUrl: null`, `autoValidate: false`, `softRecommendsBefore: null`, `validationRules: []`

## Verification

- `npm run typecheck` — green (0 errors)
- `npm run lint` — green (0 warnings)
- `npm run build` — green
- `npm run test:unit` — 23 passed (14 existing + 7 new validationRuleSchema + 2 new composerKindSchema)
- `npm run test:e2e` — 15/15 passed (0 behavioral change)

## TDD Gate Compliance

- RED commit: `8b709a7` (test(15-01): failing tests for validationRuleSchema + composerKindSchema)
- GREEN commit: `69f528e` (feat(15-01): extend DeliverableTemplate type + add schemas)
- Both gates satisfied.

## Deviations from Plan

**1. [Rule 2 - Missing] Extended lib/journey.ts mapDeliverableTemplate**
- **Found during:** Task 2 (typecheck after type extension)
- **Issue:** `mapDeliverableTemplate` returns a `DeliverableTemplate` but had no values for the 5 new required fields
- **Fix:** Extended `DeliverableTemplateRow` with optional phase-15 columns + added defensive defaults in mapper (`composerKind ?? "simple"`, etc.)
- **Files modified:** `lib/journey.ts`
- **Commit:** `69f528e`
- **Why not a Rule 4:** Single mapper function, no new table or schema change — purely additive field mapping with safe defaults

## Known Stubs

None — all new fields carry inert safe defaults (no data flows to UI from them yet; consumer pages are unmodified in this plan).

## Threat Flags

No new threat surface introduced. All mitigations in the threat register (T-15-01, T-15-02, T-15-03) are implemented:
- T-15-01: validation_rules_severity_warn_only CHECK + z.literal("warn") — both present
- T-15-02: composer_kind_valid_values CHECK + z.enum mirror — both present
- T-15-03: additive/idempotent migration, PROD apply deferred — satisfied

## Self-Check: PASSED

Files exist:
- supabase/migrations/20260611230000_phase15_engine_columns.sql — FOUND
- lib/types.ts (ComposerKind, ValidationRule exported) — FOUND
- lib/schemas.ts (validationRuleSchema, composerKindSchema exported) — FOUND
- lib/seed/deliverableTemplates.ts (composerKind x2) — FOUND

Commits exist:
- a8ce401 (migration) — FOUND
- 8b709a7 (RED test) — FOUND
- 69f528e (GREEN types+schemas) — FOUND
- 466422e (seed defaults) — FOUND
