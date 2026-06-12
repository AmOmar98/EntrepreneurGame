# Round 5 — Synthèse design + plan d'exécution

**Date** : 2026-05-23
**Inputs** : Rounds 1-4 (research foundations, benchmark + controverse, DE-24 mapping, IA/sim/service design)
**Décisions utilisateur validées** :
- Pas de business model maintenant (tiers/pricing exclus du scope)
- DE-24 adopté + adapté (mapping + pivot framing user-centred + transformation)
- Tous les 5 gaps P0 à combler (segmentation, beachhead, lifecycle, validate core, key assumptions, dogfooding)
- Carte DE-24 oui, push traction rapide via user-centred design + client transformation
- Mission engine no-code = très prioritaire
- Effectuation L0 obligatoire pour tous
- AI scaffolder 5 modes en parallèle (architecture commune)
- **Transformation Score + XP coexistent** (deux couches, pas de choix)

## 1. Vision produit redéfinie

> **Entrepreneur Game V1.0 (scale)** est une plateforme d'accompagnement entrepreneurial gamifiée structurée par **Disciplined Entrepreneurship (Aulet/MIT)**, ancrée dans une **logique effectuale** (Sarasvathy), avec une **double-couche mesure** : engagement XP + transformation outcomes. Elle scale via un **moteur missions no-code multi-tenant** alimenté par un **AI scaffolder cohort+mentor** propriétaire.

Une seule phrase qui résume :
- Méthodologie : DE-24 + Effectuation + UCD + Theory of Change
- Mesure : XP gamif + Transformation Score
- Scalabilité : multi-tenant + mission engine + AI commune
- Différenciation : corpus propriétaire + mentor humain + ancrage MA/Afrique

## 2. Les 7 piliers du design

### Pilier 1 — Multi-tenant + Mission Engine no-code (foundation)
**Problème actuel** : seed SQL hardcoded par event. Impossible de servir +1 event en parallèle sans dev.

**Cible** :
- Modèle DB : `organization → event → cohort → mission → deliverable_template`
- RLS multi-tenant strict (porteur org A ne voit pas org B)
- GameMaster UI : **mission engine builder** = créer/cloner/composer parcours en pickant des blocs DE-24 + extras (Effectuation, Design Thinking, BMC, …)
- Branding white-label par tenant (logo, couleurs, domaine custom)

**Livrables** : schéma DB, RLS, UI builder mission, branding config, migration des 2 events existants (Digi + AgreenTech archivés)

### Pilier 2 — Refonte parcours autour DE-24 + Effectuation L0 + 5 gaps P0
**Cible parcours type "long format" (3-6 mois)** mappé sur DE-24 :

