---
phase: 04-gamemaster-bulk-import-branding-page-accueil
plan: 02
subsystem: admin
tags: [admin, import, csv, gamemaster, onboarding]
requirements: [ONBOARD-01, ADMIN-01]
dependency-graph:
  requires:
    - phase 02 player schema (players, cohorts, player_members)
    - phase 04 plan 01 (admin dashboard scaffold)
    - utils/supabase/server.ts (createClient)
    - "@supabase/supabase-js" admin API (inviteUserByEmail)
  provides:
    - lib/admin-import.ts (parseCsv, dedupeCsvRows, slugifyTeam, types CsvRow / ImportReport)
    - app/actions.ts importPlayersCsv server action (ImportWorkflowState)
    - /admin/players/import GameMaster bulk-import page
  affects:
    - app/actions.ts (appended import action)
    - components/app-shell.tsx (game_master nav adds Import CSV)
    - lib/i18n.ts (17 new keys, FR + EN)
    - .env.example (documents SUPABASE_SERVICE_ROLE_KEY usage)
tech-stack:
  added: []
  patterns:
    - pure-helper module + server-action orchestration split
    - inline test runner via `npx tsx` (no test framework configured)
    - dual-mode Supabase short-circuit in action
    - service-role admin client built on demand, not exported
    - idempotent upsert via lookup-then-insert + unique constraints
key-files:
  created:
    - lib/admin-import.ts
    - components/csv-import-form.tsx
    - app/admin/players/import/page.tsx
  modified:
    - app/actions.ts
    - components/app-shell.tsx
    - lib/i18n.ts
    - .env.example
decisions:
  - "Pure helpers in lib/admin-import.ts have zero Supabase coupling so they remain unit-testable without DB."
  - "Inline test runner (require.main === module) replaces a missing test framework. Six cases covering parsing, header validation, email validation, RFC-4180 quotes, dedupe, and slugify."
  - "User-by-email resolution uses admin.listUsers (perPage 1000) since supabase-js v2 has no direct lookup-by-email endpoint. Acceptable for pilot scale (<100 emails)."
  - "Service-role absence does NOT abort the import: existing users are linked, missing users are flagged invitesSkipped + an error per email."
  - "TS2775 'assertion functions need explicit type annotation' avoided by replacing node:assert with plain throw helpers (eq/deepEq/truthy/matches)."
metrics:
  duration: ~25 minutes
  completed_date: 2026-05-08
---

# Phase 4 Plan 02: GameMaster CSV Bulk Import Summary

GameMaster can now upload a CSV at `/admin/players/import` to create 6-15 Players + PlayerMembers in one shot. Magic-link invites are sent via the Supabase admin API when `SUPABASE_SERVICE_ROLE_KEY` is configured; missing service-role degrades gracefully (existing users still linked, missing users flagged in the report). The whole pipeline is idempotent: re-uploading the same CSV produces `created=0, membersAdded=0, invitesSent=0`. Implements ONBOARD-01 and the import surface of ADMIN-01.

## What Was Built

### Task 1 - lib/admin-import.ts (commit `4a19e31`)

Pure helpers, no Supabase calls:

- `parseCsv(text)` returns `{ rows, errors }`. Required header (any order): `team_name, project_name, project_pitch, leader_email, member_emails`. Tolerates `\r\n`, blank lines, trailing newline. RFC-4180 quote handling for embedded commas (`"Pitch, with comma"`). Drops rows with invalid `leader_email` and records the line number.
- `dedupeCsvRows(rows)` keeps the first occurrence per `leader_email` (case-insensitive).
- `slugifyTeam(name)` strips diacritics, lowercases, replaces non-alphanum runs with `-`. `"Equipe Alpha 1!"` -> `"equipe-alpha-1"`.
- Inline test runner (`require.main === module`) executes 6 assertions via plain throw helpers (avoids node:assert + TS2775). Run with `npx tsx lib/admin-import.ts`. All 6 PASS.

### Task 2 - importPlayersCsv server action (commit `ce664bf`)

Appended to `app/actions.ts`:

- `ImportWorkflowState = WorkflowState & { report?: ImportReport }`.
- AuthZ: `supabase.auth.getUser()` + `profiles.app_role === 'game_master'`. Otherwise `{ ok: false, message: "Acces reserve aux GameMasters." }`.
- Zod schema: `csvText` (10..200_000 chars), `cohortSlug` (default `hack-days-mai-2026`).
- Resolves latest event by `starts_at`, then upserts cohort by `(event_id, slug)` with default name `"Hack-Days Mai 2026"`.
- Per CSV row:
  - Look up player by `slugifyTeam(teamName)`. Same slug + cohort + name -> `alreadyExisted++`. Slug taken in another cohort -> append `-{cohortSlug}`. Otherwise insert -> `created++`.
  - Leader gets `team_role='owner'`, others `'contributor'`. Profiles row created (`app_role='player'`) on first link so role-gating works at first login.
  - User resolution: try `adminClient.auth.admin.listUsers({ page:1, perPage:1000 })` then fall back to `profiles.email`. If still missing AND service role available -> `inviteUserByEmail`, else `invitesSkipped++` + error.
  - `player_members(player_id, user_id)` upsert via lookup-then-insert. Unique-constraint duplicates (Postgres 23505) treated as already-linked.
