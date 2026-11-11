-- ============================================================================
-- Phase 13 / Plan 13-01 — Consolidation database/ vs PROD (OPS-01)
-- ============================================================================
-- IDEMPOTENT — apply via Supabase MCP execute_sql ou SQL Editor (Omar).
-- Aucun statement destructif (pas de DROP/DELETE/TRUNCATE/UPDATE de données).
-- Ces objets existent DÉJÀ en PROD avec cet état exact (cf. OPS-01-drift-report.md,
-- évidence kc2 2026-05-23) : exécuter ce fichier contre PROD est un NO-OP.
-- Rôle principal de ce fichier : artefact de mirror vers database/triggers.sql
-- (Task 3, checkpoint opérateur — Write/Edit deny sur database/**).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1 — set_help_requests_updated_at (PROD-only vs triggers.sql)
-- Corps : supabase/migrations/20260512100000_help_requests.sql:26-34
-- Attribut search_path='' : appliqué PROD par quick-260523-kc2 D1.sql
-- Cible mirror : database/triggers.sql (remplace le commentaire de gap l.169-178)
-- ----------------------------------------------------------------------------

create or replace function public.set_help_requests_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- PART 2 — set_pitch_mode_closed_at (PROD-only vs triggers.sql ET supabase/migrations/)
-- Corps : .planning/quick/260519-jpr-pitch-mode-replay/migrations/01-jurors-and-pitch-mode.sql:58-68
-- Attribut search_path='' : appliqué PROD par quick-260523-kc2 D1.sql
-- NB : la référence à NEW.pitch_mode_state (enum public.pitch_mode_state) est
-- une colonne du record NEW — pas de résolution via search_path requise ; les
-- littéraux 'closed' sont castés sur le type de la colonne. Compatible search_path=''.
-- ----------------------------------------------------------------------------

create or replace function public.set_pitch_mode_closed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.pitch_mode_state = 'closed' and (old.pitch_mode_state is distinct from 'closed') then
    new.pitch_mode_closed_at := now();
  elsif new.pitch_mode_state <> 'closed' then
    new.pitch_mode_closed_at := null;
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- PART 3 — Grants : 11 fonctions SECURITY DEFINER (kc2 D3, verbatim)
-- DÉJÀ présents dans database/rls.sql:391-422 (commit fe30c6b) ET appliqués PROD.
-- Ré-inclus ici par idempotence pour que 13-NEW.sql soit auto-suffisant.
-- ----------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.current_app_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_auto_eval_fiches_entretien() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_auto_eval_fiches_entretien() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_game_master() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_game_master() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_juror(p_event_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_juror(p_event_id uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_mentor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_mentor() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_my_player(p_player_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_my_player(p_player_id uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.on_evaluation_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.on_evaluation_change() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.on_evaluation_engagement_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.on_evaluation_engagement_change() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.on_submission_engagement_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.on_submission_engagement_change() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recalc_player_engagement(p_player_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalc_player_engagement(p_player_id uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recalc_player_score(p_player_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalc_player_score(p_player_id uuid) TO authenticated;

-- ============================================================================
-- FIN — Rappels checkpoint opérateur (Task 3) :
-- 1. Mirror PART 1 + PART 2 dans database/triggers.sql (remplacer l.169-178).
-- 2. Recopier .planning/quick/260519-jpr-pitch-mode-replay/migrations/01-jurors-and-pitch-mode.sql
--    dans supabase/migrations/ (règle 3 MANIFEST) — version_name suggéré :
--    20260519120000_jurors_and_pitch_mode.sql.
-- 3. (Optionnel) Exécuter ce fichier contre PROD pour confirmer le no-op.
-- ============================================================================