| Level | Step DE | Livrable | Notes |
|---|---|---|---|
| **L0_diagnostic** | (pré-DE) | `bird-in-hand-v1` ⭐ NOUVEAU | Effectuation ouverture |
| L0 | (pré-DE) | `affordable-loss-v1` ⭐ NOUVEAU | Effectuation continuation |
| **L1_problem** | DE-1+2 | `segmentation-beachhead-v1` ⭐ NOUVEAU | Gap P0 #1 |
| L1 | DE-3 | `end-user-profile-v1` ⭐ NOUVEAU | Distingo EUP/Persona Aulet |
| L1 | DE-5 | `persona-v1` ✅ existant | Persona principal beachhead |
| L1 | DE-3 (bonus) | `design-thinking-v1` ✅ existant | DT Empathize |
| L1 | DE-20 | `key-assumptions-v1` ⭐ NOUVEAU | Gap P0 #4 — 5 hypothèses critiques |
| **L2_solution** | DE-3+9 | `prep-questions-v1` ✅ existant | |
| L2 | DE-9 | `fiches-entretien-v1` ✅ existant | 10 entretiens, hard-block |
| L2 | DE-6 | `lifecycle-use-case-v1` ⭐ NOUVEAU | Gap P0 #2 — service journey complet |
| L2 | DE-8 | `value-prop-quant-v1` ⭐ NOUVEAU | Bénéfices CHIFFRÉS |
| **L3_market** | DE-4 | `tam-beachhead-v1` ✅ refactor de `marche-technique-v1` partie sizing |
| L3 | DE-15 | `bmc-v1` ✅ existant | BMC Osterwalder = business model exo |
| L3 | DE-10 | `validate-core-v1` ⭐ NOUVEAU | Gap P0 #3 — moat / barrière |
| L3 | DE-11 | `competitive-position-v1` ✅ existant fusion `positionnement-v1` + `comparaison-v1` |
| **L4_business_model** | DE-7 | `product-spec-v1` ✅ refactor de `marche-technique-v1` partie stack |
| L4 | DE-12 | `dmu-v1` ⭐ NOUVEAU | Decision-Making Unit |
| L4 | DE-13 | `acquisition-process-v1` ✅ refactor de `commercialisation-v1` partie funnel |
| L4 | DE-16 | `pricing-framework-v1` ⭐ NOUVEAU | Pricing strategy explicite |
| L4 | DE-17+19 | `unit-economics-v1` ✅ existant + **what-if simulator** |
| L4 | DE-18 | `sales-process-scale-v1` ✅ refactor `commercialisation-v1` partie canaux |
| L4 | DE-22 | `mvbp-v1` ✅ refactor `moscow-v1` partie MVP |
| L4 | DE-21 | `test-assumptions-v1` ⭐ NOUVEAU | Plan d'expérimentations |
| **L5_pitch** | DE-23 | `dogfooding-proof-v1` ⭐ NOUVEAU | Gap P0 #5 — preuve réelle |
| L5 | DE-24 | `product-plan-v1` ✅ refactor `moscow-v1` partie V1/V2/V3 + follow-on |
| L5 | (post-DE) | `techniques-pitch-v1` ✅ existant | |
| L5 | (post-DE) | `pitch-deck-v1` ✅ existant | |

**Bilan** : 27 livrables (vs 15 actuels), 100% des 24 DE steps couverts + Effectuation + DT + Pitch + dogfooding. Cible "long format" 3-6 mois. Le mission engine permet de **sous-définir** des parcours courts (Hack-Days = subset 10-15 livrables).

### Pilier 3 — Double couche mesure : XP + Transformation Score
**Décision Round 4 + ajustement utilisateur** : on garde les deux.

**Couche engagement (XP)** — existante, à préserver :
- XP par livrable (max 25), bonus, streaks hebdo, badges, leagues intra-cohorte
- Toujours respecter R1 (Player voit son score uniquement sur détail livrable, jamais rang)
- Trigger Duolingo-like : push notification streak, confettis validation, badges

**Couche transformation (Transformation Score)** — nouvelle :
- 3 dimensions chacune 0-100
  - **Skills** : DE-24 step coverage validated (X/24 × 100, pondéré gravité)
  - **Traction** : poids progressif `dogfooding-proof-v1` (40), `fiches-entretien-v1` (15), `mvbp-v1` (15), `pre-orders / LOI / paying customers` (30) selon preuves uploadées
  - **Self-Efficacy** : échelle De Noble 5 items, T0 (onboarding) + T+event + T+3M + T+12M, normalisée 0-100
- Visible Player **sur détail livrable propre** uniquement (cohérent R1 strict)
- Dashboard Mentor : agrégation équipe + delta T0→Tcourant
- Dashboard GameMaster : agrégation cohort
- Rapport Theory of Change : exportable PDF pour Tamwilcom/UM6P/EIC partenaires (Activities → Outputs → Outcomes → Impact)

### Pilier 4 — AI Scaffolder (5 modes, architecture commune)
**Architecture** :
```
Corpus RAG (Postgres pgvector + Supabase)
├─ Welcome Guides PDFs indexés
├─ Livrables validated anonymisés (10k+ visés long terme)
├─ DE-24 rubrics + steps full text
├─ Méthodologie EIC publique
└─ Transcripts entretiens terrain anonymisés (opt-in)

LLM provider via Vercel AI Gateway (Anthropic Claude Haiku 4.5 par défaut, Opus pour modes complexes)

Multi-mode prompts (1 prompt par mode, contexte commun) :
├─ Mode 1 DIAGNOSTE   : score livrable draft + 3 feedback points
├─ Mode 2 EXEMPLES    : recall top-3 livrables similaires validés
├─ Mode 3 SOCRATIQUE  : hints sans donner la réponse (chain-of-questions)
├─ Mode 4 PREP-MENTOR : digest hebdo équipe — qui patine, sur quoi, suggestions
└─ Mode 5 SIMULATOR   : what-if calculator wrapper (sliders Unit Eco) + interprétation

Canaux d'exposition :
├─ Web chat dans `app/journey/deliverable/[id]/` (Player)
├─ Dashboard Mentor `/mentor/team/[id]/digest` (Prep-mentor)
└─ WhatsApp bot (notifications + Q&A — phase 2)
```

