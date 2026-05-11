-- ============================================================================
-- Phase 15-02 — Audit RLS cross-cohort / cross-team / anon.
-- ============================================================================
-- PROD-SAFE : SELECT only + transactions begin; ... rollback;.
--             Aucune mutation. Aucune persistance possible.
--
-- Usage : exécution manuelle via Cloud Studio SQL Editor.
--   URL : https://supabase.com/dashboard/project/vzzbjxmfkmvqkaqxalhr/sql/new
--
-- IMPORTANT : Cloud Studio se connecte par défaut en `postgres` (superuser →
-- bypass RLS). Pour simuler une auth Player/Mentor authentifiée, on doit
-- `set local role authenticated` ET `set local request.jwt.claim.sub = <uuid>`
-- DANS chaque transaction.
--
-- Pré-requis (à remplir avant exécution) — utiliser psql variables \set :
--   \set p01_uuid '<UUID du player_member user_id pour p.player1@ueuromed.org>'
--   \set p02_uuid '<UUID du player_member user_id pour p.player2@ueuromed.org>'
--   \set m01_uuid '<UUID du profile user_id pour m.mentor1@ueuromed.org>'
--   \set p02_player_id '<UUID public.players.id du Player de P02>'
--
-- Si \set non disponible (UI Cloud Studio classique), remplacer les :'xxx'
-- par des littéraux UUID directement collés dans les requêtes.
--
-- Policies clés auditées (lecture seule, voir database/rls.sql) :
--   - submissions_member_or_mentor_select (L168) → Player ne voit que ses subs ; Mentor voit tout.
--   - evaluations_member_or_mentor_select (L198) → Player ne voit que evaluations de ses subs.
--   - players_member_or_mentor_select (L126) → Player ne voit que ses Players (player_members) ; Mentor voit tout.
--   - profiles_self_or_mentor_select (L105) → Player voit son profil ; Mentor voit tout.
--   - revoke all on schema public from anon (L266) → anon n'a aucun grant.
--
-- Note CONCERNS.md : la policy `members_same_project_or_staff_select` évoquée
-- dans CONCERNS §"Pilot-grade RLS" N'EXISTE PAS dans le schéma actuel
-- (database/rls.sql utilise `player_members_self_or_mentor_select` L147). À
-- documenter dans le verdict (CONCERNS référence un schéma antérieur "projects").
--
-- Owner : Phase 15-02 executor — 2026-05-11.
-- ============================================================================

\echo '== Phase 15-02 RLS cross-cohort — début exécution =='
\echo ''

-- ============================================================================
-- Scénario 1 : Player A → submissions d'un autre Player B (même cohorte)
-- ============================================================================
-- Attendu : 0 row. Policy `submissions_member_or_mentor_select` filtre via
-- `is_my_player(player_id)` → P01 n'est PAS membre de P02, donc invisible.

begin;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claim.sub', :'p01_uuid', true);
select set_config('request.jwt.claims', json_build_object('sub', :'p01_uuid', 'role', 'authenticated')::text, true);

do $$
declare
  v_count int;
begin
  select count(*) into v_count
    from public.submissions
   where player_id = :'p02_player_id'::uuid;

  if v_count = 0 then
    raise notice 'Scénario 1 : PASS — P01 voit 0 submissions de P02 (RLS narrowing ok)';
  else
    raise notice 'Scénario 1 : FAIL — P01 voit % submissions de P02 (FUITE CROSS-PLAYER, D-16 escalade)', v_count;
  end if;
end $$;
rollback;

-- ============================================================================
-- Scénario 2 : Player A → evaluations d'un autre Player B
-- ============================================================================
-- Attendu : 0 row. Policy `evaluations_member_or_mentor_select` filtre via
-- jointure submissions + is_my_player.

begin;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claim.sub', :'p01_uuid', true);
select set_config('request.jwt.claims', json_build_object('sub', :'p01_uuid', 'role', 'authenticated')::text, true);

do $$
declare
  v_count int;
