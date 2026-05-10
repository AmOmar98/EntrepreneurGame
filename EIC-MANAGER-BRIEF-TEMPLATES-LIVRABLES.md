# Brief EIC Manager — Templates PDF des livrables AgreenTech

**Destinataire** : EIC Manager UEMF
**Demandeur** : Omar Ameur (dev pilote Entrepreneur Game)
**Date** : 2026-05-10
**Cible** : 13 mai 2026 8h30 (go-live Hack-Days AgreenTech)

---

## 1. Contexte

10 templates PDF, brandés EIC/UEMF, à héberger sur OneDrive. Les liens publics seront injectés dans la page de chaque livrable de l'app **Entrepreneur Game**. Le porteur de projet ouvre le PDF depuis sa mission, l'utilise comme **guide visuel** pour structurer son livrable, puis crée son propre document de travail (Google Sheet / Notion / Doc / Slides) et soumet l'URL HTTPS dans l'app.

**Les PDF servent UNIQUEMENT de guide structurant. Ils ne contiennent ni scoring, ni critères d'évaluation, ni instructions de l'app.**

---

## 2. Format général (commun aux 10 templates)

| Item | Spécification |
|---|---|
| Format fichier | PDF statique (non-éditable) |
| Taille page | A4 |
| Orientation | Portrait par défaut, landscape pour BMC / MoSCoW / Carte de positionnement / Pitch deck (voir liste) |
| Nombre de pages | 1 à 3 max par template |
| Branding | Logo **EIC / UEMF uniquement** (pas de logos partenaires sur ces templates) |
| Police | Charte EIC standard |
| Footer | Numéro de livrable + « AgreenTech Hack-Days · 13-14 mai 2026 » |
| Langue | Français |
| Encodage filename | ASCII strict (ex : `EIC-AgreenTech-01-Persona.pdf`, sans accent ni espace) |

---

## 3. Liste des 10 templates à produire

### Template 01/10 — Persona AgriTech

- **Filename** : `EIC-AgreenTech-01-Persona.pdf`
- **Titre cover** : Persona AgriTech
- **Orientation** : Portrait — 1 page
- **Structure** : tableau 3 colonnes, 7 lignes
  - Colonnes : `Attribut` · `Valeur` · `Source`
  - Lignes (colonne Attribut pré-remplie, autres vides) :
    1. Nom + âge
    2. Filière / culture
    3. Zone agro-écologique
    4. Taille exploitation (ha)
    5. Revenu annuel estimé (DH)
    6. Canal d'information principal
    7. Douleur observée terrain

### Template 02/10 — Hypothèse VP cible

- **Filename** : `EIC-AgreenTech-02-Hypothese-VP.pdf`
- **Titre cover** : Hypothèse Valeur — formulation Lean
- **Orientation** : Portrait — 1 page
- **Structure** : phrase Lean en grand format avec 4 cartouches à remplir
  - `Pour [Cible]` — 1 ligne libre
  - `qui [Besoin]` — 1 ligne libre
  - `notre offre [Offre]` — 1 ligne libre
  - `contrairement à [Différenciation]` — 1 ligne libre
- Encart bas de page : « Pitch oral 1 minute en atelier »

### Template 03/10 — Business Model Canvas (9 blocs)

- **Filename** : `EIC-AgreenTech-03-BMC.pdf`
- **Titre cover** : Business Model Canvas AgriTech
- **Orientation** : Landscape — 1 page
- **Structure** : grille 9 cellules (mise en page Strategyzer classique) — chaque cellule avec son titre et zone vide :
  1. Segments de clientèle
  2. Proposition de valeur
  3. Canaux
  4. Relations clients
  5. Sources de revenus
  6. Ressources clés
  7. Activités clés
  8. Partenaires clés
  9. Structure de coûts

### Template 04/10 — MoSCoW prototype (Kanban)

