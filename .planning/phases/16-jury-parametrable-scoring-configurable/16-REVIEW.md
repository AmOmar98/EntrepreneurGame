---
phase: 16-jury-parametrable-scoring-configurable
reviewed: 2026-06-12T00:00:00Z
depth: deep
files_reviewed: 22
files_reviewed_list:
  - app/actions.ts
  - app/jury/jury-form.tsx
  - app/jury/page.tsx
  - app/results/page.tsx
  - components/admin-event-settings-editor.tsx
  - components/admin-events-table.tsx
  - components/admin-jury-grid-editor.tsx
  - database/rls.sql
  - database/schema.sql
  - database/triggers.sql
  - lib/event-settings.ts
  - lib/journey.ts
  - lib/jury.ts
  - lib/pitch-criteria.ts
  - lib/results.ts
  - lib/schemas.ts
  - lib/score.ts
  - supabase/migrations/20260611230000_phase15_engine_columns.sql
  - supabase/migrations/20260611240000_phase16_pitch_criteria.sql
  - supabase/migrations/20260611240100_phase16_event_settings.sql
  - supabase/migrations/20260611240200_phase16_triggers_parameterized.sql
  - tests/unit/results-dynamic.test.ts
  - tests/unit/event-settings.test.ts
findings:
  critical: 3
  warning: 4
  info: 2
  total: 9
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-06-12
**Depth:** deep
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Phase 16 introduces per-event jury criteria (`pitch_criteria` table), configurable scoring settings (`event_settings` table), a parameterized `recalc_player_engagement` SQL function, a dual-path `normalizePitchScore` (dynamic jsonb + legacy c1..c5), and GM editor surfaces for both. The legacy archive preservation intent (`c5=0 → *1.25`) is correctly implemented and test-verified. R1 is preserved — no scores or ranks leak to Player-facing pages. The main defects are: a `score20` display formula that gives a wrong "per-criterion average" when criteria have unequal `max` values; the ceremony page bypassing the Phase-16 `pitchWeight` wiring; `bonusMultiplierCap` fetched from `event_settings` but never threaded to the one call-site that controls the cap; and missing RLS `DELETE` grant on `event_settings` that blocks the otherwise-correct policy from authorizing GM deletes.

---

## Critical Issues

### CR-01: `ceremony/page.tsx` calls `computeRanking()` without `pitchWeight` — silently reverts to hard-coded 0.8 after GM configures a different weight

**File:** `app/results/ceremony/page.tsx:24`
**Issue:** `computeRanking()` is called with zero arguments. `pitchWeight` therefore defaults to `DEFAULT_PITCH_WEIGHT` (0.8 from the constant, NOT from `event_settings`). The main `/results` page correctly fetches `eventSettings.pitchWeight` and passes it to `computeRanking`, but the ceremony podium page does not. If a GM configures `pitchWeight = 0.6`, the ceremony screen will show a different ranking than the `/results` page — the podium order could differ, which is a data-integrity / credibility issue in front of partners.

**Fix:**
```tsx
// app/results/ceremony/page.tsx — before computeRanking()
import { getEventSettings } from "@/lib/event-settings";
import { getCurrentPitchModeState } from "@/lib/pitch-mode";

const pitchMode = await getCurrentPitchModeState();
const eventSettings = await getEventSettings(pitchMode.eventId);
const ranking = await computeRanking({ pitchWeight: eventSettings.pitchWeight });
```

---

### CR-02: `bonusMultiplierCap` is stored in `event_settings` and read by `getEventSettings()` but never passed to `applyBonusMultiplier()` — the configurable cap has zero effect

**File:** `lib/event-settings.ts:37,52`, `lib/score.ts:200-206`, all callers of `applyBonusMultiplier`
**Issue:** `EventSettings.bonusMultiplierCap` is fully wired through the DB layer (`event_settings.bonus_multiplier_cap`, `getEventSettings`, `DEFAULT_EVENT_SETTINGS`). `applyBonusMultiplier` accepts `opts.bonusMultiplierCap` to override the default `BONUS_MULTIPLIER_CAP` constant. However, a global search of all production code (`lib/`, `app/`, `components/`) shows **zero call-sites** pass `bonusMultiplierCap` from event settings into `applyBonusMultiplier`. The function always falls back to the hardcoded `BONUS_MULTIPLIER_CAP = 3.0`, making the configurable field a dead setting. A GM who lowers the cap to 2.0 via the editor will have no actual effect.

