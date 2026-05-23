-- D3: Restrict EXECUTE on 11 SECURITY DEFINER functions to authenticated only.
-- Post-mortem section D line 123. Scope per L131: anon only (authenticated retains).
--
-- Initial naive attempt (REVOKE FROM anon) was a NO-OP because anon never had
-- an explicit grant — EXECUTE was inherited from PUBLIC (Postgres default).
-- Correct pattern: REVOKE FROM PUBLIC then GRANT TO authenticated. anon is
-- still a PUBLIC member but PUBLIC no longer has EXECUTE, so anon is denied.
-- authenticated gets explicit grant. service_role bypasses all (set up by
-- Supabase platform default, not affected here).
--
-- Safety check (orchestrator-confirmed 2026-05-23): zero .rpc() calls in
-- client/server code to these functions. All 11 are RLS helpers, triggers,
-- or server-action callbacks via service_role.

REVOKE EXECUTE ON FUNCTION public.current_app_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_auto_eval_fiches_entretien() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_auto_eval_fiches_entretien() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_game_master() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_game_master() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_juror(p_event_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_juror(p_event_id uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_mentor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_mentor() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_my_player(p_player_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_my_player(p_player_id uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.on_evaluation_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.on_evaluation_change() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.on_evaluation_engagement_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.on_evaluation_engagement_change() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.on_submission_engagement_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.on_submission_engagement_change() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recalc_player_engagement(p_player_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalc_player_engagement(p_player_id uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recalc_player_score(p_player_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalc_player_score(p_player_id uuid) TO authenticated;
