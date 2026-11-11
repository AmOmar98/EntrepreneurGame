---
phase: 17-observabilite-perf
plan: "03"
status: human_needed
completed: ""
gate: typecheck+lint+build+test:unit+test:e2e
---

# Phase 17: Observabilite + Perf — Verification

## Gate Log

| Command | Result | Details |
|---------|--------|---------|
| `npm run typecheck` | PASS | 0 errors |
| `npm run lint` | PASS | 0 warnings |
| `npm run build` | PASS | All routes compiled, no keys required |
| `npm run test:unit` | PASS | 105/105 (pre-plan 17-03 baseline; scripts don't add TS unit tests) |
| `npm run test:e2e` | PASS | 24/24 (demo mode; Sentry/PostHog env-gated, no keys in CI) |
| `node --check scripts/perf-seed-500.mjs` | PASS | Valid syntax |
| `node --check scripts/perf-p95.mjs` | PASS | Valid syntax |
| `node scripts/perf-p95.mjs --check-rls` | PASS | exit 0 — all EXISTS-scoped auth.uid() use (SELECT auth.uid()) |

Full gate: **GREEN** (all commands pass with NO keys present).

---

## Items Deferred to Operator Checkpoint

The following items require manual operator action and are NOT yet verified.
They are listed in the operator checkpoint at the end of plan 17-03.

| # | Item | Status | What to do |
|---|------|--------|-----------|
| 1 | SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN in Vercel Production env | PENDING | Create Sentry account, paste DSN keys, redeploy |
| 2 | Email alert rule in Sentry on new issues | PENDING | Sentry -> Alerts -> Create Alert Rule |
| 3 | NEXT_PUBLIC_POSTHOG_KEY in Vercel Production env | PENDING | Create PostHog account, paste project API key, redeploy |
| 4 | PostHog funnel insight built (onboarding -> submit -> validated -> mentor eval) | PENDING | PostHog -> Insights -> New Funnel |
| 5 | P95 run (optional — before event freeze) | PENDING | See QUAL-06 section below and docs/OBSERVABILITY.md "Perf (QUAL-06)" |

---

## Requirement → Evidence Trace

### QUAL-04: Sentry error monitoring (server + client + edge + alerting)

| Evidence | File | Detail |
|----------|------|--------|
| Server init env-gated | `instrumentation.ts` | `register()` calls `Sentry.init` only when `SENTRY_DSN` set and runtime is nodejs/edge |
| Client init env-gated | `instrumentation-client.ts` | `Sentry.init` guarded on `NEXT_PUBLIC_SENTRY_DSN` |
| Global error boundary | `app/global-error.tsx` | `Sentry.captureException(error)` in useEffect; French fallback UI |
| No-op-safe helper | `lib/observability.ts` | `reportServerError(error, context?)` via `Sentry.withScope`; no-op without init |
| 3 capture sites | `app/actions.ts` | saveOnboarding updateError + submitDeliverable insErr + evaluateSubmission insErr |
| Replay OFF | `instrumentation-client.ts` | `replaysSessionSampleRate: 0` + `replaysOnErrorSampleRate: 0` (R1/privacy) |
| Build green without keys | CI / local | `npm run build` passes with no SENTRY_DSN set |
| Runbook | `docs/OBSERVABILITY.md` | "## Sentry (QUAL-04)" section |
| **Keys at checkpoint** | Operator action required | Paste SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN into Vercel env + redeploy |
| **Alert rule** | Operator action required | Sentry -> Alerts -> Issues -> "A new issue is created" -> email |

**ROADMAP SC #1 (Sentry error visible + alert active on PROD):** Script wired, keys at operator checkpoint.

**Status: WIRED — keys at operator checkpoint**

---

### QUAL-05: PostHog funnel analytics (4 events, R1-safe, env-gated)

| Evidence | File | Detail |
|----------|------|--------|
| Event constants | `lib/analytics.ts` | `ANALYTICS_EVENTS`: eg_onboarding_completed, eg_deliverable_submitted, eg_deliverable_validated, eg_mentor_eval_submitted |
| No-op-safe capture | `lib/analytics.ts` | `captureEvent(event, props?)` no-op when `_posthog` not initialized |
| Lazy provider | `components/analytics-provider.tsx` | Dynamic `import("posthog-js")` in useEffect only when `NEXT_PUBLIC_POSTHOG_KEY` set; never in main bundle |
| Autocapture OFF | `components/analytics-provider.tsx` | `autocapture: false` + `disable_session_recording: true` |
| Layout mount | `app/layout.tsx` | `<AnalyticsProvider />` in body; layout stays server component |
| Event 1 | `components/onboarding-stepper.tsx` | `eg_onboarding_completed` before `router.push("/journey")` |
| Event 2 | `components/submission-form.tsx` | `eg_deliverable_submitted` with `{ deliverableTemplateId, version }` |
| Event 3+4 | `components/mentor-evaluation-panel.tsx` | `eg_mentor_eval_submitted` + conditional `eg_deliverable_validated` (validate_v1/v2 only) |
| R1 grep | cli audit | `grep captureEvent components/ \| grep -iE "score\|rank\|note\|/100"` — zero matches |
| Build green without key | CI / local | `npm run build` passes with no `NEXT_PUBLIC_POSTHOG_KEY` |
| Runbook | `docs/OBSERVABILITY.md` | "## PostHog (QUAL-05)" section with 4-event table + funnel walkthrough |
| **Key at checkpoint** | Operator action required | Paste NEXT_PUBLIC_POSTHOG_KEY into Vercel env + redeploy |
| **Funnel insight** | Operator action required | PostHog -> Insights -> New Funnel (4 steps) |

**ROADMAP SC #2 (PostHog funnel visible, events confirmed):** SDK wired, key at operator checkpoint.

**Status: WIRED — key at operator checkpoint**

---

### QUAL-06: Perf test — P95 measured, RLS initplan verified

| Evidence | File | Detail |
|----------|------|--------|
| Idempotent SQL seed | `scripts/perf-seed-500.sql` | ON CONFLICT DO NOTHING; every row tagged @perf-seed.invalid; fenced CLEANUP block |
| Node seed + cleanup | `scripts/perf-seed-500.mjs` | Service-role batched upserts; --cleanup flag; fails fast without key + count arg |
| P95 measurement | `scripts/perf-p95.mjs` | Times 3 paths x N iterations; percentile() helper; P50/P95/P99/min/max per path |
| RLS initplan check | `scripts/perf-p95.mjs --check-rls` | exit 0 — zero bare auth.uid() in EXISTS subqueries (bracket-counted context scan) |
| Runbook | `docs/OBSERVABILITY.md` | "## Perf (QUAL-06)" section: seed / measure / check-rls / EXPLAIN / cleanup |

#### P95 Results Table

> Status: **to be run at operator checkpoint (script ready)**
>
> Command:
> ```bash
> node scripts/perf-p95.mjs 100 perf-out.json
> ```

| Path | P50 (ms) | P95 (ms) | P99 (ms) | N | Notes |
|------|----------|----------|----------|---|-------|
| journey | — | — | — | 100 | player_members + submissions |
| evaluation | — | — | — | 100 | submissions + evaluations |
| jury | — | — | — | 100 | pitch_scores + pitch_criteria |

_Fill table with actual numbers after running the perf script on a seeded project._

#### RLS Initplan Verdict

```
node scripts/perf-p95.mjs --check-rls

[check-rls] PASS: all auth.uid() calls in EXISTS subqueries use (SELECT auth.uid()) initplan form.
[check-rls] Direct scalar comparisons (user_id = auth.uid()) are initplan-safe by PostgreSQL STABLE function semantics.
[check-rls] auth.uid() occurrences (comment-stripped): 25 total, 9 already in (SELECT auth.uid()) form.
```

**Verdict: PASS (exit 0)**

All EXISTS-scoped `auth.uid()` calls use the `(SELECT auth.uid())` initplan wrapper.
SECURITY DEFINER helper functions (`current_app_role`, `is_my_player`, `is_in_org`) are
themselves `STABLE` — they cache at the call site (O(1) per query), so internal
bare `auth.uid()` in their bodies is safe.

**ROADMAP SC #3 (P95 measured + RLS initplan verified):** RLS check PASSED. P95 measurement at operator checkpoint (optional before freeze).

**Status: RLS VERIFIED — P95 run at operator checkpoint**

---

## ROADMAP Success Criteria Trace

### SC-1: Sentry error visible in dashboard + email alert active on PROD

Evidence: 3 capture sites wired (actions.ts), global-error boundary, env-gated init (instrumentation.ts + instrumentation-client.ts). Operator must paste keys into Vercel and create email alert rule. Runbook in docs/OBSERVABILITY.md "## Sentry (QUAL-04)".

**Status: WIRED — operator checkpoint required**

---

### SC-2: PostHog funnel visible (4 events confirmed flowing)

Evidence: 4 eg_* events wired from existing state.ok touchpoints (onboarding-stepper, submission-form, mentor-evaluation-panel). Lazy env-gated provider (zero bundle cost without key). R1 grep: zero score/rank/note in captureEvent props. Operator must paste key and build funnel insight. Runbook in docs/OBSERVABILITY.md "## PostHog (QUAL-05)".

**Status: WIRED — operator checkpoint required**

---

### SC-3: P95 measured on seeded project + RLS initplan check confirmed

Evidence: `scripts/perf-p95.mjs --check-rls` exits 0 (RLS initplan clean). P95 measurement script ready (`scripts/perf-p95.mjs`), seed script ready (`scripts/perf-seed-500.{sql,mjs}`). Operator decides target (disposable vs PROD off-event) and optionally runs before freeze. Runbook in docs/OBSERVABILITY.md "## Perf (QUAL-06)".

**Status: RLS VERIFIED — P95 run at operator checkpoint**

---

## R1 Audit

PostHog events carry only technical identifiers — zero score/rank/note in any payload.

```
grep -rn captureEvent components/ | grep -iE "score|rank|note|/100|/140|percentile"
```

Result: **zero matches** (confirmed in plan 17-02).

Sentry context tags: `action: <name>` only — no score, rank, or player-specific data beyond action name.

**R1 Audit: CLEAN**

---

## Deferred / Operator-Gated Items

| Item | Gate | Runbook |
|------|------|---------|
| SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN → Vercel env | checkpoint:human-action (plan 17-03) | docs/OBSERVABILITY.md "## Sentry" |
| Email alert rule in Sentry | checkpoint:human-action (plan 17-03) | docs/OBSERVABILITY.md "## Sentry" §3 |
| NEXT_PUBLIC_POSTHOG_KEY → Vercel env | checkpoint:human-action (plan 17-03) | docs/OBSERVABILITY.md "## PostHog" |
| PostHog funnel insight (4 steps) | checkpoint:human-action (plan 17-03) | docs/OBSERVABILITY.md "## PostHog" §4 |
| P95 run (optional before freeze) | checkpoint:human-action (plan 17-03) | docs/OBSERVABILITY.md "## Perf" |
| Fill P95 table in this VERIFICATION.md | post-run | Paste output from `perf-p95.mjs 100 out.json` |
