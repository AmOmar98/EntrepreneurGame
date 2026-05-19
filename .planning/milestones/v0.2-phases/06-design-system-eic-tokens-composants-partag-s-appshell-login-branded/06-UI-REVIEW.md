# Phase 6 — UI Review

**Audited:** 2026-05-10
**Baseline:** `06-UI-SPEC.md` (Design System EIC v2 — tokens + 5 primitives + AppShell variants + /login branded)
**Screenshots:** not captured (Playwright Chromium binary non installé localement ; `npx playwright install` requis — déclenche un download ~280 Mo qu'on a évité de lancer en silence). Audit code-only contre UI-SPEC.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Toutes les clés UI-SPEC présentes en FR+EN avec diacritiques propres ; redondance sémantique entre `brand_subtitle` (kicker /login) et `login_subtitle` (lead /login) → les deux contiennent « Hack-Days » à 2 lignes d'écart |
| 2. Visuals | 3/4 | EICLogo lockup correct, hierarchy claire (kicker → h1 → lead → form → partners), mais le tab bar mobile reste un stub Phase 6 avec icône `·` purement textuelle — UI-SPEC §322 le prévoit, donc pas une régression mais visuellement faible quand mobile testé |
| 3. Color | 4/4 | Accent `--eic-blue` confiné aux usages déclarés (Button primary, current LevelBadge, sidebar staff active, link). Aucun hex hardcodé en TSX hors EICLogo (variant white inversion documentée). Border tints `#B6C5DA / #B7D4B7 / #DCC394 / #DCB1B1` codés en dur dans CSS mais conformes UI-SPEC §252 |
| 4. Typography | 4/4 | Échelle stricte 5 niveaux respectée (`clamp(40-72)/clamp(30-48)/clamp(22-32)/22/20/16/14`), `--font-heading`/`--font-body` via next/font self-hosted, kicker `0.18em` tracking, fallback stack solide. Caveat point d'attention non bloquant : Baskervville n'est shippé qu'en weight 400 par Google Fonts → h1/h2/h3 (700/600/500) sont rendus en synthetic-bold |
| 5. Spacing | 4/4 | 9 tokens `--space-*` exposés (4/8/12/16/24/32/48/64/96), zéro valeur arbitraire `[12px]` Tailwind, 3 inline `style={...}` au total et tous les 3 documentés/légitimes (ProgressBar fill width, EICLogo color inversion ×2). Touch target 44px respecté sur tab bar |
| 6. Experience Design | 4/4 | `useActionState` 3-tuple wired (W3 fix appliqué), `disabled={isPending}` + label toggle, `role="alert"` sur form-error, `prefers-reduced-motion: no-preference` guard sur pulse-eic, `@supports not (backdrop-filter)` fallback opaque, `hideTabBar` honoré sur /onboarding |

**Overall: 22/24**

---

## Top 3 Priority Fixes

1. **`form-error` est déclaré 2 fois dans `globals.css` (lignes 673 + 1311)** — la 2e déclaration (rose tint, padding, border) gagne par cascade et c'est ce qui s'affiche sur /login, mais la 1re (legacy `color: var(--red); font-weight: 700;`) reste dans le bundle et peut être consommée silencieusement par d'autres pages v0.1 qui utilisent encore `.form-error` → **renommer la 1re en `.form-error-legacy`** ou supprimer si plus aucun consommateur, ou réordonner pour que la nouvelle écrase explicitement. Risque actuel : maintenance trap ; debug futur perdu sur « pourquoi ce form-error est rouge gras ailleurs ? »

2. **Doublon sémantique sur /login : kicker + lead disent tous les deux « Hack-Days »** — `brand_subtitle: "Hack-Days · EIC"` rendu en kicker, puis 2 lignes plus bas `login_subtitle: "Hack-Days Fes-Meknes - 13 & 14 mai 2026"` rendu en lead. Le visiteur lit « Hack-Days » 2 fois en 4 lignes. **Fix concret** : changer `brand_subtitle` rendu sur /login pour `EIC · UEMF` (déjà aligné avec brand_tagline_short) OU ne pas afficher le kicker sur /login et laisser le lead parler — `app/login/page.tsx:19`. Coût : 1 string i18n ou suppression de 1 ligne JSX.

3. **Mobile tab bar stub avec single-tab `Parcours` + icône `·` reste actif en prod sur /journey** — UI-SPEC §322 documente ce stub Phase 6, mais aujourd'hui (10 mai) le projet entre Phase 7 préparation. Si Omar fait un screenshot mobile pour les partenaires Tamwilcom/BoA avant Phase 7 livré, l'icône `·` (point typographique de 22px dans une cellule 64px) sera lisible mais non identifiable comme « parcours ». **Fix concret immédiat** : remplacer `·` par `<MapPin size={18} />` de lucide-react (déjà dans deps `^0.577.0`) — `components/mobile-tab-bar.tsx:27`. 3 lignes de code, gain démo significatif. Si Phase 7 livre le 4-tab complet d'ici les Hack-Days, fix devient redondant.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Forces :**
- Toutes les clés UI-SPEC §Copywriting Contract présentes en `lib/i18n.ts` lignes 9-31 (fr) + 251-273 (en).
- Diacritiques FR propres : `Connexion en cours…`, `Vérifiez vos identifiants`, `Réessayez` — conforme UI-SPEC §200 « UI copy CAN and SHOULD use proper accents ».
- CTA action-verb : `Se connecter` ✓ (jamais `Connexion`), `Se déconnecter` ✓.
- Pending state explicite : `t.login_submitting` swap quand `isPending` (`components/login-form.tsx:38`).
- Form-error a `role="alert"` (`components/login-form.tsx:32`) — annonce screen-reader immédiate.

**Faiblesses :**
- **Redondance** `brand_subtitle` (kicker /login) vs `login_subtitle` (lead /login) — les deux contiennent « Hack-Days » à quelques pixels d'écart. Probable lecture : kicker pensé pour AppShell topbar (où il est correct), réutilisé par accident sur /login. Voir Top 3 fix #2.
- `nav_player_team: "Mon équipe"` est ajouté en i18n mais jamais consommé dans la nav du player (`navItems.player` ne contient que `journey` — `components/app-shell.tsx:16`). Clé morte tant que Phase 7 ne l'utilise pas — pas une régression mais à noter.
- `mobile_tab_team / profile / help` — 3 clés ajoutées sans tab correspondant en Phase 6 ; toutes consommées au plus tôt en Phase 7. Acceptable.

### Pillar 2: Visuals (3/4)

**Forces :**
- Hierarchy /login claire : aurora (z=0) → header EICLogo (z=2) → glass card (z=1) → footer partners (z=2). Voir `globals.css:1284-1292`.
- EICLogo SVG inline 28×28 avec `<title>` semantic + green dot bottom-right + variant `white` pour fond sombre — `components/ui/eic-logo.tsx`.
- Pulse animation `current` LevelBadge utilise `transform: scale()` + `box-shadow` (pas `width/height`) — zero layout thrash.
- Glass card avec triple shadow stack (inset highlight + 2 drop shadows) → relief crédible.
- Partner banner : 6 SVG présents en `public/brand/partners/` + fallback typographique conditionnel par-slug (B2 contract respecté).

**Faiblesses :**
- Mobile tab bar Phase 6 = `·` textuel dans cellule 22×22px outline (`components/mobile-tab-bar.tsx:27`). Documenté par UI-SPEC §322 mais visuellement pauvre si screenshot pris en l'état. Voir Top 3 fix #3.
- Aurora `.blob3` (`#F4E6C8`) center-positionné à `left:38%; top:40%` — peut visuellement chevaucher la glass card sur viewports étroits (~600-900px) si la card mesure 460px max. Pas vu en screenshot car non capturé, à valider visuellement Omar.
- Pas de focal point sur la sidebar staff au-delà du logo + tagline — c'est par design (Phase 6 = chrome only, contenu page non touché) mais score inférieur car aucun hero/dashboard pillar visible dans la phase.

### Pillar 3: Color (4/4)

**Forces :**
- Accent `--eic-blue` strictement confiné : Button primary, current LevelBadge, sidebar staff active, links — exactement la liste UI-SPEC §154-160. Vérifié grep : aucune utilisation en hover-state ou border decorative.
- Aucun hex hardcodé en TSX hors `components/ui/eic-logo.tsx` (3 occurrences `#FFFFFF`/`rgba(...)` — toutes documentées comme exception « variant white inversion non token-isable » UI-SPEC §300).
- Tints rgb hardcodés en CSS (`#B6C5DA / #B7D4B7 / #DCC394 / #DCB1B1`) en `globals.css:981-984` — conformes UI-SPEC §252 (border-color de pills sont littéraux par design).
- Aurora colors `#B5D4B7 / #BCD0E6 / #F4E6C8` sont les valeurs UI-SPEC §131 verbatim.
- Dark mode tokens préservés (`.dark, [data-theme="dark"]`) dans `eic-tokens.css:89-105` même si toggle UI déféré v0.3.
- `.form-error` v2 utilise `var(--wf-rose)` + `var(--wf-rose-tint)` — palette EIC, pas red v0.1.

**Faiblesses :**
- Aucune significative. La règle 60/30/10 est respectée sur /login (ivory dominant → glass white surface → eic-blue Button accent).

### Pillar 4: Typography (4/4)

**Forces :**
- Échelle UI-SPEC §Typography respectée verbatim dans `eic-tokens.css:113-191` :
  - h1 `clamp(40px, 5.5vw, 72px) / 700` ✓
  - h2 `clamp(30px, 3.8vw, 48px) / 600` ✓
  - h3 `clamp(22px, 2.4vw, 32px) / 500` ✓
  - h4 `22px / 500` ✓
  - lead `20px / 400` ✓
  - body `16px / 400` ✓
  - body-sm `14px / 400` ✓
  - kicker `0.75rem (12px) / 800 / +0.18em uppercase` ✓
- next/font/google self-hosted (`app/layout.tsx:6-19`) → 9 woff2 sous `.next/static/media/`, zéro round-trip Google.
- Letter-spacing différencié : `-0.02em` h1, `-0.015em` h2, `+0.01em` UI label, `+0.18em` kicker — UI-SPEC §102.
- Fallback stack robuste : `Baskervville → Baskerville Old Face → Baskerville → Georgia → serif` ; `Montserrat → system-ui → -apple-system → Helvetica Neue → Arial → sans-serif`.

**Faiblesses :**
- Baskervville Google ne ship que weight 400 → browser synth-bold sur h1/h2/h3 (700/600/500). Documenté dans 06-01-SUMMARY.md « Gotchas / Notes » ligne 136 ; UI-SPEC §31 acknowledge le compromis. Pas de régression vs design source.
- `<html>` déclaration vide ligne 111 (`html { /* applied via next/font ... */ }`) délibérée pour ne pas cascader la police EIC sur les pages v0.1 non-refactored. Sain ; juste à se rappeler que /journey, /admin, /mentor en v0.1 gardent Inter jusqu'à Phase 7-9.

### Pillar 5: Spacing (4/4)

**Forces :**
- 9 tokens `--space-*` exposés en `eic-tokens.css:57-65` (4/8/12/16/24/32/48/64/96 = pure 4-base modular scale).
- Zéro valeur arbitraire détectée (`grep -rEn "\[[0-9]+(px|rem|em)\]"` → 0 hits sur fichiers Phase 6).
- Inline `style={...}` exhaustivement listés :
  - `progress-bar.tsx:35` — `width: ${pct}%` (numeric clamped, UI-SPEC §300 exception explicite)
  - `eic-logo.tsx:65` + `:68` — `color: wordColor / kickerColor` (variant white inversion non-tokenisable, UI-SPEC §343 exception explicite)
  - **Total : 3 occurrences, toutes documentées et légitimes.**
- Touch target 44px tab bar (`globals.css:1219` `min-height: 44px`) ✓ WCAG 2.5.5.
- Button size=lg = 48px (`.eic-button--lg { min-height: 48px; }`) pour CTAs touch.
- Tab bar bottom padding 76px = 64px barre + 12px breathing — content pas occulté.

**Faiblesses :**
- Aucune significative.

### Pillar 6: Experience Design (4/4)

**Forces :**
- **Loading state** : `isPending` du 3-tuple React 19 `useActionState` câblé sur Button `disabled` + label swap (`components/login-form.tsx:12,37,38`). Pattern réutilisable pour Phase 7+.
- **Error state** : `<p className="form-error" role="alert">{state.message}</p>` — semantic + ARIA live region ; CSS rose tint `globals.css:1311-1319`.
- **Empty/disabled states** : Button `disabled` avec opacity 0.5 + cursor not-allowed + transform/shadow reset (`globals.css:956`) — pas de hover-stuck visual bug.
- **Reduced motion** : `@media (prefers-reduced-motion: no-preference) { ... animation: pulse-eic ... }` — gate WCAG 2.3.3 propre, vestibular-disorder users voient la pastille statique.
- **Backdrop-filter fallback** : `@supports not (backdrop-filter: blur(1px))` opaque rgba (`globals.css:877-881`) — Android Chrome <90 dégrade gracieusement.
- **Focus-visible** : 6 règles `:focus-visible` dans `globals.css` (button, nav-link, logout, tab, etc.) — `outline: 3px solid rgba(27,58,92,0.22)` partout, jamais `outline: none`.
- **A11y attributes** : 21 occurrences `aria-*` ou `role="..."` à travers Phase 6 surfaces — sidebar `aria-label`, ProgressBar `role=progressbar` + `aria-valuenow`, LevelBadge `role=img` + computed FR aria-label, EICLogo `role=img` + svg `<title>`, partner banner `aria-label="Partenaires"`.
- **hideTabBar** prop honoré sur `/onboarding` (`app/onboarding/page.tsx:55,87`) — flow linéaire pas pollué par tab bar.
- **Navigation** : staff sidebar pathname-based active state via `aria-current="page"` + `is-active` className, player tab bar idem.
- **Glass z-index dance** : aurora 0, header/footer 2, main+card 1 — focus jamais bloqué par décor.

**Faiblesses :**
- Aucune significative dans le périmètre Phase 6. Skeletons + indeterminate progress bar explicitement déférés v0.3 (UI-SPEC §428).

---

## Registry Safety

`components.json` absent → Phase 6 n'utilise aucun registry shadcn/third-party. Audit registry skip per agent contract. UI-SPEC §464 confirme « No shadcn initialization in this project. Primitives are hand-written React components. »

---

## Files Audited

**Source files (15) :**

- `app/eic-tokens.css` (204 lignes)
- `app/globals.css` (lignes 838-1340 — bloc EIC v2 ; lignes 1-836 v0.1 legacy non touchées)
- `app/layout.tsx` (38 lignes)
- `app/login/page.tsx` (31 lignes)
- `components/login-form.tsx` (43 lignes)
- `components/partner-banner.tsx` (47 lignes)
- `components/app-shell.tsx` (100 lignes)
- `components/topbar-lite.tsx` (42 lignes)
- `components/mobile-tab-bar.tsx` (35 lignes)
- `components/ui/button.tsx` (30 lignes)
- `components/ui/pill.tsx` (36 lignes)
- `components/ui/level-badge.tsx` (33 lignes)
- `components/ui/progress-bar.tsx` (38 lignes)
- `components/ui/eic-logo.tsx` (75 lignes)
- `components/ui/index.ts` (5 lignes)
- `lib/i18n.ts` (lignes 9-31 fr + 251-273 en pour le périmètre Phase 6)

**Phase context (10) :**

- 4 SUMMARY.md (06-01 à 06-04)
- 4 PLAN.md (06-01 à 06-04)
- 06-UI-SPEC.md (baseline)
- 06-CONTEXT.md (decisions verrouillées)

**Public assets vérifiés :**

- `public/brand/partners/{tamwilcom,bank-of-africa,innov-invest,bluespace,eic,uemf}.svg` — 6/6 présents.

**Screenshots :** non capturés (Playwright Chromium binary absent ; `npx playwright install` non lancé pour éviter download silencieux ~280 Mo). Audit conduit en code-only contre UI-SPEC ; smoke visuel manuel à faire par Omar via `SMOKE-PHASE-06.md` opérateur checklist déjà persisté en `.planning/phases/06-.../SMOKE-PHASE-06.md`.
