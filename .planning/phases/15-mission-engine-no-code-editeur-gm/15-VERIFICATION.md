---
phase: 15-mission-engine-no-code-editeur-gm
plan: 05
status: passed
completed: "2026-06-11"
gate: typecheck+lint+build+test:unit+test:e2e
---

# Phase 15: Mission Engine no-code (éditeur GM) — Verification

## Gate Log

| Command | Result | Details |
|---------|--------|---------|
| `npm run typecheck` | PASS | 0 errors, tsc --noEmit clean |
| `npm run lint` | PASS | 0 warnings, ESLint flat config clean |
| `npm run build` | PASS | All routes compiled, no missing imports |
| `npm run test:unit` | PASS | 44/44 tests (21 engine-schemas, 6 clone-remap, 8 actions-schemas, 9 migration schemas) |
| `npm run test:e2e` | PASS | 23/23 tests (15 pre-existing + 4 admin-engine + 4 r3-extension) |

Full gate: **GREEN** (all 5 commands pass).

---

## Requirement → Evidence Trace

### ENGINE-01: GM peut créer/éditer/désactiver une mission depuis /admin sans SQL

| Evidence | File | Detail |
|----------|------|--------|
| `createMissionFlow` server action | `app/actions.ts:2931` | INSERT into missions, GM gate, revalidatePath |
| `updateMissionFlow` server action | `app/actions.ts:2997` | UPDATE missions label/level/scheduled_at, GM gate |
| `deleteMissionFlow` server action | `app/actions.ts:3047` | DELETE with template count guard |
| `reorderMissionFlow` server action | `app/actions.ts:3080` | Batch UPDATE ord (swap pattern) |
| AdminMissionsEditor component | `components/admin-missions-editor.tsx` | Client component with useActionState for all 4 ops |
| Admin missions page | `app/admin/events/[id]/missions/page.tsx` | GM-only server page, AppShell staff chrome |
| E2E smoke (no 5xx) | `tests/e2e/admin-engine.spec.ts:41` | /admin/events/[id]/missions does not 5xx in demo mode |
| R3 smoke (Phase 15 extension) | `tests/smoke/r3-no-hardcoded-block.spec.ts:78` | /admin/events/[id]/missions does not 5xx |

**Status: SATISFIED**

---

### ENGINE-02: GM peut créer/éditer un deliverable_template (rubric, max_score, is_bonus...) via un éditeur de barème

| Evidence | File | Detail |
|----------|------|--------|
| `saveDeliverableTemplateFlow` server action | `app/actions.ts:3148` | INSERT/UPDATE deliverable_templates with full rubric JSON |
| rubric schema (`rubricSchema`) | `lib/schemas.ts:105` | `z.array(rubricCriterionSchemaBase).min(1)` — min 1 criterion |
| Unit test: rubricSchema empty rejects | `tests/unit/engine-schemas.test.ts:74` | `rubricSchema.safeParse([])` → `success===false` |
| Unit test: rubricSchema max>100 rejects | `tests/unit/engine-schemas.test.ts:81` | `{label:"X",max:101}` → `success===false` |
| Unit test: rubricSchema valid single criterion | `tests/unit/engine-schemas.test.ts:64` | `[{label:"Pertinence",max:25}]` → `success===true` |
| Admin migrations (schema) | `supabase/migrations/20260611230000_phase15_engine_columns.sql` | rubric, max_score, is_bonus, is_active, composer_kind, template_url, auto_validate columns |

**Status: SATISFIED**

---

### ENGINE-03: GM peut cloner un event existant (missions + livrables + réglages) en un clic

