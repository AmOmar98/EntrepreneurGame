-- ============================================================================
-- Phase 16-01 : pitch_criteria table + pitch_scores.scores jsonb
-- ============================================================================
-- ADDITIVE ONLY: CREATE TABLE IF NOT EXISTS; ADD COLUMN IF NOT EXISTS;
-- idempotent CHECK via DROP-then-ADD.
-- Apply after 20260611230000_phase15_engine_columns.sql.
-- Tag de securite : v0.4-pre-phase16
-- PROD apply: deferred to batched operator checkpoint.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. New table: pitch_criteria
--    Stores per-event jury evaluation criteria (replaces the hardcoded c1..c5
--    column labels). One row per criterion per event.
--    JURY-06 : dynamic criteria per event.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pitch_criteria (
  id       uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid     NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  key      text     NOT NULL,
  label    text     NOT NULL,
  max      smallint NOT NULL CHECK (max BETWEEN 1 AND 100),
  ord      smallint NOT NULL DEFAULT 0,
  UNIQUE (event_id, key)
);

COMMENT ON TABLE public.pitch_criteria IS
  'Phase 16 (JURY-06): Per-event jury evaluation criteria. Replaces the hardcoded c1..c5 column labels on pitch_scores. Legacy rows keep c1..c5; new scores path uses the scores jsonb column.';

-- ----------------------------------------------------------------------------
-- 2. Additive column on pitch_scores: scores jsonb (nullable)
--    Legacy rows (AgreenTech + Digi archives) keep c1..c5 only.
--    total_score GENERATED ALWAYS AS (c1+c2+c3+c4+c5) STORED is NEVER touched.
-- ----------------------------------------------------------------------------

ALTER TABLE public.pitch_scores
  ADD COLUMN IF NOT EXISTS scores jsonb;

-- ----------------------------------------------------------------------------
-- 3. CHECK constraint: scores must be null or a non-empty object
--    Drop-then-add pattern for idempotency.
--    Prevents empty {} payloads (T-16-03 tamper mitigation).
-- ----------------------------------------------------------------------------

ALTER TABLE public.pitch_scores
  DROP CONSTRAINT IF EXISTS pitch_scores_scores_object_or_null;

ALTER TABLE public.pitch_scores
  ADD CONSTRAINT pitch_scores_scores_object_or_null
  CHECK (scores IS NULL OR (jsonb_typeof(scores) = 'object' AND scores <> '{}'::jsonb));

-- ----------------------------------------------------------------------------
-- 4. Grants on pitch_criteria
--    Authenticated users may read; GMs may write (gated by RLS below).
-- ----------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_criteria TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. RLS on pitch_criteria
--    T-16-01: only game_master may INSERT/UPDATE/DELETE; all authenticated
--    users may SELECT.
-- ----------------------------------------------------------------------------

ALTER TABLE public.pitch_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pitch_criteria_authenticated_select ON public.pitch_criteria;
CREATE POLICY pitch_criteria_authenticated_select ON public.pitch_criteria
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS pitch_criteria_gm_all ON public.pitch_criteria;
CREATE POLICY pitch_criteria_gm_all ON public.pitch_criteria
  FOR ALL TO authenticated
  USING (public.is_game_master())
  WITH CHECK (public.is_game_master());

COMMIT;

-- ── Rollback (manual — reserved for emergency only) ──────────────────────────
-- ALTER TABLE public.pitch_scores
--   DROP CONSTRAINT IF EXISTS pitch_scores_scores_object_or_null,
--   DROP COLUMN IF EXISTS scores;
-- DROP TABLE IF EXISTS public.pitch_criteria;
-- ─────────────────────────────────────────────────────────────────────────────
