-- One-shot RLS test setup
-- - Ensures user_b has a profile (player)
-- - Creates 2 test players "RLS Test A" / "RLS Test B" linked to the existing cohort
-- - Wires player_members (user_a -> A, user_b -> B)
-- Idempotent: re-runs cleanly via ON CONFLICT.

insert into public.profiles (user_id, app_role, full_name, email)
values ('27eddceb-dbca-462f-bf22-88512caa7024', 'player', 'Test Player B', 'player-b@test.local')
on conflict (user_id) do update
  set app_role = excluded.app_role,
      full_name = excluded.full_name,
      email = excluded.email;

insert into public.players (cohort_id, slug, name, idea, current_level, status)
values
  ('ea5aae0b-3abb-4341-90f2-56e924a499ad', 'rls-test-a', 'RLS Test A', 'Test team A for RLS validation', 'L0_diagnostic', 'active'),
  ('ea5aae0b-3abb-4341-90f2-56e924a499ad', 'rls-test-b', 'RLS Test B', 'Test team B for RLS validation', 'L0_diagnostic', 'active')
on conflict (slug) do update
  set name = excluded.name,
      idea = excluded.idea;

-- Link members. user_a = player@test.local, user_b = player-b@test.local
insert into public.player_members (player_id, user_id, role, team_role)
select p.id, '06af6412-7086-405b-a91f-e2b8affe07d8'::uuid, 'player'::public.app_role, 'owner'::public.team_role
  from public.players p where p.slug = 'rls-test-a'
on conflict (player_id, user_id) do nothing;

insert into public.player_members (player_id, user_id, role, team_role)
select p.id, '27eddceb-dbca-462f-bf22-88512caa7024'::uuid, 'player'::public.app_role, 'owner'::public.team_role
  from public.players p where p.slug = 'rls-test-b'
on conflict (player_id, user_id) do nothing;

-- Sanity: print resulting setup
select p.slug, p.name, pm.user_id, pr.email
  from public.players p
  join public.player_members pm on pm.player_id = p.id
  join public.profiles pr on pr.user_id = pm.user_id
 where p.slug like 'rls-test-%'
 order by p.slug;
