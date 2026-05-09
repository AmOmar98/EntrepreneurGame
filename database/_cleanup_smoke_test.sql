-- ============================================================================
-- Cleanup post smoke E2E (T17) - Phase 5 / Plan 03 / SMOKE-TEST-E2E.md section 10
-- ============================================================================
-- A executer dans Supabase SQL editor APRES validation du smoke et AVANT
-- l'ouverture du pilote 13 mai 2026.
--
-- Effets :
--   1. Reset events.results_published_at -> NULL (pour pouvoir re-publier au jour J)
--   2. DELETE pitch_scores des 4 equipes test (Test Alpha + Beta + RLS Test A + B)
--   3. DELETE evaluations + submissions des 4 equipes
--   4. DELETE player_members des 4 equipes
--   5. DELETE players "test-alpha", "test-beta", "rls-test-a", "rls-test-b"
--   6. DELETE profiles des 8 utilisateurs test (*@test.local)
--
-- ENSUITE (action manuelle hors SQL) :
--   - Supabase Dashboard -> Authentication -> Users -> supprimer les 8 comptes
--     *@test.local (alpha.leader, alpha.team, beta.leader, beta.team,
--      mentor@test.local, gm@test.local, player@test.local, player-b@test.local).
--
-- Idempotent : peut etre re-execute sans erreur si certaines lignes ont deja
-- ete supprimees (pas de "row not found" puisqu'on filtre par predicat).
-- ============================================================================

begin;

-- 1. Reset publication.
update public.events
   set results_published_at = null
 where results_published_at is not null;

-- 2-5. Delete cascade - on remonte des feuilles vers la racine.
-- pitch_scores depend de (event_id, player_id, juror_id) - cascade non garanti.
delete from public.pitch_scores
 where player_id in (
   select id from public.players where slug in ('test-alpha','test-beta','rls-test-a','rls-test-b')
 );

-- evaluations depend de submission_id - cascade FK probable, on retire explicitement.
delete from public.evaluations
 where submission_id in (
   select id from public.submissions
    where player_id in (
      select id from public.players where slug in ('test-alpha','test-beta','rls-test-a','rls-test-b')
    )
 );

-- submissions
delete from public.submissions
 where player_id in (
   select id from public.players where slug in ('test-alpha','test-beta','rls-test-a','rls-test-b')
 );

-- player_members
delete from public.player_members
 where player_id in (
   select id from public.players where slug in ('test-alpha','test-beta','rls-test-a','rls-test-b')
 );

-- players
delete from public.players
 where slug in ('test-alpha','test-beta','rls-test-a','rls-test-b');

-- 6. profiles - 8 emails *@test.local.
delete from public.profiles
 where email in (
   'alpha.leader@test.local',
   'alpha.team@test.local',
   'beta.leader@test.local',
   'beta.team@test.local',
   'mentor@test.local',
   'gm@test.local',
   'player@test.local',
   'player-b@test.local'
 );

-- Sanity checks (informational - ne fail pas la transaction).
select 'players_remaining' as label, count(*) as n from public.players
union all select 'profiles_remaining_test_local', count(*) from public.profiles where email like '%@test.local'
union all select 'pitch_scores_total', count(*) from public.pitch_scores
union all select 'submissions_total', count(*) from public.submissions
union all select 'events_published', count(*) from public.events where results_published_at is not null;

commit;
