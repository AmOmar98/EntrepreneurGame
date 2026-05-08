---
phase: 01-foundation-schema-types-suppression-code-obsol-te
plan: 03
subsystem: types-seed
tags: [refactor, types, seed, foundation]
status: complete
commit: 328b9e9
---

# Phase 1 Plan 03: Split lib/data.ts into 4 modules Summary

Replaced the monolithic 1285-line `lib/data.ts` with a clean 4-module structure aligned on the brief.

## What changed

### Created
- `lib/types.ts` — TS source of truth, mirrors `database/schema.sql` PG enums and tables. Exports `AppRole`, `PlayerStatus`, `TeamRole`, `LevelId`, `MissionKind`, `SubmissionKind`, `SubmissionStatus`, `Verdict`, `Event`, `Level`, `Mission`, `DeliverableTemplate`, `RubricCriterion`, `Cohort`, `Profile`, `Player`, `PlayerMember`, `SubmissionBase`, `Submission` (V1/V2 discriminated union — D-07), `Evaluation`, `PitchScore`.
- `lib/score.ts` — pure display helpers `scoreFromEvaluation`, `sumPlayerScoreProject`, `combineScores`. Authoritative recalc lives in `database/triggers.sql:recalc_player_score`.
- `lib/icons.ts` — `levelIcon` (LevelId -> LucideIcon) and `submissionStatusIcon` (SubmissionStatus -> LucideIcon).
- `lib/seed/{index,players,missions,deliverableTemplates}.ts` — dual-mode seed accessors: return `[]` when `hasSupabaseEnv()` is true (DATA-03 prep, BRAND-05 neutral demo names).

### Deleted
- `lib/data.ts` (1285 lines)
- `lib/workflow-data.ts`
- `lib/csv.ts` (unused after export route deletion in plan 02)

### Modified
- `lib/i18n.ts` — trimmed to `brand_name`, `tagline`, `cta_login`, `role_player`, `role_mentor`, `role_game_master`. Removed obsolete keys (startup, coach, makeIt, sellIt, lookAfterIt, confirmedXp, pendingXp, prestigeXp, etc.).

## Verification

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run build`: pass — same 9 routes prerendered, no warnings
- `grep -rn 'from "@/lib/(data|workflow-data|csv)"'`: only matches in CLAUDE.md doc reference (not source code)
- All lucide icon names referenced (`Compass`, `Target`, `Lightbulb`, `BarChart3`, `Wallet`, `Mic`, `Rocket`, `Trophy`, `FileText`, `CircleDot`, `Clock`, `CheckCircle2`, `XCircle`, `RefreshCcw`) resolve under the current `lucide-react ^1.14.0` pin (typecheck passed). Plan 06 will repin to a known-stable version per D-18.

## Deviations from plan

- **Deleted `lib/csv.ts`** in addition to `lib/data.ts` and `lib/workflow-data.ts`. The plan only listed the latter two, but `lib/csv.ts` was used exclusively by export routes deleted in plan 02 (`grep` confirmed zero callers). Leaving it would have been dead code [Rule 1 - Bug avoidance / Rule 3 - cleanup].

## Self-Check

- `lib/types.ts`, `lib/seed/index.ts`, `lib/seed/players.ts`, `lib/seed/missions.ts`, `lib/seed/deliverableTemplates.ts`, `lib/score.ts`, `lib/icons.ts` all exist (verified via `ls lib`).
- `lib/data.ts` and `lib/workflow-data.ts` deleted (verified via `ls lib`).
- Commit `328b9e9` exists in git log.
- typecheck + lint + build clean.

## Self-Check: PASSED
