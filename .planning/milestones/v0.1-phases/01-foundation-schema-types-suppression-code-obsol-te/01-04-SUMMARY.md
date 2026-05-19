---
phase: 01-foundation-schema-types-suppression-code-obsol-te
plan: 04
subsystem: routes-naming
tags: [refactor, rename, routes, foundation]
status: complete
commit: 6e5aecf
---

# Phase 1 Plan 04: Rename routes coach->mentor and startup->player Summary

Moved route folders to align with the brief's vocabulary. DB and TS enum renames already landed in plans 01 and 03; this plan finishes the job.

## What changed

- `git mv app/coach app/mentor` — route renamed
- `git mv app/startup app/player` — route folder renamed (preserves `[slug]` dynamic segment)
- `components/app-shell.tsx`: mentor `navItems` href updated `/coach` -> `/mentor`
- `app/mentor/page.tsx`: function renamed `CoachPage` -> `MentorPage`; heading `Mentor space` -> `Mentor`
- `app/player/[slug]/page.tsx`: already uses `PlayerDetailPage` and `Player detail` heading from plan 02

## Verification

- `npm run typecheck`: pass (after clearing `.next/types/` cache that held stale references to old routes)
- `npm run lint`: pass
- `npm run build`: pass — routes table now shows `/mentor` and `/player/[slug]`, no more `/coach` or `/startup`
- Sweep `grep -rni "coach|startup" app/ components/ lib/ middleware.ts utils/` after changes returns zero matches

## Deviations from plan

- **Build artifact cache hiccup:** `tsc --noEmit` reported missing modules under `.next/types/app/coach/...` and `.next/types/app/startup/...` because the previous build had generated route-type files for the old paths. Cleared `.next/` and re-ran typecheck, which then passed. This is expected after a route rename and is not a code defect.

## Self-Check

- `app/coach/` and `app/startup/` absent (verified via `Get-ChildItem app -Recurse`).
- `app/mentor/page.tsx` and `app/player/[slug]/page.tsx` present.
- Commit `6e5aecf` exists.
- typecheck + lint + build clean.

## Self-Check: PASSED
