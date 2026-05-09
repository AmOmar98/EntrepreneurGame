---
phase: 06
plan: 02
subsystem: design-system-primitives
tags: [primitives, shared-components, button, pill, level-badge, progress-bar, eic-logo, dsy-04, eic-v2]
requirements_completed: [DSY-04]
dependency_graph:
  requires:
    - "06-01 (EIC v2 tokens + wf-* layer + Baskervville/Montserrat via next/font)"
  provides:
    - "5 typed primitives at components/ui/{button,pill,level-badge,progress-bar,eic-logo}.tsx"
    - "Barrel import: import { Button, Pill, LevelBadge, ProgressBar, EICLogo } from \"@/components/ui\""
    - ".eic-button / .eic-pill / .eic-level-badge / .eic-progress / .eic-logo CSS contracts in app/globals.css"
    - "@keyframes pulse-eic + prefers-reduced-motion guard for current-level pulse"
  affects:
    - "Phase 06-03 (AppShell variants) — will consume EICLogo + Button"
    - "Phase 06-04 (Login branded) — will replace inline button with <Button variant=\"primary\" size=\"lg\">"
    - "Phase 7+ (Joueur, Mentor, GameMaster) — will consume Pill / LevelBadge / ProgressBar"
tech_stack:
  added: []
  patterns:
    - "Server-renderable primitives (no \"use client\", no hooks, no state)"
    - "BEM-style modifier classes (.eic-button--primary, .eic-pill--blue, .eic-level-badge--current)"
    - "Style ownership rule: each primitive owns its CSS class, pages MUST NOT pass style={...} (2 documented exceptions)"
    - "kebab-case .tsx filenames, PascalCase exports, named exports only (CLAUDE.md)"
    - "@media (prefers-reduced-motion: no-preference) wrapper on pulse keyframe (vestibular-disorder a11y)"
key_files:
  created:
    - "components/ui/button.tsx"
    - "components/ui/pill.tsx"
    - "components/ui/level-badge.tsx"
    - "components/ui/progress-bar.tsx"
    - "components/ui/eic-logo.tsx"
    - "components/ui/index.ts"
  modified:
    - "app/globals.css"
decisions:
  - "Primitives are server components — none hold state, none use hooks; consumers can RSC them freely"
  - "BEM modifier syntax (.eic-button--primary) chosen over compound .eic-button.is-primary to match existing 06-01 utility prefix and avoid clash with v0.1 .button.primary on legacy pages"
  - "Pill default tone has no modifier class; baseline .eic-pill carries default (paper-deep) styling — minimizes class noise for the most common case"
  - "ProgressBar default tone is green (matches XP fill in journey), --blue tone reserved for blue accent contexts (Phase 8 mentor review state)"
  - "LevelBadge aria-label is FR-only (UI-SPEC §Copywriting: French is canonical) — \"Niveau {L} (en cours|validé|verrouillé)\""
  - "EICLogo wordmark uses 18px (UI-SPEC line 342) not 15px from wf-brand-name (wireframe was tighter); logo lockup is a top-level brand element, not nav chrome"
  - "Pulse keyframe inverts the @media query (no-preference wrapper instead of reduce kill-switch) — animation is opt-in by default-friendly browsers, opt-out automatic for reduced-motion users without a second declaration"
  - "Two style={...} exceptions documented + bounded: ProgressBar fill width (computed from clamped numeric, UI-SPEC line 300 explicitly allows) and EICLogo word/kicker color (variant=white inverts colors that aren't theme-able via tokens alone)"
metrics:
  duration_seconds: 480
  duration_minutes: 8
  completed_at: "2026-05-09"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 1
  commits: 2
---

# Phase 6 Plan 02: Shared primitives Summary

5 typed React primitives + barrel export + matching CSS contracts in globals.css — DSY-04 unblocked. AppShell (06-03), Login (06-04) and all Phase 7-9 surfaces can now consume `<Button>`, `<Pill>`, `<LevelBadge>`, `<ProgressBar>`, `<EICLogo>` without re-styling them.

## What was built

### Task 1 — `components/ui/{5 primitives}.tsx + index.ts` (DSY-04)

