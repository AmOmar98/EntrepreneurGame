---
status: partial
phase: 06-design-system-eic-tokens-composants-partag-s-appshell-login-branded
source: [06-VERIFICATION.md]
started: 2026-05-10T00:00:00Z
updated: 2026-05-10T00:00:00Z
---

## Current Test

[awaiting human testing — opérateur Omar via SMOKE-PHASE-06.md]

## Tests

### 1. Charger /login dans navigateur, vérifier rendu global
expected: Background ivoire, EICLogo top-left, glass card centrée avec aurora visible derrière, partner banner avec 6 SVGs, submit bleu solide full-width
result: [pending]

### 2. Vérifier polices Baskervville + Montserrat servies depuis /_next/static/media/
expected: DevTools Network tab → reload /login → aucune requête vers fonts.googleapis.com, fichiers .woff2 servis self-hosted
result: [pending]

### 3. Tester fallback backdrop-filter (Chrome rendering 'unsupported')
expected: Glass card devient blanc opaque ~92% (lisible, pas de transparence)
result: [pending]

### 4. Tester responsive 1100px sur /journey
expected: ">=1100px : TopbarLite seul. <1100px : tab bar bottom apparaît avec tab 'Parcours'"
result: [pending]

### 5. Vérifier /onboarding hideTabBar effectif
expected: Topbar visible, AUCUNE tab bar même <1100px
result: [pending]

### 6. Vérifier sidebar staff #1B3A5C sur /admin /mentor /jury /results
expected: Sidebar bleu profond EIC, pas slate v0.1 (#0B2545)
result: [pending]

### 7. Soumettre login valide puis invalide pour valider boucle isPending + form-error
expected: Bouton disable + label 'Connexion en cours…' pendant submit, error message rendu rose tint avec role=alert si invalide
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps

(none yet — pending operator smoke run via SMOKE-PHASE-06.md)
