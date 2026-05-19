---
phase: 04-gamemaster-bulk-import-branding-page-accueil
plan: 05
subsystem: branding-auth-shell
tags: [branding, login, partner-banner, eic, uemf, css-tokens, auth-shell]
requires:
  - lib/auth.ts (getCurrentUser, getCurrentRole, pathForRole, redirectForRole)
  - lib/i18n.ts dictionaries
  - app/actions.ts signIn server action
provides:
  - EIC brand tokens (CSS variables) consumed by AppShell + auth-card + partner-banner
  - components/partner-banner.tsx (server component)
  - components/login-form.tsx (client component, useActionState)
  - public/brand/logo-eic.svg + 6 partner placeholder SVGs
  - Polished /login page (logo, card, partner banner, footnote)
  - AppShell header with EIC logo
affects:
  - app/login/page.tsx (now server component shell)
  - app/layout.tsx metadata
  - components/app-shell.tsx (logo replaces text)
  - app/globals.css (new tokens + utilities)
tech-stack:
  added: []
  patterns:
    - "Server component shell + extracted client form (login)"
    - "next/image with unoptimized for SVG placeholders"
    - "CSS custom properties for brand tokens layered above legacy tokens"
key-files:
  created:
    - components/partner-banner.tsx
    - components/login-form.tsx
    - public/brand/logo-eic.svg
    - public/brand/partners/tamwilcom.svg
    - public/brand/partners/bank-of-africa.svg
    - public/brand/partners/innov-invest.svg
    - public/brand/partners/bluespace.svg
    - public/brand/partners/eic.svg
    - public/brand/partners/uemf.svg
    - public/brand/partners/README.md
  modified:
    - app/globals.css
    - app/layout.tsx
    - app/login/page.tsx
    - components/app-shell.tsx
    - lib/i18n.ts
decisions:
  - "Conserve les tokens CSS legacy (--bg, --green, --line, etc.) en plus des nouveaux --brand-* pour ne pas casser les composants existants (admin, journey, mentor) ; la sidebar adopte var(--brand-primary) pour cohesion avec le logo."
  - "PartnerBanner = server component pur ; LoginForm extrait comme client subcomponent (useActionState) ; LoginPage = server component shell, ce qui simplifie le rendu du logo via next/image et evite un hydration overhead."
  - "Logo et partenaires sont des SVG inline-text (pas de marque deposee). README.md dans public/brand/partners/ documente le remplacement avant deploy."
  - "app/page.tsx etait deja conforme (redirectForRole) ; aucune modification necessaire."
  - "Les commentaires anti-fuite mentionnant 'atlas-soil' dans lib/seed/*.ts sont conserves : ils sont des gardes documentaires pour empecher la reintroduction du nom, jamais rendus dans l'UI ou les metadata."
metrics:
  duration: "3m"
  tasks: 3
  files-changed: 14
  completed: 2026-05-08
---

# Phase 4 Plan 5: Branding EIC + Partner Banner + Login Polish Summary

Identite visuelle EIC professionnelle deployee : palette tokens, logo dans le header AppShell, page `/login` redessinee avec card + bandeau 6 partenaires, metadata propre, zero mention "EIC Venture Journey" dans l'app/components/lib/public.

## Objectives Achieved