**Fix:** Wherever mentor UI invokes `applyBonusMultiplier`, fetch `eventSettings` and thread the cap:
```typescript
const { boostedScore, applied } = applyBonusMultiplier({
  rawScore,
  bonusEvents,
  submission,
  eventEndsAt,
  opts: { bonusMultiplierCap: eventSettings.bonusMultiplierCap },
});
```
At minimum, document this as explicitly deferred if it is intentional.

---

### CR-03: `saveEventSettingsSchema` omits `bonusMultiplierCap` — the GM settings editor silently discards cap changes and the `saveEventSettingsFlow` upsert never writes that column

**File:** `lib/schemas.ts:143-152`, `app/actions.ts:3672-3680`, `components/admin-event-settings-editor.tsx`
**Issue:** `saveEventSettingsSchema` has 7 fields: the 6 XP/engagement values plus `pitchWeight`. `bonus_multiplier_cap` is NOT in the schema and NOT in the `settingsPayload` object built in `saveEventSettingsFlow` (lines 3672-3680). The `AdminEventSettingsEditor` component also has no input field for it. This means:
1. The column always stays at its DB default (3.0 or whatever was set at backfill time).
2. The GM has no way to configure it through the UI even though the type and DB column exist.
3. If a row was manually inserted with a custom cap, the next `saveEventSettingsFlow` upsert will NOT overwrite it (the column is simply absent from the upsert payload), which is silent inconsistency.

This is distinct from CR-02: CR-02 is about the TS call-site not reading the setting; CR-03 is about the GM editor not being able to set it at all.

**Fix:** Add `bonusMultiplierCap` to the schema and payload:
```typescript
// lib/schemas.ts
export const saveEventSettingsSchema = z.object({
  // ... existing fields ...
  bonusMultiplierCap: z.coerce.number().min(1).max(10),
});

// app/actions.ts settingsPayload
bonus_multiplier_cap: parsed.data.bonusMultiplierCap,
```
And add a corresponding `<input>` in `AdminEventSettingsEditor`.

---

## Warnings

### WR-01: `score20` display formula in `jury-form.tsx` is semantically wrong when criteria have non-uniform `max` values

**File:** `app/jury/jury-form.tsx:111,316`
**Issue:** The "equivalent per-criterion" display is computed as:
```typescript
const score20 = (totalRaw / activeCriteria.length).toFixed(1);
// displayed as: "{score20} / {activeCriteria[0].max}"
```
This divides the raw sum by the count of criteria and labels the result "/ {first criterion's max}". When all criteria have equal `max` (the current demo/legacy case: 4×20), this coincidentally works. But `pitch_criteria` now allows heterogeneous `max` values (e.g., 3 criteria with max 30, 20, 50). With those values:
- `totalRaw` could be up to 100; dividing by 3 gives ~33; labeling it "/30" is wrong.
- The denominator shown (`activeCriteria[0].max`) is only the max of the first criterion.

The display is cosmetic (it does not affect the stored score — `score100` is correct), but jurors will see a misleading label. This will be immediately noticeable if the GM configures a non-uniform grid.

**Fix:**
```typescript
// Only show the per-criterion display when all criteria share the same max.
const uniformMax = activeCriteria.every(c => c.max === activeCriteria[0]?.max)
  ? activeCriteria[0]?.max
  : null;
// Then conditionally render: uniformMax != null ? `${score20} / ${uniformMax}` : null
```

---

### WR-02: `saveJuryGridFlow` performs a non-atomic delete-then-insert without a transaction — concurrent jury scoring between the two statements sees no criteria

**File:** `app/actions.ts:3601-3618`
**Issue:** The flow deletes all `pitch_criteria` for an event and then re-inserts the new set. If a juror submits a pitch score between the DELETE and the INSERT, `getPitchCriteria` returns `DEMO_PITCH_CRITERIA` (the fallback, since the query returns empty). The juror's form was pre-loaded with the correct dynamic criteria, but the fallback used in `normalizePitchScore` will be the 4×20 DEMO criteria instead — producing a wrong normalized score for that one submission until the next read. The Supabase JS client does not support explicit transactions from server actions. The risk window is small (milliseconds) but the timing is deterministic: it happens on every criteria update during an active jury session.

**Fix:** Minimize the window by doing the insert first, then deleting the old keys that are not in the new set (a merge approach rather than delete-all-then-insert). Alternatively, generate new UUIDs and use UPSERT with ON CONFLICT (event_id, key) DO UPDATE, then delete rows whose key is no longer present. This avoids any gap in coverage.

---

### WR-03: `get_event_setting_int` SQL helper does not handle unrecognized `p_key` values — returns `p_default` silently, masking typos in callers

