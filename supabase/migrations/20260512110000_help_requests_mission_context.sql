-- quick-260512-24v deferred #5: attach optional mission context to help_requests.
-- Detected client-side via usePathname() (e.g. /journey/deliverable/<id>);
-- helps mentor triage faster in the inbox.

alter table public.help_requests
  add column if not exists mission_context text;

comment on column public.help_requests.mission_context is
  'Optional mission slug (e.g. L2.2) or path detected client-side at submission time. NULL when Player called FAB from a generic page (home, settings).';
