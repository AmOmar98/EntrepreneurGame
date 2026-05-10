# Améliorations T-3 — Pilote AgreenTech 13-14 mai 2026

> Patch issu de la review 3 sous-agents (UX/game flow · pédagogie/coaching · scoring/théorie des jeux), filtré par 3 règles cardinales pilote + ratio 20/80 (Omar 10/05/2026).
> **Fichier de référence pour le code à figer avant mar 12/05 23h.**

## Pondération classement final — 20% Projet / 80% Pitch

`Classement = 0.20 × Score_Projet_norm + 0.80 × Score_Pitch_norm` (ramenés tous deux /100 avant pondération).

**Implications côté code** :
- Calcul `final_score` dans logique scoring `/admin` : `final = projet * 0.2 + pitch * 0.8`
- Bonus AAP (`+5` lettre engagement, `+2` open-source, `+3` pilote terrain déjà) **basculés côté Score Projet** (preuves livrées vs claims oraux). Plafond Score Projet reste 100 même avec bonus.
- Z-score normalisation mentor (D3 Big Bet v0.3) devient encore plus important une fois projet pondéré 20% — sinon 1 mentor laxiste = +20 pts à toute sa cohorte sur 100 finals (= ±4 pts seulement après pondération, gérable au pilote sans normalisation)
- Le Score Projet sert surtout à **trancher les ex-aequo pitch** et à alimenter la **lettre retour jury** (canal officiel feedback)

**Implications côté Player (R1 active)** :
- Aucune visibilité sur le ratio, juste des lauréats annoncés en cérémonie
- Donc pas de risque "all-in pitch" cynique : les équipes ne peuvent pas optimiser stratégiquement

---

## ⚠️ 3 règles cardinales pilote (non-négociables)

### R1 — Score JAMAIS visible côté Players
- **OK Player** : XP gamification (badges de progression), compteur champs remplis, Cohort Pulse Bar (`7/11 équipes ont soumis L2.1` = progression non-comparative), animations soumission
- **INTERDIT Player** : note /140, classement live, score pitch, Z-score, percentile, "vous êtes #3 sur 11"
- **Visible Mentor / GameMaster / Jury** : tout (scores bruts + normalisés)
- **Page `/results` jour 2** : annonce qualitative des lauréats (3 Excellence + 2 Trajectoire + 2 Wildcards), pas de tableau chiffré, pas de rangs des non-lauréats. Lettre retour signée jury par équipe = canal officiel du feedback chiffré (en privé, pas en page publique).

### R2 — Validators = warnings non-bloquants (jamais d'erreur qui empêche soumission)
- Toute règle de validation côté serveur a `severity: "warn"` par défaut au pilote
- Soumission **toujours possible** même si warnings actifs
- Warnings affichés en **bandeau ambre discret** sous le champ concerné côté Player + **flag rouge dans dashboard mentor** ("3 équipes avec champs suspects")
- Mentor décide en async : `à corriger` si signal trop fort / `remarque` sinon
- **Aucun blocage de soumission au pilote** — on collecte tout, on filtre en revue mentor

