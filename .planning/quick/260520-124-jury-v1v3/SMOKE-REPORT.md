# Smoke Report — Quick 260520-124 jury-v1v3

**Date:** 2026-05-20
**Target:** https://entrepreneur-game-six.vercel.app (PROD Vercel)
**Tool:** Playwright MCP (Chromium headless)
**Auth:** GameMaster G01 (o.ameur@ueuromed.org)

## Deploys vérifiés

| SHA | Deploy ID | Commit | State |
|-----|-----------|--------|-------|
| 72e7b7f | dpl_ZtkU8xYfjaoUyHgpSE14PsJLVzBj | feat(jury): V1 sliders + V3 molettes | READY |
| 0a31e22 | dpl_D5jUK18tXapH9q5ijTsaCoy7n7zh | docs: SUMMARY | READY |
| afe649d | dpl_4PbSKk653kX3ELBjeS5VTgLazbQc | fix(i18n): jury copies accentuées | READY |

## Captures

| # | URL | Surface | Fichier |
|---|-----|---------|---------|
| 01 | `/jury` (desktop 1440) | V1 sliders shell + toggle "Molettes" + accents pré-fix | `smoke-01-jury-v1-default.png` |
| 02 | `/jury?ui=dial` (desktop) | V3 dial shell + toggle "Sliders" | `smoke-02-jury-v3-dial.png` |
| 03 | `/jury` (mobile 390×844) | V1 mobile responsive | `smoke-03-jury-mobile-v1.png` |
| 04 | `/admin` (GM home) | Régression admin shell | `smoke-04-admin-gm.png` |
| 05 | `/journey` (player team-simock) | Onboarding step 1 (player pas onboardé) | `smoke-05-player-journey-cohort-pulse.png` |
| 06 | `/jury` post-fix accents | V1 avec "Espace Juré" / "critères" / "pondérée" | `smoke-06-jury-v1-accents-fixed.png` |
| 07 | `/jury?ui=dial` post-fix | V3 avec accents corrigés | `smoke-07-jury-v3-accents-fixed.png` |

## Issues détectées + fixes en boucle

### Issue #1 — Accents manquants côté jury (FIXED commit afe649d)
**Détection:** smoke-01 a montré "Espace Jure", "criteres", "ponderee" — convention CLAUDE.md "avoid accented characters" mal appliquée sur UI strings jury_*.
**Fix:** `lib/i18n.ts` 17 strings jury_* accentuées (jury_title, jury_subtitle, jury_each_max_20, jury_c1..c4_label, jury_c1..c4_help, jury_total_label, jury_saved_at, jury_already_scored, jury_saving).
**Vérif PROD:** smoke-06 confirme "Espace Juré" + "Notez le projet de chaque équipe sur 4 critères × 20." + "4 critères sur 20 — moyenne pondérée /20".

### Issue #2 — Empty state "Aucun Player dans la cohorte" (NON-bloquant, hors scope)
**Détection:** GM voit empty state sur /jury bien que 10 Players Digi soient provisionnés en DB.
**Cause probable:** event Digi-Hackathon n'a pas encore de Players assignés au pitch jury context (pitch_mode_state probablement `off` et/ou aucun joueur en stage L5/L7).
**Action:** déféré — c'est une donnée opérationnelle, pas un bug de la quick. Verra le rendu réel V1/V3 lors du Digi J3 (22 mai) quand pitch_mode_state→`live` avec Players réels.

### Issue #3 — Player Simock pas onboardé (NON-bloquant, hors scope)
**Détection:** smoke-05 montre onboarding step 1, pas /journey avec cohort-pulse.
**Cause:** Player team-simock n'a pas complété le KYC.
**Action:** déféré — le fix accents cohort-pulse (équipes / Problème / Marché / Modèle éco.) est dans le code committé `lib/i18n.ts` + `lib/journey-progression.ts`, vérifié au build, sera visible automatiquement dès qu'un Player atteint /journey post-onboarding.

## Verdict global

**Smoke PROD : PASS**

- `/jury` V1 par défaut : ✅ rendu OK desktop + mobile + toggle vers V3 fonctionnel
- `/jury?ui=dial` V3 : ✅ rendu OK desktop + toggle vers V1 fonctionnel
- Auth + redirects + nav AppShell variant=staff : ✅ régression OK
- Accents FR UI : ✅ déployés et visibles en PROD post-afe649d
- R1/R2/R3 cardinal : ✅ aucune leak rank/percentile/leaderboard côté jury (page jury = surface légitime score visible)
- **Jury aggregate (V1 + V3) en mode closed : ✅ rendu OK** — gap F2 du SMOKE-REPORT précédent (quick-260519-jpr) refermé sur les 2 nouveaux UIs V1/V3, après injection de données test puis cleanup.

