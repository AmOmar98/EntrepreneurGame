---
phase: 04-gamemaster-bulk-import-branding-page-accueil
plan: 01
subsystem: admin
tags: [admin, dashboard, cohort, gamemaster]
requirements: [ADMIN-01, ADMIN-02, SCORE-02]
dependency-graph:
  requires:
    - phase 02 player schema (players, cohorts, missions, deliverable_templates, submissions)
    - phase 03 evaluations table
    - lib/auth.ts (getCurrentRole, pathForRole)
    - lib/journey.ts (levelLabel)
  provides:
    - lib/admin.ts (getCohortOverview, getGlobalCounters, CohortRow, GlobalCounters)
    - /admin GameMaster dashboard
  affects:
    - app/admin/page.tsx (was scaffold, now production view)
    - lib/i18n.ts (admin_* keys, FR + EN)
tech-stack:
  added: []
  patterns:
    - dual-mode Supabase access (createClient null short-circuit)
    - snake_case row mapper to camelCase Player (mirrors lib/mentor.ts)
    - in-memory aggregation across submissions / evaluations
key-files:
  created:
    - lib/admin.ts
  modified:
    - app/admin/page.tsx
    - lib/i18n.ts
decisions:
  - "Status heuristic kept simple for Day-1 (retard if 0 submissions and elapsedMissions>0; en_avance if validated >= elapsed+1; else a_l_heure). Documented inline."
  - "Next-deliverable resolution: first template ordered by mission.ord then template.ord that has no in-flight submission (submitted_v1, submitted_v2, validated)."
  - "Page gates by getCurrentRole and redirects via pathForRole, mirroring /mentor."
metrics:
  duration: ~25 minutes
  completed_date: 2026-05-08
---

# Phase 4 Plan 01: GameMaster Dashboard Summary

GameMaster `/admin` dashboard now renders the live cohort table (team, level, project score, status, next deliverable) and three global counters (submitted/total, pending review, validated) backed by a new `lib/admin.ts` data layer. Implements ADMIN-01, ADMIN-02 and SCORE-02.

## What Was Built

### Task 1 - lib/admin.ts (commit `bad43f5`)

New server-side data layer modeled on `lib/mentor.ts`:

- `getCohortOverview(): Promise<CohortRow[]>` - one row per Player in the current event's cohorts. Resolves the latest `events` row, fetches its cohorts and players, joins missions + deliverable_templates ordered by `(mission.ord, template.ord)`, then loads all submissions in a single round-trip and aggregates in memory. Computes:
  - `levelLabel` via `levelLabel(player.currentLevel)`.
  - `nextDeliverableTitle`: first template with no in-flight submission (`submitted_v1`, `submitted_v2`, `validated`) for that player.
  - `status` via the documented Day-1 heuristic.
- `getGlobalCounters(): Promise<GlobalCounters>` - aggregate counters scoped to the current event:
  - `totalSubmissions`, `validated` from a single submissions query.
  - `pendingReview` = `submitted_v1`/`submitted_v2` with no row in `evaluations` (computed via a second `.in('submission_id', ...)` lookup; in-memory diff).
  - `totalDeliverableSlots` = `playersCount * templatesCount`.
- Dual-mode safe: `createClient()` null short-circuit returns `[]` / zero counters - no seed leak. Errors logged via `console.error("[admin] ...")` and never thrown.

### Task 2 - /admin page + i18n keys (commit `5729c63`)

- `app/admin/page.tsx` rewritten as a server component:
  - `getCurrentUser()` -> redirect `/login` if absent.
  - `getCurrentRole()` -> redirect via `pathForRole` if non-game_master (mirrors mentor gate).
  - `Promise.all([getCohortOverview(), getGlobalCounters()])` when Supabase env is present, otherwise empty rows / zero counters.
  - Layout: header + action bar (`/admin/players/import` link, `/admin/export/players.csv` link), 3 counter cards, cohort table with status badges (en_avance / a_l_heure / retard), empty state, demo banner.
- 18 new keys added to `lib/i18n.ts` under both `fr` and `en` (admin_title, admin_subtitle, admin_count_*, admin_col_*, admin_status_*, admin_empty_cohort, admin_demo_disabled, admin_action_*).

## Verification

- `npm run typecheck` clean.
- `npx next lint` clean (no ESLint warnings or errors).
- `npm run build` succeeds; `/admin` listed as dynamic route (`ƒ /admin`, 3.72 kB First Load 110 kB).

## Deviations from Plan

None - plan executed exactly as written. The placeholder action targets (`/admin/players/import`, `/admin/export/players.csv`, `/admin/players/[id]`) are intentional; their handlers will land in plans 04-02 (import), 04-03 (player detail) and 04-04 (export).

## Self-Check: PASSED

- `lib/admin.ts` FOUND.
- `app/admin/page.tsx` FOUND (rewritten).
- `lib/i18n.ts` FOUND with admin_* keys (FR + EN).
- Commit `bad43f5` FOUND (Task 1).
- Commit `5729c63` FOUND (Task 2).
- typecheck + lint + build all green.
