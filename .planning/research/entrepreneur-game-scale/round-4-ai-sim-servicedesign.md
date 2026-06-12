# Round 4 — IA coach + Simulation + Service Design + Effectuation

**Date** : 2026-05-23
**Mission** : explorer 3 streams qui structurent le redesign produit hors-méthodo (DE-24 = Round 3) :
(A) IA coach state of the art 2025-2026
(B) Simulation / serious games entrepreneuriat
(C) Service design + transformation outcomes + effectuation opérationnalisable

## Stream A — IA coach pour entrepreneuriat (état de l'art)

### Produits matures sept-déc 2025
- **CoFounder.ai** (lancement sept 2025) : OS du fondateur solo. Multi-agents coordonnés (engineering / sales / marketing / customer support / ops). Memory-driven automation (email, calendar, docs, CRM). L'humain donne la direction, les agents exécutent. [Source AItoolsclub](https://aitoolsclub.com/meet-cofounder-a-platform-that-lets-you-run-an-entire-company-with-ai-agents/)
- **FounderPal** : AI marketing toolkit. Strategy, content, conversion, traffic. Léger, prompt-engineered. [founderpal.ai](https://founderpal.ai/)
- **Khanmigo** (Khan Academy) : tutor Socratique RAG sur curriculum, adaptatif au niveau apprenant. Référence architecturale K-12 → transposable.

### Pattern académique 2025 — le "scaffolder", pas le "remplaçant"
arxiv 2508.11052 (Wang et al., 2025) — "AI That Helps Us Help Each Other" :
- IA prépare le novice avant session humaine : prompts diagnostiques, articulation besoins, identification risques
- IA prépare le mentor en parallèle : dashboard updates, risques détectés, stratégies suggérées
- Session humaine = libérée pour ce que l'IA ne peut pas : jugement, vision, réseau
- "Layer dual context from both mentor and novice to adapt support"
- "Empower mentors to inspect and shape domain-grounded AI logic"

### Architecture cible Entrepreneur Game (synthèse Round 4 A)
```
                  ┌─ Welcome Guide PDFs (8)
                  ├─ Livrables anonymisés validés (corpus historique)
RAG knowledge ←───┼─ DE-24 framework + rubrics par step
                  ├─ Transcripts entretiens terrain anonymisés
                  └─ Charte méthodologique EIC publique
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │  Agent "EIC Mentor IA" (multi-rôle)       │
        │  • diagnoste : score livrable draft       │
        │  • exemples : recall livrables similaires │
        │  • Socratique : hints sans donner réponse │
        │  • prep mentor : digest hebdo équipe      │
        │  • simulator : what-if sur metrics        │
        └──────────────────────────────────────────┘
              │                              │
              ▼                              ▼
        UI Player chat                  Dashboard Mentor
        (WhatsApp + web)                  (web)
```

**Position produit** : pas un AI cofounder de substitution (CoFounder.ai joue ce rôle). On est **AI scaffolder pour cohort + mentor humain**. Notre moat = (a) corpus propriétaire livrables validés EIC/Digi/AgreenTech + (b) ancrage DE-24 + DT + effectuation explicite + (c) loop mentor humain.

## Stream B — Simulation / serious games entrepreneuriat 2025

### Données marché
- 90% entrepreneurs ayant utilisé sim business : amélioration strategic thinking + decision-making auto-déclarée (étude 2025)
- 78% rapportent amélioration compréhension dynamique marché
- Marché Top 20 serious games entrepreneurs 2025 documenté (Female Switch index)
- **Fe/male Switch** = browser sim + AI mentorship + focus mental well-being / resilience. Modèle hybride sim + coach.

### Recherche académique
- Agent-based serious games entrepreneurship (Academia paper) : agents = decision support system, expliquent cause/effet, apprentissage par renforcement
- Limites : recherche peu mature commercialement, beaucoup de POCs académiques

### Implication EG — ne PAS construire un Capsim-killer
Capsim/SimVenture/MonsoonSIM ont 10-20 ans d'avance, base installée massive, contenu mature. On ne va pas les concurrencer sur leur terrain (simulation gestion complète).

**Notre place = what-if calculators légers intégrés aux livrables Unit Economics / Pricing / TAM-SAM-SOM** :
- Slider pricing (10-200 DH/mois) → recalcul live LTV, payback, MRR, conversion (formules transparentes pas blackbox)
- Slider churn (1-15%) → projection MRR sur 24 mois
- Sensibilité CAC → seuil de rentabilité
- Hypothèse adoption (1-10% beachhead) → projection users sur 12 mois

Pas de "sim cross-fonction multi-rounds" (= Capsim). Juste **DE-15/16/17/19 rendus interactifs**. Le porteur joue avec les hypothèses, voit la sensibilité, comprend l'arithmétique de son business. Coût implementation : faible (formulaire + JS recalcule, pas de moteur de jeu).

## Stream C — Service design + transformation outcomes + effectuation

### Le piège "output metrics"
> "Companies fall into the 'output trap', where success is defined by surface-level metrics such as clicks, retention, or user sessions. Product teams should shift their focus from outputs to outcomes." — [UserTesting podcast](https://www.usertesting.com/resources/podcast/focusing-on-user-outcomes-in-product-development-connor-joyce)

**Notre risque identifié** : XP, livrables soumis, missions complétées, badges = **purs outputs**. Aucun outcome de transformation client (l'utilisateur final du porteur) n'est mesuré.

### Framework 3Cs (accelerator effectiveness)
Recherche accélérateurs (Springer 2024) — 5 déterminants critiques :
1. **Mentor characteristics** (qui est le mentor)
2. **Mentee readiness** (préparation porteur — mesurable !)
3. **Process structure** (notre force actuelle)
4. **Incentive mechanisms** (XP, certif, classement)
5. **Outcome measurement** (notre faiblesse actuelle)

Et le 3Cs framework : **Coach / Cash / Connect**. Notre produit fait Coach + Connect (mentor + jury), pas Cash. C'est OK — on est top-of-funnel vers Flat6Labs / 212 / Tamwilcom.

### Theory of Change (MIT D-Lab)
[MIT D-Lab Theory of Change](https://d-lab.mit.edu/news-blog/blog/theory-change-tool-participatory-design) — outil participatif pour design d'impact : Activities → Outputs → **Outcomes** → **Long-term Impact**, avec hypothèses à chaque flèche.

Pour Entrepreneur Game, une Theory of Change explicite :
```
ACTIVITIES                  OUTPUTS                       OUTCOMES                      IMPACT
(notre app)                 (immédiats)                   (transformation 3-12 mois)    (long terme)

Porteur soumet livrables    Livrables validated           Compétences DE-24 acquises    Startup créée + survit 3 ans
Mentor évalue               Score, feedback               Auto-efficacité ↑              Emplois créés en région
Jury note pitch             Rang final                    1er client / LOI / pre-order  Tickets levés Tamwilcom/Flat6
Cohort se forme             Community                     Co-founder trouvé              Écosystème densifié
                                                          User du produit transformé    Problème santé mentale ado ↓
                                                                                          (cas Digi-Hackathon)
```

**Outcome metrics manquants aujourd'hui qu'on devrait mesurer** :
- **Self-efficacy score** (échelle De Noble validée 5 items, baseline + post-event + +3mois + +12mois)
- **Skills acquired** (auto-évaluation DE-24 step coverage perceived + mentor évaluation)
- **Real traction proof** (DE-23 dogfooding) — # users / pre-orders / paying customers / LOI
- **End-user transformation** (pour Digi santé mentale : reach + behavior change chez les ados testés) — métrique radicale qu'aucun concurrent ne mesure

### Effectuation opérationnelle — workshop tools
Source : [Aarhus University workshop pack](https://www.au.dk/fileadmin/user_upload/Awareness_Effectuation.pdf), [Effectuation.org toolkit](https://effectuation.org/the-effectuation-toolkit), [Darden Report 2025 reimagining](https://news.darden.virginia.edu/2025/10/28/reimagining-entrepreneurship-education-through-new-frontiers-of-effectuation/)

**Format type workshop effectuation** = exercises + présentation + réflexion, outils = canvases simples à remplir.

5 principes opérationnalisés en exercices :
1. **Bird-in-Hand** : "Qui je suis / Ce que je sais / Qui je connais" — 3 colonnes, 30 min, individuel
2. **Affordable Loss** : "Quelle est ma perte acceptable sur les 6 prochains mois (temps, argent, opportunité) ?" — réflexion 20 min
3. **Lemonade** : "Listez 3 surprises/échecs récents. Pour chacune, quelle opportunité cachée ?" — équipe 30 min
4. **Stakeholder Commitment** : "Listez 5 partenaires potentiels (mentor, fournisseur, client pilote, partenaire dist). Quel premier engagement leur demander ?" — 45 min
5. **Pilot-in-Plane** : "Choisissez 1 action contrôlable cette semaine vs 1 prédiction sur 3 ans. Laquelle vaut votre temps ?" — débat équipe 15 min

**Implication EG** : ajouter livrable `bird-in-hand-v1` en L0 (premier livrable du parcours, avant `persona-v1`). C'est un ancrage psychologique + différenciation pédagogique. Coût mentor évaluation : faible (rubric simple), valeur formative : élevée.

### Synthèse Stream C — refonte du Score / Transformation Score

Au lieu de "XP confirmé / Pending / Prestige", proposer :

```
                  TRANSFORMATION SCORE
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   SKILLS (0-100)    TRACTION (0-100)   SELF-EFFICACY (0-100)
   DE-24 coverage    Dogfooding proof   De Noble scale
   (mentor eval +    (#users, LOI,      (5 items, T0/T+event/T+3M)
    self report)     pre-orders)
```

3 dimensions visibles Player détail livrable (cohérent R1) + dashboard Mentor + agrégation cohort GameMaster + report Theory of Change pour partenaires (Tamwilcom, EIC, UM6P).

## 4 takeaways structurants Round 4

1. **AI = scaffolder cohort+mentor, pas remplaçant** — corpus propriétaire (livrables validés) + RAG DE-24 + 5 modes (diagnoste/exemples/socratique/prep-mentor/simulator)
2. **Simulation = what-if calculators légers** sur Unit Economics / Pricing / TAM — pas Capsim-killer
3. **Transformation Score remplace XP** — Skills + Traction + Self-Efficacy. Cohérent R1, mesure outcomes pas outputs
4. **Effectuation comme ouverture L0** — `bird-in-hand-v1` premier livrable, ancrage mindset + différenciation pédagogique

## Sources Round 4

- [CoFounder.ai 2025 launch](https://aitoolsclub.com/meet-cofounder-a-platform-that-lets-you-run-an-entire-company-with-ai-agents/)
- [FounderPal](https://founderpal.ai/)
- [AI agents roadmap 2025 RAG/MCP/Memory](https://www.the-ai-corner.com/p/ai-agents-roadmap-2025-best-projects-rag-mcp-memory)
- [Engineering the RAG stack review arxiv 2026](https://arxiv.org/pdf/2601.05264)
- [AI scaffolding mentor-novice paper arxiv 2508.11052](https://arxiv.org/pdf/2508.11052)
- [Top 20 serious games entrepreneurs 2025 Female Switch](https://www.femaleswitch.com/playbook/tpost/dt2eihs5a1-top-20-serious-games-for-entrepreneurs-i)
- [Agent-based serious game entrepreneurship paper](https://www.academia.edu/78578317/An_agent_based_serious_game_for_entrepreneurship)
- [Startup accelerator design Springer 2024](https://link.springer.com/article/10.1007/s11187-023-00817-8)
- [Service design framework customer led transformation](https://www.linkedin.com/pulse/service-design-framework-customer-led-transformation-chatterton)
- [MIT D-Lab Theory of Change](https://d-lab.mit.edu/news-blog/blog/theory-change-tool-participatory-design)
- [Output trap → outcomes (UserTesting)](https://www.usertesting.com/resources/podcast/focusing-on-user-outcomes-in-product-development-connor-joyce)
- [Effectuation.org 5 principles](https://effectuation.org/the-five-principles-of-effectuation)
- [Effectuation toolkit](https://effectuation.org/the-effectuation-toolkit)
- [Aarhus University effectuation workshop pack](https://www.au.dk/fileadmin/user_upload/Awareness_Effectuation.pdf)
- [Darden 2025 reimagining EE via effectuation](https://news.darden.virginia.edu/2025/10/28/reimagining-entrepreneurship-education-through-new-frontiers-of-effectuation/)
- [Journey-centric design NN/g](https://www.nngroup.com/articles/journey-centric-design/)
