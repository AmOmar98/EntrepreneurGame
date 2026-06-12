# Benchmark compétitif — Entrepreneur Game (scale)

> Document de recherche pour informer le redesign / scale de Entrepreneur Game (UM6P/EIC-UEMF, Next.js + Supabase, parcours L0–L5).
> Auteur : Claude (research subagent). Date : 2026-05-23. Sources : WebSearch (Anthropic), pages publiques produits/éditeurs.
> Méthodo : 4–6 produits par catégorie × 6 catégories ; pour chaque produit, fiche standardisée ; en fin, 12 recommandations actionnables.

---

## 1. Synthèse comparative (table maître)

| # | Produit | Catégorie | Pays | Public | Pédagogie | Format | Durée | Pricing | Forces | Faiblesses |
|---|---------|-----------|------|--------|-----------|--------|-------|---------|--------|-----------|
| 1 | Capsim (Capstone / Foundation / GlobalDNA) | Sim | US | Undergrad → MBA exec | Strategy + cross-fonction | Sim multi-décisions, équipes 2–6 | 6–8 rounds × 1 sem | ~$55–$70 / étudiant | 1,7M étudiants, dashboards prof | Top-down, peu créatif |
| 2 | Cesim | Sim | FI | Univ + corp | Strategy / marketing / hôtellerie (11 sims) | Web sim équipes | 4–10 rounds | ~$40–$60 / étu (ind.) | Catalogue large, multi-domaine | Peu adapté startup early-stage |
| 3 | SimVenture (Validate, Evolution) | Sim | UK | Startup / éduc. entrepreneuriale | Lean + sim opérationnelle | Sim solo/équipe + canvas | 6–12 sem | Licences institutionnelles (~£15–25/étu Evolution) | Le seul vraiment "startup early-stage" | Pas de mentorat humain natif |
| 4 | Marketplace Simulations | Sim | US | Univ marketing + ventes | Marketing / innovation / entrepreneuriat | Sim équipes | 4–8 rounds | Pay-per-student (~$50) | Forte composante go-to-market | Centré US, peu BMC/Lean |
| 5 | MonsoonSIM | Sim | SG | High school → MBA, corp | ERP-like cross-fonctionnel | Sim temps réel multi-modules (finance, retail, logistics…) | Quelques heures → semestre | Licence par session, free trial | Très immersif, modulable | Courbe technique élevée |
| 6 | Business Strategy Game (BSG) | Sim | US (McGraw-Hill) | MBA + advanced undergrad | Strategy compétitive (chaussures de sport) | Sim industrie unique, équipes | 10 décisions hebdo | ~$50 / étu | Référence MBA, head-to-head | Mono-industrie, daté visuellement |
| 7 | GoVenture Entrepreneur | Sim | CA | High school → adultes, formation continue | Lemonade → franchise multi-sites | Sim solo, niveaux progressifs | Self-paced | Licences institutionnelles modestes | Très accessible, level-up clair | UI vieillissante, pas collaboratif |
| 8 | YC Startup School | Plateforme | US | Founders mondial | Doctrine YC ("talk to users / build / launch") | Async + weekly updates, peer matching | ~7 sem × 1–2h | Gratuit | 45 % des YC batches récents y sont passés, marque massive | Pas de mentor 1:1, faible local Maroc |
| 9 | Founder Institute | Programme | US (global) | Pre-seed founders sérieux | Méthodo FI (10–15 livrables) | Hybride, mentors locaux, "Working Groups" 4–5 founders | 14 sem part-time (45–60h/sem) | Entrance fee ~$799–$999 + equity ~3,5 % | Mentorat structuré + drop-out culture | Très exigeant, taux de complétion bas |
| 10 | Antler | Studio/VC | SG/global | Pre-team founders | Team-formation → ideation → validation | Cohorte présentielle | 10–12 sem | Equity (~10 %) + investissement | Excellent matching co-founders | Sélectif, équité chère |
| 11 | Techstars | Accélérateur | US | Seed founders | "Mentorship-driven accelerator" | Cohorte présentielle, mentor-madness | 13 sem | $20k cash + 6 % equity | Réseau mondial mentors | Phase post-Entrepreneur Game |
| 12 | MIT delta v | Accélérateur uni | US | Student founders MIT | Disciplined Entrepreneurship (Aulet 24 steps) | Cohorte été, EIRs + coaching 1:1 | 12 sem été | Gratuit + bourse étudiants MIT | Framework rigoureux, transposable | Très sélectif, US-only |
| 13 | Stanford Venture Studio | Hub uni | US | Grad students | Self-directed + advisors hebdo | Drop-in CoLab, 1:1 advisors | Self-paced, multi-quarters | Gratuit (Stanford) | Communauté + ressources | Non-structuré (faible pour novices) |
| 14 | Strategyzer | Outil BMC | CH | Corp innovation + univ | BMC + Value Prop Canvas + test cards | SaaS team + e-learning + AI | Continu | Individual transparent, team/enterprise sur devis | Référence académique BMC | Cher, pas freemium |
| 15 | LEANSTACK (Ash Maurya) | Outil Lean | US | Founders early-stage | Lean Canvas + Continuous Innovation Framework | SaaS + cours + AI validation | Continu | Lifetime $150 + playbooks $397–$997 | Auteur Lean Canvas, AI validation | UX vieillissante |
| 16 | Cuttles | Outil business plan | DK | Founders + étudiants | Pitch + business plan guidé | SaaS interactif | Continu | $8/$16/$48/an (très bas) | Pricing dérisoire, multi-startups | Peu de profondeur méthodo |
| 17 | Bizplan / BizPlan AI Pro | Outil business plan | US | Founders | Plan rédactionnel + AI gen | SaaS + credits | Continu | Modèle crédits | Génération AI rapide | Peu pédagogique |
| 18 | LivePlan | Outil business plan | US | SMBs | Plan + projections | SaaS | Continu | ~$20/mois | Forecasting solide | Pas startup-tech |
| 19 | Duolingo | EdTech grand public | US | Grand public (langues) | Spaced repetition + gamif | App mobile-first | Quotidien | Freemium + Super $7/mois | Streaks +60 % engagement, leagues +40 % | Décrochage si gamif > intérêt |
| 20 | Brilliant.org | EdTech STEM adulte | US | Adultes curieux | Problem-solving interactif | App + web | Quotidien (5–15 min) | $119,99 / an | Excellent active recall, gamif minimale | Pas social ni cohorte |
| 21 | Coursera for Business | EdTech corp | US | Corp L&D | Catalogue universités | Async + skill tracks | Selon parcours | Per-seat enterprise | Catalogue massif, dashboards admin | Faible engagement async |
| 22 | Maven | Cohort-based | US | Pros + indie experts | Live cohort + community | Cohorte 2–8 sem | Variable | $200–$3000 par cours | 96 % complétion, 14× rétention vs Coursera | Dépend qualité instructeur |
| 23 | Springboard / Pathstream / Section | Career bootcamps | US | Career switchers | Mentor 1:1 + projects | Hybride cohorte | 3–9 mois | $5k–$15k | Job-guarantee, mentor humain | Cher, hors EdTech entrepreneuriale |
| 24 | Khanmigo (Khan Academy) | AI tutor | US | K-12 + adultes | RAG curriculum + niveaux de difficulté | Chat AI tuteur | Continu | $4/mois ou via école | Tutor adaptif, multi-niveaux | Centré K-12 |
| 25 | Sana Labs | AI tutor enterprise | SE | Corp L&D | RAG sur knowledge enterprise (Slack/Notion/Jira…) | SaaS | Continu | Enterprise (sur devis) | Connecteurs entreprise riches | Pas pédagogique pur |
| 26 | CoFounder.ai / Founderpal / aicofounder.com | AI co-pilot founder | US | Indie founders | Multi-agents conseil (growth, sales, ops…) | Chat/WhatsApp/iMessage | Continu | Freemium + paid | Très "personal", multi-canal | Conseil générique, pas mentor humain |
| 27 | Flat6Labs | Accélérateur MENA | EG/MA | Seed startups MENA | Mentor + investment | Cohorte présentielle + suivi | 4 mois | Equity + investissement | Programme Tamwilcom Maroc (AgriTech/Fintech/GreenTech) | Compétiteur direct côté seed Maroc |
| 28 | 212 Founders | Accélérateur MA | MA | Tech startups | CDG Invest model | Cohorte | ~6 mois | Equity-free + financement (à vérifier) | Réseau CDG | Plutôt seed pas idéation |
| 29 | UM6P StartGate (Rabat 2025) | Campus startup | MA | Startups + chercheurs UM6P | Recherche → entreprenariat | Campus physique + programmes | Continu | Sur sélection | Écosystème UM6P (notre famille) | Très jeune (lancement 12/2025) |
| 30 | Bidaya | Incubateur social MA | MA | Social entrepreneurs Maroc | Économie sociale, RSE | Cohorte + mentorat | 6 mois | Subventions | Niche sociale | Hors tech-pur |
| 31 | La Startup Factory | Accélérateur MA | MA (Casa) | Startups innovantes | Label Afric'Innov | Cohorte + hub physique | Variable | Equity / partenariats corp | Réseau corporate Maroc | Pas plateforme digitale forte |
| 32 | AfricArena | Réseau accélérateur AF | ZA | Startups africaines | Corporate Open Innovation challenges | Summits + matchmaking | Annuel + continu | Sponsor-driven | Réseau panafricain, exposition VC | Pas un programme pédagogique structuré |
| 33 | Andela | Talent pipeline | NG | Devs africains | Bootcamp tech + placement | Hybride | Variable | Gratuit côté talent, B2B clients | Pas entrepreneuriat (placement dev) | Hors scope |

