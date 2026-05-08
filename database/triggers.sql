-- Entrepreneur Game - Phase 1 triggers
-- Apply after schema.sql, before rls.sql.

-- ============================================================================
-- Generic updated_at maintenance
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger trg_missions_updated_at
  before update on public.missions
  for each row execute function public.set_updated_at();

create trigger trg_deliverable_templates_updated_at
  before update on public.deliverable_templates
  for each row execute function public.set_updated_at();

create trigger trg_cohorts_updated_at
  before update on public.cohorts
  for each row execute function public.set_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_players_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

create trigger trg_evaluations_updated_at
  before update on public.evaluations
  for each row execute function public.set_updated_at();

create trigger trg_pitch_scores_updated_at
  before update on public.pitch_scores
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Project score recalc
-- For each (player, deliverable_template), take the highest-version validated
-- submission's max evaluation total_score; sum into players.score_project.
-- ============================================================================

create or replace function public.recalc_player_score(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(6,2);
begin
  with best_per_template as (
    select
      s.deliverable_template_id,
      max(e.total_score) as max_score
    from public.submissions s
    join public.evaluations e on e.submission_id = s.id
    where s.player_id = p_player_id
      and s.status = 'validated'
    group by s.deliverable_template_id
  )
  select coalesce(sum(max_score), 0)
    into v_total
    from best_per_template;

  update public.players
     set score_project = v_total
   where id = p_player_id;
end;
$$;

create or replace function public.on_evaluation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_submission_id uuid;
begin
  v_submission_id := coalesce(new.submission_id, old.submission_id);
  select s.player_id into v_player_id
    from public.submissions s
   where s.id = v_submission_id;

  if v_player_id is not null then
    perform public.recalc_player_score(v_player_id);
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_evaluation_recalc
  after insert or update or delete on public.evaluations
  for each row execute function public.on_evaluation_change();

-- ============================================================================
-- Player onboarding: write-once invariant on onboarded_at
-- ============================================================================

create or replace function public.guard_player_onboarding()
returns trigger
language plpgsql
as $$
begin
  if old.onboarded_at is not null and new.onboarded_at is null then
    raise exception 'players.onboarded_at cannot be cleared once set';
  end if;
  return new;
end;
$$;

create trigger trg_player_onboarding
  before update on public.players
  for each row execute function public.guard_player_onboarding();
