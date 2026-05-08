# Codebase Concerns

**Analysis Date:** 2026-05-08

## Tech Debt

**Duplicate server-action variants:**
- Issue: `submitDeliverable` / `submitDeliverableFlow` and `claimBonusEvent` / `claimBonusEventFlow` are near-identical pairs in `app/actions.ts` (lines 74-179 and 279-387). The non-`Flow` variants are silent (`return;` on validation failure, no `WorkflowState`).
- Files: `app/actions.ts`
- Impact: Bug fixes must be applied twice; silent failures in the non-Flow variants hide validation errors.
- Fix approach: Delete `submitDeliverable` and `claimBonusEvent` (the void-returning copies) once no caller depends on them, or extract a shared insert helper.

**Monolithic `lib/data.ts` seed module:**
- Issue: 1,285 lines combining type definitions, demo seed data, helper functions, and presentation icons (`lucide-react` imports) in one file.
- Files: `lib/data.ts`
- Impact: Any type-only import drags icon library into server bundles; merge conflicts likely; hard to navigate.
- Fix approach: Split into `lib/types.ts` (pure types), `lib/seed/*.ts` (demo data), `lib/xp.ts` / `lib/bonus.ts` (calculation helpers), `lib/icons.ts` (lucide re-exports for UI only).

**Demo seed leaking into Supabase code paths:**
- Issue: `lib/workflow-data.ts` always falls back to `getStartup(slug)` / `projectActivity(...)` from the in-memory seed when Supabase rows are missing, blending demo data with real cohort data when Supabase is configured but tables are empty.
- Files: `lib/workflow-data.ts:243-277`, `lib/workflow-data.ts:328-351`
- Impact: A live Supabase project with no startups will silently render demo startups (`atlas-soil`, etc.) as if they exist; reviewers/coaches see fictional records.
- Fix approach: When `hasSupabaseEnv()` is true, return empty arrays instead of seed fallbacks; gate demo fallbacks behind an explicit env flag.

**Hardcoded routes / URLs / emails in server actions:**
- Issue: `eic@uemf.ma`, `https://eic-game.uemf.ma/...`, and `revalidatePath("/startup/atlas-soil")` are hardcoded throughout `app/actions.ts`.
- Files: `app/actions.ts:157,160,171,247,276,366,369`
- Impact: `updateBootcampQuest` revalidates `/startup/atlas-soil` (a seed slug) regardless of which quest is edited — wasted revalidation in production and stale caches for other startups.
- Fix approach: Move email/host/cohort to `process.env`; revalidate by tag (`revalidateTag('startups')`) instead of hardcoded paths.

**Demo-only export routes:**
- Issue: All `/api/export/*` route handlers read directly from `lib/data.ts` (in-memory seed) and never query Supabase, even when Supabase is configured.
- Files: `app/api/export/cohort.csv/route.ts`, `app/api/export/committee/[committeeId]/route.ts`, `app/api/export/eml/[committeeId]/route.ts`, `app/api/export/review-queue.csv/`, `app/api/export/kpi-snapshot.csv/`
- Impact: CSV/EML exports show fake data in production; KPI snapshots are useless.
- Fix approach: Replicate the dual-mode pattern from `lib/workflow-data.ts` in each export route.

## Known Bugs

**Silent server-action failures:**
- Symptoms: `submitDeliverable`, `claimBonusEvent`, `updateBootcampQuest`, `reviewDeliverable`, `reviewBonusEvent`, `markMailtoOpened`, `createStartup`, `assignProjectMember`, `assignCoach`, `updateStartupStatus` all swallow Supabase errors (`if (error) return;` or no error check at all).
- Files: `app/actions.ts:110, 154, 273, 317, 408, 438, 450, 469, 483, 494, 510`
- Trigger: Any insert/update failure (RLS denial, constraint violation, network error).
- Workaround: None — failures look like successes to the user.

**`reviewDeliverable` does not pass `status` through Zod:**
- Symptoms: Free-form `status` from the form is written directly to the `deliverables.status` column. The DB enum `deliverable_status` will reject invalid values, but the action returns no error to the caller.
- Files: `app/actions.ts:389-413`
- Trigger: Tampered form submission or future option drift.

