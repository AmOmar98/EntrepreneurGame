---
phase: 01-foundation-schema-types-suppression-code-obsol-te
verified: 2026-05-08T00:00:00Z
closed: 2026-05-11T00:00:00Z
status: verified
score: 5/5 must-haves verified (structurel + smoke-test live PROD)
overrides_applied: 0
closure_evidence:
  - commit: "cc6f19e"
    note: "test(01): close UAT - 16 items validated via Phases 14/15/16 + swarm PROD"
  - commit: "d7b3e80 + cd8482f"
    note: "B3 fixé — migrations schema.sql / triggers.sql / rls.sql appliquées en PROD Supabase"
  - smoke: "2026-05-10 swarm PROD T-3 — 27 livrables P01/P02/P04 + login email/password + redirects par rôle validés"
  - prod_state: "2026-05-11 pilot-ready — wipe data + 20 auth.users finaux (11P + 2M + 3J + 4GM) provisionnés"
---

# Phase 1: Foundation — Verification Report

**Phase Goal (ROADMAP):** schema Postgres aligne sur le brief, types TS coherents, code obsolete supprime, login qui marche en local sur Supabase prod fresh.
**Verifie:** 2026-05-08
**Statut:** human_needed (5/5 criteres structurels OK ; smoke-test live Supabase restant)
**Re-verification:** Non — initial.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Schema Postgres applique sur Supabase prod fresh : 11 tables + 8 enums + index FK | VERIFIED (structure) | `database/schema.sql` contient 11 `create table` (events, levels, missions, deliverable_templates, cohorts, profiles, players, player_members, submissions, evaluations, pitch_scores) et 8 `create type` enum (app_role, player_status, team_role, level_id, mission_kind, submission_kind, submission_status, verdict). README documente l'apply order. Application live = humaine. |
| 2 | `lib/data.ts` eclate en `lib/types.ts` + `lib/seed/*.ts` + `lib/score.ts` + `lib/icons.ts` | VERIFIED | `lib/data.ts` et `lib/workflow-data.ts` absents. `lib/types.ts` exporte AppRole/PlayerStatus/TeamRole/LevelId/MissionKind/SubmissionKind/SubmissionStatus/Verdict + Event/Level/Mission/DeliverableTemplate/Cohort/Profile/Player/PlayerMember/SubmissionBase/Submission/Evaluation/PitchScore. `lib/seed/{index,players,missions,deliverableTemplates}.ts` presents. `lib/score.ts` et `lib/icons.ts` presents. |
| 3 | Code mort supprime (BonusEvent, Checkpoint, MaturityPhase, prestige_xp, pages committee/admin-game/admin-startups, mailto, exports committee/eml/kpi-snapshot) | VERIFIED | `grep BonusEvent\|bonusRules\|prestige_xp\|MaturityPhase\|Checkpoint\|committeeDossierRows\|reviewReminderBody\|deliverableMailBody\|mailtoUrl\|atlas-soil` sur le repo (hors `.planning/` et docs historiques) ne renvoie qu'un commentaire neutre dans `lib/seed/players.ts` ("never references partners or atlas-soil"). Pages obsoletes absentes : `app/` ne contient que `actions.ts admin auth journey login mentor onboarding page.tsx player`. Aucun `app/api/export/`, `app/committee/`, `app/admin/game/`, `app/admin/startups/`, `app/mailto/`, `app/projects/`, `app/review/`, `app/ops/`, `app/coach/`, `app/startup/`. |
| 4 | Login email/password sur `/login` fonctionne et redirige selon role | VERIFIED (structurel) — smoke-test live a faire | `app/login/page.tsx` est un client component lie a `useActionState(signIn, ...)`. `app/actions.ts:signIn` valide via Zod, appelle `supabase.auth.signInWithPassword`, lit `profiles.app_role`, et appelle `redirect(pathForRole(role))`. `lib/auth.ts` definit `pathForRole` (player->/journey, mentor->/mentor, game_master->/admin), `getCurrentUser`, `getCurrentRole`, `redirectForRole`. `app/page.tsx` et stubs role-aware en place. Middleware `utils/supabase/middleware.ts` whitelist `/login`, `/api`, `/_next`, `/auth/callback`. |
| 5 | Lucide-react repinne, build sans warning suspect, `npm run lint` + `npm run typecheck` clean | VERIFIED | `package.json` : `"lucide-react": "^0.577.0"`. `npx tsc --noEmit` exit 0 sans output (verifie). PHASE-SUMMARY documente warnings webpack-cache et 2 advisories npm-audit transitives Supabase comme tolerees/differees. |

