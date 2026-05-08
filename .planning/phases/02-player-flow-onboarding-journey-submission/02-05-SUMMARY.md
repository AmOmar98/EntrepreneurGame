---
phase: 02-player-flow-onboarding-journey-submission
plan: 05
subsystem: integration-polish
tags: [i18n, anti-leak, smoke-test, rls-audit, phase-2-close]
requires:
  - 02-01-SUMMARY (onboarding action + middleware gate)
  - 02-02-SUMMARY (journey page)
  - 02-03-SUMMARY (submission flow)
  - 02-04-SUMMARY (event seed + DATA-03 anti-leak)
provides:
  - Centralised i18n keys for nav + onboarding (FR ASCII)
  - 02-SMOKE.md - executable E2E manual procedure (5 scenarios)
  - Anti-leak audit (DATA-03) - verified clean across app/components
affects:
  - lib/i18n.ts
  - components/app-shell.tsx
  - components/onboarding-form.tsx
  - app/onboarding/page.tsx
tech-stack:
  added: []
  patterns:
    - "single dictionary import per client component (dictionaries.fr) - mirrors existing journey/submission components"
key-files:
  created:
    - .planning/phases/02-player-flow-onboarding-journey-submission/02-SMOKE.md
    - .planning/phases/02-player-flow-onboarding-journey-submission/02-05-SUMMARY.md
  modified:
    - lib/i18n.ts
    - components/app-shell.tsx
    - components/onboarding-form.tsx
    - app/onboarding/page.tsx
decisions:
  - "Auto-approved checkpoint Task 3 (FULL AUTO mode): smoke test execution deferred to UAT phase before 13 mai. SMOKE.md is the executable artifact."
  - "All Phase 2 user-facing strings now flow through lib/i18n.ts (FR ASCII)"
  - "No code changes in /journey or /journey/deliverable/[id] - already i18n-ed by Plan 02 and 03"
metrics:
  duration_minutes: 12
  tasks_completed: 3
  files_touched: 5
  commits: 2
completed: 2026-05-08
---

# Phase 02 Plan 05: Integration Polish + Smoke Test Summary

Cloture Phase 2 : audit i18n complet (centralisation des derniers libelles inline dans `app-shell`, `onboarding-form`, `onboarding/page`), audit anti-leak (DATA-03) confirme propre, procedure de smoke test E2E `02-SMOKE.md` documentee pour execution avant 13 mai 2026 8h30.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Polish i18n + etats vides + audit anti-leak | `5392eda` | lib/i18n.ts, components/app-shell.tsx, components/onboarding-form.tsx, app/onboarding/page.tsx |
| 2 | Ecrire 02-SMOKE.md (procedure E2E manuelle) | `36fe069` | .planning/phases/02-player-flow-onboarding-journey-submission/02-SMOKE.md |
| 3 | Validation manuelle smoke test E2E | (auto-approved) | - |

## What Was Built

### Task 1 - i18n + etats vides + anti-leak

**Cles i18n ajoutees dans `lib/i18n.ts` (FR + EN, ASCII strict) :**

- `nav_player_journey`, `nav_mentor_evaluations`, `nav_game_master_admin`
- `onboarding_demo_disabled`, `onboarding_no_player`
- `onboarding_header_subtitle`, `onboarding_diagnostic_legend`
- `onboarding_member_unnamed`, `onboarding_submitting`

**Composants migres vers `t.*` :**

- `components/app-shell.tsx` : nav labels (`Mon parcours`, `Evaluations`, `Admin`) + brand (`Entrepreneur Game` / `EIC / UEMF pilot`).
- `components/onboarding-form.tsx` : labels (`Nom d'equipe`, `Idee de projet`), counter (`caracteres`), legend Likert (`Diagnostic initial...`), members legend (`Membres presents`), `(sans nom)`, bouton (`Enregistrement...` / `Valider et demarrer`), 5 questions Likert q1-q5.
- `app/onboarding/page.tsx` : titre `Bienvenue dans l'Entrepreneur Game`, sous-titre `Niveau 0 - Diagnostic initial...`, message empty `Aucun Player rattache...`, message demo `Onboarding necessite la configuration Supabase de production.`

