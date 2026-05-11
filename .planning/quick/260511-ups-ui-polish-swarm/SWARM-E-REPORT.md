# SWARM-E REPORT — Responsive mobile + forms validation + interactions
Date: 2026-05-11 | Branch: swarm-ui-polish-E | Worktree: agent-af3ff8da3498df16f

## Status: ALL 8 ITEMS COMPLETE

---

## ADM-02 — Export button primary, Import ghost
**SHA:** 33f3288
**Files:** `app/admin/page.tsx`
- Export `<a>` promoted to dark-bg primary (`background: #0f172a`, `color: #fff`, `fontWeight: 600`)
- Added `<Download size={16} aria-hidden />` lucide icon
- Import `<Link>` demoted to ghost outline (`border: 1px solid #cbd5e1`, transparent bg)

---

## JRY-03 — Jury form warn-only total=0 banner (R2 COMPLIANT)
**SHA:** 9e85904
**Files:** `app/jury/jury-form.tsx`
- Amber banner `<p className="eic-jury-form__warn">` appears when `total === 0`
- Submit button NOT disabled — mentor keeps full control (R2 warn-only respected)
- Copy: "Verifie : tous les criteres sont a 0" (ASCII-safe)
- CSS rule `.eic-jury-form__warn` added in globals.css Swarm E section

---

## MNT-06 — Score display + pending pill redesign
**SHA:** 56f0b67
**Files:** `components/mentor-players-table.tsx`
- Score: `toFixed(2)` → `Math.round()` + "pts" label, color `#64748b` (muted)
- Pending pill: column layout with large count (1.25rem semibold) + sub-label mission name
- Pill background/color unchanged (amber `#fef3c7` / `#92400e`)

---

## MNT-09 — Mentor table responsive card layout <768px
**SHA:** 56f0b67 (same commit as MNT-06)
**Files:** `components/mentor-players-table.tsx`, `app/globals.css`
- Wrapper `<div>` gains class `eic-mentor-players-table` (removed inline `overflowX: auto`)
- CSS: below 768px, `display: block` on all table elements, `thead` hidden, each `<tr>` becomes a card (border, border-radius, padding, white bg)
- First `<td>` (team name) styled larger + bold; last `<td>` (CTA) gets top margin

---

## PLY-13 — Onboarding topbar counter hidden <480px
**SHA:** 83a64c3
**Files:** `components/onboarding-stepper.tsx`, `app/globals.css`
- Counter `<span>` gets `aria-hidden="true"` + hidden via `@media (max-width: 479px)` on `[aria-hidden="true"]`
- Added sibling `<span className="sr-only">` with identical text — screen readers still announce step
- Dots remain visible at all widths

---

## PLY-12 — Journey grid stack vertical <768px
**SHA:** 78631d4 (CSS only)
**Files:** `app/globals.css`
- Added `@media (max-width: 767px)` block under Swarm E section
- Grid becomes `grid-template-columns: 1fr`, rows: hero (row 1) → track (row 2) → progress label (row 3)
- Tip column hidden at this breakpoint (`.eic-journey__tip-col { display: none }`)
- Padding reduced to 16px for mobile
- Note: existing `@media (max-width: 1099px)` handles tablet (track+hero side-by-side); new rule overrides below 768px for portrait stack

---

## PLY-08 — Public player profile back-link
**SHA:** 6399448
**Files:** `app/player/[slug]/page.tsx`
**Decision: PAGE KEPT PUBLIC (no AppShell)**
- Line 39 confirms `rankingPublished: false` — page is explicitly gated behind ranking publication
- In demo mode: `getPlayerProfile(slug, { rankingPublished: false })` returns null → `SysEmpty` shown
- No AppShell needed: page is pre-pitch public, accessible without auth
- Added `<Link className="eic-button eic-button--ghost eic-profile__back" href="/journey">← Retour</Link>` at top of `<article>` before the `<header>`
- CSS class `.eic-profile__back` added in globals.css (inline-flex, margin-bottom 16px)

---

## PLY-15 — Pixel mascot hook cleanup
**SHA:** d899ea6
**Files:** `hooks/use-pixel-trigger.ts`
- `useVerbatimCountTrigger`: replaced `useState(lastCount)` + stale-closure effect dep with `useRef`
  - Old: `useEffect(..., [lastCount])` re-registered listener on every count change → potential duplicate triggers
  - New: `lastCountRef.current` mutated in-place, effect runs once on mount only
  - Unmount cleanup: `lastCountRef.current = 0` so re-mount starts fresh
  - Added `useRef` to import
- `useFirstDeliveryTrigger`: no change — localStorage flag design is intentional (fires once per browser lifetime, never clears — correct for pilot)
- `useStagnationTrigger`: no change — proper cleanup already present (timeout + event listeners removed on unmount)

---

## CSS summary (globals.css Swarm E section)
Appended ~98 lines under `/* === Swarm E — responsive polish === */`:
- `.eic-profile__back` — back-link positioning
- `@media (max-width: 767px)` — journey grid vertical stack (PLY-12)
- `@media (max-width: 479px)` — onboarding counter hidden (PLY-13)
- `.eic-mentor-players-table` — overflow wrapper + card layout <768px (MNT-09)
- `.eic-jury-form__warn` — amber warn banner flex layout (JRY-03)

---

## Typecheck + Lint
Both `npm run typecheck` and `npm run lint` pass with 0 errors/warnings.

## Commits (7 total)
| SHA | Item | Summary |
|-----|------|---------|
| 33f3288 | ADM-02 | Export primary, Import ghost, Download icon |
| 9e85904 | JRY-03 | Warn-only amber banner total=0 |
| 56f0b67 | MNT-06+09 | Score rounded, pill redesign, responsive class |
| 83a64c3 | PLY-13 | Counter hidden <480px, sr-only kept |
| 6399448 | PLY-08 | Back-link top of public profile |
| d899ea6 | PLY-15 | useRef fix for verbatim trigger, unmount cleanup |
| 78631d4 | CSS | All responsive rules in Swarm E section |