- **Filename** : `EIC-AgreenTech-04-MoSCoW.pdf`
- **Titre cover** : MoSCoW prototype pilote 1 saison
- **Orientation** : Landscape — 1 page
- **Structure** : 4 colonnes verticales (kanban) avec entête couleur :
  - `MUST have` — colonne 1
  - `SHOULD have` — colonne 2
  - `COULD have` — colonne 3
  - `WON'T have` — colonne 4
- Chaque colonne contient 3-5 emplacements vides pour cartes (zone rectangulaire avec libellés `Feature` / `Pourquoi` / `Contrainte terrain`)

### Template 05/10 — Analyse concurrentielle + carte de positionnement

- **Filename** : `EIC-AgreenTech-05-Analyse-Concurrentielle.pdf`
- **Titre cover** : Analyse concurrentielle + carte de positionnement
- **Orientation** : Landscape — 2 pages
- **Page 1** : tableau 5 colonnes / 5 lignes (3 lignes minimum pour concurrents)
  - Colonnes : `Concurrent` · `Filière / segment` · `Géographie` · `Modèle éco` · `Forces / Faiblesses`
- **Page 2** : carte de positionnement vide (graphe 2D)
  - 2 axes vides à nommer librement par le porteur (X et Y avec libellés à remplir)
  - Quadrillage léger pour repères

### Template 06/10 — TAM / SAM / SOM

- **Filename** : `EIC-AgreenTech-06-TAM-SAM-SOM.pdf`
- **Titre cover** : Sizing du marché — TAM / SAM / SOM
- **Orientation** : Portrait — 1 page
- **Structure** : 3 sections empilées (entonnoir visuel optionnel)
  - Section 1 : `TAM (Total Addressable Market)` — zone de saisie + ligne `Hypothèse de calcul` + ligne `Source`
  - Section 2 : `SAM (Serviceable Addressable Market)` — même structure
  - Section 3 : `SOM (Serviceable Obtainable Market)` — même structure

### Template 07/10 — ROI/ha + modèle de portage

- **Filename** : `EIC-AgreenTech-07-ROI-Portage.pdf`
- **Titre cover** : ROI/ha agriculteur + modèle de portage
- **Orientation** : Portrait — 1 page
- **Structure** : 2 zones
  - **Zone A — Calcul ROI/ha** : tableau 4 lignes
    - Coût total / ha (CAPEX amorti + OPEX)
    - Gain attendu / ha
    - ROI / ha (formule = (gain - coût) / coût)
    - Période de retour (mois)
  - **Zone B — Modèle de portage** : 4 cases à cocher + 1 ligne justification
    - ☐ Achat direct
    - ☐ Leasing coopérative
    - ☐ Service à l'hectare
    - ☐ Abonnement annuel
    - Ligne libre `Justification (vs persona)`

### Template 08/10 — Coûts agronomiques détail (CAPEX/OPEX/ha)

- **Filename** : `EIC-AgreenTech-08-Couts-Capex-Opex.pdf`
- **Titre cover** : Coûts agronomiques détail / ha
- **Orientation** : Portrait — 1 page
- **Structure** : 2 tableaux empilés
  - **Tableau A — CAPEX / ha (initial)** : 4 colonnes / 5 lignes
    - Colonnes : `Poste` · `Quantité` · `Coût unitaire (DH)` · `Total (DH)`
    - Lignes pré-remplies (colonne Poste) : Matériel principal · Logiciel/abonnement initial · Installation/formation · `Total CAPEX/ha` · `Durée d'amortissement (années)`
  - **Tableau B — OPEX / ha annuel** : mêmes colonnes / 5 lignes
    - Lignes : Maintenance · Consommables · Support/formation · Abonnement service · `Total OPEX/ha annuel`

### Template 09/10 — Plan acquisition (3-5 relais)

