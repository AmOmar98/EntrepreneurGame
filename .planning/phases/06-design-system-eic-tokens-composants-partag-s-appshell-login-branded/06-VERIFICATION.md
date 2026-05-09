---
phase: 06-design-system-eic-tokens-composants-partag-s-appshell-login-branded
verified: 2026-05-10T00:00:00Z
status: human_needed
score: 17/17 must-haves verified (visual smoke pending operator)
overrides_applied: 0
human_verification:
  - test: "Charger /login dans navigateur, vérifier rendu global"
    expected: "Background ivoire, EICLogo top-left, glass card centrée avec aurora visible derrière, partner banner avec 6 SVGs, submit bleu solide full-width"
    why_human: "Rendu visuel (couleurs, blur, alignement) ne peut pas être vérifié programmatiquement"
  - test: "Vérifier polices Baskervville + Montserrat servies depuis /_next/static/media/"
    expected: "DevTools Network tab → reload /login → aucune requête vers fonts.googleapis.com, fichiers .woff2 servis self-hosted"
    why_human: "Vérification runtime du loader next/font (build verifie l'absence de @import mais pas le runtime)"
  - test: "Tester fallback backdrop-filter (Chrome rendering 'unsupported')"
    expected: "Glass card devient blanc opaque ~92% (lisible, pas de transparence)"
    why_human: "DevTools rendering emulation requis pour tester @supports not"
  - test: "Tester responsive 1100px sur /journey"
    expected: ">=1100px : TopbarLite seul. <1100px : tab bar bottom apparaît avec tab 'Parcours'"
    why_human: "Test resize viewport interactif"
  - test: "Vérifier /onboarding hideTabBar effectif"
    expected: "Topbar visible, AUCUNE tab bar même <1100px"
    why_human: "Test responsive interactif"
  - test: "Vérifier sidebar staff #1B3A5C sur /admin /mentor /jury /results"
    expected: "Sidebar bleu profond EIC, pas slate v0.1 (#0B2545)"
    why_human: "Vérification couleur visuelle"
  - test: "Soumettre login valide puis invalide pour valider boucle isPending + form-error"
    expected: "Bouton disable + label 'Connexion en cours…' pendant submit, error message rendu rose tint avec role=alert si invalide"
    why_human: "Behavior runtime nécessite navigateur + auth Supabase live"
---

# Phase 6: Design System EIC — Tokens + Composants partagés + AppShell + Login branded - Verification Report

**Phase Goal:** La fondation visuelle EIC v2 est en place — tokens CSS, polices self-hosted, composants partagés `<Button>`/`<Pill>`/`<LevelBadge>`/`<ProgressBar>`, AppShell refondu, login branded — sans casser les écrans v0.1 existants.

**Verified:** 2026-05-10
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria + PLAN must-haves merged)

