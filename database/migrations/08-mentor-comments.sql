-- ============================================================================
-- Phase 8 — Mentor flow refonte (MNT-03, MNT-04)
-- Apply manually after schema.sql/triggers.sql/rls.sql have been applied.
-- Idempotent: safe to re-run via `supabase db reset` or psql replay.
-- ============================================================================
-- Adds:
--   * public.evaluation_comments (async tagged comments at the deliverable level)
--   * public.evaluations.expected_action (mandatory text when verdict=request_v2)
-- ============================================================================

-- 1) Tagged comments at the submission level ---------------------------------
-- Comments are tied to a *submission* (versioned proof) so V1 vs V2 threads
-- stay distinct. Mentor + Player members can read; Mentor + GameMaster
-- can insert. No update/delete in v0.2 — append-only ledger.
create table if not exists public.evaluation_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  tag text not null check (tag in ('remarque', 'a_corriger')),
  body text not null check (length(trim(body)) > 0 and length(body) <= 2000),
  created_at timestamptz not null default now()
);

comment on table public.evaluation_comments is
  'Async tagged comments tied to a submission (Mentor <-> Player feedback loop). Phase 8 / MNT-03.';

create index if not exists evaluation_comments_submission_idx
  on public.evaluation_comments (submission_id, created_at desc);

create index if not exists evaluation_comments_author_idx
  on public.evaluation_comments (author_user_id);

-- 2) RLS for evaluation_comments ---------------------------------------------
alter table public.evaluation_comments enable row level security;

drop policy if exists "evaluation_comments_member_or_mentor_select"
  on public.evaluation_comments;
create policy "evaluation_comments_member_or_mentor_select"
  on public.evaluation_comments
  for select
  to authenticated
  using (
    public.is_mentor()
    or exists (
      select 1
        from public.submissions s
       where s.id = submission_id
         and public.is_my_player(s.player_id)
    )
  );

drop policy if exists "evaluation_comments_mentor_self_insert"
  on public.evaluation_comments;
create policy "evaluation_comments_mentor_self_insert"
  on public.evaluation_comments
  for insert
  to authenticated
  with check (
    -- Mentors / GameMasters can comment on any submission.
    (public.is_mentor() and author_user_id = auth.uid())
    -- Players can comment only on their own submissions (acknowledgement
    -- replies in the async thread). Tag is constrained by the column check.
    or exists (
      select 1
        from public.submissions s
       where s.id = submission_id
         and public.is_my_player(s.player_id)
         and author_user_id = auth.uid()
    )
  );

drop policy if exists "evaluation_comments_gm_delete"
  on public.evaluation_comments;
create policy "evaluation_comments_gm_delete"
  on public.evaluation_comments
  for delete
  to authenticated
  using (public.is_game_master());

-- 3) evaluations.expected_action ---------------------------------------------
-- Mandatory text when verdict = 'request_v2' (server-action validated).
-- Nullable column so existing rows survive; CHECK constraint enforces the
-- non-empty value when verdict requires it.
alter table public.evaluations
  add column if not exists expected_action text;

comment on column public.evaluations.expected_action is
  'Action attendue from the mentor when verdict=request_v2. Required server-side (Phase 8 / MNT-04).';

-- Drop a previous version of the CHECK if present, then re-create.
do $$
begin
  if exists (
    select 1
      from pg_constraint
     where conname = 'evaluations_expected_action_required_for_request_v2'
       and conrelid = 'public.evaluations'::regclass
  ) then
    alter table public.evaluations
      drop constraint evaluations_expected_action_required_for_request_v2;
  end if;
end $$;

alter table public.evaluations
  add constraint evaluations_expected_action_required_for_request_v2
  check (
    verdict <> 'request_v2'
    or (expected_action is not null and length(trim(expected_action)) > 0)
  ) not valid;

-- Validate the constraint separately so legacy rows (where expected_action is
-- NULL but verdict is request_v2) do not block the migration. Pilot-grade:
-- new evaluations are validated server-side; legacy pilot rows are tolerated.
-- To enforce strictly: `alter table public.evaluations validate constraint
-- evaluations_expected_action_required_for_request_v2;` once legacy rows are
-- backfilled.
