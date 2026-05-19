---
quick_id: 260519-pyx
slug: restructurer-12-livrables-digi-hackathon
title: Restructurer 12 livrables Digi-Hackathon → 11 livrables alignés Welcome Guide
date: 2026-05-19
status: ready
risk: low
zone: database/ (sensible — advisor PASS verdict)
---

# Plan

## Objectif

Aligner `database/seed_event_digi_hackathon.sql` (commit `4ee92a9`) avec les 8 livrables officiels du Welcome Guide PDF. Garder 6 missions et les 5 bonus existants ; fusionner 3 deliverables sans support PDF en 1, remplacer 1 deliverable au contenu erroné, ajouter 1 deliverable manquant.

## Constat (source : 8 PDF dans `C:\Users\omara\OneDrive - Université EuroMed de Fès (UEMF)\Digi-Hackathon\`)

| Atelier officiel (Welcome Guide p.2) | Livrable PDF | Mission SQL actuelle | Action |
|---|---|---|---|
| A1 Design Thinking (mer 10h30) | 02 Empathize+Define+Ideate+Prototype | M1 ord=1 (mauvais titre) | Fix titre + fusionner hypotheses+questionnaire+fiches |
| A2 BMC (mer 14h00) | 03 BMC | M2 ord=2 (titre "Enquête utilisateurs") | Fix titre + retirer questionnaire/fiches |
| A3 Étude marché & technique (mer 15h00) | 04 TAM/SAM/SOM + stack + risques (+ annexe 04b MoSCoW) | M3 ord=3 (titre "BMC + TAM/SAM/SOM") | Fix titre + ajouter marche-technique-v1 + déplacer moscow/positionnement/comparaison ici |
| A4 Stratégie commercialisation (jeu 09h30) | 05 Funnel AARRR + canaux | M4 ord=4 (titre "Étude marché MOSCOW") | Fix titre + ajouter commercialisation-v1 + déplacer strategie-100-users ici |
| A5 Unit Economics (jeu 11h00) | 06 CAC/LTV/Churn/Payback | M5 ord=5 (titre "Stratégie & Analyse financière") | Fix titre + remplacer capex-opex-v1 par unit-economics-v1 |
| A6 + Pitch final (jeu 13h00 + ven 09h30) | 07 Techniques pitch + 08 Pitch Deck | M6 ord=6 | Ajouter techniques-pitch-v1 |

## Structure cible

**6 missions** (level_id/ord inchangés pour stabilité FK) :

```
M1 (L1_problem, ord=1)         "Atelier 1 — Design Thinking"                  mer 10:30
M2 (L2_solution, ord=2)        "Atelier 2 — Business Model Canvas"            mer 14:00
M3 (L3_market, ord=3)          "Atelier 3 — Étude marché & analyse technique" mer 15:00
M4 (L4_business_model, ord=4)  "Atelier 4 — Stratégie de commercialisation"   jeu 09:30
M5 (L4_business_model, ord=5)  "Atelier 5 — Analyse financière (Unit Econ.)"  jeu 11:00
M6 (L5_pitch, ord=6)           "Atelier 6 — Techniques de pitch + Pitch jury" jeu 13:00 / ven 09:30
```

**11 deliverable_templates** (5 bonus inchangés, 6 non-bonus) :

