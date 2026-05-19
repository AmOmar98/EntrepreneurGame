---
phase: 6
slug: design-system-eic-tokens-composants-partag-s-appshell-login-branded
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-09
---

# Phase 6 — UI Design Contract

> Visual and interaction contract for the EIC Design v2 foundation: tokens, 4 shared primitives, AppShell variant split (player/staff), and a branded login. Source of truth = `.planning/design-v2/project/eic-tokens.css` + `wf-base.css`. v0.1 visual surfaces (`--brand-*`, `--green`, `--blue`) MUST remain functional in parallel.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (custom CSS variable system, no shadcn) |
| Preset | not applicable — no shadcn registry, tokens copied verbatim from `.planning/design-v2/project/eic-tokens.css` |
| Component library | none (custom primitives in `components/ui/`) |
| Icon library | `lucide-react ^0.577.0` (pinned in v0.1, do not upgrade) |
| Font (headings) | `Baskervville` via `next/font/google` (self-hosted, no `@import`) — fallback `'Baskerville Old Face', Baskerville, Georgia, serif` |
| Font (body) | `Montserrat` via `next/font/google` (weights 300, 400, 500, 600, 700, 800) — fallback `system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif` |
| Token file | `app/eic-tokens.css` (new, imported from `app/layout.tsx`) — `app/globals.css` v0.1 left untouched, both load together |
| Variant strategy | CSS variables flat (matches existing `app/globals.css` convention) — no CSS-in-JS, no Tailwind config |

**Font loading — DSY-02 contract:**

```ts
// app/layout.tsx
import { Baskervville, Montserrat } from "next/font/google";

const baskervville = Baskervville({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});
```

`<html className={`${baskervville.variable} ${montserrat.variable}`} lang="fr">`. The `@import url('https://fonts.googleapis.com/...')` at the top of `eic-tokens.css` MUST be removed before the file is copied into `app/eic-tokens.css` — `next/font` handles it.

---

## Spacing Scale

Declared values (multiples of 4 — pulled verbatim from `eic-tokens.css`):

| Token | CSS var | Value | Usage |
|-------|---------|-------|-------|
| 1 | `--space-1` | 4px | Icon gaps, tightest inline padding (e.g. dot beside pill text) |
| 2 | `--space-2` | 8px | Compact stack gaps (form rows, pill internal padding) |
| 3 | `--space-3` | 12px | Card internal gaps, button vertical padding (Pill/Button), space below `<h3>`/`<h4>` |
| 4 | `--space-4` | 16px | Default element spacing, space below `<h2>`, form field margin |
| 6 | `--space-6` | 24px | Section padding inside cards, space below `<h1>` |
| 8 | `--space-8` | 32px | Layout gaps, gap between hero and drawer |
| 12 | `--space-12` | 48px | Major section breaks (login form vertical breathing) |
| 16 | `--space-16` | 64px | Page-level top/bottom on `/login` desktop |
| 24 | `--space-24` | 96px | Reserved for hero block extremes (Phase 7) — not used in Phase 6 |

**Touch-target exception:** Buttons and tab-bar items in `<TopbarLite>` and the mobile bottom tab bar MUST be ≥44px tall (WCAG 2.5.5). The Button primitive's `size="default"` lands at min-height 40px today (matches v0.1 `.button`); add `size="lg"` (48px) for primary CTAs on touch surfaces. Tab-bar `.wf-mobile-tabbar` height = 64px (already complies).

**Radii (from `eic-tokens.css`):**

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Buttons, inputs |
| `--radius-md` | 12px | Cards, drawer panels |
| `--radius-lg` | 20px | Glass panels (login card, hero) |
| `--radius-xl` | 28px | Reserved (Phase 7+ hero) |
| `--radius-pill` | 9999px | Pills, LevelBadge ring, ProgressBar |

**Shadows:** `--shadow-card` for resting cards, `--shadow-hover` on hover, `--shadow-navbar` on TopbarLite. No new shadow tokens introduced.

---

## Typography

Type scale (3 heading sizes + 2 body sizes — strict 5-level system, exact values from `eic-tokens.css`):

