# Repository audit — 2026-09-29

## Scope and baseline

Audited branch: `milestone/v0.4-scale-foundation`; HEAD: `937468f` (latest recorded work: Phase 17 performance toolkit). This was local source/documentation inspection and local test execution. Production, external dashboards and the live database were not inspected or modified.

Existing modifications to `CLAUDE.md`, `.planning/config.json` and `.claude/agents/pilot-health-watcher.md`, plus untracked event/planning artifacts, were present before this work and are preserved. Credentials and participant documents were not opened for this audit.

## Verification

| Check | Result | Limits |
|---|---|---|
| `npm run typecheck` | PASS | Existing local dependencies; Node 24.14.0 / npm 11.9.0 |
| `npm run lint` | PASS | Current lint configuration excludes `.cjs` files |
| `npm run test:unit` | PASS — 8 files, 105 tests | Initial sandbox worker startup failed with `EPERM`; rerun outside that restriction passed |
| `npm run build` | PASS — 22 static pages generated | Supabase/service-role/Sentry/PostHog variables overridden empty; initial sandbox worker startup failed, unrestricted local rerun passed. Non-fatal webpack cache-size warnings |
| `npm run test:e2e` | PASS — 24 tests, 3.8 minutes | Fresh local demo server, `CI=true`, backend/telemetry keys empty; Chromium only |
| `./scripts/check-r2-severity.ps1` | FAIL — comment false positive | Matches `severity:'error'` in a comment at `lib/schemas.ts:101`; actual schema uses `z.literal("warn")`. Not evidence of a blocking validator |
| Live database, authenticated integration, concurrency, production monitoring | NOT RUN | No production-readiness conclusion can be drawn from local demo checks |

Dependencies were already installed; no upgrade or clean dependency-install test was performed. CI uses Node 20, so this local result does not substitute for a fresh CI run.

## Findings and proposed follow-up

### F1 — Database setup is not reproducible from the documented sequence

**Confirmed by static inspection; no SQL was executed.** `database/triggers.sql:12` and `:156` open function bodies with `as $` but close with `$$;`. `database/rls.sql:324` and `:330` reference `help_requests` and `jurors`, which are absent from `database/schema.sql` and appear in later migrations. The manifest applies RLS before those migrations. The initial CLI schema migration is a history stub rather than a full initial schema.

`database/README.md` includes a destructive reset and prohibits the demo seed in production; `database/MANIFEST.md` still lists that seed as optional. New migrations do have an agreed home: `supabase/migrations/`. Repair and verify the setup sequence on disposable data, then replace conflicting instructions. **Roadmap: DB-01.**

### F2 — Test coverage is narrower than its workflow names suggest

CI already runs lint, typecheck, build, unit and browser jobs (`.github/workflows/ci.yml`). However, `tests/e2e/admin-engine.spec.ts`, `mentor-eval.spec.ts`, `jury-pitch.spec.ts` and `submit-deliverable.spec.ts` largely assert demo rendering, redirects or non-5xx status. They do not establish persisted submission/review/jury behavior or tenant isolation.

SQL checks exist under `tests/rls/` and `scripts/` but are not authenticated integration gates in CI. `playwright.config.ts:39` permits reusing a local server; CI has no browser-artifact upload step. Add isolated authenticated fixtures and negative permission cases. **Roadmap: QA-01, DX-01.**

### F3 — Drafts have a concrete ownership/restoration risk

`components/submission-form.tsx:42` uses `eg_draft_${deliverableTemplateId}` without account/player or submission version. This permits draft collisions when participants use the same browser for the same deliverable, and between V1/V2. `hooks/use-auto-save.ts:49-59` restores DOM values, while proof type is React state and its textarea is conditional (`components/submission-form.tsx:31,74-116`). The hook saves on an interval and clears the interval on unmount without a final flush.

The collision mechanism is present in source; browser reproduction and final UX semantics remain to verify. Scope drafts to their owner/context, restore through form state, and cover reload/account-switch/navigation scenarios. **Roadmap: UX-01.**

### F4 — Demo behavior and old documentation disagree

`lib/auth.ts:5-7` returns no user when no Supabase client exists. Protected admin/mentor/results pages can redirect before reaching their demo branches. `app/journey/page.tsx:44-47` explicitly documents an empty data fallback. README/CLAUDE previously described a fully navigable seeded application; that is not the current contract.

