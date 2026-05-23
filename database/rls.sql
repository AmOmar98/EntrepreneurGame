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
-- announcements anon SELECT (quick-260523-hhy)
-- ============================================================================
-- Broadcast public content (no PII, no secrets). Required because the RSC
-- initial render path queries announcements before the Supabase session
-- cookie is attached, executing as anon. Without this policy + grants,
-- postgres logs surface `permission denied for table announcements`.
--
-- Provenance: .planning/quick/260523-hhy-rls-announcements/NEW.sql applied
-- PROD 2026-05-23 (project_id=vzzbjxmfkmvqkaqxalhr).
drop policy if exists "announcements_anon_select" on public.announcements;
create policy "announcements_anon_select" on public.announcements
  for select to anon
  using (true);

-- ============================================================================
-- Final grants
-- ============================================================================

revoke all on schema public from anon;

-- anon minimum re-grants (quick-260523-hhy)
-- Only `announcements` is exposed anon-readable (broadcast public content).
-- No other table in `public` has an anon-targeted policy, so this grant
-- alone does not expose any other table.
grant usage on schema public to anon;
grant select on public.announcements to anon;

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

-- ============================================================================
-- Quick 260523-kc2 D2: RLS initplan fix (auth.uid() wrapped in SELECT)
-- ============================================================================
-- Wraps auth.uid() in (SELECT auth.uid()) for 5 policies, reducing per-row
-- re-evaluation from O(n) to O(1). Mirrors PROD applied 2026-05-23 via
-- .planning/quick/260523-kc2-advisors-fix/D2.sql.
-- D2: Wrap auth.uid() in (SELECT auth.uid()) for 5 RLS policies
-- Post-mortem section D line 124. Performance: O(1) instead of O(n) re-eval.
-- Each DROP+CREATE pair is verbatim copy from pg_policies with replacement applied.
-- Transaction wrapping ensures rollback on any syntax error.

BEGIN;

-- 1/5 help_requests_player_insert_own (INSERT, with_check only)
DROP POLICY help_requests_player_insert_own ON public.help_requests;
CREATE POLICY help_requests_player_insert_own ON public.help_requests
  FOR INSERT TO authenticated
  WITH CHECK (is_my_player(player_id) AND (requested_by = (SELECT auth.uid())));

-- 2/5 jurors_self_select (SELECT, qual only)
DROP POLICY jurors_self_select ON public.jurors;
CREATE POLICY jurors_self_select ON public.jurors
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 3/5 pitch_scores_juror_self_insert (INSERT, with_check only)
DROP POLICY pitch_scores_juror_self_insert ON public.pitch_scores;
CREATE POLICY pitch_scores_juror_self_insert ON public.pitch_scores
  FOR INSERT TO authenticated
  WITH CHECK (((juror_id = (SELECT auth.uid())) AND is_juror(event_id)) OR is_game_master());

-- 4/5 pitch_scores_juror_self_update (UPDATE, qual AND with_check)
DROP POLICY pitch_scores_juror_self_update ON public.pitch_scores;
CREATE POLICY pitch_scores_juror_self_update ON public.pitch_scores
  FOR UPDATE TO authenticated
  USING (((juror_id = (SELECT auth.uid())) AND is_juror(event_id)) OR is_game_master())
  WITH CHECK (((juror_id = (SELECT auth.uid())) AND is_juror(event_id)) OR is_game_master());

-- 5/5 pitch_scores_select_visibility (SELECT, qual only — complex nested EXISTS)
DROP POLICY pitch_scores_select_visibility ON public.pitch_scores;
CREATE POLICY pitch_scores_select_visibility ON public.pitch_scores
  FOR SELECT TO authenticated
  USING (
    is_game_master()
    OR ((juror_id = (SELECT auth.uid())) AND is_juror(event_id))
    OR (
      is_juror(event_id)
      AND EXISTS (
        SELECT 1
        FROM events e
        WHERE e.id = pitch_scores.event_id
          AND (
            e.pitch_mode_state = 'closed'::pitch_mode_state
            OR e.results_published_at IS NOT NULL
          )
      )
    )
  );

COMMIT;

-- ============================================================================
-- Quick 260523-kc2 D3: SECURITY DEFINER functions — anon revoke via PUBLIC
-- ============================================================================
-- For each of 11 SECURITY DEFINER functions: REVOKE EXECUTE FROM PUBLIC
-- (anon inherits via PUBLIC) + GRANT EXECUTE TO authenticated.
-- Mirrors PROD applied 2026-05-23 via .planning/quick/260523-kc2-advisors-fix/D3.sql.
-- D3: Restrict EXECUTE on 11 SECURITY DEFINER functions to authenticated only.
-- Post-mortem section D line 123. Scope per L131: anon only (authenticated retains).
--
-- Initial naive attempt (REVOKE FROM anon) was a NO-OP because anon never had
-- an explicit grant — EXECUTE was inherited from PUBLIC (Postgres default).
-- Correct pattern: REVOKE FROM PUBLIC then GRANT TO authenticated. anon is
-- still a PUBLIC member but PUBLIC no longer has EXECUTE, so anon is denied.
-- authenticated gets explicit grant. service_role bypasses all (set up by
-- Supabase platform default, not affected here).
--
-- Safety check (orchestrator-confirmed 2026-05-23): zero .rpc() calls in
-- client/server code to these functions. All 11 are RLS helpers, triggers,
-- or server-action callbacks via service_role.

REVOKE EXECUTE ON FUNCTION public.current_app_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_auto_eval_fiches_entretien() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_auto_eval_fiches_entretien() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_game_master() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_game_master() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_juror(p_event_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_juror(p_event_id uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_mentor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_mentor() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_my_player(p_player_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_my_player(p_player_id uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.on_evaluation_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.on_evaluation_change() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.on_evaluation_engagement_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.on_evaluation_engagement_change() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.on_submission_engagement_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.on_submission_engagement_change() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recalc_player_engagement(p_player_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalc_player_engagement(p_player_id uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recalc_player_score(p_player_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalc_player_score(p_player_id uuid) TO authenticated;