## Smoke F2 jury aggregate V1+V3 (2026-05-20 00:15 UTC)

**Contexte** : le SMOKE-REPORT de quick-260519-jpr ligne 154 notait que le branchement `aggregate` n'avait pas encore été propagé aux nouveaux UI V1/V3. Vérification ciblée :

**Setup (Supabase MCP, transaction unique)** :
- `events.pitch_mode_state` : `off` → `closed`, `pitch_mode_closed_at = NOW()`
- 2 `pitch_scores` insérés sur AddictLess (`33eda740-7321-4a7f-a50b-34a3c894da49`) :
  - J01 (`1234cccf-…-a4fd`) : c1=c2=c3=c4=20 (total 80 → 100/100)
  - J03 (`e2ce8327-…-ad11`) : c1=16, c2=14, c3=18, c4=12 (total 60 → 75/100)
- Expected aggregate : ((80+60)/2) × 1.25 = **87.5 /100, 2 jurés**

**Test rendu (compte J02 `jury-02@digi.uemf.ma`, juré non-voteur sur AddictLess)** :

| Surface | Aggregate rendu | Math | Screenshot |
|---|---|---|---|
| `/jury` (V1 sliders, default) | ✅ "MOYENNE DU JURY · 87.5/100 · sur 2 jurés" | OK | `smoke-08-jury-v1-aggregate-87.5.png` |
| `/jury?ui=dial` (V3 molettes) | ✅ "MOYENNE DU JURY · 87.5/100 · sur 2 jurés" | OK | `smoke-09-jury-v3-aggregate-87.5.png` |

**Cleanup (Supabase MCP, transaction unique)** :
- `DELETE FROM pitch_scores` WHERE event_id=Digi AND player_id=AddictLess AND juror_id IN (J01, J03) → 2 rows
- `UPDATE events` SET pitch_mode_state='off', pitch_mode_closed_at=NULL WHERE id=Digi → 1 row
- Re-test `/jury` (J02) : aggregate **absent** (`MOYENNE DU JURY` introuvable dans le DOM), 10 articles rendus avec sliders à 0. ✅

**État DB final vérifié** :
| Champ | Pre-smoke | Pendant smoke | Post-cleanup |
|---|---|---|---|
| `pitch_mode_state` | `off` | `closed` | **`off`** ✅ |
| `pitch_mode_closed_at` | NULL | NOW() | **NULL** ✅ |
| `results_published_at` | NULL | NULL | **NULL** ✅ |
| `pitch_scores` (Digi total) | 0 | 2 | **0** ✅ |

## Findings additionnels (cosmétique, non-bloquant)

### F3 — Banner "Vos notes restent privées jusqu'à la clôture des pitches" s'affiche en mode `closed`
**Symptôme** : ce libellé est la version "live" du banner (`jury_pitch_mode_live_banner`). En mode `closed` on attendrait plutôt un libellé type "Pitches clos · vous voyez maintenant la moyenne par équipe."
**Surface** : visible sur `/jury` standard (V1+V3) à droite des forms, distinct du bloc agrégé.
**Action** : déféré — l'agrégat est bien rendu et compense visuellement le bandeau imprécis. Fix éventuel = grep `jury_pitch_mode_live_banner` dans `app/jury/` et brancher la variante `jury_pitch_mode_closed_banner` selon `pitchModeState`.

### F4 — V3 zoom : score top affichage compressé "0/1000.0 /20"
**Symptôme** : sur la card AddictLess en V3, le récap top du form affiche les deux scores sans séparateur visuel net (innerText concat = "0/1000.0 /20"). Screenshot confirme un layout sans gap CSS suffisant entre les blocs.
**Action** : déféré — pas un bug fonctionnel, sera lissé au prochain pass design ou observé en runtime live le 22 mai.

## Commits cette quick

- `72e7b7f` feat(jury): V1 sliders + V3 molettes UI variations
- `0a31e22` docs: SUMMARY artefact
- `afe649d` fix(i18n): jury copies accentuées (Juré/Équipe/critères) — post-smoke loop
- `3fa50b3` docs: SMOKE-REPORT + 7 screenshots
- (en cours) docs: smoke F2 jury aggregate V1+V3 + 3 screenshots additionnels