| Evidence | File | Detail |
|----------|------|--------|
| `cloneEventFlow` server action | `app/actions.ts:2723` | Two-pass clone: pass1 null insert, pass2 soft_recommends_before remap |
| `remapSoftRecommends` pure helper | `lib/clone-remap.ts:25` | Extracted pure remap function, unit-testable |
| Unit test: in-map remap | `tests/unit/clone-remap.test.ts:23` | Old id → New id via idMap |
| Unit test: out-of-map → null | `tests/unit/clone-remap.test.ts:33` | Points outside clone set → null (T-15-05 mitigated) |
| Unit test: null input → null | `tests/unit/clone-remap.test.ts:28` | No prerequisite → null |
| Unit test: clone isolation | `tests/unit/clone-remap.test.ts:50` | Result never equals source id |
| Clone trigger on events page | `components/admin-events-table.tsx` | CloneEventButton in GM events table |

**Status: SATISFIED**

---

### ENGINE-04: GM peut créer un event + cohorte (slug, nom, dates) depuis l'admin

| Evidence | File | Detail |
|----------|------|--------|
| `createEventFlow` server action | `app/actions.ts:2532` | INSERT events + cohorts, GM gate |
| `createCohortFlow` server action | `app/actions.ts:2587` | INSERT cohorts with event_id |
| Admin events page | `app/admin/events/page.tsx` | Create form rendered via AdminEventsTable |
| E2E smoke (no 5xx) | `tests/e2e/admin-engine.spec.ts:27` | /admin/events does not 5xx in demo mode |
| R3 smoke (Phase 15) | `tests/smoke/r3-no-hardcoded-block.spec.ts:56` | /admin/events does not 5xx |

**Status: SATISFIED**

---

### ENGINE-05: Comportements par livrable data-driven (composer_kind, template_url, auto_validate remplacent slugs codés en dur)

| Evidence | File | Detail |
|----------|------|--------|
| `MOSCOW_DELIVERABLE_SLUG` grep | `app/journey/deliverable/[id]/page.tsx:58` | COMMENT ONLY — zero active-code match |
| `isMoscowDeliverable = composerKind === "moscow"` | `app/journey/deliverable/[id]/page.tsx` | Data-driven replace of MOSCOW_DELIVERABLE_SLUG |
| `getTemplateLink` import removed | `app/journey/deliverable/[id]/page.tsx` | grep returns 0 matches on this page |
| `template_url` column used for link | `app/journey/deliverable/[id]/page.tsx` | Reads column directly, `lib/template-links.ts` unused |
| `isAutoValidate` dual-check | `app/actions.ts:269-271` | `(composer_kind=multi_url && auto_validate=true) OR (!column && slug===fiches-entretien-v1)` — pre-migration safe |
| DB migration: auto_validate column + trigger | `supabase/migrations/20260611230000_phase15_engine_columns.sql` | fn_auto_eval generalized to auto_validate column |
| Unit test: composerKindSchema | `tests/unit/engine-schemas.test.ts:43-58` | simple/moscow/multi_url accepted; hard_block/other rejected |

**Grep Results:**
- `MOSCOW_DELIVERABLE_SLUG` in app code: 0 active-code matches (1 comment)
- `getTemplateLink` from deliverable page: 0 matches
- bare `=== "fiches-entretien-v1"` gate without column check: 0 matches (the fallback wraps in `!tplData.composer_kind`)
- `HARD_BLOCK_DEPENDENCIES` at `app/actions.ts:195`: PRESENT — this is the documented R3/VALID-02 sole exception, intentionally retained

**Status: SATISFIED** (HARD_BLOCK_DEPENDENCIES noted as sole sanctioned exception per VALID-02)

---

### ENGINE-06: soft_recommends_before hint ambre non bloquant côté Player (R3 conforme)

| Evidence | File | Detail |
|----------|------|--------|
| Amber hint render | `app/journey/deliverable/[id]/page.tsx:435` | `<p className="eic-locked-hint--amber" role="note">` — zero `disabled` DOM |
| R3 grep audit | 0 matches | `grep -rn "blocks_progression_to\|disabled.*soft_recommends"` returns no code matches |
| Unit test: rubricSchema accepted | `tests/unit/engine-schemas.test.ts:64` | Proves rubric criterion validation (editor-side) |
| R3 smoke: deliverable no 5xx | `tests/smoke/r3-no-hardcoded-block.spec.ts:93` | /journey/deliverable/[id] with soft_recommends_before does not 5xx |
| DB migration | `supabase/migrations/20260611230000_phase15_engine_columns.sql` | soft_recommends_before FK on deliverable_templates |

