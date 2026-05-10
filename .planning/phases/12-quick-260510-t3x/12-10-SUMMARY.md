---
phase: "12-quick-260510-t3x"
plan: "12-10"
subsystem: "routes + data-layer + journey rail"
tags: [bonus, moscow, routes, surfacing, R1, R3]
one-liner: "5 new files + 2 modified : bonus claim/review routes + MoSCoW snapshot + Kanban surfacing in deliverable page (resolves revision BLOCKER #2)"
dependency-graph:
  requires:
    - "12-06 : server actions (claimBonusEventFlow, reviewBonusEventFlow, *MoscowCard*Flow)"
    - "12-07 : DB migrations bonus_events + moscow_cards"
    - "12-08 : bonus-claim-form + bonus-status-badge components"
    - "12-09 : moscow-kanban + moscow-card components"
  provides:
    - "Player route /journey/bonus/[type] (claim + history)"
    - "Mentor route /mentor/bonus/[id] (review form)"
    - "SSR snapshot /journey/deliverable/[id]/moscow-snapshot (proof_url target)"
    - "Journey rail entry to 3 bonus types"
    - "MoscowKanban surfacing in deliverable page (slug-gated)"
  affects:
    - "Plan 12-11 : CSV export GameMaster (consume bonus_events / moscow_cards)"
    - "Plan 12-12 : smoke E2E full"
tech-stack:
  added: []
  patterns:
    - "Server components Next.js 15 async params"
    - "Dual-mode hasSupabaseEnv() guard + demo fallback"
    - "snake_case row -> camelCase TS via mapRow helpers"
    - "client wrapper for useActionState on WorkflowState-returning actions"
key-files:
  created:
    - lib/bonus.ts
    - lib/moscow.ts
    - app/journey/bonus/[type]/page.tsx
    - app/mentor/bonus/[id]/page.tsx
    - app/journey/deliverable/[id]/moscow-snapshot/page.tsx
    - components/mentor-bonus-review-form.tsx
  modified:
    - app/journey/page.tsx
    - app/journey/deliverable/[id]/page.tsx
decisions:
  - "Created components/mentor-bonus-review-form.tsx as client wrapper to bridge reviewBonusEventFlow WorkflowState signature with native form action (Plan PLAN suggested 'as never' cast — opted for cleaner client component instead)"
  - "Slug-gated MoSCoW Kanban surfacing : MOSCOW_DELIVERABLE_SLUG constant inside page (not in lib/types) — single use site, no need to centralize"
  - "Snapshot page intentionally NOT wrapped in AppShell — proof_url target should be minimal lecture seule"
  - "AppShell variant for mentor route set to 'staff' (not 'mentor') — matches AppShellVariant type ('player' | 'staff')"
metrics:
  duration: "~25 min"
  completed: "2026-05-10"
  tasks: 8
  files-touched: 8
  commits: 1
---

# Phase 12 Plan 12-10 : Bonus + MoSCoW Surface UI Summary

## What was built

