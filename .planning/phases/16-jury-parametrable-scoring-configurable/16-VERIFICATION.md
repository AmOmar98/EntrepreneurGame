---
phase: 16-jury-parametrable-scoring-configurable
plan: 04
status: passed
completed: "2026-06-12"
gate: typecheck+lint+build+test:unit+test:e2e
---

# Phase 16: Jury paramétrable + Scoring configurable — Verification

## Gate Log

| Command | Result | Details |
|---------|--------|---------|
| `npm run typecheck` | PASS | 0 errors, tsc --noEmit clean |
| `npm run lint` | PASS | 0 warnings, ESLint flat config clean |
| `npm run build` | PASS | All routes compiled, no missing imports |
| `npm run test:unit` | PASS | 105/105 tests (87 from plans 16-01/02/03 + 18 new jury-grid-schemas) |
| `npm run test:e2e` | PASS | 24/24 tests (23 from prior phases + 1 new demo-disabled assertion) |

Full gate: **GREEN** (all 5 commands pass).

---

## Requirement -> Evidence Trace

### JURY-06: Criteres de pitch (nombre, libelles, bareme max) definis par event en DB

| Evidence | File | Detail |
|----------|------|--------|
| `pitch_criteria` migration | `supabase/migrations/20260611240000_phase16_pitch_criteria.sql` | CREATE TABLE pitch_criteria(id, event_id, key, label, max, ord) + UNIQUE(event_id, key) |
| `pitch_scores.scores` jsonb | `supabase/migrations/20260611240000_phase16_pitch_criteria.sql` | ADD COLUMN IF NOT EXISTS scores jsonb + CHECK constraint |
| `lib/pitch-criteria.ts` accessor | `lib/pitch-criteria.ts` | getPitchCriteria() dual-mode; DEMO_PITCH_CRITERIA fallback |
| Unit test: DEMO_PITCH_CRITERIA shape | `tests/unit/event-settings.test.ts:88-107` | 4 criteria, max=20 each, keys=innovation/faisabilite/modele/equipe |

**Plan: 16-01. Status: SATISFIED**

---

### JURY-07: Formulaire /jury rend dynamiquement les criteres de l'event

| Evidence | File | Detail |
|----------|------|--------|
| `criteria` prop on JuryForm | `app/jury/jury-form.tsx` | `criteria?: PitchCriterion[]` prop; dynamic scores map state |
| `activeCriteria` fallback | `app/jury/jury-form.tsx` | Falls back to legacyCriteria (c1..c4 labels) when criteria absent |
| `getPitchCriteria(eventId)` call | `app/jury/page.tsx:53` | Only fetched in Supabase mode with valid eventId |
| E2E: /jury demo mode | `tests/e2e/jury-pitch.spec.ts:50-80` | Asserts zero criteria inputs in demo (form not rendered) |

**Plan: 16-02. Status: SATISFIED**

---

### JURY-08: Classements archivees absorbent criteres dynamiques + retro-compat 4/5 criteres

| Evidence | File | Detail |
|----------|------|--------|
| `normalizePitchScore` export | `lib/results.ts` | Dynamic jsonb path + legacy c5Raw>0 branch preserved |
| Retro-compat 4-crit test | `tests/unit/results-dynamic.test.ts:26-36` | total_score=80, c5=0, scores=null -> 100 (x1.25 hack) |
| Retro-compat 5-crit test | `tests/unit/results-dynamic.test.ts:38-43` | total_score=90, c5=10, scores=null -> 90 (no scaling) |
| Dynamic path test | `tests/unit/results-dynamic.test.ts:45-56` | scores={a:15,b:18}, maxTotal=40 -> 82.5 |
| String total_score coerce | `tests/unit/results-dynamic.test.ts:58-63` | "80" string -> 100 (retro-compat) |

NOTE: These 6 retro-compat + dynamic fixtures live in `tests/unit/results-dynamic.test.ts`,
created in Plan 16-02 Task 1 co-located with `normalizePitchScore` at its creation point.
This plan's verification ledger references them as passing evidence.

**Plan: 16-02. Status: SATISFIED**

---

### JURY-09: GM edite la grille jury dans l'editeur

