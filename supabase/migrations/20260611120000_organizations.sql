-- ============================================================================
-- Phase 14-01 : organizations table + events.organization_id FK + default-org backfill
-- ============================================================================
-- Part of the multi-tenant schema foundation (TENANT-01).
-- Creates the organizations reference table, inserts the default EIC org,
-- adds a nullable FK organization_id on events, and backfills all existing
-- events to the default org. ADDITIVE ONLY — no DROP, no ALTER COLUMN TYPE.
-- Apply order: this file first, then 20260611120100_events_is_active.sql.
-- Tag de securite : v0.4-pre-phase14
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. organizations table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text        NOT NULL UNIQUE,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.organizations IS 'Top-level tenant: an organization (e.g. EIC/UEMF) that owns multiple events.';

-- Table-level GRANT so RLS is not the only gate (lesson F-16-01 / help_requests migration).
GRANT SELECT ON public.organizations TO authenticated;
GRANT INSERT, UPDATE ON public.organizations TO authenticated;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Default org: EIC / UEMF (idempotent)
-- ----------------------------------------------------------------------------

INSERT INTO public.organizations (slug, name)
VALUES ('eic', 'EIC / UEMF')
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Add nullable FK on events (additive — NOT NULL tightening deferred)
-- ----------------------------------------------------------------------------

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- ----------------------------------------------------------------------------
-- 4. Backfill: adopt all existing events under EIC (AgreenTech + Digi untouched
--    beyond this new nullable column — TENANT-04 honored)
-- ----------------------------------------------------------------------------

UPDATE public.events
SET organization_id = (
  SELECT id FROM public.organizations WHERE slug='eic'
)
WHERE organization_id IS NULL;

-- ----------------------------------------------------------------------------
-- 5. Index for FK lookups
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_events_organization
  ON public.events(organization_id);

COMMIT;

-- ── Rollback (manual — destructive, reserved for emergency only) ─────────────
-- Step 5: DROP INDEX IF EXISTS idx_events_organization;
-- Step 4: (no data to revert — backfill is idempotent)
-- Step 3: ALTER TABLE public.events DROP COLUMN IF EXISTS organization_id;
-- Step 2: DELETE FROM public.organizations WHERE slug = 'eic';
-- Step 1: DROP TABLE IF EXISTS public.organizations;
-- Note: DROP TABLE cascades to the FK on events — run step 3 first to avoid FK error.
-- ─────────────────────────────────────────────────────────────────────────────