Wave 3 surface UI : 5 new files + 2 minor modifications add the bonus claim/review routes for Player and Mentor, the MoSCoW snapshot SSR endpoint (consumable as proof_url), the bonus rail entry on /journey, and the conditional MoscowKanban surfacing in the deliverable detail page (resolves revision-checker BLOCKER #2).

### 1. Data-layer helpers (lib/)

**`lib/bonus.ts`**
- `getBonusEventsForPlayer(playerId)` : returns BonusEvent[] ordered by claimed_at DESC
- `getBonusEventById(id)` : returns BonusEvent | null for Mentor review page
- snake_case row -> camelCase TS via `mapRow`
- Dual-mode safe (returns [] / null when no Supabase env)

**`lib/moscow.ts`**
- `getMoscowCardsForPlayerDeliverable(playerId, deliverableTemplateId)` : returns MoscowCard[] ordered by (bucket, ord)
- Dual-mode safe

### 2. Routes (app/)

**`/journey/bonus/[type]`** (Player)
- Auth-gated role 'player' via `getCurrentRole` + `pathForRole`
- Validates `params.type` against VALID_BONUS_TYPES (notFound otherwise)
- Renders `<BonusClaimForm>` + history filtered to this type with `<BonusStatusBadge>` per row
- R1 STRICT : no numeric multiplier rendered ; only qualitative badges

**`/mentor/bonus/[id]`** (Mentor / GameMaster)
- Auth-gated role 'mentor' || 'game_master'
- Loads bonus via `getBonusEventById` ; notFound on absent
- Displays type, title, description, doc_url link, claimed_at + status badge
- When status = 'submitted' : renders `<MentorBonusReviewForm>` client wrapper
- When already reviewed : renders feedback summary

**`/journey/deliverable/[id]/moscow-snapshot`** (SSR snapshot)
- Public read (RLS gates : Player owner OR Mentor)
- searchParams `?p=<playerId>` resolves which player's cards to show
- Renders 4 columns Must/Should/Could/Won't, ordered by `ord`
- No AppShell — minimal proof page consumable as `proof_url`

### 3. Surfacing modifications

**`app/journey/page.tsx`** (additive only)
- Added a "Bonus disponibles" section after `<JourneyClient>` with 3 links to /journey/bonus/[type]
- Dual-mode demo guard preserved (no auth helper called before `hasSupabaseEnv()` check)

**`app/journey/deliverable/[id]/page.tsx`**
- Added `slug` to `DeliverableTemplateRow` type + DB select
- Added `MOSCOW_DELIVERABLE_SLUG = "fiche-produit-plan-dev-v1"` constant
- Conditionally renders `<MoscowKanban initialCards={moscowCards} deliverableTemplateId={tpl.id}>` when slug matches, immediately after the rubric section
- ProofWorkflow / SubmissionForm fallback preserved below (R3 — never block)

## Cardinal-rule preservation (R1 / R2 / R3)

**R1 STRICT** — Player-facing surfaces never render numeric scores, ranks, multipliers, percentile, /100, /140, toFixed.
- `grep multiplier|score|rank|/100|/140|toFixed|percentile app/journey/bonus/[type]/page.tsx` : 2 hits — both are comment lines documenting R1 + 1 prop pass-through of `multiplierConsumedAt` (string date, not rendered as number — BonusStatusBadge uses it as boolean trigger only)
- `grep ... app/journey/deliverable/[id]/moscow-snapshot/page.tsx` : 1 hit — comment line only
- `grep ... app/journey/page.tsx` : 0 hits

**R2** — Validators warn-only.
- `MentorBonusReviewForm` surfaces `state.message` directly (no severity escalation)
- `MoscowKanban` already wired to recognize "recommandation" warn messages from `submitMoscowDeliverableFlow` (carried over from Plan 12-09)

**R3** — No cross-mission hard blocks, no DOM disabled outside submit pending.
- Bonus rail entries are passive links (Player free to ignore)
- MoSCoW snapshot is read-only
- MoscowKanban surfacing is **additive** — original SubmissionForm / SubmissionTicket / RevisionPanel chain still renders below
- `grep "blocks_progression|disabled.*because" app/journey/...` : 0 hits

## Dual-mode demo guard

**Critical guard preserved** on `app/journey/page.tsx` (Pre-edit guard #3, CLAUDE.md).
- `getCurrentUser()` only called when `hasSupabaseEnv()` is true (line 33)
- `redirect("/login")` only fires when env is set AND user is missing (line 34)
- The new bonus section is rendered unconditionally — works in both Supabase and seed-only modes

New routes (`/journey/bonus/[type]`, `/mentor/bonus/[id]`) follow the same pattern :
- `hasSupabaseEnv()` check before any auth helper call
- Demo mode renders a static FR fallback message (no `getCurrentUser` invoked)

## Build verification

```
npm run typecheck  -> exit 0
npm run lint       -> 6 pre-existing errors in scripts/*.cjs (OUT OF SCOPE)
                      0 errors in plan-touched files
npm run build      -> SUCCESS
   /journey/bonus/[type]                       2.42 kB
   /journey/deliverable/[id]/moscow-snapshot     135 B
   /mentor/bonus/[id]                          2.06 kB
```

All 3 new routes compile and appear in the production manifest.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Mentor form action signature**
- **Found during:** Task 3
- **Issue:** PLAN suggested `<form action={reviewBonusEventFlow as never}>` to bypass TypeScript signature mismatch. The action returns `Promise<WorkflowState>` which is not assignable to React's native `FormAction` type.
- **Fix:** Created `components/mentor-bonus-review-form.tsx` — a small client component using `useActionState(reviewBonusEventFlow, initialState)` to wrap the action cleanly. The Mentor page imports and renders the wrapper. No `as never` cast required.
- **Files modified:** components/mentor-bonus-review-form.tsx (new), app/mentor/bonus/[id]/page.tsx
- **Commit:** 927b899

**2. [Rule 1 - Bug] AppShell variant value**
- **Found during:** Task 3
- **Issue:** PLAN proposed `<AppShell role="mentor" variant="mentor">`. The `AppShellVariant` type in `components/app-shell.tsx` is `"player" | "staff"` — `"mentor"` would fail typecheck.
- **Fix:** Used `variant="staff"` (the existing convention for `/mentor/page.tsx` and `/mentor/submission/[id]/page.tsx`).
- **Files modified:** app/mentor/bonus/[id]/page.tsx
- **Commit:** 927b899

**3. [Rule 2 - Critical] Bonus page demo-mode auth ordering**
- **Found during:** Task 2
- **Issue:** PLAN sketch called `getCurrentUser()` before the `hasSupabaseEnv()` check, which would echo the v0.2 regression on `/journey` that broke 9/12 surfaces (CLAUDE.md Pre-edit guard #3).
- **Fix:** Reordered the new `/journey/bonus/[type]` route — `hasSupabaseEnv()` check FIRST, demo fallback returns early before any auth helper call.
- **Files modified:** app/journey/bonus/[type]/page.tsx
- **Commit:** 927b899

## Files modified

| Type     | Path                                                       | LoC change |
| -------- | ---------------------------------------------------------- | ---------- |
| Created  | lib/bonus.ts                                               | +85        |
| Created  | lib/moscow.ts                                              | +58        |
| Created  | app/journey/bonus/[type]/page.tsx                          | +123       |
| Created  | app/mentor/bonus/[id]/page.tsx                             | +103       |
| Created  | app/journey/deliverable/[id]/moscow-snapshot/page.tsx      | +131       |
| Created  | components/mentor-bonus-review-form.tsx                    | +85        |
| Modified | app/journey/page.tsx                                       | +49 / -1   |
| Modified | app/journey/deliverable/[id]/page.tsx                      | +35 / -1   |

Total : 6 new files, 2 modified files, 1 commit (`927b899`).

## Next consumers

- **Plan 12-11** : CSV export GameMaster — consumes `bonus_events` + `moscow_cards` tables
- **Plan 12-12** : Smoke E2E full — walks Player /journey → bonus claim → Mentor review → MoSCoW kanban → snapshot

## Self-Check: PASSED

- [x] lib/bonus.ts exists with `getBonusEventsForPlayer` + `getBonusEventById`
- [x] lib/moscow.ts exists with `getMoscowCardsForPlayerDeliverable`
- [x] app/journey/bonus/[type]/page.tsx exists, gated, dual-mode safe
- [x] app/mentor/bonus/[id]/page.tsx exists, gated, dual-mode safe
- [x] app/journey/deliverable/[id]/moscow-snapshot/page.tsx exists, no AppShell, read-only
- [x] components/mentor-bonus-review-form.tsx (client wrapper for WorkflowState action)
- [x] app/journey/page.tsx bonus rail section added (3 links)
- [x] app/journey/deliverable/[id]/page.tsx MoscowKanban surfaced conditionally on slug
- [x] Commit 927b899 exists in `git log`
- [x] npm run typecheck : exit 0
- [x] npm run lint : 0 errors in scope (6 pre-existing in scripts/*.cjs out of scope)
- [x] npm run build : SUCCESS, 3 new routes in manifest
- [x] R1 grep : 0 numeric leaks in Player-facing surfaces
- [x] R3 grep : 0 hard blocks added
- [x] Dual-mode demo guard preserved on `/journey`
