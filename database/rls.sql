-- Entrepreneur Game - Phase 1 RLS policies
-- Apply after schema.sql and triggers.sql.

-- ============================================================================
-- Helper functions
-- ============================================================================

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select app_role from public.profiles where user_id = auth.uid()),
    'player'::public.app_role
  );
$$;

create or replace function public.is_game_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'game_master'::public.app_role;
$$;

create or replace function public.is_mentor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('mentor'::public.app_role, 'game_master'::public.app_role);
$$;

create or replace function public.is_my_player(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.player_members pm
     where pm.player_id = p_player_id
       and pm.user_id = auth.uid()
  );
$$;

-- ============================================================================
-- Enable RLS on every table
-- ============================================================================

alter table public.events enable row level security;
alter table public.levels enable row level security;
alter table public.missions enable row level security;
alter table public.deliverable_templates enable row level security;
alter table public.cohorts enable row level security;
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.player_members enable row level security;
alter table public.submissions enable row level security;
alter table public.evaluations enable row level security;
alter table public.pitch_scores enable row level security;

-- ============================================================================
-- Reference / catalog tables: authenticated read-all, game_master full r/w
-- ============================================================================

drop policy if exists "events_authenticated_select" on public.events;
create policy "events_authenticated_select" on public.events
  for select to authenticated using (true);
drop policy if exists "events_gm_all" on public.events;
create policy "events_gm_all" on public.events
  for all to authenticated using (public.is_game_master()) with check (public.is_game_master());

drop policy if exists "levels_authenticated_select" on public.levels;
create policy "levels_authenticated_select" on public.levels
  for select to authenticated using (true);
drop policy if exists "levels_gm_all" on public.levels;
create policy "levels_gm_all" on public.levels
  for all to authenticated using (public.is_game_master()) with check (public.is_game_master());

drop policy if exists "missions_authenticated_select" on public.missions;
create policy "missions_authenticated_select" on public.missions
  for select to authenticated using (true);
drop policy if exists "missions_gm_all" on public.missions;
create policy "missions_gm_all" on public.missions
  for all to authenticated using (public.is_game_master()) with check (public.is_game_master());

drop policy if exists "deliverable_templates_authenticated_select" on public.deliverable_templates;
create policy "deliverable_templates_authenticated_select" on public.deliverable_templates
  for select to authenticated using (true);
drop policy if exists "deliverable_templates_gm_all" on public.deliverable_templates;
create policy "deliverable_templates_gm_all" on public.deliverable_templates
  for all to authenticated using (public.is_game_master()) with check (public.is_game_master());

drop policy if exists "cohorts_authenticated_select" on public.cohorts;
create policy "cohorts_authenticated_select" on public.cohorts
  for select to authenticated using (true);
drop policy if exists "cohorts_gm_all" on public.cohorts;
create policy "cohorts_gm_all" on public.cohorts
  for all to authenticated using (public.is_game_master()) with check (public.is_game_master());

-- ============================================================================
-- profiles
-- ============================================================================

drop policy if exists "profiles_self_or_mentor_select" on public.profiles;
create policy "profiles_self_or_mentor_select" on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_mentor());

drop policy if exists "profiles_self_or_gm_insert" on public.profiles;
create policy "profiles_self_or_gm_insert" on public.profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_game_master());

drop policy if exists "profiles_self_or_gm_update" on public.profiles;
create policy "profiles_self_or_gm_update" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_game_master())
  with check (user_id = (select auth.uid()) or public.is_game_master());

drop policy if exists "profiles_gm_delete" on public.profiles;
create policy "profiles_gm_delete" on public.profiles
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- players
-- ============================================================================

drop policy if exists "players_member_or_mentor_select" on public.players;
create policy "players_member_or_mentor_select" on public.players
  for select to authenticated
  using (public.is_my_player(id) or public.is_mentor());

drop policy if exists "players_member_or_gm_update" on public.players;
create policy "players_member_or_gm_update" on public.players
  for update to authenticated
  using (public.is_my_player(id) or public.is_game_master())
  with check (public.is_my_player(id) or public.is_game_master());

drop policy if exists "players_gm_insert" on public.players;
create policy "players_gm_insert" on public.players
  for insert to authenticated
  with check (public.is_game_master());

drop policy if exists "players_gm_delete" on public.players;
create policy "players_gm_delete" on public.players
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- player_members
-- ============================================================================

