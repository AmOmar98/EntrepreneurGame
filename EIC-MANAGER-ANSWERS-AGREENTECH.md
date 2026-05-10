# Réponses brief EIC Manager — Bootcamp **AgreenTech 13-14 mai 2026**

> Réponses depuis le knowledge UEMF (programme AgreenTech, scoring AgriTech, baseline Hack'Days Fès-Meknès) + synthèse 2 sous-agents (pragmatique + pédagogique) + review 3 sous-agents v2 (UX + pédagogie + scoring).
> Cohorte cible : **11 porteurs retenus** (séance 05/05), bootcamp à l'EIC Fès Eco-Campus.
>
> **📎 Document compagnon — actions T-3** : `T3-IMPROVEMENTS.md` (schemas JSON v2, 3 règles cardinales pilote, checklist code mar 12/05 23h).
>
> **3 règles cardinales pilote (Omar 10/05/2026)** :
> - **R1** — Score JAMAIS visible côté Players (XP gamification OK · scores notation NO)
> - **R2** — Validators = warnings non-bloquants (`severity: "warn"`), jamais d'erreur qui empêche soumission
> - **R3** — Plus de blocage codé en dur entre missions (mandat humain mentor reste, code ne bloque plus)
>
> **Pondération classement** : `0.20 × Score_Projet + 0.80 × Score_Pitch` (cf. section 3).

---

## 1. Cohorte & comptes (MUST)

- **Nb équipes finales : 11** (cf. présélection 06/05/2026 — 46 reçus / 38 éligibles / 11 retenus)
- **Tableau équipes : voir `cohorte-agreentech.csv`** (joint, prêt à importer — 11 lignes, structure `team_name, project_name, project_pitch, leader_name, leader_email, leader_phone, city, stage, member_emails, member_names`)
  - Emails leaders complets ✅
  - `member_emails` = **[À COMPLÉTER]** systématique → seuls les noms membres sont dans la candidature, leurs emails ne sont pas saisis dans le formulaire AgreenTech (différence avec la collecte HD FM). 2 options : (a) ajouter leader-only au pilote et collecter les emails membres au check-in J1, (b) renvoyer un mini-form Tally aux 11 leaders d'ici 11/05 demandant les 1-3 emails coéquipiers
  - `project_pitch` = 1 phrase synthétisée depuis la candidature (à valider, pas à fabriquer si Omar préfère pitch porteur)
- **Mentors (2-4)** : à arbitrer côté EIC. Recommandation = **3 mentors** (1 expert agronomie + 1 expert tech/IoT + 1 expert business model) répartissant 3-4 équipes chacun. Affectation par thème AgreenTech (eau / précision / résilience / chaîne de valeur) plutôt qu'aléatoire — sinon un mentor "irrigation" évalue un projet "valorisation grignons d'olive", peu pertinent. **[À COMPLÉTER]** = noms + emails mentors EIC + scoring affectation
- **GameMaster** : Omar seul suffit pour 11 équipes en pilote. Si binôme côté EIC, ajouter Fatimaezzahra FOUAD ou Ghada BOUHLAL (qui suivent l'admin AgreenTech)
- **Magic links** : envoi recommandé **lundi 11/05 fin de journée** = J-2. Permet de débugger les "je n'arrive pas à me connecter" mardi 12, et libère le matin du 13 pour l'animation pas pour le SAV technique

---

## 2. Programme & livrables (MUST — seed event)

### Programme **Jour 1 (mer 13/05)**

| Heure | Bloc | Animation | Livrable produit |
|---|---|---|---|
| 09h00-09h30 | Accueil + onboarding plateforme | GameMaster | (Onboarding 5 questions diagnostic — Niveau 0) |
| 09h30-11h30 | **Atelier 1 — Hypothèse de proposition de valeur AgriTech** | Mentor business | L1 (M1.1) — phrase à trous 4 champs in-platform |
| 11h30-12h30 | **Atelier 2.1 — Persona Agriculteur** | Mentor agronomie | L2.1 (M2.1) — fiche persona structurée 6 champs in-platform |
| 12h30-13h30 | Déjeuner + appels téléphoniques agriculteurs | (en autonomie équipes) | (préparation L2.2) |
| 13h30-15h00 | **Atelier 2.2 — Verbatims terrain (3 cartes)** | Mentor agronomie | L2.2 (M2.2) — 3 cartes verbatims in-platform (BLOQUANT) |
| 15h00-16h30 | **Atelier 3 — MoSCoW Prototype** ⭐ | Mentor tech | L3 (M3.1) — 4 buckets Must/Should/Could/Won't (cartes répétables) + croquis MVP optionnel |
| 16h30-18h00 | **Atelier 4 — Coûts par hectare + ROI** | Mentor business | L4 (M4.1) — résumé in-platform + lien tableur |
| 18h00-18h30 | Daily debrief + check rouge/vert | GameMaster | — |

### Programme **Jour 2 (jeu 14/05)**

| Heure | Bloc | Animation | Livrable |
|---|---|---|---|
| 09h00-10h30 | **Atelier 5 — Plan acquisition intermédiaires** | Mentor business | L5 — 3 canaux nommés (1 non-digital min) |
| 10h30-11h00 | Pause + appel agriculteur partenaire | (script EIC) | Bonus optionnel — Lettre engagement |
| 11h00-12h30 | **Atelier 6 — Pitch Deck v1 (6 slides)** | Tous mentors | L6 — Deck 6 slides (slide 4 "Preuve terrain" obligatoire) |
| 12h30-13h30 | Déjeuner + impression decks | — | — |
| 13h30-16h30 | **Pitch jury** (5 min/équipe + 3 min Q&A) | Jury Tamwilcom + BoA Academy + Innov Invest + Bluespace | Scoring jury 5×20 |
| 16h30-17h00 | Délibération jury | — | — |
| 17h00-17h30 | **Publication résultats + cérémonie** | EIC + jury | Page `/results` ouverte par GM |

### Liste finale 7 missions (6 livrables, L2 décliné en L2.1+L2.2)

> **Décision tranchée** : 6 livrables obligatoires + 1 bonus optionnel J2. **L2 éclaté en 2 sous-missions guidées** (L2.1 Persona + L2.2 Verbatims) — pattern UI à phrase à trous / fiche structurée comme la mission M3.3 du design v2 (cf. screenshot référence + section "Pattern UI mission" ci-dessous). Mix `proof_text` in-platform (saisie guidée, format de base) + `proof_url` externe (croquis, tableur, deck).
>
> **Format `proof_text`** au sens v0.2 = **pas un markdown libre** mais un **template structuré à champs imposés** (phrase à trous OU fiche multi-champs OU cartes répétables) qui se remplit dans la plateforme — le mentor voit la structure remplie, pas un blob texte.

| # | Niveau | Mission | Format | Champs imposés | Due | Spécificité AgriTech |
|---|---|---|---|---|---|---|
| **L1** | N1 · Découverte | **M1.1 — Hypothèse de proposition de valeur AgriTech** | `proof_text` (phrase à trous, 4 champs cliquables) | `[CIBLE]` `[BESOIN]` `[OFFRE]` `[DIFFÉRENCIATION]` | mer 11h30 | Cible doit nommer un segment d'agriculteur précis (filière + zone) · Besoin = douleur observée terrain (pas supposée) · Différenciation face au statu quo agricole (pas vs concurrent SaaS) |
| **L2.1** | N2 · Cible | **M2.1 — Persona Agriculteur cible** | `proof_text` (fiche structurée, 6 champs) | `[NOM]` `[CULTURE/FILIÈRE]` `[TAILLE EXPLOITATION en ha]` `[ZONE oasis/irrigué/bour]` `[REVENU ANNUEL ESTIMÉ DH]` `[CANAL D'INFO PRINCIPAL]` | mer 12h30 | Champs imposés = pas de fiche libre. Force à choisir 1 zone, 1 filière, 1 taille — pas "agriculture marocaine" générique. Revenu en DH oblige à confronter accessibilité tarifaire L4 |
| **L2.2** | N2 · Cible | **M2.2 — 3 Verbatims terrain** ⚠️ recommandé fort | `proof_text` (3 cartes répétables) | par carte : `[NOM PRÉNOM + ÂGE]` · `[CULTURE/CONTEXTE]` · `[CITATION TEXTUELLE entre guillemets]` · `[DATE]` · `[CANAL téléphone/présentiel/WhatsApp]` | mer 15h00 | **Pas de blocage codé en dur** (R3) — tooltip ambre sur L3 "Astuce : compléter L2.2 améliore L3" + flag mentor si équipe progresse à L4 sans avoir soumis L2.2 → mentor pingue à 14h. Téléphone accepté (déjeuner réservé pour ça). Anti-"tech without farmer" via mandat humain mentor |
| **L3** | N3 · Solution | **M3.1 — MoSCoW Prototype** ⭐ | `proof_text` (4 colonnes MoSCoW · cartes répétables par colonne) + `proof_url` optionnel (croquis MVP) | par carte (Must/Should/Could/Won't) : `[FEATURE]` · `[POURQUOI prioritaire à ce niveau]` · `[CONTRAINTE TERRAIN levée]` (autonomie / maintenance / littératie / connectivité / coût) | mer 16h30 | Force l'arbitrage MVP vs vision : tech IoT/IA souvent fantasmée → MoSCoW exige de séparer le **livrable du bootcamp** (Must = pilote 1 saison) du rêve scaling (Could/Won't). Min 2 cartes Must · min 1 carte Won't (anti scope-creep) · au moins 1 contrainte terrain explicite par Must |
| **L4** | N4 · Économie | **M4.1 — Coûts par hectare + ROI agriculteur** | hybride : `proof_text` (4 champs résumé) + `proof_url` (Google Sheet détail) | `[CAPEX/ha installation]` `[OPEX/ha annuel]` `[ROI en mois]` `[MODÈLE DE PORTAGE achat / leasing coop / service à l'ha]` | mer 18h00 | Maille hectare obligatoire (pas global) · prix benchmarké pouvoir d'achat petit exploitant (<500 DH/ha/an pour service récurrent) |
| **L5** | N5 · Marché | **M5.1 — Plan d'acquisition via 3 intermédiaires** | `proof_text` (3 cartes répétables) | par carte : `[ORGANISATION NOMMÉE]` · `[CYCLE DE DÉCISION : qui décide]` · `[CANAL : digital ou physique]` · `[ACTION SEMAINE 1 POST-BC]` | jeu 10h30 | **≥1 canal non-digital recommandé** (ORMVA, coopérative, foire, ONCA). Si 3 cartes "digital" → bandeau ambre warning Player + flag mentor (R2 — pas de refus de soumission) |
| **L6** | N6 · Pitch | **M6.1 — Pitch Deck v1 (6 slides)** | `proof_url` (PDF Canva/Slides) + `proof_text` (script slide 4) | `[SLIDE 4 : Preuve terrain — verbatim OU photo prototype OU lettre intention]` saisi en plateforme + lien deck complet | jeu 14h00 | Slide 4 recommandée — bouton `Citer ce verbatim` pré-remplit depuis L2.2. Si vide ou sans citation L2.2 / chiffre L4 = warning Player + flag mentor (R2) |
| **B** | N6 · Pitch | **M6.2 — BONUS Lettre engagement agriculteur** | `proof_url` (photo lettre / SMS / WhatsApp horodaté) | — | jeu 11h00 | Optionnel — `+5 pts au Score Projet` (alignement bonus AAP basculé côté projet — preuve livrée vs claim oral). EIC mobilise 5-8 agriculteurs GreenOpen Lab/T4F en standby J2 8h-11h |

**Synthèse formats** : 4 missions 100% `proof_text` in-platform (L1, L2.1, L2.2, L5) + 2 hybrides (L3, L4) + 1 `proof_url` pur (L6) + 1 bonus `proof_url` (B). **L1 sort de la dépendance Canva** → alerte rouge n°1 partiellement absorbée.

### Ce qu'on **ne met PAS** dans la plateforme pendant les 2 jours (post-bootcamp J+15 à J+30)

- ❌ **Market Study** (20-30 interviews agriculteurs) — irréaliste 2j → repoussé J+30 post-BC
- ❌ **KPI Dashboard** — suppose modèle éco stabilisé, irréaliste idéation → repoussé J+15 post-BC
- ❌ **Pitch Deck v2 investor-ready** — Le deck v1 du bootcamp suffit ; v2 = J+15

---

## 3. Critères d'évaluation (MUST — `scoring_rubric` figée)

### Score Projet (par livrable, 4 critères × 5 pts = /20 par livrable, agrégé /120 puis ramené /100)

Adaptation directe du scoring AgreenTech officiel (`knowledge/frameworks/scoring-agreentech.md`) :

| Critère livrable | Pondération | Indication mentor |
|---|---|---|
| Innovation / pertinence AgriTech | /5 | Adresse 1 des 4 thèmes prioritaires (eau / précision / résilience / chaîne de valeur) ? Adaptation au contexte marocain ? |
| Faisabilité technique terrain | /5 | Robustesse en conditions réelles · autonomie énergétique · maintenance par l'agriculteur |
| Modèle éco accessible | /5 | Coopérative-friendly · accessibilité tarifaire petits exploitants |
| Qualité du livrable lui-même | /5 | Hypothèses falsifiables présentes · données chiffrées vs affirmations |

### Score Pitch Jury Jour 2 (5 critères × 20 pts = /100)

**Conserver les 5 critères standards** (clarté pitch / structure deck / crédibilité / qualité roadmap / qualité oral) **mais ajouter pondération AgriTech** dans les commentaires d'évaluation : le critère "crédibilité" doit explicitement intégrer "preuve terrain" (verbatim, lettre, photo prototype).

### Pondération classement final — **20% Projet + 80% Pitch**

Décision Omar 10/05 : `Classement = 0.20 × Score_Projet_norm + 0.80 × Score_Pitch_norm` (ramenés tous deux /100 avant pondération).

**Pourquoi 20/80** :
- Pitch jury = moment phare avec les 4 partenaires bailleurs (Tamwilcom / BoA Academy / Innov Invest / Bluespace) — c'est ce qui sera vu et qui engagera les ressources post-bootcamp
- Score Projet = surtout valeur **pédagogique** (apprendre à structurer hypothèse VP, MoSCoW, persona, ROI) — pas un test de maturité business
- Cohorte hétérogène Idée → Clients : un ratio 20/80 réduit l'effet Matthew (équipes Clients comme SagriPlast moins favorisées sur le projet, plus dépendantes de la performance pitch live)
- Les scores n'étant **jamais affichés aux Players** (cf. règle cardinale R1 ci-dessous), les équipes ne peuvent pas optimiser stratégiquement le ratio — donc moins de risque de "all-in pitch" cynique

### ⚠️ Règle cardinale R1 — Scores invisibles côté Players

Les scores `Score_Projet`, `Score_Pitch`, `Classement` et tout calcul dérivé sont **strictement internes** :
- ✅ **Visible Mentor / GameMaster / Jury** : tout (scores bruts + pondérés + rangs)
- ❌ **JAMAIS Player** : aucun chiffre, aucun rang, aucune comparaison directe à une autre équipe
- ✅ **OK côté Player** (gamification non-comparative) : XP de progression (badges niveaux), compteur "X/N champs remplis" perso, Cohort Pulse Bar `7/11 équipes ont soumis L2.1` (chiffres anonymisés, pas nominatifs)
- **Canal officiel du feedback chiffré** = lettre retour signée jury en PDF privé par équipe (cf. C4 dans `T3-IMPROVEMENTS.md`)

### Bonus (alignement AAP AgreenTech) — basculés côté Score Projet

> Les bonus AAP s'ajoutent désormais au **Score Projet** (pas Score Pitch) — pour récompenser des **preuves livrées** (artefacts vérifiables) plutôt que des claims oraux.

| Bonus appliqué | Impact |
|---|---|
| Livrable B "Lettre engagement agriculteur" produit jeu 11h | +5 pts au Score Projet |
| Mention open-source dans Pitch Deck (slide dédiée) | +2 pts au Score Projet |
| Pilote terrain déjà lancé (preuve dans L3 ou pitch) | +3 pts au Score Projet |

---

## 4. Branding / assets (MUST)

- **Logos partenaires** : la liste actuellement seedée `tamwilcom, bank-of-africa, innov-invest, bluespace, eic, uemf` est **alignée AgreenTech** (mêmes 4 partenaires que Tamwilcom/Innov Invest/BoA + EIC/UEMF) ✅
- **À fournir d'ici 12/05** : SVG vectoriels logos partenaires (chemins imposés `public/brand/partners/{tamwilcom,bank-of-africa,innov-invest,bluespace,eic,uemf}.svg`)
- **Source recommandée** : kit communication AgreenTech déjà produit (`Reglement Appel à projets AgreenTech.pdf` + affiches Instagram du 14/04) — extraire les logos via Inkscape ou demander aux 4 partenaires
- **Palette EIC `#1B3A5C` / `#2E7D32` / `#F6F1E8`** : conforme à la charte EIC ✅ (cohérent avec `knowledge/style/`)
- **Polices Baskervville + Montserrat** : pas de contre-indication EIC, valide

---

## 4 bis. Pattern UI mission (référence design v2 — screenshot M3.3)

> Toutes les missions livrables AgreenTech (L1 → L6 + L2.1, L2.2, B) **DOIVENT** suivre ce pattern UI unique pour tenir la promesse design v2 (cohérence éditoriale + crédibilité partenaires + apprentissage guidé pour cohorte 12-15,5/20).

### Layout 3 colonnes (1280px+)

```
┌────────────────────────────────────────────────────────────────────┐
│ [← Parcours]  L_n · Niveau · M_n.x          ! éch HH:MM  +XP  [YA] │  ← header
├──────────────────┬──────────────────────────┬──────────────────────┤
│ OBJECTIF MISSION │   MISSION                │  Mentor (avatar)     │
│ (1 phrase claire)│   <Titre Baskervville>   │  · disponible        │
│                  │   <sous-titre Montserrat>│  ┌─────────────────┐ │
│ CRITÈRES VALID.  │                          │  │ commentaire     │ │
│ ① champ 1        │   ┌────────────────────┐ │  │ async tagué     │ │
│ ② champ 2        │   │                    │ │  │ (remarque/à     │ │
│ ③ champ 3        │   │  ZONE DE SAISIE    │ │  │ corriger)       │ │
│ ④ champ 4        │   │  GUIDÉE            │ │  └─────────────────┘ │
│                  │   │  (phrase à trous   │ │  [Demander aide]    │
│ PREUVES LIÉES    │   │   OU fiche struct  │ │  [Voir notes]       │
│ (M_n.x amont)    │   │   OU cartes répét) │ │                      │
│ – verbatim/fact 1│   │                    │ │  ASTUCES             │
│ – verbatim/fact 2│   │                    │ │  ◊ astuce 1          │
│ – verbatim/fact 3│   │                    │ │  ◊ astuce 2          │
│ + N autres       │   └────────────────────┘ │  ◊ astuce 3          │
│                  │   [▓▓░░░] x/N champs     │                      │
│                  │   [Brouillon] [Soumettre]│                      │
└──────────────────┴──────────────────────────┴──────────────────────┘
```

### Composants à seeder / coder (8)

| ID | Composant | Source v0.2 | Détails AgreenTech |
|---|---|---|---|
| **A** | **MissionBreadcrumb** | nouveau v0.2 | `[← Parcours] L_n · Niveau · M_n.x` — ex `L1 · Découverte · M1.1` |
| **B** | **HeaderBadges** | partiel v0.1 | `! échéance HH:MM` (couleur ambre si <2h) + `+XP gain` + avatar équipe (initiales) |
| **C** | **MissionObjectiveCard** | nouveau v0.2 | 1 phrase d'objectif (Montserrat) + liste numérotée de **critères de validation** (1 par champ obligatoire) |
| **D** | **LinkedProofsCard** | nouveau v0.2 | Référence aux **preuves issues d'une mission amont** (ex L3 affiche les 3 verbatims de L2.2). Lecture rapide cliquable, ne renvoie pas vers la mission amont (reste sur la mission courante). Limité à 3 visibles + "+N autres" |
| **E** | **GuidedInputArea** ⭐ | nouveau v0.2 | **Cœur de la mission**. 3 variants : (E1) **PhraseATrous** (texte éditorial avec slots underlinés cliquables — cf. M3.3 screenshot), (E2) **FicheStructurée** (champs labellisés avec placeholder), (E3) **CartesRépétables** (n cartes ajoutables avec sous-champs imposés). Chaque champ = obligatoire/optionnel + validation Zod côté server action |
| **F** | **MissionFooter** | partiel v0.1 | Compteur `[▓▓░░░] x/N champs remplis` (anti-soumission incomplet) + bouton secondaire `Brouillon` (auto-save) + bouton primaire `Soumettre au mentor` (disabled si validation échoue) |
| **G** | **MentorAsyncCard** | nouveau v0.2 | Avatar mentor + statut `· disponible / · occupé / · hors ligne` + dernier commentaire async tagué (`remarque` / `à corriger`) + boutons `Demander aide` (ping mentor) / `Voir notes` (historique async) |
| **H** | **TipsCard** | nouveau v0.2 | 3 astuces contextuelles à la mission (◊ marker éditorial vert EIC). **Astuces écrites en seed**, pas générées AI |

### Variants d'écran (4)

| Écran | Quand | Différence vs base |
|---|---|---|
| **E.base** | Mission ouverte, brouillon en cours | Layout ci-dessus, footer compteur + boutons |
| **E.soumis** | Après clic `Soumettre` | **Stamp éditorial "SOUMIS"** au-dessus de l'aire de saisie (semi-transparent, watermark) · footer remplacé par `En attente de revue mentor` · zone de saisie verrouillée |
| **E.révision** | Mentor a tagué `à corriger`, équipe revient | **Bandeau bleu en haut** : *« Aucune perte d'XP. Affinez les champs marqués pour soumettre une V2. »* · champs précédemment validés grisés (consultables, non éditables) · seuls les champs taggés sont éditables |
| **E.bloqué** | Mission verrouillée (ex L3 si L2.2 vide) | Layout grisé · banner rouge en haut : *« Cette mission s'ouvre quand M2.2 (Verbatims) est soumise. Mandat mentor anti-tech-without-farmer. »* |

### Spec champs guidés AgreenTech (à seeder dans `deliverable_templates`)

```jsonc
// L1 (M1.1) — PhraseATrous (variant E1)
{
  "mission_id": "M1.1",
  "type": "phrase_a_trous",
  "template": "Pour {{cible}} qui {{besoin}}, notre offre {{offre}} contrairement à {{differenciation}}.",
  "fields": [
    { "key": "cible",          "label": "Segment d'agriculteur cible (filière + zone)", "min": 8,  "max": 80,  "example": "maraîchers du périmètre R'kiz (Souss)" },
    { "key": "besoin",         "label": "Douleur observée terrain (pas supposée)",       "min": 10, "max": 140, "example": "sur-irriguent par peur du manque, perdent 30% engrais" },
    { "key": "offre",          "label": "Ce que vous proposez de concret",                "min": 8,  "max": 100, "example": "sondes 3-en-1 LoRa + SaaS d'irrigation auto" },
    { "key": "differenciation","label": "Face à quoi vous vous positionnez",              "min": 8,  "max": 100, "example": "à l'irrigation manuelle traditionnelle" }
  ],
  "tips": [
    "Soyez précis sur la cible — évitez « tous les agriculteurs ».",
    "Le besoin doit être une douleur observée terrain, pas supposée.",
    "Le différenciateur tient en un seul angle (eau / coût / temps / accès)."
  ]
}

// L2.1 (M2.1) — FicheStructurée (variant E2)
{
  "mission_id": "M2.1",
  "type": "fiche_structuree",
  "fields": [
    { "key": "nom",          "label": "Nom (réel ou surnom)",      "min": 2 },
    { "key": "filiere",      "label": "Culture / filière",         "min": 3 },
    { "key": "taille_ha",    "label": "Taille exploitation (ha)",  "type": "number", "min": 0.1 },
    { "key": "zone",         "label": "Zone agro-écologique",      "type": "enum", "options": ["oasis","irrigué","bour","montagne"] },
    { "key": "revenu_dh",    "label": "Revenu annuel estimé (DH)", "type": "number" },
    { "key": "canal_info",   "label": "Canal d'info principal",    "type": "enum", "options": ["radio","WhatsApp","coopérative","ORMVA","voisin","aucun"] }
  ]
}

// L2.2 (M2.2) — CartesRépétables (variant E3) — min 3 cartes pour soumettre
{
  "mission_id": "M2.2",
  "type": "cartes_repetables",
  "min_cards": 3, "max_cards": 6,
  "card_fields": [
    { "key": "nom_age",  "label": "Nom prénom + âge" },
    { "key": "contexte", "label": "Culture / contexte exploitation" },
    { "key": "citation", "label": "Citation textuelle (entre guillemets)", "min": 20 },
    { "key": "date",     "label": "Date entretien", "type": "date" },
    { "key": "canal",    "label": "Canal", "type": "enum", "options": ["téléphone","présentiel","WhatsApp"] }
  ],
  "blocks_progression_to": ["M3.1","M4.1","M5.1","M6.1"]
}

// L3 (M3.1) — MoSCoW Prototype (variant E3 multi-buckets) ⭐
// 4 colonnes Must/Should/Could/Won't, cartes répétables par colonne
{
  "mission_id": "M3.1",
  "type": "moscow_prototype",
  "buckets": [
    {
      "key": "must",
      "label": "MUST have — pilote 1 saison",
      "color": "eic-green",
      "min_cards": 2, "max_cards": 5,
      "help": "Sans ces features, le prototype ne tient pas debout en conditions réelles. Ce que l'agriculteur teste J1 du pilote."
    },
    {
      "key": "should",
      "label": "SHOULD have — V2 post-pilote",
      "color": "eic-blue",
      "min_cards": 1, "max_cards": 5,
      "help": "Important mais pas vital. Ajout après retour terrain de la 1ère saison."
    },
    {
      "key": "could",
      "label": "COULD have — Si temps + budget",
      "color": "neutral",
      "min_cards": 0, "max_cards": 5,
      "help": "Souhaitable. Différenciateur potentiel si exécution rapide."
    },
    {
      "key": "wont",
      "label": "WON'T have — Hors scope assumé",
      "color": "muted",
      "min_cards": 1, "max_cards": 5,
      "help": "Explicitement écarté pour la 1ère version. Anti scope-creep — protège le focus du pilote."
    }
  ],
  "card_fields": [
    { "key": "feature",   "label": "Feature / capacité",                                  "min": 5, "max": 80 },
    { "key": "pourquoi",  "label": "Pourquoi à ce niveau de priorité",                    "min": 10, "max": 140 },
    { "key": "contrainte","label": "Contrainte terrain levée (Must/Should uniquement)",   "type": "enum",
                          "options": ["autonomie énergétique","maintenance par l'agriculteur","littératie tech","connectivité 3G/2G","coût/ha","résistance climat","conformité ONSSA/ORMVA","aucune"],
                          "required_when_bucket_in": ["must","should"] }
  ],
  "validation_rules": [
    "Au moins 2 cartes dans MUST",
    "Au moins 1 carte dans WON'T (anti scope-creep)",
    "Toute carte MUST/SHOULD doit lever 1 contrainte terrain (pas 'aucune')"
  ],
  "optional_proof_url": {
    "key": "croquis_mvp",
    "label": "Croquis MVP (Canva, Figma, ou photo croquis main levée)",
    "required": false
  },
  "tips": [
    "Le MUST n'est pas la vision — c'est ce que l'agriculteur teste à J1 du pilote.",
    "Au moins 1 WON'T est obligatoire : si tout est important, rien ne l'est.",
    "Tech IoT/IA = souvent fantasmée. Demandez-vous : ça tient sans 4G ? sans technicien sur place ?"
  ]
}
```

> Idem L4/L5/L6 — patterns hybrides (E2 + lien externe) ou cartes répétables. Schemas complets à figer dans `lib/data.ts` ou table `deliverable_templates` avant **mar 12/05 14h**.

---

## 5. Logistique salle (MUST)

- **Wifi EIC Eco-Campus** : historique HD FM avril 2026 = saturation observée à 8 startups simultanées. Pour 11 équipes × 6 livrables = ~66 soumissions sur 2j dont 4 livrables `proof_url` (Canva/Drive). **Test débit obligatoire mardi 12/05 14h** avec 11 devices simulés. Mot de passe wifi à communiquer aux porteurs **dès accueil 9h** (slide projetée + impression).
- **Écran de projection** : oui, j'affiche le tableau cohorte `/admin` en live (ratchet d'engagement, les équipes voient leur progression vs voisines)
- **Salle pitch J2** : config théâtre — jury Tamwilcom/BoA/Innov Invest/Bluespace en arc de cercle, équipes en U face. Micros : 1 pour pitcheur + 1 pour jury. **Ordre de passage** = seedé en DB par ordre alphabétique projet (drag-to-reorder = v0.2 non-livré)
- **Comptes laptop équipes** : à arbitrer EIC. Recommandation = **mix BYOD + 3 laptops EIC fournis en backup** (porteurs Kelaat des Sraghna + Biougra + Oued Zem viennent de loin, peuvent ne pas avoir laptop). Sinon plateforme accessible via mobile (responsive minimal v0.1).

---

## 6. Communication aux équipes (MUST)

- **Email de bienvenue type** : à envoyer **dimanche 11/05 17h-18h** par Fatimaezzahra FOUAD (continuité avec son mail "Bienvenue" HD FM du 13/04 16:55 — cohérence interlocuteur). Contenu :
  1. Félicitations + cadrage AgreenTech (4 thèmes)
  2. Programme bootcamp 13-14 mai (joindre PDF)
  3. **Magic link login** (1 par équipe leader)
  4. Logistique : adresse EIC Eco-Campus, parking, déjeuner inclus, dress code business casual
  5. Préparation amont : "venir avec 1 contact agriculteur de votre réseau si possible — sinon nous vous mettrons en relation J2 matin"
  → **EIC rédige** (continuité contact AAP) — je peux fournir un draft via `/draft-email` si besoin
- **5 questions Likert diagnostic Niveau 0** : conserver le set par défaut de la plateforme (auto-évaluation : connaissance AgriTech / maturité projet / expérience terrain / capacité financière / clarté équipe). Pas de sur-spec EIC ici, c'est juste un onboarding warmup
- **CGU / mention data** : recommandation simple = ajouter 1 phrase au bas de l'écran login : *"En vous connectant, vous acceptez que vos livrables soient consultables par les mentors EIC et le jury bailleur. Vos données restent propriété de votre équipe."* → suffit pour pilote, RGPD-compliant minimal

---

## 7. Publication & cérémonie (MUST jour 2)

- **Heure publication résultats** : **17h00 J2 (jeu 14/05)** — après délibération jury 16h30-17h00. La page `/results` est gatée par bouton GameMaster ✅
- **Cérémonie podium — format qualitatif (R1 : aucun chiffre/rang affiché)** :
  1. Annonce verbale GameMaster des **3 lauréats Excellence** (top score absolu)
  2. Annonce des **2 lauréats Trajectoire** (filtre Idée + Premier Prototype, formule `Score_traj = Score_final - Score_présélection × 5`) — récompense la pente, pas le niveau
  3. Annonce des **2 Wildcards AAP** (sélection jury sur intuition "café dans 6 mois", fast-track AAP Tamwilcom suivant)
  4. Pour les 4 équipes restantes : remise lettre retour signée jury (PDF privé, 1 force / 1 risque / 1 next step 30 jours)
  5. Photo de groupe partenaires
- **Page `/results` Player** : annonce qualitative des 7 reconnaissances ci-dessus, **pas de tableau de scores, pas de rang individuel pour les non-cités**. Chaque équipe reçoit sa lettre retour signée jury en PDF privé via la plateforme (canal officiel du feedback chiffré)
- **Page `/admin` GameMaster** : tableau complet 11 équipes avec Score_Projet · Score_Pitch · Classement_Excellence · Classement_Trajectoire (visible Omar + Fatimaezzahra + jury post-cérémonie)
- **Récompenses post-bootcamp** : 3 Excellence + 2 Trajectoire = 5 équipes accompagnées → mentoring 3 mois + accès UEMF research platforms + intro investisseurs. **Certificats individuels** pour les 11 (template Word + mailmerge depuis export `players.csv`) — je peux générer les 11 PDF si template fourni
- **Photos / live tweets** : autorisé, attribution `#AgreenTech #EIC #UEMF #Tamwilcom @BankOfAfricaAcademy @InnovInvest`. Mention spéciale : nommer les 2 femmes leadership (El Aissaoui, Ezzouzi) si elles donnent OK photo

---

## 8. Contingence (NICE)

- **Mentor absent J** → fallback = redistribution équipes vers les 2 autres mentors (3 mentors = 4 équipes/mentor max acceptable). Si 2 mentors absents = Omar + Fatimaezzahra prennent le relais sur les évaluations critiques (L2 et L6)
- **Équipe abandonnée en cours** → garde dans le classement avec score partiel (livrables manquants = 0/20 sur ce livrable, agrégat /120 incomplet). Pas d'exclusion = équité bailleur, donne lecture honnête de la complétabilité
- **Vercel/Supabase down 30 min** → plan B papier : grilles d'évaluation imprimées en amont + collecte verbatims/croquis sur feuille A3, ressaisie post-incident dans la plateforme. Imprimer les 6 templates de livrables vendredi 12/05 = 5 min, sécurise le pire cas

---

## 9. Post-pilote (NICE)

- **Rapport partenaires** : utiliser le **Canvas Tamwilcom 011 (Rapport Post-Événement)** comme HD FM avril 2026 (cf. `011. Rapport Post-Événement Hack'Days Fès-Meknès 20260422.docx`). Format identique (export possible via `/rapport-tamwilcom` dans cette session UEMF). Délai standard = J+15 = livraison 29/05/2026
- **Réutilisation cohortes futures** : v0.3 multi-event est dans le scope — chaque cohorte AgreenTech / StarTech / Hack'Days = 1 event isolé en DB. Permet de relancer pour StarTech 4 (sept 2026) sans perte de données AgreenTech
- **Conservation données joueurs (RGPD)** : conserver 24 mois pour suivi cohorte post-bootcamp + reporting bailleur Tamwilcom (alignement règle DPSEE biannuel, cf. `knowledge/compliance/dpsee-reporting-rules.md`). Anonymisation au-delà.

---

## ⚠️ Alertes rouges identifiées (sous-agents)

1. **Connectivité externe (Canva/Drive) — résiduelle** — Adoption du pattern UI guidé v0.2 a **éliminé la dépendance externe pour 4 missions sur 7** (L1, L2.1, L2.2, L5 = 100% in-platform). Risque résiduel sur 3 missions seulement : L3 (croquis MVP), L4 (Google Sheet détail), L6 (Pitch Deck PDF). Mitigation : (a) **fallback upload image directe** (champ `proof_image` accepté en plus du `proof_url` sur L3 — photo croquis main levée), (b) test débit wifi mar 12/05 14h, (c) compte Canva Team UEMF avec 11 sous-dossiers équipe-X pré-partagés
2. **Risque "tech without farmer"** — 4-5 équipes sur 11 vont arriver avec une solution tech (capteur IoT, app IA) sans avoir parlé à un agriculteur. Garde-fou désormais **humain (R3)** : pas de blocage codé en dur (risque de bug à T-3 trop élevé). À la place : (a) tooltip ambre sur L3 "Astuce : compléter L2.2 améliore L3" + carte L3 légèrement saturée, (b) **flag rouge dashboard mentor** si équipe atteint L4 sans avoir soumis L2.2 → mentor pingue obligatoirement à 14h00 J1, (c) mentor a mandat explicite de marquer `à corriger` toute soumission L3/L6 sans preuve terrain
3. **Hétérogénéité géographique** — porteurs viennent de Biougra, Oued Zem, Kelaat des Sraghna, Agadir, Rabat, Fès, Meknès, El Hajeb, Casablanca. Plusieurs n'auront pas leurs équipes physiquement présentes (membres dans d'autres villes). Cadrer dès accueil J1 : "le pitch jury J2 c'est le porteur principal, pas l'équipe complète" — sinon frustration
4. **Charge mentor sur missions guidées** — 7 missions × 11 équipes = 77 soumissions à reviewer en 30h. Le pattern v0.2 (commentaire async tagué `remarque/à corriger` sur chaque champ) est plus rapide à produire qu'un feedback libre, mais il faut **briefer les 3 mentors mar 12/05 16h** sur le format tag + sur les critères de validation par champ (cf. `MissionObjectiveCard` critères ① à ④ par mission)

---

## Ordre d'exécution recommandé (T-3)

| Quand | Quoi | Owner |
|---|---|---|
| **Lun 11/05 matin** | Compléter `member_emails` dans CSV (Tally form aux 11 leaders) | EIC + Omar |
| **Lun 11/05 matin** | Confirmer noms + emails 3 mentors EIC + affectation équipes | EIC |
| **Lun 11/05 14h** | Import CSV cohorte → génération magic links | Omar (`/admin/import`) |
| **Lun 11/05 17h** | Envoi mail bienvenue + magic links par Fatimaezzahra | EIC |
| **Mar 12/05 14h** | Test débit wifi salle bootcamp (11 devices) | Omar + IT EIC |
| **Mar 12/05** | Récupération 6 SVG logos partenaires + commit dans `public/brand/` | Omar |
| **Mar 12/05** | Impression 6 templates livrables papier (plan B) + grilles évaluation | EIC admin |
| **Mar 12/05 soir** | Mobilisation 5-8 agriculteurs partenaires GreenOpen Lab/T4F (standby J2 8h-11h) | EIC |
| **Mer 13/05 09h00** | Bootcamp J1 — début | Omar + mentors |

---

*Document généré 2026-05-10 (T-3). Sources : `knowledge/programs/agreentech.md`, `knowledge/frameworks/scoring-agreentech.md`, `knowledge/programs/hackdays-fes-meknes.md` (baseline), candidatures `agreentech-data.json` (présélection 06/05), 2 sous-agents (pragmatique + pédagogique). À cross-checker avec le programme officiel Tamwilcom AgreenTech (PDF règlement à comparer si différence).*