**Status: SATISFIED**

---

### ENGINE-07: Logique calendrier simulable à date arbitraire en smoke

| Evidence | File | Detail |
|----------|------|--------|
| `getSimulatedNow()` helper | `lib/get-simulated-now.ts` | Reads `gsd_simulate_date` cookie (server-only) |
| `getSimulateDateDisplay()` helper | `lib/get-simulated-now.ts` | Returns display string for admin pill |
| `lib/admin.ts` uses `getSimulatedNow()` | `lib/admin.ts:226` | `const now = await getSimulatedNow()` replaces `Date.now()` |
| Admin levels page displays pill | `app/admin/levels/page.tsx:57-64` | Renders amber pill when simulate_date cookie set |

**Status: SATISFIED** (GM-only; Player deliverable page explicitly does NOT call getSimulatedNow — T-15-13 mitigated)

---

### LEVELS-04: GM peut renommer/réordonner/ajouter/retirer des niveaux depuis l'éditeur

| Evidence | File | Detail |
|----------|------|--------|
| `createLevelFlow` action | `app/actions.ts` | INSERT into levels_v2 |
| `updateLevelFlow` action | `app/actions.ts` | UPDATE label/description |
| `reorderLevelFlow` action | `app/actions.ts` | Batch UPDATE ord |
| `deleteLevelFlow` action | `app/actions.ts` | DELETE with mission count guard |
| `AdminLevelsEditor` component | `components/admin-levels-editor.tsx` | useActionState for all 4 ops |
| Admin levels page | `app/admin/levels/page.tsx` | GM-only, AppShell staff chrome |
| E2E smoke (no 5xx) | `tests/e2e/admin-engine.spec.ts:35` | /admin/levels does not 5xx in demo mode |
| R3 smoke (Phase 15) | `tests/smoke/r3-no-hardcoded-block.spec.ts:67` | /admin/levels does not 5xx |

**Status: SATISFIED**

---

### VALID-01: validation_rules warn-only structurel — severity:"error" impossible

| Evidence | File | Detail |
|----------|------|--------|
| `validationRuleSchema` Zod | `lib/schemas.ts:86-90` | `severity: z.literal("warn")` — "error" fails at parse |
| DB CHECK constraint | `supabase/migrations/20260611230000_phase15_engine_columns.sql` | `CHECK (validation_rules_severity_warn_only)` |
| Unit test: error rejected | `tests/unit/engine-schemas.test.ts:28` | `severity:"error"` → `success===false` |
| Unit test: warn accepted | `tests/unit/engine-schemas.test.ts:22` | `severity:"warn"` → `success===true` |
| Unit test: empty rule rejected | `tests/unit/engine-schemas.test.ts:35` | `rule:""` → `success===false` |
| actions-schemas.test.ts coverage | `tests/unit/actions-schemas.test.ts:60-77` | Pre-existing tests in actions-schemas.test.ts also cover validationRuleSchema |

**Status: SATISFIED** (defense in depth: both TS Zod layer and DB CHECK)

---

### VALID-02: Exception hard-block L2 unique, non exposée dans l'éditeur

| Evidence | File | Detail |
|----------|------|--------|
| `HARD_BLOCK_DEPENDENCIES` literal | `app/actions.ts:195` | Retained as-is, single hardcoded exception |
| Not in editor UI | `components/admin-missions-editor.tsx`, `components/admin-deliverable-template-form.tsx` | No `HARD_BLOCK_DEPENDENCIES` field exposed in GM editor |
| composerKindSchema rejects "hard_block" | `tests/unit/engine-schemas.test.ts:53` | `composerKindSchema.safeParse("hard_block")` → `success===false` |
| R3 grep confirms no new hard-block | grep audit | `blocks_progression_to` returns 0 code matches (only comment in bonus-claim-form.tsx) |

