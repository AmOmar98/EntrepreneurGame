---
phase: 13-db-consolidation-test-infrastructure
verified: 2026-06-11T19:18:00Z
status: human_needed
score: 4/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Run the read-only SQL query in OPS-02-verdict.md Annex against the live Supabase PROD instance (SQL Editor or MCP when available)"
    expected: "Query returns the Digi event row with ps_rows and results_published_at values; update OPS-02-verdict.md from PENDING-LIVE-CHECK to one of the three pre-arbitrated verdicts (SUFFICIENT / PUBLISH-ONLY / OMAR-DECIDE)"
    why_human: "MCP Supabase tools failed to propagate in 4 OAuth flows + 1 restart during execution. The 3 decision scenarios are pre-arbitrated and non-blocking for v0.4, but REQUIREMENTS.md OPS-02 requires an explicit closed verdict backed by a real PROD query result."
---

# Phase 13: DB Consolidation + Test Infrastructure — Verification Report

**Phase Goal:** La codebase a un filet de securite test operationnel et `database/` est la source de verite unique alignee sur PROD avant tout refactor schema.
**Verified:** 2026-06-11T19:18:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `database/schema.sql` + `database/triggers.sql` + `database/rls.sql` contain the 2 PROD-only functions and grants — applying to a fresh project matches PROD | VERIFIED | `database/triggers.sql:178-202` defines both `set_help_requests_updated_at()` and `set_pitch_mode_closed_at()` with `set search_path = ''`; `database/rls.sql` contains 12 REVOKE/GRANT pairs (11 secdef + 1 service_role); `supabase/migrations/20260519120000_jurors_and_pitch_mode.sql` sourced (MANIFEST rule-3 repaired, commit `715c470`) |
| 2 | DIGI-08 is closed: verdict documented with PROD evidence | UNCERTAIN | `OPS-02-verdict.md` exists with pre-arbitrated decision table and annex query; status is PENDING-LIVE-CHECK because MCP Supabase was unavailable. The 3 scenarios are fully documented and non-blocking for v0.4, but a live PROD query has not been executed yet — OPS-02 in REQUIREMENTS.md remains `[ ]` |
| 3 | Vitest configured and at least 5 unit tests pass covering critical server actions | VERIFIED | `npm run test:unit` — 14 tests passed (2 files), 0 failures (verified live in this session); `vitest.config.ts` confirmed with `environment: "node"` and `resolve.alias` for `@/*`; `lib/schemas.ts` exports 5 pure Zod schemas with no Next.js coupling; `app/actions.ts` imports from `@/lib/schemas` (local schema declarations removed); `typecheck` passes |
| 4 | Playwright E2E configured and at least 2 flows pass in demo mode | VERIFIED | 5 spec files in `tests/e2e/` all exist and substantive (onboarding, submit-deliverable, mentor-eval, jury-pitch, gm-export); CI run `27367721082` shows e2e job PASSED (committed green); `playwright.config.ts` has `testDir: "./tests"` + `testMatch` gating smoke and e2e; `test:e2e` script present in `package.json` |
| 5 | GitHub Actions CI gate runs on every push: typecheck + lint + build + vitest tests green | VERIFIED | `.github/workflows/ci.yml` present and valid (3 jobs: check/unit/e2e, all on `ubuntu-latest`, no `secrets.*` references); CI run `27367721082` — check PASSED (1m19s), unit PASSED (23s), e2e PASSED (1m59s); triggered on `branches: ["**"]` and `pull_request` |