| Role | Size | Weight | Line Height | Font | Usage |
|------|------|--------|-------------|------|-------|
| Display (`h1`) | `clamp(40px, 5.5vw, 72px)` | 700 | 1.2 | Baskervville | Login title, Phase 7 hero, results page |
| Heading L (`h2`) | `clamp(30px, 3.8vw, 48px)` | 600 | 1.2 | Baskervville | Section titles, drawer headers |
| Heading M (`h3`/`h4`) | `clamp(22px, 2.4vw, 32px)` / `22px` | 500 | 1.35 / 1.4 | Baskervville | Card titles, mission codes |
| Body | 16px | 400 | 1.6 | Montserrat | Default text |
| Body sm (`small`) | 14px | 400 | 1.55 | Montserrat | Secondary text, captions |
| UI / button label | 15px | 600 | 1.0 | Montserrat | `<Button>` text, tab-bar labels |
| Kicker | 12px (0.75rem) | 800 | 1.4, +0.18em tracking, UPPERCASE | Montserrat | Eyebrow above titles, accent in green |
| Lead | 20px | 400 | 1.55 | Montserrat | Login subtitle, hero subhead |

**Letter-spacing:** `-0.02em` on h1, `-0.015em` on h2, `+0.01em` on UI/button, `+0.18em` on kicker only.

**Italics:** Reserved for project names in editorial flourishes (e.g. Focus team `<em>` titles in Phase 9). NOT used in Phase 6 surfaces.

**Phase 6 typography rule:** No new typography tokens introduced beyond what `eic-tokens.css` declares. If a v0.1 page (e.g. `/admin`) is not refactored in Phase 6, leave its existing font stack untouched — do NOT cascade Baskervville onto pages that haven't been adapted.

---

## Color

EIC palette from `eic-tokens.css`. The 60/30/10 split applies to refactored surfaces only (login, AppShell chrome, primitives). v0.1 pages keep their existing palette.

| Role | Value | CSS var | Usage |
|------|-------|---------|-------|
| Dominant (60%) | `#F6F1E8` | `--home-ivory` | Page background (login, journey, admin live mode in Phase 9 inverted) |
| Secondary (30%) | `#FFFFFF` | `--home-surface` | Cards, login form, drawer body, sidebar (staff variant) |
| Accent (10%) | `#1B3A5C` | `--eic-blue` | Primary buttons, current LevelBadge, sidebar active state, links (`--eic-blue-light` `#2A5A8C`) |
| Success | `#2E7D32` | `--eic-green` | Success Button, done LevelBadge, ProgressBar fill, kicker text, brand dot |
| Destructive | `#A23B3B` | `--wf-rose` | Pill `tone="rose"`, error state, "à corriger" tag (Phase 8) |
| Warning | `#B47A14` | `--wf-amber` | Pill `tone="amber"`, "Mentor disponible" status, "concentré" GM state (Phase 9) |

**Glass / overlay:**

| Surface | Token | Backdrop |
|---------|-------|----------|
| `wf-glass` (light) | `rgba(255,255,255,0.58)` + `blur(18px) saturate(140%)` | Login card, journey hero (Phase 7) |
| `wf-glass-tint` | `linear-gradient(135deg, rgba(255,255,255,0.65), rgba(225,232,241,0.45))` + `blur(16px)` | Drawer side panel (Phase 7) |
| `wf-glass-dark` | `rgba(27, 58, 92, 0.62)` + `blur(20px)` | GM live-mode panels (Phase 9) — defined in P6, used in P9 |

**Aurora background (`wf-aurora`):** Two `::before`/`::after` blurred radial blobs (`#B5D4B7` top-left 420px, `#BCD0E6` bottom-right 480px, opacity 0.55, `blur(60px)`) + optional `.blob3` (`#F4E6C8`, opacity 0.45). MUST be absolutely positioned, `z-index: 0`, `pointer-events: none`. Never on `<body>` directly — wrap in a `<div className="wf-aurora">` inside the page shell to allow per-page enable/disable.

**Glass fallback contract — DSY-03 (mandatory):**

```css
.eic-glass {
  background: rgba(255, 255, 255, 0.58);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-md);
}

@supports not (backdrop-filter: blur(1px)) {
  .eic-glass {
    background: rgba(255, 255, 255, 0.92);  /* opaque 92% white per DSY-03 */
  }
}
```