| Evidence | File | Detail |
|----------|------|--------|
| `saveJuryGridFlow` action | `app/actions.ts` | Delete-then-insert pitch_criteria, GM role gate |
| `saveJuryGridSchema` schema | `lib/schemas.ts:128-137` | eventId UUID + criteria array min(1)/max(10) |
| `juryGridCriterionSchema` schema | `lib/schemas.ts:128-132` | key/label min(1), max int 1-100 |
| `AdminJuryGridEditor` component | `components/admin-jury-grid-editor.tsx` | Rubric-builder pattern, demo read-only |
| Settings page | `app/admin/events/[id]/settings/page.tsx` | GM-only route, AppShell staff chrome |
| Unit test: criteria=[] rejects | `tests/unit/jury-grid-schemas.test.ts:54-60` | saveJuryGridSchema rejects empty criteria |
| Unit test: 11-item rejects | `tests/unit/jury-grid-schemas.test.ts:62-73` | saveJuryGridSchema rejects 11-item array |
| Unit test: 3-item accepts | `tests/unit/jury-grid-schemas.test.ts:44-58` | saveJuryGridSchema accepts 3-item valid array |
| Unit test: max=0 rejects | `tests/unit/jury-grid-schemas.test.ts:21-24` | juryGridCriterionSchema rejects max=0 |
| Unit test: max=101 rejects | `tests/unit/jury-grid-schemas.test.ts:26-29` | juryGridCriterionSchema rejects max=101 |
| Unit test: max=20 accepts | `tests/unit/jury-grid-schemas.test.ts:17-20` | juryGridCriterionSchema accepts max=20 |

**Plans: 16-03 (actions + component), 16-04 (schema bounds tests). Status: SATISFIED**

---

### SETTINGS-01: Regles XP, paliers engagement, caps stockes dans event_settings

| Evidence | File | Detail |
|----------|------|--------|
| `event_settings` migration | `supabase/migrations/20260611240100_phase16_event_settings.sql` | xp_first_submission/v1/v2, eng_submitted/reviewed/validated, bonus_multiplier_cap DEFAULT 3.0 |
| `DEFAULT_EVENT_SETTINGS` | `lib/event-settings.ts:44-53` | bonusMultiplierCap:3.0 = BONUS_MULTIPLIER_CAP |
| `applyBonusMultiplier` opts | `lib/score.ts` | opts.bonusMultiplierCap wired from EventSettings |
| Unit test: bonusMultiplierCap=3.0 | `tests/unit/event-settings.test.ts:28-29` | DEFAULT_EVENT_SETTINGS.bonusMultiplierCap === 3.0 |
| XP literals replaced | `lib/journey.ts` | earnedXp += settings.xpFirstSubmission/xpValidateV1/xpValidateV2 |

**Plans: 16-01 (migration + accessor), 16-02 (wiring). Status: SATISFIED**

---

### SETTINGS-02: Ponderation projet/pitch paramétrable par event

| Evidence | File | Detail |
|----------|------|--------|
| `pitch_weight` column | `supabase/migrations/20260611240100_phase16_event_settings.sql` | numeric(4,3) DEFAULT 0.800 CHECK (BETWEEN 0.0 AND 1.0) |
| `DEFAULT_EVENT_SETTINGS.pitchWeight` | `lib/event-settings.ts:51` | pitchWeight: 0.8 |
| `getEventSettings` wired | `lib/results.ts` + `app/results/page.tsx` | pitchWeight from EventSettings passed to computeRanking |
| Unit test: pitchWeight=0.8 accepts | `tests/unit/jury-grid-schemas.test.ts:99-103` | saveEventSettingsSchema accepts 0.8 |
| Unit test: pitchWeight in [0,1] | `tests/unit/event-settings.test.ts:60-66` | getEventSettings returns pitchWeight in [0,1] |

**Plans: 16-01 (migration), 16-02 (wiring), 16-04 (bounds tests). Status: SATISFIED**

---

### SETTINGS-03: Triggers PL/pgSQL lisent memes parametres que helpers TS — zero double hardcode

