---
phase: 06
plan: 04
type: execute
wave: 4
depends_on: [06-01, 06-02, 06-03]
files_modified:
  - app/login/page.tsx
  - components/login-form.tsx
  - components/partner-banner.tsx
  - app/globals.css
  - lib/i18n.ts
autonomous: true
requirements: [DSY-06, DSY-07]
must_haves:
  truths:
    - "Visitor on /login sees an ivory background with aurora blobs (.eic-aurora wrapper, blurred radial blobs at corners)"
    - "Visitor sees the EICLogo lockup top-left of the page (logo mark + EIC wordmark + INNOVATION CENTER kicker)"
    - "Visitor sees the form centered on a glass card (.eic-glass class, blurred translucent on modern browsers, opaque white 92% on Android Chrome <90)"
    - "Visitor sees the partner banner (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace, EIC, UEMF) anchored to the bottom of the viewport with the caption 'Avec le soutien de nos partenaires' — each partner renders as <Image> if public/brand/partners/{slug}.svg exists, else as a typographic Montserrat 600 uppercase span"
    - "Login submit primary CTA uses <Button variant=\"primary\" size=\"lg\"> with full-width and label 'Se connecter' (or 'Connexion en cours…' while submitting)"
    - "Submitting valid credentials still authenticates and redirects per existing v0.1 logic — no behavior regression"
    - "npm run typecheck exits 0; npm run lint produces no new warnings; npm run build succeeds"
  artifacts:
    - path: "app/login/page.tsx"
      provides: "Branded login shell — ivory bg + aurora overlay + EICLogo top-left + glass card + partner banner footer"
      contains: "eic-aurora"
    - path: "components/login-form.tsx"
      provides: "Login form using <Button variant=\"primary\" size=\"lg\"> with i18n submitting label and form-error rendering"
      contains: "Button"
    - path: "components/partner-banner.tsx"
      provides: "Partner banner restyled for new login layout — conditional <Image> per-partner with typographic fallback (preserves next/image import per B2 fix)"
      contains: "PARTNERS"
      exports: ["PartnerBanner"]
    - path: "app/globals.css"
      provides: ".eic-login-shell, .eic-login-card, .eic-login-header, .eic-login-partners CSS classes (login-specific layout)"
      contains: ".eic-login-shell"
    - path: "lib/i18n.ts"
      provides: "Optional partner banner caption already present (login_partners_caption); add login_email_label / login_password_label if not yet keyed"
      contains: "login_partners_caption"
  key_links:
    - from: "app/login/page.tsx"
      to: ".eic-glass + .eic-aurora utilities (plan 06-01)"
      via: "className"
      pattern: "className=\"eic-aurora\"|className=\"eic-glass"
    - from: "app/login/page.tsx"
      to: "<EICLogo /> from @/components/ui (plan 06-02)"
      via: "JSX import + render"
      pattern: "EICLogo"
    - from: "components/login-form.tsx"
      to: "<Button variant=\"primary\" size=\"lg\"> from @/components/ui (plan 06-02)"
      via: "JSX import + render"
      pattern: "Button"
---

<objective>
Refactor `/login` selon UI-SPEC §Page-level Specs : background ivoire avec aurora blobs, EICLogo en haut-gauche (24px de la marge), card glass centrée avec h1 Baskervville + lead body + form, partner banner ancré en bas. Le `<Button>` primaire (plan 06-02) remplace le bouton inline du `<LoginForm>`. Le `<PartnerBanner>` est restylé pour s'intégrer au nouveau layout (placeholder typographique pour les logos partenaires manquants dans `public/brand/partners/`).

Final task : suite build sanity (DSY-07) — `npm run typecheck`, `npm run lint`, `npm run build` doivent passer ; greps cross-plan vérifient que les artefacts des plans 06-01..06-03 sont toujours présents ; SMOKE-PHASE-06.md écrit pour Omar.

Purpose: DSY-06 (login branded EIC v2) + DSY-07 (build clean après refonte fondation).
Output: 3 fichiers TSX modifiés + bloc CSS login-specific + 2 clés i18n optionnelles + verdict build sanity + SMOKE-PHASE-06.md.
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
@.planning/design-v2/project/eic-tokens.css
@app/login/page.tsx
@components/login-form.tsx
@components/partner-banner.tsx
@app/globals.css
@lib/i18n.ts

<interfaces>
<!-- Existing app/login/page.tsx (current 32-line file) -->
```tsx
import Image from "next/image";
import { LoginForm } from "@/components/login-form";
import { PartnerBanner } from "@/components/partner-banner";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <main className="auth-main">
        <div className="auth-card">
          <header className="auth-header">
            <Image src="/brand/logo-eic.svg" alt="EIC - UEMF" width={180} height={48} className="brand-logo" priority />
            <h1>{t.login_title}</h1>
            <p className="auth-subtitle">{t.login_subtitle}</p>
          </header>
          <LoginForm />
        </div>
      </main>
      <PartnerBanner />
      <p className="auth-footer">{t.login_partners_caption}</p>
    </div>
  );
}
```

