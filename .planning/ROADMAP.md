# Roadmap — Entrepreneur Game

## v0.4 Scale Foundation

**Milestone** : Scale Foundation — moteur multi-tenant + mission engine no-code + qualité full council
**Branch** : `milestone/v0.4-scale-foundation`
**Deadline** : event début juillet 2026 (freeze/preflight J-2 ~2026-07-01)
**Started** : 2026-06-11

---

## Phases

- [ ] **Phase 13: DB Consolidation + Test Infrastructure** - Résoudre le drift database/ vs PROD et installer le filet de sécurité Vitest/Playwright/CI avant tout refactor schéma
- [ ] **Phase 14: Multi-tenant Schema + Niveaux data-driven** - Migrer le schéma vers la hiérarchie org→event→cohort, supprimer l'enum level_id, poser les bases RLS inter-org
- [ ] **Phase 15: Mission Engine no-code (éditeur GM)** - Éditeur complet missions/livrables/rubrics dans /admin, dé-hardcoding des slugs, ENGINE behaviors data-driven
- [ ] **Phase 16: Jury paramétrable + Scoring configurable** - Critères jury dynamiques, event_settings XP/pondération, triggers PL/pgSQL alignés
- [ ] **Phase 17: Observabilité + Perf** - Sentry, PostHog, perf test 500 users, vérification RLS initplan
- [ ] **Phase 18: July Event — Provisioning + Freeze + Preflight** - Créer l'event juillet via le moteur, provisionner la cohorte, freeze et smoke preflight J-2

---

## Phase Details

### Phase 13: DB Consolidation + Test Infrastructure
**Goal**: La codebase a un filet de sécurité test opérationnel et `database/` est la source de vérité unique alignée sur PROD avant tout refactor schéma.
**Depends on**: Nothing (first v0.4 phase)
**Requirements**: OPS-01, OPS-02, QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. `database/schema.sql` + `database/triggers.sql` + `database/rls.sql` contiennent les 2 fonctions PROD-only et les grants divergents — appliquer `database/` sur un projet Supabase frais produit un état identique à PROD (vérifiable via diff migra ou liste functions MCP)
  2. DIGI-08 (backfill pitch_scores) est clos : verdict documenté (backfill appliqué OU confirmé non-nécessaire post-event) avec trace dans OPS-02-verdict.md
  3. Vitest est configuré et passe au moins 5 tests unitaires couvrant les server actions critiques existantes (`submitDeliverableFlow`, `reviewDeliverable`, `saveOnboardingKyc`)
  4. Playwright E2E est configuré et au moins 2 flows passent en mode demo (onboarding Player + soumission livrable)
  5. GitHub Actions CI gate tourne sur chaque push : typecheck + lint + build + vitest tests verts
**Plans**: 4 plans
Plans:
- [ ] 13-01-PLAN.md — OPS-01 drift report + 13-NEW.sql consolidation + OPS-02 DIGI-08 verdict (operator-gated source mirror)
- [x] 13-02-PLAN.md — QUAL-01 Vitest + schema extraction to lib/schemas.ts + unit tests
- [x] 13-03-PLAN.md — QUAL-02 Playwright E2E 5 demo-mode flows
- [ ] 13-04-PLAN.md — QUAL-03 GitHub Actions CI gate (typecheck/lint/build/unit/e2e)

