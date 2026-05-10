# Phase 12 — Deferred items (post-pilot v0.3)

Items surfaced during Phase 12 review (12-REVIEW.md) but intentionally NOT
fixed before the 13-14 May 2026 AgreenTech pilot. Each item is acceptable
for the pilot but should be addressed in v0.3.

## WR-06 — `window.prompt` / `window.confirm` in MoscowKanban

**Files:** `components/moscow-kanban.tsx:165, 196-199`, `components/moscow-card.tsx:110`

**Why deferred:** Pre-pilot acceptance — Chrome desktop demo path validated.
Replacement (Radix Dialog or inline form) is non-trivial UI work, out of T-3 scope.

**Limitations of current implementation:**
- Blocked in iframes
- May be disabled/throttled in some browsers (Firefox)
- Break keyboard navigation
- Not styleable / fail accessibility audits
- Screenshot poorly in partner demos
- Editing a card requires three sequential `window.prompt` calls

**v0.3 plan:** Replace with Radix Dialog (or custom modal) wrapping an inline
form. Single submit covers feature + pourquoi + contrainte. Confirm-delete
becomes inline `aria-described-by` confirmation row inside the card.

## WR-03 — MoSCoW reorder N+1 (no transaction)

**Files:** `app/actions.ts:1665-1671` (loop), `database/moscow_cards.sql` (doc only)

**Why deferred:** RPC sketch documented inline in `database/moscow_cards.sql`.
Realistic but rare partial-commit window during 13-14 May. Client falls back
to `router.refresh()` on partial failure.

**v0.3 plan:** Implement `public.moscow_cards_reorder(items jsonb)` plpgsql
function (sketch already in `database/moscow_cards.sql`), call via
`supabase.rpc("moscow_cards_reorder", { items })` for atomic batch update.

## CR-01 follow-up — DB-side trigger for bonus consumption

**Files:** `lib/score.ts` (helper added, see commit `f0cfa81`),
`database/triggers.sql` (no change yet)

**Why deferred:** Application-level fix shipped (`consumeBonusMultiplier`).
Trigger-side hardening is preferred but requires `trg_evaluation_recalc`
extension and SQL review — out of T-3 scope.

**v0.3 plan:** Move `multiplier_consumed_at` UPDATE into
`trg_evaluation_recalc` so consumption is atomic with score recompute.
Document in `database/triggers.sql` with RLS implications.

---

_Created during Phase 12 code-review fix iteration (2026-05-10)._