**Garde-fous éthique/qualité** :
- Toutes les outputs IA marquées "AI-generated, à valider" (transparence)
- Mode Diagnoste = pré-score indicatif, **n'écrit pas dans `evaluations`** (mentor humain seul autorisé)
- Mode Exemples = anonymisation stricte (LLM scrub avant indexation)
- Logs RAG retrievals pour audit + amélioration
- Opt-out user pour mode Socratique (certains préfèrent direct answer)

### Pilier 5 — Service-Design Lens (refonte UX)
**Inspiration** : Theory of Change MIT D-Lab + Journey-Centric Design NN/g.

**Principes appliqués** :
1. Tout livrable cadré comme une **étape de service** (input du porteur, output validé, valeur perçue)
2. Tout mentor touchpoint cadré comme **interaction service** (préparation, exécution, follow-up)
3. **Journey map Player** intégrée à `/onboarding` : "voici ton parcours visualisé sur 6 mois, voici les transformations attendues"
4. **Outcome dashboard** Player en complément du livrable-board (montre où tu vas, pas juste où tu es)

**Livrables** :
- Composant `<JourneyMap />` SVG + animations subtiles
- Composant `<TransformationDashboard />` visualisant Skills/Traction/Self-Efficacy
- Composant `<TheoryOfChangeReport />` export PDF partenaires

### Pilier 6 — Qualité opérationnelle (le strict minimum pour scale)
**Trous existants** (Codebase analysis) :
- 0 test automatisé (`*.test.*` absent du repo)
- Observability artisanale (`pilot-health-watcher` agent manuel)
- RLS "pilot-grade" non audité
- Perf RLS non mesurée à >100 users

**Cible scale minimale** :
- Vitest unit tests sur `app/actions.ts` (toutes les actions critiques)
- Playwright E2E sur les 5 user flows critiques (onboarding, soumission livrable, eval mentor, pitch jury, GameMaster export)
- Sentry pour errors + alerting webhook Slack/WhatsApp
- PostHog pour product analytics (funnel completion, drop-off par livrable)
- RLS audit externe (peer review code + Supabase advisor full run)
- Perf test : seed 500 users, mesurer P95 queries

### Pilier 7 — Pédagogie publique + DE-24 visible + Transformation Report
- Page publique `/methodology` : DE-24 + Effectuation + UCD + Theory of Change explicit
- Page publique `/transparency` : Theory of Change visuelle + métriques agrégées cohorts (anonymisées)
- Page partenaires `/partners` : export PDF Transformation Report par cohorte/événement
- Article blog signature "Pourquoi nous avons adopté Disciplined Entrepreneurship + Effectuation" (Omar)

## 3. Roadmap phasée (proposition)

### Phase A — Foundation (2-3 mois)
> **Pré-requis structurel**. Aucune nouvelle valeur produit visible Player.
1. Multi-tenant DB + RLS
2. Mission engine no-code (UI builder GameMaster)
3. Migration events existants Digi + AgreenTech vers nouveau modèle
4. Tests automatisés baseline + CI gates
5. Observability (Sentry + PostHog)

### Phase B — Pédagogie élargie (2-3 mois)
> **Nouvelle valeur Player visible**. Refonte parcours.
6. 12 nouveaux livrables (5 gaps P0 + 2 effectuation + 5 refactor)
7. Mapping carte DE-24 UI (Player advanced + Mentor + GameMaster)
8. What-if simulators (Unit Eco, Pricing, TAM)

