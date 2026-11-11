# Verification — `261111-db1`

**Verified (UTC):** `2026-11-11T13:43:30Z`

| Check | Command / Tool | Verdict | Evidence |
|---|---|---|---|
| **Trigger Function Syntax on PG 17** | `execute_sql` (`BEGIN; ... ROLLBACK;` on `vzzbjxmfkmvqkaqxalhr`) | **PASS** | `public.set_updated_at()` and `public.guard_player_onboarding()` compiled with zero errors. |
| **RLS Initplan Static Check** | `node scripts/perf-p95.mjs --check-rls` | **PASS** | Exit code `0` (`all auth.uid() calls in EXISTS subqueries use (SELECT auth.uid()) initplan form`). |
| **Authenticated Trigger Execution after REVOKE** | `execute_sql` (`SET LOCAL ROLE authenticated; UPDATE public.submissions ...; ROLLBACK;`) | **PASS** | `UPDATE public.submissions` as `authenticated` (`561599b3-...`) succeeded and executed `on_submission_engagement_change` -> `recalc_player_engagement` -> `get_event_setting_int` as `postgres` (`SECURITY DEFINER`). |
| **Migration Applied in PROD** | `apply_migration` + `list_migrations` (`vzzbjxmfkmvqkaqxalhr`) | **PASS** | Version `20261111134235` (`revoke_authenticated_execute_internal_secdef`) recorded in `schema_migrations` (32 total migrations). |
| **Supabase Security Advisor Check** | `get_advisors(type: "security")` (`vzzbjxmfkmvqkaqxalhr`) | **PASS** | `0029_authenticated_security_definer_function_executable` reduced from **13** to **6** (all 7 trigger/internal recalc functions removed). |
| **Application Gates** | `node scripts/agent-ops.mjs gates --with-tests` | **PASS** | `R1=PASS`, `R2=PASS`, `R3=PASS`, `typecheck=PASS`, `lint=PASS`, `test:unit=PASS`. |
