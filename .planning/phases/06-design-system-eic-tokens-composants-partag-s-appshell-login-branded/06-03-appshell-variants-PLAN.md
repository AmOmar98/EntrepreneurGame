---
phase: 06
plan: 03
type: execute
wave: 3
depends_on: [06-01, 06-02]
files_modified:
  - components/app-shell.tsx
  - components/topbar-lite.tsx
  - components/mobile-tab-bar.tsx
  - app/globals.css
  - lib/i18n.ts
  - app/journey/page.tsx
  - app/journey/deliverable/[id]/page.tsx
  - app/onboarding/page.tsx
  - app/mentor/page.tsx
  - app/mentor/submission/[id]/page.tsx
  - app/admin/page.tsx
  - app/admin/players/import/page.tsx
  - app/admin/players/[id]/page.tsx
  - app/jury/page.tsx
  - app/results/page.tsx
autonomous: true
requirements: [DSY-05]
must_haves:
  truths:
    - "Player route /journey rendered with variant=\"player\" shows TopbarLite (no sidebar) on desktop and bottom tab bar on viewport <1100px"
    - "Staff route /admin rendered with variant=\"staff\" shows the existing sidebar restyled with --eic-blue background"
    - "/onboarding renders variant=\"player\" with hideTabBar=true (topbar visible, no bottom bar)"
    - "Existing v0.1 sidebar at /mentor, /jury, /results renders without runtime error and with --eic-blue (not --brand-primary) background"
    - "Default AppShell variant when prop is omitted = \"staff\" (preserves backward compat)"
  artifacts:
    - path: "components/app-shell.tsx"
      provides: "AppShell accepting role + variant=\"player\"|\"staff\" + hideTabBar prop, switches shell layout"
      exports: ["AppShell", "AppRole"]
    - path: "components/topbar-lite.tsx"
      provides: "Player-only horizontal topbar with EICLogo + brand text + nav links + logout"
      exports: ["TopbarLite"]
    - path: "components/mobile-tab-bar.tsx"
      provides: "Player-only fixed bottom tab bar (visible <1100px)"
      exports: ["MobileTabBar"]
    - path: "app/globals.css"
      provides: ".eic-shell, .eic-topbar, .eic-mobile-tabbar, .eic-staff-sidebar restyle classes"
      contains: "background: var(--eic-blue)"
  key_links:
    - from: "app/journey/page.tsx and other player pages"
      to: "<AppShell variant=\"player\">"
      via: "JSX prop"
      pattern: "variant=\"player\""
    - from: "app/mentor/page.tsx + admin/jury/results pages"
      to: "<AppShell variant=\"staff\"> or default"
      via: "JSX prop"
      pattern: "variant=\"staff\"|<AppShell role=\"(mentor|game_master)\""
    - from: "components/topbar-lite.tsx"
      to: "components/ui (EICLogo + Pill)"
      via: "named import from @/components/ui"
      pattern: "from \"@/components/ui\""
---

<objective>
Refactor `<AppShell>` pour distinguer Player (TopbarLite + bottom tab bar mobile, sidebar dark green retirée) et Staff (sidebar conservée mais restylée tokens EIC). Crée `<TopbarLite>` et `<MobileTabBar>` extraits, ajoute classes CSS dédiées. Modifie le `<AppShell>` calling-site dans toutes les pages v0.1 pour passer le `variant` correct (player pour /journey + /onboarding, staff pour /mentor + /admin + /jury + /results).

Purpose: DSY-05 (séparation visuelle Player vs Staff selon design v2). Player ne voit plus de sidebar dark green ; Staff garde la sidebar mais en `--eic-blue` au lieu de `--brand-primary`.
Output: 2 nouveaux composants extraits + AppShell étendu avec `variant` + 2 nouvelles clés i18n + CSS shell + 10 fichiers de pages mis à jour pour passer le variant.

**Scope strict :** zéro changement de contenu de page. Seul le wrapper `<AppShell>` change (et reçoit un nouveau prop). Le journey content refactor = Phase 7 ; le admin live mode = Phase 9.
</objective>

<shell_note>
**Active host shell is PowerShell on Windows.** All `automated` verify commands (the verify blocks shown below) in this plan use the pattern `node -e '<JS body with double-quoted strings>'`. Single-quote wrapping survives PowerShell unchanged, and internal JS strings use double quotes (no escaping). Do NOT introduce backslash-escaped quotes in verify scripts — they break under PowerShell argument parsing.

