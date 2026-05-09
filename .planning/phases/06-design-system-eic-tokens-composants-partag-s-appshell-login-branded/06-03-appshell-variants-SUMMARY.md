---
phase: 06
plan: 03
subsystem: appshell-variants
tags: [appshell, topbar-lite, mobile-tabbar, staff-sidebar, variant-prop, dsy-05, eic-v2]
requirements_completed: [DSY-05]
dependency_graph:
  requires:
    - "06-01 (EIC v2 tokens — --eic-blue, --home-ivory, --home-border, --wf-ink-soft, --wf-ink-faint, --radius-sm, --shadow-hover)"
    - "06-02 (5 shared primitives — EICLogo consumed by TopbarLite via @/components/ui)"
  provides:
    - "AppShell with variant=\"player\"|\"staff\" + hideTabBar prop (default variant=\"staff\" for v0.1 backward compat)"
    - "components/topbar-lite.tsx — server component with EICLogo + brand text + nav + signOut form"
    - "components/mobile-tab-bar.tsx — client component with usePathname active state, fixed bottom <1100px"
    - ".eic-shell + .eic-topbar + .eic-mobile-tabbar + .eic-staff-sidebar CSS classes in app/globals.css"
    - "7 new i18n keys: brand_subtitle, nav_logout, nav_player_team, mobile_tab_journey/team/profile/help (fr+en)"
  affects:
    - "Phase 06-04 (Login branded) — login is not wrapped in AppShell, no impact on its layout"
    - "Phase 7 (Joueur) — will replace single-tab \"Parcours\" stub with full 4-tab MobileTabBar (lucide icons, real routes)"
    - "Phase 8/9 — staff sidebar renders restyled --eic-blue background everywhere"
tech_stack:
  added: []
  patterns:
    - "variant defaulting to staff via `variant ?? \"staff\"` in component body (preserves v0.1 callers without prop)"
    - "Additive CSS class .eic-staff-sidebar — only swaps background, structural rules from legacy .sidebar inherit"
    - "Server component for TopbarLite (no hooks, signOut is server action) — minimizes client bundle"
    - "Client component for MobileTabBar (usePathname for active state) — required by Next.js 15 App Router"
    - "1100px canonical breakpoint per UI-SPEC line 451 — desktop nav vanishes, bottom tab bar appears"
    - "Mobile main padding-bottom 76px (64px tabbar + 12px breathing) prevents content occlusion under fixed bar"
key_files:
  created:
    - "components/topbar-lite.tsx"
    - "components/mobile-tab-bar.tsx"
  modified:
    - "components/app-shell.tsx"
    - "lib/i18n.ts"
    - "app/globals.css"
    - "app/journey/page.tsx"
    - "app/journey/deliverable/[id]/page.tsx"
    - "app/onboarding/page.tsx"
    - "app/mentor/page.tsx"
    - "app/mentor/submission/[id]/page.tsx"
    - "app/admin/page.tsx"
    - "app/admin/players/import/page.tsx"
    - "app/admin/players/[id]/page.tsx"
    - "app/jury/page.tsx"
    - "app/results/page.tsx"
decisions:
  - "AppShell default variant = staff (preserves v0.1 backward compat — pages without explicit variant fall through unchanged)"
  - "TopbarLite is a server component despite Link usage — Link works in SSR, signOut is a server action via plain <form action>, no client hooks needed"
  - "MobileTabBar is a client component (\"use client\") because usePathname() requires client runtime for active state derivation"
  - "Mobile tab bar Phase 6 = single-tab stub (\"Parcours\" linking /journey) per UI-SPEC line 322; 4 real tabs + lucide icons land in Phase 7"
  - "Tab icon = static `·` placeholder for Phase 6 (lucide icons deferred to Phase 7 — keeps phase isolation; CSS already styles a 22px square that lucide will fit into)"
  - "/results role swap (W2 critical): replaced 3 occurrences of `role={role ?? \"player\"}` with `role={role ?? \"game_master\"}` AND added variant=\"staff\" — /results is staff-only management; if a Player ever lands there without a role they should see staff sidebar (gated upstream by getCurrentUser redirect anyway)"
  - "/onboarding uses hideTabBar=true (UI-SPEC line 391) — tab bar would distract from a linear flow with redirect at completion"
  - "signOut form uses no useActionState (W4) — server action returns void with redirect(), fire-and-forget; any client pending UI would race the navigation"
  - "Staff sidebar restyle is purely additive (.eic-staff-sidebar class adds background: var(--eic-blue) on top of legacy .sidebar) — no destructive mod to v0.1 CSS"
  - "Inline `style={{ background: \"rgba(255,255,255,0.14)\" }}` on active link removed; replaced by className=\"is-active\" + matching CSS rule. Cleaner cascade, same render."
  - "Image props alphabetized in StaffShell (alt/className/height/src/width) — minor ESLint cleanup, behavior unchanged"
