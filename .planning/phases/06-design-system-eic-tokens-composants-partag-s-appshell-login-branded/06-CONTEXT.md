# Phase 6: Design System EIC — Tokens + Composants partagés + AppShell + Login branded - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss; design spec is `.planning/design-v2/`)

<domain>
## Phase Boundary

La fondation visuelle EIC v2 est en place — tokens CSS, polices self-hosted, composants partagés `<Button>`/`<Pill>`/`<LevelBadge>`/`<ProgressBar>`, AppShell refondu, login branded — sans casser les écrans v0.1 existants. La fonctionnalité v0.1 reste fonctionnelle (pilote du 13-14 mai protégé).

**Couvre** : DSY-01, DSY-02, DSY-03, DSY-04, DSY-05, DSY-06, DSY-07.

**Pré-requis opérateur** : git tag `v0.1-pilot-ready` posé sur `8176419` (déjà fait localement, push à la convenance d'Omar).

</domain>

<decisions>
## Implementation Decisions

### Source de vérité design

- **Design system tokens** : copier intégralement `.planning/design-v2/project/eic-tokens.css` vers `app/eic-tokens.css` (ou `app/globals.css` extension). Garder les tokens v0.1 legacy (`--brand-*`, `--green`, `--blue`) **en parallèle** des `--eic-*` — pas de suppression destructive.
- **Primitives wireframe** : adapter `.planning/design-v2/project/wf-base.css` (glass effect, pills, buttons, level badges, aurora background) en composants React + classes Tailwind-style ou CSS modules selon convention projet.

### Polices — DSY-02

- Utiliser `next/font/google` pour **Baskervville** (titres) et **Montserrat** (corps) — self-hosted, zéro round-trip réseau, optimisé Next.js 15.
- **Pas de `@import url(...)` synchrone** dans `app/globals.css` ou `eic-tokens.css` (impact LCP).
- Application via `app/layout.tsx` avec `className` sur `<html>` ou `<body>`.

### Glass effect — DSY-03

- Cards/panneaux principaux (`.wf-glass`, `.wf-glass-tint`, `.wf-glass-dark`) → composants React ou utilitaires CSS.
- **Fallback `@supports not (backdrop-filter: blur(1px))`** → background opaque blanc 92% pour Android Chrome <90.
- Background aurora doux (`.wf-aurora`) sur pages clés (login, journey).

### Composants partagés — DSY-04 (DoD-bloquant)

Créer `components/ui/` avec :
- `<Button variant="primary|success|ghost" size="default">` — basé sur `.wf-btn` du design
- `<Pill tone="default|blue|green|amber|rose" size="default">` — basé sur `.wf-pill`
- `<LevelBadge state="done|current|locked" level={"L0..L7"}>` — basé sur `.wf-lvl`
- `<ProgressBar value={0..1}>` — basé sur `.wf-bar`

**Règle** : pas d'inline `style={...}` ad hoc dans les pages refondues — un seul responsable de styles par primitive.

### AppShell refactor — DSY-05

- **Player** : sidebar dark green retirée, remplacée par `<TopbarLite>` (nav horizontale légère selon `.planning/design-v2/project/player-screens.jsx`) + tab bar mobile bottom sur viewport <1100px.
- **Mentor + GameMaster** : sidebar conservée mais restylée tokens EIC.
- Implémentation : `components/app-shell.tsx` accepte une prop `variant: 'player' | 'staff'` qui rend deux layouts différents. Les pages Player passent `variant="player"`, Mentor/GM passent `variant="staff"` ou défaut.

### Login branded — DSY-06

- `app/login/page.tsx` refondue : background ivoire avec aurora, logo EIC haut-gauche (`<EICLogo>` à créer), bandeau partenaires (Tamwilcom, BoA Academy, Innov Invest, Bluespace, EIC, UEMF), formulaire centré sur card glass.
- **Logos partenaires** : si non disponibles à l'écriture, utiliser placeholders typographiques style « TAMWILCOM » en kicker → décision opérateur post-Phase 6.

### Build sanity — DSY-07

- `npm run typecheck` passe sans erreur après refonte.
- `npm run lint` passe sans nouveau warning.
- `npm run build` produit un bundle qui se sert correctement en prod.
- Smoke test rapide après chaque commit : `/login` accessible, `/journey` (player), `/mentor` (staff), `/admin` (staff) chargent sans erreur runtime.

### Claude's Discretion

- Choix exact entre CSS variables flat vs CSS-in-JS — Claude décide selon la cohérence avec `app/globals.css` actuel (variables flat retenues a priori).
- Naming exact des classes utilitaires nouvelles (`.eic-card`, `.eic-glass`, etc.) — Claude décide selon convention.
- Ordre des plans à l'intérieur de la phase — Claude décide pour optimiser le flow.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets (à conserver/étendre)

- `app/globals.css` — variables `--brand-*`, `--green`, `--blue`, `--gold`, `--red` legacy v0.1. À conserver en parallèle des `--eic-*`.
- `components/app-shell.tsx` — composant existant à étendre avec variant `player`/`staff`.
- `lib/i18n.ts` — copies FR/EN, ne pas casser.
- `lib/icons.ts` — mapping lucide-react existant pour level/status.

### Established Patterns

- **Server-first** : pages = server components, client uniquement si interactivité (forms, hooks).
- **Named exports** : pas de `export default` pour libs/components.
- **Path alias** : `@/*` pointe sur racine projet.
- **2-space indent, double quotes, trailing commas** — ESLint flat config `eslint.config.mjs`.

### Integration Points

- `app/layout.tsx` : root où ajouter les polices `next/font/google`.
- `app/globals.css` : où injecter les nouveaux tokens `--eic-*`.
- `components/app-shell.tsx` : où ajouter le variant prop.
- `app/login/page.tsx` : page entièrement refondue.
- `components/ui/` : nouveau dossier pour primitives partagées.

### Décisions héritées v0.1 (à respecter)

- lucide-react pinné `^0.577.0` (Phase 1 plan 06) — ne pas upgrader à 1.x sans tests.
- `lib/data.ts` éclaté en `lib/types.ts` + `lib/seed/*.ts` + `lib/score.ts` + `lib/icons.ts`.
- Aucun seed leak en mode Supabase prod (Phase 2 anti-leak audit) — ne pas casser.

</code_context>

<specifics>
## Specific Ideas

- Préférer `next/font/google` over `@import url(...)` pour les polices Google Fonts (LCP).
- Garder l'effet glass uniquement sur les surfaces principales (cards, drawers, panels) — pas sur tous les éléments (lourdeur visuelle).
- L'aurora background doit être doux et peu intrusif (opacité réduite, blur fort).
- Le bandeau partenaires sur `/login` est visible une fois login fait — décider si reste ou disparaît post-auth (probablement disparaît).
- Les composants `<Button>`/`<Pill>` doivent supporter les variants v0.1 actuels (par mappage interne) pour ne pas casser les pages non encore refondues.

</specifics>

<deferred>
## Deferred Ideas

- Switcher de langue FR/EN UI exposé — différé v0.3 (i18n existe mais pas de switcher).
- Dark mode toggle utilisateur — tokens dark définis dans eic-tokens.css mais pas exposé en UI v0.2.
- Animations cross-page (Framer Motion ou similaire) — différé v0.3, v0.2 = transitions CSS simples.
- Storybook ou page de dev pour primitives — différé.

</deferred>