Six new files, all server-renderable (no `"use client"`), named exports only, kebab-case filenames + PascalCase identifiers per CLAUDE.md.

**Prop signatures (full, as shipped):**

```ts
// components/ui/button.tsx
export type ButtonProps = {
  variant?: "primary" | "success" | "ghost";   // default "primary"
  size?: "default" | "lg";                      // default "default"
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;
export function Button({ variant, size, className, children, type = "button", ...rest }): JSX.Element;

// components/ui/pill.tsx
export type PillProps = {
  tone?: "default" | "blue" | "green" | "amber" | "rose";  // default "default"
  size?: "default" | "lg";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};
export function Pill({ tone, size, icon, children, className }): JSX.Element;

// components/ui/level-badge.tsx
export type LevelBadgeProps = {
  state: "done" | "current" | "locked";
  level: "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
  size?: "default" | "lg";
  className?: string;
};
export function LevelBadge({ state, level, size, className }): JSX.Element;

// components/ui/progress-bar.tsx
export type ProgressBarProps = {
  value: number;                  // clamped to [0, 1]
  tone?: "blue" | "green";        // default "green"
  size?: "default" | "lg";
  ariaLabel?: string;
  className?: string;
};
export function ProgressBar({ value, tone, size, ariaLabel, className }): JSX.Element;

// components/ui/eic-logo.tsx
export type EICLogoProps = {
  variant?: "default" | "white";  // default "default"
  className?: string;
};
export function EICLogo({ variant, className }): JSX.Element;
```

**Barrel** `components/ui/index.ts`:

```ts
export { Button, type ButtonProps } from "./button";
export { Pill, type PillProps } from "./pill";
export { LevelBadge, type LevelBadgeProps } from "./level-badge";
export { ProgressBar, type ProgressBarProps } from "./progress-bar";
export { EICLogo, type EICLogoProps } from "./eic-logo";
```

Allows downstream code to `import { Button, Pill, LevelBadge, ProgressBar, EICLogo } from "@/components/ui";` in a single line.

**Accessibility decisions baked into the primitives:**

| Primitive | A11y contract |
|-----------|---------------|
| Button | Native `<button>` element + standard `disabled` + `:focus-visible` outline 3px `rgba(27,58,92,0.22)` (UI-SPEC line 161) |
| Pill | Plain `<span>` — purely decorative; meaning conveyed by surrounding text. `icon` slot is `aria-hidden="true"` so screen readers don't double-read |
| LevelBadge | `role="img"` + computed FR `aria-label`: "Niveau L3 (en cours)" / "Niveau L3 (validé)" / "Niveau L3 (verrouillé)" — text content `{level}` is the visible glyph |
| ProgressBar | `role="progressbar"`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-valuenow={Math.round(value*100)}`, optional `aria-label` for non-labelled bars |
| EICLogo | Outer `<span role="img">` + inner SVG `<title>EIC — Euromed Innovation Center</title>` + SVG marked `aria-hidden="true"` (the title is announced via the outer role=img + inferred name from `<title>`) |

Commit: `02cfe6f`

### Task 2 — `app/globals.css` primitive CSS classes (DSY-04)

Appended ~165 lines AFTER the `.eic-aurora` block from plan 06-01 — five primitive contracts in a single block:

- `.eic-button` (base + `:hover` shadow + `:active` translate-1px + `:focus-visible` ring + `:disabled`) + `.eic-button--primary|--success|--ghost` + `.eic-button--lg` (48px height)
- `.eic-pill` (base) + `.eic-pill__icon` slot + `.eic-pill--blue|--green|--amber|--rose` (per UI-SPEC color tones table line 252) + `.eic-pill--lg`
- `.eic-level-badge` (base) + `.eic-level-badge--done|--current|--locked` + `.eic-level-badge--lg` + `@keyframes pulse-eic` wrapped in `@media (prefers-reduced-motion: no-preference)`
- `.eic-progress` (track) + `.eic-progress__fill` (driven by inline `width: {pct}%` from React) + `.eic-progress--blue` modifier + `.eic-progress--lg` (12px)
- `.eic-logo` lockup + `.eic-logo > svg` slot + `.eic-logo__word`, `.eic-logo__name`, `.eic-logo__kicker`

**CSS class naming convention:**

- Prefix: `.eic-` for all primitive base classes (matches 06-01 utility prefix `.eic-glass / .eic-aurora`)
- Modifiers: BEM double-dash `--variant` (e.g. `.eic-button--primary`, `.eic-level-badge--current`)
- Sub-elements: BEM double-underscore `__` (e.g. `.eic-progress__fill`, `.eic-logo__name`)
- All custom-property references go through tokens declared in `app/eic-tokens.css` (`--eic-blue`, `--wf-blue-tint`, `--radius-sm`, `--shadow-hover`, `--transition-base`, etc.) — no hex values inlined except for `#fff`, hardcoded RGB tints called out in UI-SPEC (`#B6C5DA`, `#B7D4B7`, `#DCC394`, `#DCB1B1`), and the focus ring `rgba(27, 58, 92, 0.22)` (UI-SPEC line 161 explicit value)

