-- ============================================================================
-- Phase 9 — GameMaster live mode + announcements + deliverable templates toggle
-- (GMR-04, GMR-05, GMR-06, GMR-09 — Agent 9A scope)
-- 2026-05-10
--
-- Apply manually after schema.sql -> triggers.sql -> rls.sql -> 08-mentor-comments.sql
-- Idempotent: safe to re-run.
--
-- NOTE on RLS helpers: this codebase uses public.is_game_master() and
-- public.is_mentor() (defined in database/rls.sql) — there is no public.is_staff()
-- helper. We rely on is_game_master() for GM-only writes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) deliverable_templates.is_active — toggle for /admin/deliverables (GMR-06)
-- ----------------------------------------------------------------------------
-- Default true so existing rows remain visible to Players (backward compat
-- for the journey query that joins this table).

alter table public.deliverable_templates
  add column if not exists is_active boolean not null default true;

comment on column public.deliverable_templates.is_active is
  'GameMaster toggle. When false, the template is hidden from Player journeys (Phase 9 / GMR-06).';

create index if not exists deliverable_templates_active_idx
  on public.deliverable_templates (is_active) where is_active = true;

-- The base "deliverable_templates_gm_all" policy (rls.sql) already covers
-- INSERT/UPDATE/DELETE for game_master. No additional policy required for
-- the toggle action; it is enforced by is_game_master() in the existing FOR ALL
-- policy and also defense-in-depth in the server action.

-- ----------------------------------------------------------------------------
-- 2) announcements table — composer (GMR-09)
-- ----------------------------------------------------------------------------
-- Append-only ledger of GM messages broadcast to the cohort. Phase 9 uses
-- reload-based visibility on the Player side (no Realtime / push).
-- target_kind drives the audience:
--   'all'     : every authenticated user sees it
--   'level'   : target_ids is an array of level_id::text values (e.g. {L0_diagnostic})
--   'teams'   : target_ids is an array of player_id uuids (cast to text)
--   'mentors' : every mentor + game_master sees it

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null check (kind in ('info', 'urgence', 'celebration', 'appel')),
  target_kind text not null check (target_kind in ('all', 'level', 'teams', 'mentors')),
  target_ids text[] not null default '{}'::text[],
  body text not null check (length(trim(body)) >= 1 and length(body) <= 2000),
  title text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.announcements is
  'GameMaster live announcements broadcast to the cohort. Phase 9 / GMR-09.';

create index if not exists announcements_event_created_idx
  on public.announcements (event_id, created_at desc);

create index if not exists announcements_kind_idx
  on public.announcements (kind);

-- ----------------------------------------------------------------------------
-- 3) RLS for announcements
-- ----------------------------------------------------------------------------
alter table public.announcements enable row level security;

-- Read: every authenticated user can see all rows. Filtering by audience
-- happens in the server-side query (lib/announcements.ts).
drop policy if exists "announcements_authenticated_select" on public.announcements;
create policy "announcements_authenticated_select" on public.announcements
  for select to authenticated
  using (auth.uid() is not null);

-- Insert: GM-only. created_by_user_id must match the caller.
drop policy if exists "announcements_gm_insert" on public.announcements;
create policy "announcements_gm_insert" on public.announcements
  for insert to authenticated
  with check (
    public.is_game_master()
    and (created_by_user_id is null or created_by_user_id = auth.uid())
  );

-- Update / Delete: GM-only.
drop policy if exists "announcements_gm_update" on public.announcements;
create policy "announcements_gm_update" on public.announcements
  for update to authenticated
  using (public.is_game_master())
  with check (public.is_game_master());

drop policy if exists "announcements_gm_delete" on public.announcements;
create policy "announcements_gm_delete" on public.announcements
  for delete to authenticated
  using (public.is_game_master());
