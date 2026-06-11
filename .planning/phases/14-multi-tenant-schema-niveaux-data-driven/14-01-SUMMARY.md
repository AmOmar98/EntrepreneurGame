---
phase: 14-multi-tenant-schema-niveaux-data-driven
plan: 01
subsystem: database
tags: [postgres, rls, migrations, multi-tenant, schema, supabase]

requires:
  - phase: 13-db-consolidation-test-infrastructure
    provides: drift report (OPS-01) that confirmed real PROD schema state before authoring additive migrations
provides:
  - organizations table with EIC default org + events.organization_id FK + backfill
  - events.is_active boolean flag + single-active partial unique index
  - levels_v2 text-PK table + missions.level_id_text + players.current_level_text additive columns + backfill
  - is_in_org(uuid) SECURITY DEFINER helper + org-scoped RLS policies on events and organizations
affects:
  - 14-02: TS data layer reads levels_v2 and events.is_active using these new columns
  - 14-03: call-site sweep replaces starts_at ordering with .eq("is_active", true)
  - 14-04: operator checkpoint applies all 4 migrations to PROD in one batched session
  - 14-05: declarative-view mirror (database/schema.sql etc.) reflects new tables/columns

tech-stack:
  added: []
  patterns:
    - "Migration file-first: supabase/migrations/ only, never database/** (Write-denied)"
    - "Additive-only enum migration: new text-PK table + backfill, zero in-place type changes"
    - "SECURITY DEFINER helper + REVOKE FROM PUBLIC + GRANT TO authenticated (kc2)"
    - "RLS initplan form: (select auth.uid()) everywhere, never inline auth.uid()"
    - "Partial unique index for DB-level single-active invariant"

key-files:
  created:
    - supabase/migrations/20260611120000_organizations.sql
    - supabase/migrations/20260611120100_events_is_active.sql
    - supabase/migrations/20260611120200_levels_data_driven.sql
    - supabase/migrations/20260611120300_rls_org_scope.sql
  modified: []

key-decisions:
  - "levels_v2 (not overwriting public.levels) to avoid collision with the existing enum-keyed table"
  - "events.organization_id nullable (not NOT NULL) — backfill first, NOT NULL tightening deferred"
  - "is_active DEFAULT false is safe pre-apply: TS accessor in Plan 02 keeps starts_at fallback"
  - "is_in_org joins events->cohorts->players->player_members — same join chain as is_my_player"
  - "events_org_scope_select tolerates organization_id IS NULL for pre-backfill instant"
  - "Physical enum removal (DROP TYPE public.level_id) deferred post-July event"
  - "PROD apply NOT done here: deferred to Plan 04 batched operator checkpoint"
  - "database/schema.sql NOT edited: declarative-view mirror deferred to Plan 05"

patterns-established:
  - "BEGIN/COMMIT wrapping for all multi-statement migrations"
  - "Rollback comment block per migration (step-by-step, clearly labelled manual-only)"
  - "Table GRANT alongside RLS (F-16-01 lesson: RLS alone insufficient)"
  - "ON CONFLICT DO NOTHING for seed/backfill idempotence"
  - "IF NOT EXISTS on all CREATE TABLE / ADD COLUMN / CREATE INDEX"
  - "DROP POLICY IF EXISTS + CREATE POLICY for idempotent policy management"

requirements-completed: [TENANT-01, TENANT-02, LEVELS-01, LEVELS-02]

duration: 5min
completed: 2026-06-11
---

# Phase 14 Plan 01: Multi-tenant Schema Foundation Summary

**Four additive idempotent SQL migrations establishing organizations table, events.is_active flag, levels_v2 text-PK table, and is_in_org SECURITY DEFINER RLS — zero data loss, PROD apply deferred to Plan 04.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-11T19:00:50Z
- **Completed:** 2026-06-11T19:05:03Z
- **Tasks:** 3 (Tasks 1, 2, and 3 which covered migrations A+B)
- **Files modified:** 4 (all new SQL migration files)

## Accomplishments

- Organizations table + EIC default org + events.organization_id FK backfill (TENANT-01): all existing AgreenTech and Digi events adopt the EIC org via backfill without touching any other column
- events.is_active boolean flag + partial unique index `uniq_events_single_active` enforcing at-most-one active event (TENANT-03 schema half)
- levels_v2 text-PK table + additive level_id_text/current_level_text FK columns on missions/players backfilled from enum cast (LEVELS-01, LEVELS-02) — the public.level_id enum stays in place untouched
- is_in_org(uuid) SECURITY DEFINER helper with REVOKE PUBLIC + GRANT authenticated + org-scoped SELECT policies on events and organizations (TENANT-02)

## Task Commits

1. **Task 1: organizations table + events.organization_id + default-org backfill** - `c486679` (feat)
2. **Task 2: events.is_active flag + single-active backfill** - `e080eca` (feat)
3. **Task 3: levels_data_driven + rls_org_scope** - `b02f3b4` (feat)

## Files Created/Modified

- `supabase/migrations/20260611120000_organizations.sql` - organizations table, EIC default org, events.organization_id nullable FK + backfill + index
- `supabase/migrations/20260611120100_events_is_active.sql` - events.is_active flag, most-recent-event backfill, partial unique index uniq_events_single_active
- `supabase/migrations/20260611120200_levels_data_driven.sql` - levels_v2 text-PK table, missions.level_id_text + players.current_level_text additive columns + backfill
- `supabase/migrations/20260611120300_rls_org_scope.sql` - is_in_org SECURITY DEFINER, events_org_scope_select policy, organizations RLS, levels_v2 RLS

