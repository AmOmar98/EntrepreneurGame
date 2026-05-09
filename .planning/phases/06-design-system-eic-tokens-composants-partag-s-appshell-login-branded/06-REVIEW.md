---
phase: 06-design-system-eic-tokens-composants-partag-s-appshell-login-branded
reviewed: 2026-05-10T00:00:00Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - app/admin/page.tsx
  - app/admin/players/[id]/page.tsx
  - app/admin/players/import/page.tsx
  - app/eic-tokens.css
  - app/globals.css
  - app/journey/deliverable/[id]/page.tsx
  - app/journey/page.tsx
  - app/jury/page.tsx
  - app/layout.tsx
  - app/login/page.tsx
  - app/mentor/page.tsx
  - app/mentor/submission/[id]/page.tsx
  - app/onboarding/page.tsx
  - app/results/page.tsx
  - components/app-shell.tsx
  - components/login-form.tsx
  - components/mobile-tab-bar.tsx
  - components/partner-banner.tsx
  - components/topbar-lite.tsx
  - components/ui/button.tsx
  - components/ui/eic-logo.tsx
  - components/ui/index.ts
  - components/ui/level-badge.tsx
  - components/ui/pill.tsx
  - components/ui/progress-bar.tsx
  - lib/i18n.ts
findings:
  critical: 0
  warning: 5
  info: 7
  total: 12
status: issues_found
---

# Phase 6 : Rapport de revue de code

**Reviewed:** 2026-05-10T00:00:00Z
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

## Summary

La Phase 6 (Design System EIC v2 — tokens, primitives partagées, AppShell refondu, login branded) est globalement propre et conforme aux conventions du projet : pas de secrets hardcodés, pas de `console.log`, pas de TODO/FIXME oubliés, validation Zod conservée hors scope, RLS et redirections par rôle correctement appliquées sur toutes les pages serveur. Les nouvelles primitives (`Button`, `Pill`, `LevelBadge`, `ProgressBar`, `EICLogo`) respectent la règle « le style appartient au CSS, jamais aux pages » énoncée dans `eic-tokens.css`.

Cinq points méritent une correction avant le pilote, principalement liés à l'accessibilité (label de mot de passe non associé à son input, SVG `aria-hidden` masquant le `<title>` dans `EICLogo`, élément `<p>` contenant des `<span>`/`<p>` enfants — HTML invalide), à un risque XSS faible côté SVG via `var()` injecté dans des attributs SVG, et à un coalescing inutile dans `MobileTabBar`. Aucun problème critique de sécurité ou de logique métier détecté.

