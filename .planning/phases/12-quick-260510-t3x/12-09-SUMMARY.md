---
phase: "12-quick-260510-t3x"
plan: "12-09"
subsystem: "frontend / player UI / DnD"
tags: [moscow, kanban, dnd-kit, t3x-expansion, wave-3, player-facing, R1, R3]
one-liner: "MoSCoW Kanban native UI with @dnd-kit drag-and-drop, 4 buckets, mobile + a11y sensors, no optimistic UI (router.refresh after each mutation)"
dependency-graph:
  requires:
    - "12-05 (lib/types.ts MoscowCard + MoscowBucket)"
    - "12-06 (app/actions.ts CRUD + reorder + submit Flow actions, commit f6905e5)"
    - "12-06 (lib/i18n.ts moscow_* keys)"
  provides:
    - "components/moscow-card.tsx (sortable card with edit/delete)"
    - "components/moscow-kanban.tsx (4-column board with DnD + CRUD orchestration)"
  affects:
    - "package.json + package-lock.json (3 new pinned deps @dnd-kit/*)"
tech-stack:
  added:
    - "@dnd-kit/core@6.1.0 (PINNED exact, no caret)"
    - "@dnd-kit/sortable@8.0.0 (PINNED exact, no caret — avoid v9/v10 breaking)"
    - "@dnd-kit/utilities@3.2.2 (PINNED exact)"
  patterns:
    - "Sortable items via useSortable hook + SortableContext per column"
    - "Multi-sensor DnD : PointerSensor + TouchSensor + KeyboardSensor"
    - "Batch reorder payload (items array of {id, bucket, ord}) posted as JSON via FormData"
    - "No optimistic UI : initialCards prop is source of truth, router.refresh() after mutations"
    - "useTransition for non-blocking server action calls in onDragEnd"
key-files:
  created:
    - "components/moscow-card.tsx (128 lines)"
    - "components/moscow-kanban.tsx (337 lines)"
  modified:
    - "package.json (+3 deps)"
    - "package-lock.json (+56 lines, 4 packages added incl. tslib transitive)"
decisions:
  - "PIN exact dependency versions (no ^) per Plan 12-09 must_haves §issue rev #5 — guards against silent @dnd-kit/sortable v9/v10 breaking changes"
  - "No --legacy-peer-deps required : @dnd-kit/core@6.1.0 declares peer react >=16 which satisfies React 19.2.5"
  - "No optimistic state per Plan 12-02 CONTEXT issue rev #7 : revalidatePath in server action + router.refresh() in client suffices at T-3 (avoid mutation bugs)"
  - "window.prompt for add/edit UX (KISS T-3) — custom dialog deferred"
  - "Drag handle as separate inner div (hamburger glyph) keeps card content non-draggable, only the handle triggers DnD listeners"
metrics:
  duration: "~3 min"
  completed: "2026-05-10T22:05:05Z"
  tasks: 4
  files-changed: 4
  commits: 1
---

# Phase 12 Plan 09: MoSCoW Kanban UI Summary