drop policy if exists "player_members_self_or_mentor_select" on public.player_members;
create policy "player_members_self_or_mentor_select" on public.player_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_mentor());

drop policy if exists "player_members_gm_insert" on public.player_members;
create policy "player_members_gm_insert" on public.player_members
  for insert to authenticated
  with check (public.is_game_master());

drop policy if exists "player_members_gm_update" on public.player_members;
create policy "player_members_gm_update" on public.player_members
  for update to authenticated
  using (public.is_game_master())
  with check (public.is_game_master());

drop policy if exists "player_members_gm_delete" on public.player_members;
create policy "player_members_gm_delete" on public.player_members
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- submissions
-- ============================================================================

drop policy if exists "submissions_member_or_mentor_select" on public.submissions;
create policy "submissions_member_or_mentor_select" on public.submissions
  for select to authenticated
  using (public.is_my_player(player_id) or public.is_mentor());

drop policy if exists "submissions_member_self_insert" on public.submissions;
create policy "submissions_member_self_insert" on public.submissions
  for insert to authenticated
  with check (
    (public.is_my_player(player_id) and submitted_by = (select auth.uid()))
    or public.is_game_master()
  );

drop policy if exists "submissions_member_self_update" on public.submissions;
create policy "submissions_member_self_update" on public.submissions
  for update to authenticated
  using (
    (public.is_my_player(player_id) and submitted_by = (select auth.uid()))
    or public.is_game_master()
  )
  with check (
    (public.is_my_player(player_id) and submitted_by = (select auth.uid()))
    or public.is_game_master()
  );

drop policy if exists "submissions_gm_delete" on public.submissions;
create policy "submissions_gm_delete" on public.submissions
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- evaluations
-- ============================================================================

drop policy if exists "evaluations_member_or_mentor_select" on public.evaluations;
create policy "evaluations_member_or_mentor_select" on public.evaluations
  for select to authenticated
  using (
    public.is_mentor()
    or exists (
      select 1
        from public.submissions s
       where s.id = submission_id
         and public.is_my_player(s.player_id)
    )
  );

drop policy if exists "evaluations_mentor_self_insert" on public.evaluations;
create policy "evaluations_mentor_self_insert" on public.evaluations
  for insert to authenticated
  with check (
    (public.is_mentor() and evaluator_id = (select auth.uid()))
    or public.is_game_master()
  );

drop policy if exists "evaluations_mentor_self_update" on public.evaluations;
create policy "evaluations_mentor_self_update" on public.evaluations
  for update to authenticated
  using (
    (public.is_mentor() and evaluator_id = (select auth.uid()))
    or public.is_game_master()
  )
  with check (
    (public.is_mentor() and evaluator_id = (select auth.uid()))
    or public.is_game_master()
  );

drop policy if exists "evaluations_gm_delete" on public.evaluations;
create policy "evaluations_gm_delete" on public.evaluations
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- pitch_scores
-- ============================================================================

drop policy if exists "pitch_scores_member_or_mentor_select" on public.pitch_scores;
create policy "pitch_scores_member_or_mentor_select" on public.pitch_scores
  for select to authenticated
  using (public.is_my_player(player_id) or public.is_mentor());

drop policy if exists "pitch_scores_mentor_self_insert" on public.pitch_scores;
create policy "pitch_scores_mentor_self_insert" on public.pitch_scores
  for insert to authenticated
  with check (
    (public.is_mentor() and juror_id = (select auth.uid()))
    or public.is_game_master()
  );

drop policy if exists "pitch_scores_mentor_self_update" on public.pitch_scores;
create policy "pitch_scores_mentor_self_update" on public.pitch_scores
  for update to authenticated
  using (
    (public.is_mentor() and juror_id = (select auth.uid()))
    or public.is_game_master()
  )
  with check (
    (public.is_mentor() and juror_id = (select auth.uid()))
    or public.is_game_master()
  );

drop policy if exists "pitch_scores_gm_delete" on public.pitch_scores;
create policy "pitch_scores_gm_delete" on public.pitch_scores
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- announcements anon SELECT (quick-260523-hhy, bootstrap-guarded for DB-01)
-- ============================================================================
-- Broadcast public content (no PII, no secrets). Guarded with to_regclass so
-- fresh bootstrap (before 20260510140001_phase09_gamemaster_live.sql creates
-- public.announcements) succeeds cleanly and live re-apply updates policies.

revoke all on schema public from anon;
grant usage on schema public to anon;

