-- scripts/perf-seed-500.sql
-- Idempotent 500-user perf seed for Entrepreneur Game
--
-- DEFAULT TARGET: a DISPOSABLE Supabase project.
--   Running this on PROD off-event is an operator decision — if you do so,
--   you MUST run the CLEANUP block afterward to restore PROD state.
--   See docs/OBSERVABILITY.md "Perf (QUAL-06)" for the full runbook.
--
-- Usage (disposable project via Supabase SQL editor or psql):
--   psql $DATABASE_URL -f scripts/perf-seed-500.sql
--
-- All inserts use ON CONFLICT DO NOTHING — safe to re-run (idempotent).
-- Every synthetic row is tagged with the perf-seed marker:
--   organization.slug = 'perf-seed-org'
--   event.slug        = 'perf-seed-event'
--   cohort.slug       = 'perf-seed-cohort'
--   player emails     = '*@perf-seed.invalid'
--   player slug prefix= 'perf-seed-player-'
--
-- CLEANUP is in the fenced block at the bottom (commented out by default).
-- Run it ONLY when you are done with the perf test, in FK-safe order.

-- ============================================================================
-- 1. Organization + Event + Cohort (the seed container)
-- ============================================================================

INSERT INTO public.organizations (id, slug, name)
VALUES (
  '00000000-perf-0000-0000-seed000000000'::uuid,
  'perf-seed-org',
  'Perf Seed Organization'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.events (id, slug, name, starts_at, ends_at, organization_id, is_active)
VALUES (
  '00000000-perf-0001-0000-seed000000000'::uuid,
  'perf-seed-event',
  'Perf Seed Event',
  now(),
  now() + interval '2 days',
  '00000000-perf-0000-0000-seed000000000'::uuid,
  false  -- NOT active — never shadows the live event
)
ON CONFLICT DO NOTHING;

INSERT INTO public.cohorts (id, event_id, slug, name)
VALUES (
  '00000000-perf-0002-0000-seed000000000'::uuid,
  '00000000-perf-0001-0000-seed000000000'::uuid,
  'perf-seed-cohort',
  'Perf Seed Cohort'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. Level reference (needed for missions FK; reuse L1_problem)
-- ============================================================================

INSERT INTO public.missions (id, event_id, level_id, ord, kind, title)
VALUES (
  '00000000-perf-0003-0000-seed000000000'::uuid,
  '00000000-perf-0001-0000-seed000000000'::uuid,
  'L1_problem',
  1,
  'atelier',
  'Perf Seed Mission'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.deliverable_templates (id, mission_id, slug, title, description)
VALUES (
  '00000000-perf-0004-0000-seed000000000'::uuid,
  '00000000-perf-0003-0000-seed000000000'::uuid,
  'perf-seed-deliverable',
  'Perf Seed Deliverable',
  'Synthetic deliverable for load testing'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. 500 synthetic Players (teams) + 1 auth.users profile per player
--
-- NOTE: this SQL block seeds the public.* tables only.
-- auth.users rows cannot be created via SQL (Supabase restricts direct inserts
-- into auth.users from SQL editor). Use scripts/perf-seed-500.mjs (Node variant)
-- which uses the service-role key to call supabase.auth.admin.createUser().
--
-- If you want to run the SQL-only path (for testing the schema inserts):
-- the player rows, player_members, and submissions below use a placeholder
-- user_id (perf-seed-user-NNNN) that is NOT backed by real auth.users rows.
-- This is fine for read-path perf tests of the public.* tables (the joins
-- don't traverse auth.users in the RLS-relevant hot path).
-- For full auth-gated perf tests (PostgREST timed queries) use the .mjs variant.
-- ============================================================================

DO $$
DECLARE
  i INT;
  player_id UUID;
  user_id UUID;
  player_slug TEXT;
  player_name TEXT;
BEGIN
  FOR i IN 1..500 LOOP
    player_id := ('00000000-' || lpad(i::text, 4, '0') || '-perf-0000-seed000000000')::uuid;
    -- Synthetic user UUID (not in auth.users — see note above)
    user_id := ('11111111-' || lpad(i::text, 4, '0') || '-perf-0000-seed000000000')::uuid;
    player_slug := 'perf-seed-player-' || lpad(i::text, 4, '0');
    player_name := 'Perf Player ' || i;

    -- Player (team)
    INSERT INTO public.players (id, cohort_id, slug, name, current_level)
    VALUES (
      player_id,
      '00000000-perf-0002-0000-seed000000000'::uuid,
      player_slug,
      player_name,
      'L1_problem'
    )
    ON CONFLICT DO NOTHING;

    -- Profile
    INSERT INTO public.profiles (user_id, app_role, full_name, email)
    VALUES (
      user_id,
      'player',
      player_name,
      'perf-seed-player-' || lpad(i::text, 4, '0') || '@perf-seed.invalid'
    )
    ON CONFLICT DO NOTHING;

    -- Membership
    INSERT INTO public.player_members (player_id, user_id, role, team_role)
    VALUES (
      player_id,
      user_id,
      'player',
      'owner'
    )
    ON CONFLICT DO NOTHING;

    -- Submission (V1) — uses the synthetic user_id as submitted_by
    -- (FK to auth.users; will fail if auth.users row is absent — use .mjs variant for full chain)
    -- Commented out by default; uncomment if your target allows direct auth.users inserts
    -- or if using the .mjs variant which creates real auth users first.
    -- INSERT INTO public.submissions (player_id, deliverable_template_id, version, kind, proof_url, status, submitted_by)
    -- VALUES (
    --   player_id,
    --   '00000000-perf-0004-0000-seed000000000'::uuid,
    --   1,
    --   'proof_url',
    --   'https://example.com/perf-seed-proof-' || i,
    --   'submitted_v1',
    --   user_id
    -- )
    -- ON CONFLICT DO NOTHING;

  END LOOP;
END;
$$;

-- ============================================================================
-- Verification query (run after seeding)
-- ============================================================================
-- SELECT
--   (SELECT count(*) FROM public.players WHERE slug LIKE 'perf-seed-player-%')   AS players,
--   (SELECT count(*) FROM public.profiles WHERE email LIKE '%@perf-seed.invalid') AS profiles,
--   (SELECT count(*) FROM public.player_members pm
--    JOIN public.players p ON p.id = pm.player_id
--    WHERE p.slug LIKE 'perf-seed-player-%')                                       AS memberships;

-- ============================================================================
-- CLEANUP (run to fully remove perf seed)
-- IMPORTANT: Run in FK-safe order. Uncomment the block below and execute.
-- ============================================================================

-- BEGIN;
--
-- -- submissions first (FK: player_id, deliverable_template_id, submitted_by)
-- DELETE FROM public.submissions
-- WHERE deliverable_template_id = '00000000-perf-0004-0000-seed000000000'::uuid;
--
-- -- player_members (FK: player_id, user_id)
-- DELETE FROM public.player_members
-- WHERE player_id IN (
--   SELECT id FROM public.players WHERE slug LIKE 'perf-seed-player-%'
-- );
--
-- -- profiles (keyed by email domain)
-- DELETE FROM public.profiles
-- WHERE email LIKE '%@perf-seed.invalid';
--
-- -- players (FK: cohort_id)
-- DELETE FROM public.players
-- WHERE slug LIKE 'perf-seed-player-%';
--
-- -- deliverable_templates
-- DELETE FROM public.deliverable_templates
-- WHERE id = '00000000-perf-0004-0000-seed000000000'::uuid;
--
-- -- missions
-- DELETE FROM public.missions
-- WHERE id = '00000000-perf-0003-0000-seed000000000'::uuid;
--
-- -- cohort
-- DELETE FROM public.cohorts
-- WHERE id = '00000000-perf-0002-0000-seed000000000'::uuid;
--
-- -- event
-- DELETE FROM public.events
-- WHERE id = '00000000-perf-0001-0000-seed000000000'::uuid;
--
-- -- organization
-- DELETE FROM public.organizations
-- WHERE id = '00000000-perf-0000-0000-seed000000000'::uuid;
--
-- COMMIT;
-- SELECT 'Perf seed cleanup complete.' AS status;
