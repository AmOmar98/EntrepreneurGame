---
phase: 17-observabilite-perf
plan: "02"
subsystem: analytics
tags: [posthog, funnel-analytics, env-gated, qual-05, r1-cardinal]
dependency_graph:
  requires: [17-01]
  provides: [QUAL-05]
  affects: [app/layout.tsx, components/submission-form.tsx, components/onboarding-stepper.tsx, components/mentor-evaluation-panel.tsx]
tech_stack:
  added: ["posthog-js@1.386.6"]
  patterns: [env-gated SDK init, dynamic import (lazy bundle), no-op-safe helper, module-level instance ref]
key_files:
  created:
    - lib/analytics.ts
    - components/analytics-provider.tsx
  modified:
    - app/layout.tsx
    - components/submission-form.tsx
    - components/onboarding-stepper.tsx
    - components/mentor-evaluation-panel.tsx
    - .env.example
    - docs/OBSERVABILITY.md
decisions:
  - "posthog-js dynamic import inside useEffect (not top-level) — SDK never in main bundle when key absent"
  - "Module-level _posthog ref set by provider after init — captureEvent no-op until init completes"
  - "disable_session_recording:true + autocapture:false — privacy/R1; only explicit eg_* events captured"
  - "eg_deliverable_validated fires only for validate_v1/validate_v2 verdicts — stage label not score"
  - "submission-form useEffect deps updated to include deliverableTemplateId + version (correctness)"
  - "QUAL-05 satisfied: 4 funnel events wired from existing state.ok touchpoints, R1 grep clean"
metrics:
  duration: "10min"
  completed: "2026-06-12"
  tasks: 3
  files: 8
---

# Phase 17 Plan 02: PostHog Analytics (QUAL-05) Summary

**One-liner:** posthog-js wired client-only via dynamic import + env-gate — 4 funnel events (eg_onboarding_completed, eg_deliverable_submitted, eg_deliverable_validated, eg_mentor_eval_submitted) from existing state.ok touchpoints, R1 grep clean, 105 unit + 24 E2E green.

## What Was Built

- **lib/analytics.ts** — `ANALYTICS_EVENTS` constants (4 eg_* event names) + `captureEvent(event, props?)` no-op-safe helper + internal `_setPostHogInstance` wiring used by the provider. R1 comment in the file: props MUST NOT include score/rank/note.
- **components/analytics-provider.tsx** — `"use client"` component, returns null. On mount when `NEXT_PUBLIC_POSTHOG_KEY` is set: `import("posthog-js")` dynamically (lazy — zero bundle cost when key absent), calls `posthog.init(key, { capture_pageview: false, disable_session_recording: true, autocapture: false })`, wires `_setPostHogInstance`, and captures `$pageview`. On subsequent pathname changes, captures `$pageview` if posthog is loaded.
- **app/layout.tsx** — `<AnalyticsProvider />` mounted inside `<body>` alongside `<SpeedInsights />`. Layout remains a server component (no "use client" added).
- **components/onboarding-stepper.tsx** — `captureEvent(ANALYTICS_EVENTS.eg_onboarding_completed)` inserted before `router.push("/journey")` in the existing `if (state.ok)` effect.
- **components/submission-form.tsx** — `captureEvent(ANALYTICS_EVENTS.eg_deliverable_submitted, { deliverableTemplateId, version })` inserted in the existing `if (state.ok)` effect. Deps array updated to include `deliverableTemplateId` + `version`.
- **components/mentor-evaluation-panel.tsx** — `captureEvent(ANALYTICS_EVENTS.eg_mentor_eval_submitted, { submissionId, version })` + conditional `captureEvent(ANALYTICS_EVENTS.eg_deliverable_validated, { submissionId, version })` when `verdict === "validate_v1" || verdict === "validate_v2"` — both inside the existing `if (state.ok)` effect.
- **.env.example** — PostHog block documenting `NEXT_PUBLIC_POSTHOG_KEY` + optional `NEXT_PUBLIC_POSTHOG_HOST` with R1 note.
- **docs/OBSERVABILITY.md** — `## PostHog (QUAL-05)` section: account creation, Vercel env vars, table of 4 events, funnel build walkthrough in PostHog UI, privacy/R1 notes, no-key behaviour.

