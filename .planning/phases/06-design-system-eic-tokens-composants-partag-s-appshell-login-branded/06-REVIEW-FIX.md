---
phase: 06-design-system-eic-tokens-composants-partag-s-appshell-login-branded
fixed_at: 2026-05-10T00:00:00Z
review_path: .planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 4
skipped: 1
status: partial
---

# Phase 6 : Rapport de fix de revue de code

**Fixed at:** 2026-05-10T00:00:00Z
**Source review:** `.planning/phases/06-design-system-eic-tokens-composants-partag-s-appshell-login-branded/06-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (warnings WR-01 a WR-05, info skipped par fix_scope=critical_warning)
- Fixed: 4
- Skipped: 1
- Typecheck global: propre (`npx tsc --noEmit` sans erreur post-fixes)

## Fixed Issues

### WR-01: Label `<label>` n'enveloppe pas correctement son input dans LoginForm

**Files modified:** `components/login-form.tsx`
**Commit:** 94af9ef
**Applied fix:** Encapsulation des deux textes de label (`{t.login_email}`, `{t.login_password}`) dans des `<span>` enfants directs du `<label className="form-row">`. Aligne le markup sur l'idiome `<label><span>{text}</span><input /></label>` recommande pour les outils d'accessibilite (NVDA/VoiceOver) et stabilise le ciblage CSS / focus visuel. Aucune modification du comportement de validation cote serveur.

### WR-03: `<title>` dans le SVG de `EICLogo` rendu inutile par `aria-hidden="true"` sur le SVG

**Files modified:** `components/ui/eic-logo.tsx`
**Commit:** d793894
**Applied fix:** Ajout de `aria-label="EIC - Euromed Innovation Center"` sur le `<span role="img">` parent (qui n'avait aucun nom accessible auparavant), suppression du `<title>` inerte place sous `<svg aria-hidden="true">`, et marquage du `<span className="eic-logo__word">` interne en `aria-hidden="true"` pour eviter une double annonce du nom accessible. Resout le defaut WCAG 4.1.2 (Name, Role, Value) en particulier sur `/login` ou le logo n'est pas enveloppe par un `<Link aria-label>`.

### WR-04: `MobileTabBar` — coalescing inutile sur `pathname`

**Files modified:** `components/mobile-tab-bar.tsx`
**Commit:** e7fea54
**Applied fix:** Suppression du `?.` et du `?? false` autour de `pathname.startsWith(...)` ; `usePathname()` de Next.js 15 retourne toujours `string` dans un client component monte. Code simplifie en `pathname === item.href || pathname.startsWith(\`${item.href}/\`)`.

### WR-05: `app/onboarding/page.tsx` — non-null assertion implicite sur `membership.players`

**Files modified:** `app/onboarding/page.tsx`
**Commit:** 779b79b
**Applied fix:** Application du pattern `Array.isArray(raw) ? raw[0] : raw` deja utilise plus bas pour `profiles`, en remplacant le cast direct `as { ... } | null | undefined`. La variable intermediaire `rawPlayer` accepte desormais `T | T[] | null | undefined` et `player` est normalise en objet ou `undefined`. Securise contre une evolution future du schema Supabase ou la jointure `players` retournerait un tableau (cas FK non unique cote `player_members`). Comportement identique a iso-schema.

## Skipped Issues

### WR-02: HTML invalide dans `app/admin/players/[id]/page.tsx`

**File:** `app/admin/players/[id]/page.tsx:136-147`
**Reason:** Faux positif explicitement reconnu par le reviewer. Apres son inspection complete, la conclusion litterale du finding est : « **Le seul vrai HTML invalide** se trouve dans `app/journey/deliverable/[id]/page.tsx:72-81` ou le `<p>` contient un `<Link>` (qui rend un `<a>`) — valide. Faux positif apres inspection complete. » et « **Pas un bug**, mais la semantique HTML serait amelioree par `<dl>` ». Le fix propose (refactor `<p>` en `<dl><dt><dd>` sur les pages staff admin) est explicitement marque « Refactor optionnel — pas bloquant pour le pilote » par le reviewer. Rentre dans la dette de IN-01 (« decision DSY-04 partiellement appliquee — styles inline encore omnipresents sur les pages staff »), planifiable post-pilote en mini-phase « DSY-08 staff pages tokens migration ». Pas applique pour respecter le scope du fix automatique et eviter un refactor large des pages staff a J-3 du pilote (13 mai 2026).
**Original issue:** Le finding decrit un HTML potentiellement invalide dans plusieurs `<p>` contenant des `<span>`/`<strong>`, mais conclut que tous les cas inspectes sont en realite valides ; la recommandation finale porte sur la semantique (`<dl>` plutot que `<p>` pour les paires label/value), non sur la validite.

---

_Fixed: 2026-05-10_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
