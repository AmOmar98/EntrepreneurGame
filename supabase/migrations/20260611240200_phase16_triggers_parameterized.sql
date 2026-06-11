-- ============================================================================
-- Phase 16-01 : get_event_setting_int helper + parameterized recalc_player_engagement
-- ============================================================================
-- ADDITIVE ONLY: CREATE OR REPLACE FUNCTION (idempotent).
-- Apply after 20260611240100_phase16_event_settings.sql.
-- Tag de securite : v0.4-pre-phase16
-- PROD apply: deferred to batched operator checkpoint.
-- ============================================================================
-- SETTINGS-03: zero double-hardcode — recalc_player_engagement reads engagement
-- thresholds via get_event_setting_int instead of free literals 100/25/50.
-- Fallback defaults in get_event_setting_int = current hardcoded values.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper: get_event_setting_int
--    Returns a typed int setting for a given event, with a COALESCE fallback
--    default. SECURITY DEFINER + search_path = public (T-16-02 mitigation).
--    STABLE: pure read, no side effects, cacheable within a transaction.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_event_setting_int(
  p_event_id uuid,
  p_key      text,
  p_default  int
)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE p_key
      WHEN 'xp_first_submission' THEN (SELECT xp_first_submission FROM public.event_settings WHERE event_id = p_event_id)
      WHEN 'xp_validate_v1'      THEN (SELECT xp_validate_v1      FROM public.event_settings WHERE event_id = p_event_id)
      WHEN 'xp_validate_v2'      THEN (SELECT xp_validate_v2      FROM public.event_settings WHERE event_id = p_event_id)
      WHEN 'eng_submitted'       THEN (SELECT eng_submitted        FROM public.event_settings WHERE event_id = p_event_id)
      WHEN 'eng_reviewed'        THEN (SELECT eng_reviewed         FROM public.event_settings WHERE event_id = p_event_id)
      WHEN 'eng_validated'       THEN (SELECT eng_validated        FROM public.event_settings WHERE event_id = p_event_id)
    END,
    p_default
  );
$$;

COMMENT ON FUNCTION public.get_event_setting_int(uuid, text, int) IS
  'Phase 16 (SETTINGS-03): Returns a typed int setting from event_settings for a given event+key, with a fallback default. Used by recalc_player_engagement to read configurable thresholds (zero double-hardcode). Fallback defaults = current hardcoded values.';

REVOKE EXECUTE ON FUNCTION public.get_event_setting_int(uuid, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_setting_int(uuid, text, int) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. Parameterized recalc_player_engagement
--    Replaces the phase-14 version. Resolves v_event_id via
--    player -> cohort -> event, then reads eng_submitted/reviewed/validated
--    through get_event_setting_int with fallback defaults 100/25/50.
--    SETTINGS-03: free literals 100/25/50 appear ONLY as fallback defaults
--    here — not in the engagement computation itself.
--    Behavior at defaults is IDENTICAL to the phase-14 version.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalc_player_engagement(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total         numeric(6,2);
  v_event_id      uuid;
  v_eng_submitted int;
  v_eng_reviewed  int;
  v_eng_validated int;
BEGIN
  -- Resolve event_id via player -> cohort -> event (schema: players.cohort_id -> cohorts.event_id)
  SELECT e.id INTO v_event_id
  FROM public.players pl
  JOIN public.cohorts c ON c.id = pl.cohort_id
  JOIN public.events  e ON e.id = c.event_id
  WHERE pl.id = p_player_id
  LIMIT 1;

  -- Read configurable thresholds from event_settings (SETTINGS-03).
  -- Fallback defaults = current hardcoded values (zero behavior change).
  v_eng_submitted := public.get_event_setting_int(v_event_id, 'eng_submitted', 100);
  v_eng_reviewed  := public.get_event_setting_int(v_event_id, 'eng_reviewed',  25);
  v_eng_validated := public.get_event_setting_int(v_event_id, 'eng_validated', 50);

  WITH
    -- Palier "Soumis": at least one submission exists for the template.
    submitted AS (
      SELECT DISTINCT s.deliverable_template_id AS dt_id
      FROM public.submissions s
      WHERE s.player_id = p_player_id
    ),
    -- Palier "Reviewed": at least one evaluation exists for >= 1 submission of the template.
    reviewed AS (
      SELECT DISTINCT s.deliverable_template_id AS dt_id
      FROM public.submissions s
      JOIN public.evaluations e ON e.submission_id = s.id
      WHERE s.player_id = p_player_id
    ),
    -- Palier "Valide": take the most recent verdict per template (Q5=A recalculable).
    latest_verdict AS (
      SELECT dt_id, last_verdict
      FROM (
        SELECT
          s.deliverable_template_id AS dt_id,
          e.verdict AS last_verdict,
          row_number() OVER (
            PARTITION BY s.deliverable_template_id
            ORDER BY e.updated_at DESC, e.created_at DESC
          ) AS rn
        FROM public.submissions s
        JOIN public.evaluations e ON e.submission_id = s.id
        WHERE s.player_id = p_player_id
      ) ordered
      WHERE rn = 1
    ),
    validated AS (
      SELECT dt_id FROM latest_verdict
      WHERE last_verdict IN ('validate_v1'::public.verdict, 'validate_v2'::public.verdict)
    )
  SELECT COALESCE(
    (SELECT COUNT(*) FROM submitted) * v_eng_submitted +
    (SELECT COUNT(*) FROM reviewed)  * v_eng_reviewed  +
    (SELECT COUNT(*) FROM validated) * v_eng_validated,
    0
  )
  INTO v_total;

  UPDATE public.players
     SET score_engagement = v_total
   WHERE id = p_player_id;
END;
$$;

COMMENT ON FUNCTION public.recalc_player_engagement(uuid) IS
  'Phase 16 (SETTINGS-03): Parameterized recalc — reads eng_submitted/reviewed/validated via get_event_setting_int with fallbacks 100/25/50. Resolves event via player->cohort->event. Behavior identical to phase-14 at default settings. Mirrors TS lib/score.ts:sumPlayerScoreEngagement.';

REVOKE EXECUTE ON FUNCTION public.recalc_player_engagement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalc_player_engagement(uuid) TO authenticated;
