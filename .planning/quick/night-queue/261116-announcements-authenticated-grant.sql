-- PROPOSAL ONLY - NOT APPLIED TO PROD. Needs Omar's approval before apply_migration.
-- Project: vzzbjxmfkmvqkaqxalhr (EntrepreneurGame, eu-west-1)
-- Date: 2026-11-16 (Idea'Wave day 1)
--
-- Problem: in prod the `authenticated` role has NO table privileges on
-- public.announcements (only anon=SELECT, service_role, postgres). PostgREST
-- therefore returns 403 / 42501 before RLS is evaluated:
--   GET /rest/v1/announcements?...&event_id=eq.7d553162-... -> 403 (11 hits 09:00-10:30 UTC)
-- Impact: lib/announcements.ts:getRecentAnnouncements swallows the error and
-- returns [] -> every signed-in user (player/mentor/GM) sees no announcements,
-- and the GM composer insert (app/actions.ts ~L1633) fails with permission denied.
--
-- Intended state per repo: database/rls.sql L322-323 grants select/insert/update/delete
-- on all public tables to authenticated. The table drifted (created/re-created after
-- that blanket grant was last run). RLS policies already gate access:
--   announcements_audience_select (SELECT, audience-filtered)
--   announcements_gm_insert / _gm_update / _gm_delete (is_game_master())
-- so restoring the grant does not widen visibility beyond the existing policies.

grant select, insert, update, delete on public.announcements to authenticated;

-- Verify after apply (SELECT only):
-- select grantee, string_agg(privilege_type, ',') from information_schema.role_table_grants
--  where table_schema='public' and table_name='announcements' group by grantee;
-- Rollback:
-- revoke select, insert, update, delete on public.announcements from authenticated;
