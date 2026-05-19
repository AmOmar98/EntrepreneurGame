---
phase: 06
plan: 01
subsystem: design-system-foundation
tags: [design-tokens, fonts, glass-effect, css-utilities, i18n, eic-v2]
requirements_completed: [DSY-01, DSY-02, DSY-03]
dependency_graph:
  requires: []
  provides:
    - "EIC v2 design tokens (palette, gradients, radii, shadows, transitions, spacing, wf-* layer)"
    - "next/font/google self-hosted Baskervville + Montserrat exposed via --font-heading / --font-body"
    - ".eic-glass / .eic-glass-tint / .eic-glass-dark utility classes with @supports backdrop-filter fallback"
    - ".eic-aurora helper (radial blurred blobs) for /login + /journey hero"
    - "3 new login i18n keys (login_submitting, login_error_invalid, login_error_generic) in fr+en"
  affects:
    - "app/layout.tsx — root layout now wires fonts and imports eic-tokens.css"
    - "All routes — fonts available globally; v0.1 routes still use legacy Inter via globals.css body rule"
tech_stack:
  added:
    - "next/font/google Baskervville (weight 400, subsets latin)"
    - "next/font/google Montserrat (weights 300-800, subsets latin)"
  patterns:
    - "Verbatim copy of design tokens from .planning/design-v2/project/eic-tokens.css to app/eic-tokens.css"
    - "Wireframe layer (--wf-*) appended to same :root for shared primitives in plan 06-02"
    - "@supports not (backdrop-filter: blur(1px)) fallback to opaque rgba backgrounds"
    - "Scoped html { } rule (empty) to prevent font cascade onto v0.1 pages"
key_files:
  created:
    - "app/eic-tokens.css"
  modified:
    - "app/layout.tsx"
    - "app/globals.css"
    - "lib/i18n.ts"
decisions:
  - "EIC tokens copied verbatim from .planning/design-v2/project/eic-tokens.css minus the @import url(fonts.googleapis.com) line — next/font/google handles loading"
  - "Wireframe layer (--wf-*) tokens appended to the same :root block as EIC tokens (avoids two :root re-declarations and matches single-source-of-truth pattern)"
  - "html { } rule scoped to empty body in eic-tokens.css so refactored v2 pages opt in via var(--font-heading) / var(--font-body); v0.1 pages keep their Inter font stack from globals.css"
  - "Glass utilities prefixed .eic-* (not .wf-*) per CONTEXT.md — wf-* class names reserved for Phase 06-02 wireframe-internal primitives, .eic-* for production utilities"
  - "Fallback backgrounds: 0.92 / 0.94 / 0.96 opacity rgba per UI-SPEC line 146-149"
  - "Aurora helper requires positioned wrapper (never on <body>) — z-index: 0, pointer-events: none"
  - "i18n FR keys use proper diacritics (é, è, …) per UI-SPEC line 200 — UI dictionary, not mailto/CSV payload, so diacritic-safe"
metrics:
  duration_seconds: 192
  duration_minutes: 3
  completed_at: "2026-05-09"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 3
  commits: 3
---

# Phase 6 Plan 01: Tokens, fonts, glass utilities Summary

EIC v2 visual foundation laid: design tokens copied verbatim, Baskervville + Montserrat self-hosted via next/font/google, glass + aurora utilities ready for /login (Phase 6) and journey hero (Phase 7) — all without breaking v0.1 surfaces.

## What was built

### Task 1 — `app/eic-tokens.css` (DSY-01)

Copied `.planning/design-v2/project/eic-tokens.css` verbatim with two surgical changes:

1. **Removed** `@import url('https://fonts.googleapis.com/css2?...')` line (replaced with comment pointing to next/font in layout.tsx).
2. **Appended** wireframe layer tokens (`--wf-paper`, `--wf-paper-deep`, `--wf-line`, `--wf-line-strong`, `--wf-ink`, `--wf-ink-soft`, `--wf-ink-faint`, `--wf-blue`, `--wf-blue-tint`, `--wf-green`, `--wf-green-tint`, `--wf-amber`, `--wf-amber-tint`, `--wf-rose`, `--wf-rose-tint`, `--wf-stone`, `--wf-stone-tint`, `--wf-hand`) to the same `:root` block from `wf-base.css`.
3. **Scoped** the `html { font-family: var(--font-body); color: var(--home-ink); }` rule to an empty body (`html { /* applied via next/font on <html> */ }`) to prevent v2 fonts cascading onto unrefactored v0.1 pages (`/journey`, `/admin`, `/mentor` etc.).

Dark mode tokens (`.dark, [data-theme="dark"]`) preserved — UI toggle deferred to v0.3 per CONTEXT.md.

Typography rules (`h1` through `code`) copied verbatim — clamp-based fluid scale, kicker uppercase tracking, link colors.

Commit: `9380885`

### Task 2 — `app/layout.tsx` (DSY-02)

Wired `next/font/google` for both fonts:

- **Baskervville** (titles): `subsets: ["latin"]`, `weight: ["400"]`, `style: ["normal", "italic"]`, `variable: "--font-heading"`, `display: "swap"`
- **Montserrat** (body): `subsets: ["latin"]`, `weight: ["300", "400", "500", "600", "700", "800"]`, `variable: "--font-body"`, `display: "swap"`

Imports order: `globals.css` → `eic-tokens.css` (so EIC `:root` tokens override duplicates if any).

`<html>` now has `className={`${baskervville.variable} ${montserrat.variable}`}` exposing both CSS variables.

`metadata` export preserved (title, description, icons untouched).

`<body>` has no new className — body keeps inheriting `font-family: Inter, ...` from globals.css for v0.1 pages. Refactored pages will explicitly use `var(--font-body)` / `var(--font-heading)`.

Self-hosted fonts confirmed in `.next/static/media/` after `npm run build`.

Commit: `79fd6a9`

### Task 3 — Glass utilities + aurora + i18n keys (DSY-03)

**Part A — `app/globals.css`** (appended at line 836+):

- `.eic-glass`: `rgba(255,255,255,0.58)` + `blur(18px) saturate(140%)` + soft inset/drop shadows
- `.eic-glass-tint`: linear gradient + `blur(16px) saturate(150%)` (for drawer side panels in P7)
- `.eic-glass-dark`: `rgba(27,58,92,0.62)` + `blur(20px)` + white text (for GM live-mode in P9)
- `@supports not (backdrop-filter: blur(1px))` block: opaque fallbacks 0.92 / 0.94 / 0.96 — covers Android Chrome <90
- `.eic-aurora`: positioned absolute, `pointer-events: none`, `z-index: 0`
- `.eic-aurora::before`: 420×420px `#B5D4B7` blur 60px (top-left)
- `.eic-aurora::after`: 480×480px `#BCD0E6` blur 60px (bottom-right)
- `.eic-aurora .blob3`: 360×360px `#F4E6C8` blur 70px (center, optional)

All v0.1 rules above line 836 untouched — `--brand-primary`, `--bg`, `.app-shell`, `.sidebar`, `.button` etc. preserved.

**Part B — `lib/i18n.ts`**:

Added 3 keys to both `fr` and `en`:

| Key | FR | EN |
|-----|----|----|
| `login_submitting` | `Connexion en cours…` | `Signing in...` |
| `login_error_invalid` | `Email ou mot de passe incorrect. Vérifiez vos identifiants ou contactez votre GameMaster.` | `Invalid email or password. Check your credentials or contact your GameMaster.` |
| `login_error_generic` | `Connexion impossible. Réessayez dans un instant.` | `Sign-in failed. Try again in a moment.` |

FR uses proper diacritics (`é`, `è`, `…`) per UI-SPEC line 200. `as const` annotation preserved.

Commit: `4f29fd0`

## Verification results

