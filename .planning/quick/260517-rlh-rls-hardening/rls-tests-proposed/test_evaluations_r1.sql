-- =============================================================================
-- RLS test (SKELETON, not executed) — evaluations cardinal R1 isolation
-- Quick 260517-rlh — audit dispatch 2026-05-17
--
-- CARDINAL R1 (revised 2026-05-11): Player MUST NOT see evaluations.scores or
-- pitch_scores.* for OTHER teams in any context. Per-team own evaluations are
-- allowed (Player sees own deliverable detail page).
--
-- This file is INTENTIONALLY paranoid — every assertion below is BLOCK-severity
-- per CLAUDE.md pre-edit guards.
--
-- Fixtures: same placeholder set as test_players_isolation.sql.
--   alpha submission_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
--   beta submission_id  = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
--   alpha evaluation_id = '99999999-1111-1111-1111-111111111111'
--   beta evaluation_id  = '99999999-2222-2222-2222-222222222222'
-- =============================================================================

begin;

-- TODO: load fixtures via _fixtures.sql (set local role service_role; insert ...)

-- -----------------------------------------------------------------------------
-- Case R1-1: alice (player alpha) sees her OWN evaluation
-- -----------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claim.sub" to '11111111-1111-1111-1111-111111111111';

do $$
begin
  if not exists (
    select 1 from public.evaluations
     where id = '99999999-1111-1111-1111-111111111111'
  ) then
    raise exception 'FAIL R1-1: alice cannot SELECT her own evaluation';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Case R1-2 (CRITICAL): alice MUST NOT see beta evaluation
-- This is the cardinal R1 lock-in.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from public.evaluations
     where id = '99999999-2222-2222-2222-222222222222'
  ) then
    raise exception 'CARDINAL R1 BREACH R1-2: alice can SELECT beta evaluation (scores leaked)';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Case R1-3 (CRITICAL): alice MUST NOT see any pitch_scores for beta
-- -----------------------------------------------------------------------------
do $$
declare
  v_count int;
begin
  select count(*) into v_count
    from public.pitch_scores
   where player_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  if v_count <> 0 then
    raise exception 'CARDINAL R1 BREACH R1-3: alice sees % beta pitch_scores rows', v_count;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Case R1-4: alice cannot INSERT an evaluation (mentor-only)
-- Expected: 42501.
-- -----------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.evaluations
      (submission_id, evaluator_id, scores, total_score, feedback, verdict)
    values
      ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
       '11111111-1111-1111-1111-111111111111',
       '{}'::jsonb, 0, 'self-eval', 'validated');
    raise exception 'FAIL R1-4: alice was able to INSERT evaluation';
  exception when insufficient_privilege then
    null;
  end;
end $$;

-- -----------------------------------------------------------------------------
-- Case R1-5: bob (mentor) CAN insert evaluation, but only with evaluator_id = self
-- -----------------------------------------------------------------------------
set local "request.jwt.claim.sub" to '22222222-2222-2222-2222-222222222222';

do $$
begin
  -- positive: bob inserts with evaluator_id = self
  insert into public.evaluations
    (submission_id, evaluator_id, scores, total_score, feedback, verdict)
  values
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
     '22222222-2222-2222-2222-222222222222',
     '{}'::jsonb, 80, 'ok', 'validated');

  -- negative: bob attempts to insert as carol — must fail
  begin
    insert into public.evaluations
      (submission_id, evaluator_id, scores, total_score, feedback, verdict)
    values
      ('ffffffff-ffff-ffff-ffff-ffffffffffff',
       '33333333-3333-3333-3333-333333333333',
       '{}'::jsonb, 80, 'spoofed', 'validated');
    raise exception 'FAIL R1-5: bob inserted evaluation impersonating carol';
  exception when insufficient_privilege then
    null;
  end;
end $$;

-- -----------------------------------------------------------------------------
-- Case R1-6 (FUTURE — placeholder): anon MUST see zero evaluations
-- Anon role currently has REVOKE on schema public (rls.sql line 266),
-- so this should fail at GRANT level (42501) before RLS evaluates.
-- -----------------------------------------------------------------------------
-- TODO: implement after fixtures landed. Suspected GAP — see AUDIT.md G-04.

rollback;