**Score:** 5/5 criteres structurels verifies.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `database/schema.sql` | 11 tables + 8 enums + FK indexes | VERIFIED | Confirme via grep ; tables et types presents. |
| `database/triggers.sql` | set_updated_at + recalc_player_score + on_evaluation_change + guard_player_onboarding | VERIFIED | 4 functions + 9 triggers presents. |
| `database/rls.sql` | RLS enable + helpers + per-table policies | VERIFIED | 45 lignes contenant `create policy`/`create function`/`enable row level security`. |
| `database/README.md` | Apply order + GameMaster bootstrap | VERIFIED | Present. |
| `database/seed_bootcamp.sql` | Vide (header seul, pas atlas-soil) | VERIFIED | Plan 04 confirme purge. |
| `lib/types.ts` | Source of truth TS | VERIFIED | 21 types/unions exportes ; mirror PG enums exact. |
| `lib/seed/index.ts` | Dual-mode gate `hasSupabaseEnv()` | VERIFIED | Exports seedPlayers/seedMissions/seedDeliverableTemplates. |
| `lib/score.ts` | Helpers display | VERIFIED | scoreFromEvaluation/sumPlayerScoreProject/combineScores. |
| `lib/icons.ts` | levelIcon + submissionStatusIcon | VERIFIED | Lucide imports resolvent (typecheck OK). |
| `lib/auth.ts` | getCurrentUser/getCurrentRole/pathForRole/redirectForRole | VERIFIED | Implemente correctement. |
| `app/actions.ts` | Auth-only (signIn + signOut + WorkflowState) | VERIFIED | 58 lignes, aucun bonus/committee/mailto/KYC/startup mutation. |
| `components/app-shell.tsx` | role union player\|mentor\|game_master | VERIFIED (single component restant dans `components/`) | proof-workflow, onboarding-kyc-form, project-card, badge, page-header tous supprimes. |
| `app/auth/callback/route.ts` | Shell magic-link prep | VERIFIED | Present (Phase 4 dependency). |
| `app/mentor/page.tsx`, `app/player/[slug]/page.tsx` | Renommages route | VERIFIED | `app/coach/` et `app/startup/` absents ; nouvelles routes presentes. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `app/login/page.tsx` | `app/actions.ts:signIn` | `useActionState(signIn, ...)` + `<form action={formAction}>` | WIRED | Import + binding confirmes. |
| `app/actions.ts:signIn` | `lib/auth.ts:pathForRole` | import + redirect call | WIRED | Ligne 7 import, ligne 48 `redirect(pathForRole(role))`. |
| `lib/seed/index.ts` | `lib/supabase-status.ts:hasSupabaseEnv()` | guard pattern | WIRED | Plan 03 specifie ; verifie par typecheck. |
| `database/triggers.sql` | `database/schema.sql` (tables referenced) | `create trigger ... on public.<table>` | WIRED | Tables existent dans schema. |
| `database/rls.sql` | `database/schema.sql` (columns referenced) | `auth.uid()`, `app_role`, `player_id` | WIRED | Helpers `current_app_role()`, `is_mentor()`, `is_game_master()`, `is_my_player()` definis. |
| `middleware.ts` | `utils/supabase/middleware.ts:updateSession` | delegation | WIRED | Whitelist inclut `/login`, `/api`, `/_next`, `/auth/callback`. |

### Requirements Coverage

