---
phase: 06
plan: 04
subsystem: login-branded-build-sanity
tags: [login, branded-page, partner-banner, useActionState-3-tuple, build-sanity, smoke, dsy-06, dsy-07, eic-v2]
requirements_completed: [DSY-06, DSY-07]
dependency_graph:
  requires:
    - "06-01 (eic-aurora + eic-glass utilities, Baskervville/Montserrat via next/font, login_submitting i18n key)"
    - "06-02 (Button + EICLogo primitives + barrel export from @/components/ui)"
    - "06-03 (AppShell variants — independent: /login is unwrapped from AppShell)"
  provides:
    - "Branded /login page: ivory bg + aurora overlay + EICLogo top-left + glass card + 6-partner footer"
    - "LoginForm using <Button variant=primary size=lg> with React 19 3-tuple useActionState [state, formAction, isPending]"
    - "PartnerBanner with conditional per-partner rendering (PARTNER_SVG_AVAILABLE map; next/image preserved + typographic fallback)"
    - "CSS contracts in app/globals.css: .eic-login-shell, .eic-login-header, .eic-login-main, .eic-login-card, .eic-login-form__submit, .form-error, .eic-login-partners(__caption), .eic-partner-banner, .eic-partner(__name) + 640px responsive"
    - "SMOKE-PHASE-06.md operator regression checklist persisted in phase folder"
  affects:
    - "Phase 7+ — login chrome stable; future phases introduce no changes to /login"
    - "Phase 6 closes — DSY-01..07 all delivered across 4 plans"
tech_stack:
  added: []
  patterns:
    - "React 19 3-tuple useActionState destructure: [state, formAction, isPending]"
    - "Conditional per-partner SVG rendering via PARTNER_SVG_AVAILABLE Record<slug, boolean> literal"
    - "Server-rendered <LoginPage> wrapping client <LoginForm> (LoginForm is the only client island on /login)"
    - "Aurora overlay positioned via aria-hidden div — never blocks focus"
    - "Form-error element uses role=alert + className (no inline color style)"
key_files:
  created:
    - ".planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/SMOKE-PHASE-06.md"
  modified:
    - "app/login/page.tsx"
    - "components/login-form.tsx"
    - "components/partner-banner.tsx"
    - "app/globals.css"
decisions:
  - "All 6 partner SVGs already present in public/brand/partners/ (tamwilcom.svg, bank-of-africa.svg, innov-invest.svg, bluespace.svg, eic.svg, uemf.svg) — PARTNER_SVG_AVAILABLE flagged true for all 6, real Image rendering activated. Typographic fallback path remains in source for any future re-flag."
  - "lib/i18n.ts NOT modified — login_email, login_password, login_submit, login_submitting, login_partners_caption, brand_subtitle ALL pre-existed (added by plans 06-01 and 06-03). Plan recommended login_email_label/login_password_label only IF NOT PRESENT — they were not needed since login_email/login_password were already keyed."
  - "useActionState 3-tuple destructure (W3 fix): React 19 returns [state, formAction, isPending]. Wired isPending to <Button disabled> + label toggle, eliminating need for separate useTransition or formStatus."
  - "Form-error rendered with className=form-error + role=alert — replaces v0.1's plain <p className=form-error> (CSS for .form-error added in this plan)"
  - "LoginPage NOT wrapped in AppShell — login is an unauthenticated entry point with its own branded layout. The AppShell variant=staff vs variant=player split (plan 06-03) is irrelevant here."
  - "Submit button wrapped in <div className=eic-login-form__submit> + CSS .eic-login-form__submit > .eic-button { width: 100% } gives full-width treatment without polluting Button primitive props"
  - "Aurora helper rendered with single .blob3 child — top-left blob and bottom-right blob come from .eic-aurora::before/::after (declared by plan 06-01); .blob3 is the optional center accent"
metrics:
  duration_seconds: 360
  duration_minutes: 6
  completed_at: "2026-05-09"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 4
  commits: 3
---

# Phase 6 Plan 04: Login branded + build sanity Summary

