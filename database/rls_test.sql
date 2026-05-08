-- ============================================================================
-- RLS test suite - DATA-02 (Phase 5 / Plan 03)
-- ============================================================================
-- Purpose:
--   Prouver, avant le pilote 13 mai 2026, que les policies RLS de
--   database/rls.sql empechent les fuites de donnees inter-Player et
--   les escalations de privilege Mentor / Player / GameMaster.
--
-- Pre-requis (a faire UNE fois avant d'executer ce script) :
--   1. Aller sur /admin/players/import (URL prod) et importer 2 equipes
--      factices "RLS Test A" et "RLS Test B" + 1 mentor factice. Le
--      GameMaster est un compte deja existant (omar.ameur98@gmail.com).
--   2. Recuperer dans Supabase Dashboard > Authentication > Users les UUIDs
--      des 4 comptes. Renseigner les 4 placeholders ci-dessous.
--   3. Coller ce fichier dans le SQL editor Supabase, executer.
--   4. Pour chaque scenario, comparer la sortie a la ligne `-- EXPECT:` et
--      cocher dans RLS-TEST-RESULTS.md.
--
-- Important:
--   - Le script est idempotent : les INSERTs OK sont rolled back (begin/rollback).
--   - Les INSERTs qui doivent echouer sont attrapes par EXCEPTION WHEN OTHERS
--     pour ne pas casser la session SQL editor.
--   - Le script ne consomme jamais le service_role : on simule auth.uid() via
--     set_config('request.jwt.claims', ...) selon le pattern Supabase officiel.
--     Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Configuration : renseigner les 4 UUIDs avant execution
-- ----------------------------------------------------------------------------

-- A REMPLACER par les UUIDs recuperes dans Authentication > Users :
--   user_a : leader Player A (RLS Test A)
--   user_b : leader Player B (RLS Test B)
--   user_m : Mentor factice
--   user_g : GameMaster (compte Omar)

\set user_a '00000000-0000-0000-0000-000000000001'
\set user_b '00000000-0000-0000-0000-000000000002'
\set user_m '00000000-0000-0000-0000-000000000003'
\set user_g '00000000-0000-0000-0000-000000000004'

-- ----------------------------------------------------------------------------
-- 1. Resolution des player_id a partir des leader user_id
-- ----------------------------------------------------------------------------
-- Note : les UUIDs des players sont generes a l'import ; on les retrouve via
-- player_members.user_id.

do $$
declare
  user_a uuid := :'user_a';
  user_b uuid := :'user_b';
  user_m uuid := :'user_m';
  user_g uuid := :'user_g';
  player_a uuid;
  player_b uuid;
  prof_a public.app_role;
  prof_b public.app_role;
  prof_m public.app_role;
  prof_g public.app_role;
begin
  select pm.player_id into player_a
    from public.player_members pm
   where pm.user_id = user_a
   limit 1;

  select pm.player_id into player_b
    from public.player_members pm
   where pm.user_id = user_b
   limit 1;

  select app_role into prof_a from public.profiles where user_id = user_a;
  select app_role into prof_b from public.profiles where user_id = user_b;
  select app_role into prof_m from public.profiles where user_id = user_m;
  select app_role into prof_g from public.profiles where user_id = user_g;

  raise notice '------------------------------------------------------------';
  raise notice 'RLS test setup';
  raise notice '  user_a=%  player_a=%  role=%', user_a, player_a, prof_a;
  raise notice '  user_b=%  player_b=%  role=%', user_b, player_b, prof_b;
  raise notice '  user_m=%  role=%', user_m, prof_m;
  raise notice '  user_g=%  role=%', user_g, prof_g;
  raise notice '------------------------------------------------------------';

  if player_a is null or player_b is null then
    raise exception 'Player A ou Player B introuvable. Lancer /admin/players/import d''abord.';
  end if;
  if prof_m is distinct from 'mentor'::public.app_role
     and prof_m is distinct from 'game_master'::public.app_role then
    raise warning 'Le profil mentor (%) n''a pas le role mentor/game_master. Mettre a jour profiles.app_role.', user_m;
  end if;
  if prof_g is distinct from 'game_master'::public.app_role then
    raise warning 'Le profil GM (%) n''a pas le role game_master.', user_g;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- Helper : impersonate(user_uuid)
-- ----------------------------------------------------------------------------
-- A executer en tete de chaque scenario pour simuler auth.uid()=user.

create or replace function public._rls_impersonate(p_user uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user::text, 'role', 'authenticated')::text,
    true);
  perform set_config('request.jwt.claim.sub', p_user::text, true);