do $$
begin
  if to_regclass('public.announcements') is not null then
    drop policy if exists "announcements_anon_select" on public.announcements;
    create policy "announcements_anon_select" on public.announcements
      for select to anon
      using (true);
    grant select on public.announcements to anon;
  end if;
end $$;

-- ============================================================================
-- Final grants
-- ============================================================================

grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- service_role : bypass RLS pour les server actions et queries server-side
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- ============================================================================
-- Quick 260523-kc2 D2: RLS initplan fix (auth.uid() wrapped in SELECT)
-- Bootstrap-guarded for DB-01 so fresh bootstrap before migrations succeeds.
-- ============================================================================

do $$
begin
  if to_regclass('public.help_requests') is not null then
    drop policy if exists help_requests_player_insert_own on public.help_requests;
    create policy help_requests_player_insert_own on public.help_requests
      for insert to authenticated
      with check (public.is_my_player(player_id) and (requested_by = (select auth.uid())));
  end if;

  if to_regclass('public.jurors') is not null then
    drop policy if exists jurors_self_select on public.jurors;
    create policy jurors_self_select on public.jurors
      for select to authenticated
      using (user_id = (select auth.uid()));
  end if;

  if to_regprocedure('public.is_juror(uuid)') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'events'
         and column_name = 'pitch_mode_state'
     ) then
    drop policy if exists pitch_scores_juror_self_insert on public.pitch_scores;
    create policy pitch_scores_juror_self_insert on public.pitch_scores
      for insert to authenticated
      with check (((juror_id = (select auth.uid())) and public.is_juror(event_id)) or public.is_game_master());

    drop policy if exists pitch_scores_juror_self_update on public.pitch_scores;
    create policy pitch_scores_juror_self_update on public.pitch_scores
      for update to authenticated
      using (((juror_id = (select auth.uid())) and public.is_juror(event_id)) or public.is_game_master())
      with check (((juror_id = (select auth.uid())) and public.is_juror(event_id)) or public.is_game_master());

    drop policy if exists pitch_scores_select_visibility on public.pitch_scores;
    execute $pol$
      create policy pitch_scores_select_visibility on public.pitch_scores
        for select to authenticated
        using (
          public.is_game_master()
          or ((juror_id = (select auth.uid())) and public.is_juror(event_id))
          or (
            public.is_juror(event_id)
            and exists (
              select 1
              from public.events e
              where e.id = pitch_scores.event_id
                and (
                  e.pitch_mode_state = 'closed'::public.pitch_mode_state
                  or e.results_published_at is not null
                )
            )
          )
        )
    $pol$;
  end if;
end $$;

-- ============================================================================
-- Phase 14 (v0.4) — RLS org-scope (mirror of 20260611120300 & 20260611220000)
-- Bootstrap-safe: uses base player/mentor check if public.jurors does not exist
-- yet, and upgrades to include public.jurors when present.
-- ============================================================================

create or replace function public.is_in_org(p_org_id uuid)
returns boolean
language sql stable security definer
set search_path = public as $$
  select
    exists(
      select 1
      from public.events e
      join public.cohorts c   on c.event_id = e.id
      join public.players p   on p.cohort_id = c.id
      join public.player_members pm on pm.player_id = p.id
      where e.organization_id = p_org_id
        and pm.user_id = (select auth.uid())
    )
    or public.is_mentor()
$$;

do $$
begin
  if to_regclass('public.jurors') is not null then
    execute $fn$
      create or replace function public.is_in_org(p_org_id uuid)
      returns boolean
      language sql stable security definer
      set search_path = public as $body$
        select
          exists(
            select 1
            from public.events e
            join public.cohorts c   on c.event_id = e.id
            join public.players p   on p.cohort_id = c.id
            join public.player_members pm on pm.player_id = p.id
            where e.organization_id = p_org_id
              and pm.user_id = (select auth.uid())
          )
          or public.is_mentor()
          or exists(
            select 1
            from public.events e
            join public.jurors j on j.event_id = e.id
            where e.organization_id = p_org_id
              and j.user_id = (select auth.uid())
          )
      $body$;
    $fn$;
  end if;
end $$;

-- ============================================================================
-- RLS for levels_v2, events org-scope, organizations, pitch_criteria, event_settings
-- ============================================================================

drop policy if exists "levels_v2_authenticated_select" on public.levels_v2;
create policy "levels_v2_authenticated_select" on public.levels_v2
  as permissive
  for select to authenticated
  using (true);

