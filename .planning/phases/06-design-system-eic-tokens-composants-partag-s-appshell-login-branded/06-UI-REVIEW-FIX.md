---
phase: 06
fixed_at: 2026-05-10
review_path: .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 6 — UI Review Fix Report

**Fixed at:** 2026-05-10
**Source review:** `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-REVIEW.md`
**Iteration:** 1
**Scope:** Top 3 priority fixes (advisory UI improvements from UI-REVIEW.md, not REVIEW.md bugs)

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

---

## Fixed Issues

### UI-01: `.form-error` duplicate in `globals.css`

**Files modified:** `app/globals.css`
**Commit:** `2b32699`
**Applied fix:** Removed the legacy v0.1 `.form-error` block (lines 673-676 — `color: var(--red); font-weight: 700;`). Kept the EIC v2 block at line 1306 (rose tint + 1px border + padding + 14px font-size). Verified via grep that only one `.form-error` selector remains in the file.

**Verification:**
- Tier 1: re-read confirms legacy block removed, EIC v2 block intact
- Tier 2: `npm run build` compiled successfully (Next.js 15.5.18, 13/13 static pages generated, no CSS errors)

---

### UI-02: Doublon « Hack-Days » sur `/login`

**Files modified:** `lib/i18n.ts`
**Commit:** `6784617`
**Applied fix:** Option A retained (preserve kicker structure, change copy only). Updated `brand_subtitle` value from `"Hack-Days · EIC"` to `"EIC · UEMF"` in both `dictionaries.fr` (line 27) and `dictionaries.en` (line 269). The kicker now anchors institutional brand while the lead `login_subtitle` keeps the Hack-Days mention solo.

**Verification:**
- Tier 1: re-read confirms both fr and en dictionaries updated
- Tier 2: `npm run typecheck` passes (no TS errors — `as const` literal type unaffected)

---

### UI-03: Mobile tab bar `·` stub on `/journey`

**Files modified:** `components/mobile-tab-bar.tsx`
**Commit:** `a3d8b12`
**Applied fix:** Added named import `import { MapPin } from "lucide-react";` (line 3, sorted alphabetically before `next/link`). Replaced the literal `·` text node inside `.eic-mobile-tab__icon` with `<MapPin size={18} aria-hidden />`. Wrapper `<span aria-hidden="true">` retained — the SVG is now a proper iconographic affordance for the "Parcours" tab.

**Verification:**
- Tier 1: re-read confirms import + JSX swap, surrounding markup intact
- Tier 2: `npm run typecheck` passes; `npm run lint` passes (zero errors, zero warnings)

---

## Skipped Issues

None — all 3 priority fixes applied successfully.

---

## Deviations from UI-REVIEW.md guidance

- **CLAUDE.md vs `package.json` mismatch on lucide-react version**: CLAUDE.md (Tech Stack section) lists `lucide-react ^1.14.0` but `package.json` declares `^0.577.0`. The Phase 6 review and the Top 3 fix both reference `^0.577.0`, which matches the actual installed package. `MapPin` is available in `^0.577.0`. No action needed beyond documenting the discrepancy here for the orchestrator.
- No other deviations — all 3 fixes applied verbatim per UI-REVIEW.md instructions.

---

_Fixed: 2026-05-10_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