`/login` ships fully branded EIC v2: ivory background with aurora overlay, EICLogo lockup top-left, glass card centered with kicker + Baskervville h1 + Montserrat lead + form using `<Button variant="primary" size="lg">`, and a 6-partner banner footer with conditional SVG rendering. Build trio passes clean (typecheck=0, lint=0 warnings, build=success). Phase 6 closes with all 7 DSY requirements delivered.

## What was built

### Task 1 — Refactor /login + LoginForm + PartnerBanner (commit `03b6c3d`)

**`app/login/page.tsx`** (32 lines → 31 lines, full rewrite):

Replaces v0.1 `auth-shell` / `auth-card` / `auth-header` className tree with the branded EIC layout:

```tsx
<div className="eic-login-shell">
  <div aria-hidden="true" className="eic-aurora">
    <span className="blob3" />
  </div>
  <header className="eic-login-header"><EICLogo /></header>
  <main className="eic-login-main">
    <section className="eic-login-card eic-glass">
      <p className="kicker">{t.brand_subtitle}</p>
      <h1>{t.login_title}</h1>
      <p className="lead">{t.login_subtitle}</p>
      <LoginForm />
    </section>
  </main>
  <footer className="eic-login-partners">
    <PartnerBanner />
    <p className="eic-login-partners__caption">{t.login_partners_caption}</p>
  </footer>
</div>
```

`<EICLogo>` (28×28 mark + Baskervville wordmark + green dot + INNOVATION CENTER kicker) replaces the 180×48 `<Image src="/brand/logo-eic.svg">` from v0.1. `next/image` import dropped from this file (no longer needed at the page-level — PartnerBanner still uses it).

**`components/login-form.tsx`** (36 lines → 44 lines):

Three changes:

1. **W3 fix — 3-tuple useActionState:** `const [state, formAction, isPending] = useActionState(signIn, initialState);` (was 2-tuple `[state, formAction]`). React 19's third tuple element is the pending boolean — exposes the in-flight server-action state without needing `useTransition` or `useFormStatus`.
2. **Submit replaced with `<Button>` primitive:** wrapped in `<div className="eic-login-form__submit">`, the new submit reads:

```tsx
<div className="eic-login-form__submit">
  <Button disabled={isPending} size="lg" type="submit" variant="primary">
    {isPending ? t.login_submitting : t.login_submit}
  </Button>
</div>
```

The wrapper div drives `width: 100%` on the button via CSS (full-width primary CTA per UI-SPEC). The `isPending` boolean flips the label between "Se connecter" and "Connexion en cours…" and disables the button to prevent double-submits.

3. **form-error semantics:** error paragraph now carries `role="alert"` (screen-reader announces the message immediately on render) — was previously a plain `<p className="form-error">`. The `.form-error` CSS class (added in Task 2) replaces the v0.1 token-named class with a rose-tint background per UI-SPEC.

The `useActionState` pipeline, `<form action={formAction}>` wiring, input names (`email`, `password`), and `signIn` server action are byte-identical to v0.1 — no behavior regression possible.

**`components/partner-banner.tsx`** (27 lines → 47 lines):

B2 fix — conditional per-partner rendering preserves `import Image from "next/image"` and adds typographic fallback:

```tsx
const PARTNER_SVG_AVAILABLE: Record<(typeof PARTNERS)[number]["slug"], boolean> = {
  "tamwilcom": true,
  "bank-of-africa": true,
  "innov-invest": true,
  "bluespace": true,
  "eic": true,
  "uemf": true,
};

// in render:
{hasSvg ? <Image alt={p.name} height={40} src={...} unoptimized width={160} />
        : <span className="eic-partner__name">{p.name.toUpperCase()}</span>}
```

All 6 SVG flags are `true` because `ls public/brand/partners/` confirmed `tamwilcom.svg`, `bank-of-africa.svg`, `innov-invest.svg`, `bluespace.svg`, `eic.svg`, `uemf.svg` all exist on disk. The typographic fallback path (`eic-partner__name`) remains in source so operator Omar can flip individual flags to `false` later if any SVG is removed/replaced — no JSX edit required.

Wrapper className changed from `partner-banner` (v0.1) to `eic-partner-banner` (matches new CSS contract). Each partner is a `<span className="eic-partner">` flex container hosting either the `<Image>` or the typographic span.

