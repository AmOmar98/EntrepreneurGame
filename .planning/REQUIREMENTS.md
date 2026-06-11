# Requirements — Entrepreneur Game

**Defined:** 2026-06-11
**Milestone:** v0.4 Scale Foundation
**Core Value:** Plateforme d'accompagnement entrepreneurial gamifiée EIC/UEMF, personnalisable par bootcamp/programme via un éditeur GameMaster no-code — jalons (missions, livrables, niveaux, barèmes) modifiables sans dev ni redéploiement.

**Sources** :
- Council scale 5-rounds : `.planning/research/entrepreneur-game-scale/round-5-synthesis-design.md` (Phase A)
- Décisions Omar 2026-06-11 (7 questions cadrage, cf. `PROJECT.md` § Key Decisions)
- SEED-001 (schemas v2 / moteur validation), SEED-002 (E2E mentor+jury)

**Archives** : v0.1 → `milestones/v0.1-REQUIREMENTS.md` (incluant traceability v0.1/v0.2) · v0.2 → `milestones/v0.2-REQUIREMENTS.md` · v0.3 → `milestones/v0.3-REQUIREMENTS.md` (8/9, DIGI-08 → OPS-02)

> Note numérotation : `JURY-01..05` consommés en v0.1 — la grille jury paramétrable v0.4 démarre à `JURY-06`.

---

## v0.4 Requirements

### TENANT — Modèle multi-tenant

- [ ] **TENANT-01** : Le schéma DB introduit `organizations` ; chaque event appartient à une organisation (hiérarchie `organization → event → cohort → mission → deliverable_template`)
- [ ] **TENANT-02** : RLS strict inter-org — un utilisateur (Player/Mentor/GM) de l'org A ne peut lire aucune donnée de l'org B
- [ ] **TENANT-03** : Le GM peut désigner explicitement l'event « actif » — fin de la convention implicite `starts_at` le plus récent (`lib/pitch-mode.ts` et équivalents)
- [ ] **TENANT-04** : Les events archivés (AgreenTech, Digi) restent consultables en lecture seule, données et classements intacts (pas de migration big-bang)

### ENGINE — Mission engine no-code (éditeur GM)

- [ ] **ENGINE-01** : Le GM peut créer/éditer/désactiver une mission (titre, niveau, ordre, date programmée, kind) depuis `/admin` sans SQL
- [ ] **ENGINE-02** : Le GM peut créer/éditer un deliverable_template (titre, description, rubric critères/labels/max, max_score, is_bonus, ordre, activation) via un éditeur de barème
- [ ] **ENGINE-03** : Le GM peut cloner un event existant (missions + livrables + réglages) vers un nouvel event en un clic
- [ ] **ENGINE-04** : Le GM peut créer un event + cohorte (slug, nom, dates) depuis l'admin
- [ ] **ENGINE-05** : Les comportements par livrable sont data-driven — `composer_kind`, `template_url`, `auto_validate` en colonnes remplacent tous les slugs codés en dur (`HARD_BLOCK_DEPENDENCIES`, `MOSCOW_DELIVERABLE_SLUG`, `lib/template-links.ts`, UUID G01 du trigger auto-eval)
- [ ] **ENGINE-06** : Le GM peut définir une recommandation `soft_recommends_before` entre livrables, rendue en hint ambre non bloquant côté Player (R3 conforme — aucun hard-block configurable)
- [ ] **ENGINE-07** : Toute logique calendrier (`scheduled_date`) est simulable à une date arbitraire en smoke (leçon incident BMC J1 Digi)

### LEVELS — Niveaux data-driven

