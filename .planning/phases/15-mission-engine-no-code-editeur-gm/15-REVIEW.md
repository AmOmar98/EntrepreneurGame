---
phase: 15-mission-engine-no-code-editeur-gm
reviewed: 2026-06-11T00:00:00Z
depth: deep
files_reviewed: 19
files_reviewed_list:
  - supabase/migrations/20260611230000_phase15_engine_columns.sql
  - lib/types.ts
  - lib/schemas.ts
  - lib/clone-remap.ts
  - lib/get-simulated-now.ts
  - lib/admin-events.ts
  - lib/admin-missions.ts
  - lib/admin-levels.ts
  - lib/seed/deliverableTemplates.ts
  - app/actions.ts
  - app/admin/events/page.tsx
  - app/admin/events/[id]/missions/page.tsx
  - app/admin/levels/page.tsx
  - app/journey/deliverable/[id]/page.tsx
  - components/admin-deliverable-template-editor.tsx
  - components/admin-events-table.tsx
  - components/admin-levels-editor.tsx
  - components/admin-missions-editor.tsx
  - lib/journey.ts
findings:
  critical: 3
  warning: 5
  info: 2
  total: 10
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-06-11
**Depth:** deep
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Phase 15 delivers the mission-engine no-code editor for GameMasters: five new behaviour columns on `deliverable_templates`, event create/activate/clone actions, mission CRUD, a deliverable template editor with rubric builder, a levels editor, and date simulation via `getSimulatedNow`. The cardinal R1 and R3 checks pass: no score/rank in Player surfaces outside the deliverable detail, and no new `disabled` DOM added to Player-facing flows. The `HARD_BLOCK_DEPENDENCIES` literal is intact.

Three blockers were found. The most dangerous is a missing WHERE clause in `activateEventFlow` when `organization_id` is NULL — it issues an unbounded `UPDATE events SET is_active = false` that silently deactivates every event in the database. The second is that the generalized `fn_auto_eval_fiches_entretien` trigger now fires for any template with `auto_validate = true`, but it inserts a hardcoded 10-fiche rubric score regardless of the actual template rubric, producing incorrect evaluations for any future `auto_validate` template with a different structure. The third is a `cloneEventFlow` partial-failure gap: if Pass 2 (soft_recommends_before remap) fails after Pass 1 has already inserted templates, the cloned event is left with orphaned templates and no rollback path.

Five warnings round out the report, including a silent data-loss bug in the template edit form (description, rubric, templateUrl, softRecommendsBefore, and autoValidate all reset to defaults on save because `AdminTemplateRow` does not carry those fields to the editor), plus a `slugifyToKey` mismatch between server and client that causes key divergence for labels containing accented characters.

---

## Critical Issues

### CR-01: `activateEventFlow` — unbounded UPDATE when `organization_id IS NULL`

**File:** `app/actions.ts:2665-2669`

**Issue:** When the event being activated has no `organization_id` (null), `deactivateQuery` is built as `supabase.from("events").update({ is_active: false })` with no WHERE clause at all. PostgREST interprets an UPDATE with no filter as a full-table update. The comment calls this "scope to all events as a safe fallback," but silently deactivating every event in the database across all organizations is not safe — it is data-destructive. Any PROD activation of an event that was created before the `organization_id` migration was applied will silently deactivate all other events.

```typescript
// CURRENT (dangerous):
let deactivateQuery = supabase.from("events").update({ is_active: false });
if (orgId) {
  deactivateQuery = deactivateQuery.eq("organization_id", orgId) as typeof deactivateQuery;
}
// When orgId is null → no WHERE clause → UPDATE events SET is_active=false (all rows)

// FIX: always scope at least to existing is_active=true rows,
// or explicitly limit to NULL org events only:
let deactivateQuery = supabase.from("events").update({ is_active: false });
if (orgId) {
  deactivateQuery = (deactivateQuery as ReturnType<typeof supabase.from>)
    .eq("organization_id", orgId);
} else {
  // Scope to null-org events only — do not touch other orgs
  deactivateQuery = (deactivateQuery as ReturnType<typeof supabase.from>)
    .is("organization_id", null);
}
```