**`reviewBonusEvent` recomputes XP from form-supplied stage target:**
- Symptoms: `stageCapXp` and `prestigeXp` are derived from `formValue("stageTarget")` and `formValue("awardedXp")` — both client-supplied. A malicious coach (or any authenticated user able to insert a review) can set `awardedXp` and `stageTarget` to inflate `prestige_xp` without bound.
- Files: `app/actions.ts:415-443`
- Trigger: Crafted POST to the action.
- Workaround: Recompute `stageTarget` and `awardedXp` on the server from `bonus_events.bonus_type` + `quantity` via `calculateBonusClaim`; never trust client-provided XP math.

**Missing role authorization in server actions:**
- Symptoms: `reviewDeliverable`, `reviewBonusEvent`, `createStartup`, `assignProjectMember`, `assignCoach`, `updateStartupStatus`, `updateBootcampQuest` rely entirely on RLS to gate writes. They do not call `supabase.auth.getUser()` to verify the caller's role before mutating.
- Files: `app/actions.ts:389-515`
- Trigger: Any authenticated user can POST to these actions.
- Workaround: RLS provides defense-in-depth, but the action layer should fail fast with `is_staff()` / `has_role()` checks for clearer errors and to prevent accidental policy regressions.

## Security Considerations

**Pilot-grade RLS — known weak policies:**
- Risk: Several policies are coarse and over-permissive for a multi-tenant pilot.
- Files: `database/rls.sql`
- Specific weaknesses:
  - `bootcamp_deliverables_all_authenticated_select` (line 117-119) and `missions_all_authenticated_select` (line 126-128) expose all rows to every authenticated user, regardless of cohort.
  - `members_same_project_or_staff_select` (line 57-65) compares `project_id = project_id` (column = column on the same row), so the EXISTS subquery is satisfied by any row the user can already see — the policy effectively never narrows results. Should compare to outer row alias.
  - `evidence` has only a SELECT policy (line 154-164) — no INSERT/UPDATE/DELETE policies, meaning RLS denies all writes to `evidence` (or, if not denied by default in this Postgres setup, anyone can write).
  - `xp_ledger`, `startup_activity` have SELECT only, meaning trigger-driven inserts run as `security definer` — works for current triggers but any non-trigger insert is blocked silently.
  - `audit_log` has only `audit_admin_select`; nothing inserts into it.
- Current mitigation: All writes funnel through server actions running with the user's anon JWT.
- Recommendations: Tighten cohort scoping on `bootcamp_deliverables` / `missions`; fix the `members_same_project_or_staff_select` self-join bug; add explicit INSERT/UPDATE policies (or explicit `revoke insert`) on `evidence`, `xp_ledger`, `startup_activity`, `audit_log`; add policies for `committee_dossiers` writes (only SELECT exists today).

**Service role key not used — but no guard against accidental use:**
- Risk: All Supabase clients use `NEXT_PUBLIC_SUPABASE_ANON_KEY`. There is no centralized service-role client. Future contributors may add one and bypass RLS.
- Files: `utils/supabase/server.ts`, `utils/supabase/middleware.ts`, `lib/supabase-status.ts`
- Mitigation: Document forbidden usage; add a lint rule banning `SUPABASE_SERVICE_ROLE_KEY` references outside an explicit allowlist.

**Open redirect / unauthenticated export routes:**
- Risk: `/api/export/*` route handlers have no auth check (and the middleware excludes `/api` from auth gating — `utils/supabase/middleware.ts:32`). Currently they only return demo data, but as soon as they read Supabase, anyone on the internet can download cohort.csv and committee dossiers.
- Files: `app/api/export/**/route.ts`, `utils/supabase/middleware.ts:30-34`
- Mitigation: Either remove `/api` from `isPublic`, or add explicit `is_staff()` check in each export handler; add admin/committee-member role gating before the data is real.

**`mailto:` body XSS / phishing surface:**
- Risk: Server-action mailto bodies interpolate user-supplied `description`, `title`, and `proofUrl` into `encodeURIComponent`, then `window.location.href = mailto:...` (`components/proof-workflow.tsx:28`). While `encodeURIComponent` neutralizes the URL, a malicious founder can craft proof titles/descriptions that, once pasted by the coach into an email, look like instructions from EIC (social engineering).
- Files: `app/actions.ts:160-173, 369-381`, `components/proof-workflow.tsx:25-37`
- Mitigation: Trim/normalize user input length; surface a preview before redirect; remind reviewers via fixed copy that body content is founder-supplied.

**Login error parameter trusted in URL:**
- Risk: `app/login/page.tsx:35` shows "Identifiants invalides" when `?error=1`. Not a vulnerability but signals the auth flow uses URL state rather than cookies/flash, which can be enumerated.
- Mitigation: Acceptable for pilot.

