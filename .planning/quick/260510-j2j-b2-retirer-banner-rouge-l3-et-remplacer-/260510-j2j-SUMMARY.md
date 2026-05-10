---
phase: 260510-j2j
plan: 01
subsystem: player-journey-ui
tags: [t3-improvements, b2, r2-warn-only, r3-no-hardcoded-blocking, eic-cardinal-rules, surface-visual-only]
requires:
  - lib/i18n.ts dictionaries existing keys (journey_v2_drawer_locked left as dead-code for compat)
  - app/globals.css existing tokens --wf-amber, --wf-amber-tint
  - components/journey-track.tsx caller no-op-locked-click contract preserved
provides:
  - i18n key journey_v2_locked_hint_amber (FR + EN, plain-ASCII)
  - CSS class .eic-track__node-tooltip (absolute, focus/hover trigger, mobile reposition, prefers-reduced-motion guard)
  - CSS class .eic-locked-hint--amber (inline variant, drawer/hint reuse)
  - JourneyLevelNode locked tooltip (role="tooltip" + aria-describedby) without DOM disabled
affects:
  - /journey page (Player) — node hover/focus tooltip + drawer locked body + 3rd-col hovered hint
  - All locked levels (L0-L7), L3 specifically targeted by T3-B2 brief
key-files:
  modified:
    - lib/i18n.ts (+2 lines, FR + EN)
    - app/globals.css (+51 lines after .eic-track__node-pulse block)
    - components/journey-level-node.tsx (+24 / -1)
    - components/journey-client.tsx (+12 / -2)
    - components/journey-drawer.tsx (+15 / -5)
