-- ============================================================================
-- Phase 14-01 : levels data-driven (text PK table + additive text columns + backfill)
-- ============================================================================
-- Part of the multi-tenant schema foundation (LEVELS-01, LEVELS-02).
-- The existing public.levels table uses public.level_id enum as PK. PG enums
-- cannot shrink — the enum stays. This migration adds a parallel text-keyed
-- table levels_v2 and additive text FK columns on missions and players.
-- The level IDs (L0_diagnostic..L7_alumni) stay unchanged — only the storage
-- type moves from enum to text. The TS data layer (Plan 02) reads levels_v2;
-- the old enum columns remain populated. Physical enum removal is deferred
-- post-July in a separate destructive-only migration.
-- ADDITIVE ONLY: new columns, new table, backfill. Zero in-place type changes.
-- Apply after 20260611120100_events_is_active.sql.
-- Tag de securite : v0.4-pre-phase14
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. levels_v2: text-keyed parallel table
--    Named levels_v2 to avoid collision with the existing enum-keyed public.levels.
--    TS accessor (Plan 02) queries this table via supabase.from("levels_v2").
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.levels_v2 (
  id text PRIMARY KEY,
  ord smallint NOT NULL,
  label text NOT NULL,
  description text NOT NULL DEFAULT ''
);

COMMENT ON TABLE public.levels_v2 IS 'Data-driven levels table (text PK). Parallel to the enum-keyed public.levels; replaces it for the TS data layer once Plan 02-03 are applied. Level IDs (L0_diagnostic..L7_alumni) are identical.';

-- Table-level GRANT (lesson F-16-01: RLS alone insufficient)
GRANT SELECT ON public.levels_v2 TO authenticated;
GRANT INSERT, UPDATE ON public.levels_v2 TO authenticated;

ALTER TABLE public.levels_v2 ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Backfill levels_v2 from the existing enum-keyed levels table
--    id::text preserves the exact enum label string (L0_diagnostic, etc.)
-- ----------------------------------------------------------------------------

INSERT INTO public.levels_v2 (id, ord, label, description)
SELECT id::text, ord, label, description
FROM public.levels
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. missions: additive text FK column + backfill
-- ----------------------------------------------------------------------------

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS level_id_text text REFERENCES public.levels_v2(id);

UPDATE public.missions
SET level_id_text = level_id::text
WHERE level_id_text IS NULL;

-- ----------------------------------------------------------------------------
-- 4. players: additive text FK column + backfill
-- ----------------------------------------------------------------------------

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS current_level_text text REFERENCES public.levels_v2(id);

UPDATE public.players
SET current_level_text = current_level::text
WHERE current_level_text IS NULL;

-- ----------------------------------------------------------------------------
-- 5. Indexes for text FK lookups
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_missions_level_text
  ON public.missions(level_id_text);

CREATE INDEX IF NOT EXISTS idx_players_current_level_text
  ON public.players(current_level_text);

COMMIT;

-- ── Rollback (manual — destructive, reserved for emergency only) ─────────────
-- Step 5: DROP INDEX IF EXISTS idx_players_current_level_text;
--         DROP INDEX IF EXISTS idx_missions_level_text;
-- Step 4: ALTER TABLE public.players DROP COLUMN IF EXISTS current_level_text;
-- Step 3: ALTER TABLE public.missions DROP COLUMN IF EXISTS level_id_text;
-- Step 2: (no data to revert — levels_v2 rows can be deleted: TRUNCATE public.levels_v2)
-- Step 1: DROP TABLE IF EXISTS public.levels_v2;
-- Note: old enum columns missions.level_id + players.current_level remain populated
-- and valid — reads switch back to enum columns. The enum type public.level_id is NOT
-- dropped here; physical enum removal is deferred post-July.
-- ─────────────────────────────────────────────────────────────────────────────
