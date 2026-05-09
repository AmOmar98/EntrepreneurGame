---
phase: 06
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/eic-tokens.css
  - app/globals.css
  - app/layout.tsx
  - lib/i18n.ts
autonomous: true
requirements: [DSY-01, DSY-02, DSY-03]
must_haves:
  truths:
    - "Page that loads /login has CSS variables --eic-blue (#1B3A5C), --eic-green (#2E7D32), --home-ivory (#F6F1E8) defined and resolvable on :root"
    - "html element on every page exposes --font-heading (Baskervville) and --font-body (Montserrat) via next/font/google variables (no @import url to fonts.googleapis.com anywhere in source)"
    - "Surface using class .eic-glass renders blurred translucent in modern browsers and falls back to opaque white 92% when backdrop-filter unsupported"
    - "Existing v0.1 tokens (--brand-primary, --brand-accent, --green, --blue, --gold, --red, --bg, --surface, --line) remain defined in app/globals.css; v0.1 pages /journey, /mentor, /admin still load without runtime errors"
  artifacts:
    - path: "app/eic-tokens.css"
      provides: "EIC v2 design tokens (palette, gradients, radii, shadows, transitions, spacing, wf-* wireframe layer)"
      contains: "--eic-blue: #1B3A5C"
    - path: "app/globals.css"
      provides: "v0.1 legacy tokens preserved + new .eic-glass / .eic-glass-tint / .eic-glass-dark / .eic-aurora utility classes with @supports fallback"
      contains: "--brand-primary"
    - path: "app/layout.tsx"
      provides: "next/font/google Baskervville + Montserrat wired via CSS variables; eic-tokens.css imported alongside globals.css"
      exports: ["default", "metadata"]
    - path: "lib/i18n.ts"
      provides: "Login submitting copy key + login error keys + brand subtitle key (fr + en)"
      contains: "login_submitting"
  key_links:
    - from: "app/layout.tsx"
      to: "app/eic-tokens.css"
      via: "ES import"
      pattern: "import \"./eic-tokens.css\""
    - from: "app/layout.tsx"
      to: "next/font/google"
      via: "Baskervville + Montserrat constructors with variable option"
      pattern: "Baskervville\\s*\\(|Montserrat\\s*\\("
    - from: "<html>"
      to: "font CSS variables"
      via: "className composing baskervville.variable + montserrat.variable"
      pattern: "className=\\{`?\\$\\{baskervville.variable\\}"
---

<objective>
Pose la fondation visuelle EIC v2 sans casser l'app v0.1 : tokens CSS copiés verbatim depuis `.planning/design-v2/project/eic-tokens.css`, polices Baskervville + Montserrat self-hosted via `next/font/google` (zéro round-trip réseau), classes utilitaires glass effect + aurora background avec fallback `@supports not (backdrop-filter)`. Tous les tokens v0.1 (`--brand-*`, `--green`, `--blue`, `--gold`) restent définis en parallèle pour ne pas casser les composants v0.1 non touchés.

Purpose: DSY-01 (palette EIC disponible), DSY-02 (polices self-hosted optimisées LCP), DSY-03 (glass utilities prêtes pour le login + drawer Phase 7).
Output: 1 nouveau fichier CSS (app/eic-tokens.css) + globals.css étendu + layout.tsx avec polices câblées + 3 nouvelles clés i18n.
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
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-CONTEXT.md
@.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md
@.planning/design-v2/project/eic-tokens.css
@.planning/design-v2/project/wf-base.css
@app/globals.css
@app/layout.tsx
@lib/i18n.ts

<interfaces>
<!-- Existing layout.tsx default export (current state) -->
```ts
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { /* ... */ };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
```

<!-- Existing globals.css :root tokens that MUST be preserved -->
```css
:root {
  --brand-primary: #0B2545;
  --brand-primary-hover: #163A6E;
  --brand-accent: #C9A227;
  --brand-bg: #FAFAF7;
  --brand-surface: #FFFFFF;
  --brand-border: #E5E7EB;
  --brand-text: #111827;
  --brand-text-muted: #6B7280;
  --brand-success: #16A34A;
  --brand-warning: #D97706;
  --brand-danger: #DC2626;
  --brand-radius: 8px;
  --brand-radius-lg: 12px;
  --brand-shadow-card: 0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.05);
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --bg: #f6f4ef;
  --surface: #fffefa;
  --surface-strong: #ffffff;
  --ink: #17211c;
  --muted: #5e6a64;
  --line: #d9ddd3;
  --line-strong: #bdc8bd;
  --green: #116149;
  --green-soft: #d9eee5;
  --blue: #215d8f;
  --blue-soft: #dcebf6;
  --red: #a63d2f;
  --red-soft: #f4ded9;
  --gold: #91640e;
  --gold-soft: #f3e8c8;
  --teal: #096d75;
  --shadow: 0 18px 45px rgba(23, 33, 28, 0.08);
}
```