The same `@supports not` block MUST be added for `.eic-glass-tint` (fallback `rgba(255,255,255,0.94)`) and `.eic-glass-dark` (fallback `rgba(27, 58, 92, 0.96)`). Test on Android Chrome <90 stub (devtools UA spoofing) before claiming DSY-03 done.

**Accent reserved for (explicit list — never "all interactive elements"):**

- Primary `<Button variant="primary">` background (login submit, "Soumettre", "Suivant →")
- `<LevelBadge state="current">` background + `0 0 0 4px rgba(27,58,92,0.15)` ring
- Sidebar active link (staff variant)
- `<Pill tone="blue">` (status "En revue", informational neutral)
- Link color (`a` element)

Accent NOT used for: hover states (use `--shadow-hover`), focus rings (use `outline: 3px solid rgba(27,58,92,0.22)`), borders (use `--home-border`), any decorative element.

**Destructive reserved for:** Pill `tone="rose"`, form `.form-error` text. NO destructive Button variant in Phase 6 — rejection actions in Phase 8 use `<Button variant="ghost">` + confirm modal.

**Legacy preservation — DSY-01 + Decision Phase 04:** All v0.1 tokens (`--brand-primary`, `--brand-accent`, `--green`, `--blue`, `--gold`, `--red`, `--bg`, `--surface`, etc.) MUST remain defined in `app/globals.css`. New `--eic-*` and `--home-*` tokens MUST live in `app/eic-tokens.css`. Both files load via `app/layout.tsx`. Refactored pages (login, AppShell chrome) use `--eic-*`; untouched v0.1 pages keep `--brand-*`. No `:root` re-declaration of legacy vars.

---

## Copywriting Contract

All copy in **French** (primary product language per `lib/i18n.ts`). New keys MUST be added to `lib/i18n.ts` `dictionaries.fr`, NOT inlined.

| Element | Copy (FR) | i18n key |
|---------|-----------|----------|
| Login page title (`h1`) | `Connectez-vous au Hack-Days` | `login_title` (existing, verify content) |
| Login subtitle | `Entrez vos identifiants pour rejoindre votre équipe.` | `login_subtitle` (existing, verify) |
| Login submit (primary CTA) | `Se connecter` | `login_submit` (existing) |
| Login email label | `Email` | `login_email_label` |
| Login password label | `Mot de passe` | `login_password_label` |
| Login partner caption | `Avec le soutien de nos partenaires` | `login_partners_caption` (existing) |
| Login error — invalid creds | `Email ou mot de passe incorrect. Vérifiez vos identifiants ou contactez votre GameMaster.` | `login_error_invalid` |
| Login error — generic | `Connexion impossible. Réessayez dans un instant.` | `login_error_generic` |
| AppShell brand name | `Entrepreneur Game` | `brand_name` |
| AppShell brand subtitle | `Hack-Days · EIC` | `brand_subtitle` |
| AppShell brand tagline | `Euromed Innovation Center · UEMF` | `brand_tagline_short` (existing) |
| Topbar player nav — journey | `Mon parcours` | `nav_player_journey` (existing) |
| Topbar player nav — team | `Mon équipe` | `nav_player_team` |
| Topbar staff nav — mentor | `Évaluations` | `nav_mentor_evaluations` (existing) |
| Topbar staff nav — admin | `Cohorte` | `nav_game_master_admin` (existing) |
| Topbar staff nav — import | `Import CSV` | `nav_game_master_import` (existing) |
| Logout | `Se déconnecter` | `nav_logout` |
| Empty state — generic heading | `Rien à afficher pour l'instant` | `empty_default_heading` |
| Empty state — generic body | `Cette section se remplira dès que les premières données seront disponibles.` | `empty_default_body` |
| Loading state (Phase 6 = no skeletons, just text) | `Chargement…` | `loading_default` |
| Generic form error | `Vérifiez les champs et réessayez.` | `error_form_generic` |

**Microcopy rules:**