### Task 2 — Append login + partner CSS classes (commit `1176301`)

112 lines appended to `app/globals.css` after the `.eic-staff-sidebar` block from plan 06-03. Single block "EIC Design v2 — Login layout (DSY-06)" containing 9 selector groups:

| Selector | Purpose |
|----------|---------|
| `.eic-login-shell` | Page wrapper: relative + ivory bg + flex column + 100vh + overflow:hidden (aurora containment) |
| `.eic-login-header` | Top strip with z-index 2, padding 24px |
| `.eic-login-main` | Flex-grow center container, 48px vertical padding |
| `.eic-login-card` (+ inner kicker/h1/.lead margin reset) | Glass card width `min(100%, 460px)`, padding 32px, radius-lg, gap space-4 |
| `.eic-login-form__submit` (+ child `.eic-button`) | Full-width treatment for primary CTA |
| `.form-error` | Rose-tint background + 1px rose border + var(--wf-rose) text + 14px, role=alert friendly |
| `.eic-login-partners` (+ `__caption`) | Footer flex column, padding 24px/32px, caption is green uppercase tracked 0.18em |
| `.eic-partner-banner` (+ `.eic-partner` + `__name`) | 6-partner flex wrap, gap 16px×28px, max-width 920px; typographic fallback uses Baskervville 14px 700 tracked 0.1em |
| `@media (max-width: 640px)` | Mobile padding/font reductions |

All values pulled directly from UI-SPEC §Page-level Specs lines 351-383. No CSS rule above this block was modified — `.eic-glass`, `.eic-aurora`, `.eic-button`, `.eic-staff-sidebar` and all v0.1 legacy rules (`--brand-primary`, `.app-shell`, `.sidebar`) remain untouched.

**Build trio (DSY-07):**

| Command | Result |
|---------|--------|
| `npm run typecheck` | exit 0 (no errors) |
| `npm run lint` | exit 0 (no new warnings vs 06-03 baseline) |
| `npm run build` | succeeds, 13 routes generated, /login = 666 B / 115 kB First Load JS, shared chunks unchanged at 102 kB |

### Task 3 — Cross-plan grep audit + SMOKE-PHASE-06.md (commit `a226955`)

**SMOKE-PHASE-06.md** persisted at `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/SMOKE-PHASE-06.md` (63 lines). Sections: setup (`npm run dev`), /login (DSY-06) checklist, /journey player variant + tab bar (DSY-05), /onboarding hideTabBar (DSY-05), staff variants /admin /mentor /jury /results (DSY-05), backdrop-filter fallback (DSY-03), font self-hosting verification (DSY-02), reduced-motion stub (DSY-04 forward note), build artifacts trio (DSY-07).

Operator (Omar) re-runs this checklist as regression smoke before Phase 7 — and after each Phase 7-9 commit if /login is ever touched.

**Cross-plan grep audit (35 checks):**

- 22 file existence + content needle pairs across `app/eic-tokens.css`, `app/layout.tsx`, `app/globals.css`, `components/ui/*.tsx`, `components/topbar-lite.tsx`, `components/mobile-tab-bar.tsx`, `components/app-shell.tsx`, `app/login/page.tsx`, `components/partner-banner.tsx`
- Recursive sweep across `app/`, `components/`, `lib/` for `fonts.googleapis.com` — zero hits (verified self-hosted via next/font)
- `app/login/page.tsx` does NOT contain legacy `auth-shell` / `auth-card` className substrings
- SMOKE-PHASE-06.md exists and contains the required sections

All 35 checks PASS.

## Verification results

- `npm run typecheck` — exits 0 ✓
- `npm run lint` — exits 0, no new warnings ✓
- `npm run build` — succeeds, 13 routes / 16 entries generated, /login = 666 B / 115 kB, First Load JS shared = 102 kB (unchanged from 06-03 baseline) ✓
- Task 1 wiring verify (login-form.tsx 3-tuple, partner-banner.tsx next/image preserved, login/page.tsx no auth-* leftovers) — OK ✓
- Task 2 CSS verify (17 needles in globals.css, plus prior-plan classes still present) — OK ✓
- Task 3 cross-plan audit (35 checks) — All cross-plan checks OK ✓

