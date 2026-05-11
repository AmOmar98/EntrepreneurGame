---
quick_id: 260511-sbt
date: 2026-05-11
status: shipped
requirements: [F-16-01]
commits:
  - f6a30e1
  - f48cb8e
pushed_to_origin: true
---

# SUMMARY — quick-260511-sbt — fix RLS evaluation_comments bug F-16-01

## What shipped

- New hotfix migration: `database/migrations/202605111923_fix_evaluation_comments_grants.sql`
- Mirror for `supabase db push`: `supabase/migrations/20260511192300_fix_evaluation_comments_grants.sql`
- Verification probe (idempotent NOTICE emitter): `supabase/migrations/20260511192400_verify_evaluation_comments_grants.sql`
- Applied to PROD Supabase (`EntrepreneurGame` / `vzzbjxmfkmvqkaqxalhr`) on 2026-05-11 via `supabase db push --linked`.
- Pushed to `origin/main` (commits f6a30e1, f48cb8e).

## Root cause (F-16-01)

Mentor users in PROD hit HTTP 403 / SQLSTATE 42501 `permission denied for table evaluation_comments` when attempting to SELECT or INSERT comments from the mentor UI. The bug is **table-level GRANT missing for the `authenticated` role**, not an RLS policy issue. `rls.sql:267-269` performs a bulk `grant ... on all tables in schema public to authenticated`, but this command is a one-shot snapshot — it only covers tables that exist at the moment it runs. `public.evaluation_comments` was created later via `database/migrations/08-mentor-comments.sql`, which (unlike `database/bonus_events.sql:143-144`) omitted the per-table explicit grant. Result: Postgres rejects the request at the GRANT layer **before** RLS policy evaluation even runs, so the (correctly authored) `evaluation_comments_member_or_mentor_select` and `evaluation_comments_mentor_self_insert` policies never get a chance to allow the action.

## Fix

Two categories of statements, both idempotent:

1. **Explicit table-level grants on the existing table** (closes F-16-01 immediately):
   ```sql
   grant select, insert on public.evaluation_comments to authenticated;
   grant select, insert, update, delete on public.evaluation_comments to service_role;
   ```
   `select+insert` only for `authenticated` per migration 08 line 14 (`evaluation_comments` is an append-only ledger; no client-side update/delete).

2. **Default privileges hardening for the `authenticated` role** (prevents F-16-01 recurrence):
   ```sql
   alter default privileges in schema public
     grant select, insert, update, delete on tables to authenticated;
   alter default privileges in schema public
     grant usage, select on sequences to authenticated;
   ```
   `service_role` default privileges were already in place via `database/_fix_service_role_grants.sql:28-30`. This patch closes the same gap for `authenticated`. Any future migration-created table now inherits grants automatically.

## PROD verification (2026-05-11 20:29 UTC)

Captured from `RAISE NOTICE` emissions in `20260511192400_verify_evaluation_comments_grants.sql` during `supabase db push --linked --debug`.

### `information_schema.table_privileges` — `public.evaluation_comments`

| grantee       | privilege_type |
| ------------- | -------------- |
| authenticated | INSERT         |
| authenticated | SELECT         |
| service_role  | DELETE         |
| service_role  | INSERT         |
| service_role  | SELECT         |
| service_role  | UPDATE         |

Expected: `authenticated -> INSERT, SELECT` ; `service_role -> DELETE, INSERT, SELECT, UPDATE`. **MATCH.**

### `pg_default_acl` — schema `public`

| role     | obj_type        | acl                                                       |
| -------- | --------------- | --------------------------------------------------------- |
| postgres | S (sequence)    | `{authenticated=rU/postgres,service_role=rU/postgres}`    |
| postgres | f (function)    | `{service_role=X/postgres}`                               |
| postgres | r (table/view)  | `{authenticated=arwd/postgres,service_role=arwd/postgres}` |

Default privileges for tables: `arwd` = INSERT (`a`), SELECT (`r`), UPDATE (`w`), DELETE (`d`) — present for both `authenticated` and `service_role`. **Future tables in `public` will auto-inherit grants for both roles.** Hardening confirmed.

## Commits

| SHA       | Branch | Message |
| --------- | ------ | ------- |
| `f6a30e1` | main   | `fix(db): grant select+insert on evaluation_comments to authenticated (quick-260511-sbt)` |
| `f48cb8e` | main   | `chore(db): sync supabase/migrations + verify probe for F-16-01 (quick-260511-sbt)` |

Pushed to `origin/main` (`d90b5df..f48cb8e`). "Default = ship + push" policy honored.

## Cardinals EIC (R1/R2/R3) preservation

Server-side database GRANT statements only. **No app code touched.** No Player-facing surface modified. No scoring change. No inter-mission gating. **R1 / R2 / R3 preserved by construction** — pure-grant migration, no RLS `using` clause change, no policy rewrite.

## Out-of-scope discovery (not fixed by this quick)

`supabase/migrations/20260511000000_reapply_seed_t3_polish_refonte.sql` has a SQL syntax error (Postgres E-string concatenation literal not allowed at top level — `42601`). It was marked `applied` via `supabase migration repair` to unblock the push for our fix, since that migration's content was applied to PROD by an earlier session (per Phase 10 notes) via the SQL editor and only the local mirror is broken. **Not addressed here** — scope = F-16-01 only. Logged in `deferred-items.md`.

Similarly, 4 remote-only migrations (`20260510193421`, `20260510193439`, `20260510230211`, `20260511003139`) were marked `reverted` to unblock the push. These were applied directly in the SQL editor and have no local mirror. They reflect schema state in PROD already; nothing to roll back. Logged in `deferred-items.md`.

## Next steps

1. Mentor M01 should now be able to SELECT + INSERT into `evaluation_comments` async from the mentor UI without HTTP 403. **To confirm during pilote 13-14 mai 2026** via the mentor smoke loop on `/mentor/submission/[id]`.
2. Track deferred items above (broken local migration mirror + 4 untracked remote migrations) for cleanup post-pilote in milestone v0.3.

## Self-Check: PASSED

- FOUND: `database/migrations/202605111923_fix_evaluation_comments_grants.sql`
- FOUND: `supabase/migrations/20260511192300_fix_evaluation_comments_grants.sql`
- FOUND: `supabase/migrations/20260511192400_verify_evaluation_comments_grants.sql`
- FOUND: `.planning/quick/260511-sbt-fix-rls-evaluation-comments-bug-f-16-01/260511-sbt-SUMMARY.md`
- FOUND: `.planning/quick/260511-sbt-fix-rls-evaluation-comments-bug-f-16-01/deferred-items.md`
- FOUND commit `f6a30e1` (fix migration)
- FOUND commit `f48cb8e` (supabase mirror + verify probe)
- PROD verification NOTICE captured live during `supabase db push --debug` — `authenticated -> INSERT, SELECT` confirmed.