**Audit anti-leak DATA-03 (executes via Grep) :**

```
grep -ri "atlas-soil" app/ components/ utils/ middleware.ts -> 0 matches
grep -ri "Tamwilcom|Bank of Africa|Innov Invest|Bluespace" app/ components/ utils/ middleware.ts -> 0 matches
grep -ri "atlas-soil|Tamwilcom|..." database/seed_event_hackdays.sql -> 0 matches
```

Les seules mentions trouvees dans `lib/seed/*` sont des **commentaires interdisant explicitement** ces references (banner DATA-03 ajoutee Plan 04). Ces fichiers retournent `[]` en mode prod (`hasSupabaseEnv() === true`).

**Etats vides verifies (visuel code) :**

| Page | Cas | Comportement |
|------|-----|--------------|
| `/onboarding` | mode demo (no Supabase) | Affiche `t.onboarding_demo_disabled` |
| `/onboarding` | user sans `player_members` | Affiche `t.onboarding_no_player` (avec lien GameMaster) |
| `/journey` | `data.empty || !data.player` | Affiche `t.journey_empty_account` |
| `/journey` | `missions.length === 0` | Affiche `t.journey_no_missions` |
| `/journey` | `deliverables.length === 0` | Affiche `t.journey_no_deliverables` |
| `/journey/deliverable/[id]` | template introuvable | `notFound()` (Next 404) |
| `/journey/deliverable/[id]` | user sans `player_members` | `notFound()` |
| `/journey/deliverable/[id]` | mode demo | Affiche `t.submission_demo_disabled` |

**Audit RLS basique (visuel code) :**

- `app/journey/deliverable/[id]/page.tsx:148-156` : SELECT `submissions WHERE player_id = playerId AND deliverable_template_id = id`. Pour un Player A consultant un id signe par Player B, RLS + filtre WHERE retournent 0 rows -> page rend le `<SubmissionForm>` (template public). Si A tente d'INSERT, l'action calcule `playerId = membership.player_id` (PlayerA) -> insert sur PlayerA, jamais sur PlayerB. Defense-in-depth via RLS `submissions_member_self_insert (is_my_player)`.
- `app/actions.ts:submitDeliverable` : ownership check applicatif via SELECT `player_members WHERE user_id = auth.uid()` ; refus `Aucun Player rattache` si null.

**Audit debug visible :**

- Aucun `pre`, `console.log`, ou debug JSON dans le HTML rendu (`app/journey/page.tsx`, `app/onboarding/page.tsx`, `app/journey/deliverable/[id]/page.tsx`). L'ancien placeholder `user.email | role` mentionne dans le plan a deja ete remplace (Plan 02).

### Task 2 - 02-SMOKE.md

Document `.planning/phases/02-player-flow-onboarding-journey-submission/02-SMOKE.md` cree avec :

- **Prerequis** : ordre d'application SQL, comptes Auth (gm-test, player-a, player-b), seeds players + memberships SQL, verif deploy.
- **Scenario A** (onboarding PlayerA, 8 etapes) : login -> redirect /onboarding -> form -> redirect /journey -> verif SQL `onboarded_at` + `score_engagement = 10` -> idempotence.
- **Scenario B** (journey display, 5 etapes) : header (equipe/niveau/score), timeline, deliverables, audit visuel anti-leak.
- **Scenario C** (submit V1, 9 etapes) : submit URL -> readonly persist -> Zod HTTPS refusal -> re-submit refus -> proof_text variant.
- **Scenario D** (RLS, 9 etapes) : PlayerB ne voit pas PlayerA, isolement SQL verifie, insert PlayerB n'affecte pas PlayerA.
- **Scenario E** (anti-leak, 7 etapes) : audit visuel + view source + counts SQL (1 event, 6 missions, 9 templates).
- **Recap final** : tableau PASS/FAIL/timestamp + procedure FAIL + cleanup post-test.

Document auto-suffisant : Omar peut l'executer sans relire les plans.

