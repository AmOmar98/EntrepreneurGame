# Entrepreneur Game

## What This Is

L'Entrepreneur Game est la plateforme d'accompagnement entrepreneurial gamifiée de l'EIC/UEMF. Elle transforme le parcours d'incubation en niveaux progressifs (0-7), missions concrètes, livrables évaluables, scores et badges, tout en gardant le projet réel des participants au centre. Cible : porteurs de projets étudiants/doctorants/chercheurs, mentors, jurys et partenaires de l'écosystème EIC.

## Core Value

Permettre à 6-15 équipes réelles de vivre un Hack-Days 2 jours (13-14 mai 2026) où chaque livrable produit pendant les ateliers est soumis, évalué et noté en ligne, avec un classement final calculé et publié — sans perte de données, sans honte devant les partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace).

## Current State

**Shipped** : v0.3 Digi-Hackathon (20-22 mai 2026, livré 2026-05-23, tag `v0.3-pilot-shipped`)

**PROD** : https://entrepreneur-game-six.vercel.app — 22 auth.users Digi-Hackathon (10P + 5M + 3J + 4GM)

## Current Milestone: v0.4 Scale Foundation

**Goal :** Transformer la plateforme mono-event seedée en SQL en moteur multi-programme personnalisable par bootcamp via un éditeur GameMaster no-code — validé en réel sur l'event de début juillet 2026.

**Target features :**
- Modèle multi-tenant `organization → event → cohort → mission → deliverable_template` + RLS strict inter-org
- Mission engine no-code : éditeur GM complet (missions, livrables, rubrics, barèmes, dates, ordre, activation) + clonage de programme
- Niveaux data-driven : migration enum `level_id` → table éditable par programme (fin du triple miroir PG/TS/Zod)
- Grille jury paramétrable par event (refonte `pitch_scores` c1..c5)
- Scoring/pondérations en `event_settings` (règles XP, paliers engagement, pondération projet/pitch, caps)
- Dé-hardcoding des slugs : composer_kind, template_url, auto-validation, `soft_recommends_before` + moteur validation v2 warn-only structurel (SEED-001)
- Qualité full council : Vitest actions critiques + Playwright E2E 5 flows (SEED-002) + CI gates + Sentry + PostHog + perf test 500 users
- Pré-requis bloquant : consolidation `database/` vs PROD (drift 2 functions) avant tout refactor schéma
- Tech debt v0.3 : DIGI-08 (backfill pitch_scores) + smoke E2E post-event
- Event juillet : provisioning sur le nouveau moteur + freeze + preflight J-2 (`docs/PILOT-PREFLIGHT.md`)

**Key context (décisions Omar 2026-06-11) :** deadline dure ~3 semaines (event début juillet sur le nouveau moteur — risque accepté) · archives AgreenTech/Digi gelées en lecture seule (pas de migration big-bang) · R1/R2/R3 + dual-mode demo préservés · **R3 : soft recommends only, AUCUN hard-block configurable dans l'éditeur** (exception L2 reste cas codé unique) · contenu pédagogique DE-24 (27 livrables) → v0.5 · branche de travail `milestone/v0.4-scale-foundation` · base design : council scale 5-rounds (`.planning/research/entrepreneur-game-scale/round-5-synthesis-design.md`, Phase A).

<details>
<summary>Archive v0.3 Digi-Hackathon</summary>

**Goal livré** : Pilote Digi-Hackathon (3 jours, 20-22 mai 2026) sur base PROD AgreenTech (v0.2-pilot-ready) restructurée 13 livrables alignés 8 PDFs Welcome Guide. Mode T-1. Event 0 downtime, 1 hotfix mineur (j2-bmc-access), R1/R2/R3 préservés. 8/9 DIGI requirements satisfaits.

Scope cardinal : 13 livrables (5 bonus) sur 7 missions M1→M7, exception R3 unique L2 hard-block (signée Omar 19/05), reskin Digi, one-pagers PDF cohorte. ~20 quicks dans `.planning/quick/`.

Cohorte post-AgreenTech : 10 équipes (Simock/Graph-Anomal/Shihty+/AddictLess/NAFAS/MedNova/HASSANA/MindBot/FokusMind/Bla Dwa), 5 mentors, 3 jurys placeholder.