---

### CR-02: `fn_auto_eval_fiches_entretien` trigger inserts hardcoded fiche rubric for any `auto_validate=true` template

**File:** `supabase/migrations/20260611230000_phase15_engine_columns.sql:155-172`

**Issue:** The function was generalized to fire for any template where `auto_validate = true` (not just `fiches-entretien-v1`). However the INSERT always uses the same hardcoded 10-fiche rubric (`fiche_1`..`fiche_10`, 25 each). If a GM enables `auto_validate = true` on any future template with a different rubric structure (e.g. a template with `clarity / feasibility` keys), the auto-inserted evaluation will have scores keyed on nonexistent rubric keys, and `total_score = COALESCE(v_max_score, 250)` will be an arbitrary fixed value detached from the actual rubric. The scores object is entirely wrong for any non-fiches template, silently producing bad evaluation data.

```sql
-- FIX option A: restrict auto_validate to multi_url composer_kind only (matches current app logic)
-- Add to the trigger body after the v_auto check:
IF NOT (SELECT composer_kind = 'multi_url' FROM public.deliverable_templates WHERE id = NEW.deliverable_template_id) THEN
  RETURN NEW;
END IF;

-- FIX option B (safer long-term): read the rubric from the template and build scores dynamically,
-- or document that auto_validate=true is only valid for multi_url/fiches kind and add a
-- DB CHECK constraint: CHECK (NOT auto_validate OR composer_kind = 'multi_url')
```

---

### CR-03: `cloneEventFlow` has no rollback on Pass 2 failure — leaves partial state

**File:** `app/actions.ts:2885-2901`

**Issue:** Pass 1 inserts all cloned templates with `soft_recommends_before = null`. Pass 2 updates the FK. If any Pass 2 UPDATE fails (line 2894-2900), the function returns `{ ok: false, message: remapErr.message }` — but the cloned event, missions, and all Pass 1 templates already exist in the database. The caller receives an error and the UI shows failure, yet a partially-configured clone is left in the DB. There is no DELETE/cleanup path.

PostgREST server actions cannot run DDL transactions, but the partial state creates orphaned records that the GM has no way to clean up from the UI (there is no delete-event action). Over repeated failed clone attempts the database accumulates ghost events.

```typescript
// FIX: Collect all new template IDs created in Pass 1 and, on any Pass 2 error,
// attempt cleanup before returning the error:

// After Pass 1 loop, store: const newTemplateIds = [...templateIdMap.values()];

// In Pass 2 on error:
if (remapErr) {
  // Cleanup: delete all cloned templates, then missions, then the event
  await supabase.from("deliverable_templates").delete().in("id", [...templateIdMap.values()]);
  await supabase.from("missions").delete().in("id", [...missionIdMap.values()]);
  await supabase.from("events").delete().eq("id", newEventId);
  return { ok: false, message: `Clone echoue (nettoyage effectue): ${remapErr.message}` };
}
```

---

## Warnings

### WR-01: Template edit form silently resets description, rubric, templateUrl, softRecommendsBefore, autoValidate to defaults

**File:** `components/admin-missions-editor.tsx:356-367` / `lib/admin-missions.ts:12-21`

**Issue:** `AdminTemplateRow` (the type used by the missions editor) only carries `{ id, slug, title, ord, isActive, isBonus, composerKind }`. When a GM opens the inline edit panel for an existing template, `AdminDeliverableTemplateEditor` is called without `initialDescription`, `initialTemplateUrl`, `initialAutoValidate`, `initialSoftRecommendsBefore`, or `initialRubric`. The editor defaults all of these (`description=""`, `templateUrl=null`, `autoValidate=false`, `softRecommendsBefore=null`, `rubric=[{label:"",max:25}]`). A GM who opens the editor and saves immediately will overwrite the existing description, rubric, and OneDrive URL with empty/default values, without any visible warning.

