---
phase: 06
plan: 02
type: execute
wave: 2
depends_on: [06-01]
files_modified:
  - components/ui/button.tsx
  - components/ui/pill.tsx
  - components/ui/level-badge.tsx
  - components/ui/progress-bar.tsx
  - components/ui/eic-logo.tsx
  - components/ui/index.ts
  - app/globals.css
autonomous: true
requirements: [DSY-04]
must_haves:
  truths:
    - "Developer can import { Button, Pill, LevelBadge, ProgressBar, EICLogo } from \"@/components/ui\""
    - "<Button variant=\"primary\"> renders blue (#1B3A5C) background with white text and 40px min-height"
    - "<Button variant=\"success\"> renders green (#2E7D32) background with white text"
    - "<Button variant=\"ghost\"> renders transparent background with home-border-strong border"
    - "<Pill tone=\"blue|green|amber|rose\"> renders the matching tinted background per UI-SPEC color table"
    - "<LevelBadge state=\"current\" level=\"L3\"> renders blue circle with 4px shadow ring + pulse animation respecting prefers-reduced-motion"
    - "<ProgressBar value={0.5}> renders role=progressbar with aria-valuenow=50, fill at 50% width with 250ms transition"
    - "<EICLogo> renders inline SVG with <title>EIC — Euromed Innovation Center</title> and role=\"img\""
    - "Each primitive owns its CSS class — no inline style={...} accepted as styling override"
  artifacts:
    - path: "components/ui/button.tsx"
      provides: "Button primitive supporting variant=primary|success|ghost, size=default|lg, all native button attrs"
      exports: ["Button"]
    - path: "components/ui/pill.tsx"
      provides: "Pill primitive supporting tone=default|blue|green|amber|rose, size=default|lg, optional icon"
      exports: ["Pill"]
    - path: "components/ui/level-badge.tsx"
      provides: "LevelBadge primitive with done|current|locked states for L0..L7"
      exports: ["LevelBadge"]
    - path: "components/ui/progress-bar.tsx"
      provides: "ProgressBar primitive with role=progressbar, aria-valuenow, value clamped 0..1"
      exports: ["ProgressBar"]
    - path: "components/ui/eic-logo.tsx"
      provides: "EICLogo lockup as inline SVG; variant=default|white"
      exports: ["EICLogo"]
    - path: "components/ui/index.ts"
      provides: "Barrel export of all 5 primitives"
      exports: ["Button", "Pill", "LevelBadge", "ProgressBar", "EICLogo"]
    - path: "app/globals.css"
      provides: ".eic-button / .eic-pill / .eic-level-badge / .eic-progress / .eic-logo class definitions + pulse-eic keyframes + prefers-reduced-motion guard"
      contains: "@keyframes pulse-eic"
  key_links:
    - from: "components/ui/index.ts"
      to: "5 primitive files"
      via: "named re-exports"
      pattern: "export \\{ Button \\}|export \\{ Pill \\}|export \\{ LevelBadge \\}|export \\{ ProgressBar \\}|export \\{ EICLogo \\}"
    - from: ".eic-level-badge.is-current"
      to: "@keyframes pulse-eic"
      via: "animation property + @media (prefers-reduced-motion: reduce) killswitch"
      pattern: "animation: pulse-eic"
---

<objective>
Livre les 5 primitives partagées DoD-bloquantes pour Phase 6 (UI-SPEC §Component Inventory) : `<Button>`, `<Pill>`, `<LevelBadge>`, `<ProgressBar>`, `<EICLogo>`. Chaque primitive encapsule TOUS ses styles dans une classe CSS dédiée (`.eic-button` etc.) — aucune inline `style={...}` n'est acceptée comme override. Les classes CSS vivent dans `app/globals.css` (en bas, après les utilities glass de plan 06-01) pour rester avec les autres styles globaux et hériter directement des tokens `--eic-*`.

Purpose: DSY-04 (DoD-bloquant — sans ces primitives, plans 06-03 / 06-04 et toutes les Phases 7-9 dupliqueraient les styles).
Output: 6 nouveaux fichiers TSX (5 primitives + barrel) + bloc CSS additionnel dans globals.css.
</objective>

<shell_note>
**Active host shell is PowerShell on Windows.** All `automated` verify commands (the verify blocks shown below) in this plan use the pattern `node -e '<JS body with double-quoted strings>'`. Single-quote wrapping survives PowerShell unchanged, and internal JS strings use double quotes (no escaping). Do NOT introduce backslash-escaped quotes in verify scripts — they break under PowerShell argument parsing.
</shell_note>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-CONTEXT.md
@.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md
@.planning/design-v2/project/wf-base.css
@app/globals.css
@app/eic-tokens.css