<!-- next/font/google API contract (Next.js 15) -->
```ts
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
// Apply: <html className={`${baskervville.variable} ${montserrat.variable}`}>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create app/eic-tokens.css with verbatim EIC v2 tokens (DSY-01)</name>
  <read_first>
    - .planning/design-v2/project/eic-tokens.css (TOKEN SOURCE — copy verbatim, lines 14-189 = :root + .dark + typography classes)
    - .planning/design-v2/project/wf-base.css (PRIMITIVE SOURCE — copy --wf-paper / --wf-paper-deep / --wf-line / --wf-line-strong / --wf-ink / --wf-ink-soft / --wf-ink-faint / --wf-blue / --wf-blue-tint / --wf-green / --wf-green-tint / --wf-amber / --wf-amber-tint / --wf-rose / --wf-rose-tint / --wf-stone / --wf-stone-tint into the same :root block)
    - .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md (Color section, Spacing Scale section)
    - app/globals.css (verify v0.1 :root tokens — these stay untouched in this task)
  </read_first>
  <files>app/eic-tokens.css</files>
  <action>
Create new file `app/eic-tokens.css`. Copy the entire content of `.planning/design-v2/project/eic-tokens.css` verbatim with two surgical changes:

1. **REMOVE** the `@import url('https://fonts.googleapis.com/css2?family=Baskervville:ital@0;1&family=Montserrat:wght@300;400;500;600;700;800&display=swap');` line at the top (lines 7-12 of the source). `next/font/google` will load fonts in Task 2 — no @import. Replace this comment block with `/* Fonts loaded via next/font/google in app/layout.tsx (no @import). */`.

2. **APPEND** to the same `:root { ... }` block the wireframe layer tokens from `.planning/design-v2/project/wf-base.css` lines 7-27 (the `--wf-paper` through `--wf-stone-tint` block, plus `--wf-hand`). Add the following tokens before the closing `}` of `:root`:

```css
  /* ---- Wireframe layer (from wf-base.css) ---- */
  --wf-paper:        #FBF8F2;
  --wf-paper-deep:   #F2EDE2;
  --wf-line:         #C9C0AE;
  --wf-line-strong:  #9A917F;
  --wf-ink:          #1B2740;
  --wf-ink-soft:     #4F5A6E;
  --wf-ink-faint:    #8A8775;
  --wf-blue:         #1B3A5C;
  --wf-blue-tint:    #E1E8F1;
  --wf-green:        #2E7D32;
  --wf-green-tint:   #DDEDDE;
  --wf-amber:        #B47A14;
  --wf-amber-tint:   #F4E6C8;
  --wf-rose:         #A23B3B;
  --wf-rose-tint:    #F0D9D9;
  --wf-stone:        #6B6557;
  --wf-stone-tint:   #ECE7DC;
  --wf-hand: 'Caveat', 'Comic Sans MS', cursive;
