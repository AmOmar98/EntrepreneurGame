---
phase: 02-player-flow-onboarding-journey-submission
plan: 02
subsystem: player-journey
tags: [journey, player, ssr, supabase]
requires:
  - 02-01-SUMMARY (auth + onboarding gate)
  - 02-04-SUMMARY (Hack-Days seed event/missions/deliverable_templates)
provides:
  - getJourneyData(userId)
  - computeDeliverableStatus / missionStatus pure helpers
  - /journey server route (header + timeline + deliverables)
affects:
  - app/journey/page.tsx (rewrite)
  - lib/i18n.ts (journey_* keys)
tech-stack:
  added: []
  patterns:
    - server component fetches via @supabase/ssr
    - snake_case row -> camelCase domain mapper (mirrors app/actions.ts)
    - dual-mode early-return when createClient() returns null
key-files:
  created:
    - lib/journey.ts
    - components/journey-header.tsx
    - components/journey-timeline.tsx
    - components/journey-deliverables.tsx
  modified:
    - app/journey/page.tsx
    - lib/i18n.ts
decisions:
  - "missionStatus uses a fixed 60-min en_cours window (no per-mission duration in schema)"
  - "Today's missions = same calendar day OR scheduled_at IS NULL (server local TZ)"
  - "Demo mode (no Supabase env) renders the empty state, never demo seed (DATA-03)"
  - "Action link label is computed from DeliverableStatus, not duplicated in i18n keys"
metrics:
  duration: ~25min
  completed: 2026-05-08
  tasks: 2
  commits: 2
---

# Phase 02 Plan 02: Journey Page Summary

Player journey dashboard rendered server-side: team header, today's mission timeline with status badges, deliverable list with 6-state badges and action links to per-deliverable pages.

## Algorithm: missionStatus

```
missionStatus(scheduledAt, now):
  if scheduledAt is null or invalid -> "a_venir"
  let t = scheduledAt.getTime(), n = now.getTime()
  if n < t                       -> "a_venir"
  if n <= t + 60 * 60 * 1000     -> "en_cours"   (1-hour window)
  else                           -> "passe"
```

Rationale: the `missions` table stores only `scheduled_at` (no duration). The pilot's
ateliers run roughly 60 min each in the Programme Hack'Days, so the constant is a
pragmatic proxy. If durations are needed later, replace with a `duration_minutes`
column and reuse the same comparator.

## Algorithm: computeDeliverableStatus

```
computeDeliverableStatus(submissions[]):
  if submissions is empty -> { status: "a_rendre", latestSubmissionId: null }
  pick latest = max-by(version) over submissions
  return { status: latest.status, latestSubmissionId: latest.id }
```

Covers the 6 visible states: `a_rendre` (no submission yet) plus the 5 stored
`SubmissionStatus` values (`draft` is supported in the dictionary even though the
current submission flow inserts directly with `submitted_v1`).

## Demo mode vs prod mode

| Concern        | Prod (Supabase env set)                             | Demo (no env)                              |
|----------------|-----------------------------------------------------|--------------------------------------------|
| `createClient` | returns SSR client                                  | returns `null`                             |
| `getPlayerForUser` | reads `player_members` + `players`              | returns `null` immediately                 |
| `getJourneyData` | returns full payload from DB                      | returns `EMPTY` (`empty: true`)            |
| `/journey` UI  | header + timeline + deliverables OR empty-state    | always empty-state                          |
| Seed leak risk | none — every read is gated by `createClient()`      | none — page never imports `lib/seed/*`      |

DATA-03 is preserved: `lib/journey.ts` does not import any module under `lib/seed/`.
The empty state copy is generic ("Aucun parcours configure pour votre compte.") and
contains no partner names or seed slugs.

## Data flow

```
/journey (server component)
  -> getCurrentUser() / getCurrentRole()  (lib/auth.ts)
  -> getJourneyData(user.id)              (lib/journey.ts)
       -> player_members (player_id where user_id = ?)
       -> players (current_level, score_project, name, ...)
       -> cohorts (event_id by player.cohort_id)
       -> missions (event_id, ordered by scheduled_at, level_id, ord)
       -> filter to today's calendar day (or unscheduled)
       -> deliverable_templates IN (today's mission ids)
       -> submissions (player_id = ?, deliverable_template_id IN templates)
       -> group + computeDeliverableStatus per template
  -> JourneyHeader / JourneyTimeline / JourneyDeliverables
```

## Verification

- typecheck clean
- lint clean
- next build clean (10 routes, /journey server-rendered on demand)

## Self-Check: PASSED

- FOUND: lib/journey.ts
- FOUND: components/journey-header.tsx
- FOUND: components/journey-timeline.tsx
- FOUND: components/journey-deliverables.tsx
- FOUND: app/journey/page.tsx (rewritten)
- FOUND commit: f45575c (Task 1)
- FOUND commit: dee5d07 (Task 2)
