-- ============================================================================
-- Phase 15-01 — Test SQL idempotence trigger recalc_player_engagement.
-- ============================================================================
-- PROD-SAFE : tous les scénarios sont wrappés begin; ... rollback;.
--             Aucune mutation persistante. Exécutable en PROD sans risque.
--
-- Usage : exécution manuelle via Cloud Studio SQL Editor.
--   URL : https://supabase.com/dashboard/project/vzzbjxmfkmvqkaqxalhr/sql/new
--
-- Pré-requis :
--   - Migration 202605110007_phase14_engagement_trigger.sql appliquée en PROD.
--   - Au moins 1 Player et 1 deliverable_template existants (cohorte AgreenTech ok).
--
-- Cardinal Q5=A Phase 14 (rappel) :
--   +100 si ≥1 submission existe (palier "Soumis", irréversible)
--   +25  si ≥1 evaluation existe (palier "Reviewed", irréversible)
--   +50  si verdict le plus récent ∈ {validate_v1, validate_v2} (recalculé)
--   Total max par livrable validé = 175 pts.
--
-- Enum verdict actuel (database/schema.sql:51-56) :
--   'validate_v1' | 'request_v2' | 'validate_v2' | 'reject'
--   (Le plan évoquait reject_v1/reject_v2 — n'existent pas, le rejet unique = 'reject'.)
--
-- Verdict reporting : chaque scénario imprime via `raise notice` une ligne
-- PASS/FAIL avec valeur attendue vs observée. Un PASS = retour de la fonction
-- conforme à la formule cumulative attendue.
--
-- Owner : Phase 15-01 executor — 2026-05-11.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper : afficher les variables session pour debug
-- ----------------------------------------------------------------------------
\echo '== Phase 15-01 idempotence — début exécution =='
\echo ''

-- ============================================================================
-- Scénario 1 : Insert duplicate submission (palier "Soumis" idempotent)
-- ============================================================================
-- Player A insère 2 submissions sur le MÊME deliverable_template_id (versions
-- distinctes pour respecter UNIQUE (player_id, deliverable_template_id, version)).
-- La CTE `submitted` utilise `select distinct s.deliverable_template_id` →
-- attendu : palier Soumis = +100 (pas +200 même avec 2 submissions).
-- Total attendu = 100. Aucune evaluation → palier Reviewed = 0, Validé = 0.

begin;
do $$
declare
  v_player_id uuid;
  v_template_id uuid;
  v_event_id uuid;
  v_user_id uuid;
  v_observed numeric;
begin
  select id into v_player_id from public.players limit 1;
  select id into v_template_id from public.deliverable_templates limit 1;
  select event_id into v_event_id from public.players where id = v_player_id;
  select user_id into v_user_id from public.player_members where player_id = v_player_id limit 1;

  if v_player_id is null or v_template_id is null then
    raise notice 'Scénario 1 : SKIP — pas de player/template disponible';
    return;
  end if;

  -- Insertion 1 (version 1)
  insert into public.submissions (
    player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by
  ) values (
    v_player_id, v_template_id, 1, 'proof_url', 'https://test-15-01.example/v1', 'submitted_v1', v_user_id
  );

  raise notice 'Scénario 1 : après 1ère insertion, score_engagement = % (attendu 100)',
    (select score_engagement from public.players where id = v_player_id);

  -- Insertion 2 (version 2) sur le MÊME template
  insert into public.submissions (
    player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by
  ) values (
    v_player_id, v_template_id, 2, 'proof_url', 'https://test-15-01.example/v2', 'submitted_v2', v_user_id
  );

  select score_engagement into v_observed from public.players where id = v_player_id;

  if v_observed = 100 then
    raise notice 'Scénario 1 : PASS — score_engagement=% (attendu 100, palier Soumis idempotent par template)', v_observed;
  else
    raise notice 'Scénario 1 : FAIL — score_engagement=% (attendu 100)', v_observed;
  end if;
end $$;
rollback;

-- ============================================================================
-- Scénario 2 : Update verdict aller-retour validate→reject→validate (Q5=A)
-- ============================================================================
-- Vérifie que le palier "Validé" (+50) est bien RECALCULÉ sur le verdict le
-- plus récent, et non figé sur la première evaluation.
-- Séquence attendue :
--   submit + eval(validate_v1)         → 100+25+50 = 175
--   update eval verdict='reject'       → 100+25+0  = 125
--   update eval verdict='validate_v2'  → 100+25+50 = 175

begin;
do $$
declare
  v_player_id uuid;
  v_template_id uuid;
  v_user_id uuid;
  v_evaluator_id uuid;
  v_sub_id uuid;
  v_eval_id uuid;
  v_observed numeric;
  v_pass1 boolean;
  v_pass2 boolean;
  v_pass3 boolean;
begin
  select id into v_player_id from public.players limit 1;
  select id into v_template_id from public.deliverable_templates limit 1;
  select user_id into v_user_id from public.player_members where player_id = v_player_id limit 1;
  -- Récupérer un mentor (profile app_role='mentor' ou 'game_master')
  select user_id into v_evaluator_id from public.profiles
    where app_role in ('mentor','game_master') limit 1;

  if v_player_id is null or v_template_id is null or v_evaluator_id is null then
    raise notice 'Scénario 2 : SKIP — pré-requis manquants';
    return;
  end if;

  -- Étape A : submit + eval(validate_v1) → 175
  insert into public.submissions (
    player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by
  ) values (
    v_player_id, v_template_id, 1, 'proof_url', 'https://test-15-02.example/v1', 'submitted_v1', v_user_id
  ) returning id into v_sub_id;

  insert into public.evaluations (submission_id, evaluator_id, scores, feedback, verdict)
  values (v_sub_id, v_evaluator_id, '{}'::jsonb, 'test phase 15-02 A', 'validate_v1')
  returning id into v_eval_id;

  select score_engagement into v_observed from public.players where id = v_player_id;
  v_pass1 := (v_observed = 175);
  raise notice 'Scénario 2 étape A : verdict=validate_v1, score_engagement=% (attendu 175) — %',
    v_observed, case when v_pass1 then 'PASS' else 'FAIL' end;

  -- Étape B : update verdict→'reject' → 125 (palier Validé recalculé = 0)
  update public.evaluations set verdict='reject' where id = v_eval_id;
  select score_engagement into v_observed from public.players where id = v_player_id;
  v_pass2 := (v_observed = 125);
  raise notice 'Scénario 2 étape B : verdict=reject, score_engagement=% (attendu 125) — %',
    v_observed, case when v_pass2 then 'PASS' else 'FAIL' end;

  -- Étape C : update verdict→'validate_v2' → 175 (palier Validé re-attribué)
  update public.evaluations set verdict='validate_v2' where id = v_eval_id;
  select score_engagement into v_observed from public.players where id = v_player_id;
  v_pass3 := (v_observed = 175);
  raise notice 'Scénario 2 étape C : verdict=validate_v2, score_engagement=% (attendu 175) — %',
    v_observed, case when v_pass3 then 'PASS' else 'FAIL' end;

  if v_pass1 and v_pass2 and v_pass3 then
    raise notice 'Scénario 2 : PASS GLOBAL — palier Validé bien recalculé Q5=A';
  else
    raise notice 'Scénario 2 : FAIL GLOBAL — voir étapes ci-dessus';
  end if;
end $$;
rollback;

-- ============================================================================
-- Scénario 3 : Delete submission cascade (palier engagement retombe à 0)
-- ============================================================================
-- Insert sub + eval validate_v1 → 175. Delete submission. Attendu : la
-- cascade (foreign key evaluations.submission_id) supprime la evaluation,
-- et les 2 triggers (trg_submission_engagement + trg_evaluation_engagement)
-- recalculent. Score final attendu = 0 (aucune submission, aucune evaluation).

begin;
do $$
declare
  v_player_id uuid;
  v_template_id uuid;
  v_user_id uuid;
  v_evaluator_id uuid;
  v_sub_id uuid;
  v_observed numeric;
  v_before numeric;
  v_pass boolean;
begin
  select id into v_player_id from public.players limit 1;
  select id into v_template_id from public.deliverable_templates limit 1;
  select user_id into v_user_id from public.player_members where player_id = v_player_id limit 1;
  select user_id into v_evaluator_id from public.profiles
    where app_role in ('mentor','game_master') limit 1;

  if v_player_id is null or v_template_id is null or v_evaluator_id is null then
    raise notice 'Scénario 3 : SKIP — pré-requis manquants';
    return;
  end if;

  -- Snapshot avant : score_engagement actuel (peut être > 0 selon historique)
  select score_engagement into v_before from public.players where id = v_player_id;

  insert into public.submissions (
    player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by
  ) values (
    v_player_id, v_template_id, 1, 'proof_url', 'https://test-15-03.example/v1', 'submitted_v1', v_user_id
  ) returning id into v_sub_id;

  insert into public.evaluations (submission_id, evaluator_id, scores, feedback, verdict)
  values (v_sub_id, v_evaluator_id, '{}'::jsonb, 'test phase 15-03', 'validate_v1');

  select score_engagement into v_observed from public.players where id = v_player_id;
  raise notice 'Scénario 3 : après insert sub+eval, score_engagement=% (attendu base+175=%)',
    v_observed, (v_before + 175);

  -- Delete submission → cascade evaluation → triggers recalculent
  delete from public.submissions where id = v_sub_id;

  select score_engagement into v_observed from public.players where id = v_player_id;
  v_pass := (v_observed = v_before);
  raise notice 'Scénario 3 : après delete sub, score_engagement=% (attendu retour base=%) — %',
    v_observed, v_before, case when v_pass then 'PASS' else 'FAIL' end;
end $$;
rollback;

-- ============================================================================
-- Scénario 4 : Re-eval same submission par 2 evaluations distinctes
-- ============================================================================
-- UNIQUE (submission_id, evaluator_id) sur evaluations (database/schema.sql:198).
-- 2 mentors distincts peuvent évaluer la même submission. Verdict attendu :
--   - palier Soumis (+100) : 1 template → +100
--   - palier Reviewed (+25) : CTE `reviewed` distinct sur template → +25 (pas +50)
--   - palier Validé (+50) : verdict le plus récent (order updated_at desc) → +50
-- Total = 175 stable.

begin;
do $$
declare
  v_player_id uuid;
  v_template_id uuid;
  v_user_id uuid;
  v_eval1_id uuid;
  v_eval2_id uuid;
  v_sub_id uuid;
  v_observed numeric;
  v_pass boolean;
  v_evaluators_count int;
begin
  select id into v_player_id from public.players limit 1;
  select id into v_template_id from public.deliverable_templates limit 1;
  select user_id into v_user_id from public.player_members where player_id = v_player_id limit 1;
  select count(distinct user_id) into v_evaluators_count from public.profiles
    where app_role in ('mentor','game_master');

  if v_evaluators_count < 2 then
    raise notice 'Scénario 4 : SKIP — besoin de ≥2 evaluateurs distincts (observed=%)', v_evaluators_count;
    return;
  end if;

  -- Récupérer 2 evaluators distincts
  select user_id into v_eval1_id from public.profiles
    where app_role in ('mentor','game_master') order by user_id limit 1;
  select user_id into v_eval2_id from public.profiles
    where app_role in ('mentor','game_master') and user_id <> v_eval1_id order by user_id limit 1;

  insert into public.submissions (
    player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by
  ) values (
    v_player_id, v_template_id, 1, 'proof_url', 'https://test-15-04.example/v1', 'submitted_v1', v_user_id
  ) returning id into v_sub_id;

  -- Eval1 par mentor M1 : request_v2 (palier Validé non attribué)
  insert into public.evaluations (submission_id, evaluator_id, scores, feedback, verdict)
  values (v_sub_id, v_eval1_id, '{}'::jsonb, 'test 15-04 M1', 'request_v2');

  -- Eval2 par mentor M2 : validate_v2 (plus récent → palier Validé attribué)
  insert into public.evaluations (submission_id, evaluator_id, scores, feedback, verdict)
  values (v_sub_id, v_eval2_id, '{}'::jsonb, 'test 15-04 M2', 'validate_v2');

  select score_engagement into v_observed from public.players where id = v_player_id;
  v_pass := (v_observed = 175);
  raise notice 'Scénario 4 : score_engagement=% (attendu 175, palier Reviewed distinct par template) — %',
    v_observed, case when v_pass then 'PASS' else 'FAIL' end;
end $$;
rollback;

-- ============================================================================
-- Scénario 5 : Backfill idempotent (re-run safe)
-- ============================================================================
-- Le backfill (do $$ for rec in select id from players loop perform
-- recalc_player_engagement(rec.id); end loop; end $$;) DOIT donner le même
-- total agrégé peu importe le nombre de fois où il est exécuté.
-- Si diff != 0 → bug d'idempotence dans recalc_player_engagement.

begin;
do $$
declare
  v_sum_before numeric;
  v_sum_after numeric;
  v_diff numeric;
  v_pass boolean;
  rec record;
begin
  select coalesce(sum(score_engagement), 0) into v_sum_before from public.players;

  -- Run 1 : recalcul global
  for rec in select id from public.players loop
    perform public.recalc_player_engagement(rec.id);
  end loop;

  -- Run 2 : recalcul global immédiat
  for rec in select id from public.players loop
    perform public.recalc_player_engagement(rec.id);
  end loop;

  select coalesce(sum(score_engagement), 0) into v_sum_after from public.players;
  v_diff := v_sum_after - v_sum_before;
  v_pass := (v_diff = 0);

  raise notice 'Scénario 5 : sum(score_engagement) avant=% après 2 backfills=% (diff=%) — %',
    v_sum_before, v_sum_after, v_diff,
    case when v_pass then 'PASS (idempotent)' else 'FAIL (non-idempotent)' end;
end $$;
rollback;

\echo ''
\echo '== Phase 15-01 idempotence — fin exécution =='
\echo 'Reporter les verdicts dans IDEMPOTENCE-VERDICT.md'