Archives : `milestones/v0.3-MILESTONE-AUDIT.md`, `milestones/v0.3-ROADMAP.md`, `milestones/v0.3-REQUIREMENTS.md`.
</details>

**Milestones précédents archivés** : v0.1 (tag `v0.1-pilot-ready`), v0.2 (tag `v0.2-pilot-ready`), v0.3 (tag `v0.3-pilot-shipped`).

## Requirements

### Validated

**Bloc v0.1 + v0.2 + v0.3 — validés en réel sur 2 pilotes (AgreenTech 13-14 mai, Digi-Hackathon 20-22 mai 2026) :**

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

**Bloc v0.2 — EIC Design v2 Refresh (livré, tag `v0.2-pilot-ready`) :**

- [x] **DSY-*** — Design system EIC : tokens, polices, glass, primitives, AppShell, login branded (Phase 6)
- [x] **PLR-*** — Joueur : barre charge verticale, drawer livrables, onboarding 3 étapes, ticket SOUMIS, révision V2 (Phase 7)
- [x] **MNT-*** — Mentor : commentaires async sur lien, tags, historique, composer V2 (Phase 8)
- [x] **GMR-*** — GameMaster + jury + replay + Pixel : live mode, radar, jury théâtre, podium, mascotte (Phase 9)

**Bloc v0.3 — Digi-Hackathon (livré, tag `v0.3-pilot-shipped`, 8/9 DIGI)** — archives `milestones/v0.3-*.md`.

### Active

**Bloc v0.4 — Scale Foundation** : requirements détaillés dans `.planning/REQUIREMENTS.md` (catégories TENANT / ENGINE / LEVELS / JURY / SETTINGS / VALID / QUAL / OPS / EVENT).

### Out of Scope

**Reportés à v0.5+ (décisions cadrage v0.4, 2026-06-11) :**

- Contenu pédagogique DE-24 : les 27 livrables (5 gaps P0, Effectuation L0, refactors), carte DE-24 UI, simulateurs what-if — Phase B council → v0.5
- AI scaffolder (5 modes), Transformation Score, WhatsApp bot — Phase C council → v0.6+
- Journey Map / Theory of Change Report / pages publiques / white-label branding avancé — Phase D council
- Hard-block configurable entre livrables dans l'éditeur — **interdit** (R3, décision Omar 2026-06-11) ; seul `soft_recommends_before` est exposé
- Migration des events archivés (AgreenTech, Digi) vers le nouveau modèle — gelés en lecture seule
- Business model / tiers / pricing — out-of-scope council
- i18n EN/AR, PWA, app stores — Phase F council

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
| 2026-06-11 — v0.4 = Phase A council complète (multi-tenant + mission engine no-code + qualité full) | « Version finale personnalisable par bootcamp » ; le council 5-rounds (8f3d9f0) a établi que le Pilier 1 bloque tout le reste | — Active |
| 2026-06-11 — Personnalisation 4 axes : missions/livrables/rubrics/dates + niveaux + grille jury + scoring | Chaque bootcamp/programme doit pouvoir redéfinir ses jalons sans dev ni redéploiement | — Active |
| 2026-06-11 — R3 strict dans l'éditeur : `soft_recommends_before` uniquement, aucun hard-block configurable | Généraliser l'exception L2 violerait R3 ; l'exception reste un cas codé unique | — Locked |
| 2026-06-11 — Event début juillet 2026 tourne SUR le nouveau moteur (Phase A compressée ~3 semaines) | Validation en réel de la personnalisation ; risque accepté par Omar, mitigé par freeze + preflight J-2 | — Active |
| 2026-06-11 — Archives AgreenTech + Digi gelées en lecture seule, pas de migration big-bang | Aucune perte de données tolérable ; les classements archivés (hack 4/5 critères jury) ne doivent pas bouger | — Locked |
| 2026-06-11 — Qualité full council dès v0.4 (Vitest + Playwright + CI + Sentry + PostHog + perf 500) | Build largement autonome sur zones sensibles (schéma, RLS, scoring) ; revisite la décision « pas de tests » du pilote | — Active |

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
*Last updated: 2026-06-11 — milestone v0.4 Scale Foundation started (Phase A council, branche `milestone/v0.4-scale-foundation`, deadline event début juillet 2026).*