## Decisions Made

- `levels_v2` naming (not `levels`) avoids collision with existing enum-keyed `public.levels` table which cannot be altered in-place.
- `events.organization_id` is nullable — applying NOT NULL in the same migration as ADD COLUMN risks a PROD instant where the constraint is checked before backfill completes. Tightening to NOT NULL is a separate migration.
- `events.is_active DEFAULT false` is pre-apply safe because the TS accessor (Plan 02) retains a `starts_at DESC` fallback for the pre-apply window.
- `is_in_org` joins via `events → cohorts → players → player_members` — same join chain as `is_my_player`, audited against real schema via OPS-01 drift report.
- `events_org_scope_select` includes `organization_id IS NULL` to tolerate the post-ADD-COLUMN, pre-backfill instant (defense in depth).
- Physical enum removal (`DROP TYPE public.level_id`) deferred post-July; no urgency once reads switch to text columns.
- PROD apply NOT done in this plan — deferred to batched Plan 04 operator checkpoint per CONTEXT constraint.
- `database/schema.sql` NOT edited — declarative-view mirror deferred to Plan 05 via Omar-authorized Node-script pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Verify script format alignment (3 instances)**
- **Found during:** Task 1 verification
- **Issue:** Plan's automated verify scripts checked for exact string matches (`slug='eic'` no-space, `id text primary key` no-extra-space, `grant execute` single-space) while the initial drafts used padded/spaced SQL formatting.
- **Fix:** Aligned SQL formatting to match verify script expectations: `slug='eic'` in backfill WHERE clause, `id text PRIMARY KEY` without extra padding, `GRANT EXECUTE` single space.
- **Files modified:** All 4 migration files
- **Verification:** All three `node -e` verify scripts output `OK`
- **Committed in:** b02f3b4 (included in task commits)

**2. [Rule 1 - Bug] Comment text triggered destructive-op grep gate**
- **Found during:** Task 3 verification (levels_data_driven)
- **Issue:** Header comment "no DROP TYPE, no ALTER COLUMN TYPE" contained the exact strings that the verify script's grep gate checks for, causing a false positive before the `rollback` section split.
- **Fix:** Rephrased comment to avoid `DROP TYPE` / `ALTER COLUMN TYPE` text in the pre-rollback body.
- **Files modified:** `20260611120200_levels_data_driven.sql`
- **Verification:** Verify script outputs `OK`, grep confirms no destructive ops before rollback section
- **Committed in:** b02f3b4

**3. [Rule 1 - Bug] Raw auth.uid() comment text triggered initplan check**
- **Found during:** Task 3 verification (rls_org_scope)
- **Issue:** Comment "(never raw auth.uid())" triggered the `[^(]auth\.uid\(\)` regex since the word "raw" precedes the pattern without `(select `.
- **Fix:** Rephrased to "(never inline, always wrapped)".
- **Files modified:** `20260611120300_rls_org_scope.sql`
- **Verification:** Verify script outputs `OK`
- **Committed in:** b02f3b4

---

**Total deviations:** 3 auto-fixed (all Rule 1 - formatting/comment alignment for verify script compliance)
**Impact on plan:** All fixes are comment/formatting alignment to pass the plan's own automated verify scripts. Zero functional SQL changes. No scope creep.

## Issues Encountered

None beyond the three verify script alignment fixes documented above.

## Known Stubs

None. These are SQL migration files only — no TS/UI stubs.

## Threat Flags

No new threat surface beyond what is in the plan's `<threat_model>`. All four threats are mitigated:
- T-14-01 (info disclosure): `is_in_org` + `events_org_scope_select` with `(select auth.uid())` initplan form — present in migration 4
- T-14-02 (tampering): additive-only confirmed by verify script grep gate — passes
- T-14-03 (DoS/ambiguity): `uniq_events_single_active` partial unique index — present in migration 2
- T-14-04 (EoP): REVOKE FROM PUBLIC + GRANT TO authenticated — present in migration 4

## Next Phase Readiness

- Plan 02 (TS data layer): DB contract is set — `levels_v2`, `events.is_active`, `events.organization_id` column names are final. `getLevels()` accessor reads `levels_v2`, `getActiveEvent()` reads `.eq("is_active", true)`.
- Plan 03 (call-site sweep): 19 sites using `order by starts_at desc limit 1` identified in 14-PATTERNS.md — ready to replace with `.eq("is_active", true)`.
- Plan 04 (operator checkpoint): 4 migration files ready for `supabase db push --linked` or SQL Editor apply. Apply order: 120000 → 120100 → 120200 → 120300.
- Plan 05 (declarative-view mirror): `database/schema.sql` / `triggers.sql` / `rls.sql` need to reflect organizations, levels_v2, is_active, organization_id, is_in_org.
- PROD is in a fully functional intermediate state: all new columns are nullable or have safe defaults; no app code reads them yet; existing events/missions/players continue to work exactly as before.

---
*Phase: 14-multi-tenant-schema-niveaux-data-driven*
*Completed: 2026-06-11*
