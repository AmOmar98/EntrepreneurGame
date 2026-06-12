# Round 3 — Deep dive Disciplined Entrepreneurship + mapping notre parcours

**Date** : 2026-05-23
**Source DE-24** : Bill Aulet, MIT, Wiley 2024 (2e éd.). Liste complète extraite via tianpan.co + d-eship.com + Aulet Workbook.
**Source notre parcours** : `database/seed_event_digi_hackathon.sql` (canonical PROD).

## 1. DE-24 — Framework complet (référence)

### Thème 1 : Customer & Market Understanding (Steps 1-5)
1. **Market Segmentation** — Identifier 6-12 segments potentiels via recherche primaire
2. **Select a Beachhead Market** — Choisir UN segment focal pour dominer
3. **Build an End User Profile** — Caractéristiques détaillées de l'utilisateur idéal
4. **Calculate TAM for Beachhead** — Revenue annuel potentiel du segment focal
5. **Profile the Persona** — Persona unique, fictive mais data-driven, du beachhead

### Thème 2 : Product & Value Definition (Steps 6-8)
6. **Full Life Cycle Use Case** — Parcours client complet awareness → post-achat → advocacy
7. **High-Level Product Specification** — Visualisation non-détaillée de la solution
8. **Quantify the Value Proposition** — Bénéfices mesurables tangibles pour le client

### Thème 3 : Market Validation (Steps 9-11)
9. **Identify Your Next 10 Customers** — 10 prospects réels matching la persona
10. **Validate Your Core** — Identifier et confirmer l'avantage compétitif soutenable (moat)
11. **Chart Competitive Position** — Carte vs alternatives sur attributs clés

### Thème 4 : Go-to-Market Strategy (Steps 12-14)
12. **Determine Decision-Making Unit (DMU)** — Stakeholders qui influencent l'achat
13. **Map Customer Acquisition Process** — Pipeline lead → paying customer
14. **Calculate TAM for Follow-on Markets** — Marchés adjacents post-beachhead

### Thème 5 : Business Model & Unit Economics (Steps 15-19)
15. **Design a Business Model** — Subscription / licensing / freemium / transaction
16. **Set Pricing Framework** — Pricing rooted in value delivered
17. **Calculate Lifetime Value (LTV)** — Profit par client sur 5 ans
18. **Map Sales Process to Scale** — Sales court / moyen / long terme
19. **Calculate Cost of Acquisition (COCA / CAC)** — Coût moyen d'acquisition

### Thème 6 : Validation & Launch (Steps 20-24)
20. **Identify Key Assumptions** — Lister les croyances critiques au succès
21. **Test Key Assumptions** — Designer + exécuter expérimentations
22. **Define Minimum Viable Business Product (MVBP)** — Version la plus simple monétisable
23. **Show Dogs Eat the Dog Food** — Preuve : vrais clients achètent ET utilisent
24. **Develop a Product Plan** — Roadmap scale + follow-on markets

---

## 2. Notre parcours Digi-Hackathon (15 livrables, 7 missions)

| Mission | Level | Livrable | Type |
|---|---|---|---|
| M1 ord=1 | L1_problem | `persona-v1` (Persona ado/jeune principal) | main |
| M1 ord=1 | L1_problem | `design-thinking-v1` (Empathize+Define+Ideate+Prototype) | bonus |
| M2 ord=2 | L2_solution | `prep-questions-v1` (Préparation questions entretiens) | main |
| M2 ord=2 | L2_solution | `fiches-entretien-v1` (10 entretiens terrain) | main hard-blocked |
| M3 ord=3 | L3_market | `bmc-v1` (Business Model Canvas Osterwalder) | main |
| M4 ord=4 | L4_business_model | `marche-technique-v1` (TAM/SAM/SOM + stack + risques) | main |
| M4 ord=4 | L4_business_model | `moscow-v1` (MoSCoW + V1/V2/V3) | main |
| M4 ord=4 | L4_business_model | `tam-sam-som-v1` (sizing approfondi) | bonus |
| M4 ord=4 | L4_business_model | `positionnement-v1` (carte 2D vs 3-5 concurrents) | bonus |
| M4 ord=4 | L4_business_model | `comparaison-v1` (matrice features × concurrents) | bonus |
| M5 ord=5 | L4_business_model | `commercialisation-v1` (AARRR funnel + canaux) | main |
| M5 ord=5 | L4_business_model | `strategie-100-users-v1` (acquisition 100 users) | bonus |
| M6 ord=6 | L5_pitch | `unit-economics-v1` (CAC/LTV/Churn/Payback) | main |
| M7 ord=7 | L5_pitch | `techniques-pitch-v1` (préparation pitch) | main |
| M7 ord=7 | L5_pitch | `pitch-deck-v1` (deck final 10-12 slides) | main |

## 3. Mapping Digi-Hackathon ↔ DE-24