- French is the canonical product language. EN copy in `lib/i18n.ts` is best-effort but never the source for design decisions.
- ASCII diacritic policy from CLAUDE.md (`UMTF/diacritic safety`) does NOT apply to UI display copy — only to mailto/CSV payloads (and this phase introduces no new mailto/CSV strings). UI copy CAN and SHOULD use proper accents (`é`, `è`, `à`, `ç`).
- Sentence case for buttons (`Se connecter` not `SE CONNECTER`). Kicker class is the only place where uppercase is applied (via CSS `text-transform`).
- Primary CTAs: action verb first, never noun-only. `Se connecter` ✓ — `Connexion` ✗.

**Destructive actions in this phase:** None. Login → logout is non-destructive (session clear). Phase 6 introduces no irreversible actions.

---

## Component Inventory — Phase 6 Primitives

**Location:** `components/ui/` (new directory). Each file = one primitive. Named exports only (no `export default`). All client components NOT necessary unless they hold state — Button/Pill/LevelBadge are pure server-renderable.

### `<Button>`

```ts
type ButtonProps = {
  variant?: "primary" | "success" | "ghost";   // default "primary"
  size?: "default" | "lg";                      // default "default"
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;                           // pass-through, NOT for restyling
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
```

| Variant | Background | Border | Text | Min height (default/lg) |
|---------|------------|--------|------|-------------------------|
| `primary` | `var(--eic-blue)` | `var(--eic-blue)` | `#fff` | 40px / 48px |
| `success` | `var(--eic-green)` | `var(--eic-green)` | `#fff` | 40px / 48px |
| `ghost` | `transparent` | `var(--home-border-strong)` | `var(--home-ink)` | 40px / 48px |

- Padding: 8px 14px (default), 12px 20px (lg)
- Radius: `var(--radius-sm)` (8px)
- Font: 15px / 600 weight / `var(--font-body)`
- Hover: `box-shadow: var(--shadow-hover)`, no color shift
- Focus-visible: `outline: 3px solid rgba(27,58,92,0.22); outline-offset: 0`
- Disabled: `opacity: 0.5; cursor: not-allowed`
- NO `style={...}` prop accepted; NO `as` polymorphism. If a Link is needed, wrap `<Link>` around `<Button>`.

### `<Pill>`

```ts
type PillProps = {
  tone?: "default" | "blue" | "green" | "amber" | "rose";  // default "default"
  size?: "default" | "lg";                                  // default "default"
  icon?: React.ReactNode;                                   // optional lucide icon, 14px
  children: React.ReactNode;
};
```

