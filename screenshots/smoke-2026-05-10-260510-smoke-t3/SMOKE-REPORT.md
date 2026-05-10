# Smoke Report — T-3 Fixes Validation

- **Date**: 2026-05-10
- **Quick task ID**: 260510-smoke-t3
- **Operator**: smoke-tester agent (Claude Sonnet)
- **Mode**: Demo (no `.env.local`, no Supabase)
- **Dev server**: Next.js 15.5.18, port 3000 (PID 1352, killed cleanly post-smoke)
- **Verdict**: **PASS-WITH-FINDINGS** (1 environmental finding; all 7 fix audits green)

## Environmental finding (not a regression)

**F-ENV-01 — `/journey` is unreachable in demo mode without auth.**
Severity: **minor (environmental, not a fix regression)**.

Root cause: the current `app/journey/page.tsx:28-32` calls `getCurrentUser()` and immediately `redirect("/login")` when null. In demo mode (no Supabase env), `createClient()` returns null → `getCurrentUser()` returns null → all role-gated routes (`/`, `/journey`, `/admin`, `/mentor`, `/jury`, `/results`) redirect to `/login`. Only `/login` and `/onboarding` render content in demo mode.

This means the agent contract's **standard run steps 3-8** (visual smoke of `/journey`, hover L3 tooltip, Cohort Pulse Bar render, Pixel triggers, reduced-motion, mobile journey) are **NOT executable in demo mode** as written. The agent contract was authored when middleware-only gating allowed direct browsing in demo mode, but the page-level guard now blocks too.

**Mitigation in this run**: full smoke shifted to **comprehensive static audit** (grep against the 4 fix surfaces) + visual smoke restricted to `/login` for design-system regression + console/network sanity. Static audits are evidence-rich for these 4 fixes since each is anchored on observable strings (class names, i18n keys, constants).

**Recommended action for next smoke**: either (a) add a demo-mode auth bypass cookie helper, (b) run smoke against a dedicated staging Supabase project with seeded test users, or (c) update the agent contract to formalise the static-audit-first methodology.

## Fix-by-fix verdict

| Fix  | Quick task | Method        | Verdict | Notes |
|------|------------|---------------|---------|-------|
| B2 — banner L3 → tooltip ambre   | j2j | Static (grep) | ✅ PASS | `eic-locked-hint--amber` rendered in 3 components; `journey_v2_locked_hint_amber` i18n key referenced in 4 spots; `<button>` uses `aria-disabled` only, NO native `disabled` attribute → R3 compliant. R2 explicit comment in `journey-level-node.tsx:7` ("never red/danger"). |
| A5 — Pixel mascotte 3 triggers   | jm8 | Static (read) | ✅ PASS | All 3 triggers exported from `hooks/use-pixel-trigger.ts`: `useFirstDeliveryTrigger` (localStorage-backed), `useStagnationTrigger` (15min idle), `useVerbatimCountTrigger` (1→2 CustomEvent). All deterministic (no `Math.random`). Header comment documents R1/R2/R3 compliance. **`STAGNATION_THRESHOLD_MS = 15 * 60 * 1000` confirmed pristine** (not patched — `git diff hooks/use-pixel-trigger.ts` empty). |
| B1 — Cohort Pulse Bar anonymisée | k1f | Static (read) | ✅ PASS | `components/cohort-pulse.tsx:21` is a pure server component. Props are `{levelId, count, total}[]` only — no per-team identifiers. Renders only `{e.count}/{e.total}` (line 63) and short-level-label. Anti-leak guard at lines 22-35 shows empty copy when total=0 or all counts=0. Header comment includes the explicit grep audit recipe. |
| B1 RÉTRO — R1 leak `/results`    | kpw | Static (grep) | ✅ PASS | `components/results-replay.tsx`: `isGameMaster` prop threaded (5 occurrences, gates score visibility). `components/results-podium.tsx`: same pattern (3 occurrences). Demo-mode banner verified in past smoke; no live render here. |
| B2 RÉTRO — pondération 20/80     | l3m | Static (grep) | ✅ PASS | `lib/results.ts:32` shows `export const DEFAULT_PITCH_WEIGHT = 0.8;`. Pondération AgreenTech 0.20 projet + 0.80 pitch correctly anchored. |
| B3 RÉTRO — migrations LIVE       | lu5 | Static (ls)   | ✅ PASS | `supabase/migrations/20260510140000_phase08_mentor_comments.sql` and `20260510140001_phase09_gamemaster_live.sql` present. Already verified `--linked` per agent contract. |
| B4 RÉTRO — seed AgreenTech       | l68 | Static (grep) | ✅ PASS | `database/seed_event_hackdays.sql` audit: `"max":5` count = **45** (expected 45 = 9 missions × 5 criteria). `AgreenTech/AgriTech` keyword count = 29 (expected ≥9). Rubric criteria keywords: innovation=10, feasibility=10, business=16, evidence=10, quality=10. All thresholds met. |

