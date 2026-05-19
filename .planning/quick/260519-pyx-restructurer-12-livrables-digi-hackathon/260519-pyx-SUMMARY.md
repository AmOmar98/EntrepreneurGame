---
quick_id: 260519-pyx
title: Restructurer 12 → 13 livrables Digi-Hackathon alignés Welcome Guide PDF
date: 2026-05-19
status: completed
prod_applied: true
commit_planned: pending
---

# Summary

## Résultat

PROD `vzzbjxmfkmvqkaqxalhr` (event `hack-days-fes-meknes-mai-2026`) restructuré :

| Mission (ord) | Titre atelier (Welcome Guide) | Livrables non-bonus | Bonus (`is_bonus=true`) |
|---|---|---|---|
| M1 (L1, mer 10:30) | Atelier 1 — Design Thinking | `design-thinking-v1` | `persona-v1` |
| M2 (L2, mer 14:00) | Atelier 2 — Business Model Canvas | `bmc-v1` | — |
| M3 (L3, mer 15:00) | Atelier 3 — Étude marché & analyse technique | `marche-technique-v1`, `moscow-v1` | `tam-sam-som-v1`, `positionnement-v1`, `comparaison-v1` |
| M4 (L4 ord=4, jeu 09:30) | Atelier 4 — Stratégie de commercialisation | `commercialisation-v1` | `strategie-100-users-v1` |
| M5 (L4 ord=5, jeu 11:00) | Atelier 5 — Analyse financière (Unit Economics) | `unit-economics-v1` | — |
| M6 (L5, jeu 13:00 + ven 09:30) | Atelier 6 — Techniques de pitch + Pitch jury | `techniques-pitch-v1`, `pitch-deck-v1` | — |

**Total** : 13 deliverable_templates = 8 non-bonus (= 8 livrables officiels Welcome Guide) + 5 bonus inchangés.

**PLAN.md initial annonçait 11 deliverables** : erreur de comptage du planneur (j'avais oublié de compter `techniques-pitch-v1` séparément et fait une erreur sur les bonus). Le résultat 13 est correct et correspond exactement à la structure officielle : 1 deliverable principal par livrable PDF 02-08 + annexe 04b MoSCoW + 5 bonus pédagogiques.

## Slugs supprimés en PROD

- `hypotheses-v1` (fusionné dans `design-thinking-v1` — PDF 02 couvre déjà persona+verbatims)
- `questionnaire-v1` (idem, pas de PDF support distinct)
- `fiches-users-10-v1` (idem)
- `capex-opex-v1` (remplacé par `unit-economics-v1` — PDF 06 demande CAC/LTV/Churn, pas CAPEX/OPEX)

FK `submissions.deliverable_template_id ON DELETE RESTRICT` — DELETE a fonctionné car 0 submissions sur ces 4 slugs (vérifié pré-DELETE).

## Slugs nouveaux en PROD

- `design-thinking-v1` (Livrable 02 : Empathize+Define+Ideate+Prototype)
- `marche-technique-v1` (Livrable 04 : sizing+stack+risques)
- `commercialisation-v1` (Livrable 05 : Funnel AARRR+canaux)
- `unit-economics-v1` (Livrable 06 : CAC/LTV/Churn/MRR/Payback/Conv)
- `techniques-pitch-v1` (Livrable 07 : préparation pitch)

## Bonus déplacés (mission_id réassigné, slug + rubric inchangés)

- `tam-sam-som-v1` : M3-BMC → M3-Étude marché (cohérence avec PDF 04)
- `positionnement-v1` : M4 → M3 (regroupé avec étude marché)
- `comparaison-v1` : M4 → M3 (regroupé avec étude marché)
- `strategie-100-users-v1` : M5 → M4 (regroupé avec commercialisation)
- `moscow-v1` : M4 → M3 (annexe 04b du Livrable 04)

## Titres missions mis à jour

Les 6 titres ont été alignés sur Welcome Guide p.2 (Programme prévisionnel). M2 scheduled_at corrigé à 14h00 (était 11h00).

## Application PROD

4 blocs SQL appliqués via `mcp__plugin_supabase_supabase__execute_sql` le 2026-05-19 :
1. UPDATE titres 6 missions ✓
2. DELETE 4 slugs disparus + UPDATE mission_id pour bmc/moscow/positionnement/comparaison/strategie-100-users ✓
3. INSERT design-thinking-v1 + marche-technique-v1 + commercialisation-v1 ✓
4. INSERT unit-economics-v1 + techniques-pitch-v1 + refresh rubrics/ord pour BMC/moscow/tam-sam-som/positionnement/comparaison/strategie-100-users/pitch-deck ✓

Vérification finale : 13 deliverables retournés dans l'ordre attendu (M1 ord 1-2 / M2 ord 1 / M3 ord 1-5 / M4 ord 1-2 / M5 ord 1 / M6 ord 1-2).

## Fichier SQL

Bloqué par `Write(database/**)` deny dans `.claude/settings.local.json`. Solution : nouveau SQL écrit dans `.planning/quick/260519-pyx-.../seed_event_digi_hackathon.NEW.sql` — à copier dans `database/seed_event_digi_hackathon.sql` quand la deny-list sera levée (post-pilote). L'ancien fichier `database/seed_event_digi_hackathon.sql` (commit `4ee92a9`) reste obsolète en repo mais ne sert qu'en cas de re-apply manuel sur un projet vierge ; PROD est à jour via MCP.

**Écart fichier/PROD temporaire** : `database/seed_event_digi_hackathon.sql` est désynchronisé jusqu'à ce que le user copie `seed_event_digi_hackathon.NEW.sql` à sa place.

## Cardinaux R1/R2/R3 — advisor PASS (2026-05-19)

- **R1 PASS** : pas de nouvelle surface Player exposant score ; restructuration purement seed backend.
- **R2 PASS** : rubrics restent informatives, aucun `severity:"error"`.
- **R3 PASS** : pas de `requires`/`gatedBy`/contrainte runtime bloquante ajoutée.

Verdict : `Hotfix-eligible: YES (event T-1, restructuration seed aligne sur PDF officiel — pas de changement de surface Player, pas de changement de scoring)`.

## Smoke

- `npm run typecheck` ✓ (aucune erreur)
- `npm run lint` ✓ (aucune erreur)
- `npm run build` non exécuté (modifs SQL only — aucun fichier TS touché)

## Action attendue user

1. Quand la deny-list `Write(database/**)` sera levée (toggle `settings.local.json` ou post-pilote), copier `.planning/quick/260519-pyx-restructurer-12-livrables-digi-hackathon/seed_event_digi_hackathon.NEW.sql` → `database/seed_event_digi_hackathon.sql`.
2. Commiter cet update fichier avec message `feat(seed): align seed_event_digi_hackathon.sql with PROD state (260519-pyx)`.

## Deferred

Aucun — scope intégralement livré sur PROD.
