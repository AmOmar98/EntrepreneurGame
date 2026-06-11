-- ============================================================================
-- Phase 14 review fix CR-01 + IN-03 : enforce org-scoped SELECT on events
-- ============================================================================
-- ⚠ FILE-FIRST — NOT YET APPLIED TO PROD. Apply at the next batched operator
-- checkpoint (Phase 16/18) together with the RLS smoke (scripts/smoke-rls-prod.mjs
-- + the 3-surface smoke /journey /mentor /jury). Do NOT apply blind during
-- event prep: this DROPs the broad events SELECT policy.
--
-- CR-01: the legacy policy "events_authenticated_select" USING (true) is
-- permissive-OR'd with "events_org_scope_select", so org scoping was never
-- evaluated. Fix = widen is_in_org to cover mentors/jurors (IN-03), then drop
-- the broad policy so the org-scoped one becomes the real gate.
-- Mono-org PROD: behavior is identical for every legitimate role (players via
-- membership, mentors via is_mentor, jurors via jurors table, GM via
-- is_game_master) — only org-B outsiders (future) lose visibility.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Widen is_in_org: player membership OR mentor OR juror-of-an-org-event.
--    (GM is handled by is_game_master() in the policy itself.)
--    Mentors are org-global today (no mentor↔org mapping table yet) — they
--    are EIC staff; a future multi-org milestone adds mentor_organizations.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_in_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT
    -- player: member of a team in a cohort of an event of this org
    EXISTS(
      SELECT 1
      FROM public.events e
      JOIN public.cohorts c   ON c.event_id = e.id
      JOIN public.players p   ON p.cohort_id = c.id
      JOIN public.player_members pm ON pm.player_id = p.id
      WHERE e.organization_id = p_org_id
        AND pm.user_id = (select auth.uid())
    )
    -- mentor: EIC staff, org-global until a mentor↔org mapping exists
    OR public.is_mentor()
    -- juror: assigned to an event of this org
    OR EXISTS(
      SELECT 1
      FROM public.events e
      JOIN public.jurors j ON j.event_id = e.id
      WHERE e.organization_id = p_org_id
        AND j.user_id = (select auth.uid())
    )
$$;

REVOKE EXECUTE ON FUNCTION public.is_in_org(p_org_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_in_org(p_org_id uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. Drop the legacy broad SELECT policy that shadowed org scoping (CR-01).
--    events_org_scope_select (org member OR GM OR NULL-org) becomes the gate.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "events_authenticated_select" ON public.events;

COMMIT;

-- ── Rollback (manual) ────────────────────────────────────────────────────────
-- Step 2: CREATE POLICY "events_authenticated_select" ON public.events
--           FOR SELECT TO authenticated USING (true);
-- Step 1: re-apply the is_in_org body from 20260611120300_rls_org_scope.sql.
-- ─────────────────────────────────────────────────────────────────────────────