| DE# | DE step | Statut couverture | Notre livrable | Note |
|---|---|---|---|---|
| 1 | Market Segmentation | ❌ **MANQUANT** | — | On saute direct à la persona. Novice ne comprend pas pourquoi LE segment ado/jeune ≠ adultes ≠ enfants |
| 2 | Beachhead Market | ❌ **MANQUANT** | — | Beachhead implicite (Maroc / Fès-Meknès) mais jamais formalisé |
| 3 | End User Profile | 🟡 partiel | `persona-v1` | Notre persona = persona + EUP fusionnés. Manque le distinguo (Aulet sépare expressément) |
| 4 | TAM Beachhead | ✅ couvert | `marche-technique-v1` + `tam-sam-som-v1` | Présent et structuré |
| 5 | Persona | ✅ couvert | `persona-v1` | Notre liv principal |
| 6 | Full Life Cycle Use Case | ❌ **MANQUANT MAJEUR** | — | Comment l'ado découvre → essaye → adopte → recommande l'app ? On ne fait pas ce travail UX |
| 7 | High-Level Product Spec | 🟡 partiel | `marche-technique-v1` (stack) + `moscow-v1` | Technique oui, visualisation produit non |
| 8 | Quantify Value Prop | 🟡 implicite | `bmc-v1` (case "valeur") | Pas d'exercice dédié — Aulet exige des bénéfices CHIFFRÉS |
| 9 | Next 10 Customers | 🟢 couvert (renforcé) | `fiches-entretien-v1` (10 entretiens) + `strategie-100-users-v1` | Notre 10 fiches = exactement DE-9 |
| 10 | Validate Your Core | ❌ **MANQUANT** | — | Notre moat ? Notre propriété inévitable ? Crucial pour pitch investisseur |
| 11 | Chart Competitive Position | ✅ couvert (bonus) | `positionnement-v1` + `comparaison-v1` | Bien fait |
| 12 | DMU (Decision-Making Unit) | ❌ **MANQUANT** | — | Crucial pour B2B2C santé mentale (parent décide ? clinicien recommande ? ado accepte ?) |
| 13 | Customer Acquisition Process | ✅ couvert | `commercialisation-v1` (AARRR) | Bien fait |
| 14 | TAM Follow-on Markets | ❌ **MANQUANT** | — | Que faire après le beachhead ? Pas de vision long terme |
| 15 | Business Model | ✅ couvert | `bmc-v1` (mais Osterwalder ≠ Aulet) | Aulet liste 11 modèles, Osterwalder couvre case générique. Approches compatibles. |
| 16 | Pricing Framework | ❌ **MANQUANT** | — | Implicite dans M6 unit-economics mais pas d'exercice pricing dédié (value-based ? cost+ ? penetration ?) |
| 17 | LTV | ✅ couvert | `unit-economics-v1` | Bien fait |
| 18 | Sales Process to Scale | 🟡 partiel | `commercialisation-v1` | Court terme oui, moyen/long terme non |
| 19 | COCA / CAC | ✅ couvert | `unit-economics-v1` | Bien fait |
| 20 | Identify Key Assumptions | ❌ **MANQUANT MAJEUR** | — | On valide des trucs mais on ne formalise jamais nos hypothèses critiques (Lean Startup core) |
| 21 | Test Key Assumptions | 🟡 implicite | `fiches-entretien-v1` + `moscow-v1` (étape 3 hypothèses) | Test via fiches, pas via expérimentations structurées |
| 22 | Define MVBP | 🟡 partiel | `moscow-v1` (V1 MVP) | Plan oui, exécution/test non |
| 23 | Show Dogs Eat the Dog Food | ❌ **MANQUANT MAJEUR** | — | Aucun livrable n'exige "1er client payant / user actif récurrent" |
| 24 | Develop a Product Plan | 🟡 partiel | `moscow-v1` (V1/V2/V3) | Vision 3 versions oui, follow-on markets non |

### Synthèse couverture

- ✅ **Pleinement couvert** : 7/24 (29%) — TAM, persona, next 10, comp position, CAC, LTV, acquisition process
- 🟡 **Partiellement / implicite** : 7/24 (29%) — EUP, product spec, value prop quant, business model (via BMC), test assumptions, MVBP, product plan
- ❌ **Manquant** : 10/24 (42%) — segmentation, beachhead, **lifecycle use case**, validate core, DMU, follow-on, pricing, **identify assumptions**, sales scale, **dogfooding**

**42% de gaps DE-24 — défensible pour un Hack-Days 2 jours, problématique pour un accompagnement complet à l'échelle.**

## 4. Mais — DE-24 n'est PAS un évangile