### Phase C — IA + Transformation (2-3 mois)
> **Différenciation produit forte**. AI scaffolder + outcomes.
9. RAG corpus (ingestion + pgvector + retrievals)
10. 5 modes AI scaffolder (Diagnoste, Exemples, Socratique, Prep-mentor, Simulator)
11. Transformation Score 3 dimensions
12. WhatsApp bot (notifications + Q&A)

### Phase D — Service Design + Transparence (1-2 mois)
> **Polish, pédagogie publique, partenaires.**
13. Journey Map + Transformation Dashboard UI
14. Theory of Change Report PDF export
15. Pages publiques `/methodology` + `/transparency` + article signature
16. Branding white-label per tenant
17. Recrutement & calibration mentors pool (process)

### Phase E — Hardening & Scale (continue)
> **À chaque cohort, on apprend et on durcit.**
- Perf optim, scaling tests, RLS audit externe
- Mentor scaling chantier dédié (recrutement, formation, calibration IRR)
- Multi-tenant onboarding institution
- i18n EN + AR (post-MVP scale)

**Total estimation** : ~8-12 mois solo dev (Omar + Claude Code pair) pour A→D. E = continuous.

## 4. Risques & garde-fous

| Risque | Mitigation |
|---|---|
| Scope creep — 27 livrables c'est beaucoup | Mission engine permet **sous-définir** parcours courts. Hack-Days reste 10-15 livrables (subset). |
| AI scaffolder hallucine et donne mauvais conseil | Mode Diagnoste = indicatif only, mentor humain final. Mode Exemples = corpus validé only, pas génératif libre. |
| Transformation Score paraît "fluffy" pour partenaires | Skills + Traction = objectivement mesurables. Self-Efficacy = échelle De Noble académiquement validée + citée |
| Refonte casse pilote existant | Migration progressive : events archivés gardent ancien schéma, nouveaux events sur nouveau schéma. Pas de big-bang |
| Solo dev → 8-12 mois c'est long | Phases atomiques, chaque phase = release indépendante valeur livrée. Phase A peut shipper sans Phase B/C/D |
| Cardinal R1/R2/R3 cassé par refonte | Pre-edit guards déjà en place (CLAUDE.md). Tout nouveau livrable + UI doit passer audit R1 systematique |

## 5. Décisions reportées (backlog explicite)

- **Business model / tiers / pricing** : explicitement out-of-scope ce council
- **Mentor scaling complet** : chantier dédié post-Phase D (recrutement, formation, calibration IRR, dashboard mentor avancé)
- **i18n EN/AR RTL** : Phase F (post-MVP scale, après validation MA-FR)
- **PWA + push natives + app stores** : Phase F (mobile-first via WhatsApp suffit en Phase A-D)
- **GDPR / loi 09-08 conformité formelle** : audit légal externe à programmer Phase D (pré-scale public)
- **Marketplace mentors / open public T0 free** : Phase G (post-validation modèle pédagogique)

## 6. Ce qui change concrètement pour Omar

- **Cardinal R1/R2/R3 préservés** — aucun ne tombe dans cette refonte
- **Codebase patterns gardés** — Next 15 App Router + Server Actions + Zod + Supabase SSR + dual-mode demo
- **Méthodo GSD respectée** — chaque phase = `/gsd-execute-phase` après `/gsd-plan-phase` après `/gsd-discuss-phase`
- **Atomicité commits** — chaque mission engine block / chaque AI mode / chaque livrable refonte = commit atomique
- **Pre-edit guards** zones sensibles obligatoires

## 7. Prochaine étape

Si tu valides cette synthèse Round 5 :
- Sortir du council → entrer en mode **planning structuré** via `/gsd-new-milestone` "v0.4 — Scale Foundation"
- Premier `/gsd-discuss-phase` sur Pilier 1 (Multi-tenant + Mission Engine) car bloque tout le reste
- Le reste cascade en phases distinctes selon roadmap ci-dessus

Le council a produit 5 fichiers research dans `.planning/research/entrepreneur-game-scale/`. Ils nourriront les RESEARCH.md des phases à venir.

## Sources consolidées

Voir fichiers Rounds 1-4 dans `.planning/research/entrepreneur-game-scale/`. Document maître : ce fichier.