```

Do NOT remove the dark mode block (`.dark, [data-theme="dark"]`) — keep it. Per CONTEXT.md `<deferred>`, dark mode toggle UI is deferred but the dark tokens remain defined for v0.3.

Do NOT modify any of the typography rules (`html`, `.h1, h1`, `.h2, h2`, `.h3, h3`, `.h4, h4`, `.lead`, `p, .body`, `.body-sm, small`, `.kicker, .home-kicker`, `.ui, .btn-label`, `code, pre, .mono`, `a`) — they go through verbatim per UI-SPEC's "Phase 6 typography rule: No new typography tokens introduced beyond what eic-tokens.css declares."

**Important** — per UI-SPEC line 106 ("If a v0.1 page (e.g. /admin) is not refactored in Phase 6, leave its existing font stack untouched"): the `html { font-family: var(--font-body); color: var(--home-ink); }` rule from eic-tokens.css would cascade onto v0.1 pages. To prevent regression, **scope this rule** by replacing it with:

```css
html { /* font-family applied via next/font/google variables on <html> in layout.tsx */ }
```

The font-family on `<html>` will instead come from layout.tsx setting `style={{ fontFamily: "var(--font-body)" }}` on `<body>` only AFTER Task 2 wires the font variables. Refactored pages will explicitly use `var(--font-body)`/`var(--font-heading)`. v0.1 pages keep inheriting the legacy `body { font-family: Inter, ... }` rule from globals.css.

Use 2-space indent, no semicolons trailing trivia changes. Do NOT alter color hex values.

Note: do NOT import this file from anywhere yet — Task 2 wires the import in app/layout.tsx.
  </action>
  <verify>
    <automated>node -e 'const c=require("fs").readFileSync("app/eic-tokens.css","utf8"); const importRegex=/@import\s+url\([^)]*fonts\.googleapis\.com/; const ok=c.includes("--eic-blue:        #1B3A5C") && c.includes("--eic-green:       #2E7D32") && c.includes("--home-ivory:        #F6F1E8") && c.includes("--wf-paper-deep:   #F2EDE2") && c.includes("--wf-blue-tint:    #E1E8F1") && c.includes("--radius-pill: 9999px") && !importRegex.test(c); if(!ok){console.error("Token file missing required values or contains @import url to fonts.googleapis.com"); process.exit(1);} console.log("OK");'</automated>
  </verify>
  <acceptance_criteria>
    - File `app/eic-tokens.css` exists
    - Contains exact strings: `--eic-blue:        #1B3A5C`, `--eic-blue-light:  #2A5A8C`, `--eic-green:       #2E7D32`, `--eic-green-light: #4CAF50`, `--home-ivory:        #F6F1E8`, `--home-surface:      #FFFFFF`, `--home-ink:          #14243D`, `--home-muted:        #617084`, `--home-border:        #D8D0C2`, `--radius-sm:   8px`, `--radius-md:   12px`, `--radius-lg:   20px`, `--radius-pill: 9999px`, `--shadow-card:`, `--space-4:  16px`, `--space-12: 48px`
    - Contains wf-* layer: `--wf-paper:        #FBF8F2`, `--wf-paper-deep:   #F2EDE2`, `--wf-line:         #C9C0AE`, `--wf-blue:         #1B3A5C`, `--wf-blue-tint:    #E1E8F1`, `--wf-green-tint:   #DDEDDE`, `--wf-amber-tint:   #F4E6C8`, `--wf-rose:         #A23B3B`
    - Contains `.dark, [data-theme="dark"]` block (dark mode tokens preserved)
    - Does NOT contain `@import url('https://fonts.googleapis.com` (fonts come from next/font in Task 2)
    - Does NOT contain `font-family: var(--font-body)` on the bare `html { ... }` rule (scoping rule applied)
    - File ends with newline
  </acceptance_criteria>
  <done>app/eic-tokens.css exists with all EIC tokens + wf-* layer; no font @import; v0.1 globals.css untouched.</done>
</task>

<task type="auto">
  <name>Task 2: Wire next/font/google + import eic-tokens.css in app/layout.tsx (DSY-02)</name>
  <read_first>
    - app/layout.tsx (current 21-line file — MUST keep `metadata` export and lang="fr")
    - .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md (Design System table — font config block, lines 31-49)
    - .planning/design-v2/project/eic-tokens.css (font-family declarations to confirm: 'Baskervville', 'Baskerville Old Face', Baskerville, Georgia, serif for heading; 'Montserrat', system-ui... for body)
    - app/globals.css (lines 47-54 — body font-family rule that must remain valid for v0.1 pages)
  </read_first>
  <files>app/layout.tsx</files>
  <action>
Rewrite `app/layout.tsx` to wire `next/font/google` for both fonts AND import the new `eic-tokens.css` AFTER `globals.css` (so EIC tokens layer on top of v0.1 legacy tokens). Result:

