-- ============================================================================
-- Soft reset post smoke E2E - GARDE les comptes test pour re-runs futurs
-- ============================================================================
-- A executer dans Supabase SQL editor APRES un smoke run, pour repartir d'un
-- etat "vierge" sans recreer les utilisateurs ni les players.
--
-- Effets :
--   1. Reset events.results_published_at -> NULL (re-test du gate possible)
--   2. DELETE pitch_scores (re-test jury upsert possible)
--   3. DELETE evaluations + submissions (re-test V1/V2 possible)
--
-- GARDE :
--   - players (test-alpha, test-beta, rls-test-a, rls-test-b)
--   - player_members (les liens user <-> player)
--   - profiles (les 8 *@test.local restent)
--   - auth.users (les 8 comptes Supabase Auth restent)
--
-- Idempotent : peut etre re-execute sans erreur.
-- ============================================================================

begin;

-- 1. Reset publication.
update public.events
   set results_published_at = null
 where results_published_at is not null;

-- 2. pitch_scores des 4 equipes test (Test Alpha + Beta + RLS Test A + B).
delete from public.pitch_scores
 where player_id in (
   select id from public.players where slug in ('test-alpha','test-beta','rls-test-a','rls-test-b')
 );

-- 3. evaluations puis submissions (FK order).
delete from public.evaluations
 where submission_id in (
   select id from public.submissions
    where player_id in (
      select id from public.players where slug in ('test-alpha','test-beta','rls-test-a','rls-test-b')
    )
 );

delete from public.submissions
 where player_id in (
   select id from public.players where slug in ('test-alpha','test-beta','rls-test-a','rls-test-b')
 );

-- 4. Reset score_project (sera recompute par trigger sur prochaine evaluation,
-- mais on remet a 0 pour partir propre).
update public.players
   set score_project = 0,
       score_engagement = 0,
       onboarded_at = null
 where slug in ('test-alpha','test-beta');

-- Sanity checks.
select 'players_test' as label, count(*) as n from public.players where slug like 'test-%' or slug like 'rls-test-%'
union all select 'profiles_test_local', count(*) from public.profiles where email like '%@test.local'
union all select 'pitch_scores_test', count(*) from public.pitch_scores where player_id in (
  select id from public.players where slug in ('test-alpha','test-beta','rls-test-a','rls-test-b')
)
union all select 'submissions_test', count(*) from public.submissions where player_id in (
  select id from public.players where slug in ('test-alpha','test-beta','rls-test-a','rls-test-b')
)
union all select 'events_published', count(*) from public.events where results_published_at is not null;

commit;

-- Apres execution :
-- - alpha.leader@test.local / AlphaLead2026! peut re-faire l'onboarding (onboarded_at = null)
-- - mentor (GM omar) peut re-evaluer les V1/V2 quand Player A re-soumet
-- - GM peut re-publier les resultats
-- - Les comptes Supabase Auth restent (pas besoin de re-creer)
