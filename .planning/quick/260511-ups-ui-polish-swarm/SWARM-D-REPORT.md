# SWARM-D REPORT — A11y / WCAG AA / Reduced-motion
Date: 2026-05-11  
Branch: worktree-agent-aaf964eb655aa9398  
Commits: `183dd5b`, `24ffc0a`

---

## Items summary

### PLY-05 — `.eic-onboarding-stat__d` contrast
**Status: PASS + hardened**

Audit: `--wf-ink-soft = #4F5A6E` (from `app/eic-tokens.css:99`).  
Glass bg = `rgba(255,255,255,0.58)` over `--bg: #f6f4ef` → effective bg ≈ `#FAFAF9`.  
Contrast ratio (approximation): `(0.908+0.05)/(0.097+0.05)` → **~6.5:1** — already PASSES AA.  
Action: hardened to `#475569` (slate-600) per spec regardless, for robustness against future bg changes.  
File: `app/globals.css` (`.eic-onboarding-stat__d` color override).

---

### PLY-06 — Duplicate `aria-label` on CTA Link
**Status: FIXED**

`<Link aria-label={ctaLabel}>` with visible child text `{ctaLabel}` caused AT to announce the label twice.  
Removed `aria-label`; visible text is the accessible name. Arrow `<span aria-hidden="true">` preserved.  
File: `components/journey-hero-next-step.tsx:54-63`.

---

### PLY-11 — External link ExternalLink icons
**Status: DEFERRED (worktree behind main)**

The OneDrive template links section was added in commit `dbbb28a` on `main`, which is 10 commits ahead of this worktree's branch point (`8701d52`).  
This worktree's `app/journey/deliverable/[id]/page.tsx` and `app/journey/page.tsx` have no `target="_blank"` external links yet.  
Action: stubbed the intent with a commented import in the deliverable page. ExternalLink icons should be applied when `dbbb28a` is merged into this worktree or vice versa.  
Files: `app/journey/deliverable/[id]/page.tsx` (comment-stub only).

---

### JRY-02 — Jury form help texts + aria-describedby
**Status: FIXED**

- Removed redundant `aria-label` from inputs inside `<label>` elements (visible label text is sufficient accessible name per WCAG 1.3.1).
- Added `aria-describedby={f.key + "-help"}` to each of the 5 criterion inputs.
- Added `<span id="{key}-help">` help text under each label with 1-line criterion descriptor.
- Added `jury_c1_help`..`jury_c5_help` keys in both FR and EN dictionaries.
- Label text accents: the existing labels (`Clarte`, `Credibilite`, `Qualite`) are intentionally accent-free per CLAUDE.md convention ("Avoid accented characters in code-resident strings for mailto/CSV safety"). No change made to labels.

Files: `app/jury/jury-form.tsx`, `lib/i18n.ts`.

---

### JRY-04 — Theater toggle Link focus ring
**Status: FIXED**

Replaced inline-styled `<Link style={{ background: "#0f172a", ... }}>` with `<Link className="eic-button eic-button--primary">`.  
The `eic-button` token class (defined at globals.css ~line 980) includes `focus-visible` outline via the existing `:focus-visible` rule.  
Added `a.eic-button:focus-visible` rule in Swarm D CSS block to ensure `<a>` elements get the same ring as `<button>`.  
File: `app/jury/page.tsx:85-97`, `app/globals.css` (append).

---

### ADM-05 — StatusBadge contrast audit
**Status: AUDIT PASS — no change needed**

Manual contrast calculation (approximation method):

| Badge | FG | BG | Ratio | Result |
|-------|----|----|-------|--------|
| `en_avance` | `#166534` | `#dcfce7` | ~6.52:1 | ✓ AA |
| `a_l_heure` | `#3730a3` | `#e0e7ff` | ~7.92:1 | ✓ AA |
| `retard` | `#991b1b` | `#fee2e2` | ~6.84:1 | ✓ AA |

All three states exceed 4.5:1. No color changes required.  
File: `app/admin/page.tsx` — no edit.

---

### MNT-07 — Verdict buttons icons + baseline borders
**Status: FIXED**

- Added `import { Check, RotateCw, X } from "lucide-react"`.
- `verdictOptions` now carries `icon: React.ReactNode` per entry (`Check`/`RotateCw`/`X`, all `aria-hidden="true"`).
- Button className extended with `eic-mentor-eval__verdict-btn--{tone}` for baseline state.
- CSS added in Swarm D block: `.eic-mentor-eval__verdict-btn--success/warning/danger` with `border-color: rgba(...)` at 45% opacity — decorative borders distinguishable at baseline (not just when active).
- Contrast note: button text color is `--home-ink (#14243d)` on white bg → ~14:1. Active states use existing `.is-active--{tone}` rules already verified ≥4.5:1.

Files: `components/mentor-evaluation-panel.tsx`, `app/globals.css` (append).

---

### RES-06 — Stagger reveal + reduced-motion
**Status: FIXED**

Reduced-motion: already correctly handled in `hooks/use-in-view.ts` — when `prefers-reduced-motion: reduce` matches, observer is skipped and `isInView` is set to `true` immediately. No JS change needed.

Stagger: 
- `RevealOnView` now accepts optional `style?: CSSProperties` prop (forwarded to root `<div>`).
- `results-replay.tsx` passes `style={{ "--reveal-delay": "0ms" }}` to podium wrapper and `style={{ "--reveal-delay": "200ms" }}` to stats wrapper.
- CSS: `.eic-reveal { transition-delay: var(--reveal-delay, 0ms); }` added in Swarm D block. Default `0ms` preserves existing behavior for unwrapped usages.

Files: `components/reveal-on-view.tsx`, `components/results-replay.tsx`, `app/globals.css` (append).

---

## Commits

| SHA | Items |
|-----|-------|
| `183dd5b` | PLY-05, PLY-06, JRY-02, PLY-11 (stub) |
| `24ffc0a` | JRY-04, ADM-05 (audit-only), MNT-07, RES-06 |

## Files changed
- `app/globals.css` — append-only under `/* === Swarm D — a11y polish === */`
- `lib/i18n.ts` — append-only (new keys `jury_c1_help`..`jury_c5_help` FR+EN)
- `components/journey-hero-next-step.tsx`
- `components/mentor-evaluation-panel.tsx`
- `components/reveal-on-view.tsx`
- `components/results-replay.tsx`
- `app/jury/jury-form.tsx`
- `app/jury/page.tsx`
- `app/journey/deliverable/[id]/page.tsx` (comment-stub only)

## Not pushed (per instructions)