Les critiques académiques notées :
- Scope étroit : tech innovation ventures, pas SME / artisanat / commerce
- Profondeur cas limitée (mainly Aulet's own startup history)
- Format "manual" pas "deep analysis" — bon pour novice, mince pour expert
- Trop structuré pour entrepreneurs intuitifs / créatifs (cf. critique répandue + notre Round 1 sur effectuation)

Donc le bon move = **inspiration revendiquée + adaptation publique**, pas copier-coller.

## 5. Recommandations Round 3 — combler les gaps prioritaires

### Priorité P0 (gaps qui font qu'un pitch investisseur tombe)
1. **DE-1+2 explicites** : ajouter en L0 ou L1 un livrable `segmentation-beachhead-v1` (matrice 6-12 segments → choix justifié de 1 beachhead). Sans ça, le persona M1 vient de nulle part.
2. **DE-6 Full Life Cycle Use Case** : nouveau livrable L2 ou L3 — "comment le client découvre, achète, utilise, fidélise, recommande". Service-design 101.
3. **DE-10 Validate Your Core** : livrable L4 — "votre moat / barrière à l'entrée (tech, data, brand, network effects, regulatory, exclusive)". Une question, une réponse argumentée.
4. **DE-20 Identify Key Assumptions** : nouveau livrable L1 ou L2 — "liste vos 5 hypothèses critiques (si fausses, vous mourez)". Pré-requis aux fiches d'entretien.
5. **DE-23 Show Dogs Eat the Dog Food** : nouveau livrable L5 ou post-L5 — "1 utilisateur réel récurrent OU 1 pre-order OU 1 LOI client". Le contraire d'un livrable papier.

### Priorité P1 (gaps qui nuisent à la qualité d'accompagnement)
6. **DE-12 DMU** : ajouter sous-question dans `persona-v1` ou nouveau livrable L2 — "qui décide ? qui influence ? qui paie ? qui utilise ?". Crucial pour santé mentale ado (parent paie, clinicien recommande, ado utilise).
7. **DE-16 Pricing Framework** : sous-question dans `bmc-v1` ou nouveau livrable L4 — "votre pricing est value-based, cost+, penetration ou skimming ? pourquoi ?".

### Priorité P2 (gaps qui élargissent la vision)
8. **DE-14 Follow-on Markets** : enrichir `tam-sam-som-v1` bonus avec section "post-beachhead targets".
9. **DE-24 Product Plan complet** : enrichir `moscow-v1` étape 4 avec section "follow-on roadmap V4-V5".

### Architecturalement
10. **Charte publique `/methodology`** : "Inspired by Disciplined Entrepreneurship (Aulet, MIT) — adapted for the Moroccan/African context with emphasis on effectuation (Sarasvathy) and ethical considerations specific to our domains (mental health, agritech, …)." Crédibilité massive + différenciation explicite.
11. **Mission engine first-class** (Pilier 1 multi-tenant) doit permettre de **mapper** chaque livrable sur 1 ou plusieurs steps DE-24 — dashboard mentor + Player voit "tu as couvert 9/24 steps DE, voici les 15 qui te manquent".

## 6. Comment ça change le design produit

Aujourd'hui, notre parcours = **livrable-centrique** (15 livrables ordonnés). Pédagogiquement cohérent, mais opaque sur "où je suis sur la science de la création de startup".

Demain, design recommandé : **double-couche** :
- **Couche apprenant** (UI Player) : missions/livrables comme aujourd'hui — UX simple
- **Couche méthodologique** (UI Player advanced + Mentor + GameMaster) : "carte DE-24" qui montre les 24 steps avec couleur (✅ couvert / 🟡 partiel / ❌ manquant) selon les livrables `validated`. Le Player avance ET voit qu'il avance sur un framework rigoureux.

Ça donne **crédibilité académique (DE = MIT/Aulet)** + **flexibilité event-driven** (chaque event Digi/AgreenTech/etc. peut être un sous-ensemble de DE-24 mappé) + **diagnostic continu** (mentor voit instantanément les trous).

## Sources

- [Tianpan DE-24 step-by-step summary 2025](https://tianpan.co/blog/2025-06-14-disciplined-entrepreneurship)
- [O'Reilly DE-24 contents](https://www.oreilly.com/library/view/disciplined-entrepreneurship-24/9781118692288/04_contents.html)
- [d-eship.com framework page](https://www.d-eship.com/about/framework/)
- [MIT Sloan 6 questions for startup success](https://mitsloan.mit.edu/ideas-made-to-matter/disciplined-entrepreneurship-6-questions-startup-success)
- [Wiley DE 2e éd. 2024](https://www.wiley.com/en-us/Disciplined+Entrepreneurship:+24+Steps+to+a+Successful+Startup,+Expanded+&+Updated,+2nd+Edition-p-9781394222513)
- [Startup Musings critique 2013](https://startupmusings.wordpress.com/2013/08/19/disciplinedentrepeurship-24steps/)
- Internal source : `database/seed_event_digi_hackathon.sql`
