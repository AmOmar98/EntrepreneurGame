-- D2: Wrap auth.uid() in (SELECT auth.uid()) for 5 RLS policies
-- Post-mortem section D line 124. Performance: O(1) instead of O(n) re-eval.
-- Each DROP+CREATE pair is verbatim copy from pg_policies with replacement applied.
-- Transaction wrapping ensures rollback on any syntax error.

BEGIN;

-- 1/5 help_requests_player_insert_own (INSERT, with_check only)
DROP POLICY help_requests_player_insert_own ON public.help_requests;
CREATE POLICY help_requests_player_insert_own ON public.help_requests
  FOR INSERT TO authenticated
  WITH CHECK (is_my_player(player_id) AND (requested_by = (SELECT auth.uid())));

-- 2/5 jurors_self_select (SELECT, qual only)
DROP POLICY jurors_self_select ON public.jurors;
CREATE POLICY jurors_self_select ON public.jurors
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 3/5 pitch_scores_juror_self_insert (INSERT, with_check only)
DROP POLICY pitch_scores_juror_self_insert ON public.pitch_scores;
CREATE POLICY pitch_scores_juror_self_insert ON public.pitch_scores
  FOR INSERT TO authenticated
  WITH CHECK (((juror_id = (SELECT auth.uid())) AND is_juror(event_id)) OR is_game_master());

-- 4/5 pitch_scores_juror_self_update (UPDATE, qual AND with_check)
DROP POLICY pitch_scores_juror_self_update ON public.pitch_scores;
CREATE POLICY pitch_scores_juror_self_update ON public.pitch_scores
  FOR UPDATE TO authenticated
  USING (((juror_id = (SELECT auth.uid())) AND is_juror(event_id)) OR is_game_master())
  WITH CHECK (((juror_id = (SELECT auth.uid())) AND is_juror(event_id)) OR is_game_master());

-- 5/5 pitch_scores_select_visibility (SELECT, qual only — complex nested EXISTS)
DROP POLICY pitch_scores_select_visibility ON public.pitch_scores;
CREATE POLICY pitch_scores_select_visibility ON public.pitch_scores
  FOR SELECT TO authenticated
  USING (
    is_game_master()
    OR ((juror_id = (SELECT auth.uid())) AND is_juror(event_id))
    OR (
      is_juror(event_id)
      AND EXISTS (
        SELECT 1
        FROM events e
        WHERE e.id = pitch_scores.event_id
          AND (
            e.pitch_mode_state = 'closed'::pitch_mode_state
            OR e.results_published_at IS NOT NULL
          )
      )
    )
  );

COMMIT;