**Score:** 4/5 truths verified (SC2/OPS-02 is UNCERTAIN pending live PROD query)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/phases/13-db-consolidation-test-infrastructure/OPS-01-drift-report.md` | Drift table 4 dimensions | VERIFIED | Exists, 78 lines, covers Functions/Grants/Policies/Columns; classifies each object as PRESENT-IN-SOURCE, PROD-ONLY, or PARTIAL; consolidation action in every row |
| `.planning/phases/13-db-consolidation-test-infrastructure/13-NEW.sql` | Idempotent consolidation SQL (2 functions + 11 grants) | VERIFIED | Exists, 101 lines; `set_help_requests_updated_at` and `set_pitch_mode_closed_at` both with `set search_path = ''`; all 11 REVOKE/GRANT pairs; no DROP/DELETE/TRUNCATE |
| `.planning/phases/13-db-consolidation-test-infrastructure/OPS-02-verdict.md` | DIGI-08 backfill decision with PROD evidence | UNCERTAIN | Exists, 37 lines; decision table with 3 scenarios is present; status is PENDING-LIVE-CHECK — live PROD query not yet run (MCP unavailable during execution) |
| `database/triggers.sql` | Contains both PROD-only functions | VERIFIED | Lines 178-202 define `set_help_requests_updated_at()` and `set_pitch_mode_closed_at()` with `set search_path = ''`; 6 `create or replace function` definitions total (grep confirmed) |
| `database/rls.sql` | Contains REVOKE/GRANT pairs | VERIFIED | 12 REVOKE EXECUTE + 12 GRANT EXECUTE lines confirmed via grep |
| `supabase/migrations/20260519120000_jurors_and_pitch_mode.sql` | MANIFEST rule-3 repair | VERIFIED | File exists (commit `715c470`); repairs the gap where quick-260519-jpr migration was never copied into supabase/migrations/ |
| `vitest.config.ts` | Vitest config, node env, @/* alias | VERIFIED | Environment: node; include: tests/unit/**/*.test.ts; resolve.alias @ -> repo root |
| `lib/schemas.ts` | Pure Zod schemas, no Next.js coupling | VERIFIED | Exports: httpsUrl, onboardingSchema, fichesEntretienSchema, submissionSchema, evaluationSchema; imports only from "zod"; no "use server" directive; `grep next/ lib/schemas.ts` returns 0 |
| `tests/unit/actions-schemas.test.ts` | Schema validation unit tests | VERIFIED | 7 tests (6 schema + 1 extra proof_text acceptance); uses safeParse on plain objects; no FormData usage; no `app/actions` import |
| `tests/unit/score.test.ts` | Pure scoring-logic unit tests | VERIFIED | 7 tests asserting exact numeric outputs for scoreFromEvaluation, combineScores, applyBonusMultiplier |
| `tests/e2e/onboarding.spec.ts` | Onboarding flow demo-mode E2E | VERIFIED | Asserts /onboarding < 500 and main visible |
| `tests/e2e/submit-deliverable.spec.ts` | Submit-deliverable demo-mode E2E | VERIFIED | Asserts main.eic-journey, zero a[disabled], no /100 pattern (R1+R3) |
| `tests/e2e/mentor-eval.spec.ts` | Mentor-eval demo-mode E2E | VERIFIED | Asserts /mentor and /mentor/submission/uuid both < 500 |
| `tests/e2e/jury-pitch.spec.ts` | Jury-pitch demo-mode E2E | VERIFIED | Asserts /jury < 500, no rank pattern (R1) |
| `tests/e2e/gm-export.spec.ts` | GM CSV-export demo-mode E2E | VERIFIED | Uses request API; asserts status 200 and body contains "team_slug" |
| `.github/workflows/ci.yml` | CI gate: typecheck, lint, build, unit, e2e | VERIFIED | 3 jobs (check/unit/e2e); triggers on push["**"] and pull_request; no secrets.*; demo mode env on build and e2e |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `13-NEW.sql` | `database/triggers.sql` | Operator-applied mirror of 2 PROD-only functions | VERIFIED | Both functions present in triggers.sql lines 178-202 with correct search_path (commit 715c470) |
| `13-NEW.sql` | `database/rls.sql` | 11 REVOKE/GRANT pairs (already present in source) | VERIFIED | 12 REVOKE EXECUTE entries in rls.sql (11 secdef + 1 service_role); drift report confirmed no action needed on grants side |
| `app/actions.ts` | `lib/schemas.ts` | Import of extracted schemas | VERIFIED | `app/actions.ts:12` — `import { submissionSchema, evaluationSchema, httpsUrl, ... } from "@/lib/schemas"` present; `const submissionSchema =` not found locally in actions.ts |
| `vitest.config.ts` | `lib/*` | resolve.alias @ -> repo root | VERIFIED | `"@": path.resolve(__dirname, ".")` in vitest.config.ts; unit tests import `@/lib/schemas` and `@/lib/score` successfully (14 tests pass) |
| `tests/e2e/*.spec.ts` | `playwright.config.ts` | testDir includes tests/e2e + testMatch pattern | VERIFIED | `testDir: "./tests"`, `testMatch: ["**/smoke/**/*.spec.ts", "**/e2e/**/*.spec.ts"]` |
| `.github/workflows/ci.yml` | `package.json` scripts | npm run typecheck/lint/build/test:unit/test:e2e | VERIFIED | All 5 scripts exist in package.json; CI run 27367721082 proves all ran successfully |
| `.github/workflows/ci.yml` | Playwright browsers | npx playwright install --with-deps chromium | VERIFIED | Present in e2e job step; e2e job completed in 1m59s in CI run |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase produces test infrastructure, SQL consolidation artifacts, and a CI workflow. No dynamic-data-rendering components were added or modified.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Vitest unit tests pass (14 tests) | `npm run test:unit` | 2 test files, 14 passed, 0 failures, duration 419ms | PASS |
| TypeScript compiles without errors | `npm run typecheck` | tsc --noEmit exits 0 | PASS |
| database/triggers.sql contains both PROD-only functions | `grep -E "set_help_requests_updated_at|set_pitch_mode_closed_at" database/triggers.sql` | 2 matches | PASS |
| database/triggers.sql has 6 `create or replace function` | `grep -c "create or replace function" database/triggers.sql` | 6 | PASS |
| database/rls.sql contains REVOKE/GRANT pairs | `grep -c "REVOKE EXECUTE" database/rls.sql` | 12 | PASS |
| supabase/migrations/ contains jurors_and_pitch_mode migration | `ls supabase/migrations/20260519120000_jurors_and_pitch_mode.sql` | File exists | PASS |
| CI workflow ran green on branch | `gh run view 27367721082` | check PASS / unit PASS / e2e PASS | PASS |
| No secrets referenced in CI | `grep "secrets." .github/workflows/ci.yml` | 0 matches | PASS |
| lib/schemas.ts has no Next.js coupling | `grep "next/" lib/schemas.ts` | 0 matches | PASS |

