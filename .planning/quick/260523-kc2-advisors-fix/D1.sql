-- D1: Fix function_search_path_mutable advisor (4 trigger functions)
-- Post-mortem section D line 122. Empty string forces qualification for non-pg_catalog
-- references and blocks search_path hijacking via temp tables.
-- Built-ins like now() resolve via pg_catalog implicitly.

ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.guard_player_onboarding() SET search_path = '';
ALTER FUNCTION public.set_help_requests_updated_at() SET search_path = '';
ALTER FUNCTION public.set_pitch_mode_closed_at() SET search_path = '';