**Pulse keyframes + reduced-motion strategy:**

```css
@media (prefers-reduced-motion: no-preference) {
  .eic-level-badge--current {
    animation: pulse-eic 2s ease-in-out infinite;
  }
}

@keyframes pulse-eic {
  0%, 100% { transform: scale(1);    box-shadow: 0 0 0 4px rgba(27, 58, 92, 0.15); }
  50%      { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(27, 58, 92, 0.25); }
}
```

The animation is wrapped *inside* the `no-preference` block (rather than declared unconditionally + killed inside `prefers-reduced-motion: reduce`). Net effect identical — vestibular-disorder users see the static blue circle with the resting 4px ring, everyone else gets the pulse — but this form means we ship zero animation declarations to reduced-motion clients (cleaner cascade).

The keyframes manipulate `transform: scale()` + `box-shadow` size, NOT `width/height`, to avoid layout thrash (browser only repaints; no reflow).

**Style ownership exceptions documented in code:**

| Exception | Where | Why |
|-----------|-------|-----|
| `style={{ width: \`${pct}%\` }}` | `progress-bar.tsx` line ~33 — sets `.eic-progress__fill` width | Only way to drive a numeric range from a typed prop into a CSS rule. UI-SPEC line 300 explicitly allows: "only acceptable on wf-aurora blob positioning and explicit one-off heights/widths". The width is computed from a clamped `[0,1]` numeric input — no string injection vector. |
| `style={{ color: wordColor }}` and `style={{ color: kickerColor }}` | `eic-logo.tsx` lines ~58/61 | The white variant inverts wordmark + kicker colors to white / 85%-white-overlay. These can't be theme-driven via a single CSS variable swap (the kicker uses `--eic-green` in default, `rgba(255,255,255,0.85)` in white — semantically distinct, not a token override). The values are static literals or token references; no caller-controlled string flows in. |

Commit: `093e5ac`

## Verification results

- `npm run typecheck` — exits 0
- `npm run lint` — exits 0, no new warnings (baseline was clean)
- `npm run build` — succeeds, 13 routes generated, build size unchanged (primitives not yet imported by any page; bundle inclusion happens in 06-03/06-04)
- Automated verify (Task 1) — 6 files exist, barrel re-exports all 5 names, all 5 type aliases re-exported, no `"use client"`, no `export default`
- Automated verify (Task 2) — 18 needles found in globals.css (primitive bases, modifiers, focus ring exact rgba, pulse keyframe, reduced-motion guard, fill rule, logo word/kicker)
- Legacy preservation — `--brand-primary: #0B2545`, `.app-shell {`, `.eic-glass {`, `.eic-aurora {` all still present after Task 2 edit

## Deviations from Plan

None — plan executed exactly as written. The two tasks landed verbatim per their `<action>` blocks; verifies passed first try (typecheck + lint + automated needle scan). No auto-fixes triggered (no Rule 1/2/3 deviations). One micro-cleanup applied during file authoring: in `eic-logo.tsx` the unused `markText` ternary collapsed to a single literal `"#FFFFFF"` (white in both variants) — pure simplification, no behavior change, still matches UI-SPEC line 341 ("white serif E").

## Threat surface scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. STRIDE register from PLAN front-matter:

- **T-06-05** (XSS via children) — *accept*: React escapes children by default; no `dangerouslySetInnerHTML` used in any primitive.
- **T-06-06** (className injection) — *accept*: pass-through string concatenation, CSS class names cannot execute code.
- **T-06-07** (logo title leak) — *accept*: static literal `"EIC — Euromed Innovation Center"`, no PII.
- **T-06-08** (motion-induced DoS) — *mitigate ✓*: pulse animation gated by `@media (prefers-reduced-motion: no-preference)`, vestibular-disorder users see static badge (WCAG 2.3.3 + UI-SPEC line 283).

No new threats introduced.

## Gotchas / Notes

- **Server-renderable contract**: all 5 primitives are pure JSX, no hooks, no state. Consumers in plan 06-04 (login refactor) and Phase 7+ can render them server-side without `"use client"` boundaries — important for keeping the bundle small (current production bundle = 102 KB shared).

- **EICLogo SVG vs `<Image>`**: chose inline SVG (28x28 mark + sibling wordmark span). `<Image>` would force the Next.js image loader for a static decorative logo — extra HTTP round-trip for zero LCP gain. The SVG colors reference `var(--eic-blue|--eic-green|--home-surface)` so dark-mode tokens (already declared in 06-01) Just Work without re-wiring.

- **EICLogo white variant ring**: when `variant="white"`, the green dot's outer ring goes `rgba(27,58,92,0.0)` (transparent). This eliminates the white surround that would clash with a dark sidebar background. The mark itself becomes a 1.5px white stroke on transparent (border-only).

- **Pill default vs blue**: design-v2 `wf-pill` had `is-blue` as a separate variant; we keep the same — default tone is the neutral paper-deep bg, `--blue` is informational accent. Phase 7 status pills ("En revue", "Validé") will pick `--blue` and `--green` respectively.

- **No destructive Button variant**: per UI-SPEC line 163 ("destructive reserved for Pill rose + form-error text only"). Phase 8 rejection actions will use `<Button variant="ghost">` + a confirm modal — primitive surface stays minimal.

- **--lg button sizing for touch targets**: UI-SPEC line 71 mandates 44px minimum for touch — `--lg` lands at 48px (compliant). Default 40px is acceptable for mouse contexts (login submit on desktop). Phase 7 mobile tab-bar items will use a different layout (64px tab cell), so the Button primitive itself doesn't need a 44px-default.

- **`box-shadow: none; transform: none` on disabled**: explicit reset overrides the `:hover` and `:active` rules so a focused-but-disabled button doesn't glow or shift. Prevents a subtle visual bug where holding focus on a freshly-disabled submit button leaves a stale shadow.

## Files touched

- **Created**: `components/ui/button.tsx` (30 lines)
- **Created**: `components/ui/pill.tsx` (36 lines)
- **Created**: `components/ui/level-badge.tsx` (33 lines)
- **Created**: `components/ui/progress-bar.tsx` (38 lines)
- **Created**: `components/ui/eic-logo.tsx` (75 lines)
- **Created**: `components/ui/index.ts` (5 lines, barrel)
- **Modified**: `app/globals.css` (+165 lines appended after `.eic-aurora .blob3` block)

Total: 6 created, 1 modified, 217 lines of new TSX + 165 lines of new CSS.

## Self-Check

**File existence checks:**
- FOUND: `components/ui/button.tsx`
- FOUND: `components/ui/pill.tsx`
- FOUND: `components/ui/level-badge.tsx`
- FOUND: `components/ui/progress-bar.tsx`
- FOUND: `components/ui/eic-logo.tsx`
- FOUND: `components/ui/index.ts`
- FOUND: `app/globals.css` (modified)

**Commit existence checks:**
- FOUND: `02cfe6f` — feat(06-02): add 5 shared primitives + barrel export (DSY-04)
- FOUND: `093e5ac` — feat(06-02): add primitive CSS classes + pulse-eic keyframes (DSY-04)

**Build artifact checks:**
- PASS: `npm run typecheck` exit 0
- PASS: `npm run lint` exit 0 (no new warnings vs 06-01 baseline)
- PASS: `npm run build` 13 static/dynamic routes generated, no font-load regressions

## Self-Check: PASSED