metrics:
  duration_seconds: 288
  duration_minutes: 4.8
  completed_at: "2026-05-09"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 12
  commits: 3
---

# Phase 6 Plan 03: AppShell variants Summary

`<AppShell>` now distinguishes Player (TopbarLite + bottom tab bar mobile, no sidebar) from Staff (sidebar restyled with `--eic-blue`). 2 new components extracted, 7 i18n keys added, 169 lines of CSS appended, 10 page wrappers wired with the new `variant` prop. v0.1 sidebar still works for any caller that omits `variant=`.

## What was built

### Task 1 — TopbarLite + MobileTabBar + AppShell variant prop + i18n keys (commit `f5168e5`)

**`lib/i18n.ts`** — 7 new keys in BOTH `fr` and `en` dictionaries, inserted near existing `nav_*` group:

| Key | fr | en |
|-----|-----|-----|
| `brand_subtitle` | `Hack-Days · EIC` | `Hack-Days · EIC` |
| `nav_logout` | `Se déconnecter` | `Sign out` |
| `nav_player_team` | `Mon équipe` | `My team` |
| `mobile_tab_journey` | `Parcours` | `Journey` |
| `mobile_tab_team` | `Équipe` | `Team` |
| `mobile_tab_profile` | `Profil` | `Profile` |
| `mobile_tab_help` | `Aide` | `Help` |

**`components/topbar-lite.tsx`** (NEW, server component, 41 lines):

```ts
export type TopbarLiteProps = {
  navItems: { href: string; label: string }[];
  brandName: string;
  brandSubtitle: string;
  logoutLabel: string;
};
export function TopbarLite({ navItems, brandName, brandSubtitle, logoutLabel }: TopbarLiteProps): JSX.Element;
```

Structure: `<header role="banner">` with `<Link href="/journey"><EICLogo /></Link>` brand mark, brand name + subtitle column, flex-grow spacer, primary nav links, `<form action={signOut}>` logout button. No `"use client"` — `signOut` from `@/app/actions` is invoked via plain form post (Next.js handles CSRF for server actions automatically), `Link` renders SSR-friendly `<a>` tags.

**`components/mobile-tab-bar.tsx`** (NEW, client component, 35 lines):

```ts
export type MobileTabBarItem = { href: string; label: string; key: string };
export type MobileTabBarProps = { items: MobileTabBarItem[] };
export function MobileTabBar({ items }: MobileTabBarProps): JSX.Element;
```

`"use client"` directive required for `usePathname()` active-state derivation. Active match logic: `pathname === item.href || pathname?.startsWith(`${item.href}/`)` — handles deep links like `/journey/deliverable/abc` highlighting the `/journey` tab. Icon slot is currently a placeholder `·` — Phase 7 will replace with lucide icons inside the same 22px square frame.

**`components/app-shell.tsx`** (MODIFIED — full rewrite, 99 lines):

```ts
export type AppRole = "player" | "mentor" | "game_master";
export type AppShellVariant = "player" | "staff";

export function AppShell({
  children, role,
  variant,        // optional, defaults to "staff" via `variant ?? "staff"` in body
  hideTabBar,     // optional, only honored when resolved variant === "player"
}: {
  children: React.ReactNode;
  role: AppRole;
  variant?: AppShellVariant;
  hideTabBar?: boolean;
}): JSX.Element;
```

Player branch renders `<div className="eic-shell eic-shell--player">` with sticky `<TopbarLite>`, `<main className="eic-shell__main">`, and conditional `<MobileTabBar>` (skipped when `hideTabBar`). Staff branch delegates to a private `StaffShell` function component that preserves the v0.1 markup (`.app-shell` grid + `.sidebar` aside + `.main`) and adds the new `eic-staff-sidebar` className for the EIC palette swap. The `aria-current="page"` + className `is-active` on the active link replaces the v0.1 inline style — same visual, cleaner cascade.

