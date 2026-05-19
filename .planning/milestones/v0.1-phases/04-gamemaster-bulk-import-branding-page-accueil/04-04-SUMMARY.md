---
phase: 04-gamemaster-bulk-import-branding-page-accueil
plan: 04
subsystem: admin-export
tags: [admin, export, csv, game-master, route-handler]
requires:
  - lib/auth.ts (getCurrentRole)
  - utils/supabase/server.ts (createClient)
  - lib/supabase-status.ts (hasSupabaseEnv)
  - lib/types.ts (LevelId, PlayerStatus, TeamRole)
provides:
  - "GET /admin/export/players.csv route"
  - "lib/csv.ts: toCsv + csvResponse"
  - "lib/admin-export.ts: getPlayersExportRows + PlayerExportRow"
affects:
  - "/admin (GameMaster dashboard can now link to the export)"
tech-stack:
  added: []
  patterns:
    - "Inline self-tests via tsx for libs without a test runner"
    - "Demo-mode bypass of role gate to keep route demoable without backend"
key-files:
  created:
    - lib/csv.ts
    - lib/admin-export.ts
    - app/admin/export/players.csv/route.ts
  modified: []
decisions:
  - "Demo mode (no Supabase env) bypasses the game_master gate and returns header-only CSV; matches must_have spec and avoids 403 in unconfigured environments"
  - "Folder name 'players.csv' is intentional - Next.js treats it as a literal path segment"
  - "RFC 4180 quoting only when needed (comma, quote, CR, LF) - keeps small CSVs tidy"
  - "Sort by score_project DESC then name ASC for stable, useful default ordering"
metrics:
  duration: "~2m execution"
  completed: 2026-05-08T20:53:22Z
  tasks_completed: 2
  files_created: 3
  files_modified: 0
requirements_completed: [ADMIN-04, SCORE-02]
---

# Phase 4 Plan 04: Export CSV Players Summary

CSV download route `/admin/export/players.csv` for the GameMaster, plus a re-introduced minimal `lib/csv.ts` (RFC 4180 quoting + Response helper) and a server-side accessor (`lib/admin-export.ts`) that aggregates per-Player scores, submission counts and member emails for the current event.

## Objective Recap

Implement ADMIN-04: a GameMaster-only CSV export of the cohort scoreboard with team identity, current level, status, project/engagement scores, submission counts (total + validated), and contact emails (leader + other members). Re-introduce a tiny CSV lib since the previous one was deleted in Phase 1 (DATA-06).

## Tasks Completed

| Task | Name                                                            | Commit  | Files                                          |
| ---- | --------------------------------------------------------------- | ------- | ---------------------------------------------- |
| 1    | Create lib/csv.ts (toCsv + csvResponse) and lib/admin-export.ts | de22c6f | lib/csv.ts, lib/admin-export.ts                |
| 2    | Create GET route handler at /admin/export/players.csv           | afb58d4 | app/admin/export/players.csv/route.ts          |

## Implementation Notes

### `lib/csv.ts`

- `toCsv(rows, columns?)`: derives columns from `columns` arg or keys of first row. Quotes only fields containing `,`, `"`, `\r` or `\n` (RFC 4180). Inner double-quotes are doubled (`""`). `null`/`undefined` -> empty string. Numbers stringified via `String()`. Line terminator `\r\n`.
- `csvResponse(filename, body)`: returns `Response` with `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="<name>"`, `Cache-Control: no-store`.
- 4 inline self-tests at the bottom guarded by a `process.argv[1]` check (works under tsx ESM); run with `npx tsx lib/csv.ts` -> all 4 passing.

### `lib/admin-export.ts`

- `getPlayersExportRows()`: dual-mode safe (returns `[]` when `createClient()` returns null or any query errors).
- Resolves current event (latest `starts_at`), then cohorts -> players -> submissions / player_members / profiles in 5 round-trips.
- Aggregates `submissions_count` and `validated_count` in memory.
- Leader = first member with `team_role = 'owner'` (fallback first member); other members joined with `;`.
- Sort: `score_project DESC`, then `team_name ASC`.
- Never throws: top-level try/catch returns `[]` on unexpected errors.

### `app/admin/export/players.csv/route.ts`

- `dynamic = "force-dynamic"` (reads cookies + DB).
- In Supabase mode: `getCurrentRole()` must equal `"game_master"`, otherwise 403.
- In demo mode (`!hasSupabaseEnv()`): bypasses the role check and returns header-only CSV (per must_have spec).
- 0 rows -> emits `COLUMNS.join(",") + "\r\n"` (header only) so partners testing the URL never see a parse error.

## Verification

- `npx tsx lib/csv.ts` -> 4/4 self-tests passing.
- `npx tsc --noEmit` -> clean.
- `npm run lint` (eslint .) -> clean.
- `npm run build` -> compiled successfully; route `/admin/export/players.csv` listed as `ƒ` (dynamic).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Demo-mode role gate would 403**
- **Found during:** Task 2 (route handler authoring)
- **Issue:** Plan code snippet checks `role !== "game_master"` unconditionally. In demo mode `getCurrentRole()` returns `null`, which would 403 - directly contradicting the must_have "En mode demo (sans Supabase env), reponse 200 avec uniquement la ligne d'en-tete".
- **Fix:** Wrapped role gate in `if (hasSupabaseEnv()) { ... }` so demo mode skips the gate and falls through to the empty-rows -> header-only CSV path.
- **Files modified:** `app/admin/export/players.csv/route.ts`
- **Commit:** afb58d4

## Authentication Gates

None. Pure read-only export route.

## Success Criteria Check

- [x] ADMIN-04: GameMaster downloads `players.csv` with slug/name/level/status/scores/counts/emails.
- [x] Access gate: 403 outside `game_master` (in Supabase mode).
- [x] RFC 4180 valid CSV; no crash with 0 rows (header line only).
- [x] Demo mode returns 200 with header-only CSV.

## Self-Check: PASSED

- FOUND: lib/csv.ts
- FOUND: lib/admin-export.ts
- FOUND: app/admin/export/players.csv/route.ts
- FOUND: commit de22c6f
- FOUND: commit afb58d4
