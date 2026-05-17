-- =============================================================================
-- RLS test (SKELETON, not executed) — players cross-team isolation
-- Quick 260517-rlh — audit dispatch 2026-05-17
--
-- TARGET: a Supabase BRANCH (never PROD). Wrapped in begin/rollback for safety.
--
-- Fixtures expected:
--   - event_id   = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
--   - cohort_id  = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
--   - alpha team = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
--   - beta team  = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
--   - alice (member of alpha)  = '11111111-1111-1111-1111-111111111111'
--   - bob   (mentor)           = '22222222-2222-2222-2222-222222222222'
--   - carol (game_master)      = '33333333-3333-3333-3333-333333333333'
--
-- These fixtures are placeholder UUIDs — real fixtures will be created in
-- _fixtures.sql during the follow-up hardening session.
-- =============================================================================

begin;

-- TODO: load fixtures (set local role service_role; insert ...);

-- -----------------------------------------------------------------------------
-- Case 1: alice (player, alpha team) sees her own team
-- -----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';

do $$
begin
  if not exists (
    select 1 from public.players
     where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ) then
    raise exception 'FAIL case 1: alice cannot SELECT her own player row';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Case 2: alice does NOT see beta team (cross-team isolation)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from public.players
     where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
  ) then
    raise exception 'CARDINAL R1 BREACH case 2: alice can SELECT beta team';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Case 3: alice cannot UPDATE beta team (write isolation)
-- Expected behavior: UPDATE affects 0 rows (RLS filter denies). No 42501
-- because policy uses USING/WITH CHECK, not REVOKE.
-- -----------------------------------------------------------------------------
do $$
declare
  v_rows int;
begin
  update public.players
     set name = 'pwned'
   where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'CARDINAL R1 BREACH case 3: alice UPDATE beta team (% rows)', v_rows;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Case 4: bob (mentor) can SELECT both teams (mentor read-all)
-- -----------------------------------------------------------------------------
set local "request.jwt.claim.sub" to '22222222-2222-2222-2222-222222222222';

do $$
begin
  if not exists (select 1 from public.players where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc') then
    raise exception 'FAIL case 4a: mentor bob cannot SELECT alpha team';
  end if;
  if not exists (select 1 from public.players where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd') then
    raise exception 'FAIL case 4b: mentor bob cannot SELECT beta team';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Case 5: bob (mentor) CANNOT INSERT a new player (GM-only insert)
-- Expected: 42501 from policy WITH CHECK.
-- -----------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.players (cohort_id, slug, name)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'rogue', 'rogue team');
    raise exception 'FAIL case 5: mentor bob was able to INSERT player';
  exception when insufficient_privilege then
    -- expected
    null;
  end;
end $$;

rollback;