- Service-role client built on demand from `process.env.SUPABASE_SERVICE_ROLE_KEY`. Skips when key is `replace-me` or absent. Never exported.
- Returns `{ ok, message, report }`. `ok` iff `report.errors.length === 0`. Calls `revalidatePath("/admin")` and `revalidatePath("/admin/players/import")`.
- `.env.example` annotated with the service-role usage contract.

### Task 3 - Page, form, nav, i18n (commit `3acf87c`)

- `app/admin/players/import/page.tsx`: server component, `getCurrentUser()` -> redirect `/login` if absent, role gate via `pathForRole`. Wraps in `<AppShell role="game_master">`. Header help block lists the required CSV columns in `<code>`. Demo banner when env missing.
- `components/csv-import-form.tsx`: `"use client"`, `useActionState(importPlayersCsv, initial)`. File `<input type="file" accept=".csv,text/csv">` reads via `file.text()` and pushes into the textarea (single source of truth on submit). Hidden `cohortSlug` input. `useFormStatus()` drives the disabled+label state of the submit button. Renders banner + report card with 6 counters and a collapsible error list.
- `components/app-shell.tsx`: `game_master` nav now has `[ /admin, /admin/players/import ]`.
- `lib/i18n.ts`: 17 new keys (FR + EN, plain ASCII): `nav_game_master_import`, `import_title`, `import_subtitle`, `import_csv_header_help`, `import_file_label`, `import_paste_label`, `import_submit`, `import_submitting`, `import_report_title`, `import_report_created`, `import_report_existed`, `import_report_members`, `import_report_invites`, `import_report_invites_skipped`, `import_report_errors`, `import_back`, `import_demo_disabled`.

## Verification

- `npx tsx lib/admin-import.ts` -> 6 PASS, 0 fail.
- `npm run typecheck` clean.
- `npx next lint` clean (no warnings or errors).
- `npm run build` succeeds. `/admin/players/import` listed as dynamic route (`ƒ /admin/players/import`, 2.03 kB First Load 118 kB).

## Idempotency proof points

1. Player insert is keyed by `(slug, cohort_id, name)` lookup-then-insert -> same CSV second run: `created=0`, `alreadyExisted=N`.
2. `player_members(player_id, user_id)` is `unique` in `database/schema.sql` -> applicative lookup-first means `membersAdded=0` on second run; even if a race slips through, Postgres 23505 is caught and silently treated as already-linked.
3. Profiles row creation guards against duplicates (lookup first; "duplicate" substring also tolerated).
4. Cohort upsert is keyed by `(event_id, slug)` lookup-then-insert.
5. Invites are only sent when `auth.users` lookup returns no row -> already-invited users do not receive duplicate magic links.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CsvParseError type missing optional `email` field**
- **Found during:** Task 1 typecheck.
- **Issue:** `parseCsv` pushes `{ line, email, reason }` for invalid member emails, but the type only had `{ line, reason }` -> TS2353.
- **Fix:** Added optional `email?: string` to `CsvParseError`. Action consumes parse errors via `{ line, email, reason }` mapping unchanged.
- **Files modified:** `lib/admin-import.ts`.
- **Commit:** `4a19e31`.

**2. [Rule 1 - Bug] node:assert dynamic import triggers TS2775 'assertion functions need explicit type annotation'**
- **Found during:** Task 1 typecheck.
- **Issue:** `await import("node:assert")` returns a value whose type carries assertion-function signatures; under `strict: true` TypeScript requires the host const to have an explicit type annotation that preserves those signatures, which breaks across `assert` vs `assert.strict` shape.
- **Fix:** Replaced node:assert entirely with four plain throw helpers (`eq`, `deepEq`, `truthy`, `matches`) inside `runInlineTests`. Behaviour unchanged; tests still produce PASS/FAIL output.
- **Files modified:** `lib/admin-import.ts`.
- **Commit:** `4a19e31` (initial Task 1 commit; fix folded in before commit).

**3. [Rule 2 - Critical] No mechanism to look up auth.users by email in supabase-js v2**
- **Found during:** Task 2 implementation.
- **Issue:** Plan §Task 2 step 6a says "Look up auth.users by email via Admin API IF service role available", but supabase-js v2 has no direct `getUserByEmail`. Without resolution, every email would trigger an invite (duplicate magic links across re-runs == break idempotency).
- **Fix:** Use `adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })` and filter case-insensitively. Acceptable for pilot scale (< 100 emails). Documented in decisions.
- **Files modified:** `app/actions.ts`.
- **Commit:** `ce664bf`.

## Self-Check: PASSED

- `lib/admin-import.ts` FOUND.
- `components/csv-import-form.tsx` FOUND.
- `app/admin/players/import/page.tsx` FOUND.
- `app/actions.ts` modified (importPlayersCsv exported).
- `components/app-shell.tsx` modified (Import CSV nav entry).
- `lib/i18n.ts` modified (17 keys FR+EN).
- `.env.example` modified (SUPABASE_SERVICE_ROLE_KEY documented).
- Commit `4a19e31` FOUND (Task 1).
- Commit `ce664bf` FOUND (Task 2).
- Commit `3acf87c` FOUND (Task 3).
- `npx tsx lib/admin-import.ts` -> 6 PASS, 0 FAIL.
- typecheck + lint + build all green.
