# Audit — Declarative Bootstrap Repair & `SECURITY DEFINER` Hardening (`261111-db1`)

**Audited (UTC):** `2026-11-11T13:42:57Z`

## 1. Declarative Bootstrap Defects (`DB-01` / `F1` in `docs/REPO_AUDIT.md`)

1. **`database/triggers.sql` Dollar-Quoting Mismatch:**
   - Lines 12 (`public.set_updated_at()`) and 156 (`public.guard_player_onboarding()`) opened the PL/pgSQL function body with `as $` while closing with `$$;`, causing a syntax error on execution.
   - **Fix:** Corrected both to `as $$` and added `drop trigger if exists` before each `create trigger` statement for idempotent re-runs.
2. **`database/rls.sql` Migration-Order Dependencies:**
   - `database/rls.sql` referenced `public.announcements`, `public.help_requests`, `public.jurors`, `public.is_juror(uuid)`, `events.pitch_mode_state`, and 5 migration-defined `SECURITY DEFINER` functions without existence guards. Because the documented fresh bootstrap order is `schema.sql -> triggers.sql -> rls.sql -> supabase db push`, running `rls.sql` before `supabase db push` failed on missing relations/functions.
   - **Fix:** Added `to_regclass(...)` and `to_regprocedure(...)` guards in `do $$ begin ... end $$;` blocks (matching the pattern established in `database/triggers.sql:210-227`) and added `drop policy if exists` before all policy definitions.

## 2. Supabase Security Advisor `0029` Hardening

- **Pre-fix state:** `get_advisors(type: "security")` reported 13 `SECURITY DEFINER` functions in `public` executable by `authenticated` via PostgREST `/rest/v1/rpc/...`.
- **Analysis:**
  - **6 functions** (`current_app_role`, `is_game_master`, `is_in_org`, `is_juror`, `is_mentor`, `is_my_player`) are `STABLE` read-only boolean/role helpers evaluated inside RLS policies by `authenticated` queries and must retain `GRANT EXECUTE ... TO authenticated`.
  - **7 functions** (`fn_auto_eval_fiches_entretien`, `on_evaluation_change`, `on_evaluation_engagement_change`, `on_submission_engagement_change`, `recalc_player_score`, `recalc_player_engagement`, `get_event_setting_int`) are table trigger functions or internal recalculation helpers invoked only by those `SECURITY DEFINER` triggers (`owner = postgres`). Exposing `recalc_player_score(uuid)`, `recalc_player_engagement(uuid)`, and `get_event_setting_int(uuid, text, integer)` to `authenticated` allowed any signed-in user to invoke them directly via `/rest/v1/rpc/...`.
- **Post-fix state:** Applied migration `20261111134235_revoke_authenticated_execute_internal_secdef` on `vzzbjxmfkmvqkaqxalhr` and mirrored it in `database/rls.sql`. `get_advisors(type: "security")` count dropped from `13` to `6`.