<!-- Existing components/partner-banner.tsx — uses next/image -->
```tsx
import Image from "next/image";
const PARTNERS = [
  { slug: "tamwilcom", name: "Tamwilcom" },
  { slug: "bank-of-africa", name: "Bank of Africa Academy" },
  { slug: "innov-invest", name: "Innov Invest" },
  { slug: "bluespace", name: "Bluespace" },
  { slug: "eic", name: "EIC" },
  { slug: "uemf", name: "UEMF" },
] as const;
export function PartnerBanner() {
  return (
    <section aria-label="Partenaires" className="partner-banner">
      {PARTNERS.map((p) => (
        <Image key={p.slug} src={`/brand/partners/${p.slug}.svg`} alt={p.name} width={160} height={40} unoptimized />
      ))}
    </section>
  );
}
```

<!-- Available primitives (from plan 06-02) -->
```ts
import { Button, EICLogo } from "@/components/ui";
// <Button variant="primary" size="lg" type="submit" disabled={pending}>{label}</Button>
// <EICLogo /> renders the lockup
```

<!-- Available utility classes (from plans 06-01, 06-02, 06-03) -->
// .eic-aurora — aurora wrapper (position: absolute, z-index: 0)
// .eic-glass  — translucent blurred surface, fallback opaque white 92%
// .kicker     — green uppercase tracked typography from eic-tokens.css
// .lead       — 20px Montserrat 400 muted-strong from eic-tokens.css
// .h1         — Baskervville 700 clamp(40-72px) from eic-tokens.css
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Refactor /login layout + LoginForm submit + PartnerBanner typographic stub</name>
  <read_first>
    - app/login/page.tsx (current 32-line file)
    - components/login-form.tsx (read full file to find submit button JSX, pending state, error rendering — must replace submit with Button primitive without breaking useActionState pipeline)
    - components/partner-banner.tsx (current 27-line file)
    - .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md (Page-level Specs section /login lines 351-383; Copywriting Contract lines 173-204)
    - lib/i18n.ts (verify keys present: login_title, login_subtitle, login_email, login_password, login_submit. After plans 06-01 + 06-03: login_submitting, login_error_invalid, login_error_generic, brand_subtitle should also be present. login_email_label / login_password_label may NOT yet exist)
    - app/globals.css (verify .eic-glass + .eic-aurora present from plan 06-01; .eic-button present from plan 06-02)
    - public/brand/partners/ (best-effort listing — informs whether to keep typographic stub or wire <Image>)
  </read_first>
  <files>app/login/page.tsx, components/login-form.tsx, components/partner-banner.tsx, lib/i18n.ts</files>
  <action>
**Part A — `lib/i18n.ts`**: Verify or add keys IF NOT PRESENT. If `login_email` / `login_password` already exist (they do in v0.1), keep using them — do NOT duplicate. If not present, add to fr+en:

In `fr` (only if missing):
```
login_email_label: "Email",
login_password_label: "Mot de passe",
```

In `en` (only if missing):
```
login_email_label: "Email",
login_password_label: "Password",
```

The current LoginForm likely already references `t.login_email` / `t.login_password` — leave it. Reuse existing keys, prefer NO new keys if already covered.

**Part B — Rewrite `app/login/page.tsx`** to the branded layout:

```tsx
import { EICLogo } from "@/components/ui";
import { LoginForm } from "@/components/login-form";
import { PartnerBanner } from "@/components/partner-banner";
import { dictionaries } from "@/lib/i18n";

const t = dictionaries.fr;

export default function LoginPage() {
  return (
    <div className="eic-login-shell">
      <div aria-hidden="true" className="eic-aurora">
        <span className="blob3" />
      </div>
      <header className="eic-login-header">
        <EICLogo />
      </header>
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
  );
}
```

Notes:
- `<EICLogo>` replaces `<Image src="/brand/logo-eic.svg">` — the lockup includes its own wordmark.
- `.kicker` and `.lead` and `h1` inherit typography from `eic-tokens.css` — no extra class needed.
- `.eic-aurora` is `aria-hidden` and `pointer-events: none` (CSS) — never blocks focus.
- The previous `auth-*` classes are no longer referenced by /login. Do NOT delete them from globals.css (may be referenced elsewhere).

**Part C — Patch `components/login-form.tsx`** — Replace submit button with `<Button>` primitive. Find the existing submit element and replace ONLY the submit JSX. Add `import { Button } from "@/components/ui";` to the top of the imports.

**W3 — Wire isPending via 3-tuple useActionState:** the current file uses `const [state, formAction] = useActionState(signIn, initialState);` (2-tuple). React 19 returns a 3-tuple `[state, formAction, isPending]`. Update the destructure:

```tsx
const [state, formAction, isPending] = useActionState(signIn, initialState);
```

Then replace the existing submit button JSX (currently `<button className="button primary" type="submit">{t.login_submit}</button>`) with:

```tsx
<div className="eic-login-form__submit">
  <Button disabled={isPending} size="lg" type="submit" variant="primary">
    {isPending ? t.login_submitting : t.login_submit}
  </Button>
</div>
```

The wrapper `<div className="eic-login-form__submit">` lets CSS apply `width: 100%` to the button (added in Task 2).

**i18n keys:** `login_submitting` was added by plan 06-01 ("Connexion en cours…"). `login_submit` already exists in v0.1 ("Se connecter"). Do NOT add duplicates. If for any reason `login_submitting` is missing in `lib/i18n.ts` at execute time (plan 06-01 should have added it), add it now: `login_submitting: "Connexion en cours…"` (fr) and `login_submitting: "Signing in..."` (en).

For error rendering, ensure the error text uses `<p className="form-error" role="alert">{message}</p>` — semantic + screen-reader announces. If the existing pattern uses inline `style={{color: ...}}`, replace with the className. If the pattern already uses a className like `auth-error` or similar, rename to `form-error` (CSS for `.form-error` is added in Task 2).

If the form currently uses `t.login_submitting` and that key didn't exist before plan 06-01, plan 06-01 added it. Verify the import resolves.

DO NOT alter:
- The `useActionState` / `useFormState` pipeline
- The `<form action={...}>` wiring
- The input names (`email`, `password`, etc.)
- Any existing field labels (use existing `login_email` / `login_password` keys)

The behavior must be byte-identical to v0.1 (POST same fields → same redirect chain → same error code mapping).

**Part D — Rewrite `components/partner-banner.tsx`** with CONDITIONAL per-partner rendering (B2 fix). UI-SPEC line 383 mandates: "If unavailable at write time, use typographic lockups" — implying conditional fallback per partner, not unconditional removal of `next/image`. Keep the `next/image` import. Read `public/brand/partners/` first to determine which SVGs exist; for each partner, render `<Image>` if `public/brand/partners/{slug}.svg` exists, else render the typographic uppercase Montserrat 600 lockup.

**Sub-step D.0 — Detect available partner SVGs:** Use the Bash tool with `ls public/brand/partners/ 2>/dev/null` (or equivalent fs scan). Build a literal availability map at module top — example shape (executor adjusts based on actual filesystem):

```ts
// Set at write time based on `ls public/brand/partners/`. Flip a slug flag to true when its SVG exists.
const PARTNER_SVG_AVAILABLE = {
  "tamwilcom": false,
  "bank-of-africa": false,
  "innov-invest": false,
  "bluespace": false,
  "eic": false,
  "uemf": false,
} as const;
```

If the executor finds e.g. `eic.svg` and `uemf.svg` exist, set those entries to `true`. Per CONTEXT.md ("logos partenaires si non disponibles à l'ecriture, utiliser placeholders typographiques") the Phase 6 default state is most-or-all=false; operator Omar swaps later when assets land.

**Sub-step D.1 — Implementation:**

```tsx
import Image from "next/image";

const PARTNERS = [
  { slug: "tamwilcom", name: "Tamwilcom" },
  { slug: "bank-of-africa", name: "Bank of Africa Academy" },
  { slug: "innov-invest", name: "Innov Invest" },
  { slug: "bluespace", name: "Bluespace" },
  { slug: "eic", name: "EIC" },
  { slug: "uemf", name: "UEMF" },
] as const;

// Set at write time based on `ls public/brand/partners/`. Flip a slug flag to true
// once its SVG exists; default false uses the typographic lockup fallback.
const PARTNER_SVG_AVAILABLE = {
  "tamwilcom": false,
  "bank-of-africa": false,
  "innov-invest": false,
  "bluespace": false,
  "eic": false,
  "uemf": false,
} as const;

export function PartnerBanner() {
  return (
    <section aria-label="Partenaires" className="eic-partner-banner">
      {PARTNERS.map((p) => {
        const hasSvg = PARTNER_SVG_AVAILABLE[p.slug] === true;
        return (
          <span className="eic-partner" key={p.slug}>
            {hasSvg ? (
              <Image
                alt={p.name}
                height={40}
                src={`/brand/partners/${p.slug}.svg`}
                unoptimized
                width={160}
              />
            ) : (
              <span className="eic-partner__name">{p.name.toUpperCase()}</span>
            )}
          </span>
        );
      })}
    </section>
  );
}
```

