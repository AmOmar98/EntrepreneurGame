-- ============================================================================
-- Phase 16-01 : event_settings table — per-event XP rules + scoring config
-- ============================================================================
-- ADDITIVE ONLY: CREATE TABLE IF NOT EXISTS; idempotent backfill.
-- Apply after 20260611240000_phase16_pitch_criteria.sql.
-- Tag de securite : v0.4-pre-phase16
-- PROD apply: deferred to batched operator checkpoint.
-- ============================================================================
-- All defaults mirror current hardcoded values (zero behavior change):
--   xp_first_submission 100 ← lib/journey.ts:348 earnedXp += 100
--   xp_validate_v1       50 ← lib/journey.ts:352 earnedXp += 50
--   xp_validate_v2      100 ← lib/journey.ts:353 earnedXp += 100
--   eng_submitted       100 ← lib/score.ts:72 SUBMITTED_POINTS
--   eng_reviewed         25 ← lib/score.ts:73 REVIEWED_POINTS
--   eng_validated        50 ← lib/score.ts:74 VALIDATED_POINTS
--   pitch_weight        0.8 ← lib/results.ts:33 DEFAULT_PITCH_WEIGHT
--   bonus_multiplier_cap 3.0 ← lib/types.ts:260 BONUS_MULTIPLIER_CAP
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. New table: event_settings
--    SETTINGS-01/02: XP rules, engagement thresholds, pitch weight,
--    and bonus multiplier cap per event.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event_settings (
  event_id             uuid         PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  -- XP rules (SETTINGS-01) — default = current hardcoded values
  xp_first_submission  int          NOT NULL DEFAULT 100,
  xp_validate_v1       int          NOT NULL DEFAULT 50,
  xp_validate_v2       int          NOT NULL DEFAULT 100,
  -- Engagement threshold points (SETTINGS-01) — default = SUBMITTED/REVIEWED/VALIDATED_POINTS
  eng_submitted        int          NOT NULL DEFAULT 100,
  eng_reviewed         int          NOT NULL DEFAULT 25,
  eng_validated        int          NOT NULL DEFAULT 50,
  -- Pitch weight for combined ranking (SETTINGS-02) — default = DEFAULT_PITCH_WEIGHT
  pitch_weight         numeric(4,3) NOT NULL DEFAULT 0.800
    CHECK (pitch_weight BETWEEN 0.0 AND 1.0),
  -- Bonus multiplier cap (SETTINGS-01) — default = BONUS_MULTIPLIER_CAP (lib/types.ts:260)
  bonus_multiplier_cap numeric      NOT NULL DEFAULT 3.0
    CHECK (bonus_multiplier_cap >= 1.0),
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.event_settings IS
  'Phase 16 (SETTINGS-01/02): Per-event configurable XP rules, engagement thresholds, pitch weight, and bonus multiplier cap. All defaults = current hardcoded values (zero behavior change at defaults).';

-- ----------------------------------------------------------------------------
-- 2. Grants on event_settings
--    Authenticated users may read; GMs may write (gated by RLS below).
-- ----------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE ON public.event_settings TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. RLS on event_settings
--    T-16-01: only game_master may INSERT/UPDATE; all authenticated SELECT.
-- ----------------------------------------------------------------------------

ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_settings_authenticated_select ON public.event_settings;
CREATE POLICY event_settings_authenticated_select ON public.event_settings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS event_settings_gm_all ON public.event_settings;
CREATE POLICY event_settings_gm_all ON public.event_settings
  FOR ALL TO authenticated
  USING (public.is_game_master())
  WITH CHECK (public.is_game_master());

-- ----------------------------------------------------------------------------
-- 4. Idempotent backfill: insert default row for every existing event.
--    ON CONFLICT DO NOTHING ensures re-run safety.
-- ----------------------------------------------------------------------------

INSERT INTO public.event_settings (event_id)
SELECT id FROM public.events
ON CONFLICT (event_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. updated_at trigger — bootstrap-safe DO $$ block
--    Binds trg_event_settings_updated_at to set_updated_at() (defined in
--    database/triggers.sql). Bootstrap-safe: only runs if table exists.
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.event_settings') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_event_settings_updated_at ON public.event_settings;
    CREATE TRIGGER trg_event_settings_updated_at
      BEFORE UPDATE ON public.event_settings
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

COMMIT;

-- ── Rollback (manual — reserved for emergency only) ──────────────────────────
-- DROP TABLE IF EXISTS public.event_settings;
-- ─────────────────────────────────────────────────────────────────────────────