```tsx
import type { Metadata } from "next";
import { Baskervville, Montserrat } from "next/font/google";
import "./globals.css";
import "./eic-tokens.css";

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

export const metadata: Metadata = {
  title: { default: "Entrepreneur Game - EIC / UEMF", template: "%s - Entrepreneur Game" },
  description: "Plateforme d'accompagnement entrepreneurial gamifiee EIC / UEMF.",
  icons: { icon: "/brand/logo-eic.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${baskervville.variable} ${montserrat.variable}`} lang="fr">
      <body>{children}</body>
    </html>
  );
}
```

**Why this exact structure:**
- `next/font/google` is the only font loader (UI-SPEC line 51: "next/font handles it"; CONTEXT.md decision: "Pas de @import url(...) synchrone")
- `variable: "--font-heading"` and `variable: "--font-body"` create CSS custom properties that override the fallback declarations in `eic-tokens.css` (`--font-heading: 'Baskervville', 'Baskerville Old Face'...`). next/font computes a font-family that includes its hashed local name first, then falls back to the variable's declared list — so `var(--font-heading)` resolves correctly with hashed-Baskervville-first.
- `globals.css` imported FIRST (provides v0.1 `--brand-*`, `--bg`, `body { font-family: Inter, ... }` rule for v0.1 pages); `eic-tokens.css` imported SECOND so its tokens are available on `:root` but its scoped `html { /* nothing */ }` rule does NOT cascade body fonts onto v0.1 pages.
- `display: "swap"` per UI-SPEC table (avoids FOIT, helps LCP).
- `subsets: ["latin"]` only — French uses latin, no need for latin-ext (page weight savings).
- Baskervville weights: just `["400"]` — UI-SPEC type scale uses 700/600/500 but Baskervville Google variant only ships 400. The synthetic-bold rendering by browser is acceptable for h1-h4 per UI-SPEC source eic-tokens.css which declares weights 700/600/500 against the same font.
- Montserrat weights `["300", "400", "500", "600", "700", "800"]` per UI-SPEC.
- `lang="fr"` preserved (project language).
- `<body>` does NOT receive any new className — body inherits `font-family: Inter, ...` from `globals.css` line 51-54 for v0.1 pages, and refactored pages explicitly use `var(--font-body)` in their own CSS (login form, AppShell variants in plans 06-03 / 06-04).

Do NOT add `<body className={...}>`. Do NOT remove `metadata`.
  </action>
  <verify>
    <automated>node -e 'const c=require("fs").readFileSync("app/layout.tsx","utf8"); const ok=c.includes("next/font/google") && c.includes("Baskervville") && c.includes("Montserrat") && c.includes("variable: \"--font-heading\"") && c.includes("variable: \"--font-body\"") && c.includes("./eic-tokens.css") && c.includes("lang=\"fr\"") && c.includes("baskervville.variable") && c.includes("montserrat.variable"); if(!ok){console.error("layout.tsx missing required wiring"); process.exit(1);} console.log("OK");' && npm run typecheck</automated>
  </verify>
  <acceptance_criteria>
    - `app/layout.tsx` imports `Baskervville` and `Montserrat` from `next/font/google`
    - Calls `Baskervville({ subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], variable: "--font-heading", display: "swap" })`
    - Calls `Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-body", display: "swap" })`
    - `<html>` has `className={`${baskervville.variable} ${montserrat.variable}`}` AND `lang="fr"`
    - Imports both `./globals.css` AND `./eic-tokens.css` (in that order)
    - Preserves `export const metadata: Metadata = { ... }` with title/description/icons unchanged
    - `npm run typecheck` exits 0
    - File contains zero `@import url(` strings
    - File contains zero `<link rel="preconnect" href="https://fonts`
  </acceptance_criteria>
  <done>npm run typecheck passes; layout.tsx loads both fonts via next/font/google; eic-tokens.css imported alongside globals.css; v0.1 metadata preserved.</done>
</task>

<task type="auto">
  <name>Task 3: Add glass utilities + aurora helper to app/globals.css with @supports fallback (DSY-03) + 3 new i18n keys</name>
  <read_first>
    - app/globals.css (full file — read all 836 lines to understand where to append; v0.1 rules MUST stay intact)
    - .planning/design-v2/project/wf-base.css (lines 70-114 — .wf-glass / .wf-glass-dark / .wf-glass-tint / .wf-aurora reference rules)
    - .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md (Glass / overlay section + Glass fallback contract block lines 122-151)
    - lib/i18n.ts (verify keys not already present: `login_submitting`, `login_error_invalid`, `login_error_generic`)
  </read_first>
  <files>app/globals.css, lib/i18n.ts</files>
  <action>
**Part A — app/globals.css**: APPEND to the bottom of the existing file (do NOT modify any rule above line 836). Add the following block, prefixed by a comment marker:

