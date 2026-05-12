-- quick-260512-24v deferred #3: optional mentor assignment.
-- During pilot J1/J2, all mentors see all open requests (cohort-wide RLS).
-- This migration adds the column nullable so mentors can self-claim a
-- request; the wide SELECT policy stays unchanged. Narrowing the SELECT
-- to "assigned-to-me OR game_master" is reserved for v0.3 (advisor
-- explicitly deferred: scoping mid-pilot risks mentor blindspots).

alter table public.help_requests
  add column if not exists assigned_mentor_id uuid
    references public.profiles(user_id) on delete set null;

create index if not exists help_requests_assigned_mentor_idx
  on public.help_requests(assigned_mentor_id)
  where assigned_mentor_id is not null;

comment on column public.help_requests.assigned_mentor_id is
  'Optional self-claim by a mentor (UI: "Je prends" button). RLS stays cohort-wide for pilot; narrowing reserved for v0.3.';
