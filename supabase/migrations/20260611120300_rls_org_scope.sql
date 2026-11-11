-- ============================================================================
-- Phase 14-01 : is_in_org SECURITY DEFINER helper + org-scoped RLS policies
-- ============================================================================
-- Part of the multi-tenant schema foundation (TENANT-02).
-- Adds the is_in_org(p_org_id uuid) SECURITY DEFINER helper (analog of
-- is_juror / is_game_master in rls.sql + 20260519120000_jurors_and_pitch_mode.sql)
-- and org-scoped SELECT policies on public.events and public.organizations.
-- All policies use the (select auth.uid()) initplan form (advisor auth_rls_initplan).
-- PROD is currently mono-org (one EIC org) so the policy is structurally
-- inter-org but has no behavioral change in the current pilot.
-- Apply after 20260611120200_levels_data_driven.sql.
-- Tag de securite : v0.4-pre-phase14
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. is_in_org(p_org_id uuid) SECURITY DEFINER helper
--    Follows: is_game_master() in database/rls.sql lines 21-29 and
--             is_juror() in supabase/migrations/20260519120000_jurors_and_pitch_mode.sql lines 26-34
--    Checks: authenticated user is a member of a team (player_members) whose
--    player belongs to a cohort → event → organization.
--    Uses (select auth.uid()) initplan form throughout (never inline, always wrapped).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_in_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.events e
    JOIN public.cohorts c   ON c.event_id = e.id
    JOIN public.players p   ON p.cohort_id = c.id
    JOIN public.player_members pm ON pm.player_id = p.id
    WHERE e.organization_id = p_org_id
      AND pm.user_id = (select auth.uid())
  )
$$;

-- REVOKE from PUBLIC first, then GRANT to authenticated only (kc2 pattern)
REVOKE EXECUTE ON FUNCTION public.is_in_org(p_org_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_in_org(p_org_id uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. RLS for levels_v2: game_master can manage; authenticated can read
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "levels_v2_authenticated_select" ON public.levels_v2;
CREATE POLICY "levels_v2_authenticated_select" ON public.levels_v2
  AS PERMISSIVE
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "levels_v2_gm_all" ON public.levels_v2;
CREATE POLICY "levels_v2_gm_all" ON public.levels_v2
  AS PERMISSIVE
  FOR ALL TO authenticated
  USING (public.is_game_master())
  WITH CHECK (public.is_game_master());

-- ----------------------------------------------------------------------------
-- 3. Org-scoped SELECT policy on public.events
--    Tolerates NULL organization_id (pre-backfill safety clause).
--    Game-master sees all events regardless of org (preserves admin surfaces).
--    Uses (select auth.uid()) inside is_in_org (via helper) and is_game_master().
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "events_org_scope_select" ON public.events;
CREATE POLICY "events_org_scope_select" ON public.events
  AS PERMISSIVE
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR public.is_in_org(organization_id)
    OR public.is_game_master()
  );

-- ----------------------------------------------------------------------------
-- 4. RLS for public.organizations
--    Authenticated users can read orgs they belong to (via is_in_org).
--    Game-master can read all orgs.
-- ----------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_member_select" ON public.organizations;
CREATE POLICY "organizations_member_select" ON public.organizations
  AS PERMISSIVE
  FOR SELECT TO authenticated
  USING (
    public.is_in_org(id)
    OR public.is_game_master()
  );

DROP POLICY IF EXISTS "organizations_gm_all" ON public.organizations;
CREATE POLICY "organizations_gm_all" ON public.organizations
  AS PERMISSIVE
  FOR ALL TO authenticated
  USING (public.is_game_master())
  WITH CHECK (public.is_game_master());

COMMIT;

-- ── Rollback (manual — destructive, reserved for emergency only) ─────────────
-- Step 4: DROP POLICY IF EXISTS "organizations_gm_all" ON public.organizations;
--         DROP POLICY IF EXISTS "organizations_member_select" ON public.organizations;
-- Step 3: DROP POLICY IF EXISTS "events_org_scope_select" ON public.events;
-- Step 2: DROP POLICY IF EXISTS "levels_v2_gm_all" ON public.levels_v2;
--         DROP POLICY IF EXISTS "levels_v2_authenticated_select" ON public.levels_v2;
-- Step 1: REVOKE EXECUTE ON FUNCTION public.is_in_org(uuid) FROM authenticated;
--         DROP FUNCTION IF EXISTS public.is_in_org(uuid);
-- ─────────────────────────────────────────────────────────────────────────────
