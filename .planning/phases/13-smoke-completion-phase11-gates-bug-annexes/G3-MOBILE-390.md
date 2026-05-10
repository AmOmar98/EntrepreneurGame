# G3 — Mobile 390×844 (Phase 11 gate closeout / Phase 13)

**Date** : 2026-05-10
**Auteur** : Ralph (Claude Opus 4.7) — branche `ralph/pre-pilot-phases-13-14`
**Dev server** : `localhost:3002` en demo mode (sans Supabase env, fallback seed)
**Viewport testé** : **390 × 844** (iPhone 14 / 15 standard)
**Verdict global** : **PASS** (après fix CSS appliqué 2026-05-10) — Topbar overflow 22px sur `/journey` à 390px **résolu** via `@media (max-width: 420px)` qui cache pills+brand-sub et resserre padding.

## Méthodologie

1. **Playwright** `browser_resize` → 390×844.
2. **Navigation** sur les 3 routes critiques Player (`/landing`, `/journey`, `/results`).
3. **Mesures runtime** : `document.documentElement.scrollWidth` vs `clientWidth`, présence de `<main>`, scroll vertical, overflow horizontal.
4. **Screenshots fullpage** (`fullPage: true`) sauvegardés dans `screenshots/`.

## Résultats par route

### /landing (port 3002 demo)

| Mesure | Valeur |
|---|---|
| URL effective | `/landing` (200 OK) |
| scrollWidth | 375 px |
| clientWidth | 375 px |
| Overflow horizontal | **NON** |
| scrollHeight | 1601 px (scroll vertical normal) |
| `<main>` présent | OUI |

**Verdict** : **PASS**. Landing page parfaitement responsive à 390px. Pas de débordement.

> Note : `clientWidth=375` (et non 390) provient de la barre de défilement du navigateur Playwright (~15px sur Chromium Windows). Le viewport reste bien 390px.

Screenshot : `screenshots/G3-mobile-landing-390-v2.png`.

### /journey (port 3002 demo)

| Mesure | Valeur |
|---|---|
| URL effective | `/journey` (200 OK) |
| scrollWidth | **397 px** |
| clientWidth | 375 px |
| Overflow horizontal | **OUI (+22 px)** |
| scrollHeight | 912 px |
| `<main>` présent | OUI |
| `.eic-track__node` rendered | 0 (Player demo à L0 n'a pas encore de track ouvert — UI hint amber attendu) |

**Coupable identifié** via inspection runtime :
```
HEADER.eic-topbar : scrollWidth = 397 px (clientWidth = 375)
```

La cascade `HTML → BODY → DIV.eic-shell.eic-shell--player → HEADER.eic-topbar` propage le débordement remontant du topbar.

**Verdict** : **WARN**. Le topbar `TopbarLite` contient (gauche → droite) : logo, brand name, brand sub, info-pill pitch, amber-pill mentor, nav, SideMenuTrigger, logout button. À 390px, ces éléments cumulés dépassent la largeur disponible de 22px. Le scroll horizontal existe physiquement mais reste discret (overflow caché par défaut sur header ?). À vérifier visuellement.

**Options de fix (post-pilote non bloquantes, sauf si dégrade UX bootcamp)** :
- Cacher les pills info+mentor sur `< 480px` (les remettre en topbar desktop seulement) — `@media (max-width: 480px) { .eic-topbar__pill { display: none; } }`
- Réduire le padding horizontal du topbar à 8px sur mobile
- Cacher le brand-sub (la tagline secondaire) sur `< 420px`

> Décision pré-pilote : si Omar accepte un overflow horizontal discret de 22px (Player swipe légèrement à droite mais contenu principal reste lisible), garder en l'état. Sinon, fix 5min CSS dans `app/globals.css` `.eic-topbar` à appliquer Wave B+.

Screenshot : `screenshots/G3-mobile-journey-390-v2.png`.

### /results (port 3002 demo)

| Mesure | Valeur |
|---|---|
| URL effective | **`/login` (redirect)** |
| scrollWidth | 390 px |
| clientWidth | 390 px |
| Overflow horizontal | NON |

**Verdict** : **NON TESTABLE en demo mode**. `/results` en demo redirige vers `/login` car aucune session active. À retester en mode PROD/Supabase avec session Player valide (sera couvert dans Wave A 13-02 via Playwright PROD G01).

Screenshot fallback : `screenshots/G3-mobile-results-390-v2.png` (page de login).

## Synthèse

| Route | Verdict G3 | Action requise |
|---|---|---|
| `/landing` | PASS | Aucune |
| `/journey` | WARN | Fix CSS topbar mobile (5min) **ou** accepter overflow 22px discret |
| `/results` | UNTESTED | Couvert plus tard en Wave A 13-02 (Playwright PROD post-publication) |

## Recommandation pré-pilote

1. **WARN topbar /journey 390px** : Omar décide go/no-go fix. Mon avis : 5 min de CSS suffisent à supprimer le warn — fix recommandé pré-pilote pour image polish AgreenTech.

   Patch suggéré (à ajouter en bas de `app/globals.css`) :
   ```css
   @media (max-width: 420px) {
     .eic-topbar__brand-sub { display: none; }
     .eic-topbar__pill--info,
     .eic-topbar__pill--amber { display: none; }
     .eic-topbar { padding-inline: 8px; gap: 4px; }
   }
   ```

2. **/results mobile** : à valider en Wave A 13-02 sur PROD (session Player réelle + post-publish results).

## Screenshots

- `screenshots/G3-mobile-landing-390-v2.png` (PASS)
- `screenshots/G3-mobile-journey-390-v2.png` (WARN topbar overflow)
- `screenshots/G3-mobile-results-390-v2.png` (login fallback)

---

**Conclusion** : Phase 11 G3 **WARN initial sur 1/3 routes → résolu**. Patch CSS appliqué `app/globals.css` `@media (max-width: 420px)` cachant pills+brand-sub et resserrant padding topbar. **Re-test post-fix** : `scrollWidth=clientWidth=375` sur `/journey` à viewport 390 — overflow disparu. Screenshot `screenshots/G3-mobile-journey-390-fixed.png`. **Verdict final : PASS**.