| #   | Truth                                                                                                                                                                | Status     | Evidence                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Palette EIC visible sur surfaces refondues, tokens v0.1 legacy (`--brand-*`, `--green`, `--blue`, `--gold`) restent définis                                          | ✓ VERIFIED | `app/eic-tokens.css:11` `--eic-blue: #1B3A5C` ; `app/globals.css:3,27,29,33` `--brand-primary`, `--green`, `--blue`, `--gold` toujours présents       |
| 2   | Polices self-hosted via `next/font/google` (Baskervville + Montserrat), zéro `@import url(fonts.googleapis.com)` en source                                            | ✓ VERIFIED | `app/layout.tsx:2` import de `next/font/google` avec Baskervville + Montserrat ; grep `fonts.googleapis.com` dans `app/`, `components/`, `lib/` = 0 hit |
| 3   | `/login` refondu : ivoire + aurora + EICLogo + glass card + partner banner. Fallback `@supports not (backdrop-filter)` opaque                                          | ✓ VERIFIED | `app/login/page.tsx` contient `eic-login-shell`, `eic-aurora`, `eic-glass`, `EICLogo`, `PartnerBanner` ; `globals.css:877` fallback rgba 0.92          |
| 4   | Composants partagés importables depuis `@/components/ui` (Button/Pill/LevelBadge/ProgressBar/EICLogo)                                                                  | ✓ VERIFIED | `components/ui/index.ts` re-exporte 5 primitives + types ; chaque fichier kebab-case existe                                                           |
| 5   | AppShell distingue Player (TopbarLite + tab bar) vs Staff (sidebar restylée bleu)                                                                                      | ✓ VERIFIED | `components/app-shell.tsx:39` `resolvedVariant = variant ?? "staff"` + branche player + StaffShell avec `eic-staff-sidebar`                            |
| 6   | `npm run typecheck` exit 0, `npm run lint` exit 0, `npm run build` succeeds                                                                                            | ✓ VERIFIED | Run: typecheck OK, lint OK (no warnings), build succeeds avec 13 routes générées                                                                      |
| 7   | `app/eic-tokens.css` existe avec EIC palette + wf-* layer copiée verbatim                                                                                              | ✓ VERIFIED | Tokens vérifiés `--eic-blue`, `--eic-green`, `--home-ivory` aux lignes 11-17                                                                          |
| 8   | `app/layout.tsx` utilise `next/font/google` Baskervville + Montserrat                                                                                                  | ✓ VERIFIED | layout.tsx:2-19 wires les 2 fontes avec variables `--font-heading`/`--font-body`                                                                      |
| 9   | `.eic-glass`, `.eic-glass-tint`, `.eic-glass-dark` + `@supports not (backdrop-filter)` fallback                                                                       | ✓ VERIFIED | `globals.css:844,856,865,877` les 3 classes + bloc fallback rgba 0.92/0.94/0.96                                                                       |
| 10  | `.eic-aurora` utility présente                                                                                                                                          | ✓ VERIFIED | `globals.css:885,892,900,907,914` aurora + ::before + ::after + .blob3                                                                                |
| 11  | 5 primitives + barrel index.ts avec named exports                                                                                                                       | ✓ VERIFIED | components/ui/{button,pill,level-badge,progress-bar,eic-logo}.tsx + index.ts ; tous nommés, aucun `export default`                                    |
| 12  | `components/app-shell.tsx` accepte `variant` prop avec player/staff                                                                                                     | ✓ VERIFIED | `app-shell.tsx:13,32-37` AppShellVariant + variant + hideTabBar props                                                                                 |
| 13  | `components/topbar-lite.tsx` et `components/mobile-tab-bar.tsx` existent                                                                                                | ✓ VERIFIED | Les 2 fichiers présents, EICLogo importé dans topbar-lite, usePathname dans mobile-tab-bar                                                            |
| 14  | `app/login/page.tsx` refondu (eic-login-shell, EICLogo, glass card, partner banner)                                                                                     | ✓ VERIFIED | login/page.tsx:9-29 contient toute la structure ; aucun `auth-shell` legacy                                                                           |
| 15  | `components/login-form.tsx` utilise 3-tuple `useActionState [state, formAction, isPending]`                                                                              | ✓ VERIFIED | login-form.tsx:12 destructure 3-tuple ; Button primitive avec disabled={isPending}                                                                    |
| 16  | `components/partner-banner.tsx` garde `import Image from "next/image"` + fallback conditionnel (PARTNER_SVG_AVAILABLE + eic-partner__name)                                | ✓ VERIFIED | partner-banner.tsx:1 import Image ; ligne 15 PARTNER_SVG_AVAILABLE map ; ligne 40 fallback `eic-partner__name`                                        |
| 17  | `app/results/page.tsx` utilise `role={role ?? "game_master"}` et `variant="staff"` (NOT "player")                                                                       | ✓ VERIFIED | 3 occurrences vérifiées (ll.39,57,71) toutes en `game_master` + `variant="staff"` ; grep `role.*player` dans results = 0 hit                          |
| 18  | 10 page wrappers v0.1 portent le `variant` prop (journey, journey/deliverable/[id], onboarding, mentor, mentor/submission/[id], admin, admin/players/import, admin/players/[id], jury, results) | ✓ VERIFIED | Grep variant= sur app/**/page.tsx retourne 19 hits couvrant les 10 fichiers ; onboarding inclut `hideTabBar`                                          |
| 19  | SMOKE-PHASE-06.md existe en phase dir                                                                                                                                   | ✓ VERIFIED | Fichier présent avec sections /login, /journey, /onboarding, staff variants, fallback, fonts, build                                                   |