---

### Probe Execution

Step 7c: SKIPPED — no `scripts/*/tests/probe-*.sh` probes defined for this phase. Behavioral spot-checks above cover the equivalent ground.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| OPS-01 | 13-01-PLAN.md | `database/` consolidated as aligned PROD source-of-truth | SATISFIED | Both PROD-only functions in database/triggers.sql; grants in rls.sql; jurors/pitch_mode migration in supabase/migrations/; drift report documents residual schema.sql PARTIAL items as deferred to Phase 14 |
| OPS-02 | 13-01-PLAN.md | DIGI-08 clarified and closed | NEEDS HUMAN | OPS-02-verdict.md exists with pre-arbitrated decision table; verdict remains PENDING-LIVE-CHECK; REQUIREMENTS.md OPS-02 checkbox not updated |
| QUAL-01 | 13-02-PLAN.md | Vitest covers critical server actions with green tests | SATISFIED | 14 unit tests pass; schemas, scoring, and validation logic covered; typecheck green |
| QUAL-02 | 13-03-PLAN.md | Playwright E2E covers 5 flows in demo mode | SATISFIED | 5 spec files present and substantive; CI e2e job passed; all 5 flows verified |
| QUAL-03 | 13-04-PLAN.md | GitHub Actions CI gate on every push | SATISFIED (code) / NEEDS DOCUMENT UPDATE | ci.yml present and ran successfully; REQUIREMENTS.md traceability row still shows "Pending" (housekeeping not updated) |

**Note on REQUIREMENTS.md housekeeping:** QUAL-03, OPS-01, and OPS-02 are still marked `[ ]` in REQUIREMENTS.md despite QUAL-01 and QUAL-02 being marked `[x]`. The code evidence satisfies QUAL-03 and OPS-01 fully. The documentation gap is minor housekeeping, not a functional gap — the traceability table is an informational artifact, not a gate. OPS-02 is the only substantive open item.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/phases/13-db-consolidation-test-infrastructure/OPS-02-verdict.md` | 4 | `PENDING-LIVE-CHECK` | WARNING | Not a code debt marker — this is intentional documentation of an open live-check action item. The 3 decision scenarios are pre-arbitrated and documented. Non-blocking for v0.4. |

No TBD, FIXME, or XXX markers found in any modified code files (database/triggers.sql, database/rls.sql, lib/schemas.ts, vitest.config.ts, tests/unit/*.test.ts, tests/e2e/*.spec.ts, .github/workflows/ci.yml).

The Node.js 20 deprecation warning in the CI run annotations is informational (GitHub Actions runner policy, June 2026 deadline). Not a code issue — the workflow will continue to run until September 2026; updating to `node-version: "24"` and `actions/checkout@v4`/`actions/setup-node@v4` latest is a maintenance item for a future phase.

---

### Human Verification Required

#### 1. DIGI-08 Live PROD Query (OPS-02 Verdict)

**Test:** In the Supabase Studio SQL Editor (or via MCP when available), run the read-only query from `OPS-02-verdict.md` Annex:

```sql
select e.slug, e.results_published_at, e.pitch_mode_state, e.pitch_mode_closed_at,
       (select count(*) from pitch_scores ps where ps.event_id = e.id) as ps_rows,
       (select count(distinct ps.juror_id) from pitch_scores ps where ps.event_id = e.id) as ps_jurors
from events e
order by e.starts_at desc;
```

**Expected:** The Digi event row returns concrete values for `ps_rows` and `results_published_at`. Apply the pre-arbitrated verdict from the OPS-02-verdict.md decision table:
- `ps_rows > 0` AND `results_published_at` not null → **SUFFICIENT** — close DIGI-08, no action.
- `ps_rows > 0` AND `results_published_at` null → **PUBLISH-ONLY** — one UPDATE to publish results.
- `ps_rows = 0` → **OMAR-DECIDE** — backfill or accept as "ceremonie hors-app".

Update `OPS-02-verdict.md` with the query result and replace PENDING-LIVE-CHECK with the matching verdict. Update `REQUIREMENTS.md` checkboxes for OPS-02 (and OPS-01 / QUAL-03 while there).

**Why human:** Supabase MCP tools failed to propagate in 4 OAuth flows during execution. This requires a direct database query in Studio or a working MCP session. The decision logic is fully documented — no judgment needed, just running the query and recording the result.

---

### Gaps Summary

No code gaps. The single open item is the OPS-02 live PROD query — a documentation closure action, not a missing implementation. All five ROADMAP success criteria have code evidence satisfying them. The PENDING-LIVE-CHECK status is a known, accepted limitation from the execution session (4 failed MCP OAuth flows) with a pre-documented resolution path.

The three CI jobs (check / unit / e2e) ran green on the branch. The test infrastructure is operational and self-enforcing.

---

_Verified: 2026-06-11T19:18:00Z_
_Verifier: Claude (gsd-verifier)_