begin
  select count(*) into v_count
    from public.evaluations e
    join public.submissions s on s.id = e.submission_id
   where s.player_id = :'p02_player_id'::uuid;

  if v_count = 0 then
    raise notice 'Scénario 2 : PASS — P01 voit 0 evaluations de P02';
  else
    raise notice 'Scénario 2 : FAIL — P01 voit % evaluations de P02 (FUITE, D-16 escalade)', v_count;
  end if;
end $$;
rollback;

-- ============================================================================
-- Scénario 3 : Player A → players d'une autre cohorte (multi-cohort scoping)
-- ============================================================================
-- Si une seule cohorte AgreenTech existe → SKIP.
-- Sinon : P01 ne doit voir QUE les Players dont il est member (is_my_player(id)).

begin;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claim.sub', :'p01_uuid', true);
select set_config('request.jwt.claims', json_build_object('sub', :'p01_uuid', 'role', 'authenticated')::text, true);

do $$
declare
  v_cohort_count int;
  v_visible_count int;
  v_my_count int;
begin
  -- compte cohortes (besoin de bypass RLS donc on regarde via une CTE en service_role ?
  -- En pratique : `cohorts_authenticated_select using (true)` donc tous les
  -- authenticated voient le count.)
  select count(*) into v_cohort_count from public.cohorts;

  if v_cohort_count <= 1 then
    raise notice 'Scénario 3 : SKIP — % cohorte(s) en base, test cross-cohort non applicable', v_cohort_count;
    return;
  end if;

  -- combien de Players P01 voit-il au total
  select count(*) into v_visible_count from public.players;
  -- combien de Players P01 est-il membre
  select count(*) into v_my_count from public.player_members where user_id = :'p01_uuid'::uuid;

  if v_visible_count = v_my_count then
    raise notice 'Scénario 3 : PASS — P01 voit % Players (= % memberships, scope correct)', v_visible_count, v_my_count;
  else
    raise notice 'Scénario 3 : FAIL — P01 voit % Players (≠ % memberships, fuite cross-cohort)',
      v_visible_count, v_my_count;
  end if;
end $$;
rollback;

-- ============================================================================
-- Scénario 4 : Mentor → submissions all Players (legitimate visibility)
-- ============================================================================
-- Attendu : > 0. Policy `submissions_member_or_mentor_select` utilise
-- `is_mentor()` qui retourne true pour app_role IN ('mentor','game_master').

begin;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claim.sub', :'m01_uuid', true);
select set_config('request.jwt.claims', json_build_object('sub', :'m01_uuid', 'role', 'authenticated')::text, true);

do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.submissions;

  if v_count > 0 then
    raise notice 'Scénario 4 : PASS — M01 voit % submissions (visibilité Mentor confirmée)', v_count;
  else
    raise notice 'Scénario 4 : WARN/FAIL — M01 voit 0 submissions (soit aucune sub en base, soit policy is_mentor bug)';
  end if;
end $$;
rollback;

-- ============================================================================
-- Scénario 5 : anon (non authentifié) → tables sensibles
-- ============================================================================
-- Attendu : 0 row OU erreur "permission denied".
-- database/rls.sql:266 → `revoke all on schema public from anon` donc anon
-- ne devrait même pas avoir USAGE sur le schéma.

begin;
select set_config('role', 'anon', true);
-- Pas de jwt.claim.sub (anon)
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare
  v_count int;
  v_err text;
begin
  begin
    select count(*) into v_count from public.submissions;
    raise notice 'Scénario 5 : FAIL — anon a pu lire % submissions (revoke schéma cassé ?)', v_count;
  exception when others then
    get stacked diagnostics v_err = MESSAGE_TEXT;
    raise notice 'Scénario 5 : PASS — anon bloqué (erreur attendue : %)', v_err;
  end;
end $$;
rollback;

\echo ''
\echo '== Phase 15-02 RLS cross-cohort — fin exécution =='
\echo 'Reporter les verdicts dans RLS-CROSS-COHORT-VERDICT.md'
\echo ''
\echo 'STOP CONDITION D-16 : Si scénarios 1, 2 ou 5 = FAIL → escalade owner IMMÉDIATE'
\echo '(fuite cross-Player active = go/no-go pilote AgreenTech).'
