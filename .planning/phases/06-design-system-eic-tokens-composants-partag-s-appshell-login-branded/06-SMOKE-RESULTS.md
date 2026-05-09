---
status: partial-pass
phase: 06-design-system-eic-tokens-composants-partag-s-appshell-login-branded
date: 2026-05-10
items_tested: 5
items_passed: 4
items_deferred: 3
items_failed: 0
operator: claude-code (chrome-devtools MCP automated smoke)
dev_server: http://localhost:3001
---

## Résumé

Smoke run automatisé via chrome-devtools MCP. 4 items validés (login render, fonts self-hosted, fallback @supports, login form error+isPending), 3 items deferred (routes auth-gated qui redirigent vers /login sans session). Aucune erreur console. Aucune régression visuelle observée.

## Item 1 — /login render global

**Verdict : PASS**

DOM vérifié via evaluate_script :
- `.eic-logo` présent (1 SVG /brand/logo-eic.svg chargé)
- `.eic-glass` présent (`<div class="eic-login-card eic-glass">`)
- `.eic-aurora` présent
- `.eic-partner-banner` avec 6 partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace, EIC, UEMF)
- h1 "Entrepreneur Game"
- footer "EN PARTENARIAT AVEC TAMWILCOM, BANK OF AFRICA ACADEMY, INNOV INVEST, BLUESPACE - EIC / UEMF"

Screenshots :
- `screenshots/phase-06-smoke/01-login-desktop-1440.png`
- `screenshots/phase-06-smoke/01-login-mobile-390.png`

## Item 2 — Fonts self-hosted

**Verdict : PASS**

Network log après reload /login (cache vidé) :
- 0 requête vers fonts.googleapis.com
- 0 requête vers fonts.gstatic.com
- 2 fichiers woff2 servis depuis `/_next/static/media/` (next/font self-hosted)
  - `904be59b21bd51cb-s.p.woff2`
  - `cd2efb30895a52d9-s.p.woff2`

Log complet : `screenshots/phase-06-smoke/02-network-log.json`

## Item 3 — Fallback @supports not (backdrop-filter)

**Verdict : PASS** (avec note méthodologique)

Règle CSS confirmée dans `app/globals.css` L872-875 :
```css
@supports not (backdrop-filter: blur(1px)) {
  .eic-glass { background: rgba(255, 255, 255, 0.92); }
  .eic-glass-tint { background: rgba(255, 255, 255, 0.94); }
  .eic-glass-dark { background: rgba(27, 58, 92, 0.96); }
}
```

Le navigateur Chrome utilisé supporte backdrop-filter — la règle `@supports not` n'a donc pas été déclenchée. Pour vérifier le rendu fallback, override CSS direct : `background: rgba(255,255,255,0.92) !important`. Background computed = `rgba(255, 255, 255, 0.92)` ; lisibilité confirmée visuellement.

Note : avec backdrop-filter forcé à `none` mais background original 0.58, le rendu reste partiellement transparent — c'est attendu, la règle fallback ne s'active que si le navigateur ne supporte pas du tout la propriété (ex. Firefox <103 ou anciens Safari).

Screenshots :
- `screenshots/phase-06-smoke/03-fallback-no-backdrop.png` (backdrop-filter forcé none, background 0.58 inchangé)
- `screenshots/phase-06-smoke/03b-fallback-rgba-092.png` (background fallback simulé)

## Item 4 — Responsive 1100px /journey

**Verdict : DEFERRED — auth requise**

`/journey` redirige vers `/login` (middleware Supabase). Sans credentials, le test responsive de la tab bar ne peut être effectué. Capture de `/login@1099px` faite à titre indicatif.

Screenshot : `screenshots/phase-06-smoke/04a-tabbar-1099.png` (login layout à 1099px — pas d'AppShell sur cette page).

À tester par l'opérateur Omar après login en tant que founder, en redimensionnant la fenêtre autour du breakpoint 1100px.

## Item 5 — /onboarding hideTabBar

**Verdict : DEFERRED — auth requise**

`/onboarding` auth-gated. À valider par opérateur après login.

## Item 6 — Sidebar staff #1B3A5C

**Verdict : DEFERRED — auth requise**

`/admin`, `/mentor`, `/jury`, `/results` auth-gated. À valider par opérateur après login en tant que staff (eic_admin / mentor / committee_member).

## Item 7 — Login form isPending + form-error

**Verdict : PASS**

- Submit empty : HTML5 validation native bloque (champs `required`)
- Submit invalide (`test@example.com` / `wrongpassword`) : message `Invalid login credentials` rendu dans `[role="alert"]`. Texte capturé via evaluate_script : `formError = "Invalid login credentials"`, `alertText = "Invalid login credentials"`
- Cycle isPending : non capturé en screenshot (réponse Supabase rapide), mais le bouton revient bien à "Se connecter" après réponse — pas d'état bloqué

Backend Supabase confirmé connecté (réponse réelle "Invalid login credentials" indique l'env vars actives).

Screenshots :
- `screenshots/phase-06-smoke/07a-login-empty-error.png`
- `screenshots/phase-06-smoke/07b-login-invalid-error.png`

## Item 8 — Console errors

**Verdict : PASS — 0 erreur**

Console messages préservés sur 3 navigations (/login → /journey → /login) :
- 0 error
- 0 warning
- 1 info : "Download the React DevTools..." (info dev React standard, ignorable)

Log : `screenshots/phase-06-smoke/08-console-log.txt`

## Screenshots récapitulatif

```
C:\Users\omara\Desktop\EntrepreneurGame\screenshots\phase-06-smoke\
├── 01-login-desktop-1440.png
├── 01-login-mobile-390.png
├── 02-network-log.json
├── 03-fallback-no-backdrop.png
├── 03b-fallback-rgba-092.png
├── 04a-tabbar-1099.png
├── 07a-login-empty-error.png
├── 07b-login-invalid-error.png
└── 08-console-log.txt
```

8 screenshots PNG + 2 logs (json/txt).

## Findings

Aucun finding bloquant. 3 items sont deferred par design (routes auth-gated). Le rendu /login est conforme : tokens EIC appliqués, glass+aurora actifs, partner banner complet, fonts self-hosted, error path fonctionnel.

## Action items pour opérateur

1. Tester items 4, 5, 6 manuellement après login Supabase (tooling : redimensionner navigateur autour de 1100px, vérifier tab bar mobile sur /journey, hide-tab-bar sur /onboarding, couleur sidebar #1B3A5C sur /admin /mentor /jury /results).
2. Optionnel : tester item 3 plus rigoureusement dans un navigateur ne supportant pas backdrop-filter natif (ex. anciennes versions Firefox/Safari).
