---
phase: 15-mission-engine-no-code-editeur-gm
fixed_at: 2026-06-11T23:09:30Z
review_path: .planning/phases/15-mission-engine-no-code-editeur-gm/15-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 10
skipped: 0
status: all_fixed
---

# Phase 15: Code Review Fix Report

**Fixed at:** 2026-06-11T23:09:30Z
**Source review:** .planning/phases/15-mission-engine-no-code-editeur-gm/15-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 10
- Fixed: 10
- Skipped: 0

## Fixed Issues

### IN-01: Mid-file import moved to top

**Files modified:** `app/actions.ts`
**Commit:** `1b3b8da`
**Applied fix:** Added `composerKindSchema`, `validationRuleSchema`, `rubricSchema` to the top-level
import block from `@/lib/schemas` and removed the duplicate mid-file import statement at ~line 2914.

---

### CR-01: `activateEventFlow` — unbounded UPDATE when `organization_id IS NULL`

**Files modified:** `app/actions.ts`
**Commit:** `aee576b`
**Applied fix:** Added an `else` branch with `.is("organization_id", null)` so when `orgId` is null
the UPDATE is scoped to only null-org events. The previous code issued an unbounded
`UPDATE events SET is_active = false` with no WHERE clause when `orgId` was null.

---

### CR-02 + IN-02 + WR-03: Trigger guard + constraint + trigger binding + partial unique index

**Files modified:** `supabase/migrations/20260611230000_phase15_engine_columns.sql`
**Commit:** `96b9f1b`
**Applied fix (CR-02):** Added a `composer_kind` guard in `fn_auto_eval_fiches_entretien` — after
the `auto_validate` check, the trigger now returns NEW immediately if `composer_kind != 'multi_url'`.
Also added a DB-level CHECK constraint `auto_validate_multi_url_only` (`CHECK (NOT auto_validate OR
composer_kind = 'multi_url')`) for defense-in-depth.

**Applied fix (IN-02):** Added `DROP TRIGGER IF EXISTS trg_auto_eval_fiches_entretien` + `CREATE
TRIGGER trg_auto_eval_fiches_entretien AFTER INSERT OR UPDATE OF status ON public.submissions` inside
the migration so fresh bootstraps from migrations only are complete.

**Applied fix (WR-03):** Added `DROP INDEX IF EXISTS public.uniq_events_single_active` followed by
`CREATE UNIQUE INDEX IF NOT EXISTS uniq_events_single_active_per_org ON events(organization_id) WHERE
is_active = true`. This replaces the previously-applied global index with a per-org partial unique
index providing the correct single-active-per-org guarantee.

Note: This migration is not yet applied to PROD (deferred to operator checkpoint per the migration
header). The edits are in-place as directed.

---

### CR-03 + WR-05: `cloneEventFlow` cleanup on Pass 2 failure + unique slug fix

**Files modified:** `app/actions.ts`
**Commit:** `9580a66`
**Applied fix (CR-03):** On any Pass-2 `soft_recommends_before` remap failure, the code now
best-effort deletes all cloned `deliverable_templates`, then `missions`, then the `events` row (FK-safe
order) before returning `{ ok: false }`. This prevents orphaned ghost events accumulating on repeated
failed clone attempts.

**Applied fix (WR-05):** Captured `const cloneTs = Date.now()` once before the Pass-1 loop and
changed the slug to `${tpl.slug}-clone-${cloneTs}-${tplIdx}` (appending the per-item array index).
This eliminates unique constraint violations when multiple templates share the same base slug or the
loop completes within one millisecond.

---

### WR-01: Template edit form silently resets fields

**Files modified:** `lib/admin-missions.ts`, `components/admin-missions-editor.tsx`
**Commit:** `ac920e9`
**Applied fix:** Extended `AdminTemplateRow` with `description`, `templateUrl`, `autoValidate`,
`softRecommendsBefore`, `rubric`, and `maxScore`. Extended the Supabase SELECT in `getEventMissions`
to fetch all those columns. Updated the `TemplateSummaryRow` call to
`AdminDeliverableTemplateEditor` to pass all initial field values (mapped rubric to `{label, max}`
array as required by the editor's `RubricRow` type).

---

### WR-02: `slugifyToKey` divergence — NFD normalization missing on client

**Files modified:** `lib/schemas.ts`, `app/actions.ts`, `components/admin-deliverable-template-editor.tsx`
**Commit:** `94fef54`
**Applied fix:** Added canonical `slugifyToKey` (with `.normalize("NFD")` + diacritic strip) as a
named export in `lib/schemas.ts`. Removed the local definition from `app/actions.ts` and replaced it
with an import. Replaced the divergent client-side copy in
`admin-deliverable-template-editor.tsx` (which lacked NFD normalize) with an import from
`@/lib/schemas`. Both server and client now use identical logic, eliminating the "Clarté" → "clarté"
vs "clarte" key mismatch.

---

### WR-04: `getSimulatedNow` cookie-setter UI absent (dead code)

**Files modified:** `app/actions.ts`, `components/admin-levels-editor.tsx`, `app/admin/levels/page.tsx`
**Commit:** `f869404`
**Applied fix:** Added `setSimulatedDateFlow` server action to `app/actions.ts` — validates
`YYYY-MM-DD` format, GM-role-gated, sets/clears the `gsd_simulate_date` httpOnly cookie at path `/`.
Added `SimulateDatePanel` exported client component to `admin-levels-editor.tsx` — a minimal form
with a date input + Apply/Clear buttons wired to `setSimulatedDateFlow`. Rendered `SimulateDatePanel`
on `/admin/levels` (Supabase mode only, above the main editor). The ENGINE-07 amber pill now has a
working control surface.

---

## Gate Results

All gates passed on `milestone/v0.4-scale-foundation` after fast-forward:

- `npm run typecheck` — PASS (0 errors)
- `npm run lint` — PASS (0 warnings)
- `npm run build` — PASS (clean Next.js production build)
- `npm run test:unit` — PASS (44/44 tests)
- `npm run test:e2e` — PASS (23/23 tests)

Changes pushed to `origin/milestone/v0.4-scale-foundation` (6ed229c → f869404).

---

_Fixed: 2026-06-11T23:09:30Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
