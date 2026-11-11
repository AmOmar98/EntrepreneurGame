# Summary — Declarative Bootstrap Repair & `SECURITY DEFINER` Hardening (`261111-db1`)

Completed 2026-11-11 under quick ID `261111-db1`.

## Delivered

1. **Declarative SQL Mirror Repairs (`DB-01`):**
   - Fixed `as $` -> `as $$` dollar-quoting bugs in [`database/triggers.sql`](../../../database/triggers.sql) (`set_updated_at` and `guard_player_onboarding`) and added `drop trigger if exists` guards.
   - Added bootstrap-safe `to_regclass` / `to_regprocedure` guards and `drop policy if exists` statements in [`database/rls.sql`](../../../database/rls.sql) for objects created by later migrations (`announcements`, `help_requests`, `jurors`, `is_juror`, `pitch_mode_state`, and internal/trigger functions).
2. **`SECURITY DEFINER` RPC Hardening (`Advisor 0029`):**
   - Authored and applied [`supabase/migrations/20261111134235_revoke_authenticated_execute_internal_secdef.sql`](../../../supabase/migrations/20261111134235_revoke_authenticated_execute_internal_secdef.sql) to `vzzbjxmfkmvqkaqxalhr` and logged it in [`database/MANIFEST.md`](../../../database/MANIFEST.md).
   - Revoked `EXECUTE` from `PUBLIC, anon, authenticated` (retaining `postgres` and `service_role`) on the 7 internal/trigger `SECURITY DEFINER` functions (`fn_auto_eval_fiches_entretien`, `on_evaluation_change`, `on_evaluation_engagement_change`, `on_submission_engagement_change`, `recalc_player_score`, `recalc_player_engagement`, `get_event_setting_int`).
   - Verified via `get_advisors(type: "security")` that `0029_authenticated_security_definer_function_executable` dropped from **13** to **6** (leaving only the 6 RLS policy boolean/role helpers).