| Evidence | File | Detail |
|----------|------|--------|
| `get_event_setting_int` SQL function | `supabase/migrations/20260611240200_phase16_triggers_parameterized.sql` | LANGUAGE sql STABLE SECURITY DEFINER; COALESCE(CASE p_key WHEN ... FROM event_settings, p_default) |
| `recalc_player_engagement` parameterized | `supabase/migrations/20260611240200_phase16_triggers_parameterized.sql` | Reads eng_submitted/reviewed/validated via get_event_setting_int(v_event_id, 'eng_*', fallback) |
| Fallback defaults identical to TS | `lib/event-settings.ts:44-53` | DEFAULT_EVENT_SETTINGS = 100/25/50/100/50/100/0.8 mirrors SQL fallbacks |
| XP literal removal | `lib/journey.ts` | grep -c "earnedXp += 100" lib/journey.ts = 0; grep -c "earnedXp += 50" = 0 |
| Unit test: getEventSettings fallback | `tests/unit/event-settings.test.ts:46-51` | getEventSettings(null) -> DEFAULT_EVENT_SETTINGS |
| Unit test: demo path | `tests/unit/event-settings.test.ts:53-57` | getEventSettings(uuid) with no Supabase env -> DEFAULT_EVENT_SETTINGS |

**Plans: 16-01 (SQL function + migration), 16-02 (TS wiring), 16-04 (unit tests). Status: SATISFIED**

---

### SETTINGS-04: GM edite les reglages dans l'editeur

| Evidence | File | Detail |
|----------|------|--------|
| `saveEventSettingsFlow` action | `app/actions.ts` | Upsert event_settings on event_id, GM role gate |
| `saveEventSettingsSchema` schema | `lib/schemas.ts:143-152` | xpFirst/V1/V2 0-500, pitchWeight 0-1 |
| `AdminEventSettingsEditor` component | `components/admin-event-settings-editor.tsx` | Fieldsets XP/engagement/pitch, demo read-only |
| Settings page | `app/admin/events/[id]/settings/page.tsx` | GM-only route |
| Unit test: pitchWeight=1.5 rejects | `tests/unit/jury-grid-schemas.test.ts:105-108` | saveEventSettingsSchema rejects pitchWeight=1.5 |
| Unit test: pitchWeight=-0.1 rejects | `tests/unit/jury-grid-schemas.test.ts:110-113` | saveEventSettingsSchema rejects pitchWeight=-0.1 |
| Unit test: xpFirstSubmission=600 rejects | `tests/unit/jury-grid-schemas.test.ts:119-122` | saveEventSettingsSchema rejects xpFirstSubmission=600 |

**Plans: 16-03 (actions + component), 16-04 (bounds tests). Status: SATISFIED**

---

## ROADMAP Success Criteria Trace

### SC-1: GM peut definir N criteres de pitch par event; formulaire /jury dynamique

Evidence: `AdminJuryGridEditor` + `saveJuryGridFlow` (plan 16-03). `/jury` form with `criteria` prop and dynamic `scores` map state (plan 16-02). `pitch_criteria` table with `UNIQUE(event_id, key)` (plan 16-01). E2E: zero criteria inputs in demo (plan 16-04 `tests/e2e/jury-pitch.spec.ts`).

**Status: SATISFIED**

---

### SC-2: Classements archives (AgreenTech 4 criteres, Digi 5 criteres) restent calculables correctement

Evidence: `normalizePitchScore` in `lib/results.ts` — `c5Raw > 0 ? totalRaw : totalRaw * 1.25` branch preserved verbatim. Unit tests in `tests/unit/results-dynamic.test.ts` (created Plan 16-02 Task 1):
- "retro-compat AgreenTech 4-crit": total_score=80, c5=0, scores=null -> 100 (x1.25)
- "retro-compat Digi 5-crit": total_score=90, c5=10, scores=null -> 90 (no scaling)
- Dynamic: scores={a:15,b:18}, maxTotal=40 -> 82.5

All 6 fixtures in results-dynamic.test.ts pass. Archives untouched (AUCUNE migration des rows archivees).

**Status: SATISFIED**

---

### SC-3: GM peut parametrer XP, paliers engagement, et pondertion projet/pitch depuis l'editeur

Evidence: `event_settings` table (plan 16-01 migration `20260611240100`), `AdminEventSettingsEditor` + `saveEventSettingsFlow` (plan 16-03). DEFAULT_EVENT_SETTINGS covers all 8 fields (plan 16-01). Schema bounds proved by unit tests (plan 16-04 jury-grid-schemas.test.ts).

**Status: SATISFIED**

---

### SC-4: Triggers PL/pgSQL lisent depuis event_settings — grep littéraux hardcodés retourne 0 match

Evidence: `recalc_player_engagement` in migration `20260611240200` reads via `get_event_setting_int(v_event_id, 'eng_submitted', 100)` — no free `100`, `25`, `50` literals in the engagement computation logic.