**Why conditional (B2):** UI-SPEC line 383 mandates a fallback strategy per partner, not unconditional removal of `next/image`. Operator Omar can flip individual flags in `PARTNER_SVG_AVAILABLE` to `true` post-Phase 6 as each partner SVG lands in `public/brand/partners/` — no need to revisit the JSX. Existing files in `public/brand/partners/` (if any) remain intact. The `next/image` import is preserved. Acceptance criteria reflect this: `partner-banner.tsx contains import Image from "next/image"` AND `partner-banner.tsx contains a fallback typographic span class`.
  </action>
  <verify>
    <automated>node -e 'const fs=require("fs"); const lp=fs.readFileSync("app/login/page.tsx","utf8"); const okLogin=lp.includes("EICLogo") && lp.includes("eic-aurora") && lp.includes("eic-glass") && lp.includes("eic-login-shell") && lp.includes("PartnerBanner") && lp.includes("login_partners_caption") && lp.includes("login_title") && !lp.includes("auth-shell") && !lp.includes("auth-card"); if(!okLogin){console.error("login/page.tsx wiring incomplete"); process.exit(1);} const lf=fs.readFileSync("components/login-form.tsx","utf8"); if(!lf.includes("Button") || !lf.includes("@/components/ui") || !/variant="primary"/.test(lf) || !/size="lg"/.test(lf)){console.error("login-form.tsx not using Button primitive"); process.exit(1);} if(!/const\s*\[\s*state\s*,\s*formAction\s*,\s*isPending\s*\]\s*=\s*useActionState/.test(lf)){console.error("login-form.tsx must destructure 3-tuple [state, formAction, isPending] per W3 fix"); process.exit(1);} if(!lf.includes("disabled={isPending}") && !lf.includes("disabled={ isPending }")){console.error("login-form.tsx submit Button must wire disabled={isPending}"); process.exit(1);} const pb=fs.readFileSync("components/partner-banner.tsx","utf8"); if(!pb.includes("eic-partner-banner") || !pb.includes("PARTNERS")){console.error("partner-banner.tsx missing eic-partner-banner class or PARTNERS const"); process.exit(1);} if(!pb.includes("next/image") || !pb.includes("Image")){console.error("partner-banner.tsx must KEEP next/image import per B2 fix (conditional rendering)"); process.exit(1);} if(!pb.includes("eic-partner__name")){console.error("partner-banner.tsx must include typographic fallback span class"); process.exit(1);} console.log("OK");' && npm run typecheck</automated>
  </verify>
  <acceptance_criteria>
    - `app/login/page.tsx` imports `EICLogo` from `@/components/ui`
    - Contains `<div className="eic-login-shell">`, `<div aria-hidden="true" className="eic-aurora">`, `<header className="eic-login-header">`, `<section className="eic-login-card eic-glass">`, `<footer className="eic-login-partners">`
    - Contains `<EICLogo />`, `<LoginForm />`, `<PartnerBanner />`
    - Renders `<h1>{t.login_title}</h1>` and `<p className="lead">{t.login_subtitle}</p>` and `<p className="kicker">{t.brand_subtitle}</p>`
    - Contains `<p className="eic-login-partners__caption">{t.login_partners_caption}</p>`
    - Does NOT contain `auth-shell`, `auth-card`, `auth-header`, `auth-subtitle`, `auth-footer` classNames
    - `components/login-form.tsx` imports `Button` from `@/components/ui` and uses `<Button variant="primary" size="lg" type="submit" disabled={isPending}>`
    - **W3 fix:** destructures the React 19 3-tuple `const [state, formAction, isPending] = useActionState(signIn, initialState);` (NOT the 2-tuple `[state, formAction]`)
    - Submit JSX wrapped in `<div className="eic-login-form__submit">` for full-width treatment
    - Submit button label toggles `{isPending ? t.login_submitting : t.login_submit}`
    - Error rendering uses `className="form-error"` (no inline `style={{color}}`)
    - LoginForm preserves `useActionState` pipeline (same action target, same input names)
    - `lib/i18n.ts` has key `login_submitting` (added in plan 06-01) and existing `login_submit` — no duplicate adds
    - `components/partner-banner.tsx` STILL imports `Image from "next/image"` (B2 fix — conditional per-partner rendering, not unconditional removal)
    - Contains `PARTNER_SVG_AVAILABLE` literal map keyed by partner slug → boolean
    - Renders 6 partners conditionally: `<Image>` when `PARTNER_SVG_AVAILABLE[slug] === true`, else typographic `<span className="eic-partner__name">{name.toUpperCase()}</span>` fallback
    - At least the typographic fallback path is exercised (Phase 6 default state = all false unless executor finds SVGs in `public/brand/partners/`)
    - `lib/i18n.ts` adds `login_email_label` / `login_password_label` IF NOT ALREADY PRESENT (no duplicates)
    - `npm run typecheck` exits 0
  </acceptance_criteria>
  <done>/login renders branded EIC shell with EICLogo + aurora + glass card + typographic partner banner; LoginForm uses Button primitive; behavior preserved.</done>
</task>

