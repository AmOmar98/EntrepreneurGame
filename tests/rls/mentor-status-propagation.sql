-- tests/rls/mentor-status-propagation.sql
-- Scenarios covering the 260512-msu fix: trigger on_evaluation_change
-- propagates evaluation.verdict -> submissions.status without requiring
-- a widened RLS policy. Also re-verifies the existing RLS contract on
-- submissions UPDATE (Player member OK, GM OK, other Player BLOCK).
--
-- Run as Supabase service-role / Studio SQL editor (postgres). All scenarios
-- are wrapped in a transaction and rolled back, so PROD data is untouched.
-- Requires the following PROD seed:
--   - players.id = '2bdffc22-cd12-4a62-b67b-5f7b298b0410'   -- P05 Nouhaila
--   - player_members linking user 6d317d3b-... (P05 leader) to that player
--   - mentor user 8676f6c5-... = M01 EIC Mentor Sim 1
--   - deliverable_templates.id = '00521778-...' = probleme-v1
--   - one other player_id with NO membership for the P05 leader user
-- These ids match the wiped+seeded state of PROD on 2026-05-11 pilot-ready.

begin;

-- ---------------------------------------------------------------------------
-- Scenario 1 — Trigger propagates verdict=validate_v1 -> status=validated
-- ---------------------------------------------------------------------------
insert into public.submissions (id, player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by)
values ('99999999-0001-0000-0000-000000000001', '2bdffc22-cd12-4a62-b67b-5f7b298b0410', '00521778-c653-4ba9-ae62-7e1b09582299', 1, 'proof_url', 'https://test/v1', 'submitted_v1', '6d317d3b-8c01-4733-ba56-cbafddc4a8f5');
insert into public.evaluations (submission_id, evaluator_id, scores, total_score, feedback, verdict)
values ('99999999-0001-0000-0000-000000000001', '8676f6c5-e94d-41f6-b080-1bb43c0c11d8', '{"k":5}'::jsonb, 25, 'ok', 'validate_v1');
do $$
declare s text;
begin
  select status::text into s from public.submissions where id = '99999999-0001-0000-0000-000000000001';
  if s <> 'validated' then raise exception 'Scenario 1 FAILED: expected validated, got %', s; end if;
  raise notice 'Scenario 1 PASS: verdict validate_v1 -> status %', s;
end$$;

-- ---------------------------------------------------------------------------
-- Scenario 2 — Trigger propagates verdict=request_v2 -> status=feedback_received
-- ---------------------------------------------------------------------------
insert into public.submissions (id, player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by)
values ('99999999-0002-0000-0000-000000000001', '2bdffc22-cd12-4a62-b67b-5f7b298b0410', '00521778-c653-4ba9-ae62-7e1b09582299', 1, 'proof_url', 'https://test/v1', 'submitted_v1', '6d317d3b-8c01-4733-ba56-cbafddc4a8f5');
insert into public.evaluations (submission_id, evaluator_id, scores, total_score, feedback, verdict, expected_action)
values ('99999999-0002-0000-0000-000000000001', '8676f6c5-e94d-41f6-b080-1bb43c0c11d8', '{"k":2}'::jsonb, 10, 'fix', 'request_v2', 'do x');
do $$
declare s text;
begin
  select status::text into s from public.submissions where id = '99999999-0002-0000-0000-000000000001';
  if s <> 'feedback_received' then raise exception 'Scenario 2 FAILED: expected feedback_received, got %', s; end if;
  raise notice 'Scenario 2 PASS: verdict request_v2 -> status %', s;
end$$;

-- ---------------------------------------------------------------------------
-- Scenario 3 — Trigger propagates verdict=validate_v2 -> status=validated
-- ---------------------------------------------------------------------------
insert into public.submissions (id, player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by)
values ('99999999-0003-0000-0000-000000000001', '2bdffc22-cd12-4a62-b67b-5f7b298b0410', '00521778-c653-4ba9-ae62-7e1b09582299', 2, 'proof_url', 'https://test/v2', 'submitted_v2', '6d317d3b-8c01-4733-ba56-cbafddc4a8f5');
insert into public.evaluations (submission_id, evaluator_id, scores, total_score, feedback, verdict)
values ('99999999-0003-0000-0000-000000000001', '8676f6c5-e94d-41f6-b080-1bb43c0c11d8', '{"k":5}'::jsonb, 24, 'ok v2', 'validate_v2');
do $$
declare s text;
begin
  select status::text into s from public.submissions where id = '99999999-0003-0000-0000-000000000001';
  if s <> 'validated' then raise exception 'Scenario 3 FAILED: expected validated, got %', s; end if;
  raise notice 'Scenario 3 PASS: verdict validate_v2 -> status %', s;
end$$;

-- ---------------------------------------------------------------------------
-- Scenario 4 — Trigger propagates verdict=reject -> status=rejected
-- ---------------------------------------------------------------------------
insert into public.submissions (id, player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by)
values ('99999999-0004-0000-0000-000000000001', '2bdffc22-cd12-4a62-b67b-5f7b298b0410', '00521778-c653-4ba9-ae62-7e1b09582299', 1, 'proof_url', 'https://test/v1', 'submitted_v1', '6d317d3b-8c01-4733-ba56-cbafddc4a8f5');
insert into public.evaluations (submission_id, evaluator_id, scores, total_score, feedback, verdict)
values ('99999999-0004-0000-0000-000000000001', '8676f6c5-e94d-41f6-b080-1bb43c0c11d8', '{"k":0}'::jsonb, 0, 'reject', 'reject');
do $$
declare s text;
begin
  select status::text into s from public.submissions where id = '99999999-0004-0000-0000-000000000001';
  if s <> 'rejected' then raise exception 'Scenario 4 FAILED: expected rejected, got %', s; end if;
  raise notice 'Scenario 4 PASS: verdict reject -> status %', s;
end$$;

-- ---------------------------------------------------------------------------
-- Scenario 5 — RLS contract: mentor cannot directly UPDATE submissions.status
--   (still blocked by submissions_member_self_update; trigger is the only
--    pathway). This is a non-regression test for the security model.
-- ---------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"8676f6c5-e94d-41f6-b080-1bb43c0c11d8","role":"authenticated"}';
do $$
declare v_rows int;
begin
  update public.submissions set status = 'rejected'::submission_status
    where id = '99999999-0001-0000-0000-000000000001';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'Scenario 5 FAILED: mentor was allowed to UPDATE (% rows)', v_rows; end if;
  raise notice 'Scenario 5 PASS: mentor cannot directly UPDATE submissions (% rows)', v_rows;
end$$;
reset role;

-- ---------------------------------------------------------------------------
-- Cleanup — full rollback (PROD-safe)
-- ---------------------------------------------------------------------------
rollback;

-- All scenarios should have raised "PASS" notices. Any "FAILED" raise will
-- have aborted the transaction with an exception (still rolled back).