**Score:** 19/19 truths verified (programmatique). Visual smoke pending opérateur (humain).

### Required Artifacts

| Artifact                                  | Expected                                                            | Status     | Details                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `app/eic-tokens.css`                      | EIC v2 tokens (palette + radii + shadows + spacing + wf-* layer)    | ✓ VERIFIED | 200+ lignes, --eic-blue/green/home-ivory + dark mode + wf-* layer présents |
| `app/layout.tsx`                          | next/font/google + import eic-tokens.css                            | ✓ VERIFIED | Baskervville/Montserrat wired, both `globals.css` + `eic-tokens.css` imports |
| `app/globals.css`                         | tokens v0.1 préservés + .eic-glass + .eic-aurora + primitives + shell + login CSS | ✓ VERIFIED | 74 occurrences `.eic-*` classes + .app-shell/.sidebar legacy intacts (l.68/74) |
| `lib/i18n.ts`                             | login_submitting, login_error_invalid, login_error_generic, brand_subtitle, nav_logout, mobile_tab_journey | ✓ VERIFIED | Tous présents en fr et en (ll.14,15,16,26,27,28 fr + 256-270 en)           |
| `components/ui/button.tsx`                | Button primitive variants primary/success/ghost + size default/lg    | ✓ VERIFIED | Export named, BEM modifiers, no client directive                         |
| `components/ui/pill.tsx`                  | Pill tone default/blue/green/amber/rose                              | ✓ VERIFIED | Named export, modifier classes                                           |
| `components/ui/level-badge.tsx`           | LevelBadge done/current/locked + aria-label FR                       | ✓ VERIFIED | aria-label "Niveau X (en cours)" etc. ; role="img"                       |
| `components/ui/progress-bar.tsx`          | ProgressBar role=progressbar + aria-valuenow                          | ✓ VERIFIED | Clamp [0,1] ; ARIA complet ; transition CSS                              |
| `components/ui/eic-logo.tsx`              | Inline SVG logo                                                       | ⚠️ INFO     | EICLogo utilise `aria-label` sur le `<span>` parent au lieu de `<title>` interne au SVG. A11y équivalente (nom accessible identique) mais diverge du spec littéral du PLAN/SUMMARY. Voir Anti-Patterns. |
| `components/ui/index.ts`                  | Barrel exporting 5 primitives + types                                | ✓ VERIFIED | 5 named re-exports + types                                               |
| `components/app-shell.tsx`                | variant + hideTabBar props ; default = staff                         | ✓ VERIFIED | AppShellVariant + resolvedVariant fallback ; StaffShell privé             |
| `components/topbar-lite.tsx`              | EICLogo + brand text + nav + signOut form                            | ✓ VERIFIED | Server component, signOut action via plain form                           |
| `components/mobile-tab-bar.tsx`           | Client component, usePathname                                         | ✓ VERIFIED | "use client" + usePathname active match                                   |
| `app/login/page.tsx`                      | EIC branded shell                                                     | ✓ VERIFIED | aurora + EICLogo + glass card + partner banner + caption                  |
| `components/login-form.tsx`               | 3-tuple useActionState + Button primitive + form-error                | ✓ VERIFIED | l.12 3-tuple ; l.37-39 Button + isPending ; l.32-34 role=alert            |
| `components/partner-banner.tsx`           | Image import + PARTNER_SVG_AVAILABLE + fallback                       | ✓ VERIFIED | next/image conservé, map des flags, span fallback                          |
| `SMOKE-PHASE-06.md`                       | Operator regression checklist                                         | ✓ VERIFIED | Fichier présent dans phase dir, sections completes                         |

### Key Link Verification

