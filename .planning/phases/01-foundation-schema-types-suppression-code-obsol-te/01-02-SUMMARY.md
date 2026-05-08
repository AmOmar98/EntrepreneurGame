---
phase: 01-foundation-schema-types-suppression-code-obsol-te
plan: 02
subsystem: routes-actions-components
tags: [delete, refactor, foundation]
status: complete
commit: 5a64479
---

# Phase 1 Plan 02: Hard-delete obsolete code Summary

Removed every page, export route, component, and server action depending on Phase 1 deleted concepts. Repo compiles and builds cleanly.

## What changed

### Deleted (filesystem)
- Pages: `app/committee/`, `app/admin/game/`, `app/admin/startups/`, `app/mailto/`, `app/projects/`, `app/review/`, `app/ops/`
- Export routes: entire `app/api/export/` (committee, eml, kpi-snapshot.csv, cohort.csv, review-queue.csv) and the now-empty `app/api/` parent
- Components: `proof-workflow.tsx`, `onboarding-kyc-form.tsx`, `project-card.tsx`, `badge.tsx`, `page-header.tsx`

### Rewritten
- `app/actions.ts`: trimmed to auth-only (`signIn` Flow + `signOut` + `WorkflowState`); removed all bonus/committee/mailto/deliverable/KYC/startup mutations and supporting Zod schemas
- `components/app-shell.tsx`: role union `'player'|'mentor'|'game_master'`; minimal local `navItems` map; lucide-react import removed (no icons in trimmed shell), `journeyPhases`/`navItems` import from `lib/data` removed
- `app/page.tsx`: minimal landing with link to `/login`; no AppShell
- `app/journey/page.tsx`, `app/coach/page.tsx`, `app/onboarding/page.tsx`, `app/admin/page.tsx`, `app/startup/[slug]/page.tsx`: 7-line placeholders ("Implementation Phase X")
- `app/login/page.tsx`: client component with `useActionState(signIn, ...)`, minimal email/password form, error display

## Verification

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run build`: pass — 9 routes generated (/, /admin, /coach, /journey, /login, /onboarding, /startup/[slug], /_not-found, plus middleware)
- Forbidden symbol grep on `app/`, `components/`, `utils/`: zero matches for `BonusEvent|bonusRules|prestige_xp|Checkpoint|MaturityPhase|committeeDossierRows|reviewReminderBody|deliverableMailBody|mailtoUrl` (matches remain only in planning docs and `lib/data.ts` which plan 03 deletes)

## Deviations from plan

- **Deleted `components/badge.tsx` and `components/page-header.tsx`** entirely (plan 02 task 2d allowed this when no surviving page uses them — confirmed via grep that all consumers are deleted pages or the placeholder pages I replaced). This avoids dragging deleted symbols (`statusTone` from `lib/data`) into Phase 1.

## Self-Check

- All listed deletions absent from filesystem (PowerShell Test-Path returned False for all 13 items).
- Commit `5a64479` exists.
- typecheck + lint + build clean.

## Self-Check: PASSED
