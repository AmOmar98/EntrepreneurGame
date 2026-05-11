# SUMMARY — Quick 260512-msu

## Outcome

✅ **Bug P0 pre-pilote AgreenTech 13-14/05 corrigé et vérifié sur PROD Supabase.**

## What landed

- `database/triggers.sql` — `on_evaluation_change()` étendu pour propager `evaluation.verdict → submissions.status` via SECURITY DEFINER (bypass RLS proprement, sans widening de la policy mentor)
- `tests/rls/mentor-status-propagation.sql` — 5 scenarios PROD-safe (transactional rollback) couvrant les 4 verdicts + RLS contract non-régression mentor
- `.planning/quick/260512-msu-mentor-rls-submission-status-propagation/` — PLAN.md / AUDIT.md / deferred-items.md / SUMMARY.md

## Migration appliquée sur PROD

Via `apply_migration` Supabase MCP (projet `vzzbjxmfkmvqkaqxalhr`) :
- `on_evaluation_change_propagate_verdict_to_submission_status` (v1 — bug enum cast)
- `on_evaluation_change_v2_explicit_if` (correction enum)
- `on_evaluation_change_v3_with_notices` (instrumentation debug)
- `on_evaluation_change_v4_table_logging` (debug table)
- `on_evaluation_change_v5_fix_new_is_not_null` (**version finale active**)

La fonction PROD active = v5 (vérifié via `pg_get_functiondef` post-migration). Tests end-to-end OK pour `validate_v1`, `request_v2`, `validate_v2`, `reject` (cf. AUDIT.md).

## Sub-tasks → 1 atomic commit

| # | Sub-task | Commit |
|---|----------|--------|
| 1 | Diagnostic root cause (RLS policy + `row IS NOT NULL` + simple CASE enum) | (this commit) |
| 2 | Migration trigger propagation v5 + backfill | (this commit, applied direct to PROD via MCP) |
| 3 | Update `database/triggers.sql` source-of-truth | (this commit) |
| 4 | Write `tests/rls/mentor-status-propagation.sql` 5 scenarios | (this commit) |
| 5 | Cleanup P05 test data (delete submission + eval + reset onboarding) | (DB-only, no commit) |

## Verification before commit

- `npm run typecheck` ✅ (pas de changement TypeScript, no-op pass)
- Manual SQL verification ✅ — 4/4 verdict scenarios PASS sur PROD live data avant cleanup
- RLS non-regression test ✅ — mentor toujours bloqué d'UPDATE directs sur submissions

## Cleanup PROD state post-quick

- P05 (Nouhaila Dahbi) : tous champs réinitialisés à pre-onboarding (`onboarded_at=NULL`, `idea=NULL`, `current_level=L0_diagnostic`, scores=0). Aucune submission/eval orpheline.
- Trigger `trg_player_onboarding` désactivé temporairement puis réactivé pour permettre le reset onboarded_at write-once.
- DB état final : 11 players inchangés (état pilot-ready), 0 submissions de test, 0 evaluations.

## Deferred (cf. deferred-items.md)

- Reprise smoke 6 statuts deliverable score block après merge polish/design-v2-match post-pilote 14/05 soir.
- Cleanup éventuel `app/actions.ts:525-528` (UPDATE devenu redondant pour mentor) — pas un blocker.

## Risk + rollback

**Risk** : très faible. La migration trigger ajoute du comportement sans changer la signature ; les chemins existants (`recalc_player_score`) sont préservés. Pas de modification app/* TypeScript.

**Rollback** : `apply_migration on_evaluation_change_rollback_to_v0` avec l'ancienne version (sans la branche verdict→status). Le mentor workflow redeviendrait alors cassé (état pré-fix) — donc rollback NON souhaitable pour le pilote.

## Reference commits

- Local main pre-quick : `17930aa` `docs(claude): pilot AgreenTech operational + polish isolated branch policy`
- Hotfix commit SHA : voir `git log -1 origin/main` après push
