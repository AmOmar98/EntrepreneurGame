-- 202605121200_rls_initplan_fix.sql
-- Wraps auth.uid() in (select auth.uid()) for 15 RLS policies flagged by
-- Supabase advisor auth_rls_initplan. Strictly behavior-equivalent.
--
-- Source: pg_policies snapshot 2026-05-12 (project vzzbjxmfkmvqkaqxalhr).
-- Advisor: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan
--
-- DO NOT APPLY pre-pilot. APPLY = post-pilot 14/05 evening, after merge
-- polish/design-v2-match -> main, in the same window as 202605121201 + 202605121202.

BEGIN;

-- ── announcements ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "announcements_audience_select" ON public.announcements;
CREATE POLICY "announcements_audience_select" ON public.announcements
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    is_game_master()
    OR (is_mentor() AND (target_kind = ANY (ARRAY['all'::text, 'mentors'::text])))
    OR (target_kind = 'all'::text)
    OR (
      (target_kind = 'level'::text)
      AND EXISTS (
        SELECT 1
        FROM players p
        JOIN player_members pm ON pm.player_id = p.id
        WHERE pm.user_id = (select auth.uid())
          AND (p.current_level)::text = ANY (announcements.target_ids)
      )
    )
    OR (
      (target_kind = 'teams'::text)
      AND EXISTS (
        SELECT 1
        FROM player_members pm
        WHERE pm.user_id = (select auth.uid())
          AND (pm.player_id)::text = ANY (announcements.target_ids)
      )
    )
  );

DROP POLICY IF EXISTS "announcements_gm_insert" ON public.announcements;
CREATE POLICY "announcements_gm_insert" ON public.announcements
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_game_master()
    AND ((created_by_user_id IS NULL) OR (created_by_user_id = (select auth.uid())))
  );

-- ── bonus_events ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "bonus_events_player_insert" ON public.bonus_events;
CREATE POLICY "bonus_events_player_insert" ON public.bonus_events
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      is_my_player(project_id)
      AND (claimed_by = (select auth.uid()))
      AND (status = 'submitted'::bonus_status)
      AND (reviewed_by IS NULL)
      AND (reviewed_at IS NULL)
    )
    OR is_game_master()
  );

-- ── evaluation_comments ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "evaluation_comments_mentor_self_insert" ON public.evaluation_comments;
CREATE POLICY "evaluation_comments_mentor_self_insert" ON public.evaluation_comments
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_mentor() AND (author_user_id = (select auth.uid())))
    OR EXISTS (
      SELECT 1
      FROM submissions s
      WHERE s.id = evaluation_comments.submission_id
        AND is_my_player(s.player_id)
        AND evaluation_comments.author_user_id = (select auth.uid())
    )
  );

-- ── evaluations ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "evaluations_mentor_self_insert" ON public.evaluations;
CREATE POLICY "evaluations_mentor_self_insert" ON public.evaluations
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_mentor() AND (evaluator_id = (select auth.uid())))
    OR is_game_master()
  );

DROP POLICY IF EXISTS "evaluations_mentor_self_update" ON public.evaluations;
CREATE POLICY "evaluations_mentor_self_update" ON public.evaluations
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    (is_mentor() AND (evaluator_id = (select auth.uid())))
    OR is_game_master()
  )
  WITH CHECK (
    (is_mentor() AND (evaluator_id = (select auth.uid())))
    OR is_game_master()
  );

-- ── moscow_cards ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "moscow_cards_player_insert" ON public.moscow_cards;
CREATE POLICY "moscow_cards_player_insert" ON public.moscow_cards
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_my_player(project_id) AND (created_by = (select auth.uid())))
    OR is_game_master()
  );

-- ── pitch_scores ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "pitch_scores_mentor_self_insert" ON public.pitch_scores;
CREATE POLICY "pitch_scores_mentor_self_insert" ON public.pitch_scores
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_mentor() AND (juror_id = (select auth.uid())))
    OR is_game_master()
  );

DROP POLICY IF EXISTS "pitch_scores_mentor_self_update" ON public.pitch_scores;
CREATE POLICY "pitch_scores_mentor_self_update" ON public.pitch_scores
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    (is_mentor() AND (juror_id = (select auth.uid())))
    OR is_game_master()
  )
  WITH CHECK (
    (is_mentor() AND (juror_id = (select auth.uid())))
    OR is_game_master()
  );

-- ── player_members ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "player_members_self_or_mentor_select" ON public.player_members;
CREATE POLICY "player_members_self_or_mentor_select" ON public.player_members
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    (user_id = (select auth.uid()))
    OR is_mentor()
  );

-- ── profiles ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_self_or_mentor_select" ON public.profiles;
CREATE POLICY "profiles_self_or_mentor_select" ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    (user_id = (select auth.uid()))
    OR is_mentor()
  );

DROP POLICY IF EXISTS "profiles_self_or_gm_insert" ON public.profiles;
CREATE POLICY "profiles_self_or_gm_insert" ON public.profiles
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = (select auth.uid()))
    OR is_game_master()
  );

DROP POLICY IF EXISTS "profiles_self_or_gm_update" ON public.profiles;
CREATE POLICY "profiles_self_or_gm_update" ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = (select auth.uid()))
    OR is_game_master()
  )
  WITH CHECK (
    (user_id = (select auth.uid()))
    OR is_game_master()
  );

-- ── submissions ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "submissions_member_self_insert" ON public.submissions;
CREATE POLICY "submissions_member_self_insert" ON public.submissions
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_my_player(player_id) AND (submitted_by = (select auth.uid())))
    OR is_game_master()
  );

DROP POLICY IF EXISTS "submissions_member_self_update" ON public.submissions;
CREATE POLICY "submissions_member_self_update" ON public.submissions
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (
    (is_my_player(player_id) AND (submitted_by = (select auth.uid())))
    OR is_game_master()
  )
  WITH CHECK (
    (is_my_player(player_id) AND (submitted_by = (select auth.uid())))
    OR is_game_master()
  );

COMMIT;

-- ── Rollback (manual) ───────────────────────────────────────────────────────
-- If a regression appears, re-create each original policy by replacing every
-- (select auth.uid()) with auth.uid() in the CREATE statements above. The
-- DROP IF EXISTS is idempotent; rollback is a simple re-apply with the
-- original auth.uid() inline.