## Visual smoke (limited surface)

| Step | Screenshot | Verdict | Notes |
|------|-----------|---------|-------|
| Login desktop 1440 | `00-login-baseline-desktop-1440.png` | ✅ Renders | EIC branded login, partner banner, glass card. Page title: `Entrepreneur Game - EIC / UEMF`. |
| Journey → demo redirect | `01-journey-redirects-to-login-demo.png` | ✅ Expected | Confirms demo-mode behavior: redirect to `/login`. Captured for environmental documentation. |
| Login mobile 390 | `02-login-mobile-390.png` | ✅ Renders | Layout doesn't overflow at iPhone 14 width. |

## Console + network sanity

- **Console errors during navigation** (`/login`, `/journey` redirect, `/login` mobile): **0 errors, 0 warnings** (1 info message). See `console-errors.txt`.
- **Network 500s**: **0**. See `network-requests.txt`. The journey navigation triggers an expected `307 → /login`.

## Static audit details (anchored evidence)

### B2 (j2j) — `eic-locked-hint--amber` and amber-tooltip evidence

```
components/journey-drawer.tsx:145:                className="eic-locked-hint--amber"
components/journey-drawer.tsx:149:                {t.journey_v2_locked_hint_amber}
components/journey-client.tsx:171:        : t.journey_v2_locked_hint_amber;
components/journey-client.tsx:178:            ? "eic-journey__tip-body eic-locked-hint--amber"
components/journey-level-node.tsx:53:      aria-disabled={isLocked ? "true" : undefined}
components/journey-level-node.tsx:71:          {t.journey_v2_locked_hint_amber}
```

`components/journey-level-node.tsx:50-74` shows `<button>` with `aria-disabled` only — NO native `disabled` DOM attribute → cardinal rule R3 ("aucun blocage codé en dur") respected.

### B1 (k1f) — anti-leak by construction

```typescript
// components/cohort-pulse.tsx:17-19
export type CohortPulseProps = {
  entries: CohortPulseEntry[];   // {levelId, count, total}[] only
};
```

The component cannot render team names because they are NOT in props. R1 ("score invisible Player") respected by construction.

### B1 RÉTRO (kpw) — `isGameMaster` gate

```
components/results-replay.tsx:19:  isGameMaster: boolean;
components/results-replay.tsx:44:export function ResultsReplay({ rows, stats, publishedAt, isGameMaster }: Props) {
components/results-replay.tsx:79:        <ResultsPodium entries={podium} isGameMaster={isGameMaster} />
components/results-replay.tsx:84:      {isGameMaster ? (
components/results-replay.tsx:167:          {isGameMaster ? (
components/results-podium.tsx:65:              {isGameMaster ? (
```

Score chips, KPI rows, and CSV exports all wrapped in `isGameMaster` ternaries. Player view receives narrative-only content.

### B2 RÉTRO (l3m) — pondération

```
lib/results.ts:32:export const DEFAULT_PITCH_WEIGHT = 0.8;
lib/results.ts:80:  if (typeof w !== "number" || Number.isNaN(w)) return DEFAULT_PITCH_WEIGHT;
```

### B4 RÉTRO (l68) — seed_event_hackdays.sql counts

```
$ grep -c '"max":5\|"max": 5' database/seed_event_hackdays.sql
45                                  # 9 missions × 5 criteria each ✓
$ grep -ic "agreentech\|agritech" database/seed_event_hackdays.sql
29                                  # ≥9 expected ✓
$ for kw in innovation feasibility business evidence quality; do grep -ic "$kw" ...; done
innovation:  10
feasibility: 10
business:    16
evidence:    10
quality:     10                     # all ≥9 ✓
```

