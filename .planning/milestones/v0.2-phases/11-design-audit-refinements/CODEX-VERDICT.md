# Codex Rescue — Phase 11 Independent Review

**Reviewer** : Codex CLI (non-Claude perspective)
**Date** : 2026-05-10
**Note** : Codex returned verdict in read-only sandbox; this file transcribes verbatim.

---

## Verdict

Proceed only after tightening the plan. The wave split is mostly sound, but it is too optimistic for T-1 because it treats visual fidelity work as equivalent to pilot-readiness work. Wave A is acceptable. Wave D is harmless. Wave C is correctly marked sensitive, but C1 is larger than stated: `app/page.tsx` currently calls `getCurrentUser()` and redirects unauthenticated users to `/login`, while middleware only treats `/login`, `/api`, `/_next`, and `/auth/callback` as public. A new `/landing` will be unreachable in Supabase mode unless `utils/supabase/middleware.ts` is explicitly updated and smoked.

I would move B3 to v0.3 unless the published `/results` replay is a must-have live visual. It adds a new client hook and converts/touches server-oriented results components for animation-only value. At T-1, that risk is not justified compared with auth, demo-mode, and R1/R3 protection. B1/B2/B5 are acceptable if `prefers-reduced-motion` and mobile smoke are mandatory. B4 is optional polish and should be skipped on any time pressure.

Second-order risks missed: C1 can break onboarding redirect behavior for authenticated players if `/landing` is public but not exempted thoughtfully; C2 is already a known broken pattern in `app/journey/page.tsx` because `getCurrentUser()` happens before `hasSupabaseEnv()`, so treat it as a fix, not a design refinement; B3 may require `"use client"` boundaries in results components, risking server/client churn and accidental score/rank exposure changes.

Rollback via atomic commits is good, but tag first. Create `v0.2.1-pre-phase11` before edits and record the SHA in the plan. Prefer 13 atomic commits over wave commits; grouped wave commits are too coarse for T-1 rollback.

## Actionable PLAN.md Changes

1. Change C1 file scope to include `utils/supabase/middleware.ts`, with acceptance: unauthenticated `/landing` reachable in Supabase mode, authenticated users still route by role/onboarding state, `/login` loop absent.
2. Defer B3 to v0.3 by default, or mark it "execute only if all Wave C smoke tests are green before cutoff minus 2h."
3. Add a preflight step: tag `v0.2.1-pre-phase11`, run baseline `typecheck/lint/build`, and capture smoke status before the first Phase 11 commit.