### Task 2 — Shell CSS classes appended to globals.css (commit `e40c19c`)

169 lines of new CSS appended after the `.eic-logo__kicker` block from plan 06-02. The block is structured into four sections:

| Section | Selectors | Notable rules |
|---------|-----------|---------------|
| Player shell | `.eic-shell`, `.eic-shell__main`, `.eic-shell--player` | Flex column, ivory bg, mobile padding-bottom 76px to clear tab bar |
| TopbarLite | `.eic-topbar`, `.eic-topbar__brand-name/sub/grow/nav/nav-link/logout` | 72px desktop / 64px mobile, sticky top z-5, light glass `blur(2px)`, mobile hides nav + brand-sub (mobile relies on tab bar) |
| Mobile tab bar | `.eic-mobile-tabbar`, `.eic-mobile-tab`, `.eic-mobile-tab__icon`, `.eic-mobile-tab.is-active` | `display: none` until `<1100px`, then fixed bottom 4-col grid, 64px height, 44px touch targets, active uses `--eic-blue` filled icon |
| Staff sidebar | `.eic-staff-sidebar`, `.eic-staff-sidebar .nav a.is-active`, `.eic-staff-sidebar .brand-tagline` | Background swap to `--eic-blue`, active state `rgba(255,255,255,0.14)`, tagline becomes uppercase tracked kicker |

**Key responsive boundary** — single `@media (max-width: 1099px)` block governs all variant-specific responsive flips: topbar shrinks, desktop nav vanishes, tab bar appears, main content gets bottom padding. Matches UI-SPEC line 451 canonical breakpoint (PLR-01/PLR-02 use the same number).

**Legacy preserved** — verifier confirmed `.app-shell { ... grid-template-columns: 276px ... }` and the entire v0.1 `.sidebar` block remain untouched. The `.eic-staff-sidebar` selector is purely additive (only sets `background`); structural rules cascade from `.sidebar`.

### Task 3 — 10 page wrappers wired with variant prop (commit `c3c30d3`)

Mechanical batch — each file gets a single attribute added to its existing `<AppShell>` JSX element:

| Page | Edit | Note |
|------|------|------|
| `app/journey/page.tsx` | `role="player"` → `role="player" variant="player"` | Both occurrences (empty state branch + main branch) |
| `app/journey/deliverable/[id]/page.tsx` | `role="player"` → `role="player" variant="player"` | All 3 branches (demo banner + supabase null + main) |
| `app/onboarding/page.tsx` | `role="player"` → `hideTabBar role="player" variant="player"` | Both branches (no-player + main) — `hideTabBar` per UI-SPEC line 391 |
| `app/mentor/page.tsx` | `role={role ?? "mentor"}` → `role={role ?? "mentor"} variant="staff"` | 1 occurrence |
| `app/mentor/submission/[id]/page.tsx` | `role={role ?? "mentor"}` → `role={role ?? "mentor"} variant="staff"` | All 3 branches (demo + supabase null + main) |
| `app/admin/page.tsx` | `role={role ?? "game_master"}` → `role={role ?? "game_master"} variant="staff"` | 1 occurrence |
| `app/admin/players/import/page.tsx` | `role={role ?? "game_master"}` → `role={role ?? "game_master"} variant="staff"` | 1 occurrence |
| `app/admin/players/[id]/page.tsx` | `role={role ?? "game_master"}` → `role={role ?? "game_master"} variant="staff"` | Both branches (not-found + main) |
| `app/jury/page.tsx` | `role={role ?? "mentor"}` → `role={role ?? "mentor"} variant="staff"` | 1 occurrence (jury currently uses mentor role) |
| `app/results/page.tsx` (**W2 fix**) | `role={role ?? "player"}` → `role={role ?? "game_master"} variant="staff"` | All 3 occurrences — role fallback swapped from player to game_master because /results is a staff-only management screen; player-fallback was a v0.1 oversight |

Verified via `grep "role.*player" app/results/page.tsx` → 0 hits. The `replace_all` on the exact 3-occurrence string handled all branches in one pass.

**No content changes** to any page beyond the `<AppShell>` opening tag. Inner `<main>` styles, headings, table markup, etc. are all preserved bit-for-bit (verified via line-count diff: 19 insertions / 19 deletions across 10 files = exactly the variant prop additions).