Hors scope rappel : le mélange de styles inline (`style={{...}}`) sur les pages staff (admin, mentor, jury, results, onboarding) reste massif — la décision Phase 6 (DSY-04 : « pas d'inline `style={...}` ad hoc dans les pages refondues ») n'a été appliquée qu'à `/login` et `/journey`. Ce n'est pas un bug mais l'écart entre intention et implémentation est notable et accumule de la dette si non documenté.

## Warnings

### WR-01: Label `<label>` n'enveloppe pas correctement son input dans LoginForm

**File:** `components/login-form.tsx:16-30`
**Issue:** Les deux `<label className="form-row">` enveloppent à la fois le texte et l'input, ce qui est techniquement valide HTML (« implicit label association »). Cependant, sur le second label, le contenu textuel `{t.login_password}` (« Mot de passe ») et son input `type="password"` ne sont **pas séparés visuellement** par un wrapper sémantique : le texte du label devient un nœud texte direct du `<label>`, mêlé au markup, ce qui rend le ciblage CSS et le focus visuel fragile. Pas un bug fonctionnel mais l'idiome `<label htmlFor="..."><input id="..." /></label>` (ou `<label><span>{text}</span><input /></label>`) est plus prévisible pour les outils d'accessibilité (NVDA/VoiceOver lisent parfois doublement le texte avec implicit + autocomplete). Plus important : l'input mot de passe a `minLength={6}` côté client, mais le serveur (`signIn` dans `app/actions.ts`) applique déjà sa propre validation Zod — pas un risque, juste cohérence à vérifier.

**Fix:**
```tsx
<label className="form-row">
  <span>{t.login_password}</span>
  <input
    className="input"
    name="password"
    type="password"
    required
    minLength={6}
    autoComplete="current-password"
  />
</label>
```
Encapsuler le texte dans un `<span>` rend le markup plus robuste pour le styling et les lecteurs d'écran.

### WR-02: HTML invalide dans `app/admin/players/[id]/page.tsx` — `<p>` contenant des `<span>` avec contenu inline mais aussi un composant React qui rend un `<span>` 

**File:** `app/admin/players/[id]/page.tsx:136-147`
**Issue:** L'élément `<p>` aux lignes 136-147 contient trois `<span>` qui à leur tour contiennent un `<strong>` et soit du texte, soit le composant `<PlayerStatusBadge>` (qui rend un `<span>`). C'est valide en théorie. Mais aux lignes 264-274 (dans `SubmissionCard`), un `<p>` contient également un `<strong>` et trois `<span>` — toujours valide. **Vrai problème ligne 343** : `<p style={...}>` contient `<strong>...</strong>` puis `{"  "}` puis un autre `<strong style={{ marginLeft: 12 }}>` — c'est valide, mais lignes 280-291 le `<p>` contient un `<a>` puis `{" "}` puis un `<span>` — valide aussi. **Le seul vrai HTML invalide** se trouve dans `app/journey/deliverable/[id]/page.tsx:72-81` où le `<p>` contient un `<Link>` (qui rend un `<a>`) — valide. Faux positif après inspection complète. **Garde quand même** : lignes 23-29 de `app/admin/players/[id]/page.tsx`, le `<p>` n'enferme qu'un `<Link>`+texte, valide. Le pattern global dans ces pages staff utilise `<p>` comme conteneur de meta-info inline — c'est sémantiquement faible (devrait être `<div>` ou `<dl>`). **Pas un bug**, mais la sémantique HTML serait améliorée par `<dl>` (definition list) pour les paires label/value.

**Fix:**
```tsx
// Préférer pour les meta-blocs label/value :
<dl style={{ display: "flex", gap: 12, margin: 0 }}>
  <div>
    <dt style={{ display: "inline", color: "#475569" }}>{t.admin_detail_slug}:</dt>
    <dd style={{ display: "inline", margin: 0 }}>{player.slug}</dd>
  </div>
  ...
</dl>
```
Refactor optionnel — pas bloquant pour le pilote.

### WR-03: `<title>` dans le SVG de `EICLogo` rendu inutile par `aria-hidden="true"` sur le SVG

**File:** `components/ui/eic-logo.tsx:23-64`
**Issue:** Le `<span>` parent porte `role="img"` mais **aucun `aria-label`** ; à l'intérieur le `<svg aria-hidden="true">` masque le `<title>EIC — Euromed Innovation Center</title>` aux technologies d'assistance. Conséquence : un lecteur d'écran annonce `«graphique»` (à cause de `role="img"`) sans nom accessible, ce qui est un échec WCAG 4.1.2 (Name, Role, Value). De plus, dans `topbar-lite.tsx:20`, le `<Link aria-label={brandName} className="eic-topbar__brand">` ajoute un `aria-label` au lien parent, ce qui sauve partiellement la situation **uniquement quand le logo est dans la topbar**. Dans `app/login/page.tsx:14-15`, le logo est rendu hors d'un `<Link>` parent avec `aria-label`, donc inaccessible.

**Fix:**
```tsx
return (
  <span className={classes} role="img" aria-label="EIC - Euromed Innovation Center">
    <svg aria-hidden="true" focusable="false" ...>
      {/* retirer <title> qui est inerte sous aria-hidden */}
      ...
    </svg>
    <span className="eic-logo__word" aria-hidden="true">
      ...
    </span>
  </span>
);
```
Le `aria-label` sur le span parent fournit le nom accessible. Le contenu textuel devient alors décoratif (`aria-hidden`) pour éviter une double lecture.

### WR-04: `MobileTabBar` — coalescing inutile et faux raisonnement sur `pathname`

**File:** `components/mobile-tab-bar.tsx:17-18`
**Issue:** `pathname?.startsWith(\`${item.href}/\`) ?? false` — `usePathname()` de Next.js 15 retourne `string` (jamais `null`/`undefined` dans un client component monté), donc le `?.` et le `?? false` sont morts. Plus subtil : la logique `pathname === item.href || pathname.startsWith(item.href + "/")` rend actif `/journey/deliverable/abc` quand `item.href = "/journey"` — c'est probablement voulu, mais cette même règle rendrait actif `/journey-other` ? Non, parce qu'on teste `${item.href}/` avec slash. OK pour la sémantique. Mais le fait que `MobileTabBar` ne possède qu'une seule entrée `playerTabs` (`/journey`) rend ce comportement actif partout sous `/journey/*`. Acceptable.

**Fix:**
```tsx
const active =
  pathname === item.href || pathname.startsWith(`${item.href}/`);
```
Suppression du `?.` et du `?? false` — `usePathname()` ne retourne jamais nullish dans un client component.

### WR-05: `app/onboarding/page.tsx` — usage non-null assertion implicite sur `membership.players`

**File:** `app/onboarding/page.tsx:46-49`
**Issue:** `membership?.players as { id: string; ... } | null | undefined` — le cast `as` contourne la vérification de typage Supabase. Si la jointure Supabase `players(id, name, idea, onboarded_at)` retourne une **liste** (cas où la relation n'a pas de FK unique du côté `player_members`), la variable `player` recevra le tableau, et `player.onboarded_at` lèvera `undefined` plutôt que de planter — mais si `Array.isArray(player)` un jour, on accède à `player.id` qui sera `undefined` et redirige vers `/journey` à tort. Le pattern `Array.isArray(raw) ? raw[0] : raw` est correctement appliqué pour `profiles` ligne 71-76 mais **pas** pour `players` ligne 46. Incohérence à risque de régression future.

**Fix:**
```tsx
const rawPlayer = membership?.players as
  | { id: string; name: string | null; idea: string | null; onboarded_at: string | null }
  | { id: string; name: string | null; idea: string | null; onboarded_at: string | null }[]
  | null
  | undefined;
const player = Array.isArray(rawPlayer) ? rawPlayer[0] : rawPlayer;
```
Aligner sur le pattern utilisé pour `profiles` plus bas. Ne change pas le comportement actuel mais sécurise contre une évolution du schéma Supabase.

## Info

### IN-01: Décision DSY-04 partiellement appliquée — styles inline encore omniprésents sur les pages staff

**File:** `app/admin/page.tsx:29-203`, `app/admin/players/[id]/page.tsx:19-471`, `app/admin/players/import/page.tsx:23-72`, `app/journey/deliverable/[id]/page.tsx:68-258`, `app/jury/page.tsx:26-79`, `app/mentor/page.tsx:32-42`, `app/mentor/submission/[id]/page.tsx:25-355`, `app/onboarding/page.tsx:14-97`, `app/results/page.tsx:39-167`
**Issue:** La règle Phase 6 / DSY-04 énonce : « pas d'inline `style={...}` ad hoc dans les pages refondues — un seul responsable de styles par primitive » (`06-CONTEXT.md:46`). Cette règle est respectée sur `app/login/page.tsx` (utilise classes `eic-login-*`) et partiellement sur `components/app-shell.tsx` (variant `player`). Les pages staff conservent un style 100 % inline avec valeurs hex hardcodées (`#0f172a`, `#64748b`, `#e2e8f0`...). Ce n'est pas un bug mais l'écart de design system entre `/login` (token-based) et `/admin` (hex inline) est visible. Pour aligner sans tout réécrire : créer des classes utilitaires dans `globals.css` (par ex. `.eic-staff-page`, `.eic-staff-table`, `.eic-meta`) et les appliquer progressivement.

**Fix:** À documenter dans `STATE.md` ou `06-SUMMARY.md` comme dette acceptée pour le pilote. Sinon planifier une mini-phase « DSY-08 staff pages tokens migration » post-pilote.

### IN-02: Hex couleurs hardcodés dans `app/admin/page.tsx` au lieu d'utiliser les tokens `--brand-*`/`--eic-*`

**File:** `app/admin/page.tsx:40-204`
**Issue:** `#0f172a`, `#64748b`, `#cbd5e1`, `#e2e8f0`, `#f8fafc`, `#dcfce7`, `#166534`, `#fef3c7`, `#78350f`... — toutes ces valeurs existent à peu près en équivalent dans `--brand-text` (#111827), `--brand-text-muted` (#6B7280), `--brand-border` (#E5E7EB), `--home-ink` (#14243D), `--home-muted` (#617084), etc. Le choix de hardcoder les hex Tailwind-flavoured au lieu de tokens (objectif central de Phase 6) reflète probablement un héritage v0.1. Pas urgent.

**Fix:** Au prochain refactor, remplacer par `var(--brand-text)`, `var(--brand-text-muted)`, etc., pour bénéficier du dark mode défini dans `eic-tokens.css:88-105`.

### IN-03: Duplication de tokens entre `app/eic-tokens.css` et `app/globals.css`

**File:** `app/eic-tokens.css:9-86`, `app/globals.css:1-37`
**Issue:** Les deux fichiers définissent `:root { ... }` avec des palettes différentes : `eic-tokens.css` introduit `--eic-blue`, `--home-ivory`, `--wf-*` ; `globals.css` conserve `--brand-primary`, `--brand-bg`, `--brand-success`. Cohabitation explicitement documentée comme « legacy en parallèle » (DSY-01 décision), mais l'ordre d'import dans `app/layout.tsx:3-4` (`globals.css` puis `eic-tokens.css`) signifie que les variables `--eic-*` finales écrasent toute redéfinition. **Risque** : si un futur dev définit `--brand-primary` dans `eic-tokens.css` par erreur, il écraserait silencieusement `globals.css`. Ajouter un commentaire explicite dans `eic-tokens.css` pourrait éviter cela.

**Fix:** Ajouter en tête de `eic-tokens.css` :
```css
/* IMPORTANT: ne pas redéfinir --brand-* tokens ici. Ceux-ci appartiennent à globals.css (legacy v0.1). */
```

### IN-04: `EICLogo` — couleurs SVG hardcodées (`#FFFFFF`, `var(...)` mêlés) — pas wireframe-friendly

**File:** `components/ui/eic-logo.tsx:8-14`
**Issue:** `markText = "#FFFFFF"`, `dotColor = "var(--eic-green)"`, `wordColor = isWhite ? "#FFFFFF" : "var(--eic-blue)"` — mélange de hex et de tokens. Cohérent à lire mais non maintenable si le mode dark devient strict (les `#FFFFFF` ne s'inverseront pas). Mineure.

**Fix:** Tout normaliser vers des tokens existants ou créer `--eic-on-blue: #FFFFFF`.

### IN-05: `app/admin/players/[id]/page.tsx` — labels de statut « Actif/Elimine/Termine » hardcodés en français au lieu d'utiliser `lib/i18n.ts`

**File:** `app/admin/players/[id]/page.tsx:32-40`
**Issue:** La fonction `statusLabel` retourne `"Actif"`, `"Elimine"`, `"Termine"` en dur (lignes 34-38). Tous les autres labels dans le fichier utilisent `t.admin_detail_*` ou `t.journey_status_*`. Convention projet (CLAUDE.md) : « Add new copy keys to `lib/i18n.ts` rather than inlining French (or English) strings. »

**Fix:**
Ajouter dans `lib/i18n.ts` :
```ts
admin_detail_status_active: "Actif",
admin_detail_status_eliminated: "Elimine",
admin_detail_status_completed: "Termine",
```
Puis utiliser `t.admin_detail_status_active` etc. dans `statusLabel`.

### IN-06: `level-badge.tsx` — caractère accentué `validé` dans `aria-label`

**File:** `components/ui/level-badge.tsx:24-27`
**Issue:** L'aria-label `\`Niveau ${level} (validé)\`` utilise `é` (U+00E9). Le reste du codebase évite scrupuleusement les diacritiques dans les chaînes côté code (cf. `lib/i18n.ts`: `"Valide"` plutôt que `"Validé"`, par convention « UMTF/diacritic safety » documentée dans CLAUDE.md / Code Style). Mineur — les lecteurs d'écran modernes gèrent l'UTF-8 sans problème, mais l'incohérence est visible.

**Fix:**
```ts
const ariaLabel =
  state === "current"
    ? `Niveau ${level} (en cours)`
    : state === "done"
      ? `Niveau ${level} (valide)`
      : `Niveau ${level} (verrouille)`;
```
Aligner sur l'orthographe ASCII du reste du projet.

### IN-07: `ProgressBar` — `aria-label` optionnel non typé

**File:** `components/ui/progress-bar.tsx:5,28`
**Issue:** `ariaLabel?: string` est optionnel, et si non fourni, l'attribut `aria-label={undefined}` est rendu — React le supprime, donc le `<div role="progressbar">` n'a **aucun nom accessible** quand le caller oublie de passer `ariaLabel`. WCAG 4.1.2 prescrit un nom accessible pour `role="progressbar"`. Recommandation : soit rendre `ariaLabel` obligatoire, soit fournir un fallback générique (« Progression »).

**Fix:**
```ts
export type ProgressBarProps = {
  value: number;
  ariaLabel: string; // rendre obligatoire
  ...
};
```
Ou en garder optionnel avec fallback :
```tsx
aria-label={ariaLabel ?? "Progression"}
```

---

_Reviewed: 2026-05-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