**File:** `supabase/migrations/20260611240200_phase16_triggers_parameterized.sql:21-43`
**Issue:** The CASE expression in `get_event_setting_int` only branches on the 6 known keys. Any caller passing an unrecognized key string (e.g., a future key added to the enum-like caller interface without updating the CASE) will receive `p_default` silently. There is no warning or error. This is a latent correctness risk for future contributors extending the parameterization.

**Fix:** Add an ELSE branch that raises a WARNING (not an exception, to preserve the STABLE function semantics):
```sql
ELSE (
  SELECT NULL  -- Or: RAISE WARNING 'Unknown key: %', p_key; NULL
)
```
Alternatively, document the closed key set with a comment enumerating valid values.

---

### WR-04: `normalizePitchScore` NaN-skip condition in the aggregation loop (line 330) is inconsistent — a NaN `total_score` row with a non-empty `scores` jsonb is counted as a valid juror vote with normalized score 0

**File:** `lib/results.ts:328-332`
**Issue:** The skip guard is:
```typescript
if (Number.isNaN(totalRaw) && (!r.scores || Object.keys(r.scores).length === 0)) continue;
```
This skips the row only when BOTH `total_score` is NaN AND `scores` is absent/empty. If a row has `total_score = NaN` (malformed DB write) but also has a valid `scores` jsonb, the row is NOT skipped — `normalized` will be computed from `scores` (which may be a valid nonzero number), and the row is counted as a juror vote. The `total_score` being NaN is an indicator of DB corruption; such rows should be skipped unconditionally regardless of the `scores` field. The current logic was designed for the legacy path only, but does not hold for the dynamic path.

**Fix:**
```typescript
// Skip rows where both paths are invalid
const totalRaw = typeof r.total_score === "string" ? Number(r.total_score) : r.total_score;
const hasValidScores = r.scores && Object.keys(r.scores).length > 0;
if (Number.isNaN(totalRaw) && !hasValidScores) continue;
// Dynamic path proceeds normally; legacy NaN-only rows are skipped
```
The existing code already does the right thing for the common case (NaN + no scores = skip). The asymmetry only matters for a NaN `total_score` row that also carries a `scores` jsonb — which is theoretically possible via a direct DB insert that bypasses the GENERATED column logic.

---

## Info

### IN-01: `pitch_criteria` and `event_settings` RLS policies are defined in migration files but not in `database/rls.sql` — the declarative source-of-truth file is incomplete

**File:** `database/rls.sql`, `database/schema.sql:333-356`
**Issue:** `database/rls.sql` is documented as the canonical RLS source applied to a fresh instance. The RLS policies for `pitch_criteria` (SELECT + GM ALL) and `event_settings` (SELECT + GM ALL) were defined in the migration files (`20260611240000`, `20260611240100`) but the declarative `database/rls.sql` only contains GRANT and `ENABLE ROW LEVEL SECURITY` statements for these tables (in `database/schema.sql`). The actual `CREATE POLICY` statements are absent from `database/rls.sql`. A fresh bootstrap from `schema.sql → triggers.sql → rls.sql` will have RLS enabled on both tables but with no policies defined — meaning all authenticated operations will be denied (fail-closed, which is safe but broken). `database/schema.sql` also lacks the `CREATE POLICY` statements.

**Fix:** Append the canonical policy definitions to `database/rls.sql`:
```sql
-- pitch_criteria
create policy pitch_criteria_authenticated_select on public.pitch_criteria
  for select to authenticated using (true);
create policy pitch_criteria_gm_all on public.pitch_criteria
  for all to authenticated
  using (public.is_game_master()) with check (public.is_game_master());

-- event_settings
create policy event_settings_authenticated_select on public.event_settings
  for select to authenticated using (true);
create policy event_settings_gm_all on public.event_settings
  for all to authenticated
  using (public.is_game_master()) with check (public.is_game_master());
```

---

### IN-02: `saveEventSettingsSchema` accepts `pitchWeight = 0` — combined score degenerates to `0 * pitchAvg + 1.0 * scoreProject` with no visible warning to the GM

**File:** `lib/schemas.ts:151`, `components/admin-event-settings-editor.tsx:213-215`
**Issue:** `pitchWeight: z.coerce.number().min(0).max(1)` allows 0. A weight of 0 means pitch scores have zero contribution to the combined ranking — a configuration that would likely be unintentional. The UI `<input min={0}>` permits it. There is no confirmation dialog or warning. This is a UX-quality issue rather than a hard bug (the math is correct at 0), but given the business context (partner-visible ranking), a misconfigured 0 could cause reputational damage.

**Fix:** Either tighten the schema floor to `min(0.01)` or add a client-side validation warning in `AdminEventSettingsEditor` when the user enters 0.

---

_Reviewed: 2026-06-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