drop policy if exists "levels_v2_gm_all" on public.levels_v2;
create policy "levels_v2_gm_all" on public.levels_v2
  as permissive
  for all to authenticated
  using (public.is_game_master())
  with check (public.is_game_master());

drop policy if exists "events_org_scope_select" on public.events;
create policy "events_org_scope_select" on public.events
  as permissive
  for select to authenticated
  using (
    organization_id is null
    or public.is_in_org(organization_id)
    or public.is_game_master()
  );

drop policy if exists "events_authenticated_select" on public.events;

alter table public.organizations enable row level security;

drop policy if exists "organizations_member_select" on public.organizations;
create policy "organizations_member_select" on public.organizations
  as permissive
  for select to authenticated
  using (
    public.is_in_org(id)
    or public.is_game_master()
  );

drop policy if exists "organizations_gm_all" on public.organizations;
create policy "organizations_gm_all" on public.organizations
  as permissive
  for all to authenticated
  using (public.is_game_master())
  with check (public.is_game_master());

drop policy if exists pitch_criteria_authenticated_select on public.pitch_criteria;
create policy pitch_criteria_authenticated_select on public.pitch_criteria
  for select to authenticated using (true);
drop policy if exists pitch_criteria_gm_all on public.pitch_criteria;
create policy pitch_criteria_gm_all on public.pitch_criteria
  for all to authenticated
  using (public.is_game_master()) with check (public.is_game_master());

drop policy if exists event_settings_authenticated_select on public.event_settings;
create policy event_settings_authenticated_select on public.event_settings
  for select to authenticated using (true);
drop policy if exists event_settings_gm_all on public.event_settings;
create policy event_settings_gm_all on public.event_settings
  for all to authenticated
  using (public.is_game_master()) with check (public.is_game_master());

-- ============================================================================
-- SECURITY DEFINER Function Privilege Hardening (260523-kc2 D3 + 261111-db1)
--   - 6 RLS boolean/role helpers: REVOKE FROM PUBLIC, GRANT TO authenticated
--   - 7 internal/trigger functions: REVOKE FROM PUBLIC, anon, authenticated;
--     GRANT TO service_role only (Advisor 0029 hardening)
-- ============================================================================

revoke execute on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;

revoke execute on function public.is_game_master() from public;
grant execute on function public.is_game_master() to authenticated;

revoke execute on function public.is_mentor() from public;
grant execute on function public.is_mentor() to authenticated;

revoke execute on function public.is_my_player(uuid) from public;
grant execute on function public.is_my_player(uuid) to authenticated;

revoke execute on function public.is_in_org(uuid) from public;
grant execute on function public.is_in_org(uuid) to authenticated;

revoke execute on function public.on_evaluation_change() from public, anon, authenticated;
grant execute on function public.on_evaluation_change() to service_role;

revoke execute on function public.recalc_player_score(uuid) from public, anon, authenticated;
grant execute on function public.recalc_player_score(uuid) to service_role;

do $$
begin
  if to_regprocedure('public.is_juror(uuid)') is not null then
    revoke execute on function public.is_juror(uuid) from public;
    grant execute on function public.is_juror(uuid) to authenticated;
  end if;

  if to_regprocedure('public.fn_auto_eval_fiches_entretien()') is not null then
    revoke execute on function public.fn_auto_eval_fiches_entretien() from public, anon, authenticated;
    grant execute on function public.fn_auto_eval_fiches_entretien() to service_role;
  end if;

  if to_regprocedure('public.on_evaluation_engagement_change()') is not null then
    revoke execute on function public.on_evaluation_engagement_change() from public, anon, authenticated;
    grant execute on function public.on_evaluation_engagement_change() to service_role;
  end if;

  if to_regprocedure('public.on_submission_engagement_change()') is not null then
    revoke execute on function public.on_submission_engagement_change() from public, anon, authenticated;
    grant execute on function public.on_submission_engagement_change() to service_role;
  end if;

  if to_regprocedure('public.recalc_player_engagement(uuid)') is not null then
    revoke execute on function public.recalc_player_engagement(uuid) from public, anon, authenticated;
    grant execute on function public.recalc_player_engagement(uuid) to service_role;
  end if;

  if to_regprocedure('public.get_event_setting_int(uuid, text, integer)') is not null then
    revoke execute on function public.get_event_setting_int(uuid, text, integer) from public, anon, authenticated;
    grant execute on function public.get_event_setting_int(uuid, text, integer) to service_role;
  end if;
end $$;
