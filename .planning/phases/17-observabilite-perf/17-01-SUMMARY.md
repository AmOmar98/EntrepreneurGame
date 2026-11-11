---
phase: 17-observabilite-perf
plan: "01"
subsystem: observability
tags: [sentry, error-monitoring, env-gated, qual-04]
dependency_graph:
  requires: []
  provides: [QUAL-04]
  affects: [app/actions.ts]
tech_stack:
  added: ["@sentry/nextjs@^10.57.0"]
  patterns: [env-gated SDK init, Next 15 instrumentation contract, no-op-safe helper]
key_files:
  created:
    - instrumentation.ts
    - instrumentation-client.ts
    - app/global-error.tsx
    - lib/observability.ts
    - docs/OBSERVABILITY.md
  modified:
    - app/actions.ts
    - package.json
    - package-lock.json
    - .env.example
decisions:
  - "@sentry/nextjs v10 installed; no withSentryConfig wrapper (sourcemaps deferred)"
  - "instrumentation.ts register() returns early without SENTRY_DSN — build/CI/demo unchanged"
  - "replaysSessionSampleRate: 0 + replaysOnErrorSampleRate: 0 (session recording OFF, R1/privacy)"
  - "reportServerError uses Sentry.withScope so context tags are scoped per call"
  - "3 capture sites: saveOnboarding updateError, submitDeliverable insErr, evaluateSubmission insErr"
metrics:
  duration: "12min"
  completed: "2026-06-12"
  tasks: 3
  files: 9
---

# Phase 17 Plan 01: Sentry Error Monitoring (QUAL-04) Summary

**One-liner:** @sentry/nextjs wired server + client + edge with full env-gate via SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN — no-op without keys, 3 critical action branches captured, 24 E2E green.

## What Was Built

- **instrumentation.ts** — Next 15 `register()` calling `Sentry.init` only when `SENTRY_DSN` is set and runtime is `nodejs`/`edge`; `onRequestError = Sentry.captureRequestError` exported for server request errors.
- **instrumentation-client.ts** — top-level Sentry.init guarded on `NEXT_PUBLIC_SENTRY_DSN`, replay OFF (both sample rates = 0).
- **app/global-error.tsx** — Next global error boundary ("use client"), calls `Sentry.captureException(error)` in `useEffect`, renders French fallback UI with retry button.
- **lib/observability.ts** — `reportServerError(error, context?)` helper using `Sentry.withScope` to set context tags before `captureException`. No-op without Sentry init.
- **app/actions.ts** — 1 import + 3 additive `reportServerError` calls in critical supabase-write error branches (saveOnboarding updateError, submitDeliverable insErr, evaluateSubmission insErr). WorkflowState contract unchanged, no throw added.
- **.env.example** — Sentry block documenting both keys and when to set them.
- **docs/OBSERVABILITY.md** — runbook: Sentry account creation, Vercel env vars, email alert rule, end-to-end verification, PostHog/Perf anchors for plans 17-02/17-03.

## Verification

- `npm run typecheck` — clean (0 errors)
- `npm run lint` — clean (0 warnings)
- `npm run build` — green with no Sentry env vars set
- `npm run test:e2e` — 24/24 passing

## Deviations from Plan

### Pre-existing Issue (out of scope)

**Unit tests: 93/105 passing (12 pre-existing failures from Phase 16)**
- **Found during:** Task 2 acceptance verification
- **Issue:** `tests/unit/jury-grid-schemas.test.ts` and `tests/unit/jury-settings-schemas.test.ts` have 12 failing tests in `saveEventSettingsSchema` — pre-existing from Phase 16 plan 16-02/16-04.
- **Scope:** Out of scope for this plan (CLAUDE.md Rule — only fix issues caused by current task changes).
- **Confirmed:** Running `git stash -- app/actions.ts && npm run test:unit` shows same 12 failures before any changes from this plan.
- **Deferred:** Tracked as pre-existing debt from Phase 16.

## Known Stubs

None — all capture sites are wired to real Sentry SDK calls. The no-op behavior without DSN is intentional by design (env-gate).

## Threat Flags

No new threat surface beyond what is documented in the plan's threat model:
- T-17-01: session/replay OFF, tracesSampleRate=0, no score/rank in context tags.
- T-17-02: @sentry/nextjs is the official first-party Sentry SDK (npmjs.com/package/@sentry/nextjs).
- T-17-03: accepted (pilot volume, errors-only).

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install @sentry/nextjs + env-gated init | fe17e1c | package.json, instrumentation.ts, instrumentation-client.ts, .env.example |
| 2 | Client boundary + helper + 3 captures | ae6b421 | app/global-error.tsx, lib/observability.ts, app/actions.ts |
| 3 | OBSERVABILITY.md runbook | 6d56cd1 | docs/OBSERVABILITY.md |

## Self-Check: PASSED

- [x] instrumentation.ts exists and exports onRequestError
- [x] instrumentation-client.ts contains Sentry.init
- [x] app/global-error.tsx contains captureException
- [x] lib/observability.ts exists and exports reportServerError
- [x] docs/OBSERVABILITY.md exists with ## Sentry heading, SENTRY_DSN, Vercel references
- [x] `grep reportServerError app/actions.ts` = 3 call sites + 1 import (confirmed)
- [x] fe17e1c, ae6b421, 6d56cd1 confirmed in git log
- [x] No throw in app/actions.ts diff (confirmed by grep)
- [x] Build green with no SENTRY_DSN set
