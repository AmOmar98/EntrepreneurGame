-- 202605121202_fk_indexes.sql
-- Add covering indexes for 7 FKs flagged by Supabase advisor
-- unindexed_foreign_keys.
--
-- Tables/FKs (per advisor 2026-05-12):
--   announcements.created_by_user_id
--   bonus_events.claimed_by
--   bonus_events.reviewed_by
--   missions.level_id
--   moscow_cards.created_by
--   pitch_scores.player_id
--   submissions.submitted_by
--
-- Note: CONCURRENTLY cannot run in a transaction block. Volume is tiny in
-- pilot (< 1000 rows per table) so non-CONCURRENTLY is safe; apply via
-- mcp__plugin_supabase_supabase__apply_migration which runs DDL outside an
-- implicit transaction.
--
-- DO NOT APPLY pre-pilot. APPLY = post-pilot 14/05 evening, same window as
-- 202605121200 and 202605121201.

CREATE INDEX IF NOT EXISTS announcements_created_by_user_id_idx
  ON public.announcements (created_by_user_id);

CREATE INDEX IF NOT EXISTS bonus_events_claimed_by_idx
  ON public.bonus_events (claimed_by);

CREATE INDEX IF NOT EXISTS bonus_events_reviewed_by_idx
  ON public.bonus_events (reviewed_by);

CREATE INDEX IF NOT EXISTS missions_level_id_idx
  ON public.missions (level_id);

CREATE INDEX IF NOT EXISTS moscow_cards_created_by_idx
  ON public.moscow_cards (created_by);

CREATE INDEX IF NOT EXISTS pitch_scores_player_id_idx
  ON public.pitch_scores (player_id);

CREATE INDEX IF NOT EXISTS submissions_submitted_by_idx
  ON public.submissions (submitted_by);

-- ── Rollback (manual) ───────────────────────────────────────────────────────
-- DROP INDEX IF EXISTS public.announcements_created_by_user_id_idx;
-- DROP INDEX IF EXISTS public.bonus_events_claimed_by_idx;
-- DROP INDEX IF EXISTS public.bonus_events_reviewed_by_idx;
-- DROP INDEX IF EXISTS public.missions_level_id_idx;
-- DROP INDEX IF EXISTS public.moscow_cards_created_by_idx;
-- DROP INDEX IF EXISTS public.pitch_scores_player_id_idx;
-- DROP INDEX IF EXISTS public.submissions_submitted_by_idx;
