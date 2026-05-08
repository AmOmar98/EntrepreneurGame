---
phase: 05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod
plan: 01
subsystem: jury
tags: [jury, pitch_scores, mentor, hack-days-day2]
requires:
  - database/schema.sql:pitch_scores
  - database/rls.sql:pitch_scores_mentor_self_insert
  - lib/auth.ts:getCurrentRole
  - utils/supabase/server.ts:createClient
provides:
  - lib/jury.ts:getJuryOverview
  - lib/jury.ts:JuryPlayerRow
  - lib/jury.ts:mapPitchScore
  - app/actions.ts:savePitchScoreFlow
  - app/jury/page.tsx
  - app/jury/jury-form.tsx
  - i18n keys: jury_*
affects:
  - /jury route (new)
  - revalidatePath /jury, /results
tech-stack:
  added: []
  patterns:
    - "Dual-mode data layer (DATA-03)"
    - "Zod safeParse + WorkflowState"
    - "Server-side juror_id (T-05-03 mitigation)"
    - "Upsert with onConflict triple-key"
key-files:
  created:
    - lib/jury.ts
    - app/jury/page.tsx
    - app/jury/jury-form.tsx
  modified:
    - lib/i18n.ts
    - app/actions.ts
decisions:
  - "juror_id read from auth.uid() server-side, never from FormData (anti-spoofing)"
  - "Role gate accepts both mentor and game_master (GM can score in pinch)"
  - "Live total computed client-side from controlled inputs"
metrics:
  duration: ~25min
  completed: 2026-05-08
requirements: [JURY-01, JURY-02]
---

# Phase 5 Plan 01: Jury Pitch Scoring Summary

JURY-01 + JURY-02 livres : route `/jury` (Mentor/GameMaster) avec liste Players et formulaire 5x20 par equipe ; server action `savePitchScoreFlow` upsert dans `pitch_scores` (unique event_id x player_id x juror_id), juror_id force depuis `auth.uid()`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | lib/jury.ts data layer + i18n keys | 1412b50 | lib/jury.ts, lib/i18n.ts |
| 2 | savePitchScoreFlow server action (JURY-02) | bb57388 | app/actions.ts |
| 3 | Page /jury + jury-form client | 9f89816 | app/jury/page.tsx, app/jury/jury-form.tsx |

## What Was Built

### `lib/jury.ts`
- `getJuryOverview(): Promise<{ eventId, rows: JuryPlayerRow[] }>` — resout l'event courant (latest by starts_at), charge cohorts -> players (ordres par name), puis charge les `pitch_scores` du juror connecte en un round-trip et map chaque Player a son existing score (ou null).
- Demo mode (DATA-03) : `createClient()` null -> retourne `{ eventId: null, rows: [] }`. Pas de seed leak.
- Mapper `mapPitchScore` (snake_case -> camelCase, total_score numeric coerce).

### `savePitchScoreFlow` (app/actions.ts)
- Zod schema : c1..c5 `int().min(0).max(20)`, uuids sur playerId/eventId.
- Sequence : `hasSupabaseEnv()` -> `safeParse` -> `createClient()` -> `auth.getUser()` -> role gate (mentor|game_master) -> upsert.
- juror_id pris de `user.id` server-side (T-05-03) ; jamais lu de FormData.
- Upsert avec `{ onConflict: 'event_id,player_id,juror_id' }` -> resoumission update la meme row.
- Toutes erreurs Supabase remontees dans `WorkflowState.message` (DATA-04).
- `revalidatePath('/jury')` + `revalidatePath('/results')`.

### `/jury` route (app/jury/page.tsx + jury-form.tsx)
- Server component : redirect /login si pas user, redirect role-specific si non-mentor (T-05-04).
- Cards par Player (name + idea + indicateur "deja note") avec form integre.
- Client form (`useActionState`) : 5 inputs number contr&ocirc;les [0..20], total live calcule (sum/100), bouton submit, message ok/erreur sous le form.
- Pas de redirect post-submit ; le Mentor reste sur /jury.

### i18n
- 18 cles `jury_*` ajoutees aux dictionnaires `fr` et `en` (criteres, total, save, etats, demo banner).

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass (0 warnings)
- `npm run build` — pass ; route `/jury` listee a 1.74 kB / 118 kB First Load
- Routes confirmees : `/jury` (dynamic, server-rendered)
- Threat mitigations couvertes :
  - T-05-01 (Tampering) : Zod borne 0..20, uuid
  - T-05-02 (EoP) : role gate applicatif + RLS `pitch_scores_mentor_self_insert`
  - T-05-03 (Spoofing) : juror_id force depuis `auth.uid()`
  - T-05-04 (Info disclosure) : redirect role cote page server

## Deviations from Plan

None - plan execute exactement comme ecrit.

## Self-Check: PASSED

Files verified:
- FOUND: lib/jury.ts
- FOUND: app/jury/page.tsx
- FOUND: app/jury/jury-form.tsx

Commits verified:
- FOUND: 1412b50 (Task 1)
- FOUND: bb57388 (Task 2)
- FOUND: 9f89816 (Task 3)

Requirements satisfied: JURY-01, JURY-02.
