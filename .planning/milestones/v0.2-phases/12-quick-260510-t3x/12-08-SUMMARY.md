---
phase: "12-quick-260510-t3x"
plan: "12-08"
subsystem: "ui-player-bonus"
tags: [t3x-expansion, bonus-events, player-ui, r1-strict, wave-3]
requires: ["12-06"]
provides:
  - "components/bonus-claim-form.tsx (Player client form for bonus claim via claimBonusEventFlow)"
  - "components/bonus-status-badge.tsx (qualitative R1-strict status badge for Player)"
affects:
  - "Plan 12-10 (journey/bonus/[type] route) — will consume both components"
  - "Mentor flow Plan 12-10 (app/mentor/bonus/[id]) — will consume bonus-status-badge.tsx with isGameMaster gate"
tech-stack:
  added: []
  patterns:
    - "React 19 useActionState + useEffect router.refresh"
    - "Server action consumption (claimBonusEventFlow) via form action prop"
    - "Server component (no 'use client') for purely presentational badge"
    - "Inline styles + i18n consumption via dictionaries.fr (no clsx, no CSS modules)"
key-files:
  created:
    - "components/bonus-claim-form.tsx"
    - "components/bonus-status-badge.tsx"
  modified: []
decisions:
  - "Badge label for BonusStatus='draft' reuses bonus_status_submitted i18n key (draft is rare DB state, treated as 'En attente de validation' from Player POV)"
  - "consumedAt prop drives '(consomme)' suffix on validated badge — pure ASCII suffix concat to avoid French accent in TS code (i18n value itself may contain accents)"
  - "aria-label echoes visible label on submit/url/desc inputs for screen-reader parity"
metrics:
  duration: "~7 minutes"
  completed: "2026-05-10T22:00:00Z"
  files_created: 2
  files_modified: 0
  commit: "6a5c951"
---

# Phase 12 Plan 08: T3X-EXPANSION Wave 3 — Player Bonus UI (R1-strict) Summary

One-liner: Two new Player-facing components for the bonus claim flow — a client form wired to `claimBonusEventFlow` via `useActionState`, and a server-rendered qualitative status badge that renders zero numeric data (R1 frontline guard).

## 2 composants livres

### 1. `components/bonus-claim-form.tsx` (client component, 138 lignes)
- `"use client"` directive ligne 5.
- `useActionState(claimBonusEventFlow, initialState)` — pattern aligne sur `submission-form.tsx`.
- `useEffect(() => { if (state.ok) router.refresh(); }, [state.ok, router])` — refresh route on success (server re-renders updated submission list).
- Fields:
  - `<input type="hidden" name="type" value={bonusType} />` — drives Plan 06 zod enum.
  - `<input type="text" name="title" required minLength=3 maxLength=200 defaultValue={BONUS_DEFAULTS[type].titleFr ?? ""} />`.
  - `<input type="url" name="docUrl" required pattern="https://.*" />` — defense-in-depth alongside Plan 06 `httpsUrl` zod schema.
  - `<textarea name="description" maxLength=2000 />` — optional.
- State message rendered as `<p role={state.ok ? "status" : "alert"}>` — accessibility.
- Submit button `disabled={pending}` — UX standard pattern (button-only disable during submit, NOT cross-mission gate, R3 respecte).

### 2. `components/bonus-status-badge.tsx` (server component, 65 lignes)
- Pas de directive `"use client"` — server-rendered.
- Props: `{ status: BonusStatus, consumedAt?: string | null }`.
- 4 styles distincts (draft / submitted / validated / rejected) via `STYLE_BY_STATUS` Record (background, color, border).
- 4 labels qualitatifs via `LABEL_BY_STATUS` Record (mapped to existing i18n keys `bonus_status_validated`, `bonus_status_submitted`, `bonus_status_rejected`).
- `draft` reuse `bonus_status_submitted` label (rare state, Player-side reads as "En attente").
- Si `status="validated" && consumedAt != null` -> suffix " (consomme)" (ASCII, sans accent dans le code TS).
- `role="status"` + `aria-label={label}` pour SR.

## R1 STRICT audit : 0 hit dans le code rendu

Audit grep en excluant les commentaires (qui contiennent volontairement `multiplier_factor` / `score` comme garanties documentaires) :

```bash
grep -vE '^\s*(//|\*|/\*)' components/bonus-claim-form.tsx components/bonus-status-badge.tsx \
  | grep -E 'multiplier|/100|/140|toFixed|percentile|\bpoints\b|\brank\b'
# -> 0 match
```

Hits sur le grep brut (incluant commentaires) :
- `bonus-claim-form.tsx:3` — `// R1 preserved : no score / multiplier_factor in render.` (commentaire de garantie, JAMAIS rendu Player).
- `bonus-status-badge.tsx:2` — `// R1 STRICT : QUALITATIVE LABEL ONLY. Aucun chiffre, aucun multiplier_factor,...` (commentaire de garantie).

