-- help_requests : Player calls for mentor support during the Hack-Days.
-- Pedagogical-empathic feature (R1 NA, R2 NA, R3 OK -- purely additive, never gates progression).
-- quick-260512-24v

create type public.help_request_status as enum ('open', 'acknowledged', 'resolved');

create table public.help_requests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  requested_by uuid not null references public.profiles(user_id) on delete set null,
  message text not null check (char_length(message) between 1 and 500),
  status public.help_request_status not null default 'open',
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles(user_id),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(user_id),
  updated_at timestamptz not null default now()
);
comment on table public.help_requests is 'Player calls for mentor support -- in-app inbox with status lifecycle (open -> acknowledged -> resolved).';

create index help_requests_status_created_idx on public.help_requests(status, created_at desc);
create index help_requests_player_idx on public.help_requests(player_id);

-- updated_at trigger
create or replace function public.set_help_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_help_requests_updated_at
  before update on public.help_requests
  for each row execute function public.set_help_requests_updated_at();

-- RLS
alter table public.help_requests enable row level security;

-- Player: SELECT + INSERT only their own (via player_members membership)
create policy "help_requests_player_select_own" on public.help_requests
  for select to authenticated
  using (public.is_my_player(player_id));

create policy "help_requests_player_insert_own" on public.help_requests
  for insert to authenticated
  with check (
    public.is_my_player(player_id)
    and requested_by = auth.uid()
  );

-- Mentor + GameMaster: SELECT all (cohort-wide visibility for J1/J2 pilote)
create policy "help_requests_mentor_select_all" on public.help_requests
  for select to authenticated
  using (public.is_mentor());

-- Mentor + GameMaster: UPDATE (acknowledge / resolve)
create policy "help_requests_mentor_update" on public.help_requests
  for update to authenticated
  using (public.is_mentor())
  with check (public.is_mentor());

-- Table-level GRANT (F-16-01 lesson learned 2026-05-11 : RLS alone insufficient, GRANT required).
grant select, insert, update on public.help_requests to authenticated;