**`logo_url` and other URL columns rely only on regex `^https://`:**
- Risk: Schema check `logo_url ~ '^https://'` (`database/schema.sql:95,179,199`) does not block SSRF-friendly hosts (e.g., `https://169.254.169.254/...`), nor does the Zod `httpsUrl` schema. If the app ever fetches these URLs server-side, SSRF is possible.
- Mitigation: Document that these URLs are only ever rendered client-side; if server-side fetch is added, validate against an allowlist.

## Performance Bottlenecks

**N+1 `xpSummary` calls in role pages:**
- Problem: `app/coach/page.tsx:65,82`, `app/admin/page.tsx:15-16`, and `app/startup/[slug]/page.tsx` call `xpSummary(startup.id)` per startup — and `xpSummary` walks the entire in-memory `xpLedger` each time.
- Files: `lib/data.ts` (xpSummary helper), `app/coach/page.tsx`, `app/admin/page.tsx`
- Cause: O(N×M) iteration over the ledger inside loops.
- Improvement path: Pre-aggregate XP per project once per request; in Supabase mode, query a `project_xp_summary` view.

**Demo-mode imports `lib/data.ts` (~1,285 lines) into every route:**
- Problem: Even Supabase-mode pages import the seed module to obtain types and helpers, including all 1,285 lines of seed arrays.
- Files: `lib/data.ts`, all `app/**/page.tsx`
- Improvement path: Split types from data (see Tech Debt above).

## Fragile Areas

**Dual-mode shape drift:**
- Files: `lib/data.ts` (TS types) vs `database/schema.sql` (SQL columns) vs `lib/workflow-data.ts` `Db*` types.
- Why fragile: Three independent definitions of every entity. A column rename in SQL silently breaks `mapProject` / `mapDeliverable` / `mapBonus` because `Db*` types are hand-written. Adding fields to `Startup` requires updates in five places (TS type, demo seed, SQL schema, RLS policy, mapper).
- Safe modification: When changing any domain shape: update `database/schema.sql` first, regenerate Supabase types if/when added, update `Db*` type in `lib/workflow-data.ts`, update mapper, then update `lib/data.ts` TS type and seed.
- Test coverage: None.

**XP triggers vs server-action math:**
- Files: `database/triggers.sql` (`tg_on_deliverable_accepted`, `tg_on_bonus_accepted`), `app/actions.ts:415-443` (`reviewBonusEvent`).
- Why fragile: `reviewBonusEvent` writes `counts_toward_stage` and `prestige_xp` columns; the trigger on bonus_events ALSO computes XP and inserts ledger rows. If the action's math diverges from `bonusRules` / `calculateBonusClaim` (which is recomputed on the client form), `xp_ledger` and `projects.total_xp` desync.
- Safe modification: Treat the trigger as authoritative — strip XP math from the action and let the trigger compute from `quantity` + `bonus_type` + `awarded_xp`. Document that anything updating `bonus_events`/`deliverables` must let triggers compute.

**`tg_on_deliverable_submitted` always inserts pending XP:**
- Files: `database/triggers.sql:49-57`
- Why fragile: Fires on every insert, including drafts. If `app/actions.ts:96-108` ever inserts with `status='draft'`, pending XP still hits the ledger.
- Safe modification: Add `if new.status = 'submitted'` guard.

## Scaling Limits

**In-memory seed traversal:**
- Current capacity: ~6 demo startups, ~30 deliverables. Linear scans are imperceptible.
- Limit: Demo mode breaks down at ~100 records since every helper iterates `xpLedger` and `deliverables`.
- Scaling path: Demo mode is not meant to scale; production uses Supabase. Ensure Supabase queries are indexed (no indexes are defined in `database/schema.sql` beyond PKs and `unique` constraints).

**Missing indexes on hot foreign keys:**
- Problem: No explicit indexes on `deliverables.project_id`, `bonus_events.project_id`, `xp_ledger.project_id`, `startup_activity.project_id`, `project_members.user_id`.
- Files: `database/schema.sql`
- Impact: At cohort scale (100+ startups, thousands of deliverables) every coach/admin page does a seq scan.
- Improvement path: Add `create index on deliverables(project_id, status);` and equivalent for bonus_events, xp_ledger, startup_activity, project_members(user_id).

## Dependencies at Risk

