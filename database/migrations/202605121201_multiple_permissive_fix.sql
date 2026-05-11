-- 202605121201_multiple_permissive_fix.sql
-- Splits xxx_gm_all (FOR ALL) policies into per-command policies on 5 tables,
-- removing the SELECT coverage that duplicates xxx_authenticated_select.
-- Per Supabase advisor multiple_permissive_policies.
--
-- Tables: cohorts, deliverable_templates, events, levels, missions.
-- Each had {xxx_authenticated_select (qual=true), xxx_gm_all (FOR ALL)} —
-- 2 PERMISSIVE SELECT policies for role authenticated. GM is authenticated,
-- so they still get SELECT via xxx_authenticated_select. xxx_gm_all is
-- replaced by 3 narrower policies (INSERT/UPDATE/DELETE) preserving write
-- privileges for GM.
--
-- DO NOT APPLY pre-pilot. APPLY = post-pilot 14/05 evening, same window as
-- 202605121200_rls_initplan_fix and 202605121202_fk_indexes.

BEGIN;

-- ── cohorts ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cohorts_gm_all" ON public.cohorts;

CREATE POLICY "cohorts_gm_insert" ON public.cohorts
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_game_master());

CREATE POLICY "cohorts_gm_update" ON public.cohorts
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_game_master())
  WITH CHECK (is_game_master());

CREATE POLICY "cohorts_gm_delete" ON public.cohorts
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_game_master());

-- ── deliverable_templates ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "deliverable_templates_gm_all" ON public.deliverable_templates;

CREATE POLICY "deliverable_templates_gm_insert" ON public.deliverable_templates
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_game_master());

CREATE POLICY "deliverable_templates_gm_update" ON public.deliverable_templates
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_game_master())
  WITH CHECK (is_game_master());

CREATE POLICY "deliverable_templates_gm_delete" ON public.deliverable_templates
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_game_master());

-- ── events ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "events_gm_all" ON public.events;

CREATE POLICY "events_gm_insert" ON public.events
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_game_master());

CREATE POLICY "events_gm_update" ON public.events
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_game_master())
  WITH CHECK (is_game_master());

CREATE POLICY "events_gm_delete" ON public.events
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_game_master());

-- ── levels ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "levels_gm_all" ON public.levels;

CREATE POLICY "levels_gm_insert" ON public.levels
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_game_master());

CREATE POLICY "levels_gm_update" ON public.levels
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_game_master())
  WITH CHECK (is_game_master());

CREATE POLICY "levels_gm_delete" ON public.levels
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_game_master());

-- ── missions ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "missions_gm_all" ON public.missions;

CREATE POLICY "missions_gm_insert" ON public.missions
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_game_master());

CREATE POLICY "missions_gm_update" ON public.missions
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_game_master())
  WITH CHECK (is_game_master());

CREATE POLICY "missions_gm_delete" ON public.missions
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_game_master());

COMMIT;

-- ── Rollback (manual) ───────────────────────────────────────────────────────
-- For each table, drop the three per-cmd policies and recreate xxx_gm_all:
--   DROP POLICY IF EXISTS "xxx_gm_insert" ON public.xxx;
--   DROP POLICY IF EXISTS "xxx_gm_update" ON public.xxx;
--   DROP POLICY IF EXISTS "xxx_gm_delete" ON public.xxx;
--   CREATE POLICY "xxx_gm_all" ON public.xxx
--     AS PERMISSIVE FOR ALL TO authenticated
--     USING (is_game_master())
--     WITH CHECK (is_game_master());
