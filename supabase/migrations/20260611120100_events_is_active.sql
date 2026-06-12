-- ============================================================================
-- Phase 14-01 : events.is_active flag + single-active backfill
-- ============================================================================
-- Part of the multi-tenant schema foundation (TENANT-03 schema half).
-- Adds an explicit boolean is_active flag on events, replacing the implicit
-- "most recent starts_at" convention. Exactly one event is flagged active
-- (the most recent by starts_at DESC). A partial unique index enforces the
-- single-active invariant at the DB level.
-- The TS call-site sweep (Plan 03) replaces the .order("starts_at",..).limit(1)
-- convention with .eq("is_active", true). For now the flag is file-only.
-- ADDITIVE ONLY — no DROP, no ALTER COLUMN TYPE.
-- Apply after 20260611120000_organizations.sql.
-- Tag de securite : v0.4-pre-phase14
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Add is_active boolean column (NOT NULL DEFAULT false is safe:
--    means "no event flagged active" before backfill — TS accessor in Plan 02
--    keeps a fallback to starts_at ordering during the pre-apply window)
-- ----------------------------------------------------------------------------

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.is_active IS 'Exactly one event should be true at a time. Replaces the order by starts_at desc limit 1 convention (TENANT-03).';

-- ----------------------------------------------------------------------------
-- 2. Backfill: set is_active = true for the event currently selected by the
--    legacy convention (most recent starts_at). Single-row UPDATE — at most
--    one event becomes active.
-- ----------------------------------------------------------------------------

UPDATE public.events
SET is_active = true
WHERE id = (
  SELECT id FROM public.events ORDER BY starts_at DESC LIMIT 1
);

-- ----------------------------------------------------------------------------
-- 3. Partial unique index — DB-level invariant: at most one active event
-- ----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uniq_events_single_active
  ON public.events ((is_active))
  WHERE is_active;

-- ----------------------------------------------------------------------------
-- 4. Regular index for fast is_active = true lookups
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_events_is_active
  ON public.events(is_active)
  WHERE is_active;

COMMIT;

-- ── Rollback (manual — destructive, reserved for emergency only) ─────────────
-- Step 4: DROP INDEX IF EXISTS idx_events_is_active;
-- Step 3: DROP INDEX IF EXISTS uniq_events_single_active;
-- Step 2: (no data to revert — flag can be reset: UPDATE events SET is_active = false)
-- Step 1: ALTER TABLE public.events DROP COLUMN IF EXISTS is_active;
-- ─────────────────────────────────────────────────────────────────────────────
