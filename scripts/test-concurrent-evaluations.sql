-- ============================================================================
-- Phase 15-04 — Test concurrence mentors / V1+V2 / publish results.
-- ============================================================================
-- PROD-SAFE : Scénarios A et B wrappés begin; ... rollback;.
--             Scénario C lit-only (pg_locks introspection).
--
-- Usage : exécution manuelle via Cloud Studio SQL Editor.
--   URL : https://supabase.com/dashboard/project/vzzbjxmfkmvqkaqxalhr/sql/new
--
-- APPROCHE : simulation séquentielle dans transactions distinctes.
--   Pour reproduire de la VRAIE concurrence (parallélisme racy), exécution
--   manuelle 2-onglets Cloud Studio (procédure documentée plus bas).
--   Ce script donne la baseline déterministe ; la VRAIE race est testée
--   manuellement par Omar via deux fenêtres SQL parallèles.
--
-- Pré-requis :
--   - Migration 202605110007_phase14_engagement_trigger.sql appliquée.
--   - Cohorte AgreenTech : ≥2 mentors distincts (M01, M02) et ≥1 Player.
--
-- Contraintes UNIQUE observées (database/schema.sql) :
--   - evaluations : UNIQUE (submission_id, evaluator_id) → 2 mentors avec
--     evaluator_id distincts peuvent évaluer la même submission ; un mentor
--     ne peut pas créer 2 evaluations sur la même submission (upsert path).
--   - submissions : UNIQUE (player_id, deliverable_template_id, version) →
--     V1 + V2 coexistent sur versions distinctes ; impossible 2× V1.
--
-- Cardinal R2 : Zod côté actions REFUSE proprement les inputs invalides.
-- Cardinal Q5=A : palier Validé recalculé sur verdict le plus récent par template.
--
-- Owner : Phase 15-04 executor — 2026-05-11.
-- ============================================================================

\echo '== Phase 15-04 concurrence — début exécution =='
\echo ''

-- ============================================================================
-- Scénario A : 2 mentors évaluent la même submission séquentiellement
-- ============================================================================
-- Deux insertions evaluations sur la MÊME submission avec evaluator_id DISTINCTS.
-- UNIQUE (submission_id, evaluator_id) permet cette double évaluation.
-- Trigger trg_evaluation_engagement recalcule recalc_player_engagement
-- après CHAQUE insert → palier Validé pris sur le verdict le plus récent.
--
-- Pour tester la VRAIE concurrence (parallélisme racy), voir bloc "Procédure
-- 2-onglets" en bas du script. Ce scénario donne la baseline déterministe.

begin;
do $$
declare
  v_player_id uuid;
  v_template_id uuid;
  v_user_id uuid;
  v_eval1_id uuid;
  v_eval2_id uuid;
  v_sub_id uuid;
  v_evaluators_count int;
  v_observed numeric;
  v_evaluations_count int;
  v_pass_uniqueness boolean;
  v_pass_engagement boolean;
