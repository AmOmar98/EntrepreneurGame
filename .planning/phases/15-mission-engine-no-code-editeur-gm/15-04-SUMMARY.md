---
phase: 15-mission-engine-no-code-editeur-gm
plan: "04"
subsystem: engine-consumer-side
tags: [engine, levels-crud, de-hardcoding, soft-recommends, simulate-date, ENGINE-05, ENGINE-06, ENGINE-07, LEVELS-04, R1, R3]
dependency_graph:
  requires: [15-01, 15-02, 15-03]
  provides: [admin-levels-page, getSimulatedNow, createLevelFlow, updateLevelFlow, reorderLevelFlow, deleteLevelFlow, engine05-consumer-dehardcode, engine06-amber-hint, engine07-date-inject]
  affects: [app/actions.ts, lib/admin.ts, app/journey/deliverable/[id]/page.tsx, app/admin/levels/page.tsx, components/admin-levels-editor.tsx, lib/get-simulated-now.ts, lib/admin-levels.ts]
tech_stack:
  added: []
  patterns: [server-only-date-injection, pre-migration-defensive-reads, composer-kind-data-driven, amber-hint-advisory-only, gm-role-gate, useActionState]
key_files:
  created:
    - lib/get-simulated-now.ts
    - lib/admin-levels.ts
    - app/admin/levels/page.tsx
    - components/admin-levels-editor.tsx
  modified:
    - app/actions.ts
    - lib/admin.ts
    - app/journey/deliverable/[id]/page.tsx
decisions:
  - "getSimulatedNow reads gsd_simulate_date cookie (next/headers); JSDoc documents server-context constraint; GM-only because lib/admin.ts is only called from admin server components"
  - "isAutoValidate = (composer_kind=multi_url && auto_validate=true) || (!composer_kind && slug===fiches-entretien-v1) — pre-migration dual-check so PROD keeps working until migration applied"
  - "HARD_BLOCK_DEPENDENCIES literal at app/actions.ts:195 left exactly as-is (VALID-02 / R3 exception)"
  - "soft_recommends_before hint: fetches prereq title and validates player status server-side — never renders placeholder text"
  - "templateUrl ?? null defensive read: pre-migration column absence falls back to null (no template link shown — correct)"
  - "getTemplateLink function removed from page import; EXAMPLES_FOLDER_URL import retained (Site 6 out of scope)"
  - "reorderLevelFlow uses swap-ord pattern (same as reorderMoscowCardsFlow); one swap = two batch updates"
metrics:
  duration: "9min"
  completed: "2026-06-11"
  tasks: 3
  files: 7
---

# Phase 15 Plan 04: De-hardcoding + Levels Editor + Date Simulation Summary

Levels CRUD editor (LEVELS-04), data-driven composer_kind/template_url de-hardcoding on the Player deliverable page (ENGINE-05), non-blocking soft_recommends_before amber hint (ENGINE-06), and GM-only scheduled_date simulation via getSimulatedNow (ENGINE-07).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | getSimulatedNow helper + levels CRUD actions + editor page/component | ed1038d | lib/get-simulated-now.ts, lib/admin-levels.ts, app/admin/levels/page.tsx, components/admin-levels-editor.tsx, app/actions.ts |
| 2 | De-hardcode deliverable page (composer_kind/template_url) + soft_recommends_before hint | e4d0850 | app/journey/deliverable/[id]/page.tsx |
| 3 | De-hardcode actions-side auto-validate + wire getSimulatedNow | 7a07bdf | app/actions.ts, lib/admin.ts |

## What Was Built

**lib/get-simulated-now.ts** (ENGINE-07):
- `getSimulatedNow(): Promise<number>` — reads `gsd_simulate_date` cookie via `next/headers`
- Validates YYYY-MM-DD format, returns epoch ms for midnight UTC; falls back to `Date.now()` on any invalid/absent value
- `getSimulateDateDisplay(): Promise<string | null>` — returns the display string for the admin page pill
- JSDoc documents server-context constraint (Server Components, Server Actions, Route Handlers only)
- Catches exceptions to handle static build context where headers() throws

**lib/admin-levels.ts**:
- `getAdminLevels(): Promise<Level[]>` — thin wrapper over `getLevels()`, returns [] in demo mode

**app/admin/levels/page.tsx** (LEVELS-04):
- GM-only server page (getCurrentUser + getCurrentRole guard, redirect non-GM)
- AppShell role="game_master" variant="staff"
- `getSimulateDateDisplay()` renders amber topbar pill when simulation active
- Demo mode amber pill with `admin_engine_demo_disabled`
- Renders `<AdminLevelsEditor levels={levels} />`

**components/admin-levels-editor.tsx** (LEVELS-04):
- Client component with useActionState for create, update, reorder, delete
- `LevelRow`: inline label edit (updateLevelFlow), up/down reorder buttons (ChevronUp/ChevronDown) with aria-labels "Monter le niveau"/"Descendre le niveau"; boundary buttons disabled at 0.4 opacity
- Delete: Trash2 icon → inline confirm ("Oui, supprimer" / "Annuler") — no modal, defense-in-depth
- `AddLevelForm`: id + label + ord inputs → createLevelFlow with `admin_engine_create_level` CTA
- Empty state renders `admin_engine_levels_empty`

