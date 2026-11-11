# Archive Pre-IdeaWave — Snapshot Complet des Événements Historiques

- **Date d'archivage :** `2026-11-11T16:00:53Z`
- **Projet Supabase :** `vzzbjxmfkmvqkaqxalhr` (`eu-west-1`)
- **Export JSON intégral (hors-Git / RGPD) :** `.planning/exports/archive-pre-ideawave-2026-11-11/full-dump.json`
- **Taille de l'export :** `132598 octets`
- **Empreinte SHA-256 :** `7aa57111e2a383dd042b8143889f18ee8a48fb53ce220f1f826bfad08b517042`
- **Politique de conservation :** Conservation intégrale en base (`is_active = false` sur les événements passés) + sauvegarde JSON locale hors-Git.

## 1. Volumétrie par table au moment de l'archivage

| Table | Lignes |
| --- | ---: |
| `public.organizations` | 1 |
| `public.events` | 2 |
| `public.event_settings` | 2 |
| `public.cohorts` | 2 |
| `public.missions` | 13 |
| `public.deliverable_templates` | 25 |
| `public.pitch_criteria` | 0 |
| `public.players` | 10 |
| `public.player_members` | 10 |
| `public.jurors` | 4 |
| `public.submissions` | 50 |
| `public.evaluations` | 42 |
| `public.evaluation_comments` | 0 |
| `public.pitch_scores` | 0 |
| `public.bonus_events` | 0 |
| `public.moscow_cards` | 0 |
| `public.help_requests` | 0 |
| `public.announcements` | 0 |

## 2. Événements archivés

### AgreenTech Fes-Meknes Mai 2026 (`agreentech-fes-meknes-mai-2026`)
- **Event ID :** `f9a386aa-a547-4d0d-91d0-0bb16a29364e`
- **Période :** `2026-05-13T07:30:00+00:00` → `2026-05-14T16:00:00+00:00`
- **Cohorte :** `Cohorte Mai 2026` (`ea5aae0b-3abb-4341-90f2-56e924a499ad`)
- **Statistiques :** 6 ateliers, 10 livrables templates, 0 équipes, 0 soumissions, 0 évaluations.

#### Ateliers & Livrables
| Ordre | Niveau | Atelier | Livrables (`slug` / `composer_kind`) |
| ---: | --- | --- | --- |
| 1 | `L1_problem` | Atelier 1 — Hypothese VP & Cible AgriTech | `personae-v1` (simple), `probleme-v1` (simple) |
| 2 | `L2_solution` | Atelier 2 — Solution AgriTech & Verbatims terrain | `esquisse-solution-v1` (simple), `fiche-produit-plan-dev-v1` (simple) |
| 3 | `L3_market` | Atelier 3 — MoSCoW Prototype Pilote 1 saison | `etude-marche-v1` (simple), `tam-sam-som-v1` (simple) |
| 4 | `L4_business_model` | Atelier 4 — ROI/ha & Modele de portage | `bmc-v1` (simple), `couts-previsions-v1` (simple) |
| 5 | `L4_business_model` | Atelier 5 — Plan acquisition agriculteurs | `strategie-commerciale-v1` (simple) |
| 6 | `L5_pitch` | Atelier 6 — Pitch final AgriTech & resultats | `pitch-deck-v1` (simple) |

### Digi-Hackathon 4ème édition (`hack-days-fes-meknes-mai-2026`)
- **Event ID :** `084824a7-6678-42d8-a066-b5133f79b6c0`
- **Période :** `2026-05-20T08:00:00+00:00` → `2026-05-22T12:00:00+00:00`
- **Cohorte :** `Cohorte Digi Mai 2026` (`95420424-b428-4502-b322-e1fb8d5cf3f1`)
- **Statistiques :** 7 ateliers, 15 livrables templates, 10 équipes, 50 soumissions, 42 évaluations.

#### Ateliers & Livrables
| Ordre | Niveau | Atelier | Livrables (`slug` / `composer_kind`) |
| ---: | --- | --- | --- |
| 1 | `L1_problem` | Atelier 1 — Persona + Design Thinking (bonus) | `persona-v1` (simple), `design-thinking-v1` (simple) |
| 2 | `L2_solution` | Atelier 2 — Préparation entretiens + Fiches | `prep-questions-v1` (simple), `fiches-entretien-v1` (multi_url, auto) |
| 3 | `L3_market` | Atelier 3 — Business Model Canvas | `bmc-v1` (simple) |
| 4 | `L4_business_model` | Atelier 4 — Étude marché & analyse technique | `positionnement-v1` (simple), `tam-sam-som-v1` (simple), `comparaison-v1` (simple), `moscow-v1` (moscow), `marche-technique-v1` (simple) |
| 5 | `L4_business_model` | Atelier 5 — Stratégie de commercialisation | `strategie-100-users-v1` (simple), `commercialisation-v1` (simple) |
| 6 | `L5_pitch` | Atelier 6 — Analyse financière (Unit Economics) | `unit-economics-v1` (simple) |
| 7 | `L5_pitch` | Atelier 7 — Techniques de pitch + Pitch jury | `pitch-deck-v1` (simple), `techniques-pitch-v1` (simple) |

#### Équipes & Scores finaux (sans PII membre)
| Équipe | Slug | Niveau | Score Projet | Score Engagement | Soumissions |
| --- | --- | --- | ---: | ---: | ---: |
| Bla Dwa | `bla-dwa` | `L1_problem` | 448 | 1750 | 10 |
| Simock | `simock` | `L1_problem` | 342 | 1675 | 13 |
| Graph-Anomaly | `graph-anomal` | `L1_problem` | 318 | 1400 | 8 |
| MedNova | `mednova` | `L1_problem` | 311 | 700 | 4 |
| FokusMind | `fokusmind` | `L1_problem` | 300 | 350 | 2 |
| With you | `nafas` | `L1_problem` | 101 | 875 | 5 |
| AddictLess | `addictless` | `L1_problem` | 95 | 700 | 4 |
| MindBot | `mindbot` | `L1_problem` | 73 | 700 | 4 |
| Shihty+ | `shihty-plus` | `L0_diagnostic` | 0 | 0 | 0 |
| HASSANA | `hassana` | `L0_diagnostic` | 0 | 0 | 0 |