---

## 2. Fiches détaillées par catégorie

### Catégorie 1 — Simulations business "serious games"

**Capsim** ([capsim.com](https://www.capsim.com/business-simulations))
Capsim revendique 1,7M étudiants sur Capstone. Pédagogie : décisions cross-fonctionnelles (R&D, marketing, prod, finance) sur 6–8 "années" simulées. Tarif estimé ~$55/étudiant (référence 2016, [Course Hero](https://www.coursehero.com/file/p6s8ncu8/CAPSIM-charges-a-fee-per-student-of-55-including-the-Capstone-simulation-and-the/)), aujourd'hui plus probablement $60–$70 selon bundle. Forces : dashboards prof béton, courbe douce via Foundation puis Capstone puis GlobalDNA (exec). Faiblesses : pas adapté early-stage / idéation ; logique "operating a mature firm" ; UI fonctionnelle mais terne.
À copier : la **progression Foundation → Capstone → GlobalDNA** (parallèle direct avec nos L0→L5). À éviter : la "ronde-décision" pure qui transforme l'apprentissage en optimisation Excel.

**Cesim** ([cesim.com](https://www.cesim.com/simulations/compare-business-simulations))
11 sims dans 4 catégories. Forces : couverture verticale (hôtellerie, banque, marketing global). Faiblesses notées par les comparatifs : faible adaptabilité entrepreneuriat / startup. À retenir : modèle **catalogue de sims** par persona — Entrepreneur Game pourrait offrir des "playbooks verticaux" (santé, agritech…) sans repenser le moteur.

**SimVenture (Validate, Evolution)** ([simventure.com](https://simventure.com/))
Le SEUL vraiment positionné "entrepreneurship education". 40+ pays. Evolution est cité comme "the most powerful sim on the market". Modèle : sim opérationnelle + canvas guidé. Le plus proche conceptuellement de Entrepreneur Game (sauf que SV est sim, nous sommes plateforme projet réel). C'est notre **proche cousin / concurrent indirect** si on bascule vers projet hybride réel+sim.

**Marketplace Simulations**, **BSG**, **MonsoonSIM**, **GoVenture** — voir table. MonsoonSIM mérite attention pour son **modèle ERP-vivant temps réel** : pourrait inspirer un mode "live company day" pendant un hackathon.

### Catégorie 2 — Plateformes d'accompagnement startup

**Y Combinator Startup School** ([startupschool.org/curriculum](https://www.startupschool.org/curriculum), [events.ycombinator.com/startup-school-2026](https://events.ycombinator.com/startup-school-2026))
**45 % des YC batches récents en sont diplômés** ([UC Irvine ANTrepreneur](https://antrepreneur.uci.edu/2025/11/21/uc-irvines-antrepreneur-center-expands-access-to-y-combinators-startup-school/)). Format : async, ~7 sem × 1–2h/sem, **weekly update system** (équivalent direct de nos "missions"), co-founder matching. Gratuit. Marque massive. **Notre principal "anchor" mental** : tout founder mondial connaît YC SS — soit on s'aligne (compatible), soit on différencie (local, mentor humain, projet réel).
À copier : **weekly updates** discipline, co-founder matching, library curated. À différencier : nous avons **mentor humain assigné + jury physique + livrables évaluables** ; SS est self-paced anonyme.

**Founder Institute** ([fi.co/program](https://fi.co/program), [fi.co/core](https://fi.co/core))
14 sem part-time, **10–15 deliverables**, Working Groups 4–5 founders, mentor idea review final. Entrance fee $799–$999 + equity ~3,5 %. **Très drop-out friendly** par design (refund avant "Revenue & Business Models" session). Notre modèle de deliverables (15 livrables, 5 bonus) **est quasi-isomorphe à FI** — convergence frappante. À investiguer : leur "Mentor Idea Review" structure (notre jury final).

**MIT delta v** ([entrepreneurship.mit.edu](https://entrepreneurship.mit.edu/accelerator/program/))
Backbone : **Disciplined Entrepreneurship (Bill Aulet, 24 steps)** — [d-eship.com](https://www.d-eship.com/about/framework/). 24 étapes en 6 thèmes, framework rigoureux structuré. **C'est probablement la méthodologie la plus directement transposable** pour donner du fond pédagogique à L0–L5. Le livre est publié Wiley, méthodo publique, déjà utilisée dans 100+ universités.
**À copier : adopter explicitement DE-24 comme charte pédagogique.** Mapper nos missions sur les 24 steps.

**Antler / Techstars / Stanford Venture Studio** — voir table. Stanford Venture Studio est intéressant pour le modèle **drop-in CoLab + 1:1 advisors** : moins prescriptif, plus librairie de ressources. Antler pour le **team-formation phase** absente chez nous.

### Catégorie 3 — Outils Lean Startup / BMC numériques

**Strategyzer** ([strategyzer.com](https://www.strategyzer.com), via [Capterra](https://www.capterra.com/p/10024863/Strategyzer/))
Référence académique BMC/VPC. Plateforme corp innovation. Pas freemium, cher. Notre BMC mission L3 = exactement le sweet spot Strategyzer.

**LEANSTACK** ([leanstack.com](https://www.leanstack.com/))
Ash Maurya, **inventeur du Lean Canvas**. Lifetime $150 + playbooks. Inclut AI validation (stress-test du modèle). Très en avance sur AI-driven validation — à benchmarker pour notre potentielle feature "AI advisor".

**Cuttles** ([cuttles.io](https://www.cuttles.io)) — $8–$48/an seulement, multi-startups. **Pricing-killer** : si nous allons SaaS public, $8/an pour un étudiant est un prix de référence à battre / matcher.

**BizPlan AI Pro**, **LivePlan** — outils plans rédactionnels. Moins pertinents (nous ne sommes pas rédaction).

### Catégorie 4 — EdTech adultes / gamification

**Duolingo** — **streaks +60 % rétention** ([Trophy.so case study](https://trophy.so/blog/duolingo-gamification-case-study), [Orizon](https://www.orizon.co/blog/duolingos-gamification-secrets)), leagues XP +40 % engagement. Caveat : **les apprenants dépendants de la gamif décrochent plus** que ceux motivés par intérêt intrinsèque ([dev.to](https://dev.to/pocket_linguist/why-duolingos-gamification-works-and-when-it-doesnt-1d4)). Implication pour nous : gamif comme **scaffolding**, pas comme moteur principal.

**Brilliant** — **gamification volontairement minimale** ("avoid packing too many incentives"). Streaks + Leagues, c'est tout. Le contenu interactif fait le travail. Modèle premium-only $119.99/an. À retenir : **less is more** sur la gamif.

**Maven** — **96 % complétion vs ~6 % MOOCs** ([Maven LinkedIn data](https://www.linkedin.com/posts/gaganbiyani_proud-to-share-some-insane-data-maven-activity-7171180310850596865-IMWf), [Learnopoly stats](https://learnopoly.com/cohort-based-learning-statistics/)). **14× rétention vs Coursera/Udemy**. Le **cohort-based + live + deadlines** est LA leçon majeure. Entrepreneur Game est déjà cohort-based ; on est sur le bon modèle.

**Coursera for Business**, **Springboard**, **Pathstream**, **Section** — modèles corp / career-switch. Pas notre cible directe mais Springboard pour le **mentor 1:1 obligatoire** (à investiguer : leur backend de matching et tracking).

### Catégorie 5 — AI tutors / co-pilots founders

**Khanmigo** ([khanmigo.ai](https://www.khanmigo.ai/)) — RAG sur curriculum K-12 + retrieval adapté au niveau de l'élève. **Modèle architectural : RAG multi-niveau de difficulté**, on pourrait l'appliquer pour servir des "exemples livrables" calibrés au niveau du porteur.

**Sana Labs** ([sana.ai](https://sana.ai), via [Courseplatformsreview](https://www.courseplatformsreview.com/blog/sana-learn-review/)) — RAG sur Slack/Notion/Jira/SharePoint. Modèle B2B enterprise. Pour nous : indexer **PDFs Welcome Guide + livrables-types validés** = base RAG immédiate.

**CoFounder.ai** ([cofounder.ai](https://cofounder.ai/)) — multi-agents par fonction (growth, sales, finance…), disponibles via WhatsApp/iMessage. **Modèle de canal très intéressant** : les porteurs Maroc sont mobile-first et WhatsApp-natifs. Pourrait inspirer une intégration WhatsApp pour notifier livrables / poser questions.

**Founderpal, aicofounder.com** — outils légers, **80 000 founders** revendiqués par aicofounder.com. Modèle prompt-engineered, peu de profondeur.

**Architecture RAG 2026** ([Growai](https://growai.in/rag-retrieval-augmented-generation-how-to-build-smarter-ai-apps-in-2026/)) — la couche retrieval est devenue commodity ; la différenciation se fait sur **la qualité du knowledge base curé** et **la stratégie de retrieval contextuelle** (niveau étudiant, stage L0–L5).

### Catégorie 6 — Afrique / MENA

**Flat6Labs** ([flat6labs.com](https://flat6labs.com/)) — **lancement programme Maroc avec Tamwilcom** ([Tech In Africa](https://www.techinafrica.com/flat6labs-and-tamwilcom-launch-accelerator-to-fuel-moroccos-tech-startup-ecosystem/)) ciblant AgriTech / FinTech / GreenTech / AI / digital health. **Compétiteur direct côté seed** mais complémentaire pour nous (ils prennent les Players qui sortent de Entrepreneur Game L5).

**212 Founders** ([cbinsights.com/investor/212-founders](https://www.cbinsights.com/investor/212-founders)) — programme CDG Invest. Probable partenaire post-pipeline.

**UM6P StartGate (Rabat, lancement déc. 2025)** ([Morocco World News](https://www.moroccoworldnews.com/2025/12/271599/um6p-launches-startgate-rabat-to-boost-moroccan-african-startup-ecosystem/)) — **NOTRE famille étendue** (UEMF ≠ UM6P mais écosystème connecté). À investiguer : co-positionnement ou intégration.

**Bidaya** — entrepreneuriat social. Niche complémentaire.

**La Startup Factory** ([lastartupstation.co](https://www.lastartupstation.co/blog/lastartupfactory-receives-the-afric-innov-label)) — Casablanca, Label Afric'Innov. Plutôt physique, peu de plateforme.

**AfricArena** ([africarena.com](https://www.africarena.com/)) — réseau panafricain, summits annuels. **Canal de visibilité plus que concurrent.**

**Andela** — talent pipeline dev, hors scope entrepreneuriat.

**Euromed Innovation Center (EIC) — notre maison** ([euromedinnovation.center](https://www.euromedinnovation.center/en/), [ueuromed.org](https://ueuromed.org/structure-innovation/euromed-innovation-center-eic)) — labellisé Tamwilcom segment Ideation. Notre produit est **l'outil digital qui systématise l'EIC** ; en scaling SaaS, on duplique cette logique pour d'autres incubateurs universitaires.

---

## 3. Insights & implications pour Entrepreneur Game

### Méta-observations

1. **Cohort-based wins** : 96 % complétion Maven vs 6 % MOOCs n'est pas un détail. Notre modèle "Hack-Days 2 jours + suivi" est structurellement aligné. Ne pas trahir cela en virant async pur.
2. **Gamification = scaffolding, pas moteur** : Duolingo +60 % rétention mais drop-off élevé chez gamif-dépendants. Brilliant volontairement minimaliste. Notre R1 (score visible uniquement sur détail livrable) **est défendable empiriquement** — ne pas céder à la tentation leaderboard agressif.
3. **Méthodologie cachée des accélérateurs = Disciplined Entrepreneurship (Aulet) ou Lean (Maurya)**. Nous n'avons pas de framework explicite revendiqué — c'est un trou crédibilité.
4. **YC Startup School + Maven + AI co-pilots** définissent les attentes 2026. Nous devons offrir **au moins** : weekly cadence, peer cohort, AI advisor accessible. Le reste différencie.
5. **Mentor humain + projet réel évalué** = notre **moat principal**. Personne dans le top 25 ne fait à la fois (a) mentor 1:1 humain, (b) livrables évaluables structurés, (c) plateforme digitale moderne, (d) ancrage Maroc/Afrique. C'est notre triangle.

### 12 recommandations priorisées

**P0 — fondations méthodologiques (4 sem effort)**

1. **Adopter explicitement Disciplined Entrepreneurship (Aulet, 24 steps) comme charte pédagogique.** Mapper chaque mission L0–L5 sur une ou plusieurs étapes DE. Citer Aulet/MIT dans le marketing. Coût faible, gain crédibilité massive auprès partenaires UM6P/EIC/Tamwilcom.
2. **Documenter publiquement notre framework "EIC Venture Journey".** Page `/methodology` qui dit : "inspired by Disciplined Entrepreneurship (MIT) + Lean Canvas (Maurya) + cohort-based delivery (à la Maven)". Transparence = crédibilité B2B.

**P0 — produit core (parallèle, 6 sem)**

3. **Weekly update discipline** (inspiré YC SS) : chaque Player reçoit chaque vendredi un prompt "qu'as-tu shippé cette semaine ?", avec rappel public au mentor. Bas coût, forte rétention.
4. **Co-founder matching intra-cohorte** (inspiré YC SS) : seed dans `/onboarding` un quiz compétences + appétences, surface matches dans le dashboard Player. Aide team-formation phase qui nous manque vs Antler.

**P1 — différenciation IA (2 mois)**

5. **AI advisor RAG sur Welcome Guide + livrables validés** (inspiré Khanmigo / Sana / CoFounder.ai). Indexer les 8 PDFs + tous les livrables `status='validated'` historiques (anonymisés). Le porteur peut demander "montre-moi 3 exemples de Persona main validés en L1". Coût : embeddings + un LLM call par question. Différenciation forte vs FI / SS qui n'ont pas ce dataset propriétaire.
6. **Canal WhatsApp** (inspiré CoFounder.ai) : notifications livrables + Q&A AI advisor. Maroc/Afrique = mobile-first + WhatsApp-natif. Twilio + webhook Next.js, 1 sprint.

**P1 — engagement (1 mois)**

7. **Streaks "soft" + Leagues hebdo intra-cohorte** (inspiré Duolingo, modéré façon Brilliant) : streak = nb semaines consécutives avec ≥1 livrable soumis. League hebdo = top 3 par XP confirmé, visible **uniquement** dans la sidebar (respecter R1). Pas de leaderboard global, pas de honte.
8. **Confettis + micro-célébrations** sur chaque validation mentor. Coût trivial, impact engagement prouvé.

**P2 — scale SaaS multi-tenant (3 mois)**

9. **Pricing inspiré Cuttles ($8–$48/an)** pour le tier individuel + tier institution-licensing (par cohorte 10–50 founders, abonnement annuel ~5k–15k MAD). Concurrencer Capsim ($55/étu × 30 = $1650/cohorte) par dessous tout en restant supérieur en valeur (mentor + projet réel).
10. **Multi-tenant clean : workspace = incubateur**. Chaque tenant a son propre Welcome Guide, ses missions custom, sa cohorte. Réutiliser pour StartGate UM6P, La Factory, Bidaya si partenariats noués.

**P2 — écosystème (continu)**

11. **Intégrations sortantes vers Flat6Labs / 212 Founders / StartGate** : un Player L5 alumni peut exporter son dossier (BMC + livrables + scores jury) en 1 clic pour candidater. Nous devenons **le top-of-funnel structuré** de l'écosystème marocain.
12. **Open one chapitre gratuit grand public** (inspiré YC SS gratuit) : "Entrepreneur Game Foundations" = L0+L1 en self-paced gratuit, ouvert Maroc/Afrique. Funnel de qualification pour les programmes payants institutionnels. Marque + lead-gen.

---

## 4. Limitations de ce benchmark

- Pricing détaillé Capsim/BSG/Cesim non public 2026 — estimations basées sur sources tierces 2023–2025.
- Pas d'accès aux dashboards internes des concurrents → mécaniques produit décrites depuis pages marketing publiques.
- Pas d'entretien utilisateur (founders ayant utilisé plusieurs plateformes) — recommandé en phase 2 du research.
- Marché chinois (Tencent University, etc.) et indien (Lumiere, etc.) non couvert.
- Étude WebSearch limitée USA (cf. tool constraint).

## Sources principales

- [Capsim](https://www.capsim.com/business-simulations) · [Cesim](https://www.cesim.com/) · [SimVenture](https://simventure.com/) · [MonsoonSIM](https://www.monsoonsim.com/) · [BSG](https://www.bsg-game.com/) · [GoVenture](https://www.goventure.net/en)
- [YC Startup School curriculum](https://www.startupschool.org/curriculum) · [Founder Institute program](https://fi.co/program) · [MIT delta v](https://entrepreneurship.mit.edu/accelerator/program/) · [Stanford Venture Studio](https://www.gsb.stanford.edu/experience/learning/entrepreneurship/beyond-classroom/venture-studio)
- [Disciplined Entrepreneurship framework](https://www.d-eship.com/about/framework/) · [Strategyzer Capterra](https://www.capterra.com/p/10024863/Strategyzer/) · [LEANSTACK](https://www.leanstack.com/) · [Cuttles](https://www.softwareadvice.com/business-plan/cuttles-profile/)
- [Duolingo gamification (Trophy)](https://trophy.so/blog/duolingo-gamification-case-study) · [Brilliant](https://brilliant.org/) · [Maven retention data](https://www.linkedin.com/posts/gaganbiyani_proud-to-share-some-insane-data-maven-activity-7171180310850596865-IMWf) · [Cohort-based stats](https://learnopoly.com/cohort-based-learning-statistics/)
- [Khanmigo](https://www.khanmigo.ai/) · [Sana Learn review](https://www.courseplatformsreview.com/blog/sana-learn-review/) · [CoFounder.ai](https://cofounder.ai/) · [RAG 2026 architecture](https://growai.in/rag-retrieval-augmented-generation-how-to-build-smarter-ai-apps-in-2026/)
- [Flat6Labs Maroc/Tamwilcom](https://www.techinafrica.com/flat6labs-and-tamwilcom-launch-accelerator-to-fuel-moroccos-tech-startup-ecosystem/) · [UM6P StartGate](https://www.moroccoworldnews.com/2025/12/271599/um6p-launches-startgate-rabat-to-boost-moroccan-african-startup-ecosystem/) · [La Startup Factory](https://www.lastartupstation.co/blog/lastartupfactory-receives-the-afric-innov-label) · [AfricArena](https://www.africarena.com/) · [EIC UEMF](https://www.euromedinnovation.center/en/)

Date d'accès : 2026-05-23.
