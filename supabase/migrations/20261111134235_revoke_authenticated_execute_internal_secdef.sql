-- ============================================================================
-- Migration: 20261111134000_revoke_authenticated_execute_internal_secdef.sql
-- Purpose:   Harden internal & trigger SECURITY DEFINER functions against direct
--            PostgREST RPC invocation by `authenticated` or `anon` users
--            (Supabase Security Advisor 0029_authenticated_security_definer_function_executable).
--
-- Context:
--   - 6 SECURITY DEFINER boolean/role helpers (`current_app_role`, `is_game_master`,
--     `is_mentor`, `is_my_player`, `is_juror`, `is_in_org`) are evaluated directly
--     inside RLS policies during `authenticated` queries and MUST remain executable
--     by `authenticated`.
--   - 7 SECURITY DEFINER functions are either table trigger functions (`RETURNS trigger`)
--     or internal score/engagement recalculation helpers called exclusively from inside
--     those SECURITY DEFINER triggers (`owner = postgres`). None of these 7 functions
--     are called via `.rpc()` by client or server application code, and exposing
--     `recalc_player_score(uuid)`, `recalc_player_engagement(uuid)`, or
--     `get_event_setting_int(uuid, text, integer)` to `authenticated` allowed arbitrary
--     RPC invocation across players/events.
-- ============================================================================

BEGIN;

-- 1. Trigger functions (executed by Postgres trigger firing, never via PostgREST RPC)
REVOKE EXECUTE ON FUNCTION public.fn_auto_eval_fiches_entretien() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_auto_eval_fiches_entretien() TO service_role;

REVOKE EXECUTE ON FUNCTION public.on_evaluation_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.on_evaluation_change() TO service_role;

REVOKE EXECUTE ON FUNCTION public.on_evaluation_engagement_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.on_evaluation_engagement_change() TO service_role;

REVOKE EXECUTE ON FUNCTION public.on_submission_engagement_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.on_submission_engagement_change() TO service_role;

-- 2. Internal score/engagement recalculation & setting lookup helpers
--    (invoked inside SECURITY DEFINER trigger functions owned by postgres)
REVOKE EXECUTE ON FUNCTION public.recalc_player_score(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalc_player_score(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.recalc_player_engagement(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalc_player_engagement(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_event_setting_int(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_setting_int(uuid, text, integer) TO service_role;

COMMIT;