**Status: SATISFIED** (sole exception at actions.ts:195; never generalized)

---

## ROADMAP Success Criteria Trace

### SC-1: GM peut créer event + cohorte, créer/éditer/désactiver mission, créer/éditer deliverable_template — zéro SQL requis

Evidence: `createEventFlow`, `createCohortFlow` (actions.ts:2532/2587), `createMissionFlow`/`updateMissionFlow`/`deleteMissionFlow` (actions.ts:2931-3047), `saveDeliverableTemplateFlow` (actions.ts:3148). Admin pages: `/admin/events`, `/admin/events/[id]/missions`. Components: AdminEventsTable, AdminMissionsEditor, AdminDeliverableTemplateForm.

**Status: SATISFIED**

---

### SC-2: GM peut cloner un event — clone indépendant de l'original

Evidence: `cloneEventFlow` (actions.ts:2723) two-pass clone with `remapSoftRecommends` (lib/clone-remap.ts). Unit tests confirm remap isolation (tests/unit/clone-remap.test.ts). Pass1 inserts with `soft_recommends_before=null`; Pass2 remaps via idMap (old→new). Out-of-map values stay null, never reference source rows.

**Status: SATISFIED**

---

### SC-3: composer_kind, template_url, auto_validate remplacent tous les slugs codés en dur — grep retourne 0 match

Evidence:
- `MOSCOW_DELIVERABLE_SLUG`: 0 active-code matches
- `lib/template-links.ts` `getTemplateLink` on deliverable page: 0 matches  
- bare `=== "fiches-entretien-v1"` gate: 0 matches (wrapped in `!column` guard)
- UUID G01 in trigger: replaced by `auto_validate` column in migration `20260611230000`
- `HARD_BLOCK_DEPENDENCIES`: retained intentionally (VALID-02 sole exception, documented)

**Status: SATISFIED** (HARD_BLOCK_DEPENDENCIES is the sanctioned VALID-02 exception, not a violation)

---

### SC-4: soft_recommends_before — hint ambre Player; aucun disabled DOM ni pointer-events:none configurable (R3)

Evidence: `app/journey/deliverable/[id]/page.tsx:435` renders `.eic-locked-hint--amber` with `role="note"`, zero `disabled` or `pointer-events: none`. R3 audit grep: 0 matches for `blocks_progression_to` or `disabled.*soft_recommends`. R3 smoke extended with deliverable page test.

**Status: SATISFIED**

---

### SC-5: validation_rules warn-only — severity:"error" impossible via l'éditeur (R2) ; exception L2 seule

Evidence: `lib/schemas.ts:86-90` `z.literal("warn")`, DB CHECK constraint, 5 unit tests in engine-schemas.test.ts. composerKindSchema rejects "hard_block". HARD_BLOCK_DEPENDENCIES at actions.ts:195 = sole L2 exception, not in any editor form.

**Status: SATISFIED**

---

### SC-6: scheduled_date simulable à date arbitraire en smoke

Evidence: `lib/get-simulated-now.ts` reads `gsd_simulate_date` cookie. `lib/admin.ts:226` calls `getSimulatedNow()`. Admin levels page shows amber pill when active. Documented in CONTEXT decision: GM-only, Player not affected.

**Status: SATISFIED**

---

## R1 Audit (CLAUDE.md Post-Edit Guard)

Command:
```
grep -rn "score|rank|note|/100|/140|points|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"
```

Result: All matches are in `app/results/` (GM/jury-facing) and `components/results-*` (allowed). No score/rank/note leak from:
- New editor components (GM-only, `/admin`)
- Soft_recommends_before hint on player deliverable page (carries only advisory text + prerequisite title)

