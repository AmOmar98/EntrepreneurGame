-- Allow anonymous SELECT on announcements (public broadcast content)
-- Reason: RSC render path queries before session cookie established
-- See post-mortem .planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md
--
-- Step 3b finding (2026-05-23) : `revoke all on schema public from anon`
-- (database/rls.sql:266) had stripped both schema USAGE and table SELECT
-- from anon, making the policy alone inert. Omar authorized the minimum
-- grants below to restore actual readability. Scope is bounded: anon gets
-- USAGE on the schema and SELECT on `announcements` ONLY — no other table
-- in `public` becomes anon-readable (no anon-targeted policy exists elsewhere).

CREATE POLICY "announcements_anon_select"
  ON public.announcements
  FOR SELECT
  TO anon
  USING (true);

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.announcements TO anon;