| Tone | Background | Border | Text |
|------|------------|--------|------|
| `default` | `var(--wf-paper-deep)` (#F2EDE2) | `var(--wf-line)` | `var(--wf-ink-soft)` |
| `blue` | `#E1E8F1` | `#B6C5DA` | `var(--eic-blue)` |
| `green` | `#DDEDDE` | `#B7D4B7` | `var(--eic-green)` |
| `amber` | `#F4E6C8` | `#DCC394` | `#B47A14` |
| `rose` | `#F0D9D9` | `#DCB1B1` | `#A23B3B` |

- Padding: 3px 9px (default), 6px 12px (lg)
- Radius: `var(--radius-pill)` (9999px)
- Font: 11px (default) / 13px (lg) / 500 weight
- Inline-flex, gap 6px when `icon` provided

### `<LevelBadge>`

```ts
type LevelBadgeProps = {
  state: "done" | "current" | "locked";
  level: "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";
  size?: "default" | "lg";  // default 28px / 36px
};
```

| State | Background | Border | Text | Extra |
|-------|------------|--------|------|-------|
| `done` | `var(--eic-green)` | `var(--eic-green)` | `#fff` | — |
| `current` | `var(--eic-blue)` | `var(--eic-blue)` | `#fff` | `box-shadow: 0 0 0 4px rgba(27,58,92,0.15)` + `pulse` CSS animation 2s ease-in-out infinite |
| `locked` | `var(--wf-paper-deep)` | `var(--wf-line)` (dashed) | `var(--wf-ink-faint)` | `border-style: dashed` |

- Shape: `border-radius: 50%`
- Size: 28x28 (default) / 36x36 (lg)
- Font: 11px / 700 weight
- Pulse animation MUST be CSS-only (no JS tick), respect `prefers-reduced-motion: reduce` (animation disabled)

### `<ProgressBar>`

```ts
type ProgressBarProps = {
  value: number;                  // 0..1, clamped
  tone?: "blue" | "green";        // default "green"
  size?: "default" | "lg";        // default 8px / 12px
  ariaLabel?: string;             // required when not associated with visible label
};
```

- Track: `height: 8px` (default) / `12px` (lg), `border-radius: 4px`, `background: var(--wf-paper-deep)`, `border: 1px solid var(--wf-line)`
- Fill: `height: 100%`, `background: var(--eic-green)` (green) or `var(--eic-blue)` (blue), `transition: width 250ms ease`
- Accessibility: render `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow={Math.round(value*100)}`

**Style ownership rule (DSY-04 contract):** Every primitive MUST encapsulate all visual rules in its own CSS class (`.eic-button`, `.eic-pill`, `.eic-level-badge`, `.eic-progress`). Pages using these primitives MUST NOT pass `style={...}` to override. Lint guard: grep refactored pages for `style={` — only acceptable on `wf-aurora` blob positioning and explicit one-off heights/widths (e.g., charging bar height in Phase 7).

---

## Layout Inventory — Phase 6 AppShell

### `<AppShell variant="player" | "staff">`

Existing `components/app-shell.tsx` extended with a `variant` prop. Default = `staff` (preserves v0.1 behavior for unrefactored callers).

#### `variant="player"` — TopbarLite + bottom tab bar

- **Desktop (≥1100px):** Horizontal topbar at top, content full-width below. No sidebar.
  - Topbar height: 72px
  - Topbar layout: brand-mark + brand-name (left) · grow · status pill + avatar (right)
  - Padding: `18px 28px`
  - Background: `rgba(255,255,255,0.6)` with `backdrop-filter: blur(2px)` (light glass)
  - Border-bottom: `1px solid var(--home-border)`
- **Mobile (<1100px):** Same topbar (height 64px, padding `12px 18px`) + fixed bottom tab bar.
  - Bottom tab bar: 64px height, 4 columns, `position: fixed; bottom: 0`, `background: rgba(255,255,255,0.96)`, `border-top: 1px solid var(--home-border)`
  - Active tab: `color: var(--eic-blue)`, `font-weight: 700`, icon background filled
  - Inactive: `color: var(--wf-ink-faint)` (#8A8775), icon outlined
  - Tabs (Phase 6 stub, populated in Phase 7): `Parcours` / `Équipe` / `Profil` / `Aide`. Phase 6 ships the chrome with single-tab "Parcours" linking `/journey`.

#### `variant="staff"` — Sidebar restyled

- Existing v0.1 sidebar layout preserved (276px wide, `position: sticky`).
- Background: `var(--eic-blue)` (instead of `--brand-primary` #0B2545 — both render as deep navy, slightly bluer).
- Active link: `background: rgba(255,255,255,0.14)` (preserved from v0.1).
- Brand block at top: `EICLogo` lockup + tagline (`var(--font-heading)`, 18px, weight 600).
- Mobile <1100px: sidebar collapses to top stripe (existing v0.1 behavior preserved — do not break).

### `EICLogo` lockup

New component at `components/ui/eic-logo.tsx`. Inline SVG, NOT `<Image>` (avoids Next.js image loader for a 28px element).

```
[ E·  ]  EIC
         INNOVATION CENTER
```

- Square mark: 28x28, `border-radius: 6px`, `background: var(--eic-blue)`, white serif `E` 16px Baskervville bold, with green dot 10px diameter overlapping bottom-right (`background: var(--eic-green)`, white 2px ring).
- Wordmark: `EIC` in Baskervville 700 + small kicker `INNOVATION CENTER` 9px 0.18em tracking (green via `.kicker` class).
- Variants: `<EICLogo variant="default" />` (default), `<EICLogo variant="white" />` (for sidebar dark background — mark switches to transparent + white border, wordmark white).

---

## Page-level Specs — Phase 6

### `/login` — DSY-06

```
┌─────────────────────────────────────────────┐
│  [EICLogo]                                  │  ← top-left, 24px from edges
│                                             │
│  ░░░ aurora blobs (z=0) ░░░                 │
│                                             │
│        ┌──────────────────────┐             │
│        │  [glass card]        │             │
│        │                      │             │
│        │  KICKER (green)      │             │
│        │  Connectez-vous au   │             │  ← h1, Baskervville 700,
│        │  Hack-Days           │              clamp(40,5.5vw,72), 2-line max
│        │                      │             │
│        │  Lead body subtitle  │             │  ← .lead, 20px Montserrat 400
│        │                      │             │
│        │  Email      [_____] │             │  ← form
│        │  Password   [_____] │             │
│        │  [Se connecter]     │              ← Button primary lg, full-width
│        │  err message slot   │             │
│        └──────────────────────┘             │
│                                             │
├─────────────────────────────────────────────┤
│  [Tamwilcom][BoA][InnovInvest][Bluespace]   │  ← partner banner, fixed bottom
│  [EIC][UEMF]                                │
│  Avec le soutien de nos partenaires         │
└─────────────────────────────────────────────┘
```

- Page background: `var(--home-ivory)` solid + `<div class="eic-aurora">` overlay
- Glass card: `width: min(100%, 460px)`, padding 32px, `border-radius: var(--radius-lg)` (20px), uses `.eic-glass` class
- Vertical alignment: card centered, partner banner stuck to bottom (`flex-column` shell with `flex: 1` main)
- Mobile (<640px): partner banner wraps, logos stack 3+3, page padding reduces to 16px
- Partner logos: SVG/PNG in `public/brand/partners/`. If unavailable at write time, use typographic lockups in Baskervville: `TAMWILCOM`, `BANK OF AFRICA ACADEMY`, `INNOV INVEST`, `BLUESPACE`, `EIC`, `UEMF`. Operator (Omar) replaces with real assets post-Phase 6. Height: 40px, opacity 0.9, grayscale on hover off.

### AppShell-wrapped routes — DSY-05

| Route | Variant | Notes |
|-------|---------|-------|
| `/journey` | `player` | Topbar + tab bar. Phase 6 = wrap existing v0.1 page in new shell, no content refactor |
| `/journey/deliverable/[id]` | `player` | Same |
| `/onboarding` | `player` (no tab bar — onboarding flow) | Topbar visible, tab bar hidden via prop `hideTabBar` |
| `/mentor`, `/mentor/submission/[id]` | `staff` | Existing sidebar, restyled |
| `/admin`, `/admin/players/import`, `/admin/players/[id]` | `staff` | Existing sidebar, restyled |
| `/jury`, `/results` | `staff` | Existing sidebar, restyled |

**No content changes to v0.1 pages in Phase 6.** Only the shell + global tokens change. The `/journey` content refactor is Phase 7; the `/admin` live mode is Phase 9.

---

## Interaction & Motion Contract

| Interaction | Spec |
|-------------|------|
| Button hover | `box-shadow: var(--shadow-hover)`, transition 250ms ease (`var(--transition-base)`). No translate, no color shift. |
| Button active (mousedown) | `transform: translateY(1px)`, no shadow. |
| Button focus-visible | `outline: 3px solid rgba(27,58,92,0.22); outline-offset: 0` — never removed. |
| Link hover | `color: var(--eic-blue)`, `text-decoration: underline`. |
| LevelBadge `current` pulse | CSS keyframes `pulse-eic`, 2s ease-in-out infinite, scale 1.0 → 1.05 → 1.0 + ring opacity 0.15 → 0.25 → 0.15. Disabled under `@media (prefers-reduced-motion: reduce)`. |
| Sidebar active link | Instant background change (no transition). |
| Login form submit | Disable button (`disabled` + `aria-busy="true"`), label changes to `Connexion en cours…` (i18n key `login_submitting`). |
| Page transitions | None in Phase 6 (cross-page transitions deferred to v0.3 per `06-CONTEXT.md` deferred). |
| Drawer (Phase 7 contract) | Slide-in 300ms `cubic-bezier(0.2, 0.8, 0.2, 1)` from right; backdrop fade 200ms ease. NOT implemented in Phase 6 — primitives ready. |

**Reduced motion:** All animations MUST be wrapped in `@media (prefers-reduced-motion: no-preference)` OR have an explicit `@media (prefers-reduced-motion: reduce)` killswitch.

---

## States Inventory — Phase 6 Surfaces

| Surface | Default | Loading | Empty | Error |
|---------|---------|---------|-------|-------|
| `/login` | Form ready | Submit button = `disabled + aria-busy`, label `Connexion en cours…` | n/a (no list) | `<p class="form-error">{message}</p>` below form, red text + role=alert |
| AppShell (player) | Shell rendered immediately (server component) | n/a (server-rendered) | n/a | If user has no team yet: redirect to `/onboarding` (existing v0.1 logic preserved) |
| AppShell (staff) | Shell rendered immediately | n/a | n/a | n/a |
| `<Button>` | Idle | `disabled aria-busy="true"` (caller-controlled) | n/a | n/a |
| `<ProgressBar>` | Fill at value | Indeterminate state DEFERRED to v0.3 (no use case in Phase 6) | `value=0` shows empty track | n/a |

**Skeleton loaders explicitly deferred** to v0.3 per `06-CONTEXT.md` deferred section. Phase 6 uses simple text fallback (`Chargement…`).

---

## Accessibility Contract

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | All text on `--home-ivory`/`--home-surface` uses `--home-ink` (#14243D) → contrast ≥ 13:1 ✓. White text on `--eic-blue` → 8.5:1 ✓. White text on `--eic-green` → 5.1:1 ✓. Pill text on tinted backgrounds verified in token file (all ≥ 4.5:1). |
| Focus visible | Every interactive element shows `outline: 3px solid rgba(27,58,92,0.22)` on `:focus-visible`. Never `outline: none` without a replacement. |
| Touch targets | Buttons ≥40px (default size) / ≥48px (`size="lg"` for primary CTAs). Tab bar items ≥44px. |
| Keyboard nav | TopbarLite tab order: brand → status pill → avatar/menu. Tab bar (mobile): left-to-right tabs. Sidebar (staff): top-down nav links. |
| ARIA | `<aside aria-label="Primary navigation">` on sidebar (preserve v0.1). TopbarLite uses `<header>` semantically. Tab bar uses `<nav aria-label="Mobile primary">`. ProgressBar uses `role="progressbar"` + `aria-valuenow`. |
| Reduced motion | `prefers-reduced-motion: reduce` disables LevelBadge pulse. |
| Screen reader copy | EICLogo's `<svg>` has `<title>EIC — Euromed Innovation Center</title>` and `role="img"`; image-only logos in partner banner have meaningful `alt` (e.g. `Tamwilcom`). |

---

## Responsive Breakpoints

Pulled from existing `app/globals.css` (preserve to avoid regressions):

| Breakpoint | Boundary | Behavior |
|------------|----------|----------|
| Desktop | ≥1100px | Sidebar visible (staff), TopbarLite + no bottom bar (player), full grids |
| Tablet | <1100px and ≥640px | Sidebar collapses (staff variant), tab bar appears (player variant), single-column grids |
| Mobile | <640px | Compact padding 16-18px, stacked toolbars, full-width buttons (existing v0.1 rule) |

**1100px is the canonical breakpoint** (PLR-01/PLR-02 reference it as well). Do NOT introduce new breakpoints in Phase 6.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — Phase 6 ships custom primitives only | not applicable |
| Third-party registries | none | not applicable |

**No shadcn initialization in this project.** Per `06-CONTEXT.md`, design tokens come verbatim from `.planning/design-v2/project/eic-tokens.css` (a local artifact authored by the Claude Design tool and hand-reviewed by Omar). Primitives are hand-written React components. No `npx shadcn` commands needed.

---

## File Manifest — What Phase 6 Creates

| Path | Purpose | New / Modified |
|------|---------|----------------|
| `app/eic-tokens.css` | EIC design tokens (verbatim from `.planning/design-v2/project/eic-tokens.css`, minus `@import url(...)`) | NEW |
| `app/globals.css` | Add glass utility classes (`.eic-glass`, `.eic-glass-tint`, `.eic-glass-dark`) + aurora helper. v0.1 tokens UNTOUCHED. | MODIFIED |
| `app/layout.tsx` | Wire `next/font/google` for Baskervville + Montserrat; import `./eic-tokens.css`; set `--font-heading` + `--font-body` variables on `<html>` | MODIFIED |
| `components/ui/button.tsx` | Button primitive | NEW |
| `components/ui/pill.tsx` | Pill primitive | NEW |
| `components/ui/level-badge.tsx` | LevelBadge primitive | NEW |
| `components/ui/progress-bar.tsx` | ProgressBar primitive | NEW |
| `components/ui/eic-logo.tsx` | EICLogo lockup (inline SVG) | NEW |
| `components/ui/index.ts` | Barrel export of the 5 primitives | NEW |
| `components/app-shell.tsx` | Add `variant: 'player' \| 'staff'` prop; render TopbarLite + tab bar for player, restyled sidebar for staff | MODIFIED |
| `components/topbar-lite.tsx` | Player topbar (extracted) | NEW |
| `components/mobile-tab-bar.tsx` | Player mobile bottom tab bar (extracted) | NEW |
| `app/login/page.tsx` | Refactor: aurora background + glass card + EICLogo top-left + partner banner footer | MODIFIED |
| `components/partner-banner.tsx` | Existing, restyle to use new tokens (partners array unchanged) | MODIFIED |
| `lib/i18n.ts` | Add new keys per Copywriting Contract table (~9 new keys) | MODIFIED |
| `public/brand/partners/*.svg` | Optional: partner SVGs if available (else typographic placeholders in code) | NEW (operator-deferred) |

**Files NOT touched in Phase 6:**

- `app/journey/**`, `app/mentor/**`, `app/admin/**`, `app/jury/**`, `app/results/**` page contents (only their AppShell wrap may change variant prop).
- `lib/data.ts`, `lib/types.ts`, `lib/seed/**`, `lib/score.ts`, `lib/icons.ts`.
- Any `database/*.sql`. Phase 6 ships ZERO DDL.
- `app/actions.ts`. Phase 6 ships ZERO new server actions.

---

## Build Sanity — DSY-07 Acceptance

After every commit in Phase 6:

```bash
npm run typecheck   # MUST pass with 0 errors
npm run lint        # MUST NOT introduce new warnings vs v0.1-pilot-ready
npm run build       # MUST succeed, no font-load regressions, no missing module errors
```

**Manual smoke (after final phase commit):**

1. `/login` renders with aurora + glass card + partner banner; submit goes through.
2. `/journey` renders with player TopbarLite (no sidebar), tab bar at bottom on viewport <1100px.
3. `/mentor`, `/admin` render with staff sidebar (restyled blue, not slate).
4. `/jury`, `/results` render unchanged content under staff shell.
5. Backdrop-filter fallback verified by toggling devtools "Disable backdrop-filter" or simulating Android Chrome 89.
6. LCP `/login` measured on Lighthouse mobile 3G ≤2.5s (gate from DSY-02).

---

## Out of Scope for Phase 6 (explicit)

The following are NOT in this phase's contract — gsd-ui-checker MUST NOT flag their absence:

- Charging bar L0→L7 (Phase 7 / PLR-01-02)
- Hero "Prochaine étape" + drawer (Phase 7 / PLR-03-04)
- 3-step onboarding editorial (Phase 7 / PLR-05)
- Submit success ticket with "SOUMIS" stamp (Phase 7 / PLR-06)
- Revision V2 pedagogical screen (Phase 7 / PLR-07)
- Mentor link-card with Google Docs/GitHub icon detection (Phase 8 / MNT-01)
- Mentor async tagged comments composer (Phase 8 / MNT-03)
- GameMaster live-mode toggle + radar pulses (Phase 9 / GMR-01-02)
- Pixel mascotte SVG (Phase 9 / GMR-07)
- Pitch theater mode + replay podium (Phase 9 / GMR-05-06)
- Announcements composer (Phase 9 / GMR-04)
- Dark mode user toggle (deferred v0.3)
- Language switcher UI (deferred v0.3)
- Skeleton loaders (deferred v0.3)
- Empty state illustrations (deferred v0.3)
- Storybook / dev page for primitives (deferred per CONTEXT.md)

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
