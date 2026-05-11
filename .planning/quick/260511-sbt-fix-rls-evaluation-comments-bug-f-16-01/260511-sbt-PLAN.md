---
quick_id: 260511-sbt
type: execute
wave: 1
depends_on: []
files_modified:
  - database/migrations/202605111923_fix_evaluation_comments_grants.sql
autonomous: true
requirements:
  - F-16-01
must_haves:
  truths:
    - "Authenticated mentor user can SELECT from evaluation_comments without HTTP 403"
    - "Authenticated mentor user can INSERT into evaluation_comments without HTTP 403"
    - "Future migration-created tables automatically inherit select/insert/update/delete grants for authenticated role"
  artifacts:
    - path: "database/migrations/202605111923_fix_evaluation_comments_grants.sql"
      provides: "Idempotent SQL migration that grants table privileges on evaluation_comments to authenticated + sets ALTER DEFAULT PRIVILEGES for authenticated role"
      contains: "grant select, insert on public.evaluation_comments to authenticated"
  key_links:
    - from: "Mentor UI (components/submission-comments-*.tsx)"
      to: "public.evaluation_comments"
      via: "Supabase authenticated JWT -> Postgres role authenticated"
      pattern: "select|insert.*evaluation_comments"
---

<objective>
Fix F-16-01 — Mentor users get HTTP 403 `permission denied for table evaluation_comments` (SQLSTATE 42501) in PROD. Root cause: table-level GRANT missing for `authenticated` role because `rls.sql:268-269` is a one-time bulk grant that does not cover tables created by later migrations. `database/migrations/08-mentor-comments.sql` (which created `evaluation_comments`) forgot to add explicit grants like `bonus_events.sql:143-144` does.

Purpose: Unblock mentor async-comment loop (MNT-03) before pilot 13/05 (T-2 days). Also harden default privileges so future migration tables auto-inherit grants and we don't hit this again.

Output: One new idempotent SQL migration file applied to PROD Supabase. Existing migration 08 is NOT modified (already applied per B3 memory). No app code changes.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@CLAUDE.md
@.planning/phases/16-phase-15-closeout-devtools-concurrence-audits/16-FINDINGS.md
@database/migrations/08-mentor-comments.sql
@database/rls.sql
@database/bonus_events.sql
@database/_fix_service_role_grants.sql

<interfaces>
<!-- Pattern reference from rls.sql:266-285 (authenticated bulk grants + service_role default privileges) -->
<!-- Pattern reference from bonus_events.sql:142-144 (per-table explicit grants for migration tables) -->

Existing pattern in rls.sql (bulk grant, one-time, NOT inherited by future tables):
```sql
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
```

Existing pattern in bonus_events.sql:143-144 (per-table grant — what 08-mentor-comments.sql SHOULD have done):
```sql
grant select, insert, update, delete on public.bonus_events to authenticated;
grant select, insert, update, delete on public.bonus_events to service_role;
```

Existing pattern in _fix_service_role_grants.sql:28 (default privileges for future tables — applied for service_role but NOT authenticated):
```sql
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
```

evaluation_comments is append-only (per migration 08 line 14: "No update/delete in v0.2 — append-only ledger") so grant is select+insert only, NOT update/delete.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write hotfix migration SQL granting evaluation_comments privileges + default privileges for authenticated</name>
  <files>database/migrations/202605111923_fix_evaluation_comments_grants.sql</files>
  <action>
Create a new idempotent SQL migration file at `database/migrations/202605111923_fix_evaluation_comments_grants.sql`.

Structure (mirror `database/_fix_service_role_grants.sql` style — header comment with diagnostic + cause + idempotency note, then statements):

1. Header comment block explaining:
   - F-16-01 diagnosis: HTTP 403 / Postgres 42501 / permission denied for table evaluation_comments
   - Root cause: rls.sql:268-269 bulk `grant ... on all tables` ran BEFORE migration 08 created evaluation_comments; migration 08 forgot to add explicit grants like bonus_events.sql:143-144 does
   - Why select+insert only (not update/delete): per migration 08 comment line 14, evaluation_comments is an append-only ledger
   - Idempotent: GRANT and ALTER DEFAULT PRIVILEGES are both safely re-runnable