end;
$$;

-- ============================================================================
-- SCENARIO 1 : Player A SELECT submissions
-- EXPECT : visible_count == count des submissions de player_a uniquement.
-- ============================================================================

begin;
  set local role authenticated;
  select public._rls_impersonate(:'user_a'::uuid);

  select 'S1 visible_to_a' as label,
         count(*) as visible_count,
         count(*) filter (where player_id::text <> (
           select pm.player_id::text from public.player_members pm
            where pm.user_id = :'user_a'::uuid limit 1)) as leak_count
    from public.submissions;
  -- EXPECT: leak_count = 0
rollback;

-- ============================================================================
-- SCENARIO 2 : Player A SELECT submissions WHERE player_id = player_b
-- EXPECT : 0 rows.
-- ============================================================================

begin;
  set local role authenticated;
  select public._rls_impersonate(:'user_a'::uuid);

  select 'S2 a_sees_b' as label, count(*) as cnt
    from public.submissions s
   where s.player_id = (
     select pm.player_id from public.player_members pm
      where pm.user_id = :'user_b'::uuid limit 1);
  -- EXPECT: cnt = 0
rollback;

-- ============================================================================
-- SCENARIO 3 : Player A INSERT submission avec player_id = player_b
-- EXPECT : RLS denied (new row violates row-level security).
-- ============================================================================

do $$
declare
  v_player_b uuid;
  v_template uuid;
begin
  select pm.player_id into v_player_b
    from public.player_members pm
   where pm.user_id = :'user_b'::uuid limit 1;

  select id into v_template from public.deliverable_templates limit 1;
  if v_template is null then
    raise notice 'S3 SKIP : aucun deliverable_template en base.';
    return;
  end if;

  begin
    set local role authenticated;
    perform public._rls_impersonate(:'user_a'::uuid);

    insert into public.submissions(player_id, template_id, submitted_by, kind, status, payload_url)
    values (v_player_b, v_template, :'user_a'::uuid, 'proof_url', 'submitted_v1', 'https://example.com/rls-test');

    raise warning 'S3 FAIL : INSERT a reussi alors qu''il devrait etre bloque.';
  exception
    when insufficient_privilege or check_violation then
      raise notice 'S3 PASS : RLS a bloque l''INSERT (%).', sqlerrm;
    when others then
      -- Postgres rapporte les violations RLS via SQLSTATE 42501 (insufficient_privilege)
      -- ou via 'new row violates row-level security policy'.
      if sqlerrm like '%row-level security%' or sqlerrm like '%violates%' then
        raise notice 'S3 PASS : RLS a bloque l''INSERT (%).', sqlerrm;
      else
        raise warning 'S3 ERROR INATTENDU : %', sqlerrm;
      end if;
  end;
end $$;

-- ============================================================================
-- SCENARIO 4 : Player A INSERT submission propre (player_id=player_a, submitted_by=user_a)
-- EXPECT : success (puis rollback pour idempotence).
-- ============================================================================

do $$
declare
  v_player_a uuid;
  v_template uuid;
begin
  select pm.player_id into v_player_a
    from public.player_members pm
   where pm.user_id = :'user_a'::uuid limit 1;

  select id into v_template from public.deliverable_templates limit 1;
  if v_template is null then
    raise notice 'S4 SKIP : aucun deliverable_template.';
    return;
  end if;

  begin
    set local role authenticated;
    perform public._rls_impersonate(:'user_a'::uuid);

    insert into public.submissions(player_id, template_id, submitted_by, kind, status, payload_url)
    values (v_player_a, v_template, :'user_a'::uuid, 'proof_url', 'submitted_v1', 'https://example.com/rls-test-self');

    raise notice 'S4 PASS : INSERT propre accepte par RLS.';
    raise exception 'rollback-ok';
  exception
    when sqlstate 'P0001' then
      -- raise exception 'rollback-ok' deliberement leve pour rollback
      null;
    when others then
      raise warning 'S4 FAIL : INSERT propre rejete (%).', sqlerrm;
  end;
end $$;

-- ============================================================================
-- SCENARIO 5 : Mentor SELECT submissions
-- EXPECT : count >= count(scenario 1) -> Mentor voit toutes les submissions.
-- ============================================================================

