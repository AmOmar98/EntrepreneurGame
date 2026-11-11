# Bootcamp Idea'Wave — 16 & 17 Novembre 2026 (Guide d'Intégration & Runbook)

Ce document centralise la configuration prête en base Supabase (`vzzbjxmfkmvqkaqxalhr`) pour le **Bootcamp Idea'Wave des 16 et 17 novembre 2026**, ainsi que les gabarits d'intégration des équipes, du planning de travail et des livrables.

---

## 1. Identifiants Live en Base (`vzzbjxmfkmvqkaqxalhr`)

| Ressource | Identifiant / Valeur | Statut |
| --- | --- | --- |
| **Organisation** | `588bc094-d46c-472d-8c91-023738026be4` (Euromed Innovation Center) | Actif |
| **Event ID** | `7d553162-1c1e-44d9-9845-9f7b1c58f619` | `is_active = true` |
| **Event Slug** | `ideawave-bootcamp-nov-2026` | Unique |
| **Nom affiché** | `Bootcamp Idea'Wave — 16 & 17 Novembre 2026` | Configurable dans `/admin/events` |
| **Dates (UTC+1)** | `2026-11-16 08:30:00+01` → `2026-11-17 18:00:00+01` | 2 jours (J1 & J2) |
| **Cohorte** | `cohorte-ideawave-nov-2026` (*Cohorte Idea'Wave Novembre 2026*) | 0 équipe (prête pour import) |
| **Événements archivés** | `agreentech-fes-meknes-mai-2026` & `hack-days-fes-meknes-mai-2026` | `is_active = false` (Archive intacte + dump SHA-256) |

---

## 2. Planning de Travail Pré-configuré (16 & 17 Novembre 2026)

Le planning initial comporte **7 ateliers** répartis sur les 2 journées du Bootcamp Idea'Wave. Chaque horaire, titre et livrable est modifiable à chaud depuis `/admin/events/7d553162-1c1e-44d9-9845-9f7b1c58f619/missions` ou en fournissant le planning définitif à l'agent :

### Jour 1 — Lundi 16 Novembre 2026 (Problème, Terrain & Modèle)

| Ordre | Horaire (UTC+1) | Niveau | Atelier (`missions.title`) | Livrables rattachés (`slug`) | Type Composer |
| ---: | --- | --- | --- | --- | --- |
| **1** | `16/11 09:30` | `L1_problem` | Atelier 1 — Persona + Design Thinking (bonus) | `persona-v1`, `design-thinking-v1` (bonus) | `simple` |
| **2** | `16/11 11:30` | `L2_solution` | Atelier 2 — Préparation entretiens + Fiches | `prep-questions-v1` (02a), `fiches-entretien-v1` (02b) | `simple` / `multi_url` (auto-validé, débloqué après 02a) |
| **3** | `16/11 14:30` | `L3_market` | Atelier 3 — Business Model Canvas | `bmc-v1` | `simple` |
| **4** | `16/11 16:30` | `L4_business_model` | Atelier 4 — Étude marché & analyse technique | `marche-technique-v1`, `tam-sam-som-v1`, `comparaison-v1`, `moscow-v1` | `simple` / `moscow` (Kanban) |

### Jour 2 — Mardi 17 Novembre 2026 (Go-To-Market, Finance & Pitch Jury)

| Ordre | Horaire (UTC+1) | Niveau | Atelier (`missions.title`) | Livrables rattachés (`slug`) | Type Composer |
| ---: | --- | --- | --- | --- | --- |
| **5** | `17/11 09:00` | `L4_business_model` | Atelier 5 — Stratégie de commercialisation | `commercialisation-v1` | `simple` |
| **6** | `17/11 11:00` | `L5_pitch` | Atelier 6 — Analyse financière (Unit Economics) | `unit-economics-v1` | `simple` |
| **7** | `17/11 14:30` | `L5_pitch` | Atelier 7 — Techniques de pitch + Pitch jury | `techniques-pitch-v1`, `pitch-deck-v1` | `simple` |

---

## 3. Comment intégrer vos données définitives Idea'Wave

Vous pouvez transmettre vos éléments à l'agent sous n'importe quel format (texte, tableau, PDF, Excel/CSV, liens OneDrive) ou utiliser directement l'interface GameMaster :

### A. Adapter le planning et les livrables
- **Via l'agent :** Donnez simplement la liste des ateliers, horaires des 16–17 novembre, barèmes (`rubric`) ou liens OneDrive (`template_url`) à modifier, puis exécutez :
  ```bash
  node scripts/provision-ideawave-bootcamp.mjs --status
  ```
- **Via l'UI GameMaster :**
  - `/admin/events` → **Bootcamp Idea'Wave — 16 & 17 Novembre 2026**
  - `/admin/events/7d553162-1c1e-44d9-9845-9f7b1c58f619/missions` (ajout/édition d'ateliers, drag-and-drop de l'ordre, activation/désactivation d'un livrable via `is_active`, modification des rubriques et URLs OneDrive).
  - `/admin/events/7d553162-1c1e-44d9-9845-9f7b1c58f619/settings` (pondération Projet/Pitch 20/80, XP 1re soumission, XP validation V1/V2).
  - `/admin/events/7d553162-1c1e-44d9-9845-9f7b1c58f619/jury-settings` (critères de notation Jury).

### B. Importer les équipes et participants (`/admin/import`)
Préparez un fichier CSV avec les colonnes suivantes (ou collez la liste brute dans le chat pour que l'agent génère et importe les équipes) :

```csv
team_name,member_email,member_full_name,idea
WaveTech,alice@ueuromed.org,Alice Bennani,Plateforme IA d'optimisation hydrique
WaveTech,karim@ueuromed.org,Karim Tazi,Plateforme IA d'optimisation hydrique
EcoPulse,sara@ueuromed.org,Sara Idrissi,Capteurs IoT basse consommation pour PME
```

### C. Inviter les Mentors et Jurés
- **Jurés :** `/admin/jurors` (ajout par email ; rattachés automatiquement à l'événement actif `ideawave-bootcamp-nov-2026`).
- **Mentors :** Rôle `app_role = 'mentor'` dans `public.profiles`.