2. Statements:
```sql
-- Explicit grants on the existing table (fixes the immediate F-16-01 bug)
grant select, insert on public.evaluation_comments to authenticated;
grant select, insert, update, delete on public.evaluation_comments to service_role;

-- Harden default privileges so future migration-created tables automatically
-- inherit grants for the authenticated role (prevents F-16-01 recurrence).
-- service_role default privileges are already set in _fix_service_role_grants.sql.
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
```

3. Sanity check query (commented out, for manual verification):
```sql
-- Sanity check (run in Supabase SQL editor after apply):
-- select grantee, privilege_type
--   from information_schema.table_privileges
--  where table_schema = 'public'
--    and table_name = 'evaluation_comments'
--    and grantee in ('authenticated', 'service_role')
--  order by grantee, privilege_type;
-- Expected: authenticated -> INSERT, SELECT ; service_role -> DELETE, INSERT, SELECT, UPDATE
```

Constraints:
- File must use lowercase SQL keywords matching existing migrations style
- Use `public.evaluation_comments` (schema-qualified) for clarity
- No DROP/CREATE — only GRANT and ALTER DEFAULT PRIVILEGES (both idempotent by nature)
- Do NOT modify `database/migrations/08-mentor-comments.sql` (already applied in PROD per B3)
- ASCII only (no accented characters) per project convention
  </action>
  <verify>
    <automated>node -e "const fs=require('fs');const s=fs.readFileSync('database/migrations/202605111923_fix_evaluation_comments_grants.sql','utf8');if(!s.includes('grant select, insert on public.evaluation_comments to authenticated'))process.exit(1);if(!s.includes('alter default privileges in schema public grant select, insert, update, delete on tables to authenticated'))process.exit(1);if(s.includes('drop ')||s.includes('DROP '))process.exit(1);console.log('OK')"</automated>
  </verify>
  <done>File `database/migrations/202605111923_fix_evaluation_comments_grants.sql` exists, contains explicit grants for evaluation_comments + ALTER DEFAULT PRIVILEGES for authenticated, no destructive statements, ASCII-only.</done>
</task>

<task type="auto">
  <name>Task 2: Apply migration to PROD Supabase via MCP apply_migration</name>
  <files>database/migrations/202605111923_fix_evaluation_comments_grants.sql</files>
  <action>
Apply the migration created in Task 1 to PROD Supabase using `mcp__plugin_supabase_supabase__apply_migration`.

Steps:
1. Read the full contents of `database/migrations/202605111923_fix_evaluation_comments_grants.sql`
2. Call `mcp__plugin_supabase_supabase__apply_migration` with:
   - `name`: `fix_evaluation_comments_grants` (snake_case, no timestamp prefix — Supabase adds its own)
   - `query`: full SQL content (strip comment-only header lines if MCP rejects, otherwise pass as-is)
3. Capture the MCP response (success/error) and record it.
4. If MCP returns an error containing "already exists" or similar idempotency-related message, that is acceptable — GRANT statements are idempotent.

If `mcp__plugin_supabase_supabase__apply_migration` is unavailable in the executor's tool set, fall back to:
- Use `mcp__plugin_supabase_supabase__execute_sql` with the same query content (note: this bypasses migration history but achieves the same DB state for grants which are not tracked by migration deltas anyway).

Do NOT touch any app code, components, or non-DB files.
  </action>
  <verify>
    <automated>echo "Manual MCP step — verification in Task 3"</automated>
  </verify>
  <done>MCP apply_migration (or execute_sql fallback) returns success. Migration applied to PROD without error (or with acceptable idempotency-related notice).</done>
</task>

<task type="auto">
  <name>Task 3: Verify grants in PROD + document in SUMMARY.md</name>
  <files>.planning/quick/260511-sbt-fix-rls-evaluation-comments-bug-f-16-01/SUMMARY.md</files>
  <action>
Verify the fix landed in PROD by querying `information_schema.table_privileges` via Supabase MCP, then write the SUMMARY.md.