Current onboarding docs now state the limitation. A future task should choose and test a consistent demo contract without weakening production authentication. **Roadmap: DX-01.**

### F5 — Event operations need stronger completeness and failure guarantees

`activateEventFlow` (`app/actions.ts:2652`) deactivates events and activates the target in separate updates. A failure after the first update can leave no active event. `cloneEventFlow` (`:2766`) writes events, missions and templates in multiple calls; cleanup exists for a dependency-remap error, but earlier failures return after partial creation. The function does not copy `event_settings` or `pitch_criteria`, despite configurable scoring/jury being part of the program model.

Verify expected clone scope, then implement atomic or explicitly recoverable operations, retry behavior and tests. **Roadmap: DATA-01, EVT-01.**

Also inspect `evaluateSubmission` (`app/actions.ts:594-648`): it rejects an existing evaluation, inserts a new one, then separately updates submission status. If the second request fails, retries can report an already-existing evaluation. Verify the applied SQL triggers before selecting the fix; use failure-injection coverage for both the stored state and the user-visible result.

### F6 — Historical completion does not establish deployed readiness

`.planning/ROADMAP.md` marks Phases 13–17 complete and Phase 18 unstarted. Phase 17's [verification](../.planning/phases/17-observabilite-perf/17-VERIFICATION.md) explicitly leaves Sentry configuration/alerts, PostHog configuration/funnel and P95 measurements pending. The [OPS-02 verdict](../.planning/phases/13-db-consolidation-test-infrastructure/OPS-02-verdict.md) awaits a live Digi archive check. Later summaries and migration comments disagree on applied/deployed status; neither proves today's state.

The June state file had contradictory progress counts and a past July deadline. The orientation note added by this task directs readers to dated evidence rather than silently marking live work complete. **Roadmap: REL-01, OPS-01.**

### F7 — Performance tooling does not demonstrate concurrent capacity

`scripts/perf-p95.mjs:107-114` awaits queries in a loop. It is useful for repeated-query timing, not a concurrent 500-session event test. The Phase 17 P95 table is empty. A static `auth.uid()` scan is not query-plan or runtime-policy proof. Define an actual workload, measure latency/error rates and write contention, and retain results. **Roadmap: PERF-01.**

### F8 — Maintenance and organization boundaries need incremental work

`app/actions.ts` contains 3,716 lines; `app/globals.css` 8,986. Domain reads are better separated in `lib/`, but event selection/authorization patterns still recur. `lib/levels.ts` reads a global `levels_v2` table and falls back to defaults on query error; it should not be presented as proven organization-specific program configuration.

There is no repository Node runtime pin, and CI/local runtimes differ. Historical `.planning/codebase/` maps and generated CLAUDE sections mention retired routes and no test runner. Corrected entry-point documentation is delivered here; deeper refactors and tenant ownership decisions remain. **Roadmap: ARCH-01, DX-01, TEN-01.**

Two additional configuration boundaries need explicit work: the journey hero still displays a fixed `xp: 100` (`app/journey/page.tsx:115`) while earned XP uses event settings, and event-specific guide/branding content remains embedded in the UI. Player lookup also selects the first membership (`lib/journey.ts:183-188`), while staff readers commonly select an active event. Test a participant across two EIC events before claiming multi-event continuity. **Roadmap: EVT-01, QA-01.**

### F9 — Operator scripts require explicit scope

`database/_reset_pre_event.sql:34-40` deletes all pitch scores, evaluations and submissions without event predicates. Historical names/comments do not make it safe for a multi-event database. Provisioning and performance seeds can write data; they were not run. `ops/compose.app.yml` references a build target while the repository has no Dockerfile, so it is not a verified alternative deployment path.

Inventory operator tools and clarify target/backup/recovery checks as part of the current release runbook. **Roadmap: OPS-01.**

## Decisions and limits

- Confirmed: improve all three areas; EIC is the first production audience, other organizations follow.
- Follow-up recorded 2026-09-30: Omar identified the Idea'Wave initiation workshop as the launch occasion; the supplied provisional programme calendar gives **3 November 2026**. See the [roadmap calendar](PRODUCTION_ROADMAP.md#ideawave-launch-calendar). Workshop time, capacity target, operator ownership and infrastructure budget remain open.
- No application, SQL, dependency or deployment changes were made in this organization task. Findings are queued with acceptance criteria in the [production roadmap](PRODUCTION_ROADMAP.md).