Aucune occurrence dans le JSX render ni dans les props/state runtime. Le badge ne consomme ni `multiplierFactor` ni `score` ni `rank`. Le form ne rend pas non plus de multiplier (le hidden `type` input transmet uniquement l'enum `BonusType`).

## R1/R2/R3 self-audit checklist (eic-pedagogical-advisor not accessible from subagent)

Per CLAUDE.md "Pre-edit guards (zones sensibles)" — manual self-audit performed in lieu of advisor spawn :

| Rule | Status | Evidence |
|------|--------|----------|
| **R1** Score / rank / multiplier invisible Player | PASS | Badge props : `status` (qualitative enum) + `consumedAt` (timestamp, used as ternary boolean only). 0 numeric render. 0 mention of `multiplierFactor` in rendered JSX. Form hidden input transmits `type` enum, no factor. State message comes from `claimBonusEventFlow` which itself preserves R1 (Plan 06). |
| **R2** Validators warn-only | N/A | Pas de validator client-side cote pedagogique. `required` + `pattern="https://.*"` sont des contraintes HTML5 standard de form (auth UX, pas pedagogique). Le vrai zod gate est server-side dans Plan 06 (`bonusClaimSchema` + `httpsUrl`). |
| **R3** Pas de blocage inter-mission | PASS | `disabled={pending}` sur submit button = UX standard (empeche double-submit). 0 `blocks_progression_to`, 0 `eic-locked-hint`, 0 `if (locked) return null`. Aucune logique de gating cross-mission. |

R2 note : si l'on avait besoin de validators pedagogiques, on les ferait `severity: "warn"` via toast non-bloquant — pas implementes ici car le scope reste pure UI presentation + form passthrough.

## Pattern submission-form.tsx aligned

| Aspect | submission-form.tsx | bonus-claim-form.tsx |
|--------|---------------------|----------------------|
| Directive | `"use client"` | `"use client"` |
| State hook | `useActionState(submitDeliverable, initialState)` | `useActionState(claimBonusEventFlow, initialState)` |
| Refresh on success | `useEffect(...router.refresh()...)` | `useEffect(...router.refresh()...)` |
| Dictionary | `const t = dictionaries.fr` | `const t = dictionaries.fr` |
| Inline styles | Oui (gap/padding/border) | Oui (idem) |
| Submit pending state | `disabled={pending}` | `disabled={pending}` |
| Error/success render | `role={state.ok ? "status" : "alert"}` | idem |
| URL field | `type="url" required pattern="https://.*"` | idem |
| Hidden id passthrough | `<input type="hidden" name="deliverableTemplateId" />` | `<input type="hidden" name="type" />` |

Differences :
- `bonus-claim-form` n'utilise pas `useState` (pas de toggle kind comme `proof_url`/`proof_text` — toujours docUrl).
- `bonus-claim-form` n'a pas d'auto-save (pas necessaire — claim flow is fire-and-forget, pas de draft persistence requise au pilote).
- `bonus-claim-form` n'a pas de Pixel trigger (out-of-scope T3X-EXPANSION ; le Plan 10 ajoutera si besoin un trigger Pixel sur badge "Boost actif").

## Server vs client split

- `bonus-claim-form.tsx` = **client component** (form interaction, `useActionState`, `useEffect`, `useRouter`).
- `bonus-status-badge.tsx` = **server component** (pure presentation, no state, no event handlers, no client APIs).

Le split est intentionnel :
- Le badge sera utilise dans des contextes SSR pures (e.g. liste de bonus dans `journey` page server component) sans payer le cout de bundling client.
- Le form a besoin de l'hydration React 19 pour `useActionState` + redirect au router.

## Files modified

| File | Status | Lines | Role |
|------|--------|-------|------|
| `components/bonus-claim-form.tsx` | NEW | 138 | Player form claim bonus |
| `components/bonus-status-badge.tsx` | NEW | 65 | Player badge qualitatif R1-strict |

## Verification

```bash
$ npm run typecheck
# tsc --noEmit -> exit 0

$ npx eslint components/bonus-claim-form.tsx components/bonus-status-badge.tsx
# -> exit 0 (no output)

$ git log --oneline -1
6a5c951 feat(t3x-bonus-ui): add Player bonus claim form + qualitative status badge (R1-strict)

$ git diff --name-only HEAD~1 HEAD
components/bonus-claim-form.tsx
components/bonus-status-badge.tsx
```

Full `npm run lint` reports 6 pre-existing errors in `scripts/provision-agreentech-cohort.cjs` + `smoketest/scripts/create-test-accounts.cjs` (`@typescript-eslint/no-require-imports`). Out-of-scope for this plan per CLAUDE.md SCOPE BOUNDARY rule — logged here for awareness, not fixed.

## Next consumers (Plan 12-10)

- `app/journey/bonus/[type]/page.tsx` — Player route SSR, renders `BonusStatusBadge` + `BonusClaimForm` ; reads bonus_events via `lib/score.ts:hasActiveBonus` for boolean active state.
- `app/mentor/bonus/[id]/page.tsx` — Mentor review page. Mentor side MAY render `multiplierFactor` numerically (R1 only constrains Player UI), but should still use `BonusStatusBadge` for status display consistency.
- `app/journey/page.tsx` — Journey rail integration : 3 cards (verbatims terrain, dev plan, prototype draft) with link to bonus claim route + badge inline if existing bonus.

## Auto-mode checkpoint

Plan 12-08 contains `task type="checkpoint:advisor-audit"` (Task 3). Auto-mode active per orchestrator flag.

`⚡ Auto-approved checkpoint: 2 components built, R1 grep clean (0 hits in non-comment code), R3 clean (only disabled={pending} = standard UX pattern), npm checks pass.`

Commit performed automatically per auto-mode rules.

## Self-Check: PASSED

- [x] `components/bonus-claim-form.tsx` exists (FOUND).
- [x] `components/bonus-status-badge.tsx` exists (FOUND).
- [x] Commit `6a5c951` exists in `git log --oneline -1` (FOUND).
- [x] `git diff --name-only HEAD~1 HEAD` lists exactly the 2 files (FOUND).
- [x] R1 grep audit clean on non-comment code (0 hits).
- [x] `npm run typecheck` exit 0.
- [x] `npx eslint` on the 2 files exit 0.