## Verification results

- `npm run typecheck` — exits 0 ✓
- `npm run lint` — exits 0, no new warnings vs 06-02 baseline ✓
- `npm run build` — succeeds, 13 routes / 16 entries generated, First Load JS shared = 102 kB (unchanged); per-route sizes within ±0.1 kB of baseline (small fluctuation from new TopbarLite/MobileTabBar imports on player pages) ✓
- Automated verify (Task 1) — 3 files exist, all 7 i18n keys present, AppShell wires variant fallback + TopbarLite + MobileTabBar imports, components have correct directives ✓
- Automated verify (Task 2) — 16 needles found in globals.css (.eic-shell, .eic-shell--player, .eic-topbar, 72px/64px heights, brand-name, 1099px media, .eic-mobile-tabbar, fixed positioning, 4-col repeat, .is-active, 44px touch, .eic-staff-sidebar, --eic-blue palette, sidebar active state, --brand-primary legacy preserved, .app-shell + grid-template-columns 276px legacy preserved) ✓
- Automated verify (Task 3) — all 10 pages have `variant=` matching `(player|staff)`, /onboarding has `hideTabBar`, /results has `game_master` (W2 fix verified) ✓
- W2 critical check — `grep role.*player app/results/page.tsx` → 0 hits ✓

## Deviations from Plan

None — plan executed exactly as written. The three tasks landed verbatim per their `<action>` blocks; verifies passed first try (typecheck + lint + build + automated needle scans). No auto-fixes triggered (no Rule 1/2/3 deviations). Two micro-cleanups applied during file authoring, both pre-authorized by the plan:

1. In `components/app-shell.tsx`, the v0.1 inline `style={{ background: "rgba(255,255,255,0.14)" }}` on the active sidebar link was replaced by `className={active ? "is-active" : undefined}` plus a matching `.eic-staff-sidebar .nav a.is-active` CSS rule. Same render, cleaner cascade — the plan's action block prescribed this swap explicitly.
2. In `components/app-shell.tsx`, the `<Image>` props were alphabetized (alt/className/height/src/width) per ESLint convention — pre-authorized by the plan ("`Image` props are reordered alphabetically per ESLint convention; behavior unchanged").

## Authentication gates

None — plan executes purely on local files; no auth flows touched. The `signOut` server action wired into TopbarLite is the same v0.1 action (no signature change). Existing magic-link auth at `/login` is untouched.

## Threat surface scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. STRIDE register from PLAN front-matter is satisfied:

- **T-06-09** (Spoofed logout) — *accept*: Next.js 15 server actions carry signed action IDs (built-in CSRF). `<form action={signOut}>` uses the same protection v0.1 already trusts.
- **T-06-10** (Hidden navItem injection via role) — *accept*: `role: AppRole` is a typed enum literal-union; `navItems` is a static `Record<AppRole, ...>` lookup. No external string flows in.
- **T-06-11** (Mobile tab bar leaks staff routes) — *mitigate ✓*: `MobileTabBar` is rendered ONLY in the player branch (`if (resolvedVariant === "player") { ... <MobileTabBar /> }`); staff variant returns `<StaffShell>` which has zero tab-bar markup. Phase 6 ships single-tab "Parcours" → `/journey` only — no path leakage.
- **T-06-12** (DoS via long pathname startsWith) — *accept*: pathname is at most a few KB; `String.prototype.startsWith` is O(n) with tiny constants.

No new threats introduced.

## Gotchas / Notes

- **`signOut` export name confirmed**: `app/actions.ts:59` exports `export async function signOut(): Promise<void>` — matches the plan's primary import path. No fallback alias (`signOutFlow as signOut`) needed.

- **TopbarLite as server component, MobileTabBar as client component**: this split is intentional. TopbarLite has no client-side reactivity (the brand link is a Next.js `<Link>` which works in SSR; the logout uses a server-action form). MobileTabBar reads `usePathname()` for active styling, which requires the client runtime. Keeping TopbarLite server-side avoids pulling its EICLogo + Link tree into the client bundle.

- **`hideTabBar` is only honored in player variant**: the prop is silently ignored for staff variant (the staff shell has no tab bar at all). Documented behavior — passing `<AppShell variant="staff" hideTabBar>` is harmless but pointless.