```css

/* ==========================================================================
   EIC Design v2 — Glass utilities + Aurora helper (DSY-03)
   Used by /login (Phase 6) and journey hero / drawer (Phase 7).
   Fallback: opaque backgrounds when backdrop-filter unsupported (Android Chrome <90).
   ========================================================================== */

.eic-glass {
  background: rgba(255, 255, 255, 0.58);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-md);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 12px 32px rgba(27, 39, 64, 0.10),
    0 2px 6px rgba(27, 39, 64, 0.06);
}

.eic-glass-tint {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(225, 232, 241, 0.45));
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 28px rgba(27, 58, 92, 0.10);
}

.eic-glass-dark {
  background: rgba(27, 58, 92, 0.62);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-md);
  color: #fff;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.18) inset,
    0 14px 36px rgba(11, 22, 40, 0.28);
}

@supports not (backdrop-filter: blur(1px)) {
  .eic-glass { background: rgba(255, 255, 255, 0.92); }
  .eic-glass-tint { background: rgba(255, 255, 255, 0.94); }
  .eic-glass-dark { background: rgba(27, 58, 92, 0.96); }
}

/* Aurora — soft blurred radial blobs for /login + /journey hero (Phase 7).
   ALWAYS wrap in a positioned container; never apply to <body> directly. */
.eic-aurora {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.eic-aurora::before,
.eic-aurora::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
}
.eic-aurora::before {
  width: 420px;
  height: 420px;
  background: #B5D4B7;
  left: -120px;
  top: -100px;
}
.eic-aurora::after {
  width: 480px;
  height: 480px;
  background: #BCD0E6;
  right: -140px;
  bottom: -160px;
}
.eic-aurora .blob3 {
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: #F4E6C8;
  filter: blur(70px);
  opacity: 0.45;
  left: 38%;
  top: 40%;
}
```

**Why exact values:** lifted verbatim from `wf-base.css` lines 70-114 (UI-SPEC line 131 mandates these blobs/colors/sizes). Class names use `.eic-*` prefix per CONTEXT.md "Claude's Discretion" (decided eic-* over wf-* to avoid confusion with the wireframe-internal classes — those `.wf-*` classes are demo-only).

DO NOT touch any rule above line 836 (preserve `--brand-*`, `.app-shell`, `.sidebar`, all v0.1 styles).

**Part B — lib/i18n.ts**: Add 3 new keys to BOTH `fr` and `en` dictionaries. Insert after `login_submit` line. Existing keys are preserved verbatim.

In `fr`:
```
login_submitting: "Connexion en cours…",
login_error_invalid: "Email ou mot de passe incorrect. Vérifiez vos identifiants ou contactez votre GameMaster.",
login_error_generic: "Connexion impossible. Réessayez dans un instant.",
```

In `en`:
```
login_submitting: "Signing in...",
login_error_invalid: "Invalid email or password. Check your credentials or contact your GameMaster.",
login_error_generic: "Sign-in failed. Try again in a moment.",
```

Note: per UI-SPEC line 200 ("UI copy CAN and SHOULD use proper accents"), French text uses `é`, `è`, `…` directly. This is a UI dictionary, NOT a mailto/CSV payload — diacritics are safe here. The existing FR dictionary already uses ASCII ("Connexion en cours" etc. is acceptable; UI-SPEC explicitly allows diacritics — we go with diacritics in new keys since UI-SPEC mandates it).

DO NOT modify any existing key. DO NOT change `as const` annotation.
  </action>
  <verify>
    <automated>node -e 'const c=require("fs").readFileSync("app/globals.css","utf8"); const ok=c.includes(".eic-glass {") && c.includes("backdrop-filter: blur(18px) saturate(140%)") && c.includes("@supports not (backdrop-filter: blur(1px))") && c.includes("rgba(255, 255, 255, 0.92)") && c.includes("rgba(27, 58, 92, 0.96)") && c.includes(".eic-aurora {") && c.includes(".eic-aurora::before") && c.includes("#B5D4B7") && c.includes("#BCD0E6") && c.includes("--brand-primary"); if(!ok){console.error("globals.css missing required additions or v0.1 tokens"); process.exit(1);} console.log("globals OK");' && node -e 'const c=require("fs").readFileSync("lib/i18n.ts","utf8"); const ok=c.includes("login_submitting:") && c.includes("login_error_invalid:") && c.includes("login_error_generic:") && c.includes("Connexion en cours") && c.includes("Signing in"); if(!ok){console.error("i18n missing keys"); process.exit(1);} console.log("i18n OK");' && npm run typecheck</automated>
  </verify>
  <acceptance_criteria>
    - `app/globals.css` contains class `.eic-glass {` with `backdrop-filter: blur(18px) saturate(140%)`
    - Contains `.eic-glass-tint {` and `.eic-glass-dark {`
    - Contains `@supports not (backdrop-filter: blur(1px))` block with three opaque fallbacks (`0.92`, `0.94`, `0.96`)
    - Contains `.eic-aurora {` with `position: absolute`, `pointer-events: none`, `z-index: 0`
    - Contains `.eic-aurora::before` and `.eic-aurora::after` with `filter: blur(60px)` and colors `#B5D4B7` + `#BCD0E6`
    - Contains `.eic-aurora .blob3` with `#F4E6C8`
    - STILL contains `--brand-primary: #0B2545;` and `--bg: #f6f4ef;` (legacy preserved)
    - STILL contains `.app-shell {` and `.sidebar {` (legacy preserved)
    - `lib/i18n.ts` adds keys `login_submitting`, `login_error_invalid`, `login_error_generic` in BOTH `fr` and `en` dictionaries
    - `lib/i18n.ts` still has `as const` at end of dictionaries object
    - `npm run typecheck` exits 0
  </acceptance_criteria>
  <done>Glass utilities + aurora helper appended to globals.css with backdrop-filter fallback; v0.1 styles untouched; 3 login i18n keys added (fr+en); typecheck clean.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser ← CDN (Google Fonts via next/font) | Next.js downloads font files at build time and self-hosts them under `/_next/static/media/`. No runtime third-party request when next/font is wired correctly. |
