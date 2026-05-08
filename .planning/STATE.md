# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-08)

**Core value** : Permettre à 6-15 équipes réelles de vivre le Hack-Days 13-14 mai 2026 — chaque livrable d'atelier soumis, évalué, noté en ligne, classement publié — sans perte de données et sans honte devant les partenaires.

**Current focus** : Phase 1 — Foundation (Schema + Types + Suppression code obsolète)

## Active Milestone

**v0.1 — Pilot Hack-Days Fès-Meknès (13-14 mai 2026)**

Project A : 5 phases sur 5 jours (J1=09/05 → J5=13/05). Délivre les 12 MUST. SHOULD (4 items) tentés J5 après-midi si buffer.

## Phase Status

| Phase | Goal | Status | Date prévue |
|---|---|---|---|
| 1 | Foundation (schema, types, suppression code mort, login) | not_started | 2026-05-09 |
| 2 | Player Flow (onboarding, journey, submission V1) | not_started | 2026-05-10 |
| 3 | Mentor Flow (évaluation, V1→V2, scoring) | not_started | 2026-05-11 |
| 4 | GameMaster + bulk import + branding | not_started | 2026-05-12 |
| 5 | Pitch jury + results + déploiement Vercel + smoke test E2E | not_started | 2026-05-13 |

## Next Action

Lancer `/gsd-plan-phase 1` pour créer le plan détaillé de la Phase 1 (Foundation).

## Critical Decisions Pending (avant J1)

Voir spec §7 — 7 décisions à confirmer rapidement :

1. Liste exacte des livrables ateliers 3, 4, 5 du PDF programme
2. Grilles de scoring par livrable (utiliser brief §5 par niveau ou simplifier §14 ?)
3. Pondération Score Projet vs Pitch dans le classement final
4. Domaine Vercel — sous-domaine ou custom EIC ?
5. SMTP magic link — défaut Supabase ou config UEMF ?
6. Assets de marque (logos EIC, UEMF, partenaires)
7. Mentor = Jury au pilote ?

## Risk Watch

- **Refactor schema** vs migration Supabase prod : décider J1 si projet Supabase fresh ou existant
- **Lucide-react `^1.14.0`** : vérifier version résolue, repinner J1
- **Magic link Supabase** : tester envoi sur Gmail/Outlook/UEMF à J4
- **Solo dev malade** : pas de mitigation tech, communication précoce EIC si problème

---

*Last updated: 2026-05-08 after roadmap creation*
