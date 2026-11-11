# Repair declarative bootstrap mirrors (`DB-01`) & harden internal `SECURITY DEFINER` RPC exposure (`Advisor 0029`)

Started 2026-11-11 under quick ID `261111-db1`.

## Objective

1. **Repair `DB-01` Declarative Bootstrap Defects (`F1` in `docs/REPO_AUDIT.md`):**
   - Fix malformed dollar-quoting (`as $` -> `as $$`) in `database/triggers.sql:12` and `database/triggers.sql:156`.
   - Add bootstrap-safe existence guards (`to_regclass` / `to_regprocedure`) in `database/rls.sql` around objects created in later migrations (`announcements`, `help_requests`, `jurors`, `is_juror`, `pitch_mode_state`, engagement/auto-eval triggers) so `schema.sql -> triggers.sql -> rls.sql` executes cleanly both on a fresh empty database (before `supabase db push`) and when re-applied after migrations.
2. **Harden Internal `SECURITY DEFINER` Functions (`Advisor 0029`):**
   - Author and apply `supabase/migrations/20261111134000_revoke_authenticated_execute_internal_secdef.sql` to revoke `EXECUTE` from `PUBLIC, anon, authenticated` (retaining `postgres` and `service_role`) on the 7 internal/trigger `SECURITY DEFINER` functions that must never be callable via PostgREST `/rest/v1/rpc/...`:
     - `public.fn_auto_eval_fiches_entretien()`
     - `public.on_evaluation_change()`
     - `public.on_evaluation_engagement_change()`
     - `public.on_submission_engagement_change()`
     - `public.recalc_player_score(uuid)`
     - `public.recalc_player_engagement(uuid)`
     - `public.get_event_setting_int(uuid, text, integer)`
   - Mirror this hardening in `database/rls.sql` and `database/MANIFEST.md`.

## Verification

- Verify `database/triggers.sql` and `database/rls.sql` syntax and execution inside a `BEGIN; ... ROLLBACK;` transaction on Postgres 17 (`vzzbjxmfkmvqkaqxalhr`).
- Apply migration `20261111134000_revoke_authenticated_execute_internal_secdef` and verify with `get_advisors(type: "security")` that the 7 internal/trigger functions are eliminated from `0029_authenticated_security_definer_function_executable` (leaving only the 6 boolean/role RLS policy helpers that `authenticated` must execute during RLS policy evaluation).
- Verify that `authenticated` `UPDATE` on `public.submissions` still triggers `on_submission_engagement_change` -> `recalc_player_engagement` -> `get_event_setting_int` without error.