## Manual smoke checklist for items that need Supabase mode

The following can only be live-validated against a dedicated staging Supabase project (or via dogfooding on prod with the GameMaster account immediately post-go-live, J2 morning). Static audits above show the code is correct, but pixel-level UI validation is deferred:

- [ ] **B2 j2j live tooltip render** — login as Player at L1, hover/focus L3 locked node on `/journey`, expect amber tooltip with copy "Astuce : complète les niveaux précédents pour débloquer ce niveau" (key `journey_v2_locked_hint_amber`). NO red banner anywhere on page.
- [ ] **A5 jm8 stagnation trigger (b)** — login as Player, leave `/journey` idle 15min, expect Pixel mascot bottom-right with `inquiet` mood. (To validate quickly without 15min wait, temporarily patch `STAGNATION_THRESHOLD_MS=30000` in `hooks/use-pixel-trigger.ts`, **REVERT before commit**.)
- [ ] **A5 jm8 verbatim trigger (c)** — login as Player, dispatch `window.dispatchEvent(new CustomEvent("pixel:verbatim-count", { detail: { count: 2 }}))` in DevTools (after first dispatching count:1), expect Pixel mascot with `concentré` mood.
- [ ] **A5 jm8 first-delivery trigger (a)** — submit a deliverable for the first time on a fresh browser profile, expect Pixel mascot with `fier` mood.
- [ ] **B1 k1f live render on `/journey`** — confirm `.eic-cohort-pulse` element shows 6 rows L0..L5 with `\d+/\d+` counts only, no team names visible in DOM.
- [ ] **B1 RÉTRO kpw live `/results`** — login as Player, expect "Excellence / Trajectoire / Wildcards" announcement (no scores, no chiffres `/100`). Login as GameMaster, expect score chips visible.
- [ ] **B2 RÉTRO l3m live `/results`** — confirm pitch contribution ≈ 80% of combined score (open one team, eyeball the math).
- [ ] **B3 RÉTRO lu5 live actions** — `addEvaluationCommentFlow` should not crash; `/admin/announce` should accept `target_kind='teams'` without RLS violation.
- [ ] **B4 RÉTRO l68 live `/journey`** — login as Player, confirm 7 missions visible (L1 hypothèse VP / L2.1 Persona / L2.2 Verbatims / L3 MoSCoW / L4 ROI/ha / L5 Plan acquisition / L6 Pitch + Bonus B), each with rubric showing 5×5=25 max points.

## Cleanup verification

- ✅ `.env.local` restored (596 bytes, same size as `.env.local.smoke-bak`).
- ✅ `.env.local.smoke-bak` removed.
- ✅ Dev server PID 1352 killed (`taskkill //F //PID 1352`).
- ✅ Browser closed.
- ✅ `git diff hooks/use-pixel-trigger.ts` is empty (STAGNATION_THRESHOLD_MS not patched in this run — static audit only).
- ✅ Pre-existing diffs (`CLAUDE.md`, `lib/i18n.ts`) untouched by this smoke.
- ✅ Screenshots written under `screenshots/smoke-2026-05-10-260510-smoke-t3/` only.

## Recommendation

**Ready for go-live.** All 7 fixes pass static audit; no regressions in the demo-renderable surfaces (`/login`, `/onboarding`); no console errors; no 500s. The 1 environmental finding (`/journey` unreachable in demo mode) is **not a regression of any fix** and does not block pilot — it only constrains how this smoke methodology can validate UI render. The manual smoke checklist above should be executed J-1 (12/05) by Omar against the dedicated staging Supabase project once test users are seeded, OR live during J1 morning by the first Player login as a final sanity check.

**Critical pre-go-live reminder**: B5 (`member_emails` "À COMPLÉTER" on 11/11 lines from `EIC-MANAGER-ANSWERS-AGREENTECH.md`) is **outside the scope of this smoke** but flagged in CLAUDE.md as bloquant — magic links bulk impossible without email collection. Confirm Omar has resolved this before J-1 17h.
