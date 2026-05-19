# MISSION RALPH — Clôture pré-pilote AgreenTech

**Objectif** : Phase 13 puis Phase 14, AVANT cutoff `2026-05-12 23h00` (T-1 main freeze).

## Contexte

- Repo : EntrepreneurGame.
- **Branche de travail** : `ralph/pre-pilot-phases-13-14` (créée depuis `88ee818` = tag `v0.2.2-pre-ralph-13`).
- **NE JAMAIS push sur `main`**. NE JAMAIS `git checkout main` ni `git merge main`. Tous les commits restent sur la branche Ralph — Omar mergera manuellement après revue.
- Tag rollback distant déjà posé : `v0.2.2-pre-ralph-13` (Ralph n'a pas à en créer de nouveau).
- Pilote AgreenTech 13-14 mai 2026 — solo dev (Omar), triple casquette.
- Cardinaux EIC stricts :
  - **R1** : score/rang invisible côté Player.
  - **R2** : validators warn-only.
  - **R3** : zéro blocage inter-mission codé en dur.
- Sources de vérité :
  - `.planning/ROADMAP.md` (Phase 13 & 14)
  - `.planning/phases/13-smoke-completion-phase11-gates-bug-annexes/`
  - `.planning/phases/14-scoring-engagement-livrables/14-CONTEXT.md`
- Policy ship+push : commits atomiques (1 sub-task = 1 commit) → `git push origin ralph/pre-pilot-phases-13-14` (ou `git push origin HEAD`) immédiat après chaque `npm run typecheck && npm run lint && npm run build` clean.

## Ordre d'exécution (sériel, ne pas sauter)

### ═══ PHASE 13 — Smoke Completion + Phase 11 Gates + Bug Annexes ═══

**Wave A — Smoke E2E critique (J1 14h CRITIQUE)**

- **13-01** : SEED-002 M01 mentor batch 27 submissions (rubric 5×5=25 + validate_v1 + request_v2) + propagation Player vérifiée.
- **13-02** : G01 `/jury` pitch_score P01 + publication `events.results_published_at = now()` + `/results` Player/GM cross-check R1.
- **13-03** : porteurs missing P03 (Fès argan) + P05 (El Hajeb compostage) + P09 (Agadir aquaponie) via subagent `porteur-projet-agreentech` (parallèle si MCP isolated dispo, sériel sinon).

**Wave B — Phase 11 gates closeout (polish)**

- **13-04** : G1 visual review prod + G4 GM radar dashed lines (couplés screenshot `05-admin-radar.png`).
- **13-05** : G2 reduced-motion Playwright 5 routes → `G2-REDUCED-MOTION.md`.
- **13-06** : G3 mobile 390×844 Playwright `/journey` + `/results` + `/landing` → `G3-MOBILE-390.md`.

**Wave C — Quick wins bugs annexes**

- **13-07** : fix `components/app-shell.tsx` bouton logout `type="button"` (StaffShell + AppShell). Hors zone sensible.
- **13-08** : SQL diagnostic Pouls "Diagnostic 0/1" `deliverable_templates` L0_diagnostic + correction seed si nécessaire.

**Wave D — Cutoff guard**

- **13-09** : smoke régression demo mode (`/landing` → `/login` → `/journey` seed → `/results`) + audit grep R1 clean côté Player.

**Plans détaillés** : créer chaque `13-0X-PLAN.md` via `/gsd-plan-phase 13` si absent, sinon exécuter direct via `/gsd-execute-phase 13`.

### ═══ PHASE 14 — Scoring d'engagement livrables (paliers 100/25/50) ═══

**Pré-requis** : Phase 13 Wave D clean. (Pas de nouveau tag à poser — la branche `ralph/pre-pilot-phases-13-14` EST le rollback ; Omar taggera `v0.2.3-pre-phase14` lui-même au moment du merge sur main s'il le souhaite.)

- `/gsd-discuss-phase 14 --auto` : trancher
  - Q1 (visibilité Player paliers, R1)
  - Q2 (entrée ou non dans combined ranking 80/20 — défaut HORS ranking)
  - Q3 (`players.score_engagement` colonne + trigger)
  - Q5 (réversibilité si reject post-validate)
  - Q4 déjà tranchée (pré-pilote)
- `/gsd-plan-phase 14` : drafter plans (probable wave 1 migration DB, wave 2 lib/score + trigger, wave 3 UI Player + admin GM, wave 4 smoke).
- `/gsd-execute-phase 14` : exécution wave par wave.

### Cardinaux obligatoires Phase 14 (zone hyper-sensible)

1. Vérifier R1/R2/R3 manuellement AVANT chaque edit dans : `lib/score.ts`, `lib/types.ts`, `database/triggers.sql`, `app/journey/`, `app/results/`, `app/admin/`, `components/journey-*`, `components/results-*`.
2. Audit grep R1 post-edit :
   ```
   grep -rn "score\|rank\|note\|/100\|/140\|points\|toFixed" app/journey app/results components/journey-* components/results-* --include="*.tsx"
   ```
   → 0 match Player-facing.
3. Trigger DB : `score_engagement` cumulatif strict (palier atteint une seule fois par livrable), pas de double-comptage v2 ni 2e mentor.
4. Pondération `combined` 0.8 pitch + 0.2 project reste LOCKÉE sauf override explicite Q2.

## Règles transverses (toute la session)

- **Branche unique** : tous les commits sur `ralph/pre-pilot-phases-13-14`. Vérifier avec `git branch --show-current` au début de chaque itération. Si une autre branche est checkout, FAIRE `git checkout ralph/pre-pilot-phases-13-14` immédiatement.
- 1 sub-task = 1 commit atomique + `git push origin HEAD` immédiat (pousse sur la branche courante = `ralph/pre-pilot-phases-13-14`).
- Préfixe commit : `(13-0X-slug)` ou `(14-discuss/plan/execute)`.
- Avant toute édition zone sensible (Player-facing) : revue manuelle R1/R2/R3.
- Préserver dual-mode demo (`hasSupabaseEnv()` check) — jamais `redirect("/login")` ou `getCurrentUser()` avant le check.
- Si `npm run typecheck` ou `npm run build` fail : 1 tentative de fix, sinon revert l'edit, log dans `BLOCKED.md`, continue.
- À la fin de chaque phase : écrire `SUMMARY.md` avec SHA des commits + lister `BLOCKED.md` éventuel.
- **Pas de tag à poser** par Ralph. Omar tagguera après merge manuel sur main.
- **Pas de merge ni de PR créé par Ralph.** À la fin, rapporter "Branche prête pour revue Omar : `ralph/pre-pilot-phases-13-14` à `<sha>`".

## Critères d'arrêt Ralph

- **Cutoff atteint** `2026-05-12 23h00` (stop forcé, rapport status dans `RALPH-FINAL.md`).
- **Phase 13 + Phase 14 toutes deux closed** avec SUMMARY.md → écrire `PHASE-14-DONE` dans le rapport final pour déclencher la completion-promise.
- **`npm run build` fail** persistant après revert — log et continue (ne pas stopper la session).
- **Max-iterations atteint** (géré par flag CLI).

GO.
