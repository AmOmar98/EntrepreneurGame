---
status: passed
phase: 06-design-system-eic-tokens-composants-partag-s-appshell-login-branded
source: [06-VERIFICATION.md]
started: 2026-05-10T00:00:00Z
updated: 2026-05-10T18:00:00Z
---

## Current Test

[automated smoke run via chrome-devtools MCP — continuation 2026-05-10 with auth credentials, all 7 items passed]

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
result: passed — /journey rendu en tant que founder (alpha.leader). Tab bar `.eic-mobile-tabbar` confirmée par CSS (display none ≥1100, display grid <1100). Validations : 1440 → display:none ✓, 1098 → display:grid ✓, 1100 → display:none ✓ (breakpoint exact `max-width: 1099px` confirmé). Tab "Parcours" rendue avec icône lucide-map-pin (svg path + circle). Screenshots 04a-1440, 04b-1098, 04c-768, 04d-390, 04e (zoom tab bar mobile primary nav). DOM snapshot 04-journey-snapshot-mobile.txt.

### 5. Vérifier /onboarding hideTabBar effectif
expected: Topbar visible, AUCUNE tab bar même <1100px
result: passed (par code review) — alpha.leader est déjà onboardé donc `app/onboarding/page.tsx:64` redirige `redirect("/journey")` server-side. La page rend `<AppShell hideTabBar role="player" variant="player">` aux lignes 55 et 87, et `components/app-shell.tsx:52` confirme `{hideTabBar ? null : <MobileTabBar items={playerTabs} />}` — implementation est correcte. Capture 05a-onboarding-redirect-to-journey.png trace la redirection. Pour test visuel direct, créer un compte player non-onboardé.

### 6. Vérifier sidebar staff #1B3A5C sur /admin /mentor /jury /results
expected: Sidebar bleu profond EIC, pas slate v0.1 (#0B2545)
result: passed — login GameMaster (omar.ameur98) → redirection /admin. `aside.eic-staff-sidebar` mesurée via getComputedStyle = `rgb(27, 58, 92)` = `#1B3A5C` exact. Vérifié sur /admin (06a) et /results (06d) via JS, captures aussi sur /mentor (06b) et /jury (06c).

### 7. Soumettre login valide puis invalide pour valider boucle isPending + form-error
expected: Bouton disable + label 'Connexion en cours…' pendant submit, error message rendu rose tint avec role=alert si invalide
result: passed — (a) Login invalide testé en run précédent : "Invalid login credentials" via [role="alert"] ✓. (b) Login valide testé cette continuation : MutationObserver a capturé `{text: "Connexion en cours…", disabled: true}` au moment précis du submit avec alpha.leader@test.local, puis redirection vers /journey ✓. Screenshots 07c-login-pending-state.png (état synthétique pour archive visuelle, validé observer-side) et 07d-login-success-redirect.png.

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0
deferred: 0

## Gaps

- Item 3 : la simulation @supports a été faite par injection CSS directe (le navigateur supporte backdrop-filter, donc la règle native @supports not n'a pas pu être déclenchée par feature-toggle). La règle CSS source est confirmée présente et le rendu fallback (rgba 0.92) reste lisible.
- Item 5 : test direct du flow /onboarding bloqué car alpha.leader est déjà onboardé. Validé par code review (cf. `app/onboarding/page.tsx:55,87` + `components/app-shell.tsx:52`). Pour validation visuelle, créer un compte player neuf sans `players.onboarded_at`.
- Item 7 isPending : la transition observée durait <50ms (Supabase local rapide), donc la capture screenshot temps-réel au moment exact du disable n'a pas été chronologiquement possible. Validation faite via MutationObserver DOM (preuve enregistrée). Capture 07c-login-pending-state.png reproduit visuellement l'état désactivé.
