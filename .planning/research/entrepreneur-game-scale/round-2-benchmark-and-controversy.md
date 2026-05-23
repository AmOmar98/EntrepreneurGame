# Round 2 — Benchmark + controverse self-paced vs cohort

**Date** : 2026-05-23
**Input** : Agent benchmark background (33 produits) + 6 WebSearch ciblées sur la controverse soulevée Round 1.
**Question centrale** : "Le modèle éco self-paced + IA coach peut-il battre cohort sur le scale ?"

## 1. Verdict factuel sur la controverse

| Modèle | Completion typique | Engagement DAU | Économie | Évidence empirique |
|---|---|---|---|---|
| **Pur self-paced** (MOOC Coursera/Udemy) | 6-14% | Faible | CAC bas, churn élevé | Bien établie : Class Central, Ruzuku 32k cours |
| **Pur self-paced gamifié** (Duolingo, Brilliant) | N/A (pas de "fin") | Très haute (34M DAU Duo) | Excellente (10M paid subs) | Mais : language ≠ "build a startup". Goal infini vs goal fini |
| **Pur cohort live** (Maven, altMBA, HBS Online) | 85-98% | Cyclique | CAC haut, scaling = ops-bound | Maven 14× vs Coursera ; Reforge 85% avg 2024 |
| **Hybride cohort-async + AI scaffolding** | Recherche émergente | À mesurer | Meilleur potentiel théorique | arxiv 2508.11052 (2025), case Vidi chatbot, peu de données quantitatives encore |

### Le point critique que la métaphore "Duolingo réussit en self-paced" rate

Duolingo n'a **pas de "completion"** — apprendre une langue est un goal infini, on peut faire 10 ans sans "finir". DAU est leur métrique parce que la valeur = pratique quotidienne. **L'entrepreneuriat est un goal FINI** (valider une idée, lever des fonds, lancer). Sans completion, pas de success story, pas de marque, pas de placement chez Flat6Labs/212Founders.

Donc la comparaison correcte n'est pas Duolingo, c'est **Coursera/Udemy** (goal fini, content-based) qui plafonnent à 6-14% completion. C'est notre risque réel si on bascule pur self-paced.

### Le point critique que la métaphore "Maven coûte cher en ops" rate aussi

Maven instructor-led = limité. Mais **Reforge prouve qu'on peut faire 85% completion avec subscription model + cohort cadence + artifacts repository** (sources Reforge 2024 : $60M Series B, 20+ programs, partenariats Microsoft, completion 85% sustained). Reforge n'a pas un instructor par cohorte — il a **un programme calendaire + community + content pre-recorded + AMA experts**. C'est scalable.

### Le 3e modèle qui émerge de la recherche : **hybride cohort-anchored + AI scaffolding**

Référence arxiv 2025 (Wang et al., "AI That Helps Us Help Each Other") — système design pour entrepreneurship coaching :
- IA prépare novice : prompts diagnostiques, articulation des besoins, identification risques
- IA prépare mentor : dashboard résumant updates, risques, stratégies suggérées
- Session humaine = focalisée sur ce que l'IA ne peut pas : jugement, vision, réseau

Case study Vidi (chatbot entre sessions coach humain) → confirmation pattern : **l'IA n'est pas un coach de substitution, c'est un scaffolder qui amplifie le mentor humain rare/cher**.

## 2. Conclusion : on doit faire HYBRIDE — pas un OU l'autre

Architecture cible scale (révisée après contestation Round 1) :

