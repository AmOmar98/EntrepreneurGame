---
phase: quick-260523-hhy
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/quick/260523-hhy-rls-announcements/NEW.sql
  - database/rls.sql
autonomous: true
requirements:
  - POSTMORTEM-C-RLS-ANNOUNCEMENTS
must_haves:
  truths:
    - "Policy `announcements_anon_select` exists in PROD on `public.announcements` with role=anon, cmd=SELECT, qual=true"
    - "`pg_policies WHERE tablename='announcements'` returns 5 rows (4 pre-existing + 1 new)"
    - "Postgres logs at T+15min after apply show 0 new `permission denied for table announcements` errors"
    - "Advisors security count stays at 26 WARN (no new alert introduced by permissive anon SELECT)"
    - "`database/rls.sql` contains the policy definition so future schema rebuilds preserve it"
  artifacts:
    - path: ".planning/quick/260523-hhy-rls-announcements/NEW.sql"
      provides: "Provenance SQL applied to PROD (workaround Database deny — cf. CLAUDE.md)"
      contains: "CREATE POLICY \"announcements_anon_select\""
    - path: "database/rls.sql"
      provides: "Canonical RLS source with new anon SELECT policy mirrored at end of file"
      contains: "announcements_anon_select"
  key_links:
    - from: ".planning/quick/260523-hhy-rls-announcements/NEW.sql"
      to: "Supabase PROD (project_id=vzzbjxmfkmvqkaqxalhr)"
      via: "mcp__plugin_supabase_supabase__execute_sql"
      pattern: "CREATE POLICY \"announcements_anon_select\""
    - from: "database/rls.sql"
      to: ".planning/quick/260523-hhy-rls-announcements/NEW.sql"
      via: "manual mirror after PROD apply confirmed"
      pattern: "announcements_anon_select"
---

<objective>
Eliminate the recurrent `permission denied for table announcements` faux positif observed J1+J2 of the Digi-Hackathon by adding a permissive `SELECT` policy for the `anon` role on `public.announcements`. The RSC initial Player render path queries before the Supabase session cookie is attached → query runs as `anon` → current policies (all `authenticated`-scoped) reject it. `announcements` is broadcast public content (no PII, no secrets) so anon SELECT is intentionally permissive.

Purpose: Quick C of post-mortem 2026-05-23 — kill log noise so future event monitoring stays signal-rich.
Output: 1 new policy in PROD + mirror in `database/rls.sql` + provenance NEW.sql + atomic commit.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md
@.planning/quick/260523-hhy-rls-announcements/BASELINE.md
@CLAUDE.md
@database/rls.sql
@database/migrations/09-gamemaster-live.sql

<interfaces>
<!-- Pre-existing `announcements` policies (from BASELINE.md §1 + migration 09 lines 67-111) -->
<!-- All scoped to `authenticated`. None allow `anon` SELECT. -->

Current policies on public.announcements:
- announcements_audience_select  (authenticated, SELECT, audience-aware filter)
- announcements_gm_insert        (authenticated, INSERT, GM only)
- announcements_gm_update        (authenticated, UPDATE, GM only)
- announcements_gm_delete        (authenticated, DELETE, GM only)

Target end state: 5 policies (above 4 + new `announcements_anon_select`).

Grants nuance (database/rls.sql:266):
`revoke all on schema public from anon;` — schema-level grants for anon are revoked,
but Supabase PostgREST issues a per-table grant on the `anon` role at policy creation
time when the policy enables SELECT FOR anon via REST. If post-apply pg_policies shows
5 rows but logs still surface `permission denied`, verify table-level grant with:
  `select has_table_privilege('anon', 'public.announcements', 'SELECT');`
If false, an explicit `grant select on public.announcements to anon;` must be added
to NEW.sql and re-applied. Surface this finding to Omar before adding the grant —
post-mortem section C did not pre-authorize a grant, only the policy.
</interfaces>

Post-mortem section C lines 100-110 defines the exact SQL — do not reformulate.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Apply anon SELECT policy on announcements (PROD + mirror)</name>
  <files>.planning/quick/260523-hhy-rls-announcements/NEW.sql, database/rls.sql</files>
  <action>
Execute the 5-step workflow exactly as ordered. Do NOT batch steps. Verify each step before proceeding.

**Step 1 — Write provenance NEW.sql**
Use the `Write` tool to create `.planning/quick/260523-hhy-rls-announcements/NEW.sql` with EXACTLY this content (taken verbatim from post-mortem section C lines 100-110):

```sql
-- Allow anonymous SELECT on announcements (public broadcast content)
-- Reason: RSC render path queries before session cookie established
-- See post-mortem .planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md
CREATE POLICY "announcements_anon_select"
  ON public.announcements
  FOR SELECT
  TO anon
  USING (true);
```

**Step 2 — Apply to PROD**
Call `mcp__plugin_supabase_supabase__execute_sql` with:
- `project_id`: `"vzzbjxmfkmvqkaqxalhr"` (Digi PROD, confirmed in BASELINE.md)
- `query`: the full contents of NEW.sql (the CREATE POLICY statement + comments)

Expected: success response, no error. If the policy already exists, the call will fail with `policy "announcements_anon_select" for table "announcements" already exists` — in that case stop and report to Omar (idempotency is not specified for this quick).

