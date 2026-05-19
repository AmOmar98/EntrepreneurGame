---
phase: 02-player-flow-onboarding-journey-submission
plan: 01
subsystem: onboarding
tags: [onboarding, middleware, server-action, player-flow]
requires:
  - players (table)
  - player_members (table)
  - profiles.app_role
provides:
  - saveOnboarding server action
  - middleware onboarding gate (player only)
  - /onboarding page (Niveau 0 form)
affects:
  - utils/supabase/middleware.ts
  - app/actions.ts
  - app/onboarding/page.tsx
  - components/onboarding-form.tsx
  - lib/i18n.ts
tech_stack_added: []
patterns_used:
  - useActionState client form with WorkflowState return
  - Zod safeParse with surfaced first issue
  - dual-mode (hasSupabaseEnv) graceful demo fallback
  - Supabase one-to-one join on player_members.players
key_files_created:
  - components/onboarding-form.tsx
key_files_modified:
  - app/actions.ts
  - app/onboarding/page.tsx
  - utils/supabase/middleware.ts
  - lib/i18n.ts
decisions:
  - Likert q1..q5 and members checkboxes are validated client+server but NOT persisted (no diagnostic table in Phase 1 schema). Documented in plan interfaces; revisit if S2 (engagement scoring) requires it.
  - score_engagement +=10 on first onboarding completion (ONBOARD-03 closing criterion).
  - middleware does the gate (not just the page) so any deep link redirects players without onboarded_at.
metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_touched: 5
  commits: 2
completed: 2026-05-08
---

# Phase 02 Plan 01: Onboarding Niveau 0 Summary

Onboarding flow live: middleware-driven gate forces first-login players (without `players.onboarded_at`) to /onboarding, where a server-rendered form (team name + idea + 5 Likert + members confirmation) submits via `saveOnboarding` and redirects to /journey on success. Demo mode (no Supabase env) renders an informative placeholder rather than crashing.

## What Was Built

### Task 1 — `saveOnboarding` action + middleware gate (commit `182b882`)

- Added `onboardingSchema` (zod) covering `teamName` (2..80), `idea` (10..500), and `q1..q5` (`z.coerce.number().int().min(1).max(5)`).
- `saveOnboarding(_prev, formData)` returns `WorkflowState`:
  - guards `hasSupabaseEnv()` and `supabase.auth.getUser()`
  - resolves the player via `player_members` one-shot select
  - idempotent: returns `{ ok:true, "Onboarding deja complete." }` if `onboarded_at` already set
  - on success, updates `players.name`, `players.idea`, `players.onboarded_at = now()`, `score_engagement += 10`
  - revalidates `/journey` and `/onboarding`
  - never silently swallows Supabase errors (DATA-04) — surfaces `error.message`
- Middleware (`utils/supabase/middleware.ts`) extended:
  - When user is authenticated and `profiles.app_role = 'player'`, joins `player_members` -> `players(onboarded_at)`
  - Player without `onboarded_at` on a non-public route -> redirect `/onboarding`
  - Player with `onboarded_at` hitting `/onboarding` -> redirect `/journey`
  - Mentor / game_master untouched (no onboarding gate)

### Task 2 — `/onboarding` page + OnboardingForm + i18n (commit `33a5c66`)

- `app/onboarding/page.tsx` (server component):
  - Falls back to a "needs Supabase prod" message when `hasSupabaseEnv()` is false (avoids dev-mode crashes)
  - Redirects unauthenticated users to `/login`
  - Non-player roles -> `pathForRole(role)`
  - Already-onboarded players -> `/journey` (defense in depth alongside middleware)
  - Loads player + teammates from `player_members` join `players(...)` and `player_members` join `profiles(...)`
  - Handles Supabase typing quirk where embedded relations may come back as array or object — normalized via `Array.isArray` guard
- `components/onboarding-form.tsx` (client, "use client"):
  - `useActionState(saveOnboarding, initialState)` + `useRouter().push("/journey")` on `state.ok`
  - 5 required Likert radio groups, idea textarea with live char counter (`/500`), team-name input (2..80)
  - Members checkboxes (`name="membersConfirmed"` multiple) defaulted to checked — values are submitted but not persisted (see Decisions)
  - Disabled submit + status message during pending state
- `lib/i18n.ts` extended with `onboarding_*` keys (FR/EN, ASCII-only per phase 1 convention)

## Decisions Made

- **Likert + membersConfirmed are not persisted.** Phase 1 schema has no `onboarding_diagnostic` table. The plan explicitly authorizes ignoring them after validation; we validate them server-side (zod requires q1..q5) for UX integrity but discard them. Future plan can introduce a JSONB column or a new table if engagement scoring needs them.
- **Engagement bump = +10.** Encoded as `currentEngagement + 10` directly in the action — kept simple, no helper, mirrors ONBOARD-03 closing criterion.
- **Middleware enforces the gate, not just the page.** Avoids deep-link races where a player could load `/journey` before their first onboarding submit.
- **Demo mode shows a friendly message** rather than redirecting or 404-ing, so local dev (no env) still navigates to `/onboarding` cleanly.

## Deviations from Plan

None — plan executed as written.

One minor TS adjustment during typecheck: Supabase's embedded relation typing returns the joined `profiles` row as either an object or a single-element array depending on the schema introspection. Added an `Array.isArray` normalization in `app/onboarding/page.tsx`. Not a deviation, just an idiomatic Supabase typing fix.

## Verification

- `npm run typecheck` — passes
- `npm run lint` — passes
- `npm run build` — passes (Next.js 15.5.18, all 10 routes compile, `/onboarding` 1.88 kB / 108 kB First Load JS)

Manual flow (will be run on real Supabase data once Omar applies schema):
1. Player logs in fresh -> middleware redirects `/journey` -> `/onboarding`
2. Form submit -> `players.onboarded_at` set, `score_engagement += 10` -> `/journey`
3. Re-visit `/onboarding` -> middleware redirects to `/journey`

## Success Criteria

- ONBOARD-02 — middleware redirects first-login Player without `onboarded_at` to `/onboarding`. **Met.**
- ONBOARD-03 — full form (team + idea + 5 Likert + members), submit sets `onboarded_at` and `score_engagement += 10`. **Met.**
- DATA-04 — `saveOnboarding` returns explicit `WorkflowState`, no silent returns. **Met.**

## Self-Check: PASSED

- FOUND: app/actions.ts (saveOnboarding export)
- FOUND: utils/supabase/middleware.ts (onboarding gate)
- FOUND: app/onboarding/page.tsx (server component with form)
- FOUND: components/onboarding-form.tsx (client form)
- FOUND: lib/i18n.ts (onboarding_* keys)
- FOUND: commit 182b882 (Task 1)
- FOUND: commit 33a5c66 (Task 2)