## Verification

- `npm run typecheck` — clean (0 errors)
- `npm run lint` — clean (0 warnings)
- `npm run build` — green with no `NEXT_PUBLIC_POSTHOG_KEY` set
- `npm run test:unit` — 105/105 passing
- `npm run test:e2e` — 24/24 passing
- R1 grep audit: `grep -rn captureEvent components/ | grep -iE "score|total|rank|note|/100|/140|percentile"` — **zero matches**

## Deviations from Plan

**1. [Rule 3 - Blocking] Removed eslint-disable comment for non-existent rule**
- **Found during:** Task 1 — `npm run build` failed with `Definition for rule 'react-hooks/exhaustive-deps' was not found`
- **Issue:** Project ESLint config does not include `react-hooks` plugin, so the disable comment itself causes a lint error
- **Fix:** Removed the `// eslint-disable-next-line react-hooks/exhaustive-deps` comment from `analytics-provider.tsx`; the deps array is correct without it
- **Files modified:** `components/analytics-provider.tsx`

**2. [Rule 2 - Correctness] submission-form useEffect deps array updated**
- **Found during:** Task 2 — added `deliverableTemplateId` and `version` to the effect that now uses them
- **Issue:** Adding `captureEvent(... { deliverableTemplateId, version })` to the effect without adding those props to the deps array would be a correctness issue (stale closure risk)
- **Fix:** Updated deps from `[state.ok, clear, router]` to `[state.ok, deliverableTemplateId, version, clear, router]`
- **Files modified:** `components/submission-form.tsx`

## Known Stubs

None — all captureEvent calls are wired to the real posthog instance (set by provider). The no-op when key is absent is intentional env-gate design.

## Threat Flags

No new threat surface beyond the plan's threat model:
- T-17-04: R1 enforced — captureEvent props carry only technical ids; grep gate confirmed zero score/rank/note matches; session recording + autocapture OFF.
- T-17-05: posthog-js@1.386.6 is the official PostHog SDK (npmjs.com/package/posthog-js, PostHog org). Legitimate, widely used.
- T-17-06: autocapture disabled — no incidental DOM/PII capture.

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install posthog-js + env-gated lazy analytics provider + helper | aa6204c | package.json, package-lock.json, lib/analytics.ts, components/analytics-provider.tsx, app/layout.tsx, .env.example |
| 2 | Fire 4 funnel events from existing state.ok touchpoints (R1-safe) | 6658e8b | components/submission-form.tsx, components/onboarding-stepper.tsx, components/mentor-evaluation-panel.tsx |
| 3 | PostHog QUAL-05 section added to OBSERVABILITY.md runbook | 288971f | docs/OBSERVABILITY.md |

## Self-Check: PASSED

- [x] lib/analytics.ts exists and exports captureEvent + ANALYTICS_EVENTS + _setPostHogInstance
- [x] components/analytics-provider.tsx exists with dynamic `import("posthog-js")` (not top-level static import)
- [x] components/analytics-provider.tsx has `disable_session_recording: true` and `autocapture: false`
- [x] app/layout.tsx imports AnalyticsProvider and mounts it in body; no "use client" directive present
- [x] .env.example contains NEXT_PUBLIC_POSTHOG_KEY
- [x] docs/OBSERVABILITY.md contains "## PostHog", NEXT_PUBLIC_POSTHOG_KEY, eg_deliverable_submitted, and "Funnel"
- [x] `grep captureEvent components/submission-form.tsx components/onboarding-stepper.tsx components/mentor-evaluation-panel.tsx` shows 4 event call sites (confirmed)
- [x] R1 grep clean: zero matches for score/total/rank/note/percentile in captureEvent calls (confirmed)
- [x] aa6204c, 6658e8b, 288971f confirmed in git log
- [x] Build green with no NEXT_PUBLIC_POSTHOG_KEY (confirmed)
- [x] 105 unit + 24 E2E green (confirmed)
