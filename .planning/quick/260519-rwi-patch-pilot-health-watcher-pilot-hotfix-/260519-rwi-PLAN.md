---
quick_id: 260519-rwi
title: Patch pilot-health-watcher + pilot-hotfix-prepper pour Digi-Hackathon
date: 2026-05-19
mode: quick (no advisor needed — `.claude/agents/` hors zones cardinales R1/R2/R3)
---

# Quick Plan 260519-rwi

## Goal

Réaligner les 2 agents de monitoring pilote sur le Digi-Hackathon (mer 20 → ven 22 mai 2026) — actuellement hardcodés AgreenTech 13-14 mai 2026, donc retombent en `OFF-PILOT` demain matin.

## Out of scope

- Refactor structurel (paramétrer la fenêtre via fichier de config) → backlog post-Digi
- Toucher au workflow d'exécution des agents → patch in-place lignes ciblées seulement
- Ajouter de nouveaux checks J3-spécifiques (pitch jury, /results leak) → backlog ; le watcher continue avec les mêmes checks sur J3

## Tasks

### Task 1 — Patch `pilot-health-watcher.md`

**File:** `.claude/agents/pilot-health-watcher.md`

Edits ciblés :

1. **Frontmatter `description`** (ligne 3-9) : remplacer « AgreenTech (13-14 mai 2026) » par « Digi-Hackathon (20-21-22 mai 2026) » et garder le mécanisme `/loop 15m`.
2. **Section "Cadre de mission" ligne 14** : remplacer « AgreenTech J1/J2 » par « Digi-Hackathon J1/J2/J3 ».
3. **Section "1. Initialisation" lignes 28-30** : étendre la logique JOUR pour 3 dates :
   ```
   JOUR = J1 si date == 2026-05-20
        sinon J2 si date == 2026-05-21
        sinon J3 si date == 2026-05-22
        sinon "OFF-PILOT"
   ```
4. **Section "Garde-fous absolus" ligne 139** : mettre à jour le message OFF-PILOT (pas de changement de logique, juste texte).
5. **Section "Contexte qui peut t'aider" lignes 144-145** :
   - Cohort : `10 Players (P01-P10)` + `2 Mentors` + `3 Jury placeholders` + `GameMasters` (cf. memory `project_digi_hackathon_13_deliverables.md`)
   - Tag rollback : `v0.2.1-pre-digi` (commit `e764cae`) au lieu de `v0.2-pilot-ready`.

**Verify:** `grep -c "AgreenTech\|13-14 mai\|2026-05-13\|2026-05-14" .claude/agents/pilot-health-watcher.md` doit retourner `0`.

**Done:** `grep -c "Digi-Hackathon\|2026-05-20\|2026-05-21\|2026-05-22" .claude/agents/pilot-health-watcher.md` doit retourner `≥5`.

### Task 2 — Patch `pilot-hotfix-prepper.md`

**File:** `.claude/agents/pilot-hotfix-prepper.md`

Edits ciblés :

1. **Frontmatter `description`** (ligne 3-10) : remplacer « AgreenTech (13-14 mai 2026) » par « Digi-Hackathon (20-21-22 mai 2026) ».
2. **Section "Cadre de mission" ligne 15** : remplacer « AgreenTech J1/J2 » par « Digi-Hackathon J1/J2/J3 ».
3. **Variables `${JX}` dans les commit messages et reports** : pas de changement (les variables sont génériques).
4. **Section "zone cardinale R1/R2/R3" lignes 67-75** : pas de changement (les chemins sont valables Digi aussi).

**Verify:** `grep -c "AgreenTech\|13-14 mai" .claude/agents/pilot-hotfix-prepper.md` doit retourner `0`.

**Done:** `grep -c "Digi-Hackathon" .claude/agents/pilot-hotfix-prepper.md` doit retourner `≥2`.

### Task 3 — Smoke + commit atomique

- `npm run typecheck` (sanity check repo état général — aucun TS touché, attendu vert)
- `git add .claude/agents/pilot-health-watcher.md .claude/agents/pilot-hotfix-prepper.md`
- `git commit -m "(quick-260519-rwi) chore(pilot-agents): rewindow watcher+prepper for Digi-Hackathon J1/J2/J3 (20-22 mai)"`

## Cardinal check

- **R1** : N/A — agents de monitoring, pas de surface Player.
- **R2** : N/A — pas de validators touchés.
- **R3** : N/A — pas de logique de blocage Player.
- **`database/**`** : non touché.
- **`lib/types.ts`** : non touché.
- **`lib/seed/`** : non touché.

Conclusion : pas d'advisor `eic-pedagogical-advisor` requis.

## Risk

- **Risque très bas** : 2 fichiers de définition d'agents `.claude/agents/*.md`, aucune logique runtime affectée tant que les agents ne sont pas spawnés. Si quelque chose est cassé, le watcher écrit juste un mauvais nom de fichier — détectable au premier tick.
- **Rollback** : `git revert HEAD` chirurgical.

## Done = ship

Push origin main attendu après typecheck OK (default = ship + push policy, cf. CLAUDE.md).