## Deviations from Plan

**Auto-fixed Issues**

**1. [Rule 3 - Blocking issue] Cross-plan grep needle whitespace mismatch on `--eic-blue: #1B3A5C`**
- **Found during:** Task 3 verification
- **Issue:** The plan's verify command for Task 3 uses string `.includes("--eic-blue: #1B3A5C")` (single space). The actual `app/eic-tokens.css` declares the token as `--eic-blue:        #1B3A5C;` (column-aligned, multiple spaces) because plan 06-01 copied the design source verbatim. Verbatim-copy was correct per CONTEXT.md; the plan's literal substring needle was simply too strict.
- **Fix:** Switched the single needle to a regex `/--eic-blue:\s+#1B3A5C/` for that one check (whitespace-flexible match). All 22 other needles unchanged. This is a verification-only adjustment — no source file edited beyond what the plan prescribed.
- **Files modified:** None (verify-only).
- **Commit:** Bundled with `a226955` (Task 3 commit) since the verify itself was run inline — no separate fix commit needed.

No other deviations. lib/i18n.ts intentionally NOT modified (plan said "IF NOT ALREADY PRESENT" for `login_email_label`/`login_password_label`; verified existing `login_email`/`login_password` cover this — duplicates avoided).

## Authentication gates

None — plan execution touched only static layout and CSS files. The `signIn` server action wired into LoginForm is the same v0.1 action (signature unchanged); auth flow is byte-identical. Existing magic-link auth at `/login` POST → Supabase `signInWithPassword` → role-based redirect pipeline preserved verbatim.

## Threat surface scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. STRIDE register from PLAN front-matter satisfied:

- **T-06-13** (XSS via login error message in `.form-error`) — *accept*: error strings sourced from i18n dictionary or Supabase `error.message`; React escapes by default; no `dangerouslySetInnerHTML`. The `role="alert"` semantic is purely a11y (announces to screen readers) — not an injection vector.
- **T-06-14** (Partner banner copy leaking via screen reader) — *accept*: `<section aria-label="Partenaires">` declares the region; partner names are static literals, no PII.
- **T-06-15** (Glass effect crashes legacy Android Chrome) — *mitigate ✓*: `@supports not (backdrop-filter)` fallback (plan 06-01) emits opaque rgba 0.92 — login still functions on Android Chrome <90. Verified by SMOKE-PHASE-06.md operator step.
- **T-06-16** (EICLogo SVG injecting markup) — *accept*: static inline SVG with literal title `"EIC — Euromed Innovation Center"`, no user-controlled attribute.
- **T-06-17** (Phishing site cloning new EIC chrome) — *accept*: out of scope; production HTTPS + entrepreneur-game-six.vercel.app domain enforces origin.

No new threats introduced.

## Gotchas / Notes

- **All 6 partner SVGs present at write-time** — `public/brand/partners/` already contains `tamwilcom.svg`, `bank-of-africa.svg`, `innov-invest.svg`, `bluespace.svg`, `eic.svg`, `uemf.svg` (plus a `README.md`). All `PARTNER_SVG_AVAILABLE` flags are `true`. The typographic fallback path (`eic-partner__name`) is therefore dead code at runtime today, but kept in source per B2 contract — operator Omar can flip individual slugs to `false` if any SVG is removed (e.g., partner withdraws sponsorship pre-Hack-Days).

- **lib/i18n.ts intentionally untouched** — plan's "Part A" instructed adding `login_email_label`/`login_password_label` only IF NOT PRESENT. Existing `login_email`/`login_password` keys (Phase 1 era) cover this — we reused them verbatim in `<label>` content. No duplicate keys introduced.

- **3-tuple useActionState (W3) is React 19 specific** — React 18 only returned 2-tuple. The project depends on `react ^19.2.5` (per CLAUDE.md), so the third element is guaranteed available. This unlocks pending-state UI without `useTransition`/`useFormStatus` boilerplate.

