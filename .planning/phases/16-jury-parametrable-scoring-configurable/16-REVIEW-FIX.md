---
phase: 16-jury-parametrable-scoring-configurable
fixed_at: 2026-06-12T01:10:00Z
review_path: .planning/phases/16-jury-parametrable-scoring-configurable/16-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 6
skipped: 1
status: partial
---

# Phase 16: Code Review Fix Report

**Fixed at:** 2026-06-12T01:10:00Z
**Source review:** .planning/phases/16-jury-parametrable-scoring-configurable/16-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (CR-01, CR-02, CR-03, WR-01, WR-02, WR-04, IN-01)
- Fixed: 6
- Skipped: 1 (WR-03 — accepted per fix_directives)

**Gate result:** typecheck OK · lint OK · build OK · test:unit 105/105 · test:e2e 24/24

---

## Fixed Issues

### CR-01: ceremony page now fetches eventSettings and passes pitchWeight

**Files modified:** `app/results/ceremony/page.tsx`
**Commit:** `0e31b7d`
**Applied fix:** Added `getCurrentPitchModeState()` + `getEventSettings(pitchMode.eventId)` calls
before `computeRanking()`. Now passes `{ pitchWeight: eventSettings.pitchWeight }` matching the
identical pattern in `app/results/page.tsx`. The ceremony podium and the main ranking page
are guaranteed to use the same weight, so the podium order cannot diverge.

---

### CR-02: bonusMultiplierCap threading documented as explicitly deferred

**Files modified:** `lib/score.ts`
**Commit:** `09f4fa1`
**Applied fix:** Added `@note CR-02` JSDoc paragraph to `applyBonusMultiplier` documenting that:
(a) the function already accepts `opts.bonusMultiplierCap` and uses it correctly; (b) there are
currently zero production call-sites in `app/` or `components/`; (c) threading is explicitly
deferred until a Mentor/GM evaluation surface calls `applyBonusMultiplier`.
Note: fixing "requires human verification" — the deferred status is intentional and
the documentation is accurate, but the underlying CR (no threading) remains open until
a production call-site is introduced.

---

### CR-03: bonusMultiplierCap added to schema, upsert payload, and GM editor

**Files modified:** `lib/schemas.ts`, `app/actions.ts`, `components/admin-event-settings-editor.tsx`, `lib/i18n.ts`
**Commit:** `7b0924d`
**Applied fix:**
- `lib/schemas.ts`: `bonusMultiplierCap: z.coerce.number().min(1).max(10)` added to `saveEventSettingsSchema`
- `app/actions.ts`: `bonusMultiplierCap` parsed from `formData`; `bonus_multiplier_cap: parsed.data.bonusMultiplierCap` included in `settingsPayload` upsert
- `components/admin-event-settings-editor.tsx`: new fieldset with `<input type="number" name="bonusMultiplierCap" min=1 max=10 step=0.1>` using `settings.bonusMultiplierCap` as `defaultValue`
- `lib/i18n.ts`: `admin_settings_bonus_multiplier_cap` key added in both `fr` and `en` dictionaries

---

### WR-01: jury-form score20 display uses uniformMax guard

**Files modified:** `app/jury/jury-form.tsx`
**Commit:** `b7a5cfe`
**Applied fix:** Replaced the unconditional `totalRaw / criteriaCount` formula with a `uniformMax`
guard — `uniformMax` is the shared max value when all criteria have equal `max`, or `null` when
non-uniform. When `uniformMax` is non-null, displays `{score20} / {uniformMax}` as before
(no visual change for the current 4×20 default grid). When `uniformMax` is null (heterogeneous
grid), displays `{totalRaw} / {maxTotal} pts` instead — semantically correct for all configurations.

---

### WR-02: saveJuryGridFlow upsert-first then delete stale

**Files modified:** `app/actions.ts`
**Commit:** `3a62e95`
**Applied fix:** Replaced delete-then-insert with a two-step merge:
1. Upsert rows on `(event_id, key)` conflict — no empty window, running jurors see valid criteria at all times
2. Delete only rows whose `key` is absent from the new grid (stale cleanup)
When the new grid is empty, deletes all rows for the event (same final state as before but
without the window where `getPitchCriteria()` would return empty and fall back to demo criteria).
Note: `requires human verification` — the `.not("key", "in", ...)` PostgREST filter syntax
should be verified against an active Supabase connection before the next jury session.

---

### WR-04: symmetric NaN/invalid guard in computeRanking aggregation loop

**Files modified:** `lib/results.ts`
**Commit:** `0964a43`
**Applied fix:** Clarified the skip condition semantics and moved `normalizePitchScore` after
the guard (avoids computing normalized score for skipped rows). Logic is now explicit:
skip only when BOTH paths unusable (`Number.isNaN(totalRaw) && !hasValidScores`). A row with
NaN `total_score` but valid `scores` jsonb now correctly proceeds via the dynamic path.
The legacy non-regression fixtures remain green (105/105 unit tests pass).

---

### IN-01: pitch_criteria + event_settings RLS policies appended to database/rls.sql

**Files modified:** `database/rls.sql`, `scripts/mirror-phase15-16-declarative.cjs`
**Commit:** `cfb5157`
**Applied fix:** Extended `scripts/mirror-phase15-16-declarative.cjs` with a second idempotent
marker block (`pitch_criteria_event_settings_rls mirror`). Running the script appended
4 `CREATE POLICY` statements to `database/rls.sql`:
- `pitch_criteria_authenticated_select` (SELECT to authenticated using true)
- `pitch_criteria_gm_all` (ALL to authenticated using/with check is_game_master())
- `event_settings_authenticated_select` (SELECT to authenticated using true)
- `event_settings_gm_all` (ALL to authenticated using/with check is_game_master())
A fresh bootstrap from schema.sql + rls.sql now has working policies on both tables.
Script verified idempotent (second run = NO-OP).

---

## Skipped Issues

### WR-03: get_event_setting_int ELSE branch for unrecognized keys

**File:** `supabase/migrations/20260611240200_phase16_triggers_parameterized.sql:21-43`
**Reason:** Accepted per fix_directives — `Skip WR-03 and IN-02 (accepted, document in REVIEW-FIX notes)`. The SQL migration file is read-only for agent tools (`database/**` deny); a future contributor extending the parameterization should add an `ELSE RAISE WARNING` branch at that point.
**Original issue:** CASE expression silently returns p_default for unrecognized keys — latent typo risk for future callers.

### IN-02: pitchWeight=0 accepted by schema

**File:** `lib/schemas.ts:151`, `components/admin-event-settings-editor.tsx:213-215`
**Reason:** Accepted per fix_directives. This is a UX-quality issue (the math is correct at 0); adding a schema floor or UI warning was deferred.
**Original issue:** `pitchWeight: z.coerce.number().min(0).max(1)` allows 0 with no GM warning.

---

_Fixed: 2026-06-12T01:10:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
