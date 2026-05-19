---
phase: 12-quick-260510-t3x
fixed_at: 2026-05-10T23:30:00Z
review_path: .planning/phases/12-quick-260510-t3x/12-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 12: Code Review Fix Report

**Fixed at:** 2026-05-10T23:30:00Z
**Source review:** `.planning/phases/12-quick-260510-t3x/12-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (1 critical + 6 warnings — Info findings excluded per `fix_scope: critical_warning`)
- Fixed: 7
- Skipped: 0

All Critical + Warning findings successfully addressed. Each fix committed
atomically; typecheck passes after every commit. Lint output contains 6
pre-existing errors in `scripts/*.cjs` and `smoketest/*.cjs` (require-style
imports) unrelated to Phase 12 — not introduced by these fixes.

EIC R1/R2/R3 cardinal rules implicitly preserved per CLAUDE.md guard rules:
- WR-04 (Player-facing snapshot page) : auth/role gate added INSIDE
  `hasSupabaseEnv()` check (dual-mode demo guard preserved); no
  score/rank/multiplier rendered (R1); no DOM blocking (R3).
- WR-05 (MoscowKanban warn detection) : structured `severity` field is
  R2-aligned (warn-only, never error-blocking); no Player-facing scoring
  exposure introduced.

## Fixed Issues

### CR-01: `applyBonusMultiplier` never marks bonus as consumed

**Files modified:** `lib/score.ts`
**Commit:** `f0cfa81`
**Applied fix:** Added new `consumeBonusMultiplier(supabase, bonusEventId)`
async helper to `lib/score.ts`. The helper performs a conditional UPDATE
(`.eq("id", id).is("multiplier_consumed_at", null)`) which is race-safe
under concurrent writers. Updated `applyBonusMultiplier` JSDoc to mandate
the caller pattern: after applying the multiplier with `applied !== null`,
the caller MUST invoke `consumeBonusMultiplier`. `applyBonusMultiplier`
itself stays pure — no behavior change for current callers (none in app
code today; helper only consumed by future Plan 10+ Mentor/GM UI). v0.3
hardening (move consumption into `trg_evaluation_recalc` DB trigger)
documented in `deferred-items.md`. **Requires human verification** of the
caller-side adoption when Plan 10 wires it up.

### WR-01: `reviewBonusEventFlow` has no application-level guard against re-reviewing

**Files modified:** `app/actions.ts`
**Commit:** `067c5d9`
**Applied fix:** Added `.eq("status", "submitted")` filter and
`.select("id")` to the UPDATE in `reviewBonusEventFlow`. Detects zero-row
update and returns `{ ok: false, message: "Bonus deja review ou inexistant." }`
when the bonus has already been reviewed (or doesn't exist). Preserves the
existing behavior for valid first-time reviews.

### WR-02: Hardcoded production URL in `submitMoscowDeliverableFlow` snapshot link

**Files modified:** `app/actions.ts`
**Commit:** `24c8967`
**Applied fix:** Replaced the hardcoded `https://entrepreneur-game-six.vercel.app`
literal with `process.env.NEXT_PUBLIC_SITE_URL ?? "https://entrepreneur-game-six.vercel.app"`.
Falling back to the literal preserves current behavior when the env var is
unset. **Operational follow-up:** set `NEXT_PUBLIC_SITE_URL` in Vercel env
for prod + preview environments before pilot.

### WR-03: MoSCoW reorder is N+1 sequential UPDATEs with no transaction

**Files modified:** `database/moscow_cards.sql`
**Commit:** `98821de`
**Applied fix:** Documentation-only per review recommendation (RPC fix is
v0.3 hardening). Added `KNOWN LIMITATION` block at end of
`database/moscow_cards.sql` describing the partial-commit window, the
client-side `router.refresh()` fallback that mitigates user-visible
breakage, and a sketch of the `public.moscow_cards_reorder(items jsonb)`
plpgsql function for v0.3. Also tracked in `deferred-items.md`.

### WR-04: `moscow-snapshot/page.tsx` missing defense-in-depth auth/role gate

**Files modified:** `app/journey/deliverable/[id]/moscow-snapshot/page.tsx`
**Commit:** `7699f33`
**Applied fix:** Added the standard `getCurrentUser` + `getCurrentRole` +
`pathForRole` guard pattern matching `app/journey/deliverable/[id]/page.tsx`.
Auth check is wrapped in `if (hasSupabaseEnv())` to preserve dual-mode demo
behavior — RLS remains the primary gate, this is belt-and-suspenders.
Allowed roles: `player`, `mentor`, `game_master`. R1/R2/R3 preserved
(no rendering changes).

### WR-05: `MoscowKanban` warn-detection couples on French substring

**Files modified:** `app/actions.ts`, `components/moscow-kanban.tsx`
**Commit:** `ff57318`
**Applied fix:** Extended `WorkflowState` type with optional
`severity?: "ok" | "warn" | "error"` field (backwards-compatible — existing
callers/consumers ignore it). `submitMoscowDeliverableFlow` now sets
`severity: warns.length > 0 ? "warn" : "ok"`. `MoscowKanban` tracks
`submitSeverity` state and styles on `severity === "warn"` first, falling
back to the substring match for transitional safety (deploy-lag scenario).
All four mutation handlers (`handleAddCard`, `handleDelete`, `handleEdit`,
`handleSubmitDeliverable` + reorder fail path) now propagate the severity
flag to state. R2 alignment preserved (warn-only, never blocking).

### WR-06: `MoscowKanban` uses `window.prompt` / `window.confirm` for create/edit/delete

**Files modified:** `components/moscow-kanban.tsx`,
`.planning/phases/12-quick-260510-t3x/deferred-items.md`
**Commit:** `b810f64`
**Applied fix:** Pre-pilot acceptance per review recommendation. Enhanced
the existing inline comment in `handleEdit` to explicitly cite WR-06,
document the limitations (iframes, a11y, screenshots), reference the v0.3
backlog item (Radix Dialog replacement), and confirm the Chrome desktop
demo path is validated. Created `deferred-items.md` documenting WR-06,
WR-03, and the CR-01 trigger-side follow-up for v0.3 planning.

---

_Fixed: 2026-05-10T23:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