<task type="auto">
  <name>Task 2: Append login + partner CSS classes to app/globals.css and run final build sanity (DSY-07)</name>
  <read_first>
    - app/globals.css (full file — already augmented by plans 06-01, 06-02, 06-03; APPEND below the last block)
    - .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md (Page-level Specs lines 351-383 — login layout dimensions; Build Sanity §DSY-07 lines 502-518)
    - app/login/page.tsx (just refactored — confirm the className tree to match in CSS)
    - components/partner-banner.tsx (just refactored — confirm the className tree)
  </read_first>
  <files>app/globals.css</files>
  <action>
APPEND to bottom of `app/globals.css` (after `.eic-staff-sidebar` block from plan 06-03). Add login-specific layout CSS:

```css

/* ==========================================================================
   EIC Design v2 — Login layout (DSY-06)
   Used exclusively by app/login/page.tsx.
   ========================================================================== */

.eic-login-shell {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--home-ivory);
  color: var(--home-ink);
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  overflow: hidden;
}

.eic-login-header {
  position: relative;
  z-index: 2;
  padding: 24px 24px 0;
  display: flex;
  align-items: center;
}

.eic-login-main {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.eic-login-card {
  position: relative;
  z-index: 1;
  width: min(100%, 460px);
  padding: 32px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.eic-login-card .kicker { margin: 0; }
.eic-login-card h1 { margin: 0; }
.eic-login-card .lead { margin: 0 0 var(--space-2); }

.eic-login-form__submit { display: flex; }
.eic-login-form__submit > .eic-button { width: 100%; }

.form-error {
  margin: var(--space-2) 0 0;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background: var(--wf-rose-tint);
  border: 1px solid #DCB1B1;
  color: var(--wf-rose);
  font-size: 14px;
}

.eic-login-partners {
  position: relative;
  z-index: 2;
  padding: 24px 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}
.eic-login-partners__caption {
  margin: 0;
  font-family: var(--font-body), Montserrat, system-ui, sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--eic-green);
  text-align: center;
}

.eic-partner-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px 28px;
  max-width: 920px;
  width: 100%;
}
.eic-partner {
  display: inline-flex;
  align-items: center;
  height: 40px;
}
.eic-partner__name {
  font-family: var(--font-heading), Baskervville, Georgia, serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--home-muted-strong);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .eic-login-main { padding: 24px 16px; }
  .eic-login-card { padding: 24px; }
  .eic-login-partners { padding: 16px 16px 24px; }
  .eic-partner-banner { gap: 12px 20px; }
  .eic-partner__name { font-size: 12px; }
}
```

**Why exact values:**
- `position: relative; overflow: hidden` on shell so absolute aurora doesn't leak.
- z-index: aurora 0 (own CSS), header/footer 2, main+card 1.
- Card width `min(100%, 460px)` — UI-SPEC line 380.
- Card padding 32px desktop / 24px mobile — UI-SPEC line 380.
- `.eic-login-partners__caption` uses kicker-style typography (12px / 0.18em tracking / green).
- `.eic-partner__name` in Baskervville 14px 700 tracked 0.1em — UI-SPEC line 383.
- Mobile <640px reduces paddings + font sizes (UI-SPEC line 382).
- `.form-error` uses rose tone tokens.

DO NOT modify any CSS rule above this block.

**Build sanity (DSY-07)** — Run the verification trio. The verify command at the bottom runs them. If `npm run lint` flags warnings on Phase 6 modified files, fix them. If pre-existing v0.1 warnings appear, document in SUMMARY but don't fix in scope.