Implemented the native MoSCoW Kanban Player UI (deliverable D-04) for the AgreenTech pilot. Two new client components wire to the existing Plan 12-06 server actions to deliver a drag-and-drop 4-column board (Must / Should / Could / Won't) with touch + keyboard accessibility, while strictly preserving R1 (no score render), R2 (warn-only submission), and R3 (no inter-mission blocking, no DOM disabled outside transient submit pending).

## 1. Dependencies installed

| Package              | Version | Notes                                                                       |
| -------------------- | ------- | --------------------------------------------------------------------------- |
| `@dnd-kit/core`      | `6.1.0` | React 19 compatible (peer `react >=16`). Pinned exact.                      |
| `@dnd-kit/sortable`  | `8.0.0` | Pinned exact — v9/v10 introduce breaking changes (see plan must_haves rev #5). |
| `@dnd-kit/utilities` | `3.2.2` | `CSS.Transform.toString` for inline transforms. Pinned exact.               |

**`npm install` ran clean WITHOUT `--legacy-peer-deps`.** The React 19 peer dep was satisfied; no `overrides` block was added to `package.json`. `npm install --save-exact @dnd-kit/core@6.1.0 @dnd-kit/sortable@8.0.0 @dnd-kit/utilities@3.2.2` produced 4 added packages (3 listed + `tslib` transitive) and updated `package-lock.json` cleanly.

## 2. Components delivered

### `components/moscow-card.tsx` (128 lines)

- `"use client"` directive.
- Imports `useSortable` from `@dnd-kit/sortable`, `CSS` from `@dnd-kit/utilities`, `MoscowCard as MoscowCardType` from `@/lib/types`, and `dictionaries` from `@/lib/i18n`.
- Drag handle is a separate inner `<div>` carrying `{...attributes} {...listeners}` (hamburger glyph `☰`), so the rest of the card stays clickable for edit/delete.
- Renders `feature` (mandatory) + optional `pourquoi` + optional `contrainte` via `moscow_card_*` i18n keys.
- Edit button calls `onEdit(card)` callback. Delete button calls `onDelete(card.id)` wrapped in `window.confirm("Supprimer cette carte ?")` (KISS, no custom dialog at T-3).
- Bucket border color from `BUCKET_COLOR` map: red-600 / orange-600 / sky-600 / slate-500 (Tailwind palette hex values inline).
- `opacity: 0.5` + `boxShadow` during drag for visual feedback.
- `aria-label` on the article and on each button.

### `components/moscow-kanban.tsx` (337 lines)

- `"use client"` directive.
- Imports `DndContext`, `closestCenter`, `KeyboardSensor`, `PointerSensor`, `TouchSensor`, `useSensor`, `useSensors`, `DragEndEvent` from `@dnd-kit/core`.
- Imports `SortableContext`, `sortableKeyboardCoordinates`, `verticalListSortingStrategy` from `@dnd-kit/sortable`.
- Imports all 5 server actions: `createMoscowCardFlow`, `updateMoscowCardFlow`, `deleteMoscowCardFlow`, `reorderMoscowCardsFlow`, `submitMoscowDeliverableFlow`.
- **Three sensors active**: PointerSensor (4px activation distance), TouchSensor (200ms delay, 5px tolerance), KeyboardSensor (sortableKeyboardCoordinates for a11y).
- Grid `repeat(auto-fit, minmax(220px, 1fr))` → 1 col on mobile (<440px), 2 cols (440-660px), 4 cols (≥880px).
- `onDragEnd` handler computes a batched reorder payload across all 4 buckets after the drop: re-flattens the new ordering and emits one POST to `reorderMoscowCardsFlow` with `items` as `JSON.stringify([{id, bucket, ord}, ...])`. Uses `useTransition` so the server round-trip doesn't block UI.
- Cross-bucket drag supported: detects whether `over.id` is a bucket ID (column drop) vs. a card ID (positional drop).
- `handleAddCard(bucket)` / `handleEdit(card)` / `handleDelete(cardId)` / `handleSubmitDeliverable()` each call their `*Flow` server action, then `router.refresh()` on success.
- **No optimistic state** (Plan 12-02 CONTEXT issue rev #7) — `initialCards` is the only source of truth; mutations rely on `revalidatePath` + `router.refresh()` to repaint with server-truth.
- `submitMessage` state surfaces the action's `WorkflowState.message` verbatim — including the R2 warn-only suffix `"(recommandation : >=2 cartes MUST ; >=1 carte WONT (anti scope-creep))"` from `submitMoscowDeliverableFlow`. Amber color when message contains `"recommandation"`, green otherwise — visual cue only, never blocks.
- Submit button is the **only** element with `disabled={pending}` (allowed per the R3 carve-out for transient submit pending state).

## 3. DnD UX

| Concern         | Mechanism                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Mouse / pointer | `PointerSensor` with 4px activation distance (prevents accidental drag on clicks).                                        |
| Touch / mobile  | `TouchSensor` with 200ms long-press delay + 5px tolerance — distinguishes drag from tap-and-scroll on mobile.             |
| Keyboard / a11y | `KeyboardSensor` with `sortableKeyboardCoordinates` — Space to pick up, arrow keys to move, Space to drop, Esc to cancel. |
| Collision       | `closestCenter` — standard for vertical lists.                                                                            |
| Persistence     | Batched POST to `reorderMoscowCardsFlow` with full new ordering across all 4 buckets (single round-trip).                 |
| UI refresh      | `router.refresh()` after each successful mutation — no client-side state divergence from server truth.                    |

## 4. R1 / R2 / R3 audit

| Rule | Audit                                                                                                                                                                                                                                                                                                                                                                                                              | Result        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| R1   | `grep -E "score\|rank\|multiplier\|/100\|/140\|toFixed\|points"` on both new files = 2 hits TOTAL, both in inline doc comments (`// R1 STRICT : 0 chiffre score/rank/multiplier dans le rendu.`). Zero hits in JSX or runtime code. No numeric leak via cards.                                                                                                                                                       | **CLEAN**     |
| R2   | `submitMoscowDeliverableFlow` returns `{ok: true, message: "Kanban MoSCoW soumis V1.(recommandation : ...) Le Mentor va le valider."}` when MUST/WONT thresholds not met. The board renders the message as-is in an amber `<p role="status">`. Never blocks the submit. Recommendations are advisory only.                                                                                                          | **CLEAN**     |
| R3   | `grep "blocks_progression\|disabled.*because"` on both files = 0 hits. All 4 columns (`must`, `should`, `could`, `wont`) are always interactive — none ever gated. The single `disabled` attribute is `<button disabled={pending}>` on the submit deliverable button during a `useTransition` server round-trip (transient pending state, allowed per the R3 carve-out documented in the user objective constraint). | **CLEAN**     |

## 5. Mobile-first responsive

- Grid columns: `repeat(auto-fit, minmax(220px, 1fr))` — fluid breakpoints determined by container width, not media queries.
- Touch DnD enabled via `TouchSensor` (long-press 200ms threshold avoids hijacking page scroll).
- Card buttons sized to 4-10px padding, 12-13px font — touch-friendly without being oversized.

## 6. Verification

| Check                                                | Result            |
| ---------------------------------------------------- | ----------------- |
| `npm run typecheck`                                  | exit 0            |
| `npx eslint components/moscow-card.tsx components/moscow-kanban.tsx` | exit 0, no warnings |
| `npm run build`                                      | exit 0 (19 routes generated, no peer-dep runtime issue) |
| R1 grep on 2 files                                   | 0 hits in JSX     |
| R3 grep on 2 files                                   | 0 hits            |
| `Test-Path node_modules/@dnd-kit/{core,sortable,utilities}` | all True    |

## 7. Limitations (T-3 conscious)

- **`window.prompt` for add/edit UX** — works but rough. Custom dialog (e.g. inline form with 3 inputs) is a deferred v0.3 candidate.
- **Delete confirmation via `window.confirm`** — same KISS rationale.
- **No drag-overlay preview** — only opacity + shadow change on the dragged card. A `<DragOverlay>` portal could improve perceived quality (deferred).
- **No optimistic state** — every interaction round-trips to the server before the UI repaints. For the pilot volume (6-15 teams) and ~10-20 cards per board, the latency cost is acceptable. Trade-off accepted per Plan 12-02 CONTEXT issue rev #7.

## 8. Next consumers

- **Plan 12-10** : surface `<MoscowKanban>` in `app/journey/deliverable/[id]/page.tsx` for the MoSCoW deliverable template (D-04 slug). Parent server component will SSR-fetch the cards (`SELECT * FROM moscow_cards WHERE project_id = $1 AND deliverable_template_id = $2`) and pass them as `initialCards`.
- **Plan 12-11** : CSV export of moscow_cards for GameMaster (optional).

## 9. Commit

| SHA       | Message                                                                          |
| --------- | -------------------------------------------------------------------------------- |
| `4dc2b91` | `feat(t3x-moscow-ui): add MoSCoW Kanban native UI with @dnd-kit DnD (D-04)` |

Pushed to `origin/main` per "Default = ship + push" policy.

## Self-Check: PASSED

- `components/moscow-card.tsx` — FOUND
- `components/moscow-kanban.tsx` — FOUND
- Commit `4dc2b91` — FOUND in `git log`
- `package.json` declares `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — FOUND (3 hits)
- `node_modules/@dnd-kit/{core,sortable,utilities}` — all present
- `npm run typecheck` — exit 0
- `npm run build` — exit 0
- R1 grep on both files — 0 JSX hits (2 comment hits documenting the rule)
- R3 grep on both files — 0 hits