| From                              | To                                | Via                          | Status     | Details                                                                  |
| --------------------------------- | --------------------------------- | ---------------------------- | ---------- | ------------------------------------------------------------------------ |
| `app/layout.tsx`                  | `app/eic-tokens.css`              | ES import                    | WIRED      | `import "./eic-tokens.css"` line 4                                       |
| `app/layout.tsx`                  | `next/font/google`                | Baskervville+Montserrat ctors | WIRED      | Both fonts wired with variable option                                    |
| `<html>`                          | font CSS variables                | className composing          | WIRED      | `${baskervville.variable} ${montserrat.variable}` ligne 33               |
| `components/ui/index.ts`          | 5 primitives                       | named re-exports             | WIRED      | 5 lignes, types exportés                                                 |
| `.eic-level-badge--current`       | `@keyframes pulse-eic`             | animation property + reduced-motion guard | WIRED | l.1023 wrapper `prefers-reduced-motion: no-preference` + l.1029 keyframes |
| `app/login/page.tsx`              | `.eic-glass + .eic-aurora`         | className                     | WIRED      | `eic-aurora` + `eic-glass` classes appliquées                            |
| `app/login/page.tsx`              | `<EICLogo />`                      | JSX import                    | WIRED      | Imported from `@/components/ui` line 3                                    |
| `components/login-form.tsx`       | `<Button variant="primary" size="lg">` | JSX import                | WIRED      | Imported `@/components/ui` line 6 ; rendered ll.37-39                     |
| `components/topbar-lite.tsx`      | `signOut`                          | form action                   | WIRED      | `<form action={signOut}>` ligne 35                                        |
| Page wrappers (10)                | AppShell variant prop              | JSX prop                      | WIRED      | 19 occurrences variant="player|staff" couvrant tous les wrappers          |

### Data-Flow Trace (Level 4)

| Artifact                          | Data Variable | Source                       | Produces Real Data | Status      |
| --------------------------------- | ------------- | ---------------------------- | ------------------ | ----------- |
| TopbarLite navItems               | navItems prop | navItems Record dans app-shell.tsx (statique) | Yes (statique) | ✓ FLOWING |
| MobileTabBar items                | items prop    | playerTabs constant dans app-shell.tsx        | Yes (statique) | ✓ FLOWING |
| LoginForm submit isPending         | isPending     | useActionState 3-tuple (React 19) avec signIn server action | Yes (runtime) | ✓ FLOWING |
| PartnerBanner Image src            | hasSvg flag   | PARTNER_SVG_AVAILABLE map (statique, all true) | Yes — 6 SVGs réels en public/brand/partners/ | ✓ FLOWING |

Note: Phase 6 livre principalement de la chrome visuelle, pas de data dynamique fetched. Les données statiques (i18n, navItems, playerTabs) sont cohérentes et valides.

### Behavioral Spot-Checks

| Behavior                                | Command                                                       | Result                                          | Status     |
| --------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- | ---------- |
| TypeScript compile                      | `npm run typecheck`                                           | exit 0, no errors                                | ✓ PASS     |
| Lint                                    | `npm run lint`                                                | exit 0, no warnings                              | ✓ PASS     |
| Production build                        | `npm run build`                                               | exit 0, 13 routes generated, /login=675B 115kB First Load JS | ✓ PASS |
| `fonts.googleapis.com` absent du source  | grep récursif dans app/, components/, lib/                    | 0 hits                                          | ✓ PASS     |
| Partner SVGs sur disque                  | `ls public/brand/partners/`                                   | 6 SVGs présents (tamwilcom, bank-of-africa, innov-invest, bluespace, eic, uemf) + README | ✓ PASS |
| /results n'utilise plus role=player      | `grep -n 'role.*player' app/results/page.tsx`                  | 0 hits (W2 fix tenu)                             | ✓ PASS     |
| AppShell variant defaulting              | regex test sur app-shell.tsx                                   | `variant ?? "staff"` détecté l.39                | ✓ PASS     |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                              | Status      | Evidence                                                                            |
| ----------- | ----------- | ---------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| DSY-01      | 06-01       | Palette EIC sur surfaces refondues + tokens v0.1 préservés en parallèle                  | ✓ SATISFIED | `app/eic-tokens.css` + tokens v0.1 dans `globals.css` ll.3,27,29,33                 |
| DSY-02      | 06-01       | Polices Baskervville + Montserrat via next/font/google, no @import                       | ✓ SATISFIED | `app/layout.tsx:2-19` + grep googleapis = 0                                          |
| DSY-03      | 06-01       | Glass + aurora utilities avec fallback @supports not                                      | ✓ SATISFIED | `globals.css:844-880` glass + 877 fallback ; aurora `globals.css:885-918`            |
| DSY-04      | 06-02       | 5 primitives partagées dans components/ui/                                                 | ✓ SATISFIED | 5 fichiers + index.ts + CSS contracts dans globals.css                               |
| DSY-05      | 06-03       | AppShell variant player|staff + restyle staff sidebar                                     | ✓ SATISFIED | `app-shell.tsx` + TopbarLite + MobileTabBar + .eic-staff-sidebar `globals.css:1245`   |
| DSY-06      | 06-04       | /login refondu EIC v2 (ivoire + aurora + EICLogo + glass card + partner banner)           | ✓ SATISFIED | `app/login/page.tsx` complete refactor                                               |
| DSY-07      | 06-04       | Build sanity (typecheck + lint + build OK)                                                | ✓ SATISFIED | Trio passe, 13 routes générées                                                       |