If `npm run build` fails due to font network unavailability (sandbox limitation), document and stop — operator Omar resolves before continuing.
  </action>
  <verify>
    <automated>node -e 'const c=require("fs").readFileSync("app/globals.css","utf8"); const checks=[[".eic-login-shell {","login shell"],["min-height: 100vh","full viewport"],["background: var(--home-ivory)","ivory bg"],[".eic-login-header {","header"],[".eic-login-main {","main"],[".eic-login-card {","card"],["width: min(100%, 460px)","card width"],["border-radius: var(--radius-lg)","card radius lg"],[".form-error {","error styling"],["var(--wf-rose-tint)","rose tint"],[".eic-login-partners {","partners footer"],[".eic-login-partners__caption","caption"],[".eic-partner-banner {","banner layout"],[".eic-partner__name","typographic"],["var(--font-heading)","baskervville"],["@media (max-width: 640px)","responsive"],["--brand-primary","legacy preserved"]]; const failed=[]; for(const [needle,desc] of checks){if(!c.includes(needle)) failed.push(desc+": "+needle);} if(failed.length){console.error(failed.join("\n")); process.exit(1);} if(!c.includes(".eic-glass {") || !c.includes(".eic-button {") || !c.includes(".eic-staff-sidebar {")){console.error("CSS from prior plans missing!"); process.exit(1);} console.log("css OK");' && npm run typecheck && npm run lint && npm run build</automated>
  </verify>
  <acceptance_criteria>
    - `app/globals.css` contains `.eic-login-shell {` with `position: relative`, `min-height: 100vh`, `background: var(--home-ivory)`, `overflow: hidden`
    - Contains `.eic-login-header {`, `.eic-login-main {`, `.eic-login-card { ... width: min(100%, 460px); padding: 32px; border-radius: var(--radius-lg) }`
    - Contains `.eic-login-form__submit > .eic-button { width: 100% }` (full-width primary CTA)
    - Contains `.form-error {` with rose tint background
    - Contains `.eic-login-partners {` and `.eic-login-partners__caption { ... color: var(--eic-green); letter-spacing: 0.18em; text-transform: uppercase }`
    - Contains `.eic-partner-banner {` with `flex-wrap: wrap` and `gap: 16px 28px`
    - Contains `.eic-partner__name { font-family: var(--font-heading) ... font-weight: 700 ... letter-spacing: 0.1em }`
    - Contains `@media (max-width: 640px)` block adjusting padding + font-size
    - STILL contains all CSS from prior plans (`.eic-glass`, `.eic-aurora`, `.eic-button`, `.eic-pill`, `.eic-level-badge`, `.eic-progress`, `.eic-logo`, `.eic-shell`, `.eic-topbar`, `.eic-mobile-tabbar`, `.eic-staff-sidebar`)
    - STILL contains `--brand-primary`, `.app-shell`, `.sidebar` legacy rules
    - `npm run typecheck` exits 0
    - `npm run build` exits 0 (no font fetch errors, no missing module errors)
  </acceptance_criteria>
  <done>Login + partner CSS appended to globals.css; build trio (typecheck/lint/build) passes; phase 6 ships clean.</done>
</task>