- [ ] **LEVELS-01** : La structure des niveaux (nombre, IDs, noms, ordre) est définie en table par programme — plus d'enum PG `level_id`
- [ ] **LEVELS-02** : Migration de `players.current_level` + `missions.level_id` de l'enum vers la nouvelle référence sans perte de données PROD (migration multi-étapes)
- [ ] **LEVELS-03** : L'UI lit labels/ordres depuis la DB — suppression des maps TS `LEVEL_LABELS`/`LEVEL_ORDS`/`SHORT_LABELS`/`LEVEL_IDS` et des `z.enum` miroirs
- [ ] **LEVELS-04** : Le GM peut renommer/réordonner/ajouter/retirer des niveaux d'un programme dans l'éditeur

### JURY — Grille jury paramétrable

- [ ] **JURY-06** : Les critères de pitch (nombre, libellés, barème max) sont définis par event en DB (remplace les colonnes figées `pitch_scores.c1..c5`)
- [ ] **JURY-07** : Le formulaire `/jury` rend dynamiquement les critères de l'event
- [ ] **JURY-08** : Le calcul des classements (`lib/results.ts`) absorbe les critères dynamiques en préservant les classements archivés (hack rétro-compat 4/5 critères)
- [ ] **JURY-09** : Le GM édite la grille jury dans l'éditeur

### SETTINGS — Scoring paramétrable

- [ ] **SETTINGS-01** : Règles XP (+100/+50/+100), paliers engagement (100/25/50) et caps stockés en `event_settings` éditables par event
- [ ] **SETTINGS-02** : Pondération projet/pitch (défaut 0.2/0.8) paramétrable par event
- [ ] **SETTINGS-03** : Les triggers PL/pgSQL (`recalc_player_score`, `recalc_player_engagement`) lisent les mêmes paramètres que les helpers TS — zéro double hardcode
- [ ] **SETTINGS-04** : Le GM édite ces réglages dans l'éditeur

### VALID — Moteur validation v2 (SEED-001)

- [ ] **VALID-01** : Chaque deliverable_template porte des `validation_rules [{rule, severity, message}]` structurellement warn-only — R2 encodé dans le moteur, `severity: "error"` impossible côté Player
- [ ] **VALID-02** : L'exception hard-block L2 (`prep-questions-v1` → `fiches-entretien-v1`) reste l'unique cas codé, non exposée ni généralisable dans l'éditeur

### QUAL — Qualité full council

- [x] **QUAL-01** : Vitest couvre les server actions critiques (soumission, évaluation, éditeur, clonage) avec tests verts
- [x] **QUAL-02** : Playwright E2E couvre 5 flows — onboarding, soumission livrable, éval mentor, pitch jury, export GM (absorbe SEED-002)
- [ ] **QUAL-03** : CI GitHub Actions — typecheck + lint + build + tests en gate sur chaque push
- [ ] **QUAL-04** : Sentry capte les erreurs serveur/client en prod avec alerting
- [ ] **QUAL-05** : PostHog trace le funnel produit (completion par livrable, drop-offs)
- [ ] **QUAL-06** : Perf test seed 500 users — P95 des queries mesuré, RLS initplan `(SELECT auth.uid())` vérifié

### OPS — Consolidation + tech debt v0.3

- [ ] **OPS-01** : `database/` consolidé comme source de vérité alignée PROD (drift résorbé : 2 functions PROD-only sourcées, grants divergents) — **pré-requis avant tout refactor schéma**
- [ ] **OPS-02** : DIGI-08 clarifié et clos (backfill `pitch_scores` post-event ou publish pré-event 15/05 confirmé suffisant)

### JULY — Event de juillet 2026

- [ ] **JULY-01** : L'event de juillet est créé intégralement via le mission engine (zéro seed SQL) — preuve de personnalisation réelle
- [ ] **JULY-02** : Cohorte juillet provisionnée (Players/Mentors/Jurys) via l'admin
- [ ] **JULY-03** : Freeze + preflight J-2 exécutés (`docs/PILOT-PREFLIGHT.md`) avec smoke des 3 surfaces aux dates simulées de l'event

## Future Requirements (v0.5+)

### Phase B council — Pédagogie DE-24

