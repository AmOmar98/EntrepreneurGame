-- G-08 hotfix: column-level GRANT to prevent priv-esc via profiles.app_role self-update.
-- Probe 2026-05-17 confirmed EXPLOITABLE: any Player could UPDATE profiles SET app_role='game_master' WHERE user_id=auth.uid().
-- Fix: revoke blanket UPDATE on profiles, re-grant column-by-column EXCLUDING app_role, user_id, created_at.
-- Legitimate app_role mutations (e.g. admin promoting a user) must use service_role channel.
-- The existing RLS policy profiles_self_or_gm_update stays as-is (row-level filter).
--
-- Applied via Supabase MCP 2026-05-17 22:48:47 UTC, post-pilot window.
-- Verified: priv-esc UPDATE returns 'permission denied for table profiles', legitimate full_name UPDATE succeeds.

BEGIN;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, email, updated_at) ON public.profiles TO authenticated;

COMMIT;