### R3 — Plus de blocage codé en dur entre missions
- L2.2 → L3 ex-bloquant **passe en warning** : Player peut commencer L3 sans avoir soumis L2.2, mais voit une **tooltip ambre** "Astuce : compléter L2.2 (verbatims) maximise la qualité de votre L3 MoSCoW"
- Mandat mentor anti tech-without-farmer **reste en place côté humain** : flag dashboard si équipe atteint L4 sans L2.2 → mentor pingue à 14h00 J1
- Plus de banner rouge "E.bloqué" → remplacé par variant `E.recommandé` (carte L3 légèrement saturée + petite icône astuce sans changement d'opacité)

---

## A. Quick wins T-3 (mar 12/05 23h max)

| # | Action | Composant | Effort | Impact |
|---|---|---|---|---|
| **A1** | **Auto-save toutes les 8s** + pastille "✓ Sauvegardé il y a 3s" en footer mission | `MissionFooter` | S | Tue l'angoisse "j'ai perdu ma persona" |
| **A2** | **Validators warnings non-bloquants** : liste noire mots seuls (`agriculteurs`, `fermiers`, `exploitants`) sur L1 cible · ROI cohérence L4↔L2.1 (ROI_mois × OPEX/ha × taille_ha vs revenu_persona × 0.3) — TOUT en `severity:"warn"` | Zod schemas + UI bandeau ambre | M | Mentor voit les flags, Player n'est pas bloqué |
| **A3** | **Champ "Hypothèse à invalider" en L1** (1 ligne, optionnel mais recommandé) — l'équipe écrit ce qui prouverait qu'elle se trompe | Schema L1 | S | Cœur Lean Startup, gros ROI pédagogique |
| **A4** | **Compteur "X/N champs remplis" sidebar gauche** au-dessus des critères de validation + coche verte qui pop quand un critère passe | `ValidationChecklist` | S | Lisibilité <3s |
| **A5** | **Pixel mascotte — 3 triggers événementiels** (jamais random) : (a) 1er livrable soumis = euphorique "Première hypothèse posée" · (b) stagnation >15min = inquiet "Une astuce t'attend à droite ◊" · (c) verbatim n°2 saisi = concentré "Encore un et L3 prend de la profondeur" | `PixelMascot` | M | Crée signal sans devenir Clippy |

## B. Medium bets pré-13/05 (2-4h chacun)

| # | Action | Composant | Effort |
|---|---|---|---|
| **B1** | **Cohort Pulse Bar** : `7/11 équipes ont soumis L2.1` (barre fine + nombre, **pas de noms d'équipes**, pas de scores) | nouveau `CohortPulse` | M |
| **B2** | **L3 verrouillage retiré** : remplacé par tooltip ambre "Astuce : compléter L2.2 améliore L3" + carte L3 légèrement saturée mais cliquable. Pas de banner rouge nulle part | `MissionBreadcrumb` + `MissionCard` | S |
| **B3** | **L1 "Hypothèse révisée après L2.2"** : nouveau champ optionnel apparu dans L1 quand L2.2 est soumise. Equipe peut updater son hypothèse de départ. Si V0=V1 mot pour mot, mentor reçoit flag "à challenger" | Schema L1 + state | M |
| **B4** | **Bouton "Citer ce verbatim" en L6 slide 4** qui pré-remplit depuis cartes L2.2 — supprime l'excuse "j'ai oublié les citations" | `Slide4Editor` (L6) | M |
| **B5** | **2 classements internes Excellence + Trajectoire** côté `/admin` et `/jury` (invisible Player) — formule `Score_traj = Score_final - Score_présélection × 5`, filtre Trajectoire = équipes Idée + Premier Prototype uniquement (SagriPlast hors course Trajectoire) | logique scoring `/admin` | M |

## C. Jury / page `/jury` (jeu 14/05 matin pré-pitch)

| # | Action | Composant |
|---|---|---|
| **C1** | **Notation différée + révisable** : pas de score saisi pendant le pitch live. Jury saisit brouillons, voit les 11 brouillons en fin de session, peut réajuster ±10pts par équipe avant de figer | `/jury` workflow |
| **C2** | **Décomposition obligatoire 5 critères × /20** + affichage σ du jury en temps réel ("vous notez tous entre 14-17, pensez à utiliser l'échelle") | `/jury` UI |
| **C3** | **Ordre randomisé pitch** + équipes "ancres" (présélection top) placées en milieu (slot 6), pas en 1 ni 11. Annoncé aux équipes : "ordre tiré au sort" | seed event |
| **C4** | **Lettre retour personnalisée signée jury** — template structuré 3 champs : `[1 force]` / `[1 risque]` / `[1 next step concret 30 jours]` — généré par jury en fin de session via plateforme (5 min/équipe = 55 min total). Export PDF signé jury bailleur. **Canal officiel du feedback chiffré (privé)**. | nouveau composant + PDF gen |

## D. Big bets v0.3 (post-pilote)

1. **Replay Mode timeline 90s exportable Instagram/LinkedIn** ("AgreenTech 2026 — mes 48h en 90s") — outil de recrutement promo suivante
2. **Plateforme reste ouverte post-bootcamp** avec missions M8+ J+15 (3 nouveaux verbatims pour TOUS, lauréats + non-lauréats) / M9+ J+30 ("Pivot ou persiste ?" auto-classement) / M10+ J+90 (Demo update 90s + 1 KPI) — signal "entrepreneuriat ≠ événement"
3. **Z-score normalisation mentor** + calibration croisée (chaque mentor note 2 livrables d'une autre cohorte) — neutralise 80% biais leniency. Trop tard pour 13/05 (nécessite training mentor en amont).

## E. Wildcard AAP — décision politique à arbitrer EIC + Fatimaezzahra avant 13/05

**Mécanique** : 2 équipes non-lauréates sur 8 reçoivent fast-track sur prochain AAP Tamwilcom (dossier pré-validé, pas mentoring). Sélection par jury sur **critère unique** : *"équipe avec laquelle on prendrait un café dans 6 mois"* — pas de score, pure intuition jury. Annoncé J2 17h en cérémonie.

**Coût Tamwilcom** : nul (ils auraient candidaté de toute façon).
**Valeur perçue équipes** : énorme — signal "vous n'êtes pas effacés".
**Pré-requis** : OK Fatimaezzahra FOUAD + Ghada BOUHLAL côté Tamwilcom AVANT 13/05 9h.

---

## F. Schemas JSON v2 (à seeder dans `lib/data.ts` ou `deliverable_templates`)

### Convention `severity` (R2)
```jsonc
// validation_rules — au pilote, TOUTES en warn
{ "rule": "...", "severity": "warn" | "error" }
// "warn" : affiche bandeau ambre Player + flag mentor, soumission OK
// "error" : empêche soumission (NON UTILISÉ AU PILOTE — réservé V2)
```

### L1 (M1.1) — PhraseATrous v2
```jsonc
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
  "extra_fields": [
    { "key": "hypothese_invalider", "label": "Qu'est-ce qui prouverait que vous vous trompez ?", "min": 15, "max": 200, "required": false, "appears_at": "M1.1_open", "tip": "Lean Startup : nommer le killshot avant de dépenser 2 jours dessus" },
    { "key": "hypothese_revisee",   "label": "Hypothèse VP révisée après vos 3 verbatims", "min": 30, "max": 300, "required": false, "appears_at": "M2.2_submitted", "tip": "Qu'est-ce que vos verbatims ont changé dans votre formulation ?" }
  ],
  "validation_rules": [
    { "rule": "cible NOT IN ['agriculteurs','fermiers','exploitants','agriculteurs marocains','tous les agriculteurs']", "severity": "warn", "message": "Trop générique — précisez filière + zone" },
    { "rule": "cible.split(' ').length >= 2", "severity": "warn", "message": "Une cible précise = au moins 2 mots qualifiants" },
    { "rule": "hypothese_revisee != cible+besoin+offre+differenciation (V0)", "severity": "warn", "message": "Si V1 = V0 mot pour mot, vos verbatims n'ont rien changé — challengez vos hypothèses" }
  ],
  "tips": [
    "Soyez précis sur la cible — évitez « tous les agriculteurs ».",
    "Le besoin doit être une douleur observée terrain, pas supposée.",
    "Le différenciateur tient en un seul angle (eau / coût / temps / accès)."
  ]
}
```

### L2.1 (M2.1) — FicheStructurée
```jsonc
{
  "mission_id": "M2.1",
  "type": "fiche_structuree",
  "fields": [
    { "key": "nom",        "label": "Nom (réel ou surnom)",      "min": 2 },
    { "key": "filiere",    "label": "Culture / filière",         "min": 3 },
    { "key": "taille_ha",  "label": "Taille exploitation (ha)",  "type": "number", "min": 0.1 },
    { "key": "zone",       "label": "Zone agro-écologique",      "type": "enum", "options": ["oasis","irrigué","bour","montagne"] },
    { "key": "revenu_dh",  "label": "Revenu annuel estimé (DH)", "type": "number" },
    { "key": "canal_info", "label": "Canal d'info principal",    "type": "enum", "options": ["radio","WhatsApp","coopérative","ORMVA","voisin","aucun"] }
  ],
  "validation_rules": [
    { "rule": "revenu_dh % 10000 != 0 OR M2.2.cards.some(c => c.citation.contains_amount())", "severity": "warn", "message": "Revenu = chiffre rond non sourcé. Persona doit être *un* humain, pas une moyenne" }
  ]
}
```

### L2.2 (M2.2) — CartesRépétables (R3 — plus de blocs en dur)
```jsonc
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
  "validation_rules": [
    { "rule": "cards.length >= 3", "severity": "warn", "message": "Mission soumise mais <3 verbatims — mentor sera notifié" },
    { "rule": "cards.some(c => c.canal == 'présentiel')", "severity": "warn", "message": "≥1 verbatim présentiel recommandé (3 WhatsApp = signal de fabrication)" }
  ],
  "soft_recommends_before": ["M3.1","M4.1","M5.1","M6.1"]
  // ⚠️ blocs_progression_to RETIRÉ (R3)
}
```

### L3 (M3.1) — MoSCoW Prototype v2
```jsonc
{
  "mission_id": "M3.1",
  "type": "moscow_prototype",
  "buckets": [
    { "key": "must",   "label": "MUST have — pilote 1 saison",     "color": "eic-green", "min_cards": 0, "max_cards": 5, "soft_min": 2, "help": "Sans ces features, le prototype ne tient pas debout en conditions réelles." },
    { "key": "should", "label": "SHOULD have — V2 post-pilote",    "color": "eic-blue",  "min_cards": 0, "max_cards": 5, "soft_min": 1, "help": "Important mais pas vital. Ajout après retour terrain." },
    { "key": "could",  "label": "COULD have — Si temps + budget",  "color": "neutral",   "min_cards": 0, "max_cards": 5, "soft_min": 0, "help": "Souhaitable. Différenciateur potentiel." },
    { "key": "wont",   "label": "WON'T have — Hors scope assumé",  "color": "muted",     "min_cards": 0, "max_cards": 5, "soft_min": 1, "help": "Explicitement écarté — anti scope-creep." }
  ],
  "card_fields": [
    { "key": "feature",   "label": "Feature / capacité",                                  "min": 5, "max": 80 },
    { "key": "pourquoi",  "label": "Pourquoi à ce niveau de priorité",                    "min": 10, "max": 140 },
    { "key": "contrainte","label": "Contrainte terrain levée (Must/Should uniquement)",   "type": "enum",
                          "options": ["autonomie énergétique","maintenance par l'agriculteur","littératie tech","connectivité 3G/2G","coût/ha","résistance climat","conformité ONSSA/ORMVA","aucune"],
                          "required_when_bucket_in": ["must","should"] }
  ],
  "validation_rules": [
    { "rule": "buckets.must.cards.length >= 2", "severity": "warn", "message": "Au moins 2 cartes MUST recommandées" },
    { "rule": "buckets.wont.cards.length >= 1", "severity": "warn", "message": "Au moins 1 carte WON'T recommandée (anti scope-creep)" },
    { "rule": "buckets.must.cards.every(c => c.contrainte != 'aucune')", "severity": "warn", "message": "Chaque MUST devrait lever une contrainte terrain réelle" },
    { "rule": "buckets.wont.cards.some(c => c.feature.was_in_v0_must_or_should)", "severity": "warn", "message": "Le WON'T trivial ne fait pas l'arbitrage. Au moins 1 item du WON'T devrait avoir été tenté en V0 Must/Should" }
  ],
  "optional_proof_url": { "key": "croquis_mvp", "label": "Croquis MVP (Canva, Figma, photo croquis main levée)", "required": false },
  "tips": [
    "Le MUST n'est pas la vision — c'est ce que l'agriculteur teste à J1 du pilote.",
    "Au moins 1 WON'T : si tout est important, rien ne l'est.",
    "Tech IoT/IA souvent fantasmée. Demandez : ça tient sans 4G ? sans technicien ?"
  ]
}
```

### L4 (M4.1) — Coûts/ha + ROI
```jsonc
{
  "mission_id": "M4.1",
  "type": "fiche_structuree",
  "fields": [
    { "key": "capex_ha",       "label": "CAPEX/ha installation initiale (DH)", "type": "number" },
    { "key": "opex_ha",        "label": "OPEX/ha annuel (DH)",                  "type": "number" },
    { "key": "roi_mois",       "label": "ROI agriculteur en mois",              "type": "number", "max": 60 },
    { "key": "modele_portage", "label": "Modèle de portage",                    "type": "enum", "options": ["achat direct","leasing coopérative","service à l'hectare","abonnement"] }
  ],
  "validation_rules": [
    { "rule": "M2.1.revenu_dh > 0 && roi_mois * opex_ha * M2.1.taille_ha <= M2.1.revenu_dh * 0.3", "severity": "warn", "message": "ROI incohérent avec persona (revenu et taille) — vérifiez vos hypothèses" }
  ],
  "optional_proof_url": { "key": "tableur_detail", "label": "Google Sheet détail calcul", "required": false }
}
```

### L5 (M5.1) — CartesRépétables intermédiaires
```jsonc
{
  "mission_id": "M5.1",
  "type": "cartes_repetables",
  "min_cards": 3, "max_cards": 5,
  "card_fields": [
    { "key": "organisation", "label": "Organisation nommée (ex: ORMVA Fès, COPAG, Coopérative X)", "min": 5 },
    { "key": "decideur",     "label": "Cycle de décision (qui décide ?)" },
    { "key": "canal",        "label": "Canal", "type": "enum", "options": ["digital","physique","mixte"] },
    { "key": "action_s1",    "label": "Action concrète semaine 1 post-bootcamp" }
  ],
  "validation_rules": [
    { "rule": "cards.some(c => c.canal != 'digital')", "severity": "warn", "message": "Au moins 1 canal non-digital recommandé (ORMVA, coopérative, foire, ONCA — l'AgriTech au Maroc ne se vend pas par Ads)" }
  ]
}
```

### L6 (M6.1) — Pitch Deck + Slide 4
```jsonc
{
  "mission_id": "M6.1",
  "type": "hybrid",
  "fields": [
    { "key": "slide4_preuve", "label": "Slide 4 — Preuve terrain (verbatim, photo prototype, ou lettre intention)", "min": 30, "max": 400, "ui_helper": "cite_from_M2.2" }
  ],
  "proof_url": { "key": "deck_pdf", "label": "PDF Pitch Deck complet (Canva/Slides)", "required": true },
  "validation_rules": [
    { "rule": "slide4_preuve.contains_quote_from(M2.2.cards) OR slide4_preuve.contains_number_from(M4.1)", "severity": "warn", "message": "Slide 4 sans preuve sourcée (verbatim L2.2 ou chiffre L4) — la crédibilité jury en pâtira" }
  ]
}
```

---

## G. Template lettre retour jury (C4)

```markdown
## Lettre de retour AgreenTech 2026 — [PROJECT_NAME]

À l'attention de [LEADER_NAME] et son équipe,

Le jury Tamwilcom / Bank of Africa Academy / Innov Invest / Bluespace
vous adresse ses retours suite au pitch du 14 mai 2026.

**Votre force distinctive** :
[1 paragraphe 3 lignes — ce que vous avez fait mieux que les autres,
nominal et factuel. Pas de "bravo" générique.]

**Le risque que nous voyons** :
[1 paragraphe 3 lignes — la zone qui inquiète le jury si vous
deviez monter à l'échelle. Direct, pas de demi-mesure.]

**Notre next step recommandé sur 30 jours** :
[1 action concrète, mesurable, avec deadline 14 juin 2026.]

Signé,
[Représentant Tamwilcom] · [Représentant BoA Academy] ·
[Représentant Innov Invest] · [Représentant Bluespace]

Fès, 14 mai 2026.
```

---

## H. Récap modifications côté code (checklist mar 12/05 23h)

- [ ] **Schemas** : L1 v2 (extra_fields hypothese_invalider + hypothese_revisee) · L2.1 v2 · L2.2 v2 (`blocks_progression_to` retiré) · L3 v2 (severity warn) · L4 v2 (cross-check warn) · L5 v2 · L6 v2 (slide 4 cite verbatim helper)
- [ ] **Composants** : `MissionFooter` auto-save 8s + pastille · `ValidationChecklist` compteur + coche pop · `CohortPulse` nouveau · `MissionBreadcrumb` retire E.bloqué (remplace par tooltip ambre) · `PixelMascot` 3 triggers · `Slide4Editor` bouton "Citer ce verbatim"
- [ ] **Page `/jury`** : notation différée + révisable · décomposition 5×/20 + σ live · ordre randomisé · composer lettre retour 3 champs + PDF gen
- [ ] **Page `/results`** : annonce qualitative (Excellence + Trajectoire + Wildcard), pas de scores ni rangs aux Players
- [ ] **Page `/admin`** : 2 classements internes Excellence + Trajectoire visibles GameMaster
- [ ] **Validators** : tous en `severity: "warn"` au pilote (R2)
- [ ] **Garde score Player invisible** : audit grep `score`/`rank`/`points` dans tous les composants Player

---

*Document créé 2026-05-10 (T-3). Source : `EIC-MANAGER-ANSWERS-AGREENTECH.md` + 3 sous-agents (UX/pédagogie/scoring) + 3 règles cardinales Omar 10/05.*
