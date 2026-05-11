-- ============================================================================
-- Hotfix F-16-01 : grant evaluation_comments privileges to authenticated
-- ============================================================================
-- A executer dans Supabase SQL editor, prod DB (ou via supabase db push).
--
-- Diagnostic : Phase 16 finding F-16-01 -> Mentor users hit HTTP 403
-- "permission denied for table evaluation_comments" (SQLSTATE 42501) when
-- attempting to SELECT or INSERT comments from the mentor UI.
--
-- Cause : rls.sql:267-269 effectue un bulk
--   "grant select, insert, update, delete on all tables in schema public to
--    authenticated"
-- mais cette commande est one-shot et ne s'applique qu'aux tables existant
-- au moment de son execution. La table public.evaluation_comments a ete
-- creee plus tard via database/migrations/08-mentor-comments.sql, laquelle
-- a oublie d'ajouter le grant explicite par-table -- contrairement a
-- database/bonus_events.sql:143-144 qui fait :
--   "grant select, insert, update, delete on public.bonus_events to
--    authenticated;"
--
-- Resultat : RLS policies "evaluation_comments_member_or_mentor_select" /
-- "evaluation_comments_mentor_self_insert" sont en place mais le role
-- authenticated n'a meme pas le table-level GRANT requis avant que RLS
-- soit evaluee -> 42501 leve avant la verification de policy.
--
-- Append-only : per migration 08 ligne 14, evaluation_comments est un
-- ledger append-only ; on grant uniquement select + insert pour
-- authenticated (pas update/delete). Le GameMaster delete via une
-- policy RLS distincte cote service_role.
--
-- Hardening : on definit aussi ALTER DEFAULT PRIVILEGES pour le role
-- authenticated, sur le modele de _fix_service_role_grants.sql:28-30
-- (deja en place pour service_role). Toute table future creee dans
-- schema public heritera automatiquement des grants authenticated et
-- ne reproduira plus F-16-01.
--
-- Idempotent : GRANT et ALTER DEFAULT PRIVILEGES sont safely re-runnable.
-- ============================================================================

-- 1) Explicit table-level grants on the existing table (fixes F-16-01 now)
grant select, insert on public.evaluation_comments to authenticated;
grant select, insert, update, delete on public.evaluation_comments to service_role;

-- 2) Harden default privileges so future migration-created tables
--    automatically inherit grants for the authenticated role (prevents
--    F-16-01 recurrence). service_role default privileges are already set
--    in _fix_service_role_grants.sql.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- 3) Sanity check (run in Supabase SQL editor after apply):
-- select grantee, privilege_type
--   from information_schema.table_privileges
--  where table_schema = 'public'
--    and table_name = 'evaluation_comments'
--    and grantee in ('authenticated', 'service_role')
--  order by grantee, privilege_type;
-- Expected: authenticated -> INSERT, SELECT
--           service_role  -> DELETE, INSERT, SELECT, UPDATE
