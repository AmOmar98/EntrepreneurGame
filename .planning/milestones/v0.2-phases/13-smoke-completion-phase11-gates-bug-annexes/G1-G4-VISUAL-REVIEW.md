# G1 — Visual review prod + G4 — GM radar dashed lines (Phase 11 gate closeout / Phase 13)

**Date** : 2026-05-10
**Auteur** : Ralph (Claude Opus 4.7) — branche `ralph/pre-pilot-phases-13-14`
**Verdict global** : **G1 PARTIAL** (2/4 routes capturées en demo, 2 routes auth-gated reportées à Omar pré-pilote) / **G4 PASS** (code-vérifié).

## Limites de cette session

Cette session Ralph ne peut pas se logger sur PROD comme `eic_admin` ni comme Player authentifié — l'authentification Supabase requiert un magic-link, hors-scope d'un agent autonome. Donc :

- **G1 /landing** et **G1 /journey** : capturés en demo mode port 3002 (équivalent visuel valide, demo mode rend les mêmes composants).
- **G1 /results** : non-testable en demo (redirige vers /login sans session) — sera couvert post-publish Wave A 13-02 par Playwright PROD.
- **G1 /admin?live=1** + **G4** : auth-gated → Omar doit re-passer un Playwright PROD avec GM session post-merge ralph branch. Le code G4 est validé.

## G1 — Visual review

### /landing (port 3002 demo, viewport 1440×900)

Verdict : **PASS** (visuel cohérent avec design v2).

- Hero EIC-rouge avec branding UEMF visible.
- Sections sous-pliage : challenges, levels, mascotte Pixel SVG.
- Pas d'animation perpétuelle visible (cohérent G2).
- Pas d'overflow horizontal (cohérent G3).
- Screenshot : `screenshots/G1-desktop-landing.png`

### /journey (port 3002 demo, viewport 1440×900)

Verdict : **PASS** (rendu Player demo cohérent).

- Topbar EIC + nav `Mon parcours` + logout en bouton (post-13-07 fix).
- `<h1>Mon parcours</h1>` rendu.
- `<main>` présent, scroll vertical 912px (cohérent contenu chargé).
- Pas d'erreur server-side (200 OK).
- Screenshot : `screenshots/G1-desktop-journey.png`

### /results

**DEFERRED** — Demo mode redirige vers `/login`. Sera couvert par 13-02 Wave A (publication SQL + Playwright PROD/G01).

### /admin?live=1

**DEFERRED** — Demo mode redirige vers `/login` (`eic_admin` role requis). À refaire par Omar avec session GM PROD.

Procédure proposée à Omar (5 min, post-merge ralph branch) :
1. `npm run dev` avec `.env.local` Supabase activé (PROD ou Branche test).
2. Login GM : Fatimaezzahra credential GM.
3. Naviguer `http://localhost:3000/admin?live=1`.
4. Vérifier que ≥2 teams `state=active` sont visibles dans le radar.
5. Vérifier `dashed lines` visibles (SVG `.eic-admin-radar__links line` avec `stroke-dasharray="1.2 1.2"`).
6. Capturer screenshot `05-admin-radar.png`.

## G4 — GM radar dashed lines (code audit)

Verdict : **PASS** (code-vérifié à `components/admin-radar.tsx`).

### Code source du rendu dashed lines

`components/admin-radar.tsx:34-76` :

```tsx
// Phase 11 / B4 — pair-up active teams for dashed connection lines.
const activeNodes = nodes.filter((n) => n.state === "active");
const activePairs = /* ...pair-up combinations... */;

{activePairs.length > 0 ? (
  <svg ... className="eic-admin-radar__links">
    {activePairs.map(({ a, b }) => (
      <line
        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke="rgba(196, 69, 54, 0.45)"
        strokeWidth={0.4}
        strokeDasharray="1.2 1.2"      // ← dashed lines pattern
        vectorEffect="non-scaling-stroke"
      />
    ))}
  </svg>
) : null}
```

### Vérifications statiques

| Critère G4 | Statut | Source |
|---|---|---|
| Lines visibles uniquement entre teams `state === "active"` | OK | `components/admin-radar.tsx:35` filtre `state==="active"` |
| Pattern dashed | OK | `strokeDasharray="1.2 1.2"` |
| Couleur EIC-rouge atténuée 45% | OK | `rgba(196, 69, 54, 0.45)` |
| Stroke vectoriel non-scaling | OK | `vectorEffect="non-scaling-stroke"` |
| Pas de R1 leak (pas de score affiché) | OK | Comment `Phase 9 / GMR-02 ... GM-only surface, no R1 surface (no scores rendered on lines).` |

### Test runtime PROD à valider

Omar doit confirmer visuellement avec ≥2 teams active simultanées dans le radar :
- Lines tracées entre chaque paire d'active teams (n*(n-1)/2 paires).
- Pattern dashed visible à l'œil nu.
- Couleur cohérente avec le tone EIC-rouge.

## Synthèse

| Sub-criterion | Statut Ralph | À faire par Omar (5 min pré-pilote) |
|---|---|---|
| G1 /landing | PASS demo | Re-capture PROD 1:1 (visual diff vs Vercel) |
| G1 /journey | PASS demo | Re-capture PROD Player session |
| G1 /results | DEFERRED | Couvert par 13-02 Wave A (publication+capture PROD) |
| G1 /admin?live=1 | DEFERRED | Login GM + capture 05-admin-radar.png |
| G4 dashed lines code | PASS | Visual confirm sur PROD avec ≥2 teams active |

## Conclusion

- **G4 code-validé** PASS — le rendu dashed lines est implémenté correctement, sera visible dès que ≥2 teams `state=active` sont présentes simultanément dans le radar.
- **G1 partiel** : 2/4 routes capturées en demo, 2 reportées (`/results` à Wave A 13-02, `/admin?live=1` à Omar avec session GM PROD).
- Pas un blocker pour 13/05 8h30 : Omar peut faire la capture 05-admin-radar lui-même en 5 min depuis son poste GM Vercel.