<interfaces>
<!-- All 5 primitives' TypeScript signatures (from UI-SPEC §Component Inventory) -->
```ts
// Button (UI-SPEC lines 213-238)
export type ButtonProps = {
  variant?: "primary" | "success" | "ghost";
  size?: "default" | "lg";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

// Pill (UI-SPEC lines 242-261)
export type PillProps = {
  tone?: "default" | "blue" | "green" | "amber" | "rose";
  size?: "default" | "lg";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

// LevelBadge (UI-SPEC lines 265-283)
export type LevelBadgeProps = {
  state: "done" | "current" | "locked";
  level: "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
  size?: "default" | "lg";
  className?: string;
};

// ProgressBar (UI-SPEC lines 287-298)
export type ProgressBarProps = {
  value: number;
  tone?: "blue" | "green";
  size?: "default" | "lg";
  ariaLabel?: string;
  className?: string;
};

// EICLogo (UI-SPEC lines 333-343)
export type EICLogoProps = {
  variant?: "default" | "white";
  className?: string;
};
```

<!-- CSS tokens already declared in app/eic-tokens.css (plan 06-01) — primitives consume these -->
```
--eic-blue: #1B3A5C
--eic-green: #2E7D32
--home-ink: #14243D
--home-border-strong: #B7AE9D
--home-surface: #FFFFFF
--wf-paper-deep: #F2EDE2
--wf-line: #C9C0AE
--wf-ink-soft: #4F5A6E
--wf-ink-faint: #8A8775
--wf-blue-tint: #E1E8F1
--wf-green-tint: #DDEDDE
--wf-amber: #B47A14
--wf-amber-tint: #F4E6C8
--wf-rose: #A23B3B
--wf-rose-tint: #F0D9D9
--radius-sm: 8px
--radius-pill: 9999px
--font-body: (set by next/font/google in layout.tsx, fallback Montserrat)
--font-heading: (set by next/font/google, fallback Baskervville)
--shadow-hover: 0 28px 70px rgba(17,30,48,0.14)
--transition-base: 250ms ease
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Create 5 primitive components in components/ui/ + barrel export</name>
  <read_first>
    - .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md (Component Inventory section, lines 207-300 — exact prop signatures, color tables, padding/min-height values; EICLogo spec lines 333-343)
    - .planning/design-v2/project/wf-base.css (lines 116-141 = .wf-pill / .wf-btn reference; lines 279-299 = .wf-lvl / .wf-bar reference; lines 162-179 = .wf-brand-mark for EICLogo)
    - components/app-shell.tsx (verify named export pattern, "use client" directive convention)
    - components/login-form.tsx (read to confirm existing v0.1 button/form pattern that primitives will replace in plan 06-04)
    - app/eic-tokens.css (confirm tokens consumed by primitives are declared)
  </read_first>
  <files>components/ui/button.tsx, components/ui/pill.tsx, components/ui/level-badge.tsx, components/ui/progress-bar.tsx, components/ui/eic-logo.tsx, components/ui/index.ts</files>
  <action>
Create 6 new files. Each is a SERVER component (no `"use client"`) — none hold state or use hooks. Named exports only. Kebab-case filenames, PascalCase exports per CLAUDE.md.

### File 1: `components/ui/button.tsx`

```tsx
import { type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonProps = {
  variant?: "primary" | "success" | "ghost";
  size?: "default" | "lg";
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [
    "eic-button",
    `eic-button--${variant}`,
    size === "lg" ? "eic-button--lg" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} type={type} {...rest}>
      {children}
    </button>
  );
}
```

### File 2: `components/ui/pill.tsx`

```tsx
import { type ReactNode } from "react";

