# Phase 11 — Review Synthesis (3 reviewers)

**Date** : 2026-05-10
**Reviewers** : `eic-pedagogical-advisor` + `gsd-ui-checker` + `codex:rescue`
**Plan reviewed** : `11-01-PLAN.md`
**Audit source** : `.planning/ui-reviews/AUDIT-DESIGN-V2-VS-IMPL-2026-05-10.md`

---

## Convergence

| Item | EIC advisor | UI checker | Codex | Consensus |
|---|---|---|---|---|
| A1 shimmer cap | OK | PASS | OK | ✅ Execute |
| A2 mount keyframe | OK | FLAG | OK | ✅ Execute + `animation-fill-mode: forwards` |
| A3 node stagger | OK | FLAG | OK | ✅ Execute + `animation-delay` not `transition-delay` |
| A4 topbar pills | OK + audit | PASS | OK | ✅ Execute + audit `topbar-lite.tsx` for `TOTAL_XP/2000` R1 leak |
| B1 smooth-scroll hero | OK | FLAG | OK | ✅ Execute + `matchMedia` reduced-motion guard |
| B2 mobile scroll-snap | OK | PASS | OK | ✅ Execute |
| B3 IO `/results` reveal | OK | FLAG | DEFER | ⚠️ Conditional — execute only if Waves A+C green by cutoff-2h, else defer v0.3 |
| B4 GM radar dashed | OK | PASS | DEFER if pressed | ✅ Execute (low risk) |
| B5 hero compact | OK | PASS | OK | ✅ Execute |
| C1 public landing | OK + copy review | BLOCK | EXPAND scope | ⚠️ Downscope OR include `middleware.ts` + advisor copy review |
| C2 dual-mode guard | OK | PASS | OK (it's a fix) | ✅ Execute |
| C3 locked click | OK + 4 conditions | FLAG | OK | ✅ Execute + tooltip verbatim T3-IMPROVEMENTS R3 + no XP mutation |
| D1 R1 comment | OK + wording | PASS | OK | ✅ Execute with advisor wording |

**Note** : C1 BLOCK from UI checker was based on missing `landing.jsx` in `.planning/design-v2/` — I have since synced the newer bundle so `landing.jsx` + `system-frames.jsx` + `animations.jsx` + `chat2.md` + `chat3.md` are now present. The BLOCK condition's first leg is resolved. The second leg (T-1 risk for 150-line greenfield) and Codex's middleware concern remain valid.

---

## PLAN.md amendments (will apply)

### Preflight (NEW)
- Tag `v0.2.1-pre-phase11` on current `main` HEAD before any Phase 11 commit. Record SHA in PLAN.md.
- Run baseline `typecheck/lint/build` clean confirmation.

### Wave A acceptance additions
- A2: `animation-fill-mode: forwards`, one-shot (no loop).
- A3: use `animation-delay` (motion layer), never `transition-delay` on `opacity` (would break AT focus).
- A4: explicit audit step — read `topbar-lite.tsx` and refuse port of any `TOTAL_XP / 2000` denominator (R1).

### Wave B acceptance additions
- B1: wrap `scrollIntoView` with `matchMedia('(prefers-reduced-motion: reduce)')` check; effect depends on `next.template.id` change, not focus.
- B3: threshold `0.15` (not 0.5); observer skipped + immediate `is-revealed` set when `prefers-reduced-motion: reduce`. Post-edit grep R1 audit on `components/results-* --include="*.tsx"` mandatory.
- B3 conditional gating: defer to v0.3 if Waves A + C smoke not green by 12/05 21h00 (cutoff-2h).

### Wave C amendments
- C1: file scope expanded to `utils/supabase/middleware.ts` (Codex). Acceptance: unauthenticated `/landing` reachable in Supabase mode, authenticated users still route by role/onboarding. Smoke on Vercel preview before merge.
- C1: copy review by advisor (re-spawn) before commit. Constraints: no score, no rank, no "X équipes en lice", no badges chiffrés. Pixel bubble qualitative only.
- C1 downscope option: if advisor copy review WARN/BLOCK, ship text-only minimal landing (2 paragraphs + "Connexion" CTA) without 3 doors / mascot / hills.
- C2: confirm `lib/auth.ts:getCurrentUser()` short-circuits when no Supabase env (verified line 6-7: returns `null` when `createClient()` returns null) — wrap fix is sufficient.
- C3: 4 conditions from advisor:
  - (a) clicking locked level triggers no XP mutation, no `currentLevel` increment, no server action.
  - (b) `aria-disabled` for AT, never `disabled` DOM attr.
  - (c) tooltip copy verbatim from `T3-IMPROVEMENTS.md` § R3 — do not paraphrase.
  - (d) replace `cursor:not-allowed` with `cursor:pointer` + light desaturation; no opacity drop.

### Wave D wording
- D1: verbatim comment recommended by advisor:
  ```
  // R1 (CARDINAL) — DO NOT add a "/{totalXpMax}" denominator here.
  // Showing a max creates a comparison/ranking frame forbidden Player-side.
  // XP gauge is progression-only. Ref: T3-IMPROVEMENTS.md R1.
  ```

### Rollback amendment
- Force atomic 13 commits (not grouped per wave). Codex insistence: T-1 needs granular revert.

### Out of plan (skipped)
- B4 explicitly OK to ship — Codex's "skip if pressed" advice noted but page is GM-only, no R1 surface, low risk.

---

## Final execution order (revised)

0. **Preflight** : tag `v0.2.1-pre-phase11`, baseline build clean.
1. **Wave D** (D1) — fastest, zero risk. 1 commit.
2. **Wave A** (A1 → A2 → A3 → A4) — 4 atomic commits.
3. **Wave C2** (dual-mode fix) — 1 commit. Validate demo mode + prod login.
4. **Wave C3** (locked click softening) — re-spawn advisor for tooltip copy. 1 commit.
5. **Wave C1** (public landing) — re-spawn advisor for copy review. Decide ship-3-doors vs ship-text-minimal. 1 commit (+ `middleware.ts` in same commit).
6. **Wave B** (B1 → B2 → B5 → B4 → B3) — 5 commits, B3 conditional on cutoff-2h check.
7. **Smoke E2E** régression : demo mode flow + prod-like flow + mobile 390px + grep R1 audit.

Total commits expected: 12-13 (B3 may be skipped).

---

## Decision matrix for operator

| Outcome | Action |
|---|---|
| All 3 reviewers PASS/OK on item | Execute as-amended |
| 2/3 PASS + 1 FLAG | Execute with FLAG remediation in acceptance |
| 1/3 BLOCK (as C1 was, now resolved) | Re-evaluate — if blocking premise resolved, proceed with all guards |
| 2/3+ BLOCK | Defer to v0.3, document `deferred-items.md` |

Current state: **0 outright BLOCK**, 5 FLAGs incorporated, C1 flagged "downscope option available". Ready to execute with operator green-light.

---

## Operator green-light required on

1. C1 downscope decision : ship 3-doors-with-mascot OR ship text-minimal landing.
2. B3 conditional defer : accept the cutoff-2h gate or defer outright to v0.3.
3. v0.2.1-pre-phase11 tag : confirm to push tag locally (no remote push without Omar OK).