### Phase 14: Multi-tenant Schema + Niveaux data-driven
**Goal**: Le schéma DB supporte la hiérarchie `organization → event → cohort → mission → deliverable_template`, les niveaux sont une table (plus d'enum PG `level_id`), et le RLS inter-org est strict — sans perte de données PROD.
**Depends on**: Phase 13
**Requirements**: TENANT-01, TENANT-02, TENANT-03, TENANT-04, LEVELS-01, LEVELS-02, LEVELS-03
**Success Criteria** (what must be TRUE):
  1. Table `organizations` créée, chaque event a un `organization_id` ; un Player de l'org A qui appelle n'importe quelle query RLS-filtrée ne reçoit aucune ligne de l'org B (vérifiable via deux sessions Supabase MCP avec rôles différents)
  2. L'event actif est désigné explicitement via un flag DB (ex: `events.is_active`) — la convention `order by starts_at desc limit 1` est supprimée de `lib/pitch-mode.ts` et équivalents
  3. Les events AgreenTech et Digi restent consultables en lecture seule avec leurs classements intacts — aucun row supprimé ni modifié par la migration
  4. La colonne `players.current_level` et `missions.level_id` pointent vers la nouvelle table `levels` (plus d'enum PG) — migration appliquée sur PROD sans perte de données, rollback documenté
  5. Les maps TS `LEVEL_LABELS`, `LEVEL_ORDS`, `SHORT_LABELS`, `LEVEL_IDS` sont supprimées du code ; l'UI lit labels/ordres depuis la DB ; les z.enum miroirs sont supprimés
**Plans**: TBD
**UI hint**: yes

### Phase 15: Mission Engine no-code (éditeur GM)
**Goal**: Un GameMaster peut créer, éditer et cloner un programme complet (event + missions + livrables + rubrics + paramètres) depuis `/admin` sans écrire une ligne de SQL, et tous les comportements par livrable (composer_kind, template_url, auto_validate, soft_recommends_before) sont data-driven.
**Depends on**: Phase 14
**Requirements**: ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04, ENGINE-05, ENGINE-06, ENGINE-07, LEVELS-04, VALID-01, VALID-02
**Success Criteria** (what must be TRUE):
  1. GM sur `/admin` peut créer un event + cohorte (slug, nom, dates), créer/éditer/désactiver une mission (titre, niveau, ordre, date, kind), et créer/éditer un deliverable_template (titre, description, rubric, max_score, is_bonus, ordre, activation) — zéro SQL requis
  2. GM peut cloner un event existant (missions + livrables + réglages) en un clic et obtenir un nouvel event indépendant — modification du clone n'affecte pas l'original
  3. Les colonnes `composer_kind`, `template_url`, `auto_validate` remplacent tous les slugs codés en dur : `HARD_BLOCK_DEPENDENCIES`, `MOSCOW_DELIVERABLE_SLUG`, `lib/template-links.ts` (13 URLs), UUID G01 du trigger auto-eval — grep sur ces identifiants retourne 0 match dans le code applicatif
  4. GM peut définir un `soft_recommends_before` entre livrables ; côté Player, cela rend un hint ambre non bloquant — aucun `disabled` DOM ni `pointer-events: none` ne découle d'un soft_recommends_before configurable (R3 conforme)
  5. `validation_rules [{rule, severity, message}]` sur deliverable_template sont structurellement warn-only — `severity: "error"` est impossible à créer via l'éditeur (R2 encodé dans le moteur) ; l'exception L2 hard-block reste le seul cas codé non exposé dans l'éditeur
  6. La logique `scheduled_date` peut être simulée à une date arbitraire en smoke (flag ou param) pour rejouer le scénario incident BMC J1 Digi
**Plans**: TBD
**UI hint**: yes

### Phase 16: Jury paramétrable + Scoring configurable
**Goal**: Les critères du pitch, les règles XP, les paliers d'engagement et la pondération projet/pitch sont configurables par event par le GM — sans double hardcode entre TS et PL/pgSQL.
**Depends on**: Phase 15
**Requirements**: JURY-06, JURY-07, JURY-08, JURY-09, SETTINGS-01, SETTINGS-02, SETTINGS-03, SETTINGS-04
**Success Criteria** (what must be TRUE):
  1. GM peut définir N critères de pitch (libellés, barème max) par event dans l'éditeur ; le formulaire `/jury` rend dynamiquement ces critères — fini les colonnes figées `pitch_scores.c1..c5`
  2. Les classements archivés (AgreenTech 4 critères, Digi 5 critères) restent calculables correctement avec leur schéma d'origine — rétro-compat vérifiable en relançant le calcul sur les données archivées
  3. GM peut paramétrer XP (+soumis/+reviewed/+validé), paliers engagement (seuils) et pondération projet/pitch par event depuis l'éditeur — les valeurs sont stockées dans `event_settings`
  4. Les triggers PL/pgSQL `recalc_player_score` et `recalc_player_engagement` lisent leurs paramètres depuis `event_settings` — grep sur les valeurs hardcodées `100`, `0.8`, `25`, `50` dans les fonctions SQL ne retourne aucun littéral libre (ils sont lus depuis la table)
**Plans**: TBD
**UI hint**: yes

### Phase 17: Observabilité + Perf
**Goal**: Les erreurs prod sont capturées et alertées automatiquement, le funnel produit est tracé, et la plateforme tient la charge de 500 users concurrents avec un P95 acceptable.
**Depends on**: Phase 16
**Requirements**: QUAL-04, QUAL-05, QUAL-06
**Success Criteria** (what must be TRUE):
  1. Une erreur serveur simulée (ex: action Zod invalide) apparaît dans le dashboard Sentry avec stack trace et alerte configurée (email/Slack)
  2. PostHog trace la completion par livrable et les drop-offs — un funnel "onboarding → submit → evaluate → validated" est visible dans PostHog avec données de test
  3. Perf test seed 500 users exécuté : P95 des queries critique (`/journey`, évaluation, jury) mesuré et documenté ; RLS `initplan (SELECT auth.uid())` vérifié (pas de per-row auth.uid() call)
**Plans**: TBD

### Phase 18: July Event — Provisioning + Freeze + Preflight
**Goal**: L'event de juillet 2026 existe et tourne intégralement sur le nouveau moteur, la cohorte est provisionnée, le preflight J-2 est passé avec smoke aux dates simulées de l'event — l'event peut démarrer sans intervention dev.
**Depends on**: Phase 17
**Requirements**: JULY-01, JULY-02, JULY-03
**Success Criteria** (what must be TRUE):
  1. L'event juillet est créé via l'éditeur GM (zéro seed SQL) : missions, livrables, rubrics, dates, grille jury configurés — aucun `INSERT` manuel dans Supabase Studio requis
  2. La cohorte juillet (Players, Mentors, Jurys) est provisionnée via l'admin GM — magic links envoyés, logins vérifiés
  3. Preflight J-2 exécuté selon `docs/PILOT-PREFLIGHT.md` avec smoke des 3 surfaces (Player journey + Mentor eval + GM dashboard) aux dates simulées de l'event — rapport preflight sans BLOCK
**Plans**: TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 13. DB Consolidation + Test Infrastructure | 2/4 | In Progress|  |
| 14. Multi-tenant Schema + Niveaux data-driven | 0/? | Not started | - |
| 15. Mission Engine no-code | 0/? | Not started | - |
| 16. Jury paramétrable + Scoring configurable | 0/? | Not started | - |
| 17. Observabilité + Perf | 0/? | Not started | - |
| 18. July Event — Provisioning + Freeze + Preflight | 0/? | Not started | - |

---

## Archived Milestones

### ✅ v0.3 Digi-Hackathon — archivé 2026-05-23

Tag `v0.3-pilot-shipped`. Event 3 jours livré 0 downtime, 1 hotfix, R1/R2/R3 préservés. 8/9 DIGI requirements satisfaits.

- Audit : `milestones/v0.3-MILESTONE-AUDIT.md`
- Roadmap archive : `milestones/v0.3-ROADMAP.md`
- Requirements archive : `milestones/v0.3-REQUIREMENTS.md`

### ✅ v0.2 EIC Design v2 Refresh — archivé 2026-05-11

Tag `v0.2-pilot-ready` (commit `ccdc2bc`). 4 phases (Design System / Joueur / Mentor / GameMaster), 26 plans, 23 requirements, 33 commits.

- Audit : `milestones/v0.2-MILESTONE-AUDIT.md`
- Roadmap archive : `milestones/v0.2-ROADMAP.md`
- Requirements archive : `milestones/v0.2-REQUIREMENTS.md`

### ✅ v0.1 Pilot Hack-Days Fès-Meknès — archivé 2026-05-08

Tag `v0.1-pilot-ready` (commit `8176419`). 5 phases (Foundation / Player / Mentor / GameMaster / Pitch+Deploy), 26 plans.

- Audit : `milestones/v0.1-MILESTONE-AUDIT.md`
- Phases archive : `milestones/v0.1-phases/`

---

*Last updated: 2026-06-11 — Phase 13 planned (4 plans, 3 waves). Phases 14-18 still TBD.*