begin;
  set local role authenticated;
  select public._rls_impersonate(:'user_m'::uuid);

  select 'S5 mentor_sees_all' as label, count(*) as cnt
    from public.submissions;
  -- EXPECT: cnt >= visible_count(S1)
rollback;

-- ============================================================================
-- SCENARIO 6 : Mentor INSERT pitch_score juror_id = user_m
-- EXPECT : success.
-- ============================================================================

do $$
declare
  v_player_a uuid;
begin
  select pm.player_id into v_player_a
    from public.player_members pm
   where pm.user_id = :'user_a'::uuid limit 1;

  begin
    set local role authenticated;
    perform public._rls_impersonate(:'user_m'::uuid);

    insert into public.pitch_scores(juror_id, player_id, score_problem, score_solution, score_market, score_business_model, score_pitch)
    values (:'user_m'::uuid, v_player_a, 15, 15, 15, 15, 15)
    on conflict (juror_id, player_id) do update set score_pitch = excluded.score_pitch;

    raise notice 'S6 PASS : Mentor INSERT/UPSERT pitch_score accepte.';
    raise exception 'rollback-ok';
  exception
    when sqlstate 'P0001' then null;
    when others then
      raise warning 'S6 FAIL : INSERT mentor rejete (%).', sqlerrm;
  end;
end $$;

-- ============================================================================
-- SCENARIO 7 : Mentor INSERT pitch_score avec juror_id = user_a (spoofing)
-- EXPECT : RLS denied.
-- ============================================================================

do $$
declare
  v_player_a uuid;
begin
  select pm.player_id into v_player_a
    from public.player_members pm
   where pm.user_id = :'user_a'::uuid limit 1;

  begin
    set local role authenticated;
    perform public._rls_impersonate(:'user_m'::uuid);

    insert into public.pitch_scores(juror_id, player_id, score_problem, score_solution, score_market, score_business_model, score_pitch)
    values (:'user_a'::uuid, v_player_a, 10, 10, 10, 10, 10);

    raise warning 'S7 FAIL : INSERT spoof juror_id accepte.';
  exception
    when others then
      if sqlerrm like '%row-level security%' or sqlerrm like '%violates%' then
        raise notice 'S7 PASS : RLS a bloque le spoof juror_id (%).', sqlerrm;
      else
        raise warning 'S7 ERROR INATTENDU : %', sqlerrm;
      end if;
  end;
end $$;

-- ============================================================================
-- SCENARIO 8 : GameMaster UPDATE players.score_project
-- EXPECT : success.
-- ============================================================================

do $$
declare
  v_player_a uuid;
begin
  select pm.player_id into v_player_a
    from public.player_members pm
   where pm.user_id = :'user_a'::uuid limit 1;

  begin
    set local role authenticated;
    perform public._rls_impersonate(:'user_g'::uuid);

    update public.players
       set score_project = score_project
     where id = v_player_a;

    raise notice 'S8 PASS : GM UPDATE players accepte.';
    raise exception 'rollback-ok';
  exception
    when sqlstate 'P0001' then null;
    when others then
      raise warning 'S8 FAIL : GM UPDATE rejete (%).', sqlerrm;
  end;
end $$;

-- ============================================================================
-- SCENARIO 9 : Player A SELECT pitch_scores WHERE player_id = player_b
-- EXPECT : 0 rows.
-- ============================================================================

begin;
  set local role authenticated;
  select public._rls_impersonate(:'user_a'::uuid);

  select 'S9 a_sees_b_scores' as label, count(*) as cnt
    from public.pitch_scores ps
   where ps.player_id = (
     select pm.player_id from public.player_members pm
      where pm.user_id = :'user_b'::uuid limit 1);
  -- EXPECT: cnt = 0
rollback;

-- ============================================================================
-- SCENARIO 10 : Player A SELECT events
-- EXPECT : >= 1 row (events.authenticated_select policy).
-- ============================================================================

begin;
  set local role authenticated;
  select public._rls_impersonate(:'user_a'::uuid);

  select 'S10 events_visible' as label, count(*) as cnt from public.events;
  -- EXPECT: cnt >= 1
rollback;

-- ============================================================================
-- Cleanup
-- ============================================================================

drop function if exists public._rls_impersonate(uuid);

-- Reminder pour l'operateur :
--   Cocher chaque scenario dans RLS-TEST-RESULTS.md.
--   Si un scenario echoue (FAIL ou ERROR INATTENDU), NE PAS deployer en prod
--   et ouvrir un blocker dans .planning/STATE.md.