```typescript
// FIX: Either extend AdminTemplateRow to carry all editable fields
// (requires adding them to the getEventMissions SELECT query in lib/admin-missions.ts),
// OR fetch the full template data client-side when the edit panel is opened.

// In lib/admin-missions.ts getEventMissions(), extend the select:
.select("id, slug, title, ord, is_active, is_bonus, composer_kind, mission_id,
         description, rubric, max_score, template_url, auto_validate,
         soft_recommends_before, validation_rules")

// And extend AdminTemplateRow + TemplateSummaryRow props accordingly.
```

---

### WR-02: `slugifyToKey` divergence — client omits NFD normalization, producing different rubric keys for accented labels

**File:** `components/admin-deliverable-template-editor.tsx:21-27` vs `app/actions.ts:3119-3127`

**Issue:** The server-side `slugifyToKey` in `app/actions.ts` calls `.normalize("NFD")` followed by a diacritic-strip regex before lowercasing. The client-side copy in `admin-deliverable-template-editor.tsx` omits both the `.normalize("NFD")` call and the strip regex. For a criterion label like "Clarté" (with accent), the client generates `"clarté"` (raw Unicode), while the server generates `"clarte"` (stripped). The `rubricJson` hidden input is generated by the client-side `slugifyToKey`, so the key ultimately sent to the server is the accented form — but then the server calls its own `slugifyToKey` on any key that happens to be empty (line 3215: `c.key && c.key.trim() ? c.key.trim() : slugifyToKey(c.label)`). Because the client passes a non-empty key, the server uses it as-is, so the stored rubric key will contain raw Unicode. Mentor evaluation forms that read `scores[key]` will fail to find the key if they use a normalized form.

```typescript
// FIX: Align the client-side slugifyToKey to match the server:
function slugifyToKey(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // diacritic strip
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 64) || "criterion";
}
```

Note: The server-side regex `/[̀-ͯ]/g` uses raw Unicode combining characters in source (U+0300–U+036F range); the above is the cleaner equivalent.

---

### WR-03: `activateEventFlow` race window — two-step UPDATE has no DB-level atomicity

**File:** `app/actions.ts:2663-2685`

**Issue:** The "deactivate all, then activate target" sequence is two separate UPDATE statements with no transaction. In a concurrent scenario (two GM tabs clicking Activate at the same time), both could pass the deactivate step simultaneously and then both activate their respective targets, leaving two active events. At pilot scale (1 GM) this is low probability, but the window is real.

**Fix:** Add a partial unique index in the migration: `CREATE UNIQUE INDEX IF NOT EXISTS events_single_active_per_org ON events(organization_id) WHERE is_active = true;` — this provides a DB-level single-active guarantee and makes the race a constraint error rather than silent corruption.

---

### WR-04: `getSimulatedNow` — cookie-setter UI is absent; the feature is dead code at the UI layer

**File:** `lib/get-simulated-now.ts` / `app/admin/levels/page.tsx:57-64`

**Issue:** `getSimulateDateDisplay()` and `getSimulatedNow()` read a `gsd_simulate_date` cookie. There is no UI, form, or server action anywhere in the codebase that sets this cookie. The `/admin/levels` page renders a "simulation active" amber pill that can never be triggered by any user action. `lib/admin.ts:226` calls `getSimulatedNow()` for the elapsed-missions calculation, which will always return `Date.now()` in production. ENGINE-07 is wired but has no control surface — it is effectively a stub.

**Fix:** Either implement the cookie-setter action + UI on the admin page (a `<form>` with a date input that sets a cookie via a server action), or remove the `getSimulateDateDisplay()` call and amber pill from `/admin/levels/page.tsx` to avoid confusing the GM with a permanently-absent indicator.

---

### WR-05: `cloneEventFlow` — template slug collision: `${tpl.slug}-clone-${Date.now()}` called in a loop produces identical timestamps

**File:** `app/actions.ts:2863`

