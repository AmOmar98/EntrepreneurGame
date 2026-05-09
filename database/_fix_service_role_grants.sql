-- ============================================================================
-- Hotfix : restaurer les grants service_role apres "drop schema public cascade"
-- ============================================================================
-- A executer dans Supabase SQL editor, prod DB.
--
-- Diagnostic : runtime logs Vercel 2026-05-09 22:25 -> "[results] cohorts
-- query failed" / Postgres 42501 / permission denied via service-role client
-- (clef rotee verifiee = bonne service_role JWT).
--
-- Cause : schema.sql ligne 4-6 indique de faire "drop schema public cascade;
-- create schema public;" puis "grant usage on schema public to anon,
-- authenticated, service_role;". Cette derniere ligne a ete omise lors de
-- l'application sur prod -> service_role n'a plus USAGE sur public ->
-- permission denied meme avec BYPASSRLS.
--
-- Effet : service_role retrouve tous les grants standards sur public, comme
-- dans une fresh Supabase project.
--
-- Idempotent : peut etre re-execute sans erreur.
-- ============================================================================

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Default privileges pour les tables/sequences/functions futures (schema v2).
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- Sanity check : doit retourner au moins 4 lignes (cohorts, players, pitch_scores, events).
select grantee, table_schema, table_name, privilege_type
  from information_schema.table_privileges
 where grantee = 'service_role'
   and table_schema = 'public'
   and privilege_type = 'SELECT'
 order by table_name
 limit 20;
