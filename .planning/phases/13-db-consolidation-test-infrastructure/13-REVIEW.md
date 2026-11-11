---
phase: 13-db-consolidation-test-infrastructure
reviewed: 2026-06-11T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - lib/schemas.ts
  - app/actions.ts
  - vitest.config.ts
  - tests/unit/actions-schemas.test.ts
  - tests/unit/score.test.ts
  - playwright.config.ts
  - tests/e2e/onboarding.spec.ts
  - tests/e2e/submit-deliverable.spec.ts
  - tests/e2e/mentor-eval.spec.ts
  - tests/e2e/jury-pitch.spec.ts
  - tests/e2e/gm-export.spec.ts
  - package.json
  - .github/workflows/ci.yml
  - database/triggers.sql
  - supabase/migrations/20260519120000_jurors_and_pitch_mode.sql
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-06-11
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found (0 critical, 3 warnings, 3 info)

## Summary

Phase 13 delivered three components: (1) extraction of 5 Zod schemas from `app/actions.ts` into `lib/schemas.ts`, (2) Vitest unit tests and Playwright E2E specs in demo mode, and (3) sourcing of 2 PROD-only trigger functions into `database/triggers.sql` plus copying the jurors/pitch_mode migration into `supabase/migrations/`.

**Schema extraction is behavior-preserving.** All schema bodies (`httpsUrl`, `onboardingSchema`, `fichesEntretienSchema`, `submissionSchema`, `evaluationSchema`) were diffed against the pre-phase commit (`eda4f6d~1:app/actions.ts`) — messages, bounds, and `superRefine` logic are byte-for-byte identical. No regression introduced.

**Cardinal rules R1/R2/R3 and dual-mode demo guard are untouched.** The `submit-deliverable.spec.ts` and `jury-pitch.spec.ts` E2E specs actively assert R1/R3. Onboarding page demo-mode guard verified at `app/onboarding/page.tsx:33-40`.

**SQL additions are correct.** The two new trigger functions in `triggers.sql` (`set_help_requests_updated_at`, `set_pitch_mode_closed_at`) use `set search_path = ''` and `$$` quoting consistently. The migration copy in `supabase/migrations/` is byte-for-byte identical to the planning source.

Findings are quality and defensive-coding issues; none are correctness blockers.

---

## Warnings

### WR-01: CI `unit` job missing demo-mode env guard

**File:** `.github/workflows/ci.yml:28-38`

**Issue:** The file's top comment states "All jobs run in demo mode: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are explicitly set to empty strings." The `check` and `e2e` jobs correctly set those vars. The `unit` job does not set them. Current unit tests import only `lib/schemas.ts` and `lib/score.ts`, which have no Supabase dependencies, so no test fails today. However, any future unit test that imports from `app/actions.ts` (or any module that transitively calls `hasSupabaseEnv()`) will run against the ambient environment without the demo-mode sentinel, potentially attempting a live Supabase connection if the runner has stray env vars, or producing a misleading test result.

**Fix:** Add the env block to the `unit` job:
```yaml
  unit:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run test:unit
        env:
          NEXT_PUBLIC_SUPABASE_URL: ""
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ""
```

---

### WR-02: `triggers.sql` bootstrap gap — trigger functions defined without CREATE TRIGGER

**File:** `database/triggers.sql:170-203`

**Issue:** `set_help_requests_updated_at()` and `set_pitch_mode_closed_at()` are now defined in `triggers.sql`, but their `CREATE TRIGGER` statements (`trg_help_requests_updated_at` and `trg_set_pitch_mode_closed_at`) live exclusively in their respective migration files. The block comment at line 175 documents this intentionally ("NB: their CREATE TRIGGER statements live in the migrations above").

On a fresh-DB bootstrap that applies `schema.sql → triggers.sql → rls.sql` (the documented apply order in CLAUDE.md), these two functions are created but never attached to triggers. Any DBA bootstrapping a new environment from the canonical source files will have silent trigger gaps — `help_requests.updated_at` will not auto-update and `events.pitch_mode_closed_at` will not auto-populate. This is a PROD-only situation today (existing PROD has the triggers from the migrations), but the bootstrap artifact is misleading.

**Fix:** Add the two `CREATE TRIGGER` statements after the function bodies in `triggers.sql`, guarded by the same table-existence dependency note already present:
```sql
-- NB: these triggers depend on tables created by migrations (not schema.sql).
-- Safe to include idempotently for fresh-DB bootstrap completeness.
create trigger trg_help_requests_updated_at
  before update on public.help_requests
  for each row execute function public.set_help_requests_updated_at();

create trigger trg_set_pitch_mode_closed_at
  before update of pitch_mode_state on public.events
  for each row execute function public.set_pitch_mode_closed_at();
```