- **DE24-01** : Les 27 livrables DE-24 (5 gaps P0, Effectuation L0 `bird-in-hand-v1`/`affordable-loss-v1`, refactors)
- **DE24-02** : Carte DE-24 UI (Player advanced + Mentor + GM)
- **DE24-03** : Simulateurs what-if (Unit Economics, Pricing, TAM)

### Phase C council — IA + Transformation

- **AI-01** : RAG corpus pgvector + 5 modes AI scaffolder (Diagnoste, Exemples, Socratique, Prep-mentor, Simulator)
- **TRANS-01** : Transformation Score 3 dimensions (Skills/Traction/Self-Efficacy)
- **WAPP-01** : WhatsApp bot notifications + Q&A

### Phase D council — Service design + transparence

- **SDES-01** : Journey Map + Transformation Dashboard + Theory of Change Report PDF
- **PUB-01** : Pages publiques `/methodology` + `/transparency` + `/partners`
- **BRAND-06** : White-label branding avancé par tenant (logo, couleurs, domaine custom)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hard-block configurable entre livrables dans l'éditeur | **R3 — décision Omar 2026-06-11** : seul `soft_recommends_before` est exposé ; l'exception L2 reste un cas codé unique |
| Migration des events archivés vers le nouveau modèle | Archives gelées lecture seule — aucune perte de données tolérable, classements archivés intacts |
| Contenu pédagogique DE-24 (27 livrables) | Phase B council → v0.5 ; v0.4 livre le moteur avec le catalogue Digi actuel |
| AI scaffolder / Transformation Score / WhatsApp | Phase C council → v0.6+ |
| Business model / tiers / pricing | Out-of-scope council (décision utilisateur round 5) |
| i18n EN/AR, PWA, app stores | Phase F council |
| Catégorie B post-mortem (cleanup Supabase Studio) | Session manuelle Omar dans l'UI Studio — hors capacité agent (fallback : filtre `mgmt-api` watcher) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OPS-01 | Phase 13 | Pending |
| OPS-02 | Phase 13 | Pending |
| QUAL-01 | Phase 13 | Complete |
| QUAL-02 | Phase 13 | Complete |
| QUAL-03 | Phase 13 | Pending |
| TENANT-01 | Phase 14 | Pending |
| TENANT-02 | Phase 14 | Pending |
| TENANT-03 | Phase 14 | Pending |
| TENANT-04 | Phase 14 | Pending |
| LEVELS-01 | Phase 14 | Pending |
| LEVELS-02 | Phase 14 | Pending |
| LEVELS-03 | Phase 14 | Pending |
| ENGINE-01 | Phase 15 | Pending |
| ENGINE-02 | Phase 15 | Pending |
| ENGINE-03 | Phase 15 | Pending |
| ENGINE-04 | Phase 15 | Pending |
| ENGINE-05 | Phase 15 | Pending |
| ENGINE-06 | Phase 15 | Pending |
| ENGINE-07 | Phase 15 | Pending |
| LEVELS-04 | Phase 15 | Pending |
| VALID-01 | Phase 15 | Pending |
| VALID-02 | Phase 15 | Pending |
| JURY-06 | Phase 16 | Pending |
| JURY-07 | Phase 16 | Pending |
| JURY-08 | Phase 16 | Pending |
| JURY-09 | Phase 16 | Pending |
| SETTINGS-01 | Phase 16 | Pending |
| SETTINGS-02 | Phase 16 | Pending |
| SETTINGS-03 | Phase 16 | Pending |
| SETTINGS-04 | Phase 16 | Pending |
| QUAL-04 | Phase 17 | Pending |
| QUAL-05 | Phase 17 | Pending |
| QUAL-06 | Phase 17 | Pending |
| JULY-01 | Phase 18 | Pending |
| JULY-02 | Phase 18 | Pending |
| JULY-03 | Phase 18 | Pending |

**Coverage:**
- v0.4 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-11*
*Last updated: 2026-06-11 after initial definition (cadrage v0.4)*