Grep verification (TS side): `grep -c "earnedXp += 100" lib/journey.ts` = 0; `grep -c "earnedXp += 50" lib/journey.ts` = 0. XP literals replaced by `settings.xpFirstSubmission/xpValidateV1/xpValidateV2`.

**PENDING-PROD-APPLY NOTE**: SC-4 is fully verifiable at the SQL layer only AFTER the 5 pending migrations are applied at the operator checkpoint (plan 16-05):
- `20260611220000_events_org_scope_enforce.sql` (Phase 15)
- `20260611230000_phase15_engine_columns.sql` (Phase 15)
- `20260611240000_phase16_pitch_criteria.sql` (Phase 16)
- `20260611240100_phase16_event_settings.sql` (Phase 16)
- `20260611240200_phase16_triggers_parameterized.sql` (Phase 16)

The SQL-side proof is the migration source itself: `get_event_setting_int` usage in recalc_player_engagement, no free 100/25/50 literals in the engagement computation. Pre-PROD-apply, the old trigger still uses the Phase 14 hardcoded version. Post-apply, the parameterized trigger is active.

**Status: CONDITIONALLY SATISFIED (TS side complete; SQL side awaiting 16-05 operator checkpoint)**

---

## R1 Audit (CLAUDE.md Post-Edit Guard)

Command:
```
grep -rn "score|rank|note|/100|/140|points|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"
```

Result: All matches are in:
- `app/results/` (GM/jury-facing pages — authorized per R1)
- `app/results/ceremony/` (GM-only ceremony — authorized)
- `components/results-*.tsx` (GM/podium/ceremony components — authorized)
- `components/submission-readonly.tsx` — R1 comment (line 37: "intentionally NOT rendered") + DeliverableScoreBlock reference (excluded by filter)

No matches from Phase 16 changes (lib/score.ts, lib/results.ts, lib/jury.ts, app/jury/, app/actions.ts, lib/journey.ts, lib/event-settings.ts, lib/schemas.ts, components/admin-jury-grid-editor.tsx, components/admin-event-settings-editor.tsx, app/admin/events/[id]/settings/).

Supplemental rank audit: `grep -rn "rank|classement|percentile|leaderboard" app/journey/deliverable/`
Result: `moscow-snapshot/page.tsx:5` — comment only ("R1 STRICT : no score/rank/multiplier in render."), no code match.

**R1 Audit: CLEAN** — no new Player-facing score/rank leaks introduced by Phase 16.

---

## Test Count Summary

| Suite | Before Phase 16 | After Phase 16 Plan 04 | New in Plan 04 |
|-------|----------------|------------------------|----------------|
| Unit (Vitest) | 44 (Phase 15 end) | 105 | +18 (jury-grid-schemas) |
| E2E (Playwright) | 23 (Phase 15 end) | 24 | +1 (demo-disabled assertion) |
| **Total** | **67** | **129** | **+19** |

Phase 16 contribution (plans 01-04):
- Plan 16-01: +14 unit (event-settings.test.ts — DEFAULT_EVENT_SETTINGS + getEventSettings fallbacks)
- Plan 16-02: +6 unit (results-dynamic.test.ts — normalizePitchScore retro-compat + dynamic)
- Plan 16-03: +23 unit (jury-settings-schemas.test.ts — saveJuryGridSchema + saveEventSettingsSchema)
- Plan 16-04: +18 unit (jury-grid-schemas.test.ts — juryGridCriterionSchema + focused bounds) + 1 E2E (demo-disabled)

---

## PENDING-PROD-APPLY Note

Five migrations are pending operator checkpoint (plan 16-05 `npx supabase db push --linked`):

| Migration | Phase | Content |
|-----------|-------|---------|
| `20260611220000_events_org_scope_enforce.sql` | 15 | organization_id FK enforcement |
| `20260611230000_phase15_engine_columns.sql` | 15 | rubric, composer_kind, auto_validate, soft_recommends_before |
| `20260611240000_phase16_pitch_criteria.sql` | 16 | pitch_criteria table + scores jsonb |
| `20260611240100_phase16_event_settings.sql` | 16 | event_settings table |
| `20260611240200_phase16_triggers_parameterized.sql` | 16 | get_event_setting_int + parameterized recalc_player_engagement |

All TS callers have pre-migration fallbacks (`DEFAULT_EVENT_SETTINGS`, `DEMO_PITCH_CRITERIA`, tolerant column reads). Deploying code WITHOUT applying migrations keeps PROD working correctly. PROD apply is the operator-gated plan 16-05.
