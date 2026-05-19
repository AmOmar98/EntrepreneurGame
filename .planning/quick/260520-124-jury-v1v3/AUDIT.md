---
quick: 260520-124-jury-v1v3
date: 2026-05-20
---

# Audit — Smoke + Guards

## Smoke automatisé
- `npm run typecheck` : **PASS** (aucune erreur TS)
- `npm run lint` : **PASS** (aucun warning/error ESLint)
- `npm run build` : **PASS** (Compiled successfully 7.3s, 20/20 pages generated, `/jury` = 7.86 kB First Load 140 kB)

## Pre-edit guards (CLAUDE.md)

### R1 — score visible
- `grep -rn "rank|classement|percentile|leaderboard" app/jury/` → **0 match** ✓
- Banner anonymat `jury_pitch_mode_live_banner` rendu dans V1 (aside récap) ET V3 (footer actions) ✓
- Aucun rang/classement entre équipes côté jury ✓

### R2 — validators warn-only
- `pitchScoreSchema` Zod **intact** (signature `savePitchScoreFlow(c1..c5)` non touchée)
- Pattern warn 0/0/0/0 client-side conservé sur V1 + V3 (severity warn, non bloquant)

### R3 — pas de blocage inter-mission
- Sans objet (zone `/jury`)

### Branding
- `grep -rn "Atlas|Maraya" app/jury/` → **0 match** ✓
- V1 + V3 utilisent `player.name` + `player.idea` réels en mode Supabase
- Mode demo : `jury_demo_disabled` ("Données indisponibles — contactez le support") = pas de mention "démo" littérale partenaire-facing

### Dual-mode demo guard
- `app/jury/page.tsx` : structure auth `getCurrentUser` + redirect login intacte (pré-existante, hors scope ce quick)
- Toggle `?ui=dial` ne déclenche aucun nouveau redirect
- `hasSupabaseEnv()` checks pour `getJuryOverview` / `getCurrentPitchModeState` / `isCurrentUserJuror` tous préservés

### Theater mode + notInvited + variant=staff
- Block `if (isTheater)` ligne 83-107 intact
- Block `if (notInvited)` ligne 54-78 intact
- `variant="staff"` AppShell sur les 3 sorties (notInvited / theater / standard) intact
- Le toggle UI V1↔V3 n'apparaît PAS sur les écrans notInvited / theater (correct — hors grille)

## Scope extension (accents français)
- `lib/i18n.ts:248` `equipes ont soumis` → `équipes ont soumis` ✓
- `lib/journey-progression.ts:37-44` SHORT_LABELS : `Probleme→Problème`, `Marche→Marché`, `Modele eco.→Modèle éco.` ✓
- `app/journey/page.tsx:185-186` `brief porteur, regles du bootcamp` → `brief porteur, règles du bootcamp` ✓
- **Convention CLAUDE.md "Avoid accented characters in code-resident strings"** : NON appliquée aux mailto/CSV/server actions (intentionnel, instruction user explicite "Maintain full orthographic correctness for french"). Seules UI strings rendues côté React touchées.

## Composants livrés
- `app/jury/jury-form.tsx` réécrit en V1 (sliders horizontaux 0-20, récap droite /100+/20, pills Faible/Moyen/Bon/Excellent, aggregate jury conservé) — 332 lignes
- `app/jury/jury-dial-form.tsx` créé en V3 (4 molettes SVG 120x120, input range invisible + boutons +/-, top recap, aggregate jury conservé) — 391 lignes
- `app/jury/page.tsx` modifié : `searchParams.ui`, toggle header discret `eic-button` (sliders/molettes), swap conditionnel V1↔V3
- `app/globals.css` +18 lignes : `.eic-jury-form-v1__layout` (1fr 320px desktop / 1fr mobile), `.eic-jury-form-v3__grid` (4 cols desktop / 2 cols mobile)

## Manual smoke (à faire par Omar)
- Desktop : `/jury` (V1) + `/jury?ui=dial` (V3) → bouger sliders / molettes, total recalcule live
- Mobile 375px : V1 stack vertical, V3 grille 2x2
- Theater mode `/jury?theater=1` inchangé
- notInvited screen (mentor non-invité) inchangé
- GameMaster voit toujours la grille
- Submit V1 + V3 : `savePitchScoreFlow` enregistre, message OK

## Verdict
**PASS** — Prêt pour commit + push origin/main.
