---
phase: 05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod
plan: 02
subsystem: results
tags: [results, ranking, publication, game_master, hack-days-day2]
requires:
  - database/schema.sql:events.results_published_at
  - database/schema.sql:pitch_scores.total_score
  - database/schema.sql:players.score_project
  - lib/auth.ts:getCurrentRole
  - utils/supabase/server.ts:createClient
provides:
  - lib/results.ts:computeRanking
  - lib/results.ts:isResultsPublished
  - lib/results.ts:RankingRow
  - lib/results.ts:DEFAULT_PITCH_WEIGHT
  - app/actions.ts:publishResultsFlow
  - app/results/page.tsx
  - app/results/publish-button.tsx
  - i18n keys: results_*
affects:
  - /results route (new)
  - revalidatePath /results
tech-stack:
  added: []
  patterns:
    - "Dual-mode data layer (DATA-03)"
    - "Zod safeParse + WorkflowState"
    - "Server-side role gate (T-05-06 mitigation)"
    - "Idempotent publish (conditional UPDATE on results_published_at IS NULL)"
    - "Dense ranking with stable tie-break"
key-files:
  created:
    - lib/results.ts
    - app/results/page.tsx
    - app/results/publish-button.tsx
  modified:
    - lib/i18n.ts
    - app/actions.ts
decisions:
  - "Pondération 50/50 par défaut (DEFAULT_PITCH_WEIGHT=0.5), configurable via opts.pitchWeight"
  - "Dense ranking (égalité = même rang, sans saut) plutôt que classement standard"
  - "Tie-break stable : combined desc, pitchAvg desc, name asc"
  - "Idempotent publish via UPDATE ... WHERE results_published_at IS NULL (safe en cas de double-clic)"
  - "Render server-side gate (T-05-07) : aucun score envoyé au client si role!=GM && !published"
metrics:
  duration: ~20min
  completed: 2026-05-08
requirements: [JURY-03, JURY-04, JURY-05]
---

# Phase 5 Plan 02: Results Ranking + Publication Summary

JURY-03/04/05 livrés : page `/results` avec classement combiné serveur (moyenne PitchScore + Score Projet pondéré 50/50), gate de publication via `events.results_published_at`, bouton "Publier" GameMaster idempotent.

## Tasks Completed

| Task | Name                                        | Commit  | Files                                       |
| ---- | ------------------------------------------- | ------- | ------------------------------------------- |
| 1    | lib/results.ts ranking + i18n keys          | 5a7b33e | lib/results.ts, lib/i18n.ts                 |
| 2    | publishResultsFlow server action (JURY-05)  | 862f5eb | app/actions.ts                              |
| 3    | Page /results + publish-button              | c93a715 | app/results/page.tsx, app/results/publish-button.tsx |

## What Was Built

### `lib/results.ts`
- `computeRanking(opts?: { pitchWeight? }): Promise<{ eventId, publishedAt, rows: RankingRow[] }>` — résout l'event courant (latest by `starts_at`), charge cohorts -> players (ordre name asc), puis charge `pitch_scores` du même event en un round-trip et agrège côté serveur (moyenne arithmétique + count par player).
- Combined score = `pitchWeight * pitchAvg + (1 - pitchWeight) * scoreProject`. `DEFAULT_PITCH_WEIGHT = 0.5`. Le poids est borné à [0..1] via `clampWeight`.
- Tri : combined desc, pitchAvg desc (tie-break primaire), `name` asc (tie-break secondaire).
- Dense ranking : égalité partage le même rang, prochain rang +1 (pas de saut).
- `isResultsPublished()` — query légère retournant `{ eventId, publishedAt }` du dernier event.
- Demo mode (DATA-03) : `createClient()` null -> `{ eventId: null, publishedAt: null, rows: [] }`. Pas de seed leak.
- `numeric(6,2)` -> `Number()` côté mapper et au moment de l'agrégat.

### `publishResultsFlow` (app/actions.ts)
- Zod schema : `eventId: z.string().uuid()`.
- Séquence : `hasSupabaseEnv()` -> `safeParse` -> `createClient()` -> `auth.getUser()` -> role gate (`game_master` only) -> SELECT event -> UPDATE conditionnel.
- Role gate applicatif (T-05-06) : `profiles.app_role !== 'game_master'` -> `"Acces reserve au GameMaster."`.
- Idempotent : si `events.results_published_at` déjà non-null -> `{ ok: true, message: "Resultats deja publies." }` sans réécriture.
- UPDATE conditionnel `WHERE id = eventId AND results_published_at IS NULL` -> safe en cas de double-clic / race.
- `revalidatePath('/results')` dans tous les chemins succès.
- Toutes erreurs Supabase remontées dans `WorkflowState.message` (DATA-04).

### `/results` route (app/results/page.tsx + publish-button.tsx)
- Server component : redirect `/login` si pas user.
- Mode démo -> bannière `results_demo_disabled` (rien d'autre rendu).
- Branchement gate (T-05-07) : si `role !== 'game_master' && !isPublished` -> rendu sobre `results_pending_title` + `results_pending_body`. **Aucun score envoyé au client**.
- Sinon : rendu tableau (rank, équipe, pitchAvg + jurorCount, scoreProject, combined) avec en-tête, bandeau `results_published_at_label` + date FR formatée, et `<PublishButton>` pour GM.
- Empty state `results_empty` quand `rows.length === 0`.
- `PublishButton` (`"use client"`) : `useActionState(publishResultsFlow)`, `<input type="hidden" name="eventId">`, `onSubmit` avec `confirm(dict.results_publish_confirm)`. Si `alreadyPublished` -> label `results_already_published` (toujours fonctionnel, idempotent côté serveur). Si `eventId === null` -> bouton disabled.

### i18n
- 14 clés `results_*` ajoutées aux dictionnaires `fr` et `en` (titre, sous-titre, pending, colonnes, publish, demo, empty).

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass (0 warnings)
- `npm run build` — pass ; route `/results` listée à 1.37 kB / 118 kB First Load
- Routes confirmées : `/results` (dynamic, server-rendered)
- Threat mitigations couvertes :
  - T-05-06 (EoP) : role gate applicatif `app_role === 'game_master'` + RLS `events_gm_all`
  - T-05-07 (Info disclosure) : branchement render server-side, ranking jamais sérialisé pour Player tant que non publié
  - T-05-08 (Tampering) : Zod uuid sur eventId + RLS

## Deviations from Plan

None - plan exécuté exactement comme écrit.

## Self-Check: PASSED

Files verified:
- FOUND: lib/results.ts
- FOUND: app/results/page.tsx
- FOUND: app/results/publish-button.tsx
- FOUND: lib/i18n.ts (modified)
- FOUND: app/actions.ts (modified)

Commits verified:
- FOUND: 5a7b33e (Task 1)
- FOUND: 862f5eb (Task 2)
- FOUND: c93a715 (Task 3)

Requirements satisfied: JURY-03, JURY-04, JURY-05.