**Plan-level note (W5) — Task 3 mechanical batch is intentional:** Task 3 modifies 10 page-wrapper files but each edit is mechanical (1-line addition of `variant="player|staff"` plus optional `hideTabBar`). The batch is intentionally kept in a single task to avoid splitting trivial mechanical edits across multiple plans, which would inflate the plan count without adding value. The 15-files-modified count for this plan is acknowledged as above the standard warning threshold but accepted given the mechanical nature of Task 3 (no logic, no per-file judgment calls).
</shell_note>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-CONTEXT.md
@.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md
@.planning/design-v2/project/player-screens.jsx
@.planning/design-v2/project/admin-screens.jsx
@app/globals.css
@components/app-shell.tsx
@lib/i18n.ts

<interfaces>
<!-- Existing AppShell signature (current — components/app-shell.tsx) -->
```ts
export type AppRole = "player" | "mentor" | "game_master";

export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: AppRole;
}): JSX.Element;
```

<!-- New AppShell signature (target) -->
```ts
export type AppRole = "player" | "mentor" | "game_master";
export type AppShellVariant = "player" | "staff";

export function AppShell({
  children,
  role,
  variant,        // NEW — defaults to "staff" if omitted
  hideTabBar,     // NEW — only meaningful when variant="player" (used by /onboarding)
}: {
  children: React.ReactNode;
  role: AppRole;
  variant?: AppShellVariant;
  hideTabBar?: boolean;
}): JSX.Element;
```

<!-- TopbarLite reference signature -->
```ts
export function TopbarLite({
  navItems,        // [{href, label}] from AppShell, filtered by role
  brandName,       // "Entrepreneur Game" from i18n
  brandSubtitle,   // "Hack-Days · EIC" from i18n
  logoutLabel,     // "Se déconnecter" from i18n
}: {
  navItems: { href: string; label: string }[];
  brandName: string;
  brandSubtitle: string;
  logoutLabel: string;
}): JSX.Element;
```

<!-- MobileTabBar reference signature -->
```ts
export function MobileTabBar({
  items,    // [{ href, label, key }]
}: {
  items: { href: string; label: string; key: string }[];
}): JSX.Element;
```

<!-- Existing v0.1 page wrapper pattern (e.g., app/journey/page.tsx today) -->
```tsx
// Most pages today look like:
import { AppShell } from "@/components/app-shell";
// ...
return (
  <AppShell role="player">
    {/* page content */}
  </AppShell>
);
```

<!-- Reference: design-v2 TopbarLite jsx (player-screens.jsx lines 68-84) -->
// Brand mark + brand name (Baskervville) + brand subtitle ("Hack-Days 26" uppercase tracked)
// flex grow gap
// status pill + amber pill ("Mentor disponible") + avatar circle 30x30 with initials

<!-- Reference: design-v2 sidebar jsx (admin-screens.jsx) — preserve existing structure but restyle background -->

<!-- Existing CSS .app-shell + .sidebar in app/globals.css (lines 68-185 approx) — DO NOT modify, only ADD new classes -->
```css
.app-shell {
  display: grid;
  grid-template-columns: 276px minmax(0, 1fr);
  min-height: 100vh;
}
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 22px 18px;
  background: var(--brand-primary);  /* << this stays for legacy callers; staff variant uses .eic-staff-sidebar instead */
  color: #eef2f8;
  /* ... */
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extract TopbarLite + MobileTabBar + extend AppShell with variant prop + i18n keys</name>
  <read_first>
    - components/app-shell.tsx (current full file — 63 lines, "use client", uses dictionaries.fr)
    - .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md (Layout Inventory section, lines 304-345 — TopbarLite + tab bar contract; lines 326-330 — staff sidebar contract)
    - .planning/design-v2/project/player-screens.jsx (lines 60-84 — TopbarLite reference, structure, padding 18px 28px)
    - lib/i18n.ts (verify which keys already exist: brand_name, brand_tagline_short, nav_player_journey, nav_mentor_evaluations, nav_game_master_admin, nav_game_master_import all exist; nav_logout, nav_player_team, brand_subtitle, mobile_tab_journey, mobile_tab_team, mobile_tab_profile, mobile_tab_help do NOT exist)
    - app/actions.ts (find signOut export — TopbarLite logout button calls a server action; verify it's exported)
    - components/ui/index.ts (created by plan 06-02 — confirms EICLogo + Pill available)
  </read_first>
  <files>components/app-shell.tsx, components/topbar-lite.tsx, components/mobile-tab-bar.tsx, lib/i18n.ts</files>
  <action>
**Part A — `lib/i18n.ts`:** Add the following keys to BOTH `fr` and `en` dictionaries (insert near the existing `nav_*` keys to keep grouping). Existing keys preserved verbatim.

In `fr`:
```
brand_subtitle: "Hack-Days · EIC",
nav_logout: "Se déconnecter",
nav_player_team: "Mon équipe",
mobile_tab_journey: "Parcours",
mobile_tab_team: "Équipe",
mobile_tab_profile: "Profil",
mobile_tab_help: "Aide",
```

In `en`:
```
brand_subtitle: "Hack-Days · EIC",
nav_logout: "Sign out",
nav_player_team: "My team",
mobile_tab_journey: "Journey",
mobile_tab_team: "Team",
mobile_tab_profile: "Profile",
mobile_tab_help: "Help",
```

**Part B — Create `components/topbar-lite.tsx`** (server component — no hooks, accepts pre-resolved labels as props):

```tsx
import Link from "next/link";
import { signOut } from "@/app/actions";
import { EICLogo } from "@/components/ui";

