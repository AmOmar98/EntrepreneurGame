---
phase: 16-jury-parametrable-scoring-configurable
plan: "02"
subsystem: jury-scoring-dynamic
tags: [jury, scoring, event-settings, dynamic-criteria, tdd, retro-compat, settings-wiring]
dependency_graph:
  requires: [16-01]
  provides: [normalizePitchScore-export, dynamic-jury-form, xp-settings-wiring, scoresJson-action, criteriaAvg-aggregate]
  affects: [lib/results.ts, lib/score.ts, lib/jury.ts, lib/journey.ts, app/jury/jury-form.tsx, app/jury/page.tsx, app/results/page.tsx, app/actions.ts]
tech_stack:
  added: []
  patterns: [dynamic-jsonb-path, retro-compat-guard, positional-c1c4-mapping, tolerant-pre-migration-retry, event-settings-wiring]
key_files:
  created:
    - tests/unit/results-dynamic.test.ts
  modified:
    - lib/results.ts
    - lib/score.ts
    - lib/jury.ts
    - lib/journey.ts
    - app/jury/jury-form.tsx
    - app/jury/page.tsx
    - app/results/page.tsx
    - app/actions.ts
decisions:
  - "normalizePitchScore exported from lib/results.ts (not module-private) so tests import it directly without mocking"
  - "lib/journey.ts: getEventSettings called inside getJourneyData after eventId resolved from cohort row — minimal surface change, no signature change"
  - "lib/score.ts: SUBMITTED/REVIEWED/VALIDATED_POINTS kept as private module aliases + exported as DEFAULT_* (backwards-compat callers unaffected)"
  - "jury-form.tsx: legacyCriteria derived from dict.jury_c*_label with key=c1..c4 to preserve positional mapping compatibility"
  - "app/jury/page.tsx: criteria fetched after getJuryOverview (eventId available), demo guard at line 181 preserved intact"
  - "applyBonusMultiplier: opts.bonusMultiplierCap added to args object (not separate param) to match existing args destructuring pattern"
metrics:
  duration: "~35min"
  completed: "2026-06-12"
  tasks_completed: 3
  files_created: 1
  files_modified: 8
  unit_tests_added: 6
  unit_tests_total: 64
  e2e_tests_total: 23
---

# Phase 16 Plan 02: Dynamic Jury Form + Scoring Wiring Summary

Dynamic jury form + archive-safe ranking normalization + full EventSettings wiring on the TypeScript side.

## One-liner

normalizePitchScore exported with dynamic-jsonb + retro-compat 4/5-crit paths; jury form renders N dynamic criteria; XP rules + pitch weight + bonus cap wired from EventSettings with DEFAULT_EVENT_SETTINGS fallback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing results-dynamic tests | 2a1f49c | tests/unit/results-dynamic.test.ts |
| 1 (GREEN) | normalizePitchScore + score.ts opts + pitchWeight wiring | 21863e2 | lib/results.ts, lib/score.ts, app/results/page.tsx |
| 2 | Journey XP + jury scores column + savePitchScoreFlow scoresJson | 3a188a8 | lib/journey.ts, lib/jury.ts, app/actions.ts |
| 3 | Dynamic jury form with positional legacy fallback | aa58c6b | app/jury/jury-form.tsx, app/jury/page.tsx |

## Requirements Satisfied

- **JURY-07**: /jury form renders active event's pitch_criteria dynamically; falls back to legacy 4-criteria when none defined.
- **JURY-08**: computeRanking absorbs dynamic scores (scores jsonb path); archived 4-crit (x1.25) and 5-crit rankings recompute identically — retro-compat unit tests in results-dynamic.test.ts.
- **SETTINGS-01**: XP rules (xpFirstSubmission/xpValidateV1/xpValidateV2) + bonus multiplier cap read from EventSettings with DEFAULT_EVENT_SETTINGS fallback in lib/journey.ts and lib/score.ts.
- **SETTINGS-03**: no double hardcode — TS reads same parameters PL/pgSQL reads (get_event_setting_int values = DEFAULT_EVENT_SETTINGS values).