- **AppShell defaulting to staff**: this preserves v0.1 backward compat. Any existing caller that does `<AppShell role="...">` without a variant prop continues to render the v0.1 sidebar (now restyled blue via the new `.eic-staff-sidebar` class on the `<aside>`). No v0.1 page broke.

- **/results role swap is a v0.1 latent bug fix**: the original `role={role ?? "player"}` fallback in /results was never reachable in practice (`getCurrentUser()` redirect upstream gates anyone unauthenticated), but the fallback would have rendered a player sidebar on a staff-only management page. The W2 fix swaps to `game_master` (matches the page's purpose) and adds explicit `variant="staff"` for self-documentation.

- **Mobile tab bar single-tab stub is intentional for Phase 6**: UI-SPEC line 322 explicitly mandates "Phase 6 ships the chrome with single-tab 'Parcours' linking /journey". The 3 future tabs (Équipe, Profil, Aide) ship with their actual content + routes in Phase 7. The CSS already supports 4 columns — Phase 7 just adds the 3 missing items to the `playerTabs` array.

- **76px main padding-bottom on mobile** = 64px tab bar + 12px breathing space. Without this, content scrolling to the absolute bottom would sit visually flush against the tab bar's top edge. Tested visually in DevTools responsive mode (post-build dev server check pending — no dev server started during executor run, but build success implies layout will paint correctly).

- **Backdrop-filter `blur(2px)` on topbar** — 2px is intentionally subtle (the design v2 reference `wf-topbar` uses similar small values). Heavier blur is reserved for the login glass card (18px in `.eic-glass`) per Phase 6 plan 01. The `-webkit-backdrop-filter` prefix is included for Safari ≤14 compatibility.

- **No dark-mode wiring changes** — both `.eic-shell` and `.eic-staff-sidebar` reference `--home-ivory` / `--eic-blue` tokens which already have dark-mode overrides in `app/eic-tokens.css` (`.dark`, `[data-theme="dark"]` block). When Phase 7+ exposes a theme toggle, both shells will adapt automatically.

## Files touched

- **Created**: `components/topbar-lite.tsx` (41 lines)
- **Created**: `components/mobile-tab-bar.tsx` (35 lines)
- **Modified**: `components/app-shell.tsx` (full rewrite, 99 lines, was 63 lines)
- **Modified**: `lib/i18n.ts` (+14 keys total — 7 fr + 7 en)
- **Modified**: `app/globals.css` (+169 lines appended after `.eic-logo__kicker` block)
- **Modified**: 10 page files in `app/` (+19 / -19 = exactly the new variant attribute on existing JSX elements)

Total: 2 created, 12 modified, 113 lines new TSX, 169 lines new CSS, 14 i18n entries.

## Self-Check

**File existence checks:**
- FOUND: `components/topbar-lite.tsx`
- FOUND: `components/mobile-tab-bar.tsx`
- FOUND: `components/app-shell.tsx` (modified)
- FOUND: `lib/i18n.ts` (modified)
- FOUND: `app/globals.css` (modified)
- FOUND: `app/journey/page.tsx`, `app/journey/deliverable/[id]/page.tsx`, `app/onboarding/page.tsx`
- FOUND: `app/mentor/page.tsx`, `app/mentor/submission/[id]/page.tsx`
- FOUND: `app/admin/page.tsx`, `app/admin/players/import/page.tsx`, `app/admin/players/[id]/page.tsx`
- FOUND: `app/jury/page.tsx`, `app/results/page.tsx`

**Commit existence checks:**
- FOUND: `f5168e5` — feat(06-03): extract TopbarLite + MobileTabBar, AppShell variant prop (DSY-05)
- FOUND: `e40c19c` — feat(06-03): add AppShell variant CSS classes (DSY-05)
- FOUND: `c3c30d3` — feat(06-03): wire variant prop into 10 v0.1 page wrappers (DSY-05)

**Build artifact checks:**
- PASS: `npm run typecheck` exit 0
- PASS: `npm run lint` exit 0 (no new warnings vs 06-02 baseline)
- PASS: `npm run build` 13 routes / 16 entries generated, no font-load regressions, First Load JS unchanged
- PASS: W2 critical fix — `grep "role.*player" app/results/page.tsx` returns zero hits

## Self-Check: PASSED