<task type="auto">
  <name>Task 3: Cross-plan grep audit + write SMOKE-PHASE-06.md operator checklist</name>
  <read_first>
    - app/login/page.tsx (verify post-Task-1 state)
    - app/layout.tsx (verify post-plan-06-01 state)
    - app/eic-tokens.css (verify exists post-plan-06-01)
    - app/globals.css (verify all 4 plans' additions present)
    - components/app-shell.tsx, components/topbar-lite.tsx, components/mobile-tab-bar.tsx (verify post-plan-06-03 state)
    - components/ui/index.ts (verify barrel from plan 06-02)
    - .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-UI-SPEC.md (Build Sanity §DSY-07 lines 502-518 — manual smoke checklist source)
  </read_first>
  <files>.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/SMOKE-PHASE-06.md</files>
  <action>
Final cross-cutting verification + write SMOKE-PHASE-06.md operator checklist (parallels v0.1 SMOKE.md from Phase 2).

**Step 1 — Cross-plan grep audit.** The verify command runs ~30 grep checks. Each MUST pass; if any fails, halt and report the missing artifact. The audit confirms plans 06-01..06-03 outputs survived through plan 06-04's edits.

**Step 2 — Write SMOKE-PHASE-06.md** at `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/SMOKE-PHASE-06.md`. Contents (markdown body — note that triple-backticks below are written literally to the file):

```
# Phase 6 SMOKE — EIC Design v2 Foundation

**Run AFTER all 4 plans (06-01..06-04) execute and commit.**
Operator: Omar. Time budget: ~10 minutes on local dev.

## Setup

```bash
npm run dev
# Wait for "Ready on http://localhost:3000"
```

## Checklist

### /login (DSY-06)
- [ ] Background is ivory/cream (#F6F1E8 family), not white, not slate
- [ ] EICLogo lockup top-left: square blue mark with white serif "E" + green dot bottom-right, then "EIC" + "INNOVATION CENTER" kicker
- [ ] Title in serif (Baskervville) — NOT Inter/system sans
- [ ] Subtitle (.lead class) in Montserrat 20px muted
- [ ] Glass card centered, max-width 460px, slightly translucent (aurora visible behind it)
- [ ] Submit button is solid blue (#1B3A5C), full-width, label "Se connecter"
- [ ] Partner banner anchored bottom: 6 names in serif uppercase (TAMWILCOM / BANK OF AFRICA ACADEMY / INNOV INVEST / BLUESPACE / EIC / UEMF)
- [ ] Caption below banner in green uppercase tracking
- [ ] Submit a credential — login behavior identical to v0.1 (correct redirect or i18n error message)

### /journey — Player variant (DSY-05)
- [ ] NO sidebar visible — TopbarLite at top with EICLogo + brand text + "Mon parcours" link + logout button
- [ ] Resize browser to <1100px → bottom tab bar appears with single "Parcours" tab
- [ ] Resize back >=1100px → bottom tab bar disappears

### /onboarding — Player variant + hideTabBar (DSY-05)
- [ ] TopbarLite visible at top
- [ ] NO bottom tab bar even at viewport <1100px

### /admin, /mentor, /jury, /results — Staff variant (DSY-05)
- [ ] Sidebar visible (left column 276px)
- [ ] Sidebar background = deep blue #1B3A5C (--eic-blue), NOT slate #0B2545 (--brand-primary)
- [ ] All v0.1 page contents render unchanged (no functional regression)

### Backdrop-filter fallback (DSY-03)
- [ ] DevTools → Rendering → "Emulate CSS feature: backdrop-filter" → set to "unsupported" (or use Chrome <90 UA)
- [ ] Refresh /login → glass card becomes opaque white (~92%); form fully usable, no transparency-induced unreadability

### Font self-hosting (DSY-02)
- [ ] DevTools → Network tab → reload /login
- [ ] NO request to fonts.googleapis.com
- [ ] Font files served from /_next/static/media/...woff2 (Baskervville + Montserrat)

### Reduced motion (DSY-04)
- [ ] DevTools → Rendering → emulate prefers-reduced-motion: reduce
- [ ] (Phase 6 has no LevelBadge in production yet — this check applies once Phase 7 ships PLR-01-02. Note: when testable later, the LevelBadge.is-current pulse must NOT animate.)

### Build artifacts (DSY-07)
```bash
npm run typecheck   # exit 0
npm run lint        # no NEW warnings vs v0.1-pilot-ready baseline
npm run build       # succeeds
```

## Verdict

- [ ] All boxes ticked → Phase 6 PASS, proceed to /gsd-execute-phase 7
- [ ] Any unchecked → describe regression, run /gsd-plan-phase 6 --gaps
```

**Important — when writing this file:** the markdown body above contains triple-backtick fenced code blocks. Use the Write tool to create the file with that content verbatim — do NOT escape the backticks. The fenced code blocks are part of the smoke checklist content for Omar's reference.

This SMOKE.md persists in the phase folder so Omar can re-run anytime as a regression smoke (especially after Phases 7-9 modify journey/admin pages).

DO NOT modify any source file in this task — final cross-cutting verification + documentation only.
  </action>
  <verify>
    <automated>node -e 'const fs=require("fs"); const path=require("path"); const checks=[["app/eic-tokens.css","--eic-blue: #1B3A5C"],["app/layout.tsx","next/font/google"],["app/layout.tsx","Baskervville"],["app/layout.tsx","Montserrat"],["app/globals.css",".eic-glass {"],["app/globals.css","@supports not (backdrop-filter"],["app/globals.css",".eic-aurora {"],["app/globals.css",".eic-button {"],["app/globals.css",".eic-pill {"],["app/globals.css",".eic-level-badge {"],["app/globals.css",".eic-progress {"],["app/globals.css",".eic-logo {"],["app/globals.css",".eic-shell {"],["app/globals.css",".eic-topbar {"],["app/globals.css",".eic-mobile-tabbar"],["app/globals.css",".eic-staff-sidebar {"],["app/globals.css",".eic-login-shell {"],["app/globals.css",".eic-login-card {"],["app/globals.css",".eic-partner-banner {"],["app/globals.css","--brand-primary"],["app/globals.css",".app-shell {"],["app/globals.css",".sidebar {"],["components/ui/button.tsx","export function Button"],["components/ui/pill.tsx","export function Pill"],["components/ui/level-badge.tsx","export function LevelBadge"],["components/ui/progress-bar.tsx","export function ProgressBar"],["components/ui/eic-logo.tsx","export function EICLogo"],["components/ui/index.ts","export { Button"],["components/topbar-lite.tsx","eic-topbar"],["components/mobile-tab-bar.tsx","eic-mobile-tabbar"],["components/app-shell.tsx","AppShellVariant"],["app/login/page.tsx","EICLogo"],["app/login/page.tsx","eic-aurora"],["components/partner-banner.tsx","next/image"],["components/partner-banner.tsx","PARTNER_SVG_AVAILABLE"],["components/partner-banner.tsx","eic-partner__name"]]; const fail=[]; for(const [f,needle] of checks){if(!fs.existsSync(f)){fail.push(f+" MISSING"); continue;} const c=fs.readFileSync(f,"utf8"); if(!c.includes(needle)) fail.push(f+" missing: "+needle);} const dirs=["app","components","lib"]; for(const d of dirs){const walk=(pp)=>{for(const e of fs.readdirSync(pp,{withFileTypes:true})){const fp=path.join(pp,e.name); if(e.isDirectory()) walk(fp); else if(/\.(ts|tsx|css)$/.test(e.name)){const cc=fs.readFileSync(fp,"utf8"); if(cc.includes("fonts.googleapis.com")) fail.push(fp+" contains fonts.googleapis.com");}}}; walk(d);} const loginContent=fs.readFileSync("app/login/page.tsx","utf8"); if(loginContent.includes("auth-shell") || loginContent.includes("auth-card")) fail.push("app/login/page.tsx still contains legacy auth-* className"); const smokePath=".planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/SMOKE-PHASE-06.md"; if(!fs.existsSync(smokePath)) fail.push("SMOKE-PHASE-06.md not created"); else {const sc=fs.readFileSync(smokePath,"utf8"); if(!sc.includes("Phase 6 SMOKE") || !sc.includes("/login (DSY-06)") || !sc.includes("/journey") || !sc.includes("npm run typecheck")) fail.push("SMOKE-PHASE-06.md missing required sections");} if(fail.length){console.error(fail.join("\n")); process.exit(1);} console.log("All cross-plan checks OK");'</automated>
  </verify>
  <acceptance_criteria>
    - All 33 cross-plan grep checks pass (every artifact from plans 06-01..06-04 still present)
    - No file under `app/`, `components/`, `lib/` contains the substring `fonts.googleapis.com`
    - `app/login/page.tsx` no longer contains `auth-shell` or `auth-card` (legacy classes removed)
    - File `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/SMOKE-PHASE-06.md` exists with sections for /login, /journey, /onboarding, staff variants, backdrop-filter fallback, font self-hosting, build artifacts
    - SMOKE.md contains the operator commands (`npm run dev`, `npm run typecheck`, `npm run lint`, `npm run build`)
    - `components/ui/{button,pill,level-badge,progress-bar,eic-logo}.tsx` and `index.ts` all exist
    - Legacy v0.1 tokens still present: `--brand-primary`, `.app-shell {`, `.sidebar {` rules in `app/globals.css`
  </acceptance_criteria>
  <done>Cross-plan grep audit passes; SMOKE-PHASE-06.md operator checklist persisted; phase 6 ready for human-eye smoke pre-Phase-7.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| User credentials → POST to /login server action | Existing v0.1 auth flow preserved bit-for-bit; this plan only changes presentational chrome. |
| Partner banner copy | Static literals; no dynamic content, no user input. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-13 | Tampering | XSS via login error message rendered in `.form-error` | accept | Error message strings are sourced from i18n dictionary or Supabase auth `error.message`; React escapes by default. No `dangerouslySetInnerHTML`. Uses semantic `role="alert"`. Severity info. |
| T-06-14 | Information Disclosure | Partner banner text leaking via screen reader | accept | Section has `aria-label="Partenaires"`. Static copy. No PII. Severity info. |
| T-06-15 | Denial of Service | Glass effect (backdrop-filter) crashes legacy Android Chrome | mitigate | `@supports not (backdrop-filter)` fallback (plan 06-01) emits opaque rgba. Login still functions. Verified by SMOKE-PHASE-06.md operator step. |
| T-06-16 | Tampering | EICLogo SVG injecting markup | accept | Static inline SVG with literal title; no user-controlled attribute. |
| T-06-17 | Spoofing | Phishing site cloning new EIC chrome | accept | Out of scope (DNS / CSP concerns). Production uses HTTPS + entrepreneur-game-six.vercel.app domain; no new attack surface from this refactor. |
</threat_model>

<verification>
After all 3 tasks complete:

1. Automated trio (Task 2 verify): `npm run typecheck` → 0; `npm run lint` → no NEW warnings; `npm run build` → succeeds.
2. Cross-plan grep audit (Task 3 verify): all 33 checks pass; no `fonts.googleapis.com` in source; no legacy `auth-shell` in login page.
3. SMOKE-PHASE-06.md exists (operator checklist).
4. Build artifact check: `ls .next/static/media/ | grep -E "Baskerv|Montserrat"` shows self-hosted fonts.
5. v0.1 not broken — visiting /journey, /mentor, /admin, /jury, /results in dev mode renders existing content under the new shell with new EIC palette but no functional regression.
6. Operator (Omar) will run SMOKE-PHASE-06.md manually pre-Phase 7.
</verification>

<success_criteria>
- DSY-06 ✓: /login uses ivory bg + aurora + EICLogo top-left + glass card + partner banner footer; primary submit uses `<Button variant="primary" size="lg">`; partner banner shows typographic placeholders for missing SVGs (CONTEXT.md sanctioned)
- DSY-07 ✓: `npm run typecheck`, `npm run lint`, `npm run build` all pass; no `@import url(fonts...)` remains in source
- v0.1 functional behavior preserved on /login (auth pipeline unchanged), /journey, /mentor, /admin, /jury, /results
- SMOKE-PHASE-06.md persisted as operator regression checklist
- Plan 06-04 closes Phase 6 — all DSY-01..07 covered across 4 plans
</success_criteria>

<output>
After completion, create `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-04-SUMMARY.md` recording: login layout final structure, partner banner typographic stub decision (acknowledged operator action item: replace with real SVGs post-Phase 6), build trio verdict + warning baseline diff, SMOKE-PHASE-06.md location, any deferred items. Update STATE.md to reflect Phase 6 complete and unblock Phase 7.
</output>