- **BRAND-01** : logo EIC dans AppShell sur toutes les pages auth (player / mentor / game_master).
- **BRAND-02** : bandeau 6 partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace, EIC, UEMF) sur `/login`.
- **BRAND-03** : palette EIC tokens (`--brand-primary` #0B2545, `--brand-accent` #C9A227, `--brand-bg`, etc.) en place via `:root`. Sidebar bascule a `var(--brand-primary)`.
- **BRAND-04** : 5 ecrans cles (login + onboarding + journey + mentor + admin) heritent automatiquement de la sidebar EIC + des tokens nouveaux ; auth-card / partner-banner specifiques au login.
- **BRAND-05** : `app/layout.tsx` metadata = "Entrepreneur Game - EIC / UEMF" ; aucune occurrence "EIC Venture Journey" ni "atlas-soil" dans l'UI ou les metadata.
- **AUTH-02 (root redirect)** : `app/page.tsx` etait deja correct (`redirectForRole()` -> `/login` ou `/journey|/mentor|/admin`).

## Tasks Completed

| Task | Name | Commit | Key files |
|------|------|--------|-----------|
| 1 | Establish EIC brand tokens, logos, and global polish | `11ff65a` | app/globals.css, app/layout.tsx, public/brand/* (8 SVGs + README) |
| 2 | Build PartnerBanner component + polish login page | `f1fd13b` | components/partner-banner.tsx, components/login-form.tsx, app/login/page.tsx, lib/i18n.ts |
| 3 | Brand AppShell header + root redirect | `50c6ddd` | components/app-shell.tsx |

## Implementation Notes

### Brand tokens layered above legacy
Les tokens `--brand-*` sont ajoutes au sommet de `:root` ; les tokens existants (`--bg`, `--green`, `--line`...) sont prefaces du commentaire `/* Legacy tokens */` mais conserves intacts. Cela garantit que les ecrans deja construits (admin cohort, journey, mentor) continuent de rendre sans regression visuelle, tout en permettant aux nouveaux composants (auth-card, partner-banner, brand-logo) d'utiliser la palette EIC.

### Login = server shell + client form
La page `/login` est passee de full client a server component shell qui delegue le formulaire a `components/login-form.tsx` (`"use client"`, `useActionState(signIn, ...)`). Cela permet :
- Rendu du logo via `next/image` avec `priority` (LCP optimal).
- Inclusion de `<PartnerBanner />` (server component) directement dans le shell.
- Footnote `t.login_partners_caption` rendu cote serveur.

### SVG placeholders
Tous les logos partenaires sont des **placeholders textuels** (rectangle gris clair `#F4F5F7`, texte centre, `<title>` accessible). Aucune marque deposee. README documente la substitution avant deploy. `next/image unoptimized` evite que Next ne tente de re-encoder ces fichiers triviaux.

### Metadata title.template
`app/layout.tsx` adopte la forme objet : `title: { default: "Entrepreneur Game - EIC / UEMF", template: "%s - Entrepreneur Game" }`. Les pages internes peuvent desormais surcharger via leurs propres `metadata`.

## Deviations from Plan

### Auto-fixed Issues
None - plan executed substantially as written.

### Intentional Adjustments

**1. [Plan suggestion - kept as-is] app/page.tsx**
- **Found during:** Task 3 read.
- **Plan said:** Convert root to redirect using `getCurrentUser` + `getCurrentRole` + `pathForRole`.
- **Reality:** `app/page.tsx` was already implemented exactly as the plan envisioned via the helper `redirectForRole()` from `lib/auth.ts`. No modification needed.
- **Outcome:** Step 2 of Task 3 was a no-op ; documented here for traceability.

**2. [Scope decision] lib/seed/*.ts comments mentioning "atlas-soil"**
- **Found during:** final audit.
- **Issue:** 5 occurrences remain — but they are **anti-leak guard comments** (documentation telling future devs not to reintroduce that name). They are never rendered in UI/metadata.
- **Decision:** keep them. Removing them would weaken the BRAND-05 guard.

## Authentication Gates
None — no auth required during this plan.

## Verification

- `npx tsc --noEmit` : clean.
- `npx next lint` : clean (`No ESLint warnings or errors`).
- `npx next build` : success, all 13 routes compiled, `/login` static (4.46 kB).
- Manual audit `grep -rn "atlas-soil\|EIC Venture Journey" app components lib public` : 0 matches outside `lib/seed/*.ts` guard comments.
- Manual audit `app/layout.tsx` metadata : "Entrepreneur Game - EIC / UEMF" confirmed.

## Known Stubs

- `public/brand/logo-eic.svg` : text-only SVG placeholder until Omar drops the official EIC logo. Not blocking — accessible `<title>` present, EIC navy + UEMF gold accent already applied.
- `public/brand/partners/*.svg` (6 files) : text-only placeholders. Replacement procedure documented in `public/brand/partners/README.md`. Filenames must stay identical to avoid touching `components/partner-banner.tsx`.

These stubs are intentional and tracked. They do NOT prevent the plan's goal (institutional credibility scaffolding). Final logo assets are an Omar-side action, not a code task.

## Threat Flags
None — no new trust boundaries or security-relevant surfaces introduced. Per the threat model in PLAN.md:
- T-04-01 (Information disclosure on `/`) : mitigated via the existing `redirectForRole()` (server-side `redirect()`).
- T-04-02 (Tampering on partner SVGs) : accepted, static public assets.
- T-04-03 (Branding metadata repudiation) : accepted, no security implication.

## Self-Check: PASSED

Files verified present:
- FOUND: components/partner-banner.tsx
- FOUND: components/login-form.tsx
- FOUND: public/brand/logo-eic.svg
- FOUND: public/brand/partners/tamwilcom.svg
- FOUND: public/brand/partners/bank-of-africa.svg
- FOUND: public/brand/partners/innov-invest.svg
- FOUND: public/brand/partners/bluespace.svg
- FOUND: public/brand/partners/eic.svg
- FOUND: public/brand/partners/uemf.svg
- FOUND: public/brand/partners/README.md

Commits verified:
- FOUND: 11ff65a (Task 1)
- FOUND: f1fd13b (Task 2)
- FOUND: 50c6ddd (Task 3)
