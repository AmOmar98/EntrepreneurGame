---
phase: 02-player-flow-onboarding-journey-submission
plan: 04
subsystem: database/seed
tags: [seed, sql, idempotent, data-03, event-01, event-02]
requires:
  - database/schema.sql
  - database/triggers.sql
  - database/rls.sql
provides:
  - Hack-Days event + cohort seed (idempotent SQL)
  - 6 missions aligned on 13-14 mai 2026 program
  - 9 deliverable_templates with weighted rubrics
  - DATA-03 anti-leak guarantee reinforced in lib/seed/*
affects:
  - database/seed_event_hackdays.sql
  - database/README.md
  - lib/seed/index.ts
  - lib/seed/players.ts
  - lib/seed/missions.ts
  - lib/seed/deliverableTemplates.ts
tech-stack:
  added: []
  patterns:
    - "INSERT ... ON CONFLICT (...) DO UPDATE for idempotent SQL seeds"
    - "Per-mission FK lookup via JOIN on events.slug"
key-files:
  created:
    - database/seed_event_hackdays.sql
  modified:
    - database/README.md
    - lib/seed/index.ts
    - lib/seed/players.ts
    - lib/seed/missions.ts
    - lib/seed/deliverableTemplates.ts
decisions:
  - "Tous les rubrics utilisent 4 criteres x 25 points (somme = 100) pour homogeneiser la grille pilote."
  - "Mission 6 est de kind=pitch (et non atelier) pour separer la cloture jury de l'atelier."
  - "Levels L0..L7 seedes ici plutot que dans schema.sql pour garder schema.sql purement structurel."
  - "Aucun ajout de runtime test (pas de runner installe) — verification anti-leak documentee par grep manuel."
metrics:
  duration: "~25 min"
  completed: 2026-05-08
  tasks: 2
  files_changed: 6
---

# Phase 2 Plan 04: Event Seed Hack-Days + DATA-03 Anti-leak — Summary

Seed SQL idempotent pour l'Event pilote Hack-Days Fes-Meknes Mai 2026 (1 event + 1 cohort + 6 missions + 9 deliverable_templates avec rubrics ponderes), et renforcement des commentaires DATA-03 dans `lib/seed/*` (aucune fuite seed en prod).

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Ecrire database/seed_event_hackdays.sql idempotent | `5fc119f` | database/seed_event_hackdays.sql, database/README.md |
| 2 | Verifier + renforcer DATA-03 anti-leak (lib/seed/*) | `ad46f0c` | lib/seed/index.ts, players.ts, missions.ts, deliverableTemplates.ts |

## Mission <-> Niveau Mapping

| Mission | Level | Ord | Kind | Scheduled (UTC+1) | Title |
| ------- | ----- | --- | ---- | ----------------- | ----- |
| M1 | L1_problem | 1 | atelier | 2026-05-13 09:00 | Atelier 1 — Probleme & Personae |
| M2 | L2_solution | 2 | atelier | 2026-05-13 11:00 | Atelier 2 — Solution & Fiche Produit |
| M3 | L3_market | 3 | atelier | 2026-05-13 14:00 | Atelier 3 — Etude de marche |
| M4 | L4_business_model | 4 | atelier | 2026-05-13 16:00 | Atelier 4 — Business Model & Couts |
| M5 | L4_business_model | 5 | atelier | 2026-05-14 09:00 | Atelier 5 — Strategie commerciale (prix, canaux) |
| M6 | L5_pitch | 6 | pitch | 2026-05-14 14:00 | Atelier 6 — Pitch final & resultats |

## DeliverableTemplates seedes (9)

Rubric uniforme : **4 criteres x 25 points = max_score 100**.

| # | Mission | Slug | Title | Rubric criteria |
| - | ------- | ---- | ----- | --------------- |
| 1 | M1 (L1) | `personae-v1` | Fiche Personae | clarity, specificity, evidence, actionable |
| 2 | M1 (L1) | `probleme-v1` | Enonce du probleme | clarity, impact, evidence, scope |
| 3 | M2 (L2) | `esquisse-solution-v1` | Esquisse de solution | fit, feasibility, differentiation, clarity |
| 4 | M2 (L2) | `fiche-produit-plan-dev-v1` | Fiche Produit & Plan de developpement | completeness, prioritization, plan, risks |
| 5 | M3 (L3) | `etude-marche-v1` | Etude de marche | sizing, competition, trends, sources |
| 6 | M4 (L4) | `bmc-v1` | Business Model Canvas | completeness, coherence, viability, clarity |
| 7 | M4 (L4) | `couts-previsions-v1` | Couts & previsions de ventes | costs, forecast, hypotheses, sensitivity |
| 8 | M5 (L4) | `strategie-commerciale-v1` | Strategie prix, ventes & canaux | pricing, channels, funnel, metrics |
| 9 | M6 (L5) | `pitch-deck-v1` | Pitch deck V1 | narrative, completeness, design, impact |

Ponderation : tous les criteres a `max=25`, somme = 100.

## Idempotency Guarantee

Chaque INSERT du fichier `database/seed_event_hackdays.sql` utilise une clause `ON CONFLICT ... DO UPDATE` :

- `events`        : `on conflict (slug) do update set name, starts_at, ends_at`
- `cohorts`       : `on conflict (event_id, slug) do update set name`
- `levels`        : `on conflict (id) do update set ord, label, description`
- `missions`      : `on conflict (event_id, level_id, ord) do update set kind, title, scheduled_at`
- `deliverable_templates` : `on conflict (mission_id, slug) do update set title, description, rubric, max_score, ord`

Re-executer le fichier 2x ou plus n'introduit ni erreur ni doublon.

## Procedure de verification anti-leak DATA-03

### Checklist a passer avant chaque deploiement Vercel

```
[ ] grep -rn "atlas-soil" app components lib utils middleware.ts
    -> aucun match (les seules mentions admises sont dans les commentaires DATA-03 de lib/seed/*)

[ ] grep -irn "tamwilcom\|bank of africa\|innov invest\|bluespace" app components lib utils middleware.ts
    -> aucun match (les seules mentions sont dans les commentaires DATA-03 de lib/seed/* et database/README.md)

[ ] grep -rn "from \"@/lib/seed/players\"" app components lib | grep -v "lib/seed/index.ts"
    -> aucun match (seul lib/seed/index.ts importe demoPlayers)

[ ] grep -rn "from \"@/lib/seed/missions\"" app components lib | grep -v "lib/seed/index.ts"
    -> aucun match

[ ] grep -rn "from \"@/lib/seed/deliverableTemplates\"" app components lib | grep -v "lib/seed/index.ts"
    -> aucun match

[ ] npm run typecheck && npm run lint
    -> clean
```

### Garantie runtime

`lib/seed/index.ts` :

```typescript
export function seedPlayers(): Player[] {
  return hasSupabaseEnv() ? [] : demoPlayers;
}
export function seedMissions(): Mission[] {
  return hasSupabaseEnv() ? [] : demoMissions;
}
export function seedDeliverableTemplates(): DeliverableTemplate[] {
  return hasSupabaseEnv() ? [] : demoDeliverableTemplates;
}
```

En prod (env vars Supabase definies), les 3 accesseurs retournent `[]`. Les
fichiers `lib/seed/players.ts`, `missions.ts`, `deliverableTemplates.ts`
contiennent uniquement des noms neutres (`Demo Team Alpha`, `Demo - Atelier
Probleme`) et chacun porte un commentaire en tete interdisant les references
partenaires + `atlas-soil`.

## Deviations from Plan

None - plan execute exactement comme ecrit. Les deux taches MUST des `must_haves`
sont satisfaites :

- `database/seed_event_hackdays.sql` cree, contient 1 event + 1 cohort + 6 missions
  + 9 deliverable_templates idempotents.
- `lib/seed/index.ts` confirme retourner `[]` en prod ; commentaires DATA-03
  explicites ajoutes en tete des 4 fichiers.
- `database/README.md` documente l'ordre d'application + interdiction
  `seed_bootcamp.sql` en prod.

## Verification

- `node -e "..."` (cf `<verify><automated>` Task 1) : retourne `ok templates=9` —
  9 inserts de deliverable_templates et toutes les inserts ont `on conflict`.
- `npm run typecheck` : clean.
- `npm run lint` : clean.

## Success Criteria — All Met

- [x] **EVENT-01** : Event seed Hack-Days + 6 missions + 9 deliverable_templates en SQL idempotent.
- [x] **EVENT-02** : Chaque template a rubric JSONB de 4 criteres ponderes (somme=100) + due_at via mission.scheduled_at.
- [x] **DATA-03** : aucune fuite seed en prod ; accesseurs dual-mode confirmes ; commentaires explicites ajoutes.

## Self-Check: PASSED

- FOUND: database/seed_event_hackdays.sql (created, 9 deliverable_templates, ON CONFLICT on every INSERT)
- FOUND: database/README.md (apply order + DATA-03 anti-leak section)
- FOUND: lib/seed/index.ts (DATA-03 banner)
- FOUND: lib/seed/players.ts (DATA-03 banner)
- FOUND: lib/seed/missions.ts (DATA-03 banner)
- FOUND: lib/seed/deliverableTemplates.ts (DATA-03 banner)
- FOUND: commit 5fc119f (Task 1)
- FOUND: commit ad46f0c (Task 2)
