# Entrepreneur Game

## What This Is

L'Entrepreneur Game est la plateforme d'accompagnement entrepreneurial gamifiée de l'EIC/UEMF. Elle transforme le parcours d'incubation en niveaux progressifs (0-7), missions concrètes, livrables évaluables, scores et badges, tout en gardant le projet réel des participants au centre. Cible : porteurs de projets étudiants/doctorants/chercheurs, mentors, jurys et partenaires de l'écosystème EIC.

## Core Value

Permettre à 6-15 équipes réelles de vivre un Hack-Days 2 jours (13-14 mai 2026) où chaque livrable produit pendant les ateliers est soumis, évalué et noté en ligne, avec un classement final calculé et publié — sans perte de données, sans honte devant les partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace).

## Requirements

### Validated

(Aucun pour le moment — le pilote 13-14 mai validera M1-M12)

### Active

**Bloc MUST — non-négociable pour 13 mai 8h30 :**

- [ ] **M1** — Auth Supabase réelle (login email/password, sessions persistantes SSR)
- [ ] **M2** — Création comptes Players en bulk par GameMaster via upload CSV (magic link)
- [ ] **M3** — Onboarding Player (Niveau 0) : profil équipe, idée courte, diagnostic initial 5 questions
- [ ] **M4** — Event configuré « Hack-Days Fès-Meknès Mai 2026 » avec 6 missions et ~9 deliverable_templates seed
- [ ] **M5** — Vue Player `/journey` : niveau, score Projet, timeline ateliers, liste livrables avec statuts
- [ ] **M6** — Soumission de livrable (proof_url https:// OU proof_text markdown) avec versioning V1/V2
- [ ] **M7** — Vue Mentor `/mentor` : liste Players, évaluation selon scoring rubric, feedback textuel, 3 verdicts (validé / V2 demandée / rejeté)
- [ ] **M8** — Boucle V1→V2 : feedback visible Player, soumission V2, score final = score V2
- [ ] **M9** — Vue GameMaster `/admin` : dashboard cohorte (Player / Niveau / Score / Statut / Prochain livrable)
- [ ] **M10** — Pitch jury jour 2 : page `/jury` avec 5 critères × 20 points, classement calculé, page `/results` avec publication contrôlée 15h00
- [ ] **M11** — Branding EIC : logo, palette UEMF, page accueil avec partenaires, polish 5 écrans clés
- [ ] **M12** — Persistence Supabase + RLS minimal correct, suppression du leak seed prod, server actions non silencieuses

**Bloc SHOULD — tenté jour 4-5 :**

- [ ] **S1** — Notifications in-page (badge non-lus quand Mentor évalue)
- [ ] **S2** — Score Engagement calculé serveur (présence onboarding, rendu V1, V2, dans temps imparti)
- [ ] **S3** — Schema multi-event (event_id partout, levels 0-7 référencés) prêt sans coder le multi
- [ ] **S4** — Page Ressources statique (gabarits BMC, Personae, etc.)

### Out of Scope

**Reportés à V2 (Project B post-pilote) :**

- Score Entrepreneur multi-axes (Hard/Soft/Mindset) — V2
- Badges automatiques + page badges — V2
- Classements multiples (général/progression/impact/engagement) — V2 ; pilote = 1 seul classement
- Rôles Expert et Comité programme distincts — V2 ; pilote fusionne dans Mentor/GameMaster
- Bonus events / Malus / prestige XP — supprimés du code, V2 pour réintroduction propre si besoin
- Mailto draft à la soumission — supprimé, remplacé par S1
- Exports avancés (committee dossier, EML, kpi-snapshot) — supprimés, on garde 1 export `players.csv`
- Pages `/committee`, `/admin/game`, `/admin/startups` — supprimées
- Tests automatisés, CI, observabilité, rate limiting — V2
- Audit log — table existe, écriture non livrée
- Multi-cohort actif — V2 (schema prévoit)
- Mobile-first deep — pilote responsive minimal

## Context

**Codebase héritée** : Next.js 15 App Router, React 19, TypeScript, Tailwind, Supabase SSR, Zod. Mode dual demo/prod via `lib/supabase-status.ts`. Server actions centralisés dans `app/actions.ts`. Données seed dans `lib/data.ts` (1285 lignes). Schema Postgres dans `database/`.

**Dette technique connue** (cf `.planning/codebase/CONCERNS.md`) : duplication d'actions `Flow`/non-Flow, monolithic `lib/data.ts`, demo seed qui leak en mode Supabase, server actions silencieuses, RLS pilot-grade buggué, math XP côté client falsifiable, exports lisent toujours le seed, lucide-react `^1.14.0` mauvais pin, pas de tests, pas de CI.

**Brief produit** : `entrepreneur_game_brief.md` (Section 18.1 « Bootcamp 2-3 jours ») — fourni par Omar le 2026-05-08. Décrit la vision complète Niveaux 0-7, scoring multi-dim, rôles (Joueur/Mentor/Expert/Jury/GameMaster), gamification (badges, classements multiples), feedback V1→V2.

**Programme événement** : `Programme Hack'Days 16&17 Avril 2026.pdf` (Tamwilcom, modifiable) — 6 ateliers jour 1 + pitch+résultats jour 2. Mapping ateliers ↔ niveaux du brief documenté dans `docs/superpowers/specs/2026-05-08-entrepreneur-game-pilot-design.md` §2.

**Spec de design complet** : `docs/superpowers/specs/2026-05-08-entrepreneur-game-pilot-design.md` (issue de brainstorming structuré 2026-05-08).

## Constraints

- **Timeline** : 13 mai 2026 8h30 → premier Player se logue. Toute fonction MUST doit marcher à cette date. T-5 jours au moment de l'écriture.
- **Tech stack** : Next.js 15 + React 19 + TypeScript + Supabase + Vercel (figés, héritage codebase).
- **Équipe** : solo dev (Omar) avec Claude Code en pair. Triple casquette : code + setup pilote + animation workshop le 13. Pas de débogage en live possible.
- **Volume pilote** : 6-15 Players, 2-4 Mentors, 1 GameMaster — concurrence max ~30 sessions.
- **Hosting** : Vercel (gratuit, déploiement Next.js natif). Supabase pour DB+Auth (projet déjà créé).
- **Budget** : 0€ infra (tiers gratuits Vercel + Supabase suffisent au volume pilote).
- **Sécurité** : RLS minimal correct (Player ne voit pas autres Players). Pilot-grade accepté ailleurs. Aucune perte de données tolérable.
- **Crédibilité partenaires** : aucune mention « démo » apparente, aucun seed (`atlas-soil` etc.) ne doit fuiter en prod. Branding EIC professionnel attendu.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Décomposer en Project A (5j pilote) + Project B (4-8 sem post-pilote) | Scope total irréaliste en 5j ; le pilote sert de terrain de découverte au V2 | — Pending (à valider après pilote) |
| Refondre le data model autour des primitives du brief (Niveau, Mission, Submission V1/V2, Score multi-dim) plutôt que garder Stage/Checkpoint/Bonus | Le code actuel est une 1ère tentative imparfaite ; le brief est la vérité produit | — Pending |
| Renommer `Startup` → `Player`, `coach` → `Mentor`, `eic_admin` → `GameMaster` | Aligner code+UI sur le vocabulaire du brief produit | — Pending |
| Supprimer du code : `BonusEvent`, `bonusRules`, `prestige_xp`, `Checkpoint`, `MaturityPhase`, `Stage` enum, pages `/committee`, `/admin/game`, `/admin/startups`, mailto drafts, exports avancés | Réduire surface de bug pour le pilote ; ces concepts seront repensés en V2 si pertinents | — Pending |
| Hosting : Vercel + Supabase prod | Plus rapide setup pour solo dev en 5j ; SSL auto, pas de gestion serveur | — Pending |
| Mentor = Jury au pilote (un seul rôle, accès page jury jour 2) | Économie de complexité ; cohérent avec brief Section 10 où Mentor évalue checkpoints | — Pending |
| 1 seul classement (Score Projet × pondération + PitchScore moyen), pas multi-classements | Pilote = simplicité ; multi-classement V2 | — Pending |
| Pas de tests automatisés au pilote | Solo dev en 5j ; validation par smoke test manuel J5 | ⚠️ Revisit en V2 |
| Suppression du seed leak en mode Supabase prod | Crédibilité partenaires, sécurité données pilote | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-08 after initialization (issu du brainstorming et spec design `docs/superpowers/specs/2026-05-08-entrepreneur-game-pilot-design.md`)*
