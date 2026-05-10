---
quick_id: 260510-hzv
completed: 2026-05-10T00:00:00Z
commit: 340a94e
---

## Summary

CLAUDE.md pointait vers `lib/data.ts` (monolithe v0.1 de ~1285 lignes) qui n'existe plus apres le refactor v0.2 en ~22 modules cibles sous `lib/`. Les 17 occurrences ont ete remappees vers les modules reels ou retirees si le helper correspondant a disparu. Desormais chaque nouvelle session Claude Code charge une carte mentale fidelement alignee sur la structure v0.2 — eliminant le risque de diriger les modifications vers un fichier fantome a T-3 jours du pilote.

## Stats

| Metrique | Valeur |
|----------|--------|
| Occurrences `lib/data` avant | 17 |
| Occurrences `lib/data` apres | 0 |
| Symboles REMAP | 8 (AppRole, TeamRole, Profile, DeliverableStatus, navItems, LevelId-formerly-Stage, etc.) |
| Symboles REMOVE | 13+ (Checkpoint, MaturityPhase, BonusStatus, BonusType, Startup, BonusEvent, mailtoUrl, deliverableMailBody, reviewReminderBody, calculateBonusClaim, bonusRules, dashboardMetrics, xpSummary, committeeDossierRows, journeyPhases) |
| Lignes CLAUDE.md touchees | 17 (edits appliques bas-vers-haut) |
| Balises GSD avant/apres | 14 / 14 (7 paires intactes) |
| Fichiers code source touches | 0 |

## Sections touchees dans CLAUDE.md

- `### Data layer dual-mode` (L22, L25) -- seed reference vers `lib/seed/`, type ref vers `lib/types.ts`
- `### Domain types (single source of truth: lib/data.ts)` renomme en `### Domain types (lib/types.ts -- single source of truth)`
- `## Conventions > Naming Patterns` (L144, L155) -- exemples remappes vers `lib/types.ts`
- `## Conventions > Validation Pattern` (L187) -- enum source remappee vers `lib/types.ts`
- `## Conventions > Server Action Return Shape` (L192) -- reference aux helpers mailto retires
- `## Conventions > Module Design` (L220) -- entree `lib/data.ts` remplacee par `lib/types.ts` + `lib/seed/`; `lib/workflow-data.ts` retire
- `## Architecture > Pattern Overview` (L236, L238, L240) -- trois refs remappees
- `## Architecture > Layers` (L248, L259-260, L266) -- imports pages, bloc Location/Contains, export route handlers
- `## Architecture > Key Abstractions` (L281, L285, L288) -- TS source enums remappee, deux bullets bonus/mailto retires

## Sections preservees

Contenu et balises GSD intacts, byte-identiques au pre-edit :
- `## Project` (incl. `### Constraints`) -- entre GSD:project-start et GSD:project-end
- `## GSD Workflow Enforcement` -- entre GSD:workflow-start et GSD:workflow-end
- `## Developer Profile` -- entre GSD:profile-start et GSD:profile-end
- `## Technology Stack` -- entre GSD:stack-start et GSD:stack-end
- `## Project Skills` -- entre GSD:skills-start et GSD:skills-end

## Helpers supprimes decouverts

Les helpers suivants apparaissaient dans CLAUDE.md mais n'existent dans aucun fichier sous lib/, components/, app/, utils/ :

| Helper | Raison |
|--------|--------|
| mailtoUrl | Retire v0.2 -- mailto drafts construits inline dans app/actions.ts |
| deliverableMailBody | Retire v0.2 -- idem |
| reviewReminderBody | Retire v0.2 -- idem |
| calculateBonusClaim | Retire v0.2 -- scoring dans lib/score.ts |
| bonusRules | Retire v0.2 -- idem |
| journeyPhases | Retire v0.2 -- levels via lib/types.ts:LevelId + lib/seed/ |
| dashboardMetrics | Retire v0.2 -- agregats dans lib/score.ts et lib/results.ts |
| xpSummary | Retire v0.2 -- aucun export trouve |
| committeeDossierRows | Retire Phase 4 -- flow committee supprime |

Enums v0.1 remplaces/renommes :
- Stage -> LevelId (lib/types.ts:13)
- Checkpoint, MaturityPhase, BonusStatus, BonusType -> supprimes
- Startup -> remplace par Player + Cohort (lib/types.ts)
- BonusEvent -> supprime

## Follow-ups

- .planning/codebase/ARCHITECTURE.md et CONVENTIONS.md contiennent les memes references mortes lib/data.ts (confirme par grep). Prevoir un quick task separe pour les regenerer.
- lib/workflow-data.ts n'existe plus -- seul CLAUDE.md le mentionnait (corrige).
- app/actions.ts line references (ex: :160-173) dans CLAUDE.md non re-verifiees apres refactor -- a auditer si numeros de lignes ont change.