**`lucide-react@^1.14.0`:**
- Risk: `lucide-react` major versions have moved well past 1.x (current is 0.x or 0.500+ depending on registry). The `^1.14.0` pin looks suspicious — likely an accidental selector that resolves to an old or non-existent version, with potential supply-chain risk.
- Files: `package.json`
- Migration plan: Verify resolved version in `package-lock.json`; pin to a known-good current release.

**`typescript@^6.0.3`:**
- Risk: TypeScript 6 is recent; with `^` it can silently jump minor versions and break builds.
- Files: `package.json`
- Migration plan: Pin exact version for the pilot.

**No lockfile-strict CI:**
- Risk: `package-lock.json` exists but no CI is configured (`scripts` only has `dev/build/start/lint/typecheck`).
- Mitigation: Add `npm ci` to a CI job.

## Missing Critical Features

**No test runner:**
- Problem: `package.json` has no `test` script, no Jest/Vitest/Playwright dependency. CLAUDE.md explicitly calls this out.
- Blocks: Refactoring `lib/data.ts`, validating XP math, regression-testing dual-mode parity, RLS policy assertions.
- Fix approach: Add Vitest for `lib/*.ts` unit tests (XP math, bonus rules, mailto generators), Playwright for role-based smoke tests, and a `pgTAP` or `supabase-cli`-based RLS test for `database/rls.sql`.

**No CI / no pre-commit:**
- Problem: No `.github/workflows`, no `husky`, no lint-staged. `lint` and `typecheck` run only when invoked manually.
- Blocks: Catching regressions before merge.

**No observability:**
- Problem: No Sentry, no structured logging, no `audit_log` writes (the table exists but nothing inserts into it).
- Blocks: Diagnosing pilot incidents; satisfying the audit requirement implied by the table.
- Fix approach: Have server actions write to `audit_log` on every mutation; add Sentry or Logtail.

**No rate limiting on server actions:**
- Problem: Submission, bonus claim, and review actions can be POSTed in a tight loop.
- Blocks: Abuse / accidental duplicate XP.
- Fix approach: Add Upstash rate-limit or a Postgres-backed cooldown column; rely on `unique (project_id, mission_id)` for `submissions` (already present) and add similar uniqueness or de-dup logic for `deliverables` / `bonus_events` if appropriate.

**No file uploads — only links:**
- Problem (by design): Proof flow requires founders to host artifacts on Google Docs / Notion and paste an `https://` link. No control over link rot, access revocation, or content changes after review.
- Mitigation: Document this trade-off; consider archiving the URL contents at acceptance time.

**No CSRF token on server actions:**
- Problem: Next.js App Router server actions ship with built-in same-origin protections, but there is no explicit origin allowlist or rotation.
- Mitigation: Acceptable while behind Caddy at a single origin (`ops/Caddyfile`).

## Test Coverage Gaps

**XP calculation (`calculateBonusClaim`, `xpSummary`, stage cap math):**
- What's not tested: All bonus rule edge cases (caps, prestige overflow, quantity multipliers).
- Files: `lib/data.ts`, `app/actions.ts:419-421`
- Risk: Silent XP drift; hard to detect from UI.
- Priority: High.

**RLS policies:**
- What's not tested: Every policy in `database/rls.sql`. The policies are pilot-grade and contain at least one logic bug (`members_same_project_or_staff_select`).
- Files: `database/rls.sql`
- Risk: Cross-cohort data leakage.
- Priority: High.

**Triggers (`tg_on_deliverable_accepted`, `tg_on_bonus_accepted`, `tg_on_submission_validated`):**
- What's not tested: Idempotency on repeated UPDATEs, behavior when `prestige_xp` is non-zero, ledger entry uniqueness.
- Files: `database/triggers.sql`
- Risk: Double-counted XP, drifted `projects.total_xp`.
- Priority: High.

**Dual-mode parity:**
- What's not tested: That demo-mode and Supabase-mode render the same shapes for the same scenarios.
- Files: `lib/workflow-data.ts`, `lib/data.ts`
- Risk: UI breaks only in production.
- Priority: Medium.

**Server-action validation paths:**
- What's not tested: Zod failure responses, mailto-URL escaping, `WorkflowState` shape.
- Files: `app/actions.ts`
- Priority: Medium.

**Export route handlers:**
- What's not tested: CSV escaping in `lib/csv.ts:11` (`/[",\n\r]/`), EML `=?UTF-8?B?` subject encoding, committee dossier rows.
- Files: `lib/csv.ts`, `app/api/export/**`
- Priority: Low until exports become real.

---

*Concerns audit: 2026-05-08*
