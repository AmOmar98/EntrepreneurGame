# Idea'Wave · Bootcamp de préincubation — 16 & 17 Novembre 2026

Ce document récapitule le paramétrage **en production sur Supabase (`vzzbjxmfkmvqkaqxalhr`)** aligné sur le programme officiel de 3 pages (**Euromed Innovation Center · Innov Invest · Tamwilcom · Bank of Africa Academy · Blue Space**).

---

## 1. Identifiants Live en Base (`vzzbjxmfkmvqkaqxalhr`)

| Ressource | Identifiant / Valeur | Statut |
| --- | --- | --- |
| **Organisation** | `588bc094-d46c-472d-8c91-023738026be4` (*Euromed Innovation Center*) | Actif |
| **Event ID** | `7d553162-1c1e-44d9-9845-9f7b1c58f619` | `is_active = true` |
| **Event Slug** | `ideawave-bootcamp-nov-2026` | Unique |
| **Nom affiché** | `Idea'Wave · Bootcamp de préincubation (16 & 17 nov. 2026)` | Configurable dans `/admin/events` |
| **Horaires officiels** | `2026-11-16 09:00:00+01` → `2026-11-17 16:00:00+01` | J1 (`09h00–17h30`) & J2 (`09h00–16h00`) |
| **Cohorte** | `cohorte-ideawave-nov-2026` (*Cohorte Idea'Wave Novembre 2026*) | Prête pour import CSV (`/admin/import`) |
| **5 Piliers du programme** | Proposition de valeur · Business model · Faisabilité technique · Stratégie commerciale · Pitch | Alignés sur les niveaux `L1` à `L5` et la grille Jury `/100` |

---

## 2. Planning de Travail & Livrables Configurés en Base

### Jour 1 — Lundi 16 novembre 2026 : *Comprendre, concevoir et préparer le marché*

| Séquence | Horaire (UTC+1) | Niveau | Module (`missions.title`) | Livrables actifs (`slug` — Titre) | Type & Barème |
| ---: | --- | --- | --- | --- | --- |
| **M1** | `09h00 – 10h45`<br>*(Accueil 09h00, Module 09h45)* | `L1_problem` | **J1 · 09h00–10h45 — Accueil & Business Design Deep Dive** | • `fiche-probleme-client-v1` — **Fiche problème-client et hypothèses prioritaires** *(Synthèse 1/6 : besoin identifié & solution proposée)*<br>• `design-thinking-v1` — **Trame d'entretiens clients & Design Thinking (Bonus)** | `simple` (25 pts)<br>`simple` bonus (25 pts) |
| **M2** | `11h00 – 12h00`<br>*(après pause 10h45)* | `L2_solution` | **J1 · 11h00–12h00 — Business Model & Proposition de valeur** | • `bmc-v1` — **Proposition de valeur et Business Model Canvas initial** *(Synthèse 2/6 : Business Model Canvas)* | `simple` (25 pts) |
| **M3** | `12h00 – 12h45`<br>*(Déjeuner 13h–14h)* | `L3_market` | **J1 · 12h00–12h45 — Étude de marché & positionnement** | • `etude-marche-positionnement-v1` — **Synthèse de l'étude de marché et profil des clients cibles** *(Synthèse 3/6)* | `simple` (25 pts) |
| **M4** | `14h00 – 14h45` | `L2_solution` | **J1 · 14h00–14h45 — Faisabilité technique et Plan de développement** | • `faisabilite-plan-dev-v1` — **Fiche de faisabilité technique, Plan de développement & Gestion des risques** *(Synthèse 4/6)*<br>• `moscow-v1` — **Matrice MoSCoW — Priorisation des fonctionnalités** | `simple` (25 pts)<br>`moscow` Kanban (25 pts) |
| **M5** | `14h45 – 15h45`<br>*(Pause 15h45–16h00)* | `L3_market` | **J1 · 14h45–15h45 — Go-to-Market Strategy & Fondamentaux Marketing** | • `plan-acces-marche-v1` — **Plan d'accès au marché (cible, canaux, offre pilote et indicateurs)**<br>• `fondamentaux-marketing-v1` — **Fondamentaux du marketing : Message central & déclinaison 2 audiences** | `simple` (25 pts)<br>`simple` (25 pts) |
| **M6** | `16h00 – 17h30`<br>*(Financement 16h00, Consolidation 16h30)* | `L4_business_model` | **J1 · 16h00–17h30 — Accéder au financement, Consolidation & Mentorat** | • `besoin-financement-v1` — **Fiche de besoin de financement et première estimation financière** *(Synthèse 5/6)*<br>• `canevas-consolides-j1-v1` — **Consolidation & Mentorat : Canevas consolidés et priorités du Jour 2** | `simple` (25 pts)<br>`simple` (25 pts) |

---

### Jour 2 — Mardi 17 novembre 2026 : *Évaluer et convaincre (`09h00 – 16h00`)*

| Séquence | Horaire (UTC+1) | Niveau | Module (`missions.title`) | Livrables actifs (`slug` — Titre) | Type & Barème |
| ---: | --- | --- | --- | --- | --- |
| **M7** | `09h00 – 16h00`<br>• `09h00–10h00` Point d'avancement & remise<br>• `10h15–11h30` Pitch & Temps de travail<br>• `11h30–13h00` Pitch à blanc<br>• `14h00–15h30` Jury<br>• `15h30–16h00` Clôture | `L5_pitch` | **J2 · 09h00–16h00 — Point d'avancement, Pitch & Communication, Pitch à blanc & Jury** | • `pitch-3min-support-v1` — **Pitch de 3 minutes et support de présentation (5 à 6 diapositives)** *(Synthèse 6/6 : support de présentation du projet)*<br>• `pitch-final-objections-v1` — **Pitch finalisé et réponses aux principales objections (Pitch à blanc 11h30–13h00)** | `simple` (25 pts)<br>`simple` (25 pts) |

---

## 3. Correspondance avec les 6 « Livrables attendus » du Programme (Page 3)

| Livrable attendu (Programme officiel p. 3) | Livrable dans Entrepreneur Game (`slug`) | Séquence |
| --- | --- | --- |
| 1. **Une synthèse du besoin identifié et de la solution proposée** | `fiche-probleme-client-v1` (*Fiche problème-client et hypothèses prioritaires*) | J1 · 09h45–10h45 (M1) |
| 2. **Un Business Model Canvas** | `bmc-v1` (*Proposition de valeur et Business Model Canvas initial*) | J1 · 11h00–12h00 (M2) |
| 3. **Une synthèse de l'étude de marché et du profil des clients cibles** | `etude-marche-positionnement-v1` (*Synthèse de l'étude de marché et profil des clients cibles*) | J1 · 12h00–12h45 (M3) |
| 4. **Une fiche de faisabilité technique et un plan de développement** | `faisabilite-plan-dev-v1` + `moscow-v1` (*Plan de développement, Indicateurs, Risques & Kanban MoSCoW*) | J1 · 14h00–14h45 (M4) |
| 5. **Une première estimation financière et une stratégie commerciale** | `plan-acces-marche-v1` + `besoin-financement-v1` (*Plan d'accès au marché Go-to-Market & Fiche de besoin de financement*) | J1 · 14h45–16h30 (M5 & M6) |
| 6. **Un support de présentation du projet** | `pitch-3min-support-v1` + `pitch-final-objections-v1` (*Pitch 3 min en 5–6 slides & Pitch finalisé après coaching*) | J2 · 10h15–13h00 (M7) |

---

## 4. Grille d'Évaluation Jury Configurée (`pitch_criteria` — Total `/100`)

Pour la session **Présentation devant le jury (`14h00 – 15h30` le 17 novembre)**, la grille Jury dans `/jury` et `/admin/events/7d553162-1c1e-44d9-9845-9f7b1c58f619/jury-settings` comporte 5 critères sur 20 points (total 100 points, pondéré à 80 % Pitch / 20 % Projet dans le classement final `/results`) :

1. **`problem` (20 pts) :** *Problème & Proposition de valeur (besoin identifié, cible, différenciation)*
2. **`solution` (20 pts) :** *Faisabilité technique & Plan de développement (MoSCoW, feuille de route, risques)*
3. **`market` (20 pts) :** *Étude de marché, Positionnement & Stratégie Go-to-Market*
4. **`business_model_funding` (20 pts) :** *Modèle économique (BMC) & Besoin de financement*
5. **`presentation` (20 pts) :** *Pitch (3 min), Réponses aux objections & Prochaines étapes*

---

## 5. Prochaine étape : Import des équipes & liens templates OneDrive

Dès que vous disposez :
1. **De la liste des projets / équipes sélectionnés** (format CSV `team_name,member_email,member_full_name,idea` ou liste brute dans le chat),
2. **Des éventuels liens OneDrive/Google Drive des gabarits vierges** (`template_url` pour chaque livrable),
3. **Des emails des Mentors et des membres du Jury**,

transmettez-les ici ou importez-les depuis `/admin/import` et `/admin/jurors`.