```
                    OPEN PUBLIC
                         ↓
              ┌─────────────────────┐
              │ Tier 0 — FREE       │  Self-paced sandbox L0+L1
              │ (lead gen)          │  AI coach 100%, pas de mentor humain
              │ Completion attendue │  ~15-25% (mieux que MOOC grâce à AI scaffolding)
              │ : 15-25%            │  Métrique = qualified leads → Tier 1
              └─────────────────────┘
                         ↓
              ┌─────────────────────┐
              │ Tier 1 — COHORT     │  Cohorts ouvertes 4-6 sem, 20-50 founders
              │ INDIVIDUAL          │  AI coach + community + 1 mentor pool tournant
              │ Paid $48-$199       │  Completion attendue : 60-80%
              │                     │  Cuttles-like price (concurrencer par dessous)
              └─────────────────────┘
                         ↓
              ┌─────────────────────┐
              │ Tier 2 — INSTITUTION │ Cohorts custom (UM6P, La Factory, Bidaya…)
              │ B2B $5k-$15k MAD/coh │ Mentor humain dédié, branding white-label
              │ White-label          │ Completion attendue : 85-95% (notre pilote EIC)
              │                     │  C'est notre rente d'origine
              └─────────────────────┘
```

**Clé** : ce n'est pas "cohort OU self-paced", c'est **3 tiers progressifs** dont l'**IA est le tissu commun**. L'IA porte le coût marginal nul (Tier 0), augmente la productivité mentor (Tier 1), libère du temps mentor pour la haute valeur (Tier 2).

## 3. Lift quantitatif d'une IA coach bien faite — borne supérieure

Pas de meta-analyse 2026 encore sur "AI tutor + completion", mais Duolingo rapporte **-10% dropout** via AI personalisation (2025 data). Si on extrapole conservatively à notre format livrable :

- MOOC baseline : 12% completion
- + AI scaffolding (prompts, exemples calibrés, hints socratiques) : +5-10pp → **17-22%**
- + community discussion (preuve Ruzuku) : +20pp → **37-42%**
- + cohort cadence (deadlines, kick-off, closing) : +30pp → **65-75%**
- + mentor humain pool : +15-20pp → **80-95%**

Chaque couche que tu retires fait baisser. Le **Tier 0 free** retient les 3 dernières couches (AI + community + cohort cadence minimal via cycles de 4 sem), donc plafond réaliste **35-45% completion**. Mieux que MOOC sans s'effondrer en ops.

## 4. Implication produit (révisée Round 2)

| Décision | Avant Round 2 | Après Round 2 |
|---|---|---|
| Architecture tier | Single cohort EIC | 3 tiers progressifs Free / Indiv / Institution |
| Rôle de l'IA | Optionnelle | **Centrale** (couche commune Tier 0/1/2) |
| Mentor humain | Présent partout | Tier 1+2 seulement (Tier 0 = IA pure) |
| Cohort discipline | Stricte | Cadence légère Tier 0 (cycles 4 sem), stricte Tier 1+2 |
| Completion ciblée | "Maximiser partout" | Différenciée par tier (35-45% / 60-80% / 85-95%) |

## 5. Sources Round 2

- [Duolingo 2025 retention/AI data (Sifars)](https://www.sifars.com/en/blog/duolingo-gamification-strategy-ai-language-learning/)
- [Duolingo brand story 2025 (Brandhopper)](https://thebrandhopper.com/2025/05/27/duolingo-the-brand-story-of-a-gamified-language-learning-app/)
- [AI scaffolding mentor-novice paper (arxiv 2025)](https://arxiv.org/html/2508.11052v1)
- [AI vs human coach working alliance (Frontiers 2024)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1364054/full)
- [Reforge 2024 completion data + Microsoft partnership (Eightception)](https://eightception.com/reforge-business-model-career-growth/)
- [Cohort-based market $3.8B→$15.2B CAGR 16.2% (Dataintelo)](https://dataintelo.com/report/cohort-based-courses-market)
- [SaaS unit economics cohort LTV calc (Fiscallion)](https://www.fiscallion.io/blog/saas-unit-economics)
- [Cohort vs evergreen enrollment (Coachvox)](https://coachvox.ai/cohort-vs-evergreen-enrollment/)
- [Benchmark agent output : `01-benchmark-competitive.md`](./01-benchmark-competitive.md)