## Archives Retro-compat (cardinal)

The `c5Raw > 0 ? totalRaw : totalRaw * 1.25` branch in `normalizePitchScore` (lib/results.ts) is preserved verbatim. Unit tests:
- "retro-compat AgreenTech 4-crit": total_score=80, c5=0, scores=null → 100 (80 * 1.25)
- "retro-compat Digi 5-crit": total_score=90, c5=10, scores=null → 90 (no scaling)
Both pass in `tests/unit/results-dynamic.test.ts`.

## Positional c1..c4 Mapping (Phase 16 plan verbatim)

On submit, jury-form.tsx emits:
- `c1 = scores[activeCriteria[0]?.key] ?? 0` (clamped to smallint 0..32767)
- `c2 = scores[activeCriteria[1]?.key] ?? 0`
- `c3 = scores[activeCriteria[2]?.key] ?? 0`
- `c4 = scores[activeCriteria[3]?.key] ?? 0`
- `c5 = 0` ALWAYS (retro-compat invariant)
- `scoresJson` hidden input carries all criteria key->value

For a 5-criteria dynamic event: c1..c4 carry first 4 positional values, c5=0, and scoresJson carries all 5. The jsonb path is authoritative for ranking; c1..c4 feed total_score GENERATED column only.

## XP Literal Removal (SETTINGS-01/03)

Before: `earnedXp += 100` / `earnedXp += 50` / `earnedXp += 100` hardcoded in lib/journey.ts.
After: `earnedXp += settings.xpFirstSubmission` / `+= settings.xpValidateV1` / `+= settings.xpValidateV2`
Grep verification: `grep -c "earnedXp += 100" lib/journey.ts` = 0; `grep -c "earnedXp += 50" lib/journey.ts` = 0.

## R1 Audit

Post-edit R1 grep audit: `grep -rn "score|rank|note|/100|/140|points|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"`

Results: All matches are in `app/results/` (GM/jury-only gated pages) and `components/results-ceremony-screen.tsx` (GM-only ceremony). No new Player-side score/rank/number leaks introduced. R1 CLEAN.

## Pre-migration Tolerance

- `savePitchScoreFlow`: if upsert error mentions "scores" or "column", deletes payload.scores and retries (existing is_draft/verdict retry preserved).
- `lib/results.ts` fetchPitchScores: selects `scores` column — Supabase returns null for missing columns in some SDK versions; normalizePitchScore handles null cleanly.
- `lib/jury.ts` getJuryOverview: selects `scores` in primary query; mapPitchScore maps `row.scores ?? null`.

## Deviations from Plan

None — plan executed exactly as written. All positional algorithm, type extensions, and wiring match plan spec verbatim.

## Known Stubs

None — all dynamic paths are wired to real data sources with DEFAULT_EVENT_SETTINGS and DEMO_PITCH_CRITERIA as intentional fallbacks.

## Threat Surface Scan

No new network endpoints introduced. Changes are limited to:
- lib/results.ts (server-only compute, no new routes)
- lib/score.ts (pure function, no routes)
- lib/jury.ts (server-only accessor, no new routes)
- lib/journey.ts (server-only accessor, no new routes)
- app/jury/jury-form.tsx (client component — scoresJson hidden input from existing form)
- app/actions.ts savePitchScoreFlow (existing endpoint, additive scoresJson field)

T-16-04 (scoresJson tampering): mitigated — tolerant JSON.parse (ignore on failure), DB CHECK rejects empty/non-object, c1..c5 still Zod-validated.
T-16-05 (R1 information disclosure): mitigated — R1 grep audit clean (see above).
T-16-06 (total_score GENERATED): mitigated — never written by app; total_score path lives in TS normalization only.

## Self-Check: PASSED