**app/actions.ts** — four new level actions:
- `createLevelFlow`: INSERT into levels_v2, GM gate + demo guard, revalidatePath /admin/levels + /journey
- `updateLevelFlow`: UPDATE label/description by id; same guards + revalidation
- `reorderLevelFlow`: JSON items array; batch UPDATE loop (swap-ord pattern); same guards
- `deleteLevelFlow`: COUNT missions WHERE level_id=id; blocks with French message when >0; else DELETE; same guards
- ENGINE-05: extended template SELECT in `submitDeliverable` to fetch `composer_kind + auto_validate`; `isAutoValidate` flag dispatches on `(composer_kind=multi_url && auto_validate=true)` OR pre-migration fallback to slug literal

**app/journey/deliverable/[id]/page.tsx** (ENGINE-05/06):
- Extended SELECT: adds `composer_kind, template_url, auto_validate, soft_recommends_before`
- Defensive reads: `composerKind ?? "simple"`, `templateUrl ?? null`, `autoValidate ?? false`
- `isMoscowDeliverable = composerKind === "moscow"` (removed MOSCOW_DELIVERABLE_SLUG constant)
- `isFichesEntretienDeliverable = composerKind === "multi_url" && autoValidate === true` (removed slug literal)
- Template link: `templateUrl` column replaces `getTemplateLink(tpl.slug)` (removed import)
- soft_recommends_before hint: fetches prereq template title + validates player status server-side; renders `<p className="eic-locked-hint--amber" role="note">` with lucide Info icon + `admin_engine_soft_recommends_hint.replace("[titre]", prerequisiteTitle)` — ZERO disabled DOM, ZERO pointer-events (R3 CARDINAL)

**lib/admin.ts** (ENGINE-07):
- Imports `getSimulatedNow` from `@/lib/get-simulated-now`
- `const now = await getSimulatedNow()` replaces `Date.now()` in scheduled_at elapsed-missions comparison

## Verification

- `npm run typecheck` — green (0 errors)
- `npm run lint` — green (0 warnings)
- `npm run build` — green
- `npm run test:unit` — 23/23 passed (no regression)
- `npm run test:e2e` — 15/15 passed (pre-migration defensive reads preserve demo behavior)

## R1 Grep Audit (CLAUDE.md mandatory post-edit)

Command: `grep -rn "score|rank|note|/100|/140|points|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"`

Result: All matches are in `app/results/` (GM/jury-facing surfaces) and `components/results-*` (allowed). No score/rank/note leak from the new amber hint or de-hardcoded deliverable page. The `eic-locked-hint--amber` hint carries only advisory text with a prerequisite title — no numeric score, no rank, no percentile.

Supplemental rank audit on deliverable detail: `grep -rn "rank|classement|percentile|leaderboard" app/journey/deliverable/` — 0 matches.

## R3 Audit

`grep -rn "blocks_progression_to|disabled.*soft_recommends" app/ components/` — 0 matches.
`soft_recommends_before` renders purely as `.eic-locked-hint--amber` advisory paragraph. No DOM blocking around it.

## ENGINE-05 Success Criterion

- `MOSCOW_DELIVERABLE_SLUG`: 0 active-code matches (1 comment only)
- `getTemplateLink` import from app/journey/deliverable: 0 matches
- Bare `=== "fiches-entretien-v1"` gate without column check: 0 matches (the pre-migration fallback wraps in `!tplData.composer_kind` guard)
- `HARD_BLOCK_DEPENDENCIES` literal: still at actions.ts:195 — unchanged (VALID-02)

## Deviations from Plan

**1. [Rule 2 - Missing critical] getSimulateDateDisplay helper added alongside getSimulatedNow**
- **Found during:** Task 1
- **Issue:** Admin levels page needs to display the simulate_date pill; creating a separate helper avoids importing cookie logic twice
- **Fix:** Added `getSimulateDateDisplay()` to lib/get-simulated-now.ts — same file, same logic, just returns the string instead of epoch ms
- **Files modified:** lib/get-simulated-now.ts

None of the plan's core acceptance criteria were missed. All deviations are additive only.

## Known Stubs

None. All behaviors are wired to real server actions in production mode. Demo mode shows the `admin_engine_demo_disabled` pill and returns guard messages from actions. The soft_recommends_before hint fetches real data from Supabase when available; in demo mode the entire deliverable detail page shows `submission_demo_disabled` (no new stubs introduced).

## Threat Flags

No new threat surface beyond the plan's threat model.

Mitigations applied:
- T-15-12 (soft_recommends_before hard-block): `.eic-locked-hint--amber` only; grep confirms 0 disabled/pointer-events near hint
- T-15-13 (simulate_date Player abuse): getSimulatedNow only called from lib/admin.ts (getCohortOverview) and admin pages; Player deliverable page does NOT call getSimulatedNow
- T-15-14 (pre-migration column crash): defensive `?? "simple"` / `?? null` / `?? false` reads + slug fallback prevent any throw on missing columns
- T-15-15 (R1 score/rank leak): hint carries only advisory text + prerequisite title; R1 audit clean

## Self-Check: PASSED

Files exist:
- lib/get-simulated-now.ts — FOUND
- lib/admin-levels.ts — FOUND
- app/admin/levels/page.tsx — FOUND
- components/admin-levels-editor.tsx — FOUND

Commits exist:
- ed1038d (feat: levels editor + getSimulatedNow) — FOUND
- e4d0850 (feat: de-hardcode deliverable page) — FOUND
- 7a07bdf (feat: de-hardcode actions + wire ENGINE-07) — FOUND