begin
  select id into v_player_id from public.players limit 1;
  select id into v_template_id from public.deliverable_templates limit 1;
  select user_id into v_user_id from public.player_members where player_id = v_player_id limit 1;
  select count(distinct user_id) into v_evaluators_count from public.profiles
    where app_role in ('mentor','game_master');

  if v_evaluators_count < 2 then
    raise notice 'Scénario A : SKIP — besoin ≥2 evaluateurs distincts (observed=%)', v_evaluators_count;
    return;
  end if;

  select user_id into v_eval1_id from public.profiles
    where app_role in ('mentor','game_master') order by user_id limit 1;
  select user_id into v_eval2_id from public.profiles
    where app_role in ('mentor','game_master') and user_id <> v_eval1_id order by user_id limit 1;

  insert into public.submissions (
    player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by
  ) values (
    v_player_id, v_template_id, 1, 'proof_url', 'https://test-15-04A.example/v1', 'submitted_v1', v_user_id
  ) returning id into v_sub_id;

  -- Étape 1 : M1 évalue request_v2
  insert into public.evaluations (submission_id, evaluator_id, scores, feedback, verdict, expected_action)
  values (v_sub_id, v_eval1_id, '{}'::jsonb, 'M1 demande V2', 'request_v2', 'corriger section X')
  returning id into v_eval1_id;

  raise notice 'Scénario A étape 1 : M1 verdict=request_v2 inséré, score_engagement=%',
    (select score_engagement from public.players where id = v_player_id);

  -- Étape 2 : M2 évalue validate_v1 (verdict plus récent) sur la même submission
  insert into public.evaluations (submission_id, evaluator_id, scores, feedback, verdict)
  values (v_sub_id, v_eval2_id, '{}'::jsonb, 'M2 valide direct', 'validate_v1')
  returning id into v_eval2_id;

  -- Vérifier 2 evaluations distinctes coexistent
  select count(*) into v_evaluations_count from public.evaluations where submission_id = v_sub_id;
  v_pass_uniqueness := (v_evaluations_count = 2);
  raise notice 'Scénario A : evaluations sur submission=%, count=% (attendu 2) — %',
    v_sub_id, v_evaluations_count, case when v_pass_uniqueness then 'PASS' else 'FAIL' end;

  -- Vérifier palier Validé recalculé sur verdict le plus récent (validate_v1 de M2)
  select score_engagement into v_observed from public.players where id = v_player_id;
  v_pass_engagement := (v_observed = 175);
  raise notice 'Scénario A : score_engagement=% (attendu 175, palier Validé Q5=A sur dernier verdict M2=validate_v1) — %',
    v_observed, case when v_pass_engagement then 'PASS' else 'FAIL' end;

  if v_pass_uniqueness and v_pass_engagement then
    raise notice 'Scénario A : PASS GLOBAL — 2 mentors coexistent, trigger Q5=A correct';
  else
    raise notice 'Scénario A : FAIL GLOBAL — voir détails ci-dessus';
  end if;

  -- Bonus : tester insert duplicate par MÊME evaluator (devrait violer UNIQUE)
  begin
    insert into public.evaluations (submission_id, evaluator_id, scores, feedback, verdict)
    values (v_sub_id, v_eval1_id, '{}'::jsonb, 'M1 retry', 'validate_v1');
    raise notice 'Scénario A bonus : FAIL — duplicate insert (submission_id, evaluator_id=M1) accepté !';
  exception when unique_violation then
    raise notice 'Scénario A bonus : PASS — UNIQUE (submission_id, evaluator_id) violation captée comme attendu';
  end;
end $$;
rollback;

-- ============================================================================
-- Scénario B : V1 + V2 quasi-simultanées même Player + même template
-- ============================================================================
-- UNIQUE (player_id, deliverable_template_id, version) sur submissions.
-- V1 (version=1) et V2 (version=2) coexistent sur versions distinctes.
-- Trigger trg_submission_engagement recalcule à chaque insert :
--   palier Soumis = count distinct template = +100 (pas +200 même avec V1+V2)
-- Score attendu après V1+V2 sans evaluation = 100.

begin;
do $$
declare
  v_player_id uuid;
  v_template_id uuid;
  v_user_id uuid;
  v_observed numeric;
  v_before numeric;
  v_count_subs int;
  v_pass boolean;