**Issue:** Each template in the clone loop calls `` `${tpl.slug}-clone-${Date.now()}` ``. If the loop iterates fast enough (two templates in the same millisecond — easily possible with 13 Digi-Hackathon templates), `Date.now()` will return the same value for multiple iterations. Two templates with the same base slug (e.g. from different missions) will generate identical clone slugs, causing a unique constraint violation. The cloned event partial-failure (CR-03) makes this worse.

```typescript
// FIX: Generate the timestamp once before the loop and use an index:
const cloneTs = Date.now();
for (let tplIdx = 0; tplIdx < srcTemplates.length; tplIdx++) {
  const tpl = srcTemplates[tplIdx];
  const slug = `${tpl.slug}-clone-${cloneTs}-${tplIdx}`;
  // ...
}
```

---

## Info

### IN-01: Mid-file `import` statement in `app/actions.ts` at line 2914

**File:** `app/actions.ts:2914-2918`

**Issue:** The `import { composerKindSchema, validationRuleSchema, rubricSchema }` from `@/lib/schemas` is placed at line 2914, in the middle of the file, after hundreds of export functions. JavaScript/TypeScript hoists imports at parse time so this is not a runtime error, but it violates ESLint's `import/first` rule and diverges from the import block at the top of the file (lines 1-31). This will cause confusion when reading and maintaining the file.

**Fix:** Move the import to the top-level import block at lines 6-31.

---

### IN-02: `fn_auto_eval_fiches_entretien` trigger binding is absent from Phase 15 migration; relies on an untracked planning SQL file

**File:** `supabase/migrations/20260611230000_phase15_engine_columns.sql`

**Issue:** The migration replaces the function body via `CREATE OR REPLACE FUNCTION`, but does not include a `DROP TRIGGER IF EXISTS / CREATE TRIGGER` statement. The trigger binding (`trg_auto_eval_fiches_entretien`) lives only in `.planning/quick/260519-smoke-prod-j1/fix_h1_auto_eval_trigger.sql`, a file outside the `supabase/migrations/` tracked sequence. On a fresh Supabase project (e.g. a staging environment spun up from migrations only), the trigger binding will not exist, making `auto_validate` silently inoperative without any error. The generalized function body will also never fire.

**Fix:** Add to the Phase 15 migration (inside the `BEGIN/COMMIT` block):
```sql
DROP TRIGGER IF EXISTS trg_auto_eval_fiches_entretien ON public.submissions;
CREATE TRIGGER trg_auto_eval_fiches_entretien
  AFTER INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_eval_fiches_entretien();
```

---

## Cardinal Rule Audit Results

**R1 (score visible Player only on deliverable detail):** PASS
- `grep` audit confirms no `score|rank|note|/100|/140|points|toFixed` terms in `app/journey` or `components/results-*` outside `app/journey/deliverable/` and `components/deliverable-score-block`.
- No `rank|classement|percentile|leaderboard` in `app/journey/deliverable/`.

**R3 (no disabled DOM on Player surfaces):** PASS
- All `disabled` attributes in Phase 15 components are on GM-only admin components (`admin-*-editor.tsx`, `admin-events-table.tsx`), not on Player-facing journey pages.
- `FichesEntretienComposer.locked` (the only R3 exception) is unchanged.
- `HARD_BLOCK_DEPENDENCIES` literal `{"fiches-entretien-v1": "prep-questions-v1"}` is intact at `app/actions.ts:195-197`.
- The `soft_recommends_before` UI in `AdminDeliverableTemplateEditor` explicitly uses an amber hint with no `disabled` element — R3 compliant.

**R2 (validators warn-only):** PASS
- `validationRuleSchema` uses `z.literal("warn")` — `severity: "error"` is impossible at parse time.
- DB CHECK `validation_rules_severity_warn_only` mirrors this.
- `AdminDeliverableTemplateEditor` hardcodes `validationRulesJson = "[]"` and exposes no severity input — a GM cannot accidentally set `severity: "error"` through the UI.

---

_Reviewed: 2026-06-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