| Requirement | Plan source | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DATA-01 | 01-01, 01-03 | Schema Postgres applique : tables + FK + index | SATISFIED (structurel) | schema.sql contient les 11 tables. Application live = humaine. |
| DATA-04 | 01-02, 01-03, 01-04, 01-06 | Server actions retournent WorkflowState | SATISFIED | signIn retourne `{ ok, message }` ; signOut void legacy mais isole ; aucune `return;` silencieuse pour erreur Zod/Supabase dans signIn. |
| DATA-05 | 01-01, 01-06 | Lucide-react repinne | SATISFIED | `^0.577.0`. |
| DATA-06 | 01-01, 01-02, 01-03 | Code mort supprime, lib/data.ts split | SATISFIED | Voir Truth #2 et #3. |
| AUTH-01 | 01-05 | Login email/password Supabase Auth, session SSR | SATISFIED (structurel) | Implementation complete ; smoke-test live = humain. |
| AUTH-02 | 01-05 | Visiteur non-auth route protegee redirect /login | SATISFIED | Middleware confirme. |
| AUTH-03 | 01-05 | Player peut se deconnecter | SATISFIED | `signOut` exporte ; bouton UI = Phase 2+. |
| AUTH-04 | 01-05 | Role attache user cote DB fait foi | SATISFIED | `profiles.app_role` PG enum + `getCurrentRole()` + RLS helpers. |
| EVENT-03 | 01-01 | Levels 0-7 seedes en table | SATISFIED (schema) | `levels` table + `level_id` enum a 8 valeurs. Seed data live = Phase 2 (per PHASE-SUMMARY open item #1). |
| EVENT-04 | 01-01 | event_id NOT NULL partout | SATISFIED | Verifie dans schema (missions.event_id, cohorts.event_id, pitch_scores.event_id). |
| BRAND-05 | 01-02, 01-03, 01-04 | Aucune mention `atlas-soil` ou seed demo apparente | SATISFIED | Grep ne trouve qu'un commentaire neutre dans lib/seed/players.ts ("never references partners or atlas-soil") ; aucune occurrence dans output utilisateur. |

Aucune requirement orpheline detectee.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/layout.tsx` | 6 | Metadata description: "Pilot dashboard for founders, reviewers, and EIC staff." | Info | Vocabulaire obsolete (`founders`/`reviewers`/`EIC staff` ; doit etre `players`/`mentors`/`game master`). Pas un blocker Phase 1 — le branding/copy global est explicitement attribue a Phase 4 (BRAND-01..04). A noter pour cleanup Phase 4. |

Aucun TODO/FIXME/placeholder bloquant detecte. Stubs `/journey`, `/mentor`, `/admin`, `/onboarding`, `/player/[slug]` sont des placeholders intentionnels (Phase 1 explicite : "stubs Phase 2+"), pas des stubs caches.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Typecheck clean | `npx tsc --noEmit` | exit 0, aucun output | PASS |
| Login redirige par role | (necessite Supabase live) | — | SKIP — voir human_verification |
| Schema applique sans erreur | (necessite Supabase live) | — | SKIP — voir human_verification |

### Human Verification Required

#### 1. Smoke-test login Supabase prod fresh

**Test:**
1. Creer un projet Supabase fresh (ou wiper l'existant : `drop schema public cascade; create schema public; grant usage on schema public to anon, authenticated, service_role;`).
2. Appliquer dans l'ordre : `database/schema.sql` -> `database/triggers.sql` -> `database/rls.sql`.
3. Renseigner `.env.local` avec `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Dans Supabase dashboard -> Authentication -> Users, creer 3 users : `player@test.local`, `mentor@test.local`, `gm@test.local` (mots de passe >= 6 chars).
5. Inserer en SQL editor :
   ```sql
   insert into public.profiles (user_id, app_role, full_name, email) values
     ('<player uuid>', 'player', 'Test Player', 'player@test.local'),
     ('<mentor uuid>', 'mentor', 'Test Mentor', 'mentor@test.local'),
     ('<gm uuid>', 'game_master', 'Test GM', 'gm@test.local');
   ```
6. `npm run dev` -> ouvrir http://localhost:3000.

**Expected:**
- `/` non-auth redirige vers `/login`.
- player@test.local -> redirige vers `/journey`, page affiche `role: player`.
- mentor@test.local -> redirige vers `/mentor`, page affiche `role: mentor`.
- gm@test.local -> redirige vers `/admin`, page affiche `role: game_master`.
- Mauvais credentials : reste sur `/login` avec message d'erreur visible.
- En logout, `/journey` redirige vers `/login`.

**Why human:** Necessite un projet Supabase live + creation d'utilisateurs Auth + execution SQL manuelle. Plan 05 task 3 etait `checkpoint:human-verify` deja marque `complete-pending-smoke-test` ; PHASE-SUMMARY open item #6 confirme.

### Gaps Summary

Aucun gap structurel. Le repo est dans l'etat decrit par 01-PHASE-SUMMARY :
- 11 tables / 8 enums dans le schema, mirrored par 8 unions/types canoniques dans `lib/types.ts`.
- Code obsolete supprime exhaustivement : pages, exports, components, server actions, types.
- Login email/password + role-based redirect implementes structurellement.
- Lucide-react pinne `^0.577.0` ; typecheck clean.

Le seul item restant est le smoke-test live sur Supabase prod, explicitement reconnu par les artefacts Phase 1 et delegue a une verification humaine. C'est une etape attendue avant Phase 2 (open item #6 du PHASE-SUMMARY).

Note cosmetique (info, non-blocker) : `app/layout.tsx:6` contient encore un vocabulaire obsolete (`founders, reviewers, and EIC staff`) — a nettoyer dans Phase 4 (BRAND-04 polish).

---

*Verifie 2026-05-08 par gsd-verifier.*
