# RLS Test Results - Phase 5 / DATA-02

**Date executee** : YYYY-MM-DD (a remplir)
**Operateur** : Omar
**Environnement** : Supabase prod (project ref: <ref>)
**Script** : `database/rls_test.sql`

## Pre-requis

- [ ] 2 equipes factices "RLS Test A" et "RLS Test B" importees via `/admin/players/import`.
- [ ] 1 mentor factice cree (profile.app_role = `mentor`).
- [ ] GameMaster confirme (profile.app_role = `game_master`).
- [ ] 4 UUIDs recuperes dans Supabase Dashboard > Authentication > Users.
- [ ] Placeholders `:user_a`, `:user_b`, `:user_m`, `:user_g` substitues dans `database/rls_test.sql`.

## UUIDs utilises

| Variable | Description | UUID |
|----------|-------------|------|
| user_a | Player A leader | |
| user_b | Player B leader | |
| user_m | Mentor factice | |
| user_g | GameMaster (Omar) | |
| player_a | UUID Player A (resolu) | |
| player_b | UUID Player B (resolu) | |

## Scenarios

| # | Description | Expected | Actual (output SQL editor) | Status |
|---|-------------|----------|----------------------------|--------|
| 1 | Player A SELECT submissions | leak_count = 0, visible_count = N(A) | | [ ] |
| 2 | Player A SELECT submissions WHERE player_id=B | cnt = 0 | | [ ] |
| 3 | Player A INSERT submission player_id=B | RLS denied (NOTICE S3 PASS) | | [ ] |
| 4 | Player A INSERT propre submission | NOTICE S4 PASS | | [ ] |
| 5 | Mentor SELECT submissions | cnt >= visible_count(S1) | | [ ] |
| 6 | Mentor INSERT pitch_score juror_id=self | NOTICE S6 PASS | | [ ] |
| 7 | Mentor INSERT pitch_score juror_id=A | NOTICE S7 PASS (denied) | | [ ] |
| 8 | GM UPDATE players.score_project | NOTICE S8 PASS | | [ ] |
| 9 | Player A SELECT pitch_scores WHERE player_id=B | cnt = 0 | | [ ] |
| 10 | Player A SELECT events | cnt >= 1 | | [ ] |

## Verdict global

- [ ] **ALL PASS** -> proceed to deployment Vercel prod (Plan 05-04)
- [ ] **FAIL** -> NE PAS deployer ; ouvrir blocker dans `.planning/STATE.md`

## Notes operateur

(Ajouter ici tout comportement inattendu, sortie SQL pertinente, ou correctif applique.)

## Resume signal

Une fois rempli, taper dans le chat orchestrateur :
- `rls-pass` si toutes les assertions passent
- `rls-fail: <details>` sinon
