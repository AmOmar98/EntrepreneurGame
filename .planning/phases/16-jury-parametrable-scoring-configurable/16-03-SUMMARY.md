---
phase: 16-jury-parametrable-scoring-configurable
plan: "03"
subsystem: jury-gm-editors
tags: [jury, scoring, gm-editor, settings, admin, crud, tdd]
dependency_graph:
  requires: [16-01, 16-02]
  provides: [saveJuryGridFlow, saveEventSettingsFlow, AdminJuryGridEditor, AdminEventSettingsEditor, admin-settings-route]
  affects: [lib/schemas.ts, app/actions.ts, lib/i18n.ts, components/admin-events-table.tsx]
tech_stack:
  added: []
  patterns: [GM-role-gate, demo-guard, JSON-hidden-input, delete-then-insert, upsert-onConflict, rubric-builder-rows, useActionState-form, dual-mode-accessor]
key_files:
  created:
    - lib/schemas.ts (juryGridCriterionSchema, saveJuryGridSchema, saveEventSettingsSchema added)
    - app/actions.ts (saveJuryGridFlow, saveEventSettingsFlow added)
    - components/admin-jury-grid-editor.tsx
    - components/admin-event-settings-editor.tsx
    - app/admin/events/[id]/settings/page.tsx
    - tests/unit/jury-settings-schemas.test.ts
  modified:
    - lib/i18n.ts (16 new fr+en keys)
    - components/admin-events-table.tsx (Reglages link added)
decisions:
  - "saveJuryGridSchema + saveEventSettingsSchema exported from lib/schemas.ts (not inlined in actions.ts) for unit-testability without Next.js runtime"
  - "AdminJuryGridEditor key auto-derives from label via slugifyToKey when key field is blank — consistent with rubric builder pattern"
  - "AdminEventSettingsEditor uses fieldsets for XP/engagement/pitch sections for semantic grouping + legend labels"
  - "Settings page imports DEMO_PITCH_CRITERIA and DEFAULT_EVENT_SETTINGS as named exports from their respective lib/ files (no seed barrel needed)"
metrics:
  duration: "~7min"
  completed: "2026-06-12"
  tasks_completed: 3
  files_created: 6
  files_modified: 2
  unit_tests_added: 23
  unit_tests_total: 87
  e2e_tests_total: 23
---

# Phase 16 Plan 03: GM Jury Grid + Event Settings Editors Summary

Two GM-only editors (jury grid and event settings) with full gate green, wired to delete-then-insert / upsert Flow actions and demo-safe.

## One-liner

saveJuryGridFlow (delete-then-insert pitch_criteria) + saveEventSettingsFlow (upsert event_settings) + two rubric-builder-pattern client editors + GM-gated /admin/events/[id]/settings route + "Reglages" link in events table.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | saveJuryGridFlow + saveEventSettingsFlow actions + schemas | ed24387 | app/actions.ts, lib/schemas.ts, tests/unit/jury-settings-schemas.test.ts |
| 2 | AdminJuryGridEditor + AdminEventSettingsEditor + i18n | f9c5c3b | components/admin-jury-grid-editor.tsx, components/admin-event-settings-editor.tsx, lib/i18n.ts |
| 3 | GM-gated settings page + events-table Reglages link | 48044cf | app/admin/events/[id]/settings/page.tsx, components/admin-events-table.tsx |

## Requirements Satisfied

- **JURY-09**: GM can define N (1-10) pitch criteria (key/label/max/ord) per event via AdminJuryGridEditor + saveJuryGridFlow. Delete-then-insert ensures clean replacement.
- **SETTINGS-04**: GM can edit XP rules (xpFirstSubmission/V1/V2), engagement thresholds (engSubmitted/Reviewed/Validated), and pitch weight (0-1) via AdminEventSettingsEditor + saveEventSettingsFlow. Upsert on event_id.

## Architecture Notes

- **GM role gate** (defense-in-depth): both Flow actions check auth.getUser() + profiles.app_role === 'game_master' server-side, alongside RLS GM-only policy. T-16-07 mitigated.
- **criteriaJson tampering** (T-16-08): try/catch JSON.parse + Zod array min(1)/max(10) + per-criterion bounds (key/label min(1), max int 1-100) before any DB write.
- **Route guard** (T-16-09): /admin/events/[id]/settings mirrors missions page guard exactly — getCurrentUser() + getCurrentRole() + redirect non-GM.
- **Demo read-only**: both editors show amber banner + disabled submit when demo=true; Flow actions return { ok: false } for demo writes.
- **revalidatePath**: /admin/events + /jury + /results after every successful write.
- **i18n**: 16 keys added (fr + en), plain ASCII, no inline French in components.
- **Pre-migration tolerance**: editors work in demo mode (DEMO_PITCH_CRITERIA + DEFAULT_EVENT_SETTINGS fallbacks).

## TDD Note

Task 1 includes 23 unit tests for the two schemas (boundary values, coercion, rejection cases). Tests written before/alongside implementation to verify schema bounds.

## Deviations from Plan

None — plan executed exactly as written. All Flow actions, schemas, components, route, and events-table link match spec.

## Known Stubs

None — all data flows through real accessors (getPitchCriteria / getEventSettings) with documented demo fallbacks. No hardcoded data leaks to UI.

## Threat Surface Scan

No new network endpoints introduced beyond /admin/events/[id]/settings (GM-only, gated). Both Flow actions add Supabase write surfaces:
- `pitch_criteria` (delete+insert) — T-16-07/T-16-08 mitigated
- `event_settings` (upsert) — T-16-07 mitigated

All within the plan's STRIDE register. No unregistered threat flags.

## Self-Check: PASSED
