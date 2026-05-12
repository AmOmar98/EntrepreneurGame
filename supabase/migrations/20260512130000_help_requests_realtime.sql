-- quick-260512-24v deferred #2: enable Realtime replication for help_requests.
-- Required for HelpInboxBellLive subscription to receive INSERT/UPDATE events.
-- Safe: ALTER PUBLICATION is idempotent if the table is already in it.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'help_requests'
  ) then
    alter publication supabase_realtime add table public.help_requests;
  end if;
end $$;
