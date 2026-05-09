-- ============================================================================
-- RLS test run (Phase 5 / Plan 03 - DATA-02)
-- ============================================================================
-- Run via Supabase Management API `db query`.
-- All `set local role authenticated` blocks are isolated; results are written
-- to a regular public table _rls_results (created/owned by postgres) so the
-- outer block can write them after `reset role`.
-- ============================================================================

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

drop table if exists public._rls_results;
create table public._rls_results (
  scenario text primary key,
  expected text not null,
  actual text not null,
  verdict text not null
);

do $outer$
declare
  user_a uuid := '06af6412-7086-405b-a91f-e2b8affe07d8';
  user_b uuid := '27eddceb-dbca-462f-bf22-88512caa7024';
  user_m uuid := '2d8f4f0f-0d99-4aae-b9f0-3e003cee970b';
  user_g uuid := 'e0314b6c-1832-4281-b518-c11266e5749b';
  player_a uuid;
  player_b uuid;
  v_template uuid;
  v_count bigint;
  v_leak bigint;
  v_total_subs bigint;
  v_msg text;
begin
  select pm.player_id into player_a
    from public.player_members pm where pm.user_id = user_a limit 1;
  select pm.player_id into player_b
    from public.player_members pm where pm.user_id = user_b limit 1;
  select id into v_template from public.deliverable_templates limit 1;

  if player_a is null or player_b is null then
    raise exception 'RLS test setup incomplete: player_a=% player_b=%', player_a, player_b;
  end if;

  -- Seed fixtures using superuser role (RLS bypass) so cross-tenant tests have data.
  insert into public.submissions(player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by)
  values (player_a, v_template, 1, 'proof_url', 'https://example.com/rls-fixture-a', 'submitted_v1', user_a)
  on conflict (player_id, deliverable_template_id, version) do nothing;
  insert into public.submissions(player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by)
  values (player_b, v_template, 1, 'proof_url', 'https://example.com/rls-fixture-b', 'submitted_v1', user_b)
  on conflict (player_id, deliverable_template_id, version) do nothing;

  select count(*) into v_total_subs from public.submissions;

  -- ===== S1 : Player A SELECT submissions (only own rows) =====
  set local role authenticated;
  perform public._rls_impersonate(user_a);
  select count(*),
         count(*) filter (where player_id <> player_a)
    into v_count, v_leak
    from public.submissions;
  reset role;
  insert into public._rls_results values (
    'S1 player_a_sees_only_own_submissions',
    'leak=0 and visible>=1',
    format('visible=%s leak=%s', v_count, v_leak),
    case when v_leak = 0 and v_count >= 1 then 'PASS' else 'FAIL' end
  );

  -- ===== S2 : Player A SELECT WHERE player_id = player_b -> 0 =====
  set local role authenticated;
  perform public._rls_impersonate(user_a);
  select count(*) into v_count from public.submissions s where s.player_id = player_b;
  reset role;
  insert into public._rls_results values (
    'S2 player_a_cannot_see_player_b_submissions',
    'cnt=0',
    format('cnt=%s', v_count),
    case when v_count = 0 then 'PASS' else 'FAIL' end
  );

  -- ===== S3 : Player A INSERT spoofed for player_b -> RLS deny =====
  begin
    set local role authenticated;
    perform public._rls_impersonate(user_a);
    insert into public.submissions(player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by)
    values (player_b, v_template, 2, 'proof_url', 'https://example.com/rls-spoof', 'submitted_v1', user_a);
    reset role;
    insert into public._rls_results values (
      'S3 player_a_cannot_insert_for_player_b',
      'RLS denied',
      'INSERT succeeded (UNEXPECTED)',
      'FAIL'
    );
  exception when others then
    v_msg := sqlerrm;
    reset role;
    insert into public._rls_results values (
      'S3 player_a_cannot_insert_for_player_b',
      'RLS denied',
      format('blocked: %s', v_msg),
      case when v_msg ilike '%row-level security%' or v_msg ilike '%violates%' or v_msg ilike '%permission denied%' then 'PASS' else 'FAIL' end
    );
  end;

  -- ===== S4 : Player A INSERT own submission -> success =====
  begin
    set local role authenticated;
    perform public._rls_impersonate(user_a);
    insert into public.submissions(player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by)
    values (player_a, v_template, 2, 'proof_url', 'https://example.com/rls-self-v2', 'submitted_v1', user_a);
    reset role;
    insert into public._rls_results values (
      'S4 player_a_can_insert_own_submission',
      'INSERT success',
      'INSERT accepted',
      'PASS'
    );
  exception when others then
    v_msg := sqlerrm;
    reset role;
    insert into public._rls_results values (
      'S4 player_a_can_insert_own_submission',
      'INSERT success',
      format('blocked: %s', v_msg),
      'FAIL'
    );
  end;

  -- ===== S5 : Mentor SELECT submissions (sees all) =====
  set local role authenticated;
  perform public._rls_impersonate(user_m);
  select count(*) into v_count from public.submissions;
  reset role;
  insert into public._rls_results values (
    'S5 mentor_sees_all_submissions',
    format('cnt >= %s', v_total_subs),
    format('cnt=%s', v_count),
    case when v_count >= v_total_subs then 'PASS' else 'FAIL' end
  );

  -- ===== S6 : Mentor INSERT pitch_score juror_id=self -> success =====
  begin
    set local role authenticated;
    perform public._rls_impersonate(user_m);
    insert into public.pitch_scores(event_id, player_id, juror_id, c1, c2, c3, c4, c5)
    select e.id, player_a, user_m, 15, 15, 15, 15, 15 from public.events e limit 1;
    reset role;
    insert into public._rls_results values (
      'S6 mentor_can_insert_own_pitch_score',
      'INSERT success',
      'INSERT accepted',
      'PASS'
    );
  exception when others then
    v_msg := sqlerrm;
    reset role;
    insert into public._rls_results values (
      'S6 mentor_can_insert_own_pitch_score',
      'INSERT success',
      format('blocked: %s', v_msg),
      'FAIL'
    );
  end;

  -- ===== S7 : Mentor INSERT pitch_score spoof juror_id=user_a -> RLS deny =====
  begin
    set local role authenticated;
    perform public._rls_impersonate(user_m);
    insert into public.pitch_scores(event_id, player_id, juror_id, c1, c2, c3, c4, c5)
    select e.id, player_a, user_a, 10, 10, 10, 10, 10 from public.events e limit 1;
    reset role;
    insert into public._rls_results values (
      'S7 mentor_cannot_spoof_juror_id',
      'RLS denied',
      'INSERT succeeded (UNEXPECTED)',
      'FAIL'
    );
  exception when others then
    v_msg := sqlerrm;
    reset role;
    insert into public._rls_results values (
      'S7 mentor_cannot_spoof_juror_id',
      'RLS denied',
      format('blocked: %s', v_msg),
      case when v_msg ilike '%row-level security%' or v_msg ilike '%violates%' or v_msg ilike '%permission denied%' then 'PASS' else 'FAIL' end
    );
  end;

  -- ===== S8 : GameMaster UPDATE players.score_project -> success =====
  begin
    set local role authenticated;
    perform public._rls_impersonate(user_g);
    update public.players set score_project = score_project where id = player_a;
    reset role;
    insert into public._rls_results values (
      'S8 game_master_can_update_players',
      'UPDATE success',
      'UPDATE accepted',
      'PASS'
    );
  exception when others then
    v_msg := sqlerrm;
    reset role;
    insert into public._rls_results values (
      'S8 game_master_can_update_players',
      'UPDATE success',
      format('blocked: %s', v_msg),
      'FAIL'
    );
  end;

  -- ===== S9 : Player A SELECT pitch_scores WHERE player_id=player_b -> 0 =====
  set local role authenticated;
  perform public._rls_impersonate(user_a);
  select count(*) into v_count from public.pitch_scores ps where ps.player_id = player_b;
  reset role;
  insert into public._rls_results values (
    'S9 player_a_cannot_see_player_b_pitch_scores',
    'cnt=0',
    format('cnt=%s', v_count),
    case when v_count = 0 then 'PASS' else 'FAIL' end
  );

  -- ===== S10 : Player A SELECT events -> >=1 =====
  set local role authenticated;
  perform public._rls_impersonate(user_a);
  select count(*) into v_count from public.events;
  reset role;
  insert into public._rls_results values (
    'S10 player_a_can_select_events',
    'cnt>=1',
    format('cnt=%s', v_count),
    case when v_count >= 1 then 'PASS' else 'FAIL' end
  );

end $outer$;

-- Cleanup fixtures
delete from public.submissions where proof_url like 'https://example.com/rls-%';
delete from public.pitch_scores where c1 = 15 and c2 = 15 and c3 = 15 and c4 = 15;

drop function if exists public._rls_impersonate(uuid);

select scenario, expected, actual, verdict from public._rls_results order by scenario;
