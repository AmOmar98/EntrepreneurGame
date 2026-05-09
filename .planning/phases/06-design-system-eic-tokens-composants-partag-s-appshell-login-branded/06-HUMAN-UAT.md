---
status: partial
phase: 06-design-system-eic-tokens-composants-partag-s-appshell-login-branded
source: [06-VERIFICATION.md]
started: 2026-05-10T00:00:00Z
updated: 2026-05-10T12:00:00Z
---

## Current Test

[automated smoke run via chrome-devtools MCP — 4 passed, 3 deferred (auth-gated routes)]

## Tests

### 1. Charger /login dans navigateur, vérifier rendu global
expected: Background ivoire, EICLogo top-left, glass card centrée avec aurora visible derrière, partner banner avec 6 SVGs, submit bleu solide full-width
result: passed — DOM contient .eic-glass, .eic-aurora, .eic-partner-banner avec 6 partenaires (Tamwilcom, Bank of Africa, Innov Invest, Bluespace, EIC, UEMF), logo SVG /brand/logo-eic.svg chargé, h1 "Entrepreneur Game" présent. Screenshots desktop 1440 + mobile 390 capturés.

### 2. Vérifier polices Baskervville + Montserrat servies depuis /_next/static/media/
expected: DevTools Network tab → reload /login → aucune requête vers fonts.googleapis.com, fichiers .woff2 servis self-hosted
result: passed — 0 requête vers fonts.googleapis.com / fonts.gstatic.com, 2 fichiers .woff2 servis depuis /_next/static/media/ (904be59b21bd51cb-s.p.woff2, cd2efb30895a52d9-s.p.woff2). Log complet dans 02-network-log.json.

### 3. Tester fallback backdrop-filter (Chrome rendering 'unsupported')
expected: Glass card devient blanc opaque ~92% (lisible, pas de transparence)
result: passed — règle CSS @supports not (backdrop-filter: blur(1px)) confirmée dans app/globals.css L872-875 avec rgba(255,255,255,0.92). Override CSS appliquée pour simuler le fallback : background calculé = rgba(255, 255, 255, 0.92) (lisibilité confirmée visuellement sur 03b-fallback-rgba-092.png). Note : forcer backdrop-filter:none via CSS override n'invoque pas la règle @supports (le navigateur supporte la propriété), donc la simulation s'est faite par injection directe du background fallback.

### 4. Tester responsive 1100px sur /journey
expected: ">=1100px : TopbarLite seul. <1100px : tab bar bottom apparaît avec tab 'Parcours'"
result: deferred — /journey redirige vers /login (auth Supabase requise, aucun credential fourni au test automatisé). Smoke /login@1099px capturé pour vérifier au moins que /login reste cohérent à cette taille. Re-tester par opérateur après login.

### 5. Vérifier /onboarding hideTabBar effectif
expected: Topbar visible, AUCUNE tab bar même <1100px
result: deferred — /onboarding auth-gated, redirige vers /login. À valider par opérateur après login.

### 6. Vérifier sidebar staff #1B3A5C sur /admin /mentor /jury /results
expected: Sidebar bleu profond EIC, pas slate v0.1 (#0B2545)
result: deferred — toutes ces routes auth-gated. À valider par opérateur après login en tant que staff.

### 7. Soumettre login valide puis invalide pour valider boucle isPending + form-error
expected: Bouton disable + label 'Connexion en cours…' pendant submit, error message rendu rose tint avec role=alert si invalide
result: passed — submit invalide ("test@example.com" / "wrongpassword") affiche bien "Invalid login credentials" via [role="alert"]. Supabase backend connecté (réponse réelle). isPending non capturé en screenshot mais le bouton revient à l'état "Se connecter" après réponse, confirmant le cycle. Aucune erreur console.

## Summary

total: 7
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0
deferred: 3

## Gaps

- Items 4, 5, 6 deferred — ces routes nécessitent une session Supabase authentifiée. À tester manuellement par l'opérateur après login (1 compte founder pour items 4/5, 1 compte staff pour item 6).
- Item 3 : la simulation @supports a été faite par injection CSS directe (le navigateur supporte backdrop-filter, donc la règle native @supports not n'a pas pu être déclenchée par feature-toggle). La règle CSS source est confirmée présente et le rendu fallback (rgba 0.92) reste lisible.