| CSS file ← Source code | Static CSS — no dynamic interpolation, no template injection. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-01 | Information Disclosure | next/font fingerprint via remote @font-face | mitigate | Remove `@import url('https://fonts.googleapis.com')` from `eic-tokens.css` (Task 1). next/font self-hosts fonts under `/_next/static/media/` — no third-party request, no IP leak to Google. UI-SPEC mandate. |
| T-06-02 | Tampering | CSS injection via attacker-controlled tokens | accept | All token values are static hex/numeric literals copied from a reviewed source file (`.planning/design-v2/project/eic-tokens.css` authored by user). No user input enters CSS. |
| T-06-03 | Denial of Service | Backdrop-filter rendering crash on legacy Android Chrome | mitigate | `@supports not (backdrop-filter: blur(1px))` fallback emits opaque rgba backgrounds (Task 3). Surface degrades gracefully — no JS error, no white box. |
| T-06-04 | Information Disclosure | i18n keys leaking sensitive copy | accept | New keys are generic UX copy (login submitting/error). No user data, no secrets. Severity info. |
</threat_model>

<verification>
After all tasks complete:

1. `npm run typecheck` → 0 errors
2. `npm run lint` → no NEW warnings vs `git diff main -- eslint output`
3. `npm run build` → succeeds; bundle includes Baskervville + Montserrat under `.next/static/media/`
4. `grep -r "fonts.googleapis.com" app/ components/ lib/ --include="*.ts*" --include="*.css"` → returns no results (next/font self-hosts)
5. Manual: `npm run dev`, open http://localhost:3000/login → page renders without runtime CSS errors. Open DevTools → Network tab → no request to `fonts.googleapis.com`.
6. Manual: open http://localhost:3000/journey (in demo mode) → still renders with v0.1 styling (Inter font on body, slate sidebar) — no regression. Plans 06-02..04 will refactor the shell.
</verification>

<success_criteria>
- DSY-01 ✓: `app/eic-tokens.css` exists with full EIC palette (`--eic-blue: #1B3A5C` etc.) + wf-* layer; v0.1 tokens preserved in `app/globals.css`
- DSY-02 ✓: Both fonts loaded via `next/font/google` in `app/layout.tsx` with `--font-heading` and `--font-body` CSS variables exposed on `<html>`; zero `@import url(https://fonts...)` in source
- DSY-03 ✓: `.eic-glass`, `.eic-glass-tint`, `.eic-glass-dark` defined with `backdrop-filter` AND `@supports not (...)` opaque fallback; `.eic-aurora` helper ready for use by login (plan 06-04) and Phase 7 hero
- v0.1 not broken: `npm run typecheck` + `npm run lint` + `npm run build` pass; `/journey`, `/mentor`, `/admin` still render in v0.1 styling
- 3 new i18n keys added (`login_submitting`, `login_error_invalid`, `login_error_generic`) in fr+en
</success_criteria>

<output>
After completion, create `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-01-SUMMARY.md` recording: tokens copied, fonts wired (which weights/subsets), glass class names, fallback strategy, files touched, any gotchas with Baskervville weight 400 limitation.
</output>
</content>
</invoke>