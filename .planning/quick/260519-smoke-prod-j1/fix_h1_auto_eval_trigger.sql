-- ============================================================================
-- H1 Fix — Auto-evaluation trigger for fiches-entretien-v1 submissions
-- ============================================================================
-- Context: smoke PROD J-1 found that the Player-side insert into `evaluations`
-- for auto-validation of fiches-entretien-v1 was rejected by RLS policy
-- `evaluations_mentor_self_insert` (requires `is_mentor() AND evaluator_id =
-- auth.uid() OR is_game_master()`).
--
-- Fix: SECURITY DEFINER trigger on `submissions` AFTER INSERT. When a new
-- submission row has template_slug = 'fiches-entretien-v1' AND status =
-- 'validated', insert the auto-eval row (scores fiche_1..10 = 25, total = 250,
-- verdict = 'validate_v1', evaluator = SYSTEM_AUTO_VALIDATOR_USER_ID =
-- '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334' — Omar G01 canonical system account).
-- SECURITY DEFINER bypasses RLS without exposing service-role to client.
--
-- The app/actions.ts inline evaluations.insert is removed in the same commit
-- (now redundant — trigger handles it).
-- ============================================================================

create or replace function public.fn_auto_eval_fiches_entretien()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_max_score numeric;
begin
  -- Only fire on validated submissions of fiches-entretien-v1.
  if new.status <> 'validated' then
    return new;
  end if;

  select slug, max_score into v_slug, v_max_score
  from deliverable_templates
  where id = new.deliverable_template_id;

  if v_slug <> 'fiches-entretien-v1' then
    return new;
  end if;

  -- Skip if eval already exists (idempotence — should not happen at insert time
  -- but guards against trigger replay).
  if exists (select 1 from evaluations where submission_id = new.id) then
    return new;
  end if;

  insert into evaluations (
    submission_id,
    evaluator_id,
    scores,
    total_score,
    feedback,
    verdict
  ) values (
    new.id,
    '59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334'::uuid,
    jsonb_build_object(
      'fiche_1', 25, 'fiche_2', 25, 'fiche_3', 25, 'fiche_4', 25, 'fiche_5', 25,
      'fiche_6', 25, 'fiche_7', 25, 'fiche_8', 25, 'fiche_9', 25, 'fiche_10', 25
    ),
    coalesce(v_max_score, 250),
    'Auto-validé (Q5 quick-260519-l1l + fix smoke-j1 2026-05-19) : 10 fiches d''entretien soumises. Note fixe 25/25 par fiche.',
    'validate_v1'::verdict
  );

  return new;
end;
$$;

drop trigger if exists trg_auto_eval_fiches_entretien on public.submissions;

create trigger trg_auto_eval_fiches_entretien
  after insert on public.submissions
  for each row
  execute function public.fn_auto_eval_fiches_entretien();

comment on function public.fn_auto_eval_fiches_entretien() is
  'Smoke-J1 fix 2026-05-19: bypass RLS evaluations_mentor_self_insert for auto-validation of fiches-entretien-v1 (10 entretiens terrain). Uses SECURITY DEFINER to insert canonical eval row under G01 evaluator UUID.';
