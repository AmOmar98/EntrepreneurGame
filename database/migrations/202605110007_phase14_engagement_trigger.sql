-- ============================================================================
-- Phase 14 — Scoring d'engagement livrables (paliers 100/25/50)
-- ============================================================================
-- Décisions advisor lockées (cf. .planning/phases/14-scoring-engagement-livrables/ADVISOR-VERDICT-DISCUSS.md) :
--   Q1=A : badges qualitatifs côté Player (zéro chiffre brut)
--   Q2=A : score_engagement HORS combined ranking 80/20
--   Q3=A : trigger DB + helper TS dual-mode
--   Q5=A : palier "Soumis" et "Reviewed" irréversibles, palier "Validé"
--          recalculé selon le verdict le plus récent par template
--
-- Règles cumulatives par (player, deliverable_template) :
--   +100 si ≥1 submission existe (palier "Soumis", irréversible)
--   +25  si ≥1 evaluation existe (palier "Reviewed", irréversible peu importe verdict)
--   +50  si le verdict le plus récent par template est `validate_v1`
--        OU `validate_v2` (palier "Validé", recalculé sur chaque update de verdict)
--
-- Total max par livrable validé = 175 pts d'engagement (en plus de la note
-- qualité 0..25 existante, qui reste intacte dans `players.score_project`).
--
-- Colonne cible (existe déjà depuis schema.sql L148) :
--   `public.players.score_engagement numeric(6,2) not null default 0`
--
-- RLS : pas de changement requis (les policies `players_*` couvrent déjà
-- toutes les colonnes de la table). La colonne est invisible Player-à-Player
-- par construction (policies existantes restreignent au cohort + GM).
-- ============================================================================

-- ---- Fonction de recalcul agrégé -------------------------------------------

create or replace function public.recalc_player_engagement(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(6,2);
begin
  with
    -- Palier "Soumis" (+100) : au moins une submission existe pour le template.
    submitted as (
      select distinct s.deliverable_template_id as dt_id
      from public.submissions s
      where s.player_id = p_player_id
    ),
    -- Palier "Reviewed" (+25) : au moins une evaluation existe pour ≥1
    -- submission du template (peu importe le verdict).
    reviewed as (
      select distinct s.deliverable_template_id as dt_id
      from public.submissions s
      join public.evaluations e on e.submission_id = s.id
      where s.player_id = p_player_id
    ),
    -- Palier "Validé" (+50) : on prend le verdict le plus récent par
    -- template (par updated_at desc, créated_at desc) ; +50 si validate_v1
    -- ou validate_v2 (Q5=A recalculable).
    latest_verdict as (
      select dt_id, last_verdict
      from (
        select
          s.deliverable_template_id as dt_id,
          e.verdict as last_verdict,
          row_number() over (
            partition by s.deliverable_template_id
            order by e.updated_at desc, e.created_at desc
          ) as rn
        from public.submissions s
        join public.evaluations e on e.submission_id = s.id
        where s.player_id = p_player_id
      ) ordered
      where rn = 1
    ),
    validated as (
      select dt_id from latest_verdict
      where last_verdict in ('validate_v1'::public.verdict, 'validate_v2'::public.verdict)
    )
  select coalesce(
    (select count(*) from submitted) * 100 +
    (select count(*) from reviewed)  * 25  +
    (select count(*) from validated) * 50,
    0
  )
  into v_total;

  update public.players
     set score_engagement = v_total
   where id = p_player_id;
end;
$$;

comment on function public.recalc_player_engagement(uuid) is
  'Phase 14 — Recalcul cumulatif des paliers d''engagement (100/25/50) par template pour un Player donné. Miroir du helper TS lib/score.ts:sumPlayerScoreEngagement. Aucun rendu numérique côté Player (R1).';

-- ---- Trigger sur submissions (insert/update/delete) -----------------------

create or replace function public.on_submission_engagement_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
begin
  v_player_id := coalesce(new.player_id, old.player_id);
  if v_player_id is not null then
    perform public.recalc_player_engagement(v_player_id);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_submission_engagement
  after insert or update or delete on public.submissions
  for each row execute function public.on_submission_engagement_change();

-- ---- Trigger sur evaluations (insert/update verdict/delete) ----------------

create or replace function public.on_evaluation_engagement_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_submission_id uuid;
begin
  v_submission_id := coalesce(new.submission_id, old.submission_id);
  select s.player_id into v_player_id
    from public.submissions s
   where s.id = v_submission_id;
  if v_player_id is not null then
    perform public.recalc_player_engagement(v_player_id);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_evaluation_engagement
  after insert or update or delete on public.evaluations
  for each row execute function public.on_evaluation_engagement_change();

-- ---- Backfill initial (idempotent) -----------------------------------------
-- Recalculer score_engagement pour TOUS les players existants à l'application
-- de la migration, pour que la nouvelle colonne reflète l'historique des
-- submissions + evaluations déjà présentes. Idempotent (re-run safe).

do $$
declare
  rec record;
begin
  for rec in select id from public.players loop
    perform public.recalc_player_engagement(rec.id);
  end loop;
end;
$$;

-- ---- Test inline (commentaires, à exécuter manuellement post-apply) -------
-- Test 1 : Player A soumet 1 livrable → score_engagement passe à 100.
-- Test 2 : Mentor évalue (insert evaluation verdict='validate_v1') → 100+25+50=175.
-- Test 3 : Mentor change verdict→'request_v2' (update) → 100+25 = 125 (palier Validé recalculé).
-- Test 4 : Mentor change verdict→'validate_v2' (update) → 100+25+50 = 175 (re-attribué).
-- Test 5 : Delete submission cascade → 0 (player perd tout pour ce template).