- **Filename** : `EIC-AgreenTech-09-Plan-Acquisition.pdf`
- **Titre cover** : Plan acquisition AgriTech — 3 à 5 organisations relais
- **Orientation** : Portrait — 1 page
- **Structure** : tableau 5 colonnes / 6 lignes (1 entête + 5 lignes vides)
  - Colonnes : `Organisation` · `Type` · `Décideur / cycle décision` · `Canal (digital / physique / mixte)` · `Action concrète semaine 1 post-bootcamp`

### Template 10/10 — Pitch deck final

- **Filename** : `EIC-AgreenTech-10-Pitch-Deck.pdf`
- **Titre cover** : Pitch deck final AgriTech — 10 à 12 slides
- **Orientation** : Landscape 16:9 — 12 pages (1 slide par page)
- **Structure** : 1 page = 1 slide vide avec titre pré-rempli :
  1. Couverture (nom équipe, projet, baseline)
  2. Problème filière
  3. Solution AgriTech
  4. **Preuve terrain** (slide critique — citation OU chiffre concret)
  5. Marché — TAM/SAM/SOM
  6. Différenciation vs concurrents
  7. Modèle économique (ROI/ha + portage)
  8. Plan acquisition
  9. Roadmap pilote 1 saison
  10. Équipe + compétences clés
  11. Demande (montant, ressources, partenariats)
  12. Remerciement + contact

---

## 4. Process de livraison

1. **Création** : EIC manager produit les 10 PDF selon les structures ci-dessus.
2. **Hébergement** : 1 dossier OneDrive partagé contenant les 10 PDF.
3. **Permissions** : chaque PDF doit être accessible en **lecture publique** (anyone with the link, view-only).
4. **Retour à Omar** : 1 fichier `templates-onedrive-links.txt` (ou message direct) avec 10 lignes au format :
   ```
   01-Persona       https://1drv.ms/...
   02-Hypothese-VP  https://1drv.ms/...
   03-BMC           https://1drv.ms/...
   ...
   10-Pitch-Deck    https://1drv.ms/...
   ```
5. **Injection app** : Omar copie ces URLs dans le seed des `deliverable_templates` (1 ligne ajoutée par livrable) avant 13/05 8h30.

---

## 5. Modifications & ajustements

L'EIC manager peut demander à tout moment :

- **Ajustement structure** d'un template (ex : ajouter une colonne, retirer une ligne, modifier un libellé).
- **Ajustement branding** (couleurs, police, logo placement) — Omar n'impose aucune charte.
- **Réorientation** (passage portrait ⇄ landscape).
- **Page count** différent du suggéré.
- **Wording** des titres ou libellés de colonnes.

Toute modification post-publication = simple mise à jour OneDrive (URL identique) ou nouvelle URL communiquée à Omar pour patch app.

---

## 6. Hors-scope (à NE PAS inclure dans les PDF)

Les éléments suivants relèvent de l'app Entrepreneur Game et **ne doivent pas figurer dans les PDF templates** :

- Critères de notation / rubric / scoring
- Mentions de points / XP / pénalités
- Logique de validation mentor (Y/N, status, etc.)
- Liens entre livrables (« reprend persona L1 »)
- Signaux anti-fabrication / warnings
- Mentions de l'app, de Supabase, ou références techniques
- Logos partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace)

---

## 7. Récapitulatif filenames

```
EIC-AgreenTech-01-Persona.pdf
EIC-AgreenTech-02-Hypothese-VP.pdf
EIC-AgreenTech-03-BMC.pdf
EIC-AgreenTech-04-MoSCoW.pdf
EIC-AgreenTech-05-Analyse-Concurrentielle.pdf
EIC-AgreenTech-06-TAM-SAM-SOM.pdf
EIC-AgreenTech-07-ROI-Portage.pdf
EIC-AgreenTech-08-Couts-Capex-Opex.pdf
EIC-AgreenTech-09-Plan-Acquisition.pdf
EIC-AgreenTech-10-Pitch-Deck.pdf
```

**Contact retour** : Omar Ameur — `omar.ameur98@gmail.com`