### Task 3 - Checkpoint smoke test (auto-approved)

Mode FULL AUTO active. Le checkpoint `human-verify` est auto-approuve : la procedure SMOKE.md est livree comme artifact executable. L'execution reelle aura lieu durant la phase UAT avant le 13 mai 2026 8h30 (cf prereq `Deploy Vercel + Supabase prod fresh + comptes test`).

`Log : Auto-approved checkpoint - smoke test execution deferred to UAT phase. SMOKE.md is the deliverable.`

## Decisions Made

- **Auto-approved checkpoint Task 3** : conformement a la directive FULL AUTO, le smoke test ne s'execute pas en live ici. Le livrable est `02-SMOKE.md`, pas le rapport PASS/FAIL.
- **Pas de modifications dans les composants journey/submission** : Plans 02 et 03 ont deja centralise leurs strings dans `lib/i18n.ts`. Audit confirme aucune chaine inline restante user-facing.
- **i18n EN parallele aux ajouts FR** : meme si l'app est mono-locale FR au pilote, `lib/i18n.ts` est typed `as const` et le dictionnaire EN doit avoir les memes cles que FR sous peine d'erreur TS. Toutes les nouvelles cles sont presentes dans les deux dictionnaires.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npm run typecheck` : PASS (clean)
- `npm run lint` : PASS (clean)
- `npm run build` : PASS (10 routes, /journey 2.53 kB / 108 kB First Load, /journey/deliverable/[id] 3.52 kB / 109 kB, /onboarding 3.64 kB / 110 kB)
- 02-SMOKE.md presence des 5 scenarios A-E : verified `node -e ...` -> `ok`
- Anti-leak grep : `app/`, `components/`, `utils/`, `middleware.ts` -> 0 matches sur les 4 partenaires + `atlas-soil`. Seuls les commentaires de `lib/seed/*` (DATA-03 banners) mentionnent ces noms.

## Authentication Gates

None.

## Phase 2 Handoff

Phase 2 est livree integralement (Plans 01-05). Etat final pour Phase 3 (Mentor flow) :

- **Onboarding** : middleware gate + form + saveOnboarding + i18n (Plan 01).
- **Journey** : page server-rendered avec header / timeline / deliverables, dual-mode (Plan 02).
- **Submission V1** : action serveur + page detail + form + readonly (Plan 03).
- **Event seed** : Hack-Days SQL idempotent (Plan 04).
- **Polish** : i18n complet + smoke test procedure (Plan 05, ce document).

Requirements Phase 2 cloturees :
- ONBOARD-02, ONBOARD-03 (Plan 01)
- JOURNEY-01, JOURNEY-02, JOURNEY-03 (Plan 02)
- SUBMIT-01, SUBMIT-02, SUBMIT-04 (Plan 03)
- EVENT-01, EVENT-02 (Plan 04)
- DATA-03 (Plan 04 + audit Plan 05)

Pre-requis pour Phase 3 (Mentor) :
- Table `evaluations` deja dans schema (Plan 01 foundation).
- Etat `feedback_received` deja gerable cote Player (banniere V2 Phase 3).
- Action `evaluateSubmission` a ecrire en Phase 3.

## Self-Check: PASSED

- FOUND: lib/i18n.ts (nav_*, onboarding_demo_disabled, onboarding_no_player, onboarding_header_subtitle, onboarding_diagnostic_legend, onboarding_member_unnamed, onboarding_submitting in both fr and en dicts)
- FOUND: components/app-shell.tsx (uses t.nav_*, t.brand_name, t.tagline)
- FOUND: components/onboarding-form.tsx (uses t.onboarding_q1..q5, t.onboarding_team_name, t.onboarding_idea, etc.)
- FOUND: app/onboarding/page.tsx (uses t.onboarding_title, t.onboarding_demo_disabled, t.onboarding_no_player, t.onboarding_header_subtitle)
- FOUND: .planning/phases/02-player-flow-onboarding-journey-submission/02-SMOKE.md (5 scenarios)
- FOUND commit: 5392eda (Task 1)
- FOUND commit: 36fe069 (Task 2)