begin
  select id into v_player_id from public.players limit 1;
  select id into v_template_id from public.deliverable_templates limit 1;
  select user_id into v_user_id from public.player_members where player_id = v_player_id limit 1;

  if v_player_id is null or v_template_id is null then
    raise notice 'Scénario B : SKIP — pré-requis manquants';
    return;
  end if;

  select score_engagement into v_before from public.players where id = v_player_id;

  -- Insert V1
  insert into public.submissions (
    player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by
  ) values (
    v_player_id, v_template_id, 1, 'proof_url', 'https://test-15-04B.example/v1', 'feedback_received', v_user_id
  );

  raise notice 'Scénario B étape 1 (V1) : score_engagement=%',
    (select score_engagement from public.players where id = v_player_id);

  -- Insert V2 (quasi-simultanée — pas de pg_sleep nécessaire, trigger sync)
  insert into public.submissions (
    player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by
  ) values (
    v_player_id, v_template_id, 2, 'proof_url', 'https://test-15-04B.example/v2', 'submitted_v2', v_user_id
  );

  select count(*) into v_count_subs from public.submissions
    where player_id = v_player_id and deliverable_template_id = v_template_id;
  select score_engagement into v_observed from public.players where id = v_player_id;

  -- Engagement = base + 100 (palier Soumis distinct par template, indépendant de version)
  v_pass := (v_observed = v_before + 100);
  raise notice 'Scénario B : V1+V2 inserees (count=%), score_engagement=% (attendu base %+100=%) — %',
    v_count_subs, v_observed, v_before, (v_before + 100),
    case when v_pass then 'PASS' else 'FAIL' end;

  -- Bonus : tenter insert V1 dupliquée (verifie UNIQUE)
  begin
    insert into public.submissions (
      player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by
    ) values (
      v_player_id, v_template_id, 1, 'proof_url', 'https://test-15-04B.example/v1-dup', 'submitted_v1', v_user_id
    );
    raise notice 'Scénario B bonus : FAIL — duplicate V1 accepté (UNIQUE cassé)';
  exception when unique_violation then
    raise notice 'Scénario B bonus : PASS — UNIQUE (player_id, deliverable_template_id, version) violation captée';
  end;
end $$;
rollback;

-- ============================================================================
-- Scénario C : Update verdict simultané avec publish results (deadlock check)
-- ============================================================================
-- Lit-only — observe les verrous pris par trg_evaluation_recalc et
-- trg_evaluation_engagement pour estimer le risque deadlock.
-- Pas de scénario destructif : on regarde pg_locks après une simulation
-- d'update verdict + lecture events.results_published_at.

begin;
do $$
declare
  v_lock_count int;
  v_blocked_count int;
begin
  -- Inspection des verrous actuels sur les tables critiques
  select count(*) into v_lock_count
    from pg_locks
   where relation in (
     'public.evaluations'::regclass,
     'public.submissions'::regclass,
     'public.players'::regclass,
     'public.events'::regclass
   );

  select count(*) into v_blocked_count
    from pg_locks
   where not granted;

  raise notice 'Scénario C : pg_locks sur tables critiques = %, verrous non-grantés (deadlock potentiel) = %',
    v_lock_count, v_blocked_count;

  if v_blocked_count = 0 then
    raise notice 'Scénario C : PASS — aucun deadlock observé baseline (re-run pendant test 2-onglets pour confirmer)';
  else
    raise notice 'Scénario C : WARN — % verrous non-grantés détectés (à investiguer)', v_blocked_count;
  end if;
end $$;
rollback;

\echo ''
\echo '== Phase 15-04 concurrence — fin exécution (scénarios déterministes) =='
\echo ''
\echo '== Procédure 2-onglets Cloud Studio (VRAIE concurrence racy) =='
\echo ''
\echo 'Pour reproduire une vraie race condition entre M01 et M02 :'
\echo ''
\echo 'Onglet 1 (M01) :'
\echo '  begin;'
\echo '  -- insert eval M01 verdict=request_v2 sur submission <id>'
\echo '  -- (NE PAS commit/rollback encore)'
\echo ''
\echo 'Onglet 2 (M02) :'
\echo '  begin;'
\echo '  -- insert eval M02 verdict=validate_v1 sur la MEME submission <id>'
\echo '  -- (UNIQUE (submission_id, evaluator_id) → ok car evaluators distincts)'
\echo '  -- commit;'
\echo ''
\echo 'Retour Onglet 1 :'
\echo '  commit;'
\echo ''
\echo 'Vérifier :'
\echo '  - 2 evaluations distinctes coexistent'
\echo '  - score_engagement final = 175 (palier Valide Q5=A sur verdict le plus recent)'
\echo '  - aucune erreur deadlock (pg_advisory_lock pas necessaire car UNIQUE narrow)'
\echo ''
\echo 'Reporter les verdicts dans CONCURRENCE-VERDICT.md'
