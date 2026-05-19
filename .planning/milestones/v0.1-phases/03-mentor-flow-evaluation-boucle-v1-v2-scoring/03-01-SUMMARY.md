---
phase: 03-mentor-flow-evaluation-boucle-v1-v2-scoring
plan: 01
subsystem: mentor
tags: [mentor, scoring, evaluation, dashboard]
requires:
  - lib/types.ts
  - lib/auth.ts
  - lib/journey.ts
  - lib/i18n.ts
  - utils/supabase/server.ts
  - components/app-shell.tsx
  - database/schema.sql (events, cohorts, players, missions, deliverable_templates, submissions, evaluations)
provides:
  - "lib/mentor.ts:getMentorPlayersOverview"
  - "lib/mentor.ts:MentorPlayerOverview"
  - "components/mentor-players-table.tsx:MentorPlayersTable"
  - "components/mentor-pending-filter.tsx:MentorPendingFilter"
  - "/mentor (role-gated server page with onlyPending filter)"
affects:
  - app/mentor/page.tsx (replaced scaffold)
  - lib/i18n.ts (added mentor_* keys FR + EN)
tech_stack:
  added: []
  patterns:
    - "Dual-mode dataloader: returns [] when !supabase (no seed leak)"
    - "Server component table + small client filter toggle for ?pending=1"
    - "Role gate via pathForRole(role) consistent with /journey and /admin"
key_files:
  created:
    - lib/mentor.ts
    - components/mentor-players-table.tsx
    - components/mentor-pending-filter.tsx
  modified:
    - app/mentor/page.tsx
    - lib/i18n.ts
decisions:
  - "Aggregate submitted/pending counters in memory after a single submissions+evaluations fetch (avoids N+1)"
  - "PENDING_STATUSES = [submitted_v1, submitted_v2]: a submission is 'pending for me' if not yet evaluated by the connected mentor"
  - "GameMaster role can also access /mentor (DB is_mentor() admits both, mirror at app layer)"
  - "i18n keys remain plain ASCII to match existing convention (e.g. 'Equipe', 'Idee', 'Evaluer')"
metrics:
  duration_seconds: 147
  completed_date: 2026-05-08
  tasks_completed: 3
  files_changed: 5
  commits: 3
---

# Phase 3 Plan 01: Mentor /mentor Overview Summary

Liste cohorte Mentor avec score Projet, compteur soumis/total et filtre "en attente de revue par moi", branchée sur Supabase via `getMentorPlayersOverview` et protégée par `pathForRole`.

## Tasks executed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | lib/mentor.ts data layer | `ed28cfa` | lib/mentor.ts |
| 2 | mentor table + pending filter components | `67b81c5` | components/mentor-players-table.tsx, components/mentor-pending-filter.tsx, lib/i18n.ts |
| 3 | /mentor page wired with role gate + filter | `0f61fb8` | app/mentor/page.tsx |

## Implementation notes

**Data layer (`lib/mentor.ts`).** Resolves the latest event (single seed event for the pilot), fetches all cohorts, then players ordered by name. Counts deliverable_templates attached to event missions in one head-only query. Submissions and the connected user's evaluations are loaded in two bulk queries and aggregated in memory; `pendingSubmissionIds` per player is derived from `status in (submitted_v1, submitted_v2)` minus those already evaluated by `evaluator_id = current user`. In demo mode (`!supabase`) or when no event exists, returns `[]` so no seed leaks (DATA-03).

**Components.** `mentor-players-table.tsx` is a server component rendering an accessible `<table>` with `<th scope="col">`. The "En attente" cell becomes a pill-styled `<Link>` to `/mentor/submission/[firstPendingId]` (Plan 02 will paginate within a Player's submissions). `mentor-pending-filter.tsx` is a small client component using `useSearchParams` + `useRouter` to toggle `?pending=1`.

**Page (`app/mentor/page.tsx`).** Server component. Redirects unauthenticated to `/login`, redirects non-mentor/non-GameMaster via `pathForRole(role)`. GameMaster is admitted alongside Mentor because `is_mentor()` in `database/rls.sql` admits both at the data layer. Awaits Next 15 `searchParams: Promise<...>` correctly. Demo mode shows `mentor_demo_disabled` instead of an empty table.

**i18n.** Added 13 keys × 2 locales (FR + EN) following the project's plain-ASCII convention.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] i18n keys added in Task 2 instead of Task 3**
- **Found during:** Task 2.
- **Issue:** Task 2 components import `dictionaries.fr.mentor_*`. Splitting i18n addition to Task 3 would have caused a typecheck failure between Task 2 and Task 3 commits, violating the "typecheck clean per task" verification gate.
- **Fix:** Added all 13 mentor i18n keys (FR + EN) within the Task 2 commit so each commit is independently TS-clean. Task 3 only touches `app/mentor/page.tsx`.
- **Files modified:** lib/i18n.ts
- **Commit:** `67b81c5`

No other deviations - plan executed as written.

## Verification

- `npm run typecheck` → clean
- `npm run lint` → clean
- `npm run build` → success, `/mentor` listed in dynamic route table (3.06 kB / 109 kB First Load JS)
- Demo mode: `/mentor` renders title + filter + `mentor_demo_disabled` banner, no crash
- Supabase mode (logical): role gate redirects Player to `/journey`, Mentor and GameMaster both reach `/mentor`; filter `?pending=1` restricts list to Players with at least one submission not yet evaluated by the connected user

## Threat Flags

None - no new network endpoint, auth path or trust boundary introduced. All reads go through existing RLS-protected tables.

## Self-Check: PASSED

- FOUND: lib/mentor.ts
- FOUND: components/mentor-players-table.tsx
- FOUND: components/mentor-pending-filter.tsx
- FOUND: app/mentor/page.tsx (modified)
- FOUND: commit ed28cfa
- FOUND: commit 67b81c5
- FOUND: commit 0f61fb8

## Next steps (handoff to Plan 02)

- `/mentor/submission/[id]` page reads a single submission, renders rubric grid, evaluation form, and posts via a new `evaluateSubmission` server action.
- The orange badge in `mentor-players-table.tsx` already links to `/mentor/submission/${pendingSubmissionIds[0]}` - Plan 02 only needs to ship the route.
