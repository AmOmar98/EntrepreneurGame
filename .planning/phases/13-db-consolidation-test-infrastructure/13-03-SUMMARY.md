---
phase: 13
plan: 03
subsystem: test-infrastructure
tags: [playwright, e2e, demo-mode, quality, r1, r3, csv-export]
dependency_graph:
  requires: [13-02]
  provides: [QUAL-02]
  affects: [playwright.config.ts, package.json, tests/e2e]
tech_stack:
  added: []
  patterns: [demo-mode-e2e, playwright-request-api, structural-assertions]
key_files:
  created:
    - tests/e2e/onboarding.spec.ts
    - tests/e2e/submit-deliverable.spec.ts
    - tests/e2e/mentor-eval.spec.ts
    - tests/e2e/jury-pitch.spec.ts
    - tests/e2e/gm-export.spec.ts
  modified:
    - playwright.config.ts
    - package.json
decisions:
  - testMatch pattern added to playwright.config.ts to exclude tests/unit from Playwright discovery (Vitest imports cause Playwright to crash when it tries to load them)
  - gm-export.spec.ts uses Playwright request API instead of page.goto because csvResponse sets Content-Disposition attachment which triggers browser download interception and throws
  - testDir widened to ./tests (from ./tests/smoke) — testMatch gates what Playwright actually runs
metrics:
  duration: 10min
  completed: 2026-06-11
  tasks_completed: 2
  files_changed: 7
---

# Phase 13 Plan 03: Playwright E2E Safety Net Summary

**One-liner:** 5 demo-mode E2E specs covering onboarding, submit-deliverable (R1+R3), mentor-eval, jury-pitch (R1), and GM CSV export; all 15 tests pass (9 e2e + 6 smoke) with no Supabase secrets.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Extend playwright.config.ts testDir + add test:e2e script | df6fcf7 |
| 2 | Write 5 E2E flow specs + fix testMatch to exclude unit tests | 9e43fae |

## What Was Built

### playwright.config.ts
- `testDir` changed from `"./tests/smoke"` to `"./tests"`
- `testMatch: ["**/smoke/**/*.spec.ts", "**/e2e/**/*.spec.ts"]` added to gate discovery — excludes `tests/unit/*.test.ts` which import Vitest and crash under Playwright
- Demo-mode `webServer` env block unchanged: `NEXT_PUBLIC_SUPABASE_URL: ""` + `NEXT_PUBLIC_SUPABASE_ANON_KEY: ""`

### package.json
- `"test:e2e": "playwright test"` script added alongside existing `"smoke"` alias

### tests/e2e/onboarding.spec.ts
- Asserts `/onboarding` responds < 500 and `<main>` is visible
- Demo mode: static disabled message rendered (no form, no redirect)

### tests/e2e/submit-deliverable.spec.ts
- Asserts `main.eic-journey` visible on `/journey`
- R3: zero `a[disabled]` anchors on journey index
- R1: body does not match `\d{1,3}/100` score pattern on `/journey`
- Asserts `/journey/deliverable/<demo-uuid>` responds < 500

### tests/e2e/mentor-eval.spec.ts
- Asserts `/mentor` responds < 500 (200 with empty state in demo mode)
- Asserts `/mentor/submission/00000000-0000-0000-0000-000000000001` responds < 500

### tests/e2e/jury-pitch.spec.ts
- Asserts `/jury` responds < 500 (302 redirect to /login allowed — getCurrentUser() returns null in demo mode)
- R1: body does not match `rang #N` or `leaderboard` patterns

### tests/e2e/gm-export.spec.ts
- Uses Playwright `request` API (not `page.goto`) to avoid download interception error
- Asserts `/admin/export/players.csv` returns exactly 200
- Asserts response body contains CSV header token `team_slug`

## Verification Results

- `npm run typecheck`: PASS (tsc --noEmit, 0 errors)
- `npm run test:e2e`: PASS — 15 tests (9 e2e + 6 smoke), 0 failures, 51.8s
  - 5 new e2e spec files: all pass
  - 3 existing smoke spec files: all pass (6 tests unchanged)
- Demo mode confirmed: dev server started with empty Supabase env sentinels

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] page.goto throws for Content-Disposition: attachment responses**
- **Found during:** Task 2 (first gm-export test run)
- **Issue:** Playwright's browser navigation throws "Download is starting" when server returns `Content-Disposition: attachment` (the csvResponse helper sets this). `page.goto` is incompatible with file downloads.
- **Fix:** Changed `gm-export.spec.ts` to use Playwright's `request` fixture (direct HTTP without browser download interception) — `const response = await request.get("/admin/export/players.csv")`
- **Files modified:** tests/e2e/gm-export.spec.ts
- **Commit:** 9e43fae

**2. [Rule 3 - Blocking] Playwright picks up Vitest unit test files under tests/unit/**
- **Found during:** Task 2 (first playwright test run after widening testDir)
- **Issue:** Widening `testDir` to `"./tests"` caused Playwright to try loading `tests/unit/*.test.ts` files. Vitest imports throw `"Vitest cannot be imported in a CommonJS module using require()"` under Playwright's CommonJS resolver.
- **Fix:** Added `testMatch: ["**/smoke/**/*.spec.ts", "**/e2e/**/*.spec.ts"]` to playwright.config.ts. This constrains Playwright discovery to spec files under smoke/ and e2e/ only, while testDir remains `"./tests"`.
- **Files modified:** playwright.config.ts
- **Commit:** 9e43fae (included in Task 2 commit)

## Known Stubs

None — this plan creates test infrastructure only; no UI/data rendering stubs.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes. Tests are read-only assertions against the existing app in demo mode.

## Self-Check: PASSED

Files exist:
- tests/e2e/onboarding.spec.ts: FOUND
- tests/e2e/submit-deliverable.spec.ts: FOUND
- tests/e2e/mentor-eval.spec.ts: FOUND
- tests/e2e/jury-pitch.spec.ts: FOUND
- tests/e2e/gm-export.spec.ts: FOUND

Commits exist:
- df6fcf7: FOUND (feat(13-03): widen testDir to tests/ + add test:e2e script)
- 9e43fae: FOUND (test(13-03): add 5 demo-mode E2E flow specs + fix playwright testMatch)
