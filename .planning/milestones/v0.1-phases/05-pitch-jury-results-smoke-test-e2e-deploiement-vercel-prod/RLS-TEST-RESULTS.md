# RLS Test Results - Phase 5 / DATA-02

**Date executee** : 2026-05-09
**Operateur** : Claude (orchestre par Omar)
**Environnement** : Supabase prod (project ref: `vzzbjxmfkmvqkaqxalhr`, region West EU Ireland)
**Script** : `database/_rls_test_run.sql` (adapte de `database/rls_test.sql` pour exec via Management API + alignement schema reel)

## Pre-requis

- [x] 2 equipes factices "RLS Test A" et "RLS Test B" creees via `database/_rls_test_setup.sql` (cohort `cohorte-mai-2026`).
- [x] 1 mentor factice (profile.app_role = `mentor`) deja present (`mentor@test.local`).
- [x] GameMaster confirme (profile.app_role = `game_master`) - `gm@test.local` (test) + `omar.ameur98@gmail.com` (prod GM).
- [x] 4 UUIDs identifies depuis `auth.users` + `profiles`.
- [x] UUIDs inlines dans `database/_rls_test_run.sql` (pas de psql `\set` car execute via Management API).

## UUIDs utilises

| Variable | Description | UUID |
|----------|-------------|------|
| user_a | Player A leader (`player@test.local`) | `06af6412-7086-405b-a91f-e2b8affe07d8` |
| user_b | Player B leader (`player-b@test.local`) | `27eddceb-dbca-462f-bf22-88512caa7024` |
| user_m | Mentor factice (`mentor@test.local`) | `2d8f4f0f-0d99-4aae-b9f0-3e003cee970b` |
| user_g | GameMaster test (`gm@test.local`) | `e0314b6c-1832-4281-b518-c11266e5749b` |
| player_a | UUID Player A (slug `rls-test-a`) | resolu via `player_members.user_id = user_a` |
| player_b | UUID Player B (slug `rls-test-b`) | resolu via `player_members.user_id = user_b` |

## Scenarios

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Player A SELECT submissions | leak=0 et visible>=1 | visible=1 leak=0 | PASS |
| 2 | Player A SELECT submissions WHERE player_id=B | cnt=0 | cnt=0 | PASS |
| 3 | Player A INSERT submission player_id=B | RLS denied | blocked: new row violates row-level security policy for table "submissions" | PASS |
| 4 | Player A INSERT propre submission | INSERT success | INSERT accepte | PASS |
| 5 | Mentor SELECT submissions | cnt >= total (3) | cnt=3 | PASS |
| 6 | Mentor INSERT pitch_score juror_id=self | INSERT success | INSERT accepte | PASS |
| 7 | Mentor INSERT pitch_score juror_id=A (spoof) | RLS denied | blocked: new row violates row-level security policy for table "pitch_scores" | PASS |
| 8 | GM UPDATE players.score_project | UPDATE success | UPDATE accepte | PASS |
| 9 | Player A SELECT pitch_scores WHERE player_id=B | cnt=0 | cnt=0 | PASS |
| 10 | Player A SELECT events | cnt >= 1 | cnt=1 | PASS |

## Verdict global

- [x] **ALL PASS** -> proceed to deployment Vercel prod (Plan 05-04)
- [ ] **FAIL** -> NE PAS deployer ; ouvrir blocker dans `.planning/STATE.md`

## Notes operateur

### Ecart entre `database/rls_test.sql` et le schema actuel

Le fichier `database/rls_test.sql` (committe) reference des colonnes
**incorrectes** vs le schema reel de `database/schema.sql`:

- `submissions.template_id` (rls_test.sql) -> `submissions.deliverable_template_id` (schema.sql)
- `submissions.payload_url` (rls_test.sql) -> `submissions.proof_url` (schema.sql)
- `pitch_scores.score_problem/score_solution/score_market/score_business_model/score_pitch`
  (rls_test.sql) -> `pitch_scores.c1/c2/c3/c4/c5` (schema.sql)
- `pitch_scores` ne contient pas non plus `event_id` dans la signature INSERT
  utilisee par `rls_test.sql`, alors qu'il est `not null` dans le schema.

Tel quel, `database/rls_test.sql` echouerait sur S3 (`column "template_id" does not exist`)
**avant** d'avoir teste le moindre scenario RLS. Pour cette execution, j'ai
ecrit `database/_rls_test_run.sql` qui:

1. utilise les bons noms de colonnes
2. inline les UUIDs (pas de psql `\set` compatible avec Management API)
3. emet un tableau de resultats `_rls_results` consomme directement (pas de NOTICE).

> **TODO Omar (post-pilote)** : reconcilier `database/rls_test.sql` avec le
> schema reel et integrer la logique de `_rls_test_run.sql`. Hors scope D-04.

### Etat infra Supabase prod (post application)

- `enums` : 8
- `tables (public)` : 11
- `triggers` : 12
- `policies RLS` : 34
- `events` : 1 (Hack-Days Fes-Meknes Mai 2026)
- `cohorts` : 1 (`cohorte-mai-2026`)
- `levels` : 8 (L0..L7)
- `missions` : 6
- `deliverable_templates` : 9
- `players` : 2 (`rls-test-a`, `rls-test-b` - test fixtures, **a supprimer avant pilote**)
- `profiles` : 4 (1 player test, 1 mentor test, 1 GM test, 1 GM Omar prod)

### GameMaster Omar - bootstrap effectue

Compte cree via Auth Admin API + profile eleve:
- email: `omar.ameur98@gmail.com`
- user_id: `f4d46a09-2119-4673-8d01-fda617d4cb79`
- app_role: `game_master`
- mot de passe temporaire: `EICGame2026!HackDays` (a changer au 1er login via
  Supabase Auth -> Reset password OU via le flow `/login` quand UI disponible).

### Cleanup recommande avant pilote (J-13)

- Supprimer les 3 comptes test `*@test.local` (player/mentor/gm) dans Supabase Auth.
- Supprimer les 2 players de test (`rls-test-a`, `rls-test-b`) via SQL editor:
  ```sql
  delete from public.players where slug like 'rls-test-%';
  ```
- Verifier qu'aucun seed `bootcamp` (legacy) n'a fuite (`select * from public.players;` doit etre vide).

## Resume signal

`rls-pass`
