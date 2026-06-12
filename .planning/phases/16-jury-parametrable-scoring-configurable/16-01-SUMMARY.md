---
phase: 16
plan: "01"
subsystem: jury-scoring-foundation
tags: [migration, accessor, event-settings, pitch-criteria, tdd]
dependency_graph:
  requires: [15-05]
  provides: [pitch_criteria-table, event_settings-table, get_event_setting_int, event-settings-accessor, pitch-criteria-accessor]
  affects: [lib/results.ts, lib/score.ts, app/jury/jury-form.tsx]
tech_stack:
  added: [lib/event-settings.ts, lib/pitch-criteria.ts]
  patterns: [dual-mode-accessor, SECURITY-DEFINER-sql, parameterized-trigger, TDD-red-green]
key_files:
  created:
    - supabase/migrations/20260611240000_phase16_pitch_criteria.sql
    - supabase/migrations/20260611240100_phase16_event_settings.sql
    - supabase/migrations/20260611240200_phase16_triggers_parameterized.sql
    - lib/pitch-criteria.ts
    - lib/event-settings.ts
    - tests/unit/event-settings.test.ts
  modified: []
decisions:
  - "DEMO_PITCH_CRITERIA and DEFAULT_EVENT_SETTINGS kept local to each lib/ file — seed barrel exports functions (gated), not raw constants; no duplication"
  - "bonus_multiplier_cap included in event_settings (DEFAULT 3.0 = BONUS_MULTIPLIER_CAP) per plan spec SETTINGS-01"
  - "get_event_setting_int uses LANGUAGE sql STABLE (not plpgsql) — pure read, single expression, no side effects"
  - "recalc_player_engagement fallback defaults (100/25/50) appear only in get_event_setting_int calls, not in computation logic — SETTINGS-03 satisfied"
metrics:
  duration: "~20min"
  completed: "2026-06-11"
  tasks_completed: 3
  files_created: 6
  files_modified: 0
  unit_tests_added: 14
  unit_tests_total: 58
  e2e_tests_total: 23
---

# Phase 16 Plan 01: DB Foundation + TS Accessors Summary

Additive idempotent DB migrations + dual-mode TS accessors for configurable jury criteria and per-event scoring settings, with zero behavior change at defaults.

## One-liner

Three file-first migrations (pitch_criteria table, event_settings table, parameterized recalc_player_engagement via get_event_setting_int) + two dual-mode TS accessors (lib/event-settings.ts, lib/pitch-criteria.ts) satisfying JURY-06, SETTINGS-01/02/03.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | pitch_criteria migration + pitch_scores.scores jsonb | be0c61d | supabase/migrations/20260611240000_phase16_pitch_criteria.sql |
| 2 | event_settings migration + parameterized recalc | 72dc861 | supabase/migrations/20260611240100_phase16_event_settings.sql, supabase/migrations/20260611240200_phase16_triggers_parameterized.sql |
| 3 (RED) | Failing tests for accessors | 0a9e806 | tests/unit/event-settings.test.ts |
| 3 (GREEN) | lib/event-settings.ts + lib/pitch-criteria.ts | 4cb6a01 | lib/event-settings.ts, lib/pitch-criteria.ts |

## Requirements Satisfied

- **JURY-06**: `pitch_criteria(event_id, key, label, max, ord)` table with `UNIQUE(event_id, key)` — dynamic criteria per event. `pitch_scores.scores jsonb` nullable for dynamic scoring path.
- **SETTINGS-01**: `event_settings` table with XP rules (xp_first_submission/v1/v2), engagement thresholds (eng_submitted/reviewed/validated), and `bonus_multiplier_cap` (DEFAULT 3.0 = `BONUS_MULTIPLIER_CAP`).
- **SETTINGS-02**: `pitch_weight numeric(4,3)` in `event_settings` (DEFAULT 0.800 = `DEFAULT_PITCH_WEIGHT`).
- **SETTINGS-03**: `recalc_player_engagement` reads thresholds via `get_event_setting_int(v_event_id, 'eng_*', fallback)` — no free literals 100/25/50 in the engagement computation.

## Defaults (zero behavior change)

| Setting | Value | Source |
|---------|-------|--------|
| xpFirstSubmission | 100 | lib/journey.ts:348 |
| xpValidateV1 | 50 | lib/journey.ts:352 |
| xpValidateV2 | 100 | lib/journey.ts:353 |
| engSubmitted | 100 | lib/score.ts:72 SUBMITTED_POINTS |
| engReviewed | 25 | lib/score.ts:73 REVIEWED_POINTS |
| engValidated | 50 | lib/score.ts:74 VALIDATED_POINTS |
| pitchWeight | 0.8 | lib/results.ts:33 DEFAULT_PITCH_WEIGHT |
| bonusMultiplierCap | 3.0 | lib/types.ts:260 BONUS_MULTIPLIER_CAP |

## Architecture Notes

- **Migrations file-first**: 3 new migrations in `supabase/migrations/` — not applied to PROD. Apply at the end-of-phase operator checkpoint (plan 16-05) via `npx supabase db push --linked`.
- **Dual-mode accessors**: both `getEventSettings` and `getPitchCriteria` follow the `lib/active-event.ts` pattern: `!hasSupabaseEnv()` → demo fallback, `client null` → demo fallback, Supabase error → demo fallback. Pre-migration tolerance guaranteed.
- **get_event_setting_int**: `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public` — efficient, cacheable, no PL/pgSQL overhead. COALESCE with p_default handles missing event_settings rows gracefully (pre-migration window).
- **recalc_player_engagement**: event resolved via `player → cohort → event` (schema: `players.cohort_id → cohorts.event_id`). Behavior identical to phase-14 version at defaults.
- **lib/seed/index.ts**: unchanged — demo constants kept local to each lib/ file. Seed barrel exports gated functions, not raw constants.

## TDD Gate Compliance

- RED commit `0a9e806`: 14 failing tests (modules not yet created)
- GREEN commit `4cb6a01`: 14 tests pass + typecheck green + 58 total unit tests pass + 23 E2E pass

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all constants are wired to real source-of-truth values. `DEMO_PITCH_CRITERIA` and `DEFAULT_EVENT_SETTINGS` are intentional demo-mode fallbacks, not stubs; they will serve as live defaults when no DB row exists.

## Threat Surface Scan

No new network endpoints introduced. All new surfaces are:
- Two new DB tables gated by RLS (`is_game_master()` for writes, authenticated SELECT)
- Two new SQL functions with `SECURITY DEFINER + REVOKE FROM PUBLIC + GRANT authenticated` (T-16-02)
- Two TS server-only accessors with no exposed routes

No threat flags beyond the plan's STRIDE register (T-16-01, T-16-02, T-16-03 all mitigated as planned).

## Self-Check: PASSED

All 6 created files verified present. All 4 task commits verified in git log.