---

### WR-03: `score.test.ts` does not cover `rest_of_event` multiplier scope branch

**File:** `tests/unit/score.test.ts:55-109`

**Issue:** `applyBonusMultiplier` in `lib/score.ts` contains a distinct exclusion branch for `multiplierScope === "rest_of_event"` that filters out bonuses when `submission.submittedAt > eventEndsAt` (score.ts lines ~207-212). The unit tests cover `rawScore <= 0`, empty `bonusEvents`, and a `next_deliverable`-scoped bonus — but not `rest_of_event`. If that branch regresses (e.g., during a refactor that renames `multiplierScope` values), no test catches it.

**Fix:** Add two tests covering the `rest_of_event` scope:
```ts
it("does not apply rest_of_event bonus when submission is after eventEndsAt", () => {
  const bonusEvent: BonusEvent = {
    ...bonusEvent,  // reuse fixture
    multiplierScope: "rest_of_event",
    multiplierFactor: 2.0,
  };
  const result = applyBonusMultiplier({
    rawScore: 50,
    bonusEvents: [bonusEvent],
    submission: { submittedAt: "2026-05-21T10:00:00Z", playerId: "player-1" },
    eventEndsAt: "2026-05-20T23:59:00Z", // before submission
  });
  expect(result.boostedScore).toBe(50);
  expect(result.applied).toBeNull();
});

it("applies rest_of_event bonus when submission is within event window", () => {
  const bonusEvent: BonusEvent = { ...bonusEvent, multiplierScope: "rest_of_event", multiplierFactor: 1.5 };
  const result = applyBonusMultiplier({
    rawScore: 100,
    bonusEvents: [bonusEvent],
    submission: { submittedAt: "2026-05-19T20:00:00Z", playerId: "player-1" },
    eventEndsAt: "2026-05-20T23:59:00Z",
  });
  expect(result.boostedScore).toBe(150);
  expect(result.applied).toBe("bonus-1");
});
```

---

## Info

### IN-01: `evaluationSchema` feedback field uses `z.string().min(0)` — redundant constraint

**File:** `lib/schemas.ts:82`

**Issue:** `feedback: z.string().min(0)` — `.min(0)` is the default for `z.string()` and adds no constraint. This is noise copied from the original `app/actions.ts`. Not a bug, but a readability issue.

**Fix:** Replace with `feedback: z.string().max(4000)` (keep the max, drop the redundant min).

---

### IN-02: Misleading CI header comment

**File:** `.github/workflows/ci.yml:2-3`

**Issue:** The comment "All jobs run in demo mode: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are explicitly set to empty strings" is inaccurate — the `unit` job does not set those variables (see WR-01). The comment overstates the guarantee.

**Fix:** Update the comment to reflect actual scope:
```yaml
# CI gate — runs on every push and pull request.
# check and e2e jobs run in demo mode (NEXT_PUBLIC_SUPABASE_URL="").
# unit job tests pure Node modules with no Supabase dependency.
```

---

### IN-03: `smoke` and `test:e2e` scripts are duplicate aliases in package.json

**File:** `package.json:13-14`

**Issue:** Both `"smoke": "playwright test"` and `"test:e2e": "playwright test"` run the exact same command. The `smoke` alias predates phase 13 and `test:e2e` was added alongside the new E2E specs and CI integration. Having two identical script aliases for the same runner causes ambiguity about which to use in CI vs local dev.

**Fix:** Either remove `smoke` (if `test:e2e` is now canonical) or alias it: `"smoke": "npm run test:e2e"`. The CI workflow uses `test:e2e`; local `playwright.config.ts` comments also reference `test:e2e` — `smoke` can be safely retired or aliased.

---

## Pre-existing issues (not introduced in phase 13, noted for completeness)

**`database/triggers.sql` `as $` / `$$;` mismatch** (`set_updated_at` line 12, `guard_player_onboarding` line 156): These functions open with `as $` (single dollar) but close with `$$;` (double dollar). This is syntactically invalid SQL on a strict parser. However, this mismatch predates phase 13 (introduced in commit `f53de0d` and unchanged since). PROD functions work because they were applied via MCP tools, not from this file. Phase 13 correctly used `$$` for both new functions (lines 182, 193). The pre-existing mismatch should be fixed in a future cleanup commit.

**`recalc_player_score` and `on_evaluation_change` use `set search_path = public`** (not `''`): These SECURITY DEFINER functions reference the `public` schema via fully-qualified names but use `set search_path = public` rather than the hardened `set search_path = ''`. PROD has this state already (pre-phase 13); the Supabase advisor check was cleared for the 4 D1 functions only. Not introduced in phase 13.

---

_Reviewed: 2026-06-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