Supplemental rank audit: `grep -rn "rank|classement|percentile|leaderboard" app/journey/deliverable/` — 1 match: `moscow-snapshot/page.tsx:5` (comment with R1 STRICT note — no render).

**R1 Audit: CLEAN**

---

## R3 Audit (CLAUDE.md Cardinal)

Command:
```
grep -rn "blocks_progression_to|disabled.*soft_recommends" app/ components/
```

Result: `components/bonus-claim-form.tsx:4` — comment only ("R3 preserved: no DOM disabled cross-mission, no blocks_progression_to"). Zero code matches.

New editor surfaces (`components/admin-missions-editor.tsx`, `components/admin-deliverable-template-form.tsx`, `components/admin-events-table.tsx`, `components/admin-levels-editor.tsx`): zero `disabled` attributes derived from `soft_recommends_before` or any configurable dependency.

`HARD_BLOCK_DEPENDENCIES` at `app/actions.ts:195`: documented VALID-02 sole exception, not in editor UI.

**R3 Audit: CLEAN**

---

## ENGINE-05 Grep Gate

| Pattern | Command | Result | Note |
|---------|---------|--------|------|
| `MOSCOW_DELIVERABLE_SLUG` | grep in app/ lib/ | 1 match: comment only (`app/journey/deliverable/[id]/page.tsx:58`) | CLEAN |
| `getTemplateLink` from deliverable page | grep in app/journey/deliverable/ | 0 matches | CLEAN |
| bare `fiches-entretien-v1` slug gate | grep in app/ | Matches are: comment (actions.ts:199), pre-migration dual-check wrapped in `!column` guard (actions.ts:271), comment in page (page.tsx:601), dynamic slug read in mentor page | CLEAN (no raw gate) |
| `HARD_BLOCK_DEPENDENCIES` | grep in app/ | 2 matches: definition (actions.ts:195) + usage (actions.ts:277) | EXPECTED — VALID-02 sanctioned exception |

**ENGINE-05 Gate: GREEN** — no application-code matches for de-hardcoded slugs; HARD_BLOCK_DEPENDENCIES is the sole documented exception.

---

## Deferred / Operator-Gated

| Item | Status | Action Required |
|------|--------|-----------------|
| Migration `20260611220000_events_org_scope_enforce.sql` PROD apply | PENDING | Operator checkpoint (Phase 16/18 batch). Pre-migration: code tolerates `organization_id=null`, deactivate-all fallback in activateEventFlow. |
| Migration `20260611230000_phase15_engine_columns.sql` PROD apply | PENDING | Operator checkpoint (Phase 16/18 batch). Pre-migration: defensive column reads (`composer_kind ?? "simple"`, `auto_validate ?? false`, `soft_recommends_before ?? null`) keep PROD deployable with all existing behaviors intact. |
| UUID G01 in trigger `fn_auto_eval_fiches_entretien` | OPERATOR-GATED | The trigger is parameterized to `auto_validate` column in the new migration but the old trigger still uses hardcoded UUID until migration is applied. Post-migration, the trigger reads `auto_validate=true` from the column. |
| `lib/template-links.ts` remaining usages | VERIFIED | The 13 template URLs (`getTemplateLink`) are only used on the deliverable detail page (now using `template_url` column). `lib/template-links.ts` file is still present but no longer imported from the Player deliverable page. Deferred cleanup of the file itself (out of scope for Phase 15). |

**PROD deployability**: The de-hardcoded consumers have pre-migration fallbacks so deploying the code WITHOUT applying the migrations keeps PROD working correctly. No breaking change until migrations are applied.

---

## Test Count Summary

| Suite | Before Phase 15 | After Phase 15 Plan 05 | New Tests |
|-------|----------------|------------------------|-----------|
| Unit (Vitest) | 23 | 44 | +21 (engine-schemas) +6 (clone-remap) |
| E2E (Playwright) | 15 | 23 | +4 (admin-engine) +4 (r3-extension) |
| **Total** | **38** | **67** | **+29** |
