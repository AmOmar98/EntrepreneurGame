---
phase: 05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod
plan: 03
subsystem: security
tags: [rls, supabase, security, testing, magic-link]
requires: [05-01, 05-02]
provides:
  - "database/rls_test.sql: suite SQL parametree (10 scenarios) testant les policies RLS de database/rls.sql"
  - "RLS-TEST-RESULTS.md: template de trace avec gate de deploiement (verdict ALL PASS requis)"
  - "INTERNAL-TESTERS.md: tracker 6-15 testeurs internes + procedure magic-link via /admin/players/import"
affects:
  - "Plan 05-04 (deploiement Vercel prod) : depend du verdict ALL PASS dans RLS-TEST-RESULTS.md"
  - "Pilote 13 mai 2026 : repetition J-1 (12 mai) avec testeurs internes"
tech-stack:
  added: []
  patterns:
    - "Supabase RLS testing via set_config('request.jwt.claims', json_build_object('sub', uuid, 'role', 'authenticated')::text, true)"
    - "Idempotent SQL test : begin/rollback pour OK, EXCEPTION WHEN OTHERS pour denied"
key-files:
  created:
    - "database/rls_test.sql"
    - ".planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/RLS-TEST-RESULTS.md"
    - ".planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/INTERNAL-TESTERS.md"
  modified: []
decisions:
  - "Utiliser psql variable substitution (\\set + :'var') pour les 4 UUIDs operateur, pas un DO block parametrise (compatibilite SQL editor Supabase)"
  - "Helper public._rls_impersonate(uuid) cree puis drop en fin de script (pas de pollution permanente du schema)"
  - "Verdict ALL PASS dans RLS-TEST-RESULTS.md est gate hard du Plan 05-04 (deploiement) - documente dans le template"
  - "Auto-approbation du checkpoint:human-action Task 2 conformement au mode FULL AUTO ; execution reelle du SQL editor reste a la charge de l'operateur (Omar) avant 12 mai"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-08"
  tasks: 3
  files: 3
---

# Phase 5 Plan 03: RLS Test Suite + Internal Testers Summary

Suite SQL repetable (`database/rls_test.sql`) avec 10 scenarios couvrant DATA-02 (Player isolation, Mentor visibility, GM authority) et templates operateur pour la repetition pilote J-1.

## What Was Built

### Task 1 : `database/rls_test.sql` (commit `3a05a16`)

Script SQL idempotent a coller dans le SQL editor Supabase apres avoir cree 2 Players factices + 1 Mentor + GameMaster via `/admin/players/import`.

10 scenarios couverts :

1. Player A SELECT submissions -> visible_count + leak_count = 0 (T-05-10).
2. Player A SELECT submissions WHERE player_id=B -> 0 rows (T-05-10).
3. Player A INSERT submission player_id=B -> RLS denied (T-05-11).
4. Player A INSERT submission propre -> success.
5. Mentor SELECT submissions -> all rows visible.
6. Mentor INSERT pitch_score juror_id=self -> success.
7. Mentor INSERT pitch_score juror_id=A -> RLS denied (T-05-12).
8. GM UPDATE players.score_project -> success.
9. Player A SELECT pitch_scores WHERE player_id=B -> 0 rows.
10. Player A SELECT events -> >= 1 row (events authenticated_select).

Pattern Supabase officiel utilise : `set_config('request.jwt.claims', json_build_object('sub', uuid, 'role', 'authenticated')::text, true)` avec `set local role authenticated`. Helper `public._rls_impersonate(uuid)` cree puis drop en fin de script.

OK inserts encapsules dans `do $$ begin ... raise exception 'rollback-ok' end $$` pour rollback automatique. Denied inserts attrapes par `exception when others` avec detection du pattern `row-level security` / `violates` dans `sqlerrm`.

### Task 3 : Templates operateur (commit `ca9a3e3`)

- **`RLS-TEST-RESULTS.md`** : table 10-scenarios avec verdict global (`ALL PASS` -> deploiement / `FAIL` -> blocker). Champs : UUIDs utilises, output SQL editor par scenario, status checkbox, resume signal `rls-pass` / `rls-fail`.
- **`INTERNAL-TESTERS.md`** : tracker 6-15 testeurs avec procedure CSV import (`team_name,project_name,project_pitch,leader_email,member_emails`), section Players + Mentors + GameMaster, status global.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Substitution UUID via `\set` plutot que DO declare**

- **Found during:** Task 1
- **Issue:** Le plan suggerait `declare user_a uuid := '0000...0001'` dans un DO block, mais cela ne permet pas de partager l'UUID a travers plusieurs blocs SQL (un DO crree une nouvelle session de variables).
- **Fix:** Utilisation de la syntaxe psql `\set user_a 'uuid'` + reference `:'user_a'::uuid` qui se propage a tous les blocks. Compatible avec le SQL editor Supabase qui accepte ces meta-commandes.
- **Files modified:** `database/rls_test.sql`
- **Commit:** `3a05a16`

**2. [Rule 2 - Critical] Helper `_rls_impersonate(uuid)` cree+drop**

- **Found during:** Task 1
- **Issue:** Le plan ne specifiait pas l'isolation du helper. Sans drop, il resterait dans le schema public en prod.
- **Fix:** `create or replace function public._rls_impersonate(p_user uuid)` au debut + `drop function if exists public._rls_impersonate(uuid)` en fin de script. Pas de pollution permanente.
- **Files modified:** `database/rls_test.sql`
- **Commit:** `3a05a16`

### Auth gates / Checkpoints

**Task 2 (`checkpoint:human-action`)** : auto-approuve en mode FULL AUTO. L'execution reelle du script dans le SQL editor Supabase, le remplissage de RLS-TEST-RESULTS.md et l'envoi des magic links restent des actions manuelles a faire par Omar avant 12 mai 2026 (J-1). Le mode FULL AUTO ne fait pas de fausse signature : les artefacts (script + templates) sont prets, mais le verdict reel et le compte des magic links dependent de l'operateur.

Documentation auto-approve : ajoute dans le decision log du frontmatter du SUMMARY.

## Verification

- [x] `database/rls_test.sql` cree, 10 scenarios documentes avec `-- EXPECT:`.
- [x] `RLS-TEST-RESULTS.md` cree avec verdict global gate.
- [x] `INTERNAL-TESTERS.md` cree avec procedure CSV.
- [x] Chaque task committee atomiquement (3a05a16, ca9a3e3).
- [ ] **Operator action requise (avant 12 mai 2026)** : importer testeurs via `/admin/players/import`, executer `database/rls_test.sql`, remplir templates. Verdict `ALL PASS` est prerequis du Plan 05-04.

## Known Stubs

Aucun stub bloquant. Les templates `RLS-TEST-RESULTS.md` et `INTERNAL-TESTERS.md` contiennent des placeholders `YYYY-MM-DD`, UUIDs vides et `(optionnel)` -- intentionnels et a remplir par l'operateur.

## Threat Flags

Aucun nouveau surface securite introduit. Le script `rls_test.sql` testE les T-05-10/11/12 du threat register sans creer d'endpoint applicatif.

## Self-Check: PASSED

- FOUND: `database/rls_test.sql`
- FOUND: `.planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/RLS-TEST-RESULTS.md`
- FOUND: `.planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/INTERNAL-TESTERS.md`
- FOUND commit: `3a05a16` (feat 05-03 RLS test suite)
- FOUND commit: `ca9a3e3` (docs 05-03 templates)
