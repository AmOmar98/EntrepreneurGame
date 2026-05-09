# Entrepreneur Game

## What This Is

L'Entrepreneur Game est la plateforme d'accompagnement entrepreneurial gamifiée de l'EIC/UEMF. Elle transforme le parcours d'incubation en niveaux progressifs (0-7), missions concrètes, livrables évaluables, scores et badges, tout en gardant le projet réel des participants au centre. Cible : porteurs de projets étudiants/doctorants/chercheurs, mentors, jurys et partenaires de l'écosystème EIC.

## Core Value

Permettre à 6-15 équipes réelles de vivre un Hack-Days 2 jours (13-14 mai 2026) où chaque livrable produit pendant les ateliers est soumis, évalué et noté en ligne, avec un classement final calculé et publié — sans perte de données, sans honte devant les partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace).

## Current Milestone: v0.2 EIC Design v2 Refresh

**Goal :** Appliquer le design v2 EIC complet (bundle Claude Design `.planning/design-v2/`) sur l'app v0.1 pilot-ready — refonte visuelle qui transforme l'app de fonctionnelle-mais-fade à digne des partenaires UEMF/EIC, sans casser la fonctionnalité v0.1. Qualité avant timing, pas de deadline.

**Target features (4 phases) :**

- **Design system EIC** — `eic-tokens.css` (palette bleu `#1B3A5C` + vert `#2E7D32` + ivoire `#F6F1E8`), polices Baskervville (titres) + Montserrat (corps), glass effect (`backdrop-filter: blur+saturate`), primitives partagées (boutons, pills, cards, level badges), refonte AppShell, login branded avec partenaires
- **Joueur** — barre de charge verticale L0→L7 (montante mobile, descendante desktop), hero « Prochaine étape » unique + drawer livrables au hover/clic, onboarding 3 étapes éditoriales (bienvenue/équipe/règles), écran SOUMIS avec stamp éditorial, écran révision V2 avec bandeau « aucune perte d'XP »
- **Mentor** — pas de chat live ; commentaires async tagués (`remarque` / `à corriger`) sur le lien soumis, vue lien (URL ou texte), historique des liens, action attendue avec composer
- **GameMaster + Jury + Replay + Pixel** — mode live + radar salle (cercles XP qui pulsent par activité), focus équipe éditorial (filigrane numéroté + Baskervville), annonces live ciblées, mode pitch jury théâtre (timer 5 min + grille /5 critères), replay/podium fin de hack, mascotte Pixel floating bottom-right (4 humeurs : serein/concentré/inquiet/euphorique)

**Source de vérité design** : `.planning/design-v2/` (bundle Claude Design exporté 2026-05-08, voir `chats/chat1.md` pour l'historique d'itérations utilisateur).

**Approche** : chaque phase commit atomique → fallback v0.1 garanti à tout moment via `git reset --hard v0.1-pilot-ready`. Pas de descope sous pression : on prend le temps nécessaire pour livrer chaque phase proprement.

## Requirements

### Validated

(Aucun formellement validé — v0.1 = pilot-ready, validation au pilote 13-14 mai)

### Active

**Bloc v0.1 — pilot-ready (validation au pilote 13-14 mai 2026) :**

- [x] **M1** — Auth Supabase réelle (login email/password, sessions persistantes SSR) — Phase 1
- [x] **M2** — Création comptes Players en bulk par GameMaster via upload CSV (magic link) — Phase 4
- [x] **M3** — Onboarding Player (Niveau 0) : profil équipe, idée courte, diagnostic initial 5 questions — Phase 2
- [x] **M4** — Event configuré « Hack-Days Fès-Meknès Mai 2026 » avec 6 missions et ~9 deliverable_templates seed — Phase 1
- [x] **M5** — Vue Player `/journey` : niveau, score Projet, timeline ateliers, liste livrables avec statuts — Phase 2
- [x] **M6** — Soumission de livrable (proof_url https:// OU proof_text markdown) avec versioning V1/V2 — Phase 2
- [x] **M7** — Vue Mentor `/mentor` : liste Players, évaluation selon scoring rubric, feedback textuel, 3 verdicts — Phase 3
- [x] **M8** — Boucle V1→V2 : feedback visible Player, soumission V2, score final = score V2 — Phase 3
- [x] **M9** — Vue GameMaster `/admin` : dashboard cohorte (Player / Niveau / Score / Statut / Prochain livrable) — Phase 4
- [x] **M10** — Pitch jury jour 2 : page `/jury` avec 5 critères × 20 points, classement calculé, page `/results` — Phase 5
- [x] **M11** — Branding EIC minimal : logo, palette, page accueil avec partenaires — Phase 4 (v0.2 push plus loin)
- [x] **M12** — Persistence Supabase + RLS minimal correct, server actions non silencieuses — Phase 1+5

**Bloc v0.2 — EIC Design v2 Refresh (mode qualité, sans deadline) :**

- [ ] **DSY-*** — Design system EIC : tokens, polices, glass, primitives, AppShell, login branded (Phase 6, voir `REQUIREMENTS.md`)
- [ ] **PLR-*** — Joueur : barre charge verticale, drawer livrables, onboarding 3 étapes, ticket SOUMIS, révision V2 (Phase 7)
- [ ] **MNT-*** — Mentor : commentaires async sur lien, tags, historique, composer V2 (Phase 8)
- [ ] **GMR-*** — GameMaster + jury + replay + Pixel : live mode, radar, jury théâtre, podium, mascotte (Phase 9)

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

- **Timeline** : v0.1 pilot-ready (toutes fonctions MUST opérationnelles). v0.2 = refonte qualité sans deadline ; sera shippée quand prête, l'app v0.1 reste utilisable en prod tant que v0.2 n'est pas mergée.
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
| 2026-05-09 — Lancer milestone v0.2 (design v2 EIC) en mode qualité sans deadline | Le design v2 (bundle Claude Design 2026-05-08) est significativement supérieur à v0.1 pour la crédibilité partenaires ; chaque phase commit atomique = fallback v0.1 garanti à tout moment | — In progress (v0.2 démarrée) |
| 2026-05-09 — Numérotation phases continue (Phase 6, 7, 8, 9) sans `--reset-phase-numbers` | v0.1 non formellement archivée via `/gsd-complete-milestone` ; on préserve les artefacts `.planning/phases/01-*` à `05-*` | — Done |
| 2026-05-09 — Source de vérité design v2 = `.planning/design-v2/` (extraction du tar.gz Claude Design) | Bundle export figé, peut diverger du canvas source ; le code se base sur les fichiers locaux pas sur l'URL Anthropic | — Done |

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
*Last updated: 2026-05-09 — milestone v0.2 EIC Design v2 Refresh started. v0.1 pilot-ready préservé, design source = `.planning/design-v2/`.*