**Step 3 — Post-apply verification (pg_policies)**
Call `mcp__plugin_supabase_supabase__execute_sql` with:
- `project_id`: `"vzzbjxmfkmvqkaqxalhr"`
- `query`: `select policyname, roles, cmd, qual from pg_policies where tablename = 'announcements' order by policyname;`

Required result: 5 rows. The new row MUST satisfy:
- `policyname = 'announcements_anon_select'`
- `roles = '{anon}'`
- `cmd = 'SELECT'`
- `qual = 'true'`

If any of those criteria fail, stop and report. Do NOT proceed to mirror or commit.

**Step 3b — Optional sanity grant check**
Call execute_sql with `select has_table_privilege('anon', 'public.announcements', 'SELECT');`. If `false`, surface immediately to Omar with the finding "policy created but anon lacks table grant due to revoke-from-anon at rls.sql:266 — need explicit GRANT?". Do NOT add the grant without explicit approval — post-mortem did not pre-authorize it.

**Step 4 — Mirror in database/rls.sql**
Use the `Edit` tool to append the policy block to `database/rls.sql` immediately before the `-- ============================================================================\n-- Final grants` section (currently at line 262). Add this block (note: idempotent `drop policy if exists` mirrors the convention used in migration 09):

```sql

-- ============================================================================
-- announcements anon SELECT (quick-260523-hhy)
-- ============================================================================
-- Broadcast public content (no PII, no secrets). Required because RSC initial
-- render path queries announcements before the Supabase session cookie is
-- attached, executing as anon. Without this policy, postgres logs surface
-- `permission denied for table announcements` ~1-4× / 15 min during events.
-- Provenance: .planning/quick/260523-hhy-rls-announcements/NEW.sql applied PROD 2026-05-23.
drop policy if exists "announcements_anon_select" on public.announcements;
create policy "announcements_anon_select" on public.announcements
  for select to anon
  using (true);

```

Place it BEFORE the `-- Final grants` separator so the `revoke all on schema public from anon` at line 266 still runs after policy creation (policies don't depend on schema grants, but ordering preserves readability).

**Step 5 — Atomic commit**
Stage ONLY the two files modified by this quick. The working tree contains many unrelated changes (ticks pilot-alerts, deleted EIC-MANAGER docs, etc.) — they MUST NOT be staged.

```bash
git add database/rls.sql .planning/quick/260523-hhy-rls-announcements/NEW.sql
git commit -m "quick(rls-announcements): allow anon SELECT on announcements"
```

Do NOT use `git add -A`, `git add .`, or `git commit -am`. Verify with `git status` after commit that the two files are committed and all other untracked/modified files are still untracked/modified (untouched).
  </action>
  <verify>
    <automated>
Step 3 pg_policies query MUST return 5 rows with the new `announcements_anon_select` row matching: roles='{anon}', cmd='SELECT', qual='true'.

Post-commit verification (run all three):
1. `git log -1 --stat` shows commit `quick(rls-announcements): allow anon SELECT on announcements` touching exactly 2 files: `database/rls.sql`, `.planning/quick/260523-hhy-rls-announcements/NEW.sql`.
2. `git status --short` does NOT list either of those 2 files (they are committed).
3. `grep -n announcements_anon_select database/rls.sql` returns at least one match.

No applicative regression test needed — RLS DB-only, dual-mode demo unaffected (only applies when Supabase connected).
    </automated>
  </verify>
  <done>
- NEW.sql exists with verbatim post-mortem SQL
- PROD has 5 policies on `announcements`, the new one is `announcements_anon_select` with `{anon}` / SELECT / true
- `database/rls.sql` mirrors the policy (idempotent drop+create block)
- 1 atomic commit `quick(rls-announcements): allow anon SELECT on announcements` with exactly 2 files
- Unrelated working-tree changes (ticks, deleted EIC-MANAGER docs, modified `.claude/agents/pilot-health-watcher.md`, modified `CLAUDE.md`) remain unstaged
- If Step 3b revealed missing anon table grant, finding surfaced to Omar BEFORE attempting any grant change
  </done>
</task>

</tasks>

<verification>
- Step 3 (pg_policies) returned 5 rows, new row matches spec exactly.
- `git log -1 --stat` shows 2-file commit with the prescribed message.
- `git status --short` confirms ONLY unrelated pre-existing changes remain untracked/modified.
- BASELINE.md §4 smoke criteria met: pg_policies = 5 rows, advisors still 26 WARN (run advisors check post-apply if cheap).
</verification>

<success_criteria>
- Policy `announcements_anon_select` live in PROD on `public.announcements`
- `database/rls.sql` mirror in place so any future `drop schema public cascade` rebuild preserves the policy
- Atomic single-purpose commit on `main` with no scope creep
- Postgres logs surface 0 new `permission denied for table announcements` errors during next pilot event (cannot verify until next live event — captured as deferred observation, not blocking)
</success_criteria>

<output>
After completion, create `.planning/quick/260523-hhy-rls-announcements/SUMMARY.md` documenting:
- Commit SHA
- pg_policies pre/post snapshots (4 → 5 rows)
- Step 3b grant-check finding (if any)
- Link back to post-mortem section C
And `.planning/quick/260523-hhy-rls-announcements/deferred-items.md` listing the "verify 0 perm-denied logs at next live event" observation (and any other items surfaced during execution).
</output>
