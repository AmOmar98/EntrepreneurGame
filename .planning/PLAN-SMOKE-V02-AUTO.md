---
plan: SMOKE-V02-AUTO
created: 2026-05-10
mode: full auto (Chrome DevTools MCP + fake data demo seed)
---

# Smoke Test Auto v0.2 — Plan d'exécution

## Objectif

Smoke test E2E full-auto des 3 phases v0.2 (Phase 7 Player + Phase 8 Mentor + Phase 9 GameMaster) sur le dev server local en **mode demo** (sans Supabase prod, fake data du seed in-memory `lib/data.ts`). Captures Chrome DevTools (screenshots + console + network) pour chaque surface refondue.

## Contraintes

- **Mode demo** : `.env.local` Supabase prod doit être temporairement désactivé pour bypass auth gate et utiliser le seed in-memory
- **Restoration garantie** : `.env.local` doit être restauré même en cas d'échec du test
- **Browser shared** : un seul navigateur Chrome via MCP — exécution séquentielle par agent (pas de vraie parallélisation safe)
- **Local only** : pas de modification de prod Supabase, pas de deploy

## Setup (avant test)

1. Backup `.env.local` → `.env.local.bak`
2. Créer `.env.local` vide pour forcer mode demo
3. Lancer `npm run dev` en background → URL `http://localhost:3000`
4. Wait ready (poll homepage GET 200) max 30s
5. Charger outils Chrome DevTools MCP via ToolSearch

## Surfaces à tester (12 pages)

| # | Surface | Phase | Mode | Expected |
|---|---------|-------|------|----------|
| 1 | `/` (root redirect) | v0.1 | standard | Redirect to /login en mode demo |
| 2 | `/login` | Phase 6 | standard | EIC branded login + 6-partner footer + glass card |
| 3 | `/journey` | Phase 7 | standard | Empty state ou JourneyTrack barre L0→L7 si demo seed visible |
| 4 | `/onboarding` | Phase 7 | standard | Stepper 3 étapes éditoriales (welcome / team / rules) |
| 5 | `/mentor` | Phase 8 | standard | Liste players (peut-être vide en demo) |
| 6 | `/admin` (standard) | v0.1+v0.2 | sans `?live=1` | Tableau cohorte + status banner |
| 7 | `/admin?live=1` | Phase 9 | live | Radar SVG sombre + Pixel mascot + status banner |
| 8 | `/admin/deliverables` | Phase 9 | standard | Table avec toggles is_active |
| 9 | `/admin/announce` | Phase 9 | standard | Composer 4 kinds × 4 targets |
| 10 | `/jury` (standard) | v0.1+v0.2 | sans `?theater=1` | Form pitch scores existant |
| 11 | `/jury?theater=1` | Phase 9 | théâtre | Mode théâtre fond sombre + timer 5min + grille /5 |
| 12 | `/results` | Phase 9 | standard | « Résultats à venir » (pas encore publiés en demo) |

## Captures par page

Pour chaque page, capturer :
- **Screenshot 1440x900** (desktop)
- **Screenshot 390x844** (mobile, sauf admin/jury/results qui sont gm/staff-only)
- **Console messages** (errors/warnings)
- **Network requests** (4xx/5xx)
- **Title + status code**

## Régression v0.1 à valider

- /login s'affiche (rendu Phase 6)
- /journey en mode demo n'a pas d'erreur 500
- /admin standard mode (sans `?live=1`) reste accessible
- /jury standard mode (sans `?theater=1`) reste accessible

## Cleanup (après test)

1. Stop dev server (kill background process)
2. Restore `.env.local` depuis `.env.local.bak`
3. Supprimer `.env.local.bak`

## Rapport final

Écrire `.planning/SMOKE-V02-AUTO.md` :
- Frontmatter : status (pass / fail / partial), pages_tested, pages_passed, console_errors_count, network_errors_count
- Section par surface avec screenshot path + verdict + console/network notes
- Section régression v0.1
- Recommendations finales (ship / fix / human-review)
- Liste TODOs Omar (gates pré-pilote)
