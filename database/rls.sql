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

create policy "events_authenticated_select" on public.events
  for select to authenticated using (true);
create policy "events_gm_all" on public.events
  for all to authenticated using (public.is_game_master()) with check (public.is_game_master());

create policy "levels_authenticated_select" on public.levels
  for select to authenticated using (true);
create policy "levels_gm_all" on public.levels
  for all to authenticated using (public.is_game_master()) with check (public.is_game_master());

create policy "missions_authenticated_select" on public.missions
  for select to authenticated using (true);
create policy "missions_gm_all" on public.missions
  for all to authenticated using (public.is_game_master()) with check (public.is_game_master());

create policy "deliverable_templates_authenticated_select" on public.deliverable_templates
  for select to authenticated using (true);
create policy "deliverable_templates_gm_all" on public.deliverable_templates
  for all to authenticated using (public.is_game_master()) with check (public.is_game_master());

create policy "cohorts_authenticated_select" on public.cohorts
  for select to authenticated using (true);
create policy "cohorts_gm_all" on public.cohorts
  for all to authenticated using (public.is_game_master()) with check (public.is_game_master());

-- ============================================================================
-- profiles
-- ============================================================================

create policy "profiles_self_or_mentor_select" on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_mentor());

create policy "profiles_self_or_gm_insert" on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_game_master());

create policy "profiles_self_or_gm_update" on public.profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_game_master())
  with check (user_id = auth.uid() or public.is_game_master());

create policy "profiles_gm_delete" on public.profiles
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- players
-- ============================================================================

create policy "players_member_or_mentor_select" on public.players
  for select to authenticated
  using (public.is_my_player(id) or public.is_mentor());

create policy "players_member_or_gm_update" on public.players
  for update to authenticated
  using (public.is_my_player(id) or public.is_game_master())
  with check (public.is_my_player(id) or public.is_game_master());

create policy "players_gm_insert" on public.players
  for insert to authenticated
  with check (public.is_game_master());

create policy "players_gm_delete" on public.players
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- player_members
-- ============================================================================

create policy "player_members_self_or_mentor_select" on public.player_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_mentor());

create policy "player_members_gm_insert" on public.player_members
  for insert to authenticated
  with check (public.is_game_master());

create policy "player_members_gm_update" on public.player_members
  for update to authenticated
  using (public.is_game_master())
  with check (public.is_game_master());

create policy "player_members_gm_delete" on public.player_members
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- submissions
-- ============================================================================

create policy "submissions_member_or_mentor_select" on public.submissions
  for select to authenticated
  using (public.is_my_player(player_id) or public.is_mentor());

create policy "submissions_member_self_insert" on public.submissions
  for insert to authenticated
  with check (
    (public.is_my_player(player_id) and submitted_by = auth.uid())
    or public.is_game_master()
  );

create policy "submissions_member_self_update" on public.submissions
  for update to authenticated
  using (
    (public.is_my_player(player_id) and submitted_by = auth.uid())
    or public.is_game_master()
  )
  with check (
    (public.is_my_player(player_id) and submitted_by = auth.uid())
    or public.is_game_master()
  );

create policy "submissions_gm_delete" on public.submissions
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- evaluations
-- ============================================================================

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

create policy "evaluations_mentor_self_insert" on public.evaluations
  for insert to authenticated
  with check (
    (public.is_mentor() and evaluator_id = auth.uid())
    or public.is_game_master()
  );

create policy "evaluations_mentor_self_update" on public.evaluations
  for update to authenticated
  using (
    (public.is_mentor() and evaluator_id = auth.uid())
    or public.is_game_master()
  )
  with check (
    (public.is_mentor() and evaluator_id = auth.uid())
    or public.is_game_master()
  );

create policy "evaluations_gm_delete" on public.evaluations
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- pitch_scores
-- ============================================================================

create policy "pitch_scores_member_or_mentor_select" on public.pitch_scores
  for select to authenticated
  using (public.is_my_player(player_id) or public.is_mentor());

create policy "pitch_scores_mentor_self_insert" on public.pitch_scores
  for insert to authenticated
  with check (
    (public.is_mentor() and juror_id = auth.uid())
    or public.is_game_master()
  );

create policy "pitch_scores_mentor_self_update" on public.pitch_scores
  for update to authenticated
  using (
    (public.is_mentor() and juror_id = auth.uid())
    or public.is_game_master()
  )
  with check (
    (public.is_mentor() and juror_id = auth.uid())
    or public.is_game_master()
  );

create policy "pitch_scores_gm_delete" on public.pitch_scores
  for delete to authenticated
  using (public.is_game_master());

-- ============================================================================
-- Final grants
-- ============================================================================

revoke all on schema public from anon;
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- service_role : bypass RLS pour les server actions et queries server-side
-- (cf. lib/results.ts:computeRanking quand events.results_published_at != null,
-- et app/actions.ts:importPlayersCsv pour les invites magic-link).
-- Si le schema public a ete recreate via "drop schema public cascade; create
-- schema public;" (cf. schema.sql ligne 4), service_role perd ses grants par
-- defaut Supabase et il faut les restaurer explicitement, sinon "permission
-- denied for table cohorts" sur les queries service-role.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