| Mission | Slug | is_bonus | max_score | Status |
|---|---|---|---|---|
| M1 | `design-thinking-v1` | false | 25 | NEW (fusion hypotheses+questionnaire+fiches) |
| M1 | `persona-v1` | **true** | 25 | UNCHANGED |
| M2 | `bmc-v1` | false | 25 | MOVED (M3→M2) — slug et contenu conservés |
| M3 | `marche-technique-v1` | false | 25 | NEW (stack + risques tech) |
| M3 | `moscow-v1` | false | 25 | MOVED (M4→M3) |
| M3 | `tam-sam-som-v1` | **true** | 25 | MOVED (M3-BMC→M3-Marché) — slug + rubric conservés |
| M3 | `positionnement-v1` | **true** | 25 | MOVED (M4→M3) |
| M3 | `comparaison-v1` | **true** | 25 | MOVED (M4→M3) |
| M4 | `commercialisation-v1` | false | 25 | NEW (Funnel AARRR + canaux) |
| M4 | `strategie-100-users-v1` | **true** | 25 | MOVED (M5→M4) |
| M5 | `unit-economics-v1` | false | 25 | NEW (CAC/LTV/Churn/MRR/Payback) — **remplace** capex-opex-v1 |
| M6 | `techniques-pitch-v1` | false | 25 | NEW (préparation pitch, 07) |
| M6 | `pitch-deck-v1` | false | 25 | UNCHANGED (08) |

**Slugs supprimés** : `hypotheses-v1`, `questionnaire-v1`, `fiches-users-10-v1`, `capex-opex-v1`

## Tasks

### T1 — Réécrire `database/seed_event_digi_hackathon.sql`

- **Files** : `database/seed_event_digi_hackathon.sql`
- **Action** :
  1. Mettre à jour titres des 6 missions (ord 1→6) selon noms officiels Welcome Guide.
  2. Ajouter en tête de section 5 (Deliverables) un bloc `DELETE FROM public.deliverable_templates WHERE slug IN (...)` ciblant les 4 slugs disparus dans l'event Digi-Hackathon. Idempotent.
  3. Réécrire les 11 INSERT pour deliverable_templates avec rubrics issues directement des PDF officiels (Design Thinking p.1, BMC p.1, Marché-Technique p.1, Commercialisation p.1, Unit Economics p.1, MoSCoW 04b p.1, Pitch Deck 08).
  4. Conserver les rubrics existantes pour les 5 bonus (persona/tam-sam-som/positionnement/comparaison/strategie-100-users) — juste mettre à jour leur `mission_id` SELECT clause si nécessaire.
- **Verify** : `npm run typecheck && npm run lint && npm run build` passe (le seed SQL n'impacte pas le build, mais on smoke).
- **Done** : commit atomique `feat(quick-260519-pyx): align deliverables to 8 official Welcome Guide PDFs`.

### T2 — Re-apply seed PROD via Supabase MCP

- **Action** :
  1. Lire `seed_event_digi_hackathon.sql` final.
  2. Exécuter via `mcp__plugin_supabase_supabase__execute_sql` en blocs (DELETE puis INSERTs).
  3. Vérifier comptage : `SELECT count(*) FROM deliverable_templates dt JOIN missions m ON m.id=dt.mission_id JOIN events e ON e.id=m.event_id WHERE e.slug='hack-days-fes-meknes-mai-2026'` → attendu 11.
- **Verify** : `SELECT slug, is_bonus FROM deliverable_templates ...` retourne exactement les 11 slugs cibles avec is_bonus correct.
- **Done** : screenshot SUMMARY du résultat.

## Must-haves

1. 11 deliverable_templates en PROD avec les 11 slugs cibles (5 bonus + 6 non-bonus).
2. Aucun slug parmi `hypotheses-v1`, `questionnaire-v1`, `fiches-users-10-v1`, `capex-opex-v1` ne subsiste en PROD pour cet event.
3. Titres missions M1→M6 conformes Welcome Guide.
4. SQL idempotent (re-run = noop).
5. Smoke `npm run typecheck && npm run lint && npm run build` PASS.

## Cardinaux (advisor verdict 2026-05-19)

- **R1 PASS** : aucune nouvelle surface Player exposant score.
- **R2 PASS** : rubrics restent informatives, pas de `severity:"error"`.
- **R3 PASS** : aucune contrainte runtime de blocage inter-mission ajoutée.

## Deferred

Aucun (scope full).

## Risk

- Si des submissions existent en PROD sur les 4 slugs disparus → orphelins (FK CASCADE selon schema). À vérifier en T2 avant DELETE.