Steps:
1. Call `mcp__plugin_supabase_supabase__execute_sql` with:
```sql
select grantee, privilege_type
  from information_schema.table_privileges
 where table_schema = 'public'
   and table_name = 'evaluation_comments'
   and grantee in ('authenticated', 'service_role')
 order by grantee, privilege_type;
```
2. Expected result: `authenticated` has at minimum `INSERT` and `SELECT`; `service_role` has `DELETE`, `INSERT`, `SELECT`, `UPDATE`.
3. Also verify default privileges hardening:
```sql
select defaclrole::regrole as role, defaclacl
  from pg_default_acl
 where defaclnamespace = 'public'::regnamespace;
```
4. Write `SUMMARY.md` at the quick session directory documenting:
   - F-16-01 root cause (one paragraph)
   - Fix delivered (file + 2 SQL statement categories: explicit grants + default privileges hardening)
   - PROD verification query results (paste actual rows from step 1 + 3)
   - SHA of the commit(s) — to be filled by the executor after `git commit`
   - Cardinals R1/R2/R3 preservation note: server-side DB grants only, no Player-facing surface, no scoring change, no inter-mission gating
   - Per-CLAUDE.md "Default = ship + push" note: commit + push to origin main confirmed

SUMMARY.md sections (follow project quick orchestrator convention — 5 artefacts pattern):
```markdown
# SUMMARY — quick-260511-sbt — fix RLS evaluation_comments bug F-16-01

## What shipped
- New migration: `database/migrations/202605111923_fix_evaluation_comments_grants.sql`
- Applied to PROD Supabase via MCP apply_migration on 2026-05-11

## Root cause (F-16-01)
[one paragraph]

## Fix
[the two SQL categories]

## PROD verification (2026-05-11)
[paste actual table_privileges rows]
[paste actual pg_default_acl rows]

## Commits
- {SHA} — `(quick-260511-sbt) fix(db): grant evaluation_comments privileges to authenticated + harden default privileges`
- Pushed to origin/main: {yes/no}

## Cardinals EIC (R1/R2/R3)
Server-side DB grants only. No Player-facing surface, no scoring change, no inter-mission gating. R1/R2/R3 preserved.

## Deferred
See deferred-items.md (none expected).
```

Also create an empty/minimal `deferred-items.md` in the same directory per quick orchestrator convention.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs');const p='.planning/quick/260511-sbt-fix-rls-evaluation-comments-bug-f-16-01/SUMMARY.md';if(!fs.existsSync(p))process.exit(1);const s=fs.readFileSync(p,'utf8');if(!s.includes('F-16-01')||!s.includes('authenticated')||!s.includes('PROD'))process.exit(1);console.log('OK')"</automated>
  </verify>
  <done>SUMMARY.md exists with root cause, fix description, actual PROD verification output, commit SHA(s), push confirmation, and R1/R2/R3 preservation note. deferred-items.md exists (even if empty).</done>
</task>

</tasks>

<verification>
End-to-end check after all 3 tasks:
1. `database/migrations/202605111923_fix_evaluation_comments_grants.sql` exists in repo and is committed.
2. `information_schema.table_privileges` in PROD shows `authenticated` has `INSERT, SELECT` on `evaluation_comments`.
3. `pg_default_acl` in PROD shows `authenticated` role has default privileges for future tables in schema public.
4. SUMMARY.md + deferred-items.md exist per quick orchestrator convention.
5. Commit pushed to origin/main per "Default = ship + push" policy.

Optional manual smoke (not blocking): authenticated mentor user opens a submission detail page in PROD and successfully reads + posts an evaluation_comment without HTTP 403.
</verification>

<success_criteria>
- F-16-01 closed: mentor users no longer get HTTP 403 on evaluation_comments
- Future migration-created tables auto-inherit authenticated grants (recurrence prevented)
- No app code touched; no Player-facing surface touched; R1/R2/R3 preserved
- 1 atomic commit on `main`, pushed to origin
- Quick session artefacts complete: PLAN.md (this file) + SUMMARY.md + deferred-items.md
</success_criteria>

<output>
After completion:
- `.planning/quick/260511-sbt-fix-rls-evaluation-comments-bug-f-16-01/SUMMARY.md`
- `.planning/quick/260511-sbt-fix-rls-evaluation-comments-bug-f-16-01/deferred-items.md`
- Commit: `(quick-260511-sbt) fix(db): grant evaluation_comments privileges to authenticated + harden default privileges`
- Push to origin/main
</output>