export type PillProps = {
  tone?: "default" | "blue" | "green" | "amber" | "rose";
  size?: "default" | "lg";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Pill({
  tone = "default",
  size = "default",
  icon,
  children,
  className,
}: PillProps) {
  const classes = [
    "eic-pill",
    tone !== "default" ? `eic-pill--${tone}` : null,
    size === "lg" ? "eic-pill--lg" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes}>
      {icon ? <span className="eic-pill__icon" aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}
```

### File 3: `components/ui/level-badge.tsx`

```tsx
export type LevelBadgeProps = {
  state: "done" | "current" | "locked";
  level: "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
  size?: "default" | "lg";
  className?: string;
};

export function LevelBadge({ state, level, size = "default", className }: LevelBadgeProps) {
  const classes = [
    "eic-level-badge",
    `eic-level-badge--${state}`,
    size === "lg" ? "eic-level-badge--lg" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const ariaLabel =
    state === "current"
      ? `Niveau ${level} (en cours)`
      : state === "done"
        ? `Niveau ${level} (validé)`
        : `Niveau ${level} (verrouillé)`;
  return (
    <span aria-label={ariaLabel} className={classes} role="img">
      {level}
    </span>
  );
}
```

### File 4: `components/ui/progress-bar.tsx`

```tsx
export type ProgressBarProps = {
  value: number;
  tone?: "blue" | "green";
  size?: "default" | "lg";
  ariaLabel?: string;
  className?: string;
};

export function ProgressBar({
  value,
  tone = "green",
  size = "default",
  ariaLabel,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const pct = Math.round(clamped * 100);
  const classes = [
    "eic-progress",
    tone === "blue" ? "eic-progress--blue" : null,
    size === "lg" ? "eic-progress--lg" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={pct}
      className={classes}
      role="progressbar"
    >
      <div className="eic-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
```

NOTE on `style={{ width }}`: this is the ONLY acceptable inline style in primitives — UI-SPEC line 300 explicitly allows it ("only acceptable on wf-aurora blob positioning and explicit one-off heights/widths"). The width value is computed from a typed numeric input, not user-supplied.

### File 5: `components/ui/eic-logo.tsx`

Inline SVG (NOT next/image). Mark = 28x28 rounded blue square with white serif "E" and green dot bottom-right. Wordmark = "EIC" in Baskervville-like serif + small kicker "INNOVATION CENTER".

```tsx
export type EICLogoProps = {
  variant?: "default" | "white";
  className?: string;
};

export function EICLogo({ variant = "default", className }: EICLogoProps) {
  const isWhite = variant === "white";
  const markBg = isWhite ? "transparent" : "var(--eic-blue)";
  const markStroke = isWhite ? "rgba(255,255,255,0.9)" : "transparent";
  const markText = isWhite ? "#FFFFFF" : "#FFFFFF";
  const wordColor = isWhite ? "#FFFFFF" : "var(--eic-blue)";
  const kickerColor = isWhite ? "rgba(255,255,255,0.85)" : "var(--eic-green)";
  const dotColor = "var(--eic-green)";
  const dotRing = isWhite ? "rgba(27,58,92,0.0)" : "var(--home-surface)";
  const classes = ["eic-logo", isWhite ? "eic-logo--white" : null, className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} role="img">
      <svg
        aria-hidden="true"
        focusable="false"
        height="28"
        viewBox="0 0 28 28"
        width="28"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>EIC — Euromed Innovation Center</title>
        <rect
          fill={markBg}
          height="28"
          rx="6"
          ry="6"
          stroke={markStroke}
          strokeWidth={isWhite ? 1.5 : 0}
          width="28"
          x="0"
          y="0"
        />
        <text
          dominantBaseline="central"
          fill={markText}
          fontFamily="var(--font-heading), Baskervville, Georgia, serif"
          fontSize="16"
          fontWeight="700"
          textAnchor="middle"
          x="14"
          y="15"
        >
          E
        </text>
        <circle cx="24" cy="24" fill={dotColor} r="5" stroke={dotRing} strokeWidth="2" />
      </svg>
      <span className="eic-logo__word">
        <span className="eic-logo__name" style={{ color: wordColor }}>EIC</span>
        <span className="eic-logo__kicker" style={{ color: kickerColor }}>
          INNOVATION CENTER
        </span>
      </span>
    </span>
  );
}
```

The two `style={{ color }}` overrides on `.eic-logo__name` and `.eic-logo__kicker` are necessary because the white variant inverts colors that aren't theme-able via tokens alone. UI-SPEC line 343 specifies the variant behavior; this is structural styling tied to the variant prop, not arbitrary override.

### File 6: `components/ui/index.ts` (barrel)

```ts
export { Button, type ButtonProps } from "./button";
export { Pill, type PillProps } from "./pill";
export { LevelBadge, type LevelBadgeProps } from "./level-badge";
export { ProgressBar, type ProgressBarProps } from "./progress-bar";
export { EICLogo, type EICLogoProps } from "./eic-logo";
```

Use 2-space indent, double quotes, trailing commas, named exports only (CLAUDE.md). The CSS classes (`eic-button`, `eic-pill`, `eic-level-badge`, `eic-progress`, `eic-logo` and modifiers) are wired in Task 2.
  </action>
  <verify>
    <automated>node -e 'const fs=require("fs"); const files=["components/ui/button.tsx","components/ui/pill.tsx","components/ui/level-badge.tsx","components/ui/progress-bar.tsx","components/ui/eic-logo.tsx","components/ui/index.ts"]; for(const f of files){if(!fs.existsSync(f)){console.error("MISSING: "+f); process.exit(1);}} const idx=fs.readFileSync("components/ui/index.ts","utf8"); for(const name of ["Button","Pill","LevelBadge","ProgressBar","EICLogo"]){if(!idx.includes("export { "+name)){console.error("barrel missing: "+name); process.exit(1);}} console.log("OK");' && npm run typecheck</automated>
  </verify>
  <acceptance_criteria>
    - 6 files exist: `components/ui/button.tsx`, `components/ui/pill.tsx`, `components/ui/level-badge.tsx`, `components/ui/progress-bar.tsx`, `components/ui/eic-logo.tsx`, `components/ui/index.ts`
    - `components/ui/button.tsx` exports `function Button(` and exports `type ButtonProps`
    - `components/ui/pill.tsx` exports `function Pill(`
    - `components/ui/level-badge.tsx` exports `function LevelBadge(` and uses `aria-label` based on state
    - `components/ui/progress-bar.tsx` uses `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}` and clamps `value` to `[0,1]`
    - `components/ui/eic-logo.tsx` contains `<title>EIC — Euromed Innovation Center</title>` inside the SVG
    - None of the 5 primitive files contain `"use client"` (server-renderable)
    - `components/ui/index.ts` re-exports all 5 components AND their type aliases
    - `npm run typecheck` exits 0
    - No file uses `export default`
    - All filenames are kebab-case
  </acceptance_criteria>
  <done>5 typed primitives + barrel export under components/ui/, server-renderable, named exports only, typecheck clean.</done>
</task>

<task type="auto">
  <name>Task 2: Append primitive CSS classes + pulse keyframes to app/globals.css</name>
  <read_first>
    - app/globals.css (already augmented with .eic-glass and .eic-aurora at the bottom by plan 06-01 — append AFTER that block)
    - .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md (Component Inventory tables — color/padding/min-height values for each primitive; lines 218-300)
    - .planning/design-v2/project/wf-base.css (reference rules .wf-btn / .wf-pill / .wf-lvl / .wf-bar / .wf-brand-mark — lines 116-300)
    - app/eic-tokens.css (verify --eic-blue, --eic-green, --wf-blue-tint, --wf-paper-deep, --radius-sm, --radius-pill all declared by plan 06-01)
  </read_first>
  <files>app/globals.css</files>
  <action>
APPEND to the bottom of `app/globals.css` (after the `.eic-aurora` block from plan 06-01). Do NOT modify any rule above. Add this block:

```css

/* ==========================================================================
   EIC Design v2 — Shared primitives CSS (DSY-04)
   Used by components/ui/{button,pill,level-badge,progress-bar,eic-logo}.tsx.
   Style ownership rule: each primitive's visual contract lives here.
   Pages MUST NOT pass style={...} to override these primitives.
   ========================================================================== */

/* === Button === */
.eic-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--home-border-strong);
  background: var(--home-surface);
  color: var(--home-ink);
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: box-shadow var(--transition-base), transform var(--transition-fast);
}
.eic-button:hover { box-shadow: var(--shadow-hover); }
.eic-button:active { transform: translateY(1px); box-shadow: none; }
.eic-button:focus-visible { outline: 3px solid rgba(27, 58, 92, 0.22); outline-offset: 0; }
.eic-button:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }

.eic-button--primary { background: var(--eic-blue); border-color: var(--eic-blue); color: #fff; }
.eic-button--success { background: var(--eic-green); border-color: var(--eic-green); color: #fff; }
.eic-button--ghost   { background: transparent; border-color: var(--home-border-strong); color: var(--home-ink); }

.eic-button--lg { min-height: 48px; padding: 12px 20px; }

/* === Pill === */
.eic-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--wf-line);
  background: var(--wf-paper-deep);
  color: var(--wf-ink-soft);
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
}
.eic-pill__icon { display: inline-grid; place-items: center; width: 14px; height: 14px; }

.eic-pill--blue  { background: var(--wf-blue-tint);  color: var(--eic-blue);   border-color: #B6C5DA; }
.eic-pill--green { background: var(--wf-green-tint); color: var(--eic-green);  border-color: #B7D4B7; }
.eic-pill--amber { background: var(--wf-amber-tint); color: var(--wf-amber);   border-color: #DCC394; }
.eic-pill--rose  { background: var(--wf-rose-tint);  color: var(--wf-rose);    border-color: #DCB1B1; }

.eic-pill--lg { padding: 6px 12px; font-size: 13px; }

/* === Level badge === */
.eic-level-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid var(--wf-line);
  background: var(--home-surface);
  color: var(--wf-ink-soft);
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  user-select: none;
}
.eic-level-badge--done {
  background: var(--eic-green);
  border-color: var(--eic-green);
  color: #fff;
}
.eic-level-badge--current {
  background: var(--eic-blue);
  border-color: var(--eic-blue);
  color: #fff;
  box-shadow: 0 0 0 4px rgba(27, 58, 92, 0.15);
}
.eic-level-badge--locked {
  background: var(--wf-paper-deep);
  color: var(--wf-ink-faint);
  border-style: dashed;
}
.eic-level-badge--lg { width: 36px; height: 36px; font-size: 13px; }

@media (prefers-reduced-motion: no-preference) {
  .eic-level-badge--current {
    animation: pulse-eic 2s ease-in-out infinite;
  }
}

@keyframes pulse-eic {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 4px rgba(27, 58, 92, 0.15);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 6px rgba(27, 58, 92, 0.25);
  }
}

/* === Progress bar === */
.eic-progress {
  display: block;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--wf-paper-deep);
  border: 1px solid var(--wf-line);
  overflow: hidden;
}
.eic-progress--lg { height: 12px; border-radius: 6px; }
.eic-progress__fill {
  height: 100%;
  background: var(--eic-green);
  transition: width var(--transition-base);
}
.eic-progress--blue .eic-progress__fill {
  background: var(--eic-blue);
}

/* === EIC logo lockup === */
.eic-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  line-height: 1;
}
.eic-logo > svg { flex: 0 0 28px; }
.eic-logo__word {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.eic-logo__name {
  font-family: var(--font-heading), Baskervville, Georgia, serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1;
}
.eic-logo__kicker {
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  line-height: 1;
}
```

**Why this exact ruleset:**
- All values are pulled directly from UI-SPEC §Component Inventory tables (lines 218-300) and `wf-base.css` (lines 116-300).
- `prefers-reduced-motion: no-preference` wrapper on the pulse animation per UI-SPEC line 283 + Interaction & Motion Contract line 408.
- Pulse keyframes use `transform: scale()` + `box-shadow` width changes (no `width/height` to avoid layout thrash).
- Focus ring uses `rgba(27, 58, 92, 0.22)` which is `--eic-blue` at 22% — UI-SPEC line 161.
- Pill `--default` carries no modifier class; baseline `.eic-pill` styling is the default tone (UI-SPEC table line 252).
- `.eic-progress__fill width` is set inline by the React component — that's the ONLY allowed inline style per UI-SPEC line 300.
- Logo wordmark/kicker: small (18px / 9px) per UI-SPEC line 342-343.

DO NOT add any utility class outside this primitive scope. DO NOT introduce additional radii or shadow tokens.
  </action>
  <verify>
    <automated>node -e 'const c=require("fs").readFileSync("app/globals.css","utf8"); const checks=[[".eic-button {","button base"],[".eic-button--primary { background: var(--eic-blue)","primary"],[".eic-button--success { background: var(--eic-green)","success"],["min-height: 40px","default size"],["min-height: 48px; padding: 12px 20px","lg size"],[".eic-pill {","pill base"],[".eic-pill--blue","pill blue"],[".eic-pill--rose","pill rose"],[".eic-level-badge {","level base"],[".eic-level-badge--current","current state"],["box-shadow: 0 0 0 4px rgba(27, 58, 92, 0.15)","ring"],["@keyframes pulse-eic","keyframes"],["prefers-reduced-motion: no-preference","reduced motion guard"],[".eic-progress {","progress base"],[".eic-progress__fill","progress fill"],[".eic-logo {","logo base"],[".eic-logo__name","logo name"],[".eic-logo__kicker","logo kicker"]]; const failed=[]; for(const [needle,desc] of checks){if(!c.includes(needle)) failed.push(desc+": "+needle);} if(failed.length){console.error(failed.join("\n")); process.exit(1);} if(!c.includes("--brand-primary")){console.error("legacy --brand-primary lost"); process.exit(1);} console.log("OK");' && npm run typecheck && npm run lint</automated>
  </verify>
  <acceptance_criteria>
    - `app/globals.css` contains `.eic-button {` with `min-height: 40px` and `padding: 8px 14px`
    - Contains `.eic-button--primary` with `background: var(--eic-blue)` and `color: #fff`
    - Contains `.eic-button--success` with `background: var(--eic-green)`
    - Contains `.eic-button--lg` with `min-height: 48px`
    - Contains `.eic-button:focus-visible { outline: 3px solid rgba(27, 58, 92, 0.22)` (DSY focus contract)
    - Contains `.eic-pill {` with all 4 tinted variants (`--blue`, `--green`, `--amber`, `--rose`)
    - Contains `.eic-level-badge--current` with `box-shadow: 0 0 0 4px rgba(27, 58, 92, 0.15)`
    - Contains `@keyframes pulse-eic` with `transform: scale(1.05)`
    - Pulse animation wrapped in `@media (prefers-reduced-motion: no-preference)` (NOT applied unconditionally)
    - Contains `.eic-progress {` with `height: 8px` and `.eic-progress__fill` rule
    - Contains `.eic-logo__name { font-family: var(--font-heading)` and `.eic-logo__kicker { ... letter-spacing: 0.18em`
    - STILL contains `--brand-primary: #0B2545;` and `.app-shell {` (legacy preserved)
    - STILL contains `.eic-glass {` and `.eic-aurora {` (added by plan 06-01)
    - `npm run typecheck` exits 0
    - `npm run lint` produces no NEW errors versus prior baseline
  </acceptance_criteria>
  <done>5 primitive CSS classes (button/pill/level-badge/progress/logo) appended to globals.css; pulse keyframe respects prefers-reduced-motion; v0.1 + plan 06-01 styles preserved.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Component callers to primitives | All caller-supplied data (children, value, level) flows through React standard JSX rendering. No dangerouslySetInnerHTML, no string-templated CSS, no eval. |
| style={{ width: pct% }} in ProgressBar | The only inline style; pct is computed from a clamped numeric input. No string injection vector. |
| style={{ color }} in EICLogo | Driven by the typed variant prop (default or white), values are static strings or token references. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-05 | Tampering | XSS via children in Button/Pill | accept | React escapes children by default. No dangerouslySetInnerHTML used. Severity info. |
| T-06-06 | Tampering | CSS injection through className pass-through | accept | className is a string concatenated with our prefixed classes. CSS class names cannot execute code; worst case is visual override. Severity low. |
| T-06-07 | Information Disclosure | EICLogo SVG title content | accept | Static literal "EIC — Euromed Innovation Center" — no PII. Severity info. |
| T-06-08 | Denial of Service | LevelBadge pulse animation on prefers-reduced-motion users | mitigate | Animation wrapped in @media (prefers-reduced-motion: no-preference) — vestibular-disorder users see static badge. UI-SPEC line 283 + WCAG 2.3.3. |
</threat_model>

<verification>
After both tasks complete:

1. `npm run typecheck` produces 0 errors
2. `npm run lint` produces no NEW warnings
3. `npm run build` succeeds
4. Manual import test (in any consuming file): `import { Button, Pill, LevelBadge, ProgressBar, EICLogo } from "@/components/ui";` resolves without TS error
5. Visual smoke (deferred to plan 06-04 login refactor where Button is first used in production): primitives invisible to user until consumed.
</verification>

<success_criteria>
- DSY-04 ✓ (DoD-bloquant): 5 primitives exist under `components/ui/`, exported via barrel `components/ui/index.ts`
- Each primitive owns its CSS class — no `style={...}` override pattern in primitive files except the 2 documented exceptions (ProgressBar fill width, EICLogo variant colors)
- All primitives are server-renderable (no `"use client"`, no hooks)
- TypeScript prop signatures match UI-SPEC §Component Inventory exactly
- Pulse animation respects `prefers-reduced-motion`
- `npm run typecheck` + `npm run lint` + `npm run build` pass
</success_criteria>

<output>
After completion, create `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-02-SUMMARY.md` recording: 5 primitive APIs (with prop signatures), CSS class naming convention used, exception list for `style={...}` (the 2 allowed cases), accessibility decisions (LevelBadge aria-label format, ProgressBar role+valuenow), pulse keyframes + reduced-motion strategy.
</output>
