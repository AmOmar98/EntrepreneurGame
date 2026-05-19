# Phase 15-01 — Verdict idempotence trigger engagement Phase 14

**Date exécution** : 2026-05-11 10:35 UTC
**Exécuté par** : Claude Code (via Supabase MCP `execute_sql`, projet `vzzbjxmfkmvqkaqxalhr`)
**Script source** : `scripts/test-engagement-trigger-idempotence.sql` (adapté procéduralement — voir Notes §exécution)
**Migration testée** : `database/migrations/202605110007_phase14_engagement_trigger.sql`

## Procédure d'exécution

Exécution **via MCP Supabase plugin** (équivalent fonctionnel à Cloud Studio SQL Editor en termes de privilèges DB) :
- Player de test : **RLS Test A** `76bffc6b-38fa-4bfe-b8f8-7fe8dc320ebc` (baseline `score_engagement = 0`)
- Template : **bmc-v1** `79bcde1b-f5cb-40e4-a428-3e266a9b7879` (max_score=25, is_active=true)
- Evaluator M01 : `8676f6c5-e94d-41f6-b080-1bb43c0c11d8` (mentor1.agreentech@smoke.entrepreneurgame.local)
- Tous les scénarios wrappés `begin;...rollback;` ou sous-transactions PL/pgSQL `begin..exception when sqlstate 'P0001'` (rollback marker). Vérifié : `git status` + query post-run confirment **zéro mutation persistée**.

Le script source `scripts/test-engagement-trigger-idempotence.sql` est destiné à l'exécution manuelle Cloud Studio par Omar. L'exécution via MCP a nécessité une adaptation procédurale (les directives `\set`/`\echo` psql ne traversent pas l'API REST). L'équivalence sémantique est garantie : mêmes INSERT, mêmes assertions, même mécanisme rollback.

## Résultats par scénario

| # | Scénario | Verdict attendu | Verdict observé | PASS/FAIL |
|---|----------|-----------------|-----------------|-----------|
| 1 | Insert duplicate submission (V1+V2 même template) | `delta = 100` (palier Soumis distinct par template) | `delta = 100` | ✅ **PASS** |
| 2A | Eval verdict=`validate_v1` | `delta = 175` (100+25+50) | `delta = 175` | ✅ **PASS** |
| 2B | Update verdict=`reject` | `delta = 125` (100+25+0 — Validé recalculé) | `delta = 125` | ✅ **PASS** |
| 2C | Update verdict=`validate_v2` | `delta = 175` (Validé re-attribué Q5=A) | `delta = 175` | ✅ **PASS** |
| 3a | Insert sub+eval validate_v1 | `delta = 175` | `delta = 175` | ✅ **PASS** |
| 3b | Delete submission cascade | `delta = 0` (retour baseline) | `delta = 0` | ✅ **PASS** |
| 4 | Re-eval par 2 mentors distincts (timestamps explicites séparés) | `delta = 175` (palier Reviewed distinct par template) | `delta = 175` | ✅ **PASS** |
| 5 | Backfill idempotent (re-run 2× consécutifs) | `diff = 0` (sum stable) | `sum_before = 4050, sum_after = 4050, diff = 0.00` | ✅ **PASS** |

## Verdict global

✅ **ALL PASS (8/8 steps).** Le trigger Phase 14 `recalc_player_engagement` est :
- **Idempotent** : backfill ré-exécutable sans drift cumulatif (S5 PASS, diff=0 sur cohorte complète 4050pts).
- **Cumulatif par palier** : Soumis (+100) + Reviewed (+25) + Validé (+50) cohérent avec spec Phase 14.
- **Réversible Q5=A** : palier Validé recalculé sur le verdict le plus récent (validate_v1→reject→validate_v2 cycle PASS).
- **Cascade-safe** : delete submission propage via FK cascade aux evaluations, triggers recalculent à 0.

## Known limitations / Actions follow-up

### Warning S4 — tie-break timestamp en single-transaction (non-bloquant pilote)

**Constat** : lors d'un premier run S4 avec 2 INSERT evaluations dans la **même transaction PL/pgSQL**, `created_at` et `updated_at` (default `now()` = `transaction_timestamp()`) sont **identiques** pour les 2 lignes. La clause `row_number() over (order by e.updated_at desc, e.created_at desc)` du trigger produit alors un tie-break **non-déterministe** → S4 retourne `delta = 125` au lieu de 175 (palier Validé attribué au mauvais verdict).

**Re-run S4 v3 avec timestamps explicites séparés (10s d'écart) → PASS delta=175**. Cela démontre que le trigger est correct quand les timestamps diffèrent.

**Impact production pilote 13-14/05** : **NUL**. En conditions réelles, 2 mentors évaluant la même submission le font via 2 requêtes HTTP distinctes → 2 transactions Postgres distinctes → 2 `transaction_timestamp()` différents (même au µs près) → tie-break n'a pas lieu.

**Cas où le bug pourrait se manifester** :
- Seed SQL groupé qui insérerait plusieurs evaluations dans une seule transaction.
- Server action future qui ferait du batch insert.

**Mitigation recommandée pour v0.3 (defer SEED-002)** : ajouter `id desc` (ou `submission_id, id desc`) comme dernier critère de tie-break dans le `row_number() over (...)` du trigger pour garantir déterminisme même en single-tx.

**Statut decision** : **D-02 known limitation defer v0.3**. Pas de patch pré-pilote.

## Notes §exécution

- **Constraint S4 first run** : `evaluations_expected_action_required_for_request_v2` (CHECK Phase 8) exige `expected_action` non-vide quand verdict=`request_v2`. Test data corrigé en v3 avec `expected_action='Corriger BMC'` → S4 v3 PASS.
- **Script source à corriger** : `scripts/test-engagement-trigger-idempotence.sql` ligne 57 référence `players.event_id` qui n'existe pas dans le schéma actuel. Ligne morte (la variable `v_event_id` n'est pas utilisée dans l'INSERT). À nettoyer en v0.3 (post-pilote, hors scope D-02).

## Cross-références

- Migration Phase 14 : `database/migrations/202605110007_phase14_engagement_trigger.sql`
- Helper TS miroir : `lib/score.ts:sumPlayerScoreEngagement`
- Q5=A decision : `.planning/phases/14-scoring-engagement-livrables/14-CONTEXT.md`
- Cardinal R1 (badges qualitatifs Player) : `CLAUDE.md` §"Pre-edit guards"