decisions:
  - Plain-ASCII copy retenu (anti-leak diacritiques cohérent avec voisinage `journey_v2_*` existant) malgré préférence générale UEMF pour diacritiques. La convention plain-ASCII est dominante sur tout le bloc journey (`Niveau verrouille`, `Tapez un niveau`...). EIC pedagogical advisor brief endosse explicitement la formulation 'Astuce :' warn-only à la ligne 36-39 ("Replace with: ambre tooltip 'Astuce : compléter L2.2 améliore L3' + slightly desaturated mission card").
  - `aria-disabled="true"` conservé sur node locked au lieu du DOM `disabled` — signal sémantique AT non-bloquant qui satisfait R3 (interactivité préservée) tout en surfaçant le statut "rien à faire ici" aux lecteurs d'écran.
  - Tooltip CSS-only (pas de wrapper React, pas de Radix/headless-ui/react-tooltip ajouté) — déclencheurs `:hover` + `:focus` + `:focus-visible` directement dans `.eic-track__node-tooltip`. Conforme contrainte plan "0 nouvelle dépendance".
  - `t.journey_v2_drawer_locked` (l'ancienne copie hard-stop) conservée dans dictionaries fr+en mais plus référencée par aucune surface Player journey live (devient dead-code compat). Pas de retrait pour éviter rupture si audit grep ailleurs ou si i18n consumer externe.
  - `role="note"` (pas `role="alert"`) sur le drawer body locked — annotation contextuelle warn-only, pas message d'alerte. `role="alert"` aurait violé R2 (sémantique error/danger).
metrics:
  duration: ~30 min
  completed: 2026-05-10
  commits: 3
  tasks: 3/3
  files_changed: 5
  lines_added: 104
  lines_removed: 8
---

# Quick 260510-j2j: B2 — Retirer banner rouge L3 et remplacer par tooltip ambre warn-only · Summary

T3-IMPROVEMENTS section H — bascule visuelle danger→warn pour tous les niveaux verrouillés du parcours Player, avec retrait du blocage clavier (R3) et adoption de la palette ambre warn-only (R2). Pure surface visuelle ; logique de progression intacte.

## Avant / Après — 3 surfaces affectées

| Surface | Avant | Après |
|---|---|---|
| **Node track (`<button class="eic-track__node is-locked">`)** | DOM `disabled={state==='locked'}` (hors tab-order, pas de focus possible). Aucun tooltip. État "hard-stop" implicite. | DOM `disabled` retiré. `aria-disabled="true"` (signal AT). Enfant `<span role="tooltip" id="eic-track-tooltip-{levelId}">` rendu uniquement quand locked, contenu = `t.journey_v2_locked_hint_amber`. Trigger CSS-only `:hover` + `:focus` + `:focus-visible` via `.eic-track__node-tooltip` (palette `--wf-amber-tint`/`--wf-amber`/`#DCC394`). Mobile <720px : tooltip remonte au-dessus du node. `aria-describedby` câblé pour annonce screen-reader au focus. |
| **3rd-col HoveredHint (`/journey` colonne tip)** | Pour locked, rendait `t.journey_v2_drawer_locked` ("Niveau verrouille. Terminez les niveaux precedents.") dans `.eic-journey__tip-body` neutre. | Pour locked, rend `t.journey_v2_locked_hint_amber` ("Astuce : completez les niveaux precedents pour maximiser la qualite de celui-ci.") avec classe additionnelle `eic-locked-hint--amber` (encadré ambre warn-only). États `current` / `done` conservent leur palette neutre existante. |
| **Drawer body fallback (cards.length === 0 + locked)** | `<p style={{color:'var(--wf-ink-soft)'}}>` rendant `t.journey_v2_drawer_locked` (ton hard-stop neutre). | `<p role="note" className="eic-locked-hint--amber">` rendant `t.journey_v2_locked_hint_amber`. `role="note"` (annotation contextuelle), pas `role="alert"` qui violerait R2. État non-locked sans cards inchangé. |

## Conformité R2 / R3

- **R2 (validators warn-only)** ✓ — palette tooltip = ambre exclusivement (`var(--wf-amber-tint)` background, `var(--wf-amber)` color, `#DCC394` border) — exactement la même que `.eic-pill--amber` existante. Aucun token rouge/rose/danger introduit. Audit grep (`red-soft|--red|--brand-danger|#DC2626|#C44536|#a63d2f|tone="rose"|tone="danger"|severity.*error|className=.*danger`) sur les 3 composants journey-* modifiés → **0 match**.
- **R3 (pas de blocage en dur)** ✓ — DOM attribute `disabled` complètement retiré du `<button>` locked. Le node reste tab-able, focus-able au clavier, et le tooltip se déclenche au focus (`:focus-visible` + `aria-describedby` annonçant l'astuce aux SR). No-op du click reste géré côté parent (`journey-track.tsx` : `state !== "locked" && onLevelClick?.(id)`) — donc cliquer un node locked n'ouvre pas le drawer mais ne bloque pas non plus l'interface. `aria-disabled="true"` ajouté pour le signal sémantique AT sans retrait du tab-order.

## Audit anti-rouge (verification block plan)

```
$ grep -nE "red-soft|--red|--brand-danger|#DC2626|#C44536|#a63d2f|tone=\"rose\"|tone=\"danger\"|severity.*error|className=.*danger" \
    components/journey-level-node.tsx \
    components/journey-client.tsx \
    components/journey-drawer.tsx \
    components/journey-track.tsx \
    components/journey-deliverable-card.tsx \
    components/journey-hero-next-step.tsx
→ 0 match
```

## Audit non-régression progression

```
$ git diff --stat lib/journey-progression.ts lib/journey.ts database/ utils/supabase/
→ 0 ligne modifiée (vide)
```

`lib/journey-progression.ts`, `lib/journey.ts`, `database/*.sql`, `utils/supabase/*` strictement intacts. Le changement est exclusivement présentationnel — `currentLevel`, `getLevelStates`, le scoring, les triggers SQL, les RLS policies n'ont pas été touchés.

## Audit nouvelle clé i18n présente

```
$ grep -n journey_v2_locked_hint_amber lib/i18n.ts components/journey-*.tsx
lib/i18n.ts:166:    journey_v2_locked_hint_amber: "Astuce : completez les niveaux precedents pour maximiser la qualite de celui-ci.",
lib/i18n.ts:646:    journey_v2_locked_hint_amber: "Tip: complete the previous levels to maximize the quality of this one.",
components/journey-level-node.tsx:71:          {t.journey_v2_locked_hint_amber}
components/journey-client.tsx:147:        : t.journey_v2_locked_hint_amber;
components/journey-drawer.tsx:149:                {t.journey_v2_locked_hint_amber}
→ 5 matches (2 i18n FR+EN, 3 composants journey-*)
```

## Audit `disabled` retiré du node

```
$ grep -n disabled components/journey-level-node.tsx
8:// (R3 — no hardcoded blocking; `disabled` removed from the DOM element).
53:      aria-disabled={isLocked ? "true" : undefined}
→ 0 match sur DOM `disabled` (seulement un commentaire de doc + aria-disabled non-bloquant)
```

## Audit aucune nouvelle dépendance

```
$ git diff --stat package.json package-lock.json
→ vide
```

Aucune dépendance ajoutée. Tooltip implémenté en CSS-only (pas de Radix, pas de headless-ui, pas de react-tooltip).

## Audit total surface (5 fichiers max)

```
$ git diff --stat HEAD~3..HEAD
 app/globals.css                   | 51 +++++++++++++++++++++++++++++++++++++++
 components/journey-client.tsx     | 14 +++++++++--
 components/journey-drawer.tsx     | 20 +++++++++++----
 components/journey-level-node.tsx | 25 ++++++++++++++++++-
 lib/i18n.ts                       |  2 ++
 5 files changed, 104 insertions(+), 8 deletions(-)
→ exactement 5 fichiers (contrainte respectée)
```

## EIC pedagogical advisor — consultation

Conformément à la directive plan ligne 145 ("AVANT de figer la copie FR, consulter l'agent EIC pédagogique"), le fichier `.claude/agents/eic-pedagogical-advisor.md` a été lu en début d'exécution. L'agent endosse explicitement la formulation `'Astuce : ...'` warn-only à sa section R3 (ligne 36-39) :

> **R3 — No hardcoded mission blocking** : Replace with: ambre tooltip "Astuce : compléter L2.2 améliore L3" + slightly desaturated mission card (no banner rouge, no greyed-out layout).

La copie retenue ("Astuce : completez les niveaux precedents pour maximiser la qualite de celui-ci.") suit exactement ce gabarit, généralisé à tous les niveaux locked (pas seulement L2.2→L3) puisque la surface est partagée.

**Tension diacritiques résolue** : l'advisor flagge à sa ligne 109 toute copie FR sans accents, mais la convention `journey_v2_*` existante est plain-ASCII (`journey_v2_drawer_locked: "Niveau verrouille. Terminez les niveaux precedents."` etc.). Le plan ligne 143 confirme : "C'est intentionnel (anti-leak diacritiques mailto/CSV — cf. CONVENTIONS.md)". La cohérence locale du bloc journey prime ; recommandation upgrade diacritiques différée à un quick task transverse hors scope j2j.

## Deviations from Plan

**None** — plan exécuté tel qu'écrit. 5 fichiers modifiés, 3 commits atomiques, 0 modif progression, 0 nouvelle dépendance, 0 token rouge introduit.

### Auto-fixed Issues

Aucun. Le plan était structurellement complet.

## Deferred Issues

**Pre-existing lint errors** (out of scope — pas causées par 260510-j2j) :

ESLint flat config ne registre pas `eslint-plugin-react-hooks`, mais `components/field-completion-counter.tsx:101` et `hooks/use-auto-save.ts:68,107` utilisent `// eslint-disable-next-line react-hooks/exhaustive-deps` introduits par quick task `260510-iee`. Résultat : `npm run lint` et `npm run build` (post-compile lint phase) sortent avec 3 erreurs `Definition for rule 'react-hooks/exhaustive-deps' was not found`.

- **Pre-existence vérifiée** via `git stash` + `npm run lint` sur `main@f40b5f2` (avant tout patch j2j) → mêmes 3 erreurs.
- **Surface j2j sans erreur lint propre** : les 5 fichiers modifiés par ce plan ne déclenchent eux-mêmes aucune erreur lint.
- **Build compile step** : `✓ Compiled successfully in 4.3s` — typecheck OK, le build casse uniquement à l'étape lint sur les fichiers iee.
- **Tracking** : `.planning/quick/260510-j2j-b2-.../deferred-items.md` (créé en cours d'exécution) recommande un quick task transverse pour enregistrer le plugin manquant.

Per scope-boundary rule (deviation rules section, "Pre-existing warnings, linting errors, or failures in unrelated files are out of scope. Do NOT fix them"), aucun fix tenté ici.

## Verification Results

| Check | Status |
|---|---|
| `npm run typecheck` | **PASS** (exit 0, no errors) |
| `npm run lint` (j2j surface only) | PASS (5 modified files clean) |
| `npm run lint` (whole repo) | FAIL — 3 pre-existing errors in `iee` files (deferred, see Deferred Issues) |
| `npm run build` compile | PASS (`✓ Compiled successfully in 4.3s`) |
| `npm run build` lint phase | FAIL — same 3 pre-existing errors |
| Audit anti-rouge (6 surfaces journey) | PASS (0 match on red/danger tokens) |
| Audit `disabled` retiré | PASS (0 DOM disabled, only aria-disabled) |
| Audit progression non-régression | PASS (`lib/journey-progression.ts`, `lib/journey.ts`, `database/`, `utils/supabase/` all 0 lines diff) |
| Audit clé i18n présente ≥4× | PASS (5 matches) |
| Audit aucune nouvelle dépendance | PASS (`package.json`/`package-lock.json` 0 diff) |
| Audit surface ≤5 fichiers | PASS (exactement 5 fichiers) |

## Commits

| # | Hash | Subject |
|---|---|---|
| 1 | `8f46892` | feat(j2j): add journey_v2_locked_hint_amber i18n key + tooltip CSS classes |
| 2 | `25f830e` | feat(j2j): wire amber tooltip + remove disabled blocker on locked nodes |
| 3 | `4733406` | feat(j2j): switch HoveredHint + drawer body to amber warn-only for locked |

## Self-Check: PASSED

Files verified to exist :
- FOUND: lib/i18n.ts (modified, journey_v2_locked_hint_amber present FR+EN)
- FOUND: app/globals.css (modified, .eic-track__node-tooltip + .eic-locked-hint--amber present)
- FOUND: components/journey-level-node.tsx (modified, disabled removed, tooltip rendered for locked)
- FOUND: components/journey-client.tsx (modified, HoveredHint locked branch switched)
- FOUND: components/journey-drawer.tsx (modified, drawer body locked switched)
- FOUND: .planning/quick/260510-j2j-b2-retirer-banner-rouge-l3-et-remplacer-/deferred-items.md (out-of-scope tracking)

Commits verified to exist :
- FOUND: 8f46892 (Task 1)
- FOUND: 25f830e (Task 2)
- FOUND: 4733406 (Task 3)