- `npm run typecheck` — exits 0 (after each task)
- `npm run lint` — exits 0, no new warnings
- `npm run build` — succeeds, 13 routes generated, no font-load regressions
- `.next/static/media/*.woff2` — 9 woff2 files self-hosted (Baskervville + Montserrat across weights/styles)
- `grep -r "fonts.googleapis.com" app/ components/ lib/` — no matches in source (only in `.planning/design-v2/project/` reference files which are not bundled)
- v0.1 token preservation — `--brand-primary: #0B2545`, `--bg: #f6f4ef`, `--green: #116149`, `--blue: #215d8f`, `--gold: #91640e`, `--red: #a63d2f`, `.app-shell`, `.sidebar`, `.button` all confirmed still present in `app/globals.css` after edits

## Deviations from Plan

None — plan executed exactly as written. The three tasks landed verbatim per their `<action>` blocks, all `<acceptance_criteria>` confirmed via the prescribed `node -e '...'` verifies, and the typecheck/lint/build trio passed without any auto-fix needed.

## Gotchas / Notes

- **Baskervville weight limitation**: Google Fonts only ships Baskervville at weight 400 — UI-SPEC type scale calls for 700/600/500 on h1/h2/h3-h4. The browser will synth-bold these. This is documented in the plan (Task 2 action §) and matches the design source (`eic-tokens.css` declares the same weights against the same font). If the synthetic-bold rendering proves visually unacceptable on h1, future option = switch headings to `Lora` or `Crimson Pro` (both have real 700) — a single-token change, zero risk.

- **`html { }` empty rule**: required by UI-SPEC line 106 to avoid Baskervville/Montserrat cascading onto unrefactored v0.1 pages. Once Phase 7 refactors `/journey` and Phase 9 refactors `/admin`, the rule can be re-tightened.

- **`.eic-` vs `.wf-` naming**: production utility classes use the `.eic-` prefix in this plan. The `.wf-` prefix is reserved for Phase 06-02 component-internal primitives (matches CONTEXT.md "Claude's Discretion" decision). The `--wf-*` CSS variables stay `--wf-*` (those are tokens, not class names — they ship in production but are scoped to the wireframe color palette).

- **Aurora positioning contract**: `.eic-aurora` MUST sit inside a positioned ancestor (the page shell). `position: absolute; inset: 0` collapses if the parent isn't `position: relative`. `/login` (Plan 06-04) and the journey hero (Phase 7) will need to wrap content in a relatively-positioned shell.

- **Diacritic policy in i18n**: `lib/i18n.ts` already mixed ASCII-safe (`Connexion en cours`) and bare strings — new keys go full diacritic per UI-SPEC mandate. CLAUDE.md ASCII-diacritic safety rule applies only to mailto/CSV payloads, NOT to UI dictionaries. Phase 6 introduces zero new mailto/CSV strings, so the policy is unaffected.

## Files touched

- **Created**: `app/eic-tokens.css` (203 lines)
- **Modified**: `app/layout.tsx` (+18 lines, font wiring + import)
- **Modified**: `app/globals.css` (+86 lines appended at end)
- **Modified**: `lib/i18n.ts` (+6 lines, 3 keys × 2 locales)

## Threat surface scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are in static CSS / TSX / TS files with literal token values copied from a reviewed source. Threat T-06-01 (Information Disclosure via remote @font-face) explicitly mitigated — `next/font/google` self-hosts under `/_next/static/media/`, no runtime third-party request. Threat T-06-03 (DoS via backdrop-filter rendering crash) mitigated via `@supports not` opaque fallback.

## Self-Check

**File existence checks:**
- FOUND: `app/eic-tokens.css`
- FOUND: `app/layout.tsx` (modified)
- FOUND: `app/globals.css` (modified)
- FOUND: `lib/i18n.ts` (modified)

**Commit existence checks:**
- FOUND: `9380885` — feat(06-01): add EIC v2 design tokens with wf-* layer (DSY-01)
- FOUND: `79fd6a9` — feat(06-01): wire next/font/google + import eic-tokens.css (DSY-02)
- FOUND: `4f29fd0` — feat(06-01): add eic-glass utilities + aurora helper + login i18n keys (DSY-03)

**Build artifact checks:**
- FOUND: 9 woff2 files in `.next/static/media/` (Baskervville + Montserrat self-hosted)

## Self-Check: PASSED
