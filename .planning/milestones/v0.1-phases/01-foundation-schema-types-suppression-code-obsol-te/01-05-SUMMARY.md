---
phase: 01-foundation-schema-types-suppression-code-obsol-te
plan: 05
subsystem: auth-routing
tags: [auth, login, routing, foundation]
status: complete-pending-smoke-test
commit: 34d3659
---

# Phase 1 Plan 05: Login + role-based redirect + stubs Summary

Wired the M1 / AUTH-* requirement: working email/password login that reads `profiles.app_role` and redirects to the correct role-scoped stub.

## What changed

### Created
- `lib/auth.ts`: `getCurrentUser`, `getCurrentRole` (queries `profiles.app_role`, defaults to `player` if absent), `pathForRole` (exhaustive switch on `AppRole`), `redirectForRole` (composes the two).
- `app/auth/callback/route.ts`: shell GET handler that exchanges a `?code=` for a session (used in Phase 4 magic-link bulk import; no-op on direct visit).

### Modified
- `app/actions.ts:signIn`: after a successful `signInWithPassword`, reads the user's profile, resolves AppRole, and `redirect(pathForRole(role))`. Falls back to `/journey` (player) if no profile row.
- `app/page.tsx`: server component — unauthenticated -> `/login`, otherwise `redirectForRole()`.
- `app/journey/page.tsx`, `app/mentor/page.tsx`, `app/admin/page.tsx`: role-aware stubs wrapping content in `<AppShell role={...}>` and displaying `user.email | role` for routing debug (CONTEXT specifics).
- `utils/supabase/middleware.ts`: whitelist now includes `/auth/callback` alongside `/login`, `/api`, `/_next`.

## Verification

- `npm run typecheck`: pass (after clearing `.next/`)
- `npm run lint`: pass
- `npm run build`: pass — 10 routes generated (`/`, `/admin`, `/auth/callback`, `/journey`, `/login`, `/mentor`, `/onboarding`, `/player/[slug]`, `/_not-found`, plus middleware)
- Manual smoke test against fresh Supabase: **PENDING (checkpoint).** Steps below.

## Manual smoke test (operator: Omar)

### Prerequisites

1. Plan 01-01 SQL applied in order on a fresh Supabase project:
   ```sql
   drop schema public cascade;
   create schema public;
   grant usage on schema public to anon, authenticated, service_role;
   ```
   then paste `database/schema.sql` -> `database/triggers.sql` -> `database/rls.sql`.

2. `.env.local` populated:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```

3. In Supabase dashboard -> Authentication -> Users, create 3 users with email + password (and disable email confirmation for the test, or pre-confirm them):
   - `player@test.local` / any password >= 6 chars
   - `mentor@test.local` / any password >= 6 chars
   - `gm@test.local` / any password >= 6 chars

4. Capture each user's UUID from the Users page, then in the SQL editor:
   ```sql
   insert into public.profiles (user_id, app_role, full_name, email) values
     ('<player-uuid>', 'player', 'Test Player', 'player@test.local'),
     ('<mentor-uuid>', 'mentor', 'Test Mentor', 'mentor@test.local'),
     ('<gm-uuid>',     'game_master', 'Test GM', 'gm@test.local');
   ```

### Steps

1. `npm run dev` -> open `http://localhost:3000` (or 3001/3002 if 3000 busy).
2. Should redirect to `/login`.
3. Sign in as `player@test.local` -> redirected to `/journey`. Page displays `role: player` in the debug pre.
4. Clear cookies (or browse in private). Sign in as `mentor@test.local` -> redirected to `/mentor`, role=mentor displayed.
5. Clear cookies. Sign in as `gm@test.local` -> redirected to `/admin`, role=game_master displayed.
6. Submit bad credentials on `/login` -> stay on `/login`, error message visible (Supabase returns "Invalid login credentials").
7. While logged out, navigate directly to `/journey` -> middleware redirects to `/login`.

Expected: all 7 checks pass. If any fails, report the failing step and any console error.

## Deviations from plan

None — plan executed as written.

## Self-Check

- `lib/auth.ts`, `app/auth/callback/route.ts`, all role stubs exist.
- Commit `34d3659` exists.
- typecheck + lint + build clean.
- Smoke test PENDING (manual checkpoint).

## Self-Check: PASSED (build); SMOKE-TEST PENDING
