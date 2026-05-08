---
phase: 01-foundation-schema-types-suppression-code-obsol-te
plan: 01
subsystem: database
tags: [schema, rls, triggers, supabase, foundation]
status: complete
commit: f53de0d
---

# Phase 1 Plan 01: Fresh schema + triggers + RLS Summary

Replaced the entire `database/` SQL set with a brief-aligned, fresh-start schema.

## What changed

- `database/schema.sql`: 11 tables (events, levels, missions, deliverable_templates, cohorts, profiles, players, player_members, submissions, evaluations, pitch_scores) + 8 PG enums (app_role, player_status, team_role, level_id, mission_kind, submission_kind, submission_status, verdict). Hot-FK indexes, FKs with cascade vs restrict per ownership, table comments.
- `database/triggers.sql`: generic `set_updated_at()` attached to all 8 row tables with `updated_at`; `recalc_player_score(p_player_id)` aggregates the highest-version validated submission's max evaluation per template; `on_evaluation_change()` trigger wraps it (covers insert/update/delete); `guard_player_onboarding()` enforces write-once `onboarded_at`.
- `database/rls.sql`: helper functions `current_app_role`, `is_game_master`, `is_mentor`, `is_my_player`; RLS enabled on every table; pilot-grade policies (player sees own rows, mentor reads all, GameMaster full r/w); reference tables readable by `authenticated`.
- `database/seed_bootcamp.sql`: emptied (header comment only) — atlas-soil and bootcamp_deliverables seed purged per BRAND-05.
- `database/README.md`: new — documents fresh apply order and GameMaster bootstrap insert.

## Verification

- `npm run typecheck`: pass (no TS impact).
- `npm run lint`: pass.
- DB application is manual on fresh Supabase project (operator runs `drop schema public cascade` then schema -> triggers -> rls). Documented in README.

## Deviations from plan

None — plan executed as written.

## Self-Check

- `database/schema.sql`, `database/triggers.sql`, `database/rls.sql`, `database/seed_bootcamp.sql`, `database/README.md` all exist.
- Commit `f53de0d` exists in git log.
- Zero references in `database/` to deleted concepts (Stage/Checkpoint/MaturityPhase/BonusEvent/prestige_xp/committees/xp_ledger).

## Self-Check: PASSED
