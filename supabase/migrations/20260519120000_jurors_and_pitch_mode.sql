-- ============================================================================
-- Quick 260519-jpr : Migration DB pitch-mode + jurors table
-- ============================================================================
-- Appliquée via mcp__plugin_supabase_supabase__apply_migration en 3 parts
-- (text-only ici, jamais lu depuis ce fichier — c'est un snapshot traçabilité).
-- Spec source : docs/superpowers/specs/2026-05-19-jury-pitch-replay-design.md
-- Tag de sécurité : v0.2.2-pre-pitch-mode-jpr
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Part A : Table jurors + helper is_juror()
-- name: jurors_table_and_helper
-- ----------------------------------------------------------------------------

CREATE TABLE public.jurors (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at timestamptz NOT NULL DEFAULT now(),
  invited_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX idx_jurors_user ON public.jurors(user_id);
CREATE INDEX idx_jurors_event ON public.jurors(event_id);

CREATE OR REPLACE FUNCTION public.is_juror(p_event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.jurors
    WHERE event_id = p_event_id AND user_id = auth.uid()
  )
$$;

ALTER TABLE public.jurors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jurors_gm_all" ON public.jurors
  FOR ALL TO authenticated
  USING (public.is_game_master())
  WITH CHECK (public.is_game_master());

CREATE POLICY "jurors_self_select" ON public.jurors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Part B : Enum pitch_mode_state + colonnes events + trigger
-- name: pitch_mode_state_column_and_trigger
-- ----------------------------------------------------------------------------

CREATE TYPE public.pitch_mode_state AS ENUM ('off', 'live', 'closed');

ALTER TABLE public.events
  ADD COLUMN pitch_mode_state public.pitch_mode_state NOT NULL DEFAULT 'off',
  ADD COLUMN pitch_mode_closed_at timestamptz NULL;

CREATE OR REPLACE FUNCTION public.set_pitch_mode_closed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.pitch_mode_state = 'closed' AND (OLD.pitch_mode_state IS DISTINCT FROM 'closed') THEN
    NEW.pitch_mode_closed_at := now();
  ELSIF NEW.pitch_mode_state <> 'closed' THEN
    NEW.pitch_mode_closed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_pitch_mode_closed_at
  BEFORE UPDATE OF pitch_mode_state ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_pitch_mode_closed_at();

-- ----------------------------------------------------------------------------
-- Part C : Refonte RLS pitch_scores (corrige faille existante)
-- name: pitch_scores_rls_refonte
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "pitch_scores_member_or_mentor_select" ON public.pitch_scores;
DROP POLICY IF EXISTS "pitch_scores_mentor_self_insert" ON public.pitch_scores;
DROP POLICY IF EXISTS "pitch_scores_mentor_self_update" ON public.pitch_scores;
DROP POLICY IF EXISTS "pitch_scores_gm_delete" ON public.pitch_scores;

CREATE POLICY "pitch_scores_select_visibility" ON public.pitch_scores
  FOR SELECT TO authenticated
  USING (
    public.is_game_master()
    OR (juror_id = auth.uid() AND public.is_juror(pitch_scores.event_id))
    OR (
      public.is_juror(pitch_scores.event_id)
      AND EXISTS(
        SELECT 1 FROM public.events e
        WHERE e.id = pitch_scores.event_id
          AND (e.pitch_mode_state = 'closed' OR e.results_published_at IS NOT NULL)
      )
    )
  );

CREATE POLICY "pitch_scores_juror_self_insert" ON public.pitch_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    (juror_id = auth.uid() AND public.is_juror(event_id))
    OR public.is_game_master()
  );

CREATE POLICY "pitch_scores_juror_self_update" ON public.pitch_scores
  FOR UPDATE TO authenticated
  USING (
    (juror_id = auth.uid() AND public.is_juror(event_id))
    OR public.is_game_master()
  )
  WITH CHECK (
    (juror_id = auth.uid() AND public.is_juror(event_id))
    OR public.is_game_master()
  );

CREATE POLICY "pitch_scores_gm_delete" ON public.pitch_scores
  FOR DELETE TO authenticated
  USING (public.is_game_master());

-- ----------------------------------------------------------------------------
-- Validation (à exécuter via mcp__plugin_supabase_supabase__execute_sql)
-- ----------------------------------------------------------------------------

-- SELECT policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('pitch_scores', 'jurors')
-- ORDER BY tablename, policyname;
--
-- Attendu : 6 lignes
--   jurors            | jurors_gm_all                       | ALL
--   jurors            | jurors_self_select                  | SELECT
--   pitch_scores      | pitch_scores_gm_delete              | DELETE
--   pitch_scores      | pitch_scores_juror_self_insert      | INSERT
--   pitch_scores      | pitch_scores_juror_self_update      | UPDATE
--   pitch_scores      | pitch_scores_select_visibility      | SELECT