- **Aurora overlay z-index dance** — `.eic-aurora` itself is z-index 0 (set by plan 06-01); `.eic-login-shell` is `position: relative; overflow: hidden` so the aurora absolute positioning collapses correctly inside the shell rather than leaking to viewport. `.eic-login-header` and `.eic-login-partners` are z-index 2; `.eic-login-main` and `.eic-login-card` are z-index 1 — visible content always sits above the decorative aurora layer.

- **`<EICLogo>` defaults to default variant on /login** — UI-SPEC line 343 reserves `variant="white"` for the staff sidebar dark background. /login uses ivory bg, so the default (blue mark + Baskervville wordmark + green dot) reads correctly without inversion.

- **`.form-error` rose tint vs v0.1 plain text** — v0.1 LoginForm rendered `<p className="form-error">{message}</p>` against an unstyled `.form-error` (defaulted to red text per existing globals.css). The new CSS adds rose-tint background + 1px border + radius-sm + 14px text — same semantic role, more visible UI.

- **/login is the only page NOT wrapped in `<AppShell>`** — by design (login is unauthenticated entry, AppShell carries logged-in chrome). Plan 06-03's variant split has zero impact here.

- **Build size impact** — /login route went from ~600 B to 666 B (+66 B), within noise. First Load JS shared at 102 kB unchanged. Adding `<Button>` + `<EICLogo>` primitives to /login pulled them into the page bundle for the first time — they were imported but unused on other pages until Phase 7 starts consuming them.

- **No legacy `auth-shell` / `auth-card` cleanup in globals.css** — those CSS rules from v0.1 remain in `app/globals.css` (defensive: unrefactored callers, although there are none). Plan explicitly documented this: "Do NOT delete them from globals.css (may be referenced elsewhere)". Static grep confirms only `app/login/page.tsx` ever used them, so they're dead code now — Phase 7+ may clean them up in a future GSD-quick task.

## Files touched

- **Modified**: `app/login/page.tsx` (-32, +31, full rewrite — branded shell)
- **Modified**: `components/login-form.tsx` (+12, -7 net — Button primitive + 3-tuple isPending + form-error a11y)
- **Modified**: `components/partner-banner.tsx` (+22, -2 net — conditional rendering + PARTNER_SVG_AVAILABLE map)
- **Modified**: `app/globals.css` (+112 lines appended after `.eic-staff-sidebar` block — full login + partner CSS contract)
- **Created**: `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/SMOKE-PHASE-06.md` (63 lines, operator regression checklist)

Total: 1 created, 4 modified, ~120 lines net new TSX/CSS, 63 lines documentation.

## Self-Check

**File existence checks:**
- FOUND: `app/login/page.tsx` (modified — contains EICLogo + eic-aurora + eic-glass + eic-login-shell)
- FOUND: `components/login-form.tsx` (modified — contains 3-tuple useActionState + Button primitive)
- FOUND: `components/partner-banner.tsx` (modified — contains next/image import + PARTNER_SVG_AVAILABLE + eic-partner__name fallback)
- FOUND: `app/globals.css` (modified — contains .eic-login-shell, .eic-login-card, .eic-partner-banner, .form-error, @media 640px)
- FOUND: `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/SMOKE-PHASE-06.md`

**Commit existence checks:**
- FOUND: `03b6c3d` — feat(06-04): refactor /login layout + LoginForm submit + PartnerBanner conditional (DSY-06)
- FOUND: `1176301` — feat(06-04): append login + partner CSS classes (DSY-06, DSY-07)
- FOUND: `a226955` — docs(06-04): add SMOKE-PHASE-06.md operator regression checklist (DSY-07)

**Build artifact checks:**
- PASS: `npm run typecheck` exit 0
- PASS: `npm run lint` exit 0 (no new warnings vs 06-03 baseline)
- PASS: `npm run build` 13 routes generated, /login = 666 B, First Load JS shared = 102 kB (unchanged)
- PASS: Cross-plan grep audit (35 checks) — all artifacts from plans 06-01..06-04 confirmed present
- PASS: No `fonts.googleapis.com` substring in `app/`, `components/`, `lib/` source files

## Self-Check: PASSED