export type TopbarLiteProps = {
  navItems: { href: string; label: string }[];
  brandName: string;
  brandSubtitle: string;
  logoutLabel: string;
};

export function TopbarLite({ navItems, brandName, brandSubtitle, logoutLabel }: TopbarLiteProps) {
  return (
    <header className="eic-topbar" role="banner">
      <Link aria-label={brandName} className="eic-topbar__brand" href="/journey">
        <EICLogo />
      </Link>
      <span className="eic-topbar__brand-text">
        <span className="eic-topbar__brand-name">{brandName}</span>
        <span className="eic-topbar__brand-sub">{brandSubtitle}</span>
      </span>
      <span className="eic-topbar__grow" />
      <nav aria-label="Primary navigation" className="eic-topbar__nav">
        {navItems.map((item) => (
          <Link className="eic-topbar__nav-link" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      <form action={signOut} className="eic-topbar__logout-form">
        <button className="eic-topbar__logout" type="submit">
          {logoutLabel}
        </button>
      </form>
    </header>
  );
}
```

Note: `Link` to `/journey` for the brand makes the logo a "home" anchor for the player. Logout is a `<form action={signOut}>` — `signOut` is the existing `app/actions.ts` server action (verify export name exists; if it's `signOutFlow`, use that instead). Path-alias `@/app/actions` is fine. NO `"use client"` — this is a server component because `signOut` is a server action and `Link` works in SSR.

**Part C — Create `components/mobile-tab-bar.tsx`** (client component because it uses `usePathname` for active state):

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type MobileTabBarItem = { href: string; label: string; key: string };

export type MobileTabBarProps = {
  items: MobileTabBarItem[];
};

export function MobileTabBar({ items }: MobileTabBarProps) {
  const pathname = usePathname();
  return (
    <nav aria-label="Mobile primary" className="eic-mobile-tabbar">
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "eic-mobile-tab is-active" : "eic-mobile-tab"}
            href={item.href}
            key={item.key}
          >
            <span aria-hidden="true" className="eic-mobile-tab__icon">·</span>
            <span className="eic-mobile-tab__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

The icon is a placeholder `·` for Phase 6 — UI-SPEC line 322 says "Phase 6 ships the chrome with single-tab 'Parcours' linking /journey". Real icons (lucide) come in Phase 7 when the journey content is refactored. Keeping `<span>·</span>` keeps Phase 6 isolated. The `is-active` class is consumed by CSS in Task 2.

**Part D — Refactor `components/app-shell.tsx`** to accept `variant` and `hideTabBar`. Default variant = `staff` (preserves v0.1 callers that don't pass it). Replace the entire current file:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dictionaries } from "@/lib/i18n";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { TopbarLite } from "@/components/topbar-lite";

const t = dictionaries.fr;

export type AppRole = "player" | "mentor" | "game_master";
export type AppShellVariant = "player" | "staff";

const navItems: Record<AppRole, { href: string; label: string }[]> = {
  player: [{ href: "/journey", label: t.nav_player_journey }],
  mentor: [{ href: "/mentor", label: t.nav_mentor_evaluations }],
  game_master: [
    { href: "/admin", label: t.nav_game_master_admin },
    { href: "/admin/players/import", label: t.nav_game_master_import },
  ],
};

const playerTabs = [
  { href: "/journey", label: t.mobile_tab_journey, key: "journey" },
];

export function AppShell({
  children,
  role,
  variant,
  hideTabBar,
}: {
  children: React.ReactNode;
  role: AppRole;
  variant?: AppShellVariant;
  hideTabBar?: boolean;
}) {
  const resolvedVariant: AppShellVariant = variant ?? "staff";
  const items = navItems[role];

  if (resolvedVariant === "player") {
    return (
      <div className="eic-shell eic-shell--player">
        <TopbarLite
          brandName={t.brand_name}
          brandSubtitle={t.brand_subtitle}
          logoutLabel={t.nav_logout}
          navItems={items}
        />
        <main className="eic-shell__main">{children}</main>
        {hideTabBar ? null : <MobileTabBar items={playerTabs} />}
      </div>
    );
  }

  // staff variant — restyled sidebar
  return <StaffShell items={items}>{children}</StaffShell>;
}

function StaffShell({
  children,
  items,
}: {
  children: React.ReactNode;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside aria-label="Primary navigation" className="sidebar eic-staff-sidebar">
        <div className="brand">
          <Image
            alt="EIC - UEMF"
            className="brand-logo"
            height={40}
            src="/brand/logo-eic.svg"
            width={160}
          />
          <span className="brand-tagline">{t.brand_tagline_short}</span>
        </div>
        <nav className="nav">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "is-active" : undefined}
                href={item.href}
                key={item.href}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
```

Key changes vs v0.1:
- Adds `variant?: AppShellVariant` and `hideTabBar?: boolean` props
- Defaults `variant` to `"staff"` so existing pages with `<AppShell role="...">` and NO variant prop continue to work (DSY-05 backward compat)
- Player variant: wraps content in `eic-shell` shell with `<TopbarLite>` + main + optional `<MobileTabBar>`
- Staff variant: KEEPS the existing `.app-shell` + `.sidebar` markup but adds class `eic-staff-sidebar` for the new EIC palette (palette swap done by CSS in Task 2)
- Replaces inline `style={...}` for active link with className `is-active` (cleaner; CSS will apply background)
- All v0.1 callers without `variant` prop fall through to staff variant — no breakage

The `Image` props are reordered alphabetically per ESLint convention; behavior unchanged.

**Verify** the existing `app/actions.ts` exports `signOut`. If it exports `signOutFlow` only, change `import { signOut }` → `import { signOutFlow as signOut }` in `topbar-lite.tsx`.

**Note (W4) — signOut has no pending UI possible:** `signOut` is a void server action with `redirect("/login")` (fire-and-redirect, no `useActionState` lifecycle and no `FormData` payload). Use a plain `<form action={signOut}><button type="submit" className="eic-topbar__logout">{logoutLabel}</button></form>` — do NOT attempt to read `isPending` or render a "logging out…" state. The redirect happens server-side; any client-side pending UI would race with the navigation. Acceptable for Phase 6.
  </action>
  <verify>
    <automated>node -e 'const fs=require("fs"); for(const f of ["components/app-shell.tsx","components/topbar-lite.tsx","components/mobile-tab-bar.tsx"]){if(!fs.existsSync(f)){console.error("MISSING: "+f); process.exit(1);}} const shell=fs.readFileSync("components/app-shell.tsx","utf8"); const hasResolved=shell.includes("resolvedVariant ?? \"staff\"") || shell.includes("variant ?? \"staff\""); const ok=shell.includes("AppShellVariant") && shell.includes("variant?: AppShellVariant") && shell.includes("hideTabBar") && shell.includes("TopbarLite") && shell.includes("MobileTabBar") && shell.includes("eic-shell--player") && shell.includes("eic-staff-sidebar") && hasResolved; if(!ok){console.error("app-shell.tsx missing required wiring (resolvedVariant fallback or other) per W1 fix"); process.exit(1);} const tb=fs.readFileSync("components/topbar-lite.tsx","utf8"); if(!tb.includes("EICLogo") || !tb.includes("signOut") || !tb.includes("eic-topbar")){console.error("topbar-lite missing"); process.exit(1);} const mb=fs.readFileSync("components/mobile-tab-bar.tsx","utf8"); if(!mb.includes("use client") || !mb.includes("usePathname") || !mb.includes("eic-mobile-tabbar")){console.error("mobile-tab-bar missing"); process.exit(1);} const i18n=fs.readFileSync("lib/i18n.ts","utf8"); for(const k of ["brand_subtitle","nav_logout","mobile_tab_journey"]){if(!i18n.includes(k+":")){console.error("i18n missing: "+k); process.exit(1);}} console.log("OK");' && npm run typecheck</automated>
  </verify>
  <acceptance_criteria>
    - `components/app-shell.tsx` exports `AppShell` and `type AppRole` and `type AppShellVariant`
    - Adds optional props `variant?: AppShellVariant` and `hideTabBar?: boolean` (default variant resolves to `"staff"`)
    - Imports `TopbarLite` from `./topbar-lite` and `MobileTabBar` from `./mobile-tab-bar`
    - Player branch renders `<TopbarLite>` + `<main className="eic-shell__main">` + optional `<MobileTabBar>` (skipped when `hideTabBar`)
    - Staff branch renders existing `.app-shell` + `.sidebar` structure with ADDED class `eic-staff-sidebar` on the aside
    - `components/topbar-lite.tsx` exists, imports `EICLogo` from `@/components/ui` and `signOut` from `@/app/actions`, contains class `eic-topbar`
    - `components/mobile-tab-bar.tsx` exists, has `"use client"`, uses `usePathname()`, contains class `eic-mobile-tabbar`
    - `lib/i18n.ts` adds keys `brand_subtitle`, `nav_logout`, `nav_player_team`, `mobile_tab_journey`, `mobile_tab_team`, `mobile_tab_profile`, `mobile_tab_help` in BOTH `fr` and `en`
    - `npm run typecheck` exits 0
    - All 3 component files use named exports (no `export default`)
  </acceptance_criteria>
  <done>AppShell accepts variant prop with player/staff branches; TopbarLite + MobileTabBar extracted; i18n updated; backward compat preserved.</done>
</task>

<task type="auto">
  <name>Task 2: Append shell CSS classes (.eic-shell, .eic-topbar, .eic-mobile-tabbar, .eic-staff-sidebar) to app/globals.css</name>
  <read_first>
    - app/globals.css (full file — already has plan 06-01 .eic-glass + plan 06-02 primitives appended at the bottom; APPEND further below)
    - .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md (Layout Inventory section lines 304-345 — TopbarLite + tab bar + sidebar specs; Responsive Breakpoints lines 449-456 — 1100px canonical)
    - .planning/design-v2/project/wf-base.css (lines 155-179 = .wf-topbar / .wf-brand-mark; lines 258-276 = .wf-mobile-tabbar / .wf-mobile-tab; lines 181-199 = .wf-side reference)
    - app/eic-tokens.css (verify --eic-blue, --home-border, --wf-paper, --wf-line, --wf-ink-faint declared)
  </read_first>
  <files>app/globals.css</files>
  <action>
APPEND to the bottom of `app/globals.css` (after the `.eic-logo__kicker` block from plan 06-02). Add this CSS block:

```css

/* ==========================================================================
   EIC Design v2 — AppShell variants (DSY-05)
   Player: .eic-shell + .eic-topbar + .eic-mobile-tabbar
   Staff:  .eic-staff-sidebar (overrides .sidebar background to use --eic-blue)
   ========================================================================== */

/* === Player shell === */
.eic-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--home-ivory);
  color: var(--home-ink);
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
}
.eic-shell__main {
  flex: 1 1 auto;
  display: block;
  position: relative;
}
.eic-shell--player .eic-shell__main {
  /* Bottom padding ensures content not occluded by fixed mobile tab bar */
  padding-bottom: 0;
}
@media (max-width: 1099px) {
  .eic-shell--player .eic-shell__main { padding-bottom: 76px; }
}

/* === TopbarLite === */
.eic-topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 28px;
  height: 72px;
  background: rgba(255, 255, 255, 0.6);
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  border-bottom: 1px solid var(--home-border);
  position: sticky;
  top: 0;
  z-index: 5;
}
.eic-topbar__brand { display: inline-flex; align-items: center; text-decoration: none; }
.eic-topbar__brand-text {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1;
}
.eic-topbar__brand-name {
  font-family: var(--font-heading), Baskervville, Georgia, serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--home-ink);
}
.eic-topbar__brand-sub {
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--wf-ink-soft);
}
.eic-topbar__grow { flex: 1 1 auto; }
.eic-topbar__nav {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.eic-topbar__nav-link {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--home-ink);
  text-decoration: none;
}
.eic-topbar__nav-link:hover { color: var(--eic-blue); background: rgba(27, 58, 92, 0.06); }
.eic-topbar__nav-link:focus-visible { outline: 3px solid rgba(27, 58, 92, 0.22); outline-offset: 0; }
.eic-topbar__logout-form { margin: 0; }
.eic-topbar__logout {
  min-height: 40px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--home-border-strong);
  background: transparent;
  color: var(--home-ink);
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.eic-topbar__logout:hover { box-shadow: var(--shadow-hover); }
.eic-topbar__logout:focus-visible { outline: 3px solid rgba(27, 58, 92, 0.22); outline-offset: 0; }

@media (max-width: 1099px) {
  .eic-topbar { height: 64px; padding: 12px 18px; gap: 10px; }
  .eic-topbar__nav { display: none; } /* nav lives in bottom tab bar on mobile */
  .eic-topbar__brand-sub { display: none; }
}

/* === Mobile tab bar (player only) === */
.eic-mobile-tabbar {
  display: none;
}
@media (max-width: 1099px) {
  .eic-mobile-tabbar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    padding: 6px 14px 14px;
    background: rgba(255, 255, 255, 0.96);
    border-top: 1px solid var(--home-border);
    z-index: 10;
  }
}
.eic-mobile-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 44px;
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  font-size: 11px;
  color: var(--wf-ink-faint);
  text-decoration: none;
}
.eic-mobile-tab__icon {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1.5px solid currentColor;
  font-size: 11px;
}
.eic-mobile-tab.is-active { color: var(--eic-blue); font-weight: 700; }
.eic-mobile-tab.is-active .eic-mobile-tab__icon {
  background: var(--eic-blue);
  color: #fff;
  border-color: var(--eic-blue);
}
.eic-mobile-tab:focus-visible { outline: 3px solid rgba(27, 58, 92, 0.22); outline-offset: 0; }

/* === Staff sidebar restyle (DSY-05) ===
   Overrides the .sidebar background only when the new .eic-staff-sidebar class is present.
   Existing .sidebar rules in this file (lines ~74-185) remain the structural baseline. */
.eic-staff-sidebar {
  background: var(--eic-blue);
}
.eic-staff-sidebar .nav a.is-active,
.eic-staff-sidebar .nav a[aria-current="page"] {
  background: rgba(255, 255, 255, 0.14);
}
.eic-staff-sidebar .brand-tagline {
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.78);
}
```

**Why these specific values:**
- `.eic-shell` is `display: flex; flex-direction: column` so TopbarLite (sticky top) + main (fills) + MobileTabBar (fixed bottom) can coexist. UI-SPEC line 311.
- TopbarLite height 72px desktop / 64px mobile per UI-SPEC lines 312, 318.
- Backdrop-filter `blur(2px)` on topbar — light glass effect per `.wf-topbar` reference (wf-base.css line 159).
- 1100px breakpoint matches UI-SPEC line 451 (canonical) — at <1100px the desktop nav vanishes and the bottom tab bar appears.
- Mobile main padding-bottom 76px = 64px tab bar + 12px breathing — content not occluded.
- Tab bar position fixed bottom, height 64px per UI-SPEC line 320.
- Tab bar items min-height 44px per UI-SPEC line 71 (touch target WCAG 2.5.5).
- Staff sidebar restyle: ONLY swaps background to `--eic-blue` (UI-SPEC line 328). All other v0.1 sidebar styles (.sidebar padding, position, color) inherit from the existing rule. The `.is-active` selector is added for the className-based active state set by the refactored AppShell.
- `.eic-staff-sidebar .nav a[aria-current="page"]` covers the case when v0.1 callers still set `aria-current` without `is-active` className — both work.

DO NOT modify the existing `.app-shell {`, `.sidebar {`, `.brand`, `.brand-logo`, `.brand-tagline`, `.nav`, `.main` rules in app/globals.css. They stay as-is and provide the structural baseline; `.eic-staff-sidebar` only ADDS the EIC palette layer on top.
  </action>
  <verify>
    <automated>node -e 'const c=require("fs").readFileSync("app/globals.css","utf8"); const checks=[[".eic-shell {","shell"],[".eic-shell--player","player branch"],[".eic-topbar {","topbar"],["height: 72px","topbar desktop height"],["height: 64px","topbar/tabbar mobile height"],[".eic-topbar__brand-name","brand text"],["@media (max-width: 1099px)","responsive 1100px"],[".eic-mobile-tabbar {","tabbar"],["position: fixed","tabbar fixed"],["repeat(4, 1fr)","4 columns"],[".eic-mobile-tab.is-active","active tab"],["min-height: 44px","touch target"],[".eic-staff-sidebar {","staff sidebar"],["background: var(--eic-blue)","staff palette swap"],[".eic-staff-sidebar .nav a.is-active","sidebar active state"],["--brand-primary","legacy preserved"]]; const failed=[]; for(const [needle,desc] of checks){if(!c.includes(needle)) failed.push(desc+": "+needle);} if(failed.length){console.error(failed.join("\n")); process.exit(1);} if(!c.includes(".app-shell {") || !c.includes("grid-template-columns: 276px")){console.error("legacy .app-shell rule was destroyed!"); process.exit(1);} console.log("OK");'</automated>
  </verify>
  <acceptance_criteria>
    - `app/globals.css` contains `.eic-shell {` with `display: flex` and `flex-direction: column`
    - Contains `.eic-topbar {` with `height: 72px` and `padding: 18px 28px`
    - Contains `.eic-topbar__brand-name { font-family: var(--font-heading)`
    - Contains `@media (max-width: 1099px)` block reducing topbar height to 64px AND showing the mobile tab bar
    - Contains `.eic-mobile-tabbar` with `position: fixed`, `bottom: 0`, `grid-template-columns: repeat(4, 1fr)`
    - Contains `.eic-mobile-tab { ... min-height: 44px` (touch target)
    - Contains `.eic-mobile-tab.is-active` with `color: var(--eic-blue)`
    - Contains `.eic-staff-sidebar { background: var(--eic-blue) }` (palette swap)
    - Contains `.eic-staff-sidebar .nav a.is-active` rule
    - STILL contains `.app-shell {` and `.sidebar {` legacy rules (untouched above)
    - STILL contains `.eic-glass {`, `.eic-button {`, `.eic-pill {`, `.eic-level-badge {`, `.eic-progress {`, `.eic-logo {` from plans 06-01 and 06-02
    - STILL contains `--brand-primary` legacy variable
  </acceptance_criteria>
  <done>Shell CSS classes appended to globals.css; legacy .app-shell + .sidebar untouched; staff sidebar gets EIC palette via additive .eic-staff-sidebar class.</done>
</task>

<task type="auto">
  <name>Task 3: Wire variant prop into all 10 v0.1 page wrappers (player vs staff)</name>
  <read_first>
    - app/journey/page.tsx (find the existing `<AppShell role="player">` line — must add variant="player")
    - app/journey/deliverable/[id]/page.tsx (same)
    - app/onboarding/page.tsx (must use variant="player" + hideTabBar)
    - app/mentor/page.tsx (currently `role="mentor"` — keep that, no variant needed since default = staff; OR add variant="staff" explicitly for self-documentation — Claude decides)
    - app/mentor/submission/[id]/page.tsx (same as /mentor)
    - app/admin/page.tsx (game_master role)
    - app/admin/players/import/page.tsx
    - app/admin/players/[id]/page.tsx
    - app/jury/page.tsx
    - app/results/page.tsx
    - components/app-shell.tsx (just created in Task 1 — confirm new prop signature)
  </read_first>
  <files>app/journey/page.tsx, app/journey/deliverable/[id]/page.tsx, app/onboarding/page.tsx, app/mentor/page.tsx, app/mentor/submission/[id]/page.tsx, app/admin/page.tsx, app/admin/players/import/page.tsx, app/admin/players/[id]/page.tsx, app/jury/page.tsx, app/results/page.tsx</files>
  <action>
For each of the 10 listed pages, find the `<AppShell role="..."` JSX element and modify it:

**Player pages (variant="player"):**
- `app/journey/page.tsx` → `<AppShell role="player" variant="player">`
- `app/journey/deliverable/[id]/page.tsx` → `<AppShell role="player" variant="player">`
- `app/onboarding/page.tsx` → `<AppShell role="player" variant="player" hideTabBar>` (per UI-SPEC line 391: "Topbar visible, tab bar hidden via prop hideTabBar")

**Staff pages (variant="staff" — explicit for self-documentation):**
- `app/mentor/page.tsx` → `<AppShell role="mentor" variant="staff">`
- `app/mentor/submission/[id]/page.tsx` → `<AppShell role="mentor" variant="staff">`
- `app/admin/page.tsx` → `<AppShell role="game_master" variant="staff">`
- `app/admin/players/import/page.tsx` → `<AppShell role="game_master" variant="staff">`
- `app/admin/players/[id]/page.tsx` → `<AppShell role="game_master" variant="staff">`
- `app/jury/page.tsx` → `<AppShell role="mentor" variant="staff">` (jury currently uses mentor role per existing code; verify)
- `app/results/page.tsx` → **CRITICAL (W2 fix):** the page currently uses `role={role ?? "player"}` in 3 occurrences. /results is a staff-only screen (results management). For each `<AppShell>` JSX element in this file, REPLACE `role={role ?? "player"}` with `role={role ?? "game_master"}` AND add `variant="staff"`. Do NOT keep the player fallback — if a player ever lands here without a role, they must see the staff sidebar (gated above by `getCurrentUser()` redirect). Final shape: `<AppShell role={role ?? "game_master"} variant="staff">` for all 3 occurrences

**Constraints (CRITICAL):**
- Do NOT modify any other line of these page files. ONLY add the `variant=` (and `hideTabBar` for /onboarding) attribute(s).
- If a page currently does NOT use `<AppShell>` (e.g., `app/login/page.tsx`, `app/page.tsx` redirects), do NOT add it.
- If a page uses a different role assertion (e.g., `<AppShell role="mentor">` for `/jury`), preserve the role exactly — only add the variant prop.
- If grep finds `<AppShell` with props on multiple lines, add `variant="player"` (or `"staff"`) on a new line aligned with the existing props.

For pages with conditional shells (e.g., `if (!hasSupabaseEnv()) return <DemoBanner />` followed by `return <AppShell ...>`), update only the `<AppShell>` JSX element.

Example transformations (illustrative — execute on each file by reading first then editing):

```diff
- <AppShell role="player">
+ <AppShell role="player" variant="player">

- <AppShell role="player">
+ <AppShell hideTabBar role="player" variant="player">
   {/* /onboarding only */}

- <AppShell role="game_master">
+ <AppShell role="game_master" variant="staff">
```

If `/jury/page.tsx` or `/results/page.tsx` currently does NOT wrap in `<AppShell>` (it might render a custom layout), DO NOT force-wrap. Just leave it. Run `grep -n "<AppShell" app/` to enumerate all sites — only those sites need the variant prop.
  </action>
  <verify>
    <automated>node -e 'const fs=require("fs"); const pages=["app/journey/page.tsx","app/journey/deliverable/[id]/page.tsx","app/onboarding/page.tsx","app/mentor/page.tsx","app/mentor/submission/[id]/page.tsx","app/admin/page.tsx","app/admin/players/import/page.tsx","app/admin/players/[id]/page.tsx","app/jury/page.tsx","app/results/page.tsx"]; const fail=[]; const re=/<AppShell[^>]*variant="(player|staff)"/; for(const p of pages){if(!fs.existsSync(p)) continue; const s=fs.readFileSync(p,"utf8"); if(!s.includes("<AppShell")) continue; if(!re.test(s)) fail.push(p+": missing variant prop on AppShell"); if(p.endsWith("onboarding/page.tsx") && !s.includes("hideTabBar")) fail.push(p+": onboarding missing hideTabBar"); if(p.endsWith("results/page.tsx") && !s.includes("game_master")) fail.push(p+": results page must use role=game_master per W2 fix");} if(fail.length){console.error(fail.join("\n")); process.exit(1);} console.log("OK");' && npm run typecheck && npm run build</automated>
  </verify>
  <acceptance_criteria>
    - All 10 listed pages (where they wrap `<AppShell>`) include either `variant="player"` or `variant="staff"` attribute
    - `app/journey/page.tsx`, `app/journey/deliverable/[id]/page.tsx` use `variant="player"`
    - `app/onboarding/page.tsx` uses `variant="player"` AND contains `hideTabBar` (boolean attribute)
    - `app/mentor/page.tsx`, `app/mentor/submission/[id]/page.tsx`, `app/admin/page.tsx`, `app/admin/players/import/page.tsx`, `app/admin/players/[id]/page.tsx` use `variant="staff"`
    - `app/jury/page.tsx` and `app/results/page.tsx` either use `variant="staff"` OR genuinely don't wrap `<AppShell>` (preserved as-is)
    - No page lost its `role=` attribute
    - No page content (other than the `<AppShell>` opening tag) was modified
    - `npm run typecheck` exits 0
    - `npm run build` succeeds
  </acceptance_criteria>
  <done>All 10 v0.1 pages explicitly declare their AppShell variant; player pages get TopbarLite + tab bar, staff pages keep sidebar in EIC palette; onboarding hides the tab bar.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Server action `signOut` invocation | TopbarLite uses `<form action={signOut}>` — Next.js handles CSRF token automatically for server actions. No untrusted input. |
| usePathname client component | Reads pathname from Next.js router. No user-controlled string injection. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-09 | Spoofing | Forged logout request | accept | Server actions in Next.js 15 carry built-in CSRF protection (signed action IDs). `signOut` is the same action used by v0.1 — no new attack surface. |
| T-06-10 | Tampering | Hidden navItem injection through role prop | accept | `role` is a typed enum (`AppRole`) defined in the component itself; `navItems` is a static lookup keyed by enum. No external string flows through. |
| T-06-11 | Information Disclosure | Mobile tab bar leaks navigation to unauthorized roles | mitigate | `MobileTabBar` is rendered ONLY in player variant. Staff routes keep sidebar (no leakage). Phase 6 ships single tab "Parcours" only. |
| T-06-12 | Denial of Service | usePathname startsWith over very long pathname | accept | Pathname is at most a few KB; no algorithmic risk. |
</threat_model>

<verification>
After all 3 tasks complete:

1. `npm run typecheck` → 0 errors
2. `npm run lint` → no NEW warnings
3. `npm run build` → succeeds; AppShell renders both variants without hydration mismatch
4. Manual: `npm run dev` and visit:
   - `/journey` → topbar at top, no sidebar; resize to <1100px → bottom tab bar visible
   - `/onboarding` → topbar at top, NO bottom tab bar even on mobile
   - `/admin` → existing sidebar restyled blue (`#1B3A5C`), not slate (`#0B2545`)
   - `/mentor` → same as /admin
5. Functional smoke (no logic changes): clicking the brand mark in TopbarLite navigates to `/journey`; logout button in TopbarLite signs out; sidebar nav links still work on staff pages
</verification>

<success_criteria>
- DSY-05 ✓: AppShell renders Player as TopbarLite + optional bottom tab bar; Staff as sidebar restyled with `--eic-blue`
- Backward compat: pages without `variant=` prop (if any remain) get the staff variant by default
- 7 new i18n keys added (`brand_subtitle`, `nav_logout`, `nav_player_team`, 4× mobile tab labels) in fr+en
- `/onboarding` topbar visible without tab bar (hideTabBar honored)
- v0.1 sidebar layout structurally preserved — only background palette changed via additive `.eic-staff-sidebar` class
- `npm run typecheck` + `npm run lint` + `npm run build` pass
</success_criteria>

<output>
After completion, create `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-03-SUMMARY.md` recording: AppShell new prop signature, variant routing decisions per route, 7 new i18n keys, the 1100px breakpoint behavior, gotchas (e.g., if signOut export name differs), tab bar single-tab Phase 6 stub status (4 tabs come in Phase 7).
</output>
