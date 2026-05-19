---
quick_id: 260519-rwi
title: Patch pilot-health-watcher + pilot-hotfix-prepper pour Digi-Hackathon
date: 2026-05-19
status: completed
commit: <PENDING>
---

# Summary

## Résultat

2 agents de monitoring pilote réalignés sur le Digi-Hackathon (mer 20 → ven 22 mai 2026). Sans ce patch, demain matin (J1), tout invocation du `pilot-health-watcher` retombait en `OFF-PILOT` — Omar perdait la vigie technique pendant qu'il anime les workshops.

## Fichiers modifiés

| Fichier | Lignes touchées | Nature |
|---|---|---|
| `.claude/agents/pilot-health-watcher.md` | ~10 lignes (frontmatter, intro, init JOUR, OFF-PILOT garde-fou, contexte cohort+tag) | Patch in-place |
| `.claude/agents/pilot-hotfix-prepper.md` | 2 lignes (frontmatter + intro) | Patch in-place |

## Changements clés

### Watcher (`pilot-health-watcher.md`)

1. **Frontmatter `description`** : « AgreenTech (13-14 mai 2026) » → « Digi-Hackathon (20-21-22 mai 2026) ».
2. **Intro corpus** : J1/J2 → J1/J2/J3.
3. **Init JOUR** (le plus important) : étendu sur 3 dates :
   - J1 = 2026-05-20
   - J2 = 2026-05-21
   - J3 = 2026-05-22
   - autre → OFF-PILOT
4. **Note J3** ajoutée : vendredi 22/05 = jour pitch jury → surveiller spike `/results` et `/jury` (cardinal R1 = score Player invisible hors page détail livrable).
5. **Garde-fou "Hors fenêtre"** : libellé J1/J2 → J1/J2/J3.
6. **Section "Contexte qui peut t'aider"** :
   - Cohort : 11P → 10P (cohorte `cohorte-digi-mai-2026`), event_id stable `hack-days-fes-meknes-mai-2026`.
   - Tag rollback prioritaire : `v0.2.1-pre-digi` (commit `e764cae`), avec `v0.2-pilot-ready` (commit `ccdc2bc`) en filet de sécurité.
   - Exception faux-positif `database/seed_event_digi_hackathon.sql` : ce fichier a été realigné PROD-via-MCP le 19/05 (commit `740c4cb`) — si advisor le signale seul, vérifier le SHA avant escalade HARD.

### Prepper (`pilot-hotfix-prepper.md`)

1. **Frontmatter `description`** : « AgreenTech (13-14 mai 2026) » → « Digi-Hackathon (20-21-22 mai 2026) ».
2. **Intro corpus** : J1/J2 → J1/J2/J3.

Le reste du prepper (workflow LÉGER/LOURD × cardinal, gates 3 étapes, smoke rollback auto) n'a pas bougé — il était déjà event-agnostic une fois le contexte d'invocation à jour.

## Cardinaux R1/R2/R3

- **R1** : N/A — agents `.claude/agents/`, pas de surface Player.
- **R2** : N/A — pas de validators.
- **R3** : N/A — pas de logique de blocage Player.

Pas d'advisor `eic-pedagogical-advisor` requis (zone hors cardinaux).

## Smoke

- `npm run typecheck` ✓ (clean — aucun TS touché).
- `npm run lint` non exécuté (markdown only, hors scope ESLint).
- `npm run build` non exécuté (markdown only).
- Sanity grep :
  - `pilot-health-watcher.md` : 0 mention `AgreenTech|13-14 mai|2026-05-13|2026-05-14`, 6 tokens `Digi-Hackathon|2026-05-2X`.
  - `pilot-hotfix-prepper.md` : 0 mention `AgreenTech|13-14 mai`, 2 tokens `Digi-Hackathon`.

## Verdict

✅ READY pour J1 mer 20/05 09h00. Le watcher peut être invoqué via `/loop 15m use pilot-health-watcher subagent to run JX health tick` dès demain matin et produira un fichier `J1-HHhMM-tick.md` correct.

## Out of scope (deferred)

Cf. `deferred-items.md` — refactor "fenêtre paramétrée via fichier de config" backloggué pour post-Digi (Option B de la review initiale).

## Commit

`(quick-260519-rwi) chore(pilot-agents): rewindow watcher+prepper for Digi-Hackathon J1/J2/J3 (20-22 mai)`

SHA : à renseigner après push.