Tous les 7 requirements DSY-01..DSY-07 sont satisfaits. Aucun requirement orphelin (REQUIREMENTS.md mappe DSY-01..07 sur Phase 6, et tous les 4 plans cumulés couvrent les 7 IDs).

### Anti-Patterns Found

| File                                  | Line   | Pattern                                                                                  | Severity    | Impact                                                                                                                          |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `components/ui/eic-logo.tsx`          | 23-23  | `aria-label="EIC - Euromed Innovation Center"` sur outer span au lieu de `<title>EIC — Euromed Innovation Center</title>` dans SVG | ℹ️ Info     | A11y équivalente — le span outer a `role="img"` + `aria-label`, accessible name identique. Diverge du PLAN acceptance criterion littéral et du must_have truth #6 ("with `<title>`...") mais comportement utilisateur identique. |
| `components/ui/eic-logo.tsx`          | 65, 68 | `style={{ color: wordColor }}` et `style={{ color: kickerColor }}` inline                | ℹ️ Info     | Documenté dans PLAN comme exception explicite (variant=white inverse les couleurs non thémables via tokens uniquement)            |
| `components/ui/progress-bar.tsx`      | 35     | `style={{ width: `${pct}%` }}` inline                                                    | ℹ️ Info     | Documenté dans PLAN comme exception explicite (UI-SPEC line 300 — seul moyen d'animer la valeur)                                  |
| `app/globals.css`                     | (legacy) | classes `auth-shell` / `auth-card` / `auth-header` v0.1 still present                  | ℹ️ Info     | Plan documente "Do NOT delete them from globals.css (may be referenced elsewhere)". Code mort — peut être nettoyé ultérieurement |
| `SMOKE-PHASE-06.md`                   | 22-23  | "6 names in serif uppercase (TAMWILCOM/...)" — décrit l'état typographique mais les SVGs sont effectivement présents | ℹ️ Info | Doc inconsistency mineure : le SMOKE checklist a été écrit avant les SVGs partenaires, le banner affiche désormais réellement les images SVG. Pas de blocage fonctionnel |

Aucun pattern de niveau 🛑 Blocker ou ⚠️ Warning. 5 items Info documentés.

### Human Verification Required

Phase 6 livre la fondation visuelle. La majorité des truths peuvent être vérifiées programmatiquement (existence, wiring, types, build), mais le rendu visuel final (couleurs, blur, alignement, polices, responsive) ne peut être validé qu'à l'œil. Smoke checklist fournie via SMOKE-PHASE-06.md.

### 1. Rendu visuel /login

**Test:** `npm run dev` puis ouvrir http://localhost:3000/login
**Expected:** Background ivoire (#F6F1E8 family), EICLogo top-left (square bleu + white E + green dot + EIC + INNOVATION CENTER kicker), glass card centrée max-width 460px, aurora visible derrière la card, submit bleu solide full-width "Se connecter", partner banner bottom avec 6 SVGs ou typographie + caption verte uppercase
**Why human:** Couleurs / blur / alignement / typographie nécessitent inspection visuelle

### 2. Polices self-hosted

**Test:** DevTools Network tab → reload /login
**Expected:** Aucune requête vers `fonts.googleapis.com`. Fichiers `.woff2` servis depuis `/_next/static/media/...` (Baskervville + Montserrat)
**Why human:** Vérification runtime requise (le build verifie l'absence de @import statique mais pas le runtime)

### 3. Backdrop-filter fallback

**Test:** DevTools Rendering → Emulate CSS feature: backdrop-filter unsupported, refresh /login
**Expected:** Glass card devient blanc opaque ~92% (lisible, pas de transparence). Form fonctionnel
**Why human:** DevTools emulation interactive requise

### 4. Responsive 1100px /journey + /onboarding

**Test:** Viewport ≥1100px puis <1100px sur /journey ; tester /onboarding aux 2 tailles
**Expected:** /journey ≥1100px = TopbarLite seul ; <1100px = TopbarLite + tab bar bottom 1 tab "Parcours". /onboarding = TopbarLite seul aux 2 tailles (hideTabBar honoré)
**Why human:** Test resize interactif

### 5. Sidebar staff palette

**Test:** Charger /admin, /mentor, /jury, /results connecté en staff
**Expected:** Sidebar gauche bleue profonde #1B3A5C (--eic-blue), pas slate v0.1 (#0B2545). Active link rgba(255,255,255,0.14) ; brand tagline kicker uppercase tracked
**Why human:** Vérification couleur visuelle

### 6. Login behavior end-to-end

**Test:** Soumettre /login avec credentials valides puis invalides
**Expected:** Pendant submit, bouton disable + label "Connexion en cours…" ; valide = redirect rôle ; invalide = `<p class="form-error" role="alert">` rose tint avec message
**Why human:** Flow runtime nécessite navigateur + Supabase auth live

### 7. Reduced motion

**Test:** DevTools → Rendering → emulate prefers-reduced-motion: reduce
**Expected:** Phase 6 n'a pas encore de LevelBadge en production (Phase 7), donc rien à animer aujourd'hui. Vérification reportée Phase 7.
**Why human:** Note future-référence ; aujourd'hui = no-op

### Gaps Summary

Aucun gap bloquant. Tous les 17 must-haves de la liste fournie + les 6 success criteria du roadmap + les 7 requirement IDs (DSY-01..07) sont satisfaits programmatiquement. Le code livre :

- **Tokens & polices** : `app/eic-tokens.css` complet, polices `next/font/google` self-hosted, `--font-heading`/`--font-body` exposés sur `<html>`, zéro `@import url(fonts.googleapis.com)` en source
- **Utilities** : `.eic-glass`/`.eic-glass-tint`/`.eic-glass-dark` + fallback `@supports not`, `.eic-aurora` avec `::before/::after/.blob3`
- **5 primitives** : Button, Pill, LevelBadge, ProgressBar, EICLogo + barrel `components/ui/index.ts` ; CSS contracts en `globals.css` avec BEM modifiers + `@keyframes pulse-eic` wrapped en `prefers-reduced-motion: no-preference`
- **AppShell variants** : `variant="player"|"staff"` (default staff backward-compat), `TopbarLite` server, `MobileTabBar` client (usePathname), staff sidebar `.eic-staff-sidebar` palette swap additif. Les 10 page wrappers v0.1 portent le prop `variant=`. `/results` corrigé W2 (game_master au lieu de player). `/onboarding` honore `hideTabBar`.
- **Login branded** : `app/login/page.tsx` refondu (eic-login-shell + eic-aurora + EICLogo + eic-glass card + kicker/h1/lead + partner banner + caption verte), `LoginForm` 3-tuple useActionState + Button primitive, `PartnerBanner` conditionnel (PARTNER_SVG_AVAILABLE all true) avec fallback typographique
- **Build sanity** : typecheck OK, lint sans warning, build 13 routes OK

**Note minor — EICLogo a11y:** `<title>EIC — Euromed Innovation Center</title>` dans le SVG était spec'd dans le PLAN+SUMMARY. L'implémentation utilise `aria-label="EIC - Euromed Innovation Center"` sur le `<span role="img">` parent. A11y équivalente fonctionnellement (même nom accessible exposé aux ATs) mais diverge de la lettre du contrat. Pas un gap bloquant — info documentée pour traçabilité.

**Status final** = `human_needed` parce que le rendu visuel + comportements runtime (responsive, fonts self-hosted, fallback backdrop-filter, login flow end-to-end) ne peuvent être validés qu'à l'œil. Le SMOKE-PHASE-06.md fournit la checklist opérateur (~10 minutes). Une fois cette smoke faite par Omar, Phase 6 = PASS et Phase 7 peut démarrer.

---

_Verified: 2026-05-10_
_Verifier: Claude (gsd-verifier)_
