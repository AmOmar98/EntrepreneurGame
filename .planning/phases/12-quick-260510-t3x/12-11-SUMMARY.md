---
phase: "12-quick-260510-t3x"
plan: "12-11"
subsystem: "csv-export"
tags: ["csv", "export", "gamemaster", "moscow", "route-handler", "t3x-expansion"]
requires:
  - "12-03 (moscow_cards table + RLS)"
  - "12-10 (lib/moscow.ts fetcher)"
provides:
  - "GET /api/export/moscow/[deliverableId].csv — GameMaster CSV export"
affects:
  - "app/api/export/moscow/[deliverableId].csv/route.ts"
tech-stack:
  added: []
  patterns:
    - "Next.js 15 App Router route handler with `dynamic = 'force-dynamic'` + `runtime = 'nodejs'`"
    - "Demo-mode-safe header-only CSV fallback (mirror of players.csv pattern)"
    - "Pathname-based param extraction (workaround for Next.js 15 type validator bug on dotted dynamic segments)"
    - "Defense-in-depth: app-level GM gate via `getCurrentRole()` + RLS at DB layer"
key-files:
  created:
    - "app/api/export/moscow/[deliverableId].csv/route.ts"
  modified: []
decisions:
  - "Used pathname parsing instead of `ctx.params` because Next.js 15.5 type validator returns empty `ParamMap` for dynamic segments with a dot suffix"
  - "Filename pattern `moscow_<deliverableId>.csv` (no date) — keeps URL idempotent for repeated exports"
  - "JOIN moscow_cards + players via Supabase embedded resource select (`players:project_id(slug, name)`)"
  - "Bucket sort order encoded in route (must > should > could > wont) rather than relying on enum natural order"
metrics:
  duration_minutes: 8
  tasks_completed: 2
  files_created: 1
  files_modified: 0
  commits: 1
  completed_at: "2026-05-10"
---

# Phase 12 Plan 12-11: GameMaster MoSCoW CSV Export Summary

GameMaster-only CSV export route for `moscow_cards` at `GET /api/export/moscow/[deliverableId].csv`, mirroring the auth-gated, demo-mode-safe pattern of `app/admin/export/players.csv/route.ts`.

## Route Handler

**Path:** `GET /api/export/moscow/[deliverableId].csv`
**File:** `app/api/export/moscow/[deliverableId].csv/route.ts`
**Config:** `dynamic = "force-dynamic"`, `runtime = "nodejs"`

## Auth Gate

Strict GameMaster gate (defense-in-depth alongside RLS):

- Demo mode (`!hasSupabaseEnv()`): bypass + header-only CSV (no crash on partner test against demo URL)
- Supabase mode: `getCurrentRole()` → if `role !== "game_master"` return `403 Forbidden`
- Even after GM check, if `createClient()` returns null or query errors: header-only CSV (no crash)

R1 safe: no scoring fields are present in `moscow_cards`, and the route is GM-only. Players cannot call this URL (role gate + RLS).

## Demo Mode Behaviour

When `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` are absent:

```
HTTP/1.1 200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="moscow_<id>.csv"

team_slug,team_name,bucket,ord,feature,pourquoi,contrainte,created_at
```

## CSV Columns

| Column | Source | Notes |
| --- | --- | --- |
| `team_slug` | `players.slug` (via JOIN on `project_id`) | empty string if join is null |
| `team_name` | `players.name` | empty string if join is null |
| `bucket` | `moscow_cards.bucket` | one of `must`, `should`, `could`, `wont` |
| `ord` | `moscow_cards.ord` | integer position within the bucket |
| `feature` | `moscow_cards.feature` | RFC 4180 quoted by `toCsv` if needed |
| `pourquoi` | `moscow_cards.pourquoi` | RFC 4180 quoted by `toCsv` if needed |
| `contrainte` | `moscow_cards.contrainte` | RFC 4180 quoted by `toCsv` if needed |
| `created_at` | `moscow_cards.created_at` | ISO timestamp |

## Sort Order

Server-side stable sort (after `created_at` query order):

1. `team_slug` ASC (`localeCompare`)
2. `bucket` in domain order: `must` (1) → `should` (2) → `could` (3) → `wont` (4)
3. `ord` ASC

## Filename

`moscow_<deliverableId>.csv` — ASCII-pur, RGPD-safe (no PII beyond team_name which is the public team brand).

## Files Modified

| File | Change |
| --- | --- |
| `app/api/export/moscow/[deliverableId].csv/route.ts` | NEW — 123 lines, full route handler |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Next.js 15 type validator bug on dotted dynamic segments**

- **Found during:** Task 1 (build verification)
- **Issue:** `npm run build` failed with `.next/types/validator.ts` complaining that the `GET` handler signature `(ctx: { params: Promise<{ deliverableId: string }> })` is incompatible with `Promise<{}>`. Inspection of `.next/types/routes.d.ts` confirmed that `ParamMap["/api/export/moscow/[deliverableId].csv"]` is registered as `{}` (empty) — Next.js 15.5 does not extract dynamic params from segments whose name contains a dot (`[deliverableId].csv`).
- **Fix:** Changed the handler signature to `GET(request: NextRequest)` (no `ctx` param), and extracted `deliverableId` from `request.url` pathname (stripping the trailing `.csv`). URL contract `/api/export/moscow/<id>.csv` is preserved.
- **Files modified:** `app/api/export/moscow/[deliverableId].csv/route.ts`
- **Commit:** `570b2bc`

No other deviations. Plan executed as written, with the deliverable filename pattern adjusted from `moscow-{deliverableId}-{YYYY-MM-DD}.csv` (objective text) to `moscow_<deliverableId>.csv` (plan must_haves), per the plan's stricter must_haves contract.

## Auth Gates / Checkpoints

**Task 2 (`checkpoint:human-verify`)** — Auto-approved (`AUTO_CFG=true`). All automated checks (`npm run typecheck`, `npm run build`, `npx eslint <new file>`, regex acceptance criteria for `csvResponse|toCsv`, `role !== "game_master"`, `force-dynamic`) passed.

## Verification

```
npm run typecheck   # exit 0
npm run build       # exit 0 — route compiled as ƒ /api/export/moscow/[deliverableId].csv
npx eslint app/api/export/moscow/[deliverableId].csv/route.ts   # exit 0 (no warnings on new file)
```

Pre-existing lint errors in `scripts/provision-agreentech-cohort.cjs` and `smoketest/scripts/create-test-accounts.cjs` (`@typescript-eslint/no-require-imports`) are out of scope per the Rule scope boundary and were not touched. Logged for future cleanup.

## Next Consumer

**Plan 12-12** — Smoke regression. Add to the smoke harness a GM-authenticated `GET` to `/api/export/moscow/<known-deliverable-id>.csv`, assert `200 OK`, `Content-Type: text/csv`, and at least the header line. Also assert that a Player-authenticated request returns `403`.

## Self-Check: PASSED

- FOUND: `app/api/export/moscow/[deliverableId].csv/route.ts`
- FOUND: commit `570b2bc` (`feat(t3x-export): add GameMaster CSV export for moscow_cards`)
- typecheck OK, build OK, lint OK on new file
- Acceptance regex hits: `csvResponse` (3), `toCsv` (2), `role !== "game_master"` (1), `force-dynamic` (1), `team_slug|team_name|bucket|feature` (10+)
