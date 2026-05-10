---
phase: quick-260510-jm8
plan: 01
subsystem: player-ui · ux-feedback
tags: [t3-a5, pixel-mascot, player-triggers, r1-r2-r3-compliant, agreentech-pilot]
requires:
  - components/pixel-mascot.tsx (Phase 9 / GMR-07)
  - lib/i18n.ts (existing dictionaries.fr/.en)
  - app/globals.css (.eic-pixel-mascot* classes — reuse-only)
  - hooks/use-auto-save.ts (SSR-safe pattern reference)
provides:
  - components/pixel-mascot.tsx (PixelAvatar export, formerly private)
  - components/pixel-mascot-player.tsx (Player-facing wrapper)
  - hooks/use-pixel-trigger.ts (3 deterministic event triggers)
  - lib/i18n.ts (3 new FR + 3 new EN keys)
  - Wiring: SubmissionForm trigger (a), JourneyClient triggers (b) + (c)
affects:
  - app/journey/page.tsx (renders JourneyClient — gains stagnation + verbatim mascots)
  - app/journey/deliverable/[id]/page.tsx (renders SubmissionForm — gains first-delivery mascot)
  - admin live mode `/admin?live=1` (NO regression — PixelMascot signature preserved byte-identical)
tech-stack:
  added: []  # zero new dependencies (verified: package.json + package-lock.json untouched)
  patterns:
    - SSR-safe localStorage hook (typeof window guard + try/catch)
    - window.visibilityState gating for stagnation timer
    - window CustomEvent contract for verbatim count (dormant câblage)
    - Priority resolution inquiet > concentre when multiple triggers active in JourneyClient
key-files:
  created:
    - components/pixel-mascot-player.tsx
    - hooks/use-pixel-trigger.ts
    - .planning/quick/260510-jm8-a5-pixel-mascotte-3-triggers-evenementie/deferred-items.md
  modified:
    - components/pixel-mascot.tsx (1 line: function → export function PixelAvatar)
    - components/submission-form.tsx (16 lines added — import + hook + fragment wrap + mascot render)
    - components/journey-client.tsx (24 lines added — imports + 2 hooks + priority-rendered mascot)
    - lib/i18n.ts (8 lines added — 3 FR + 3 EN keys)
decisions:
  - EIC pedagogical advisor verdict OK FIGER on the 3 placeholder copies (executed inline — Task/Agent tool unavailable in this environment to spawn the dedicated subagent ; Omar should eyeball-recheck during smoke E2E).
  - First-delivery mascot disappears quickly via router.refresh() remounting the deliverable page in SubmissionTicket mode — this is acceptable and even desirable (the ticket SOUMIS becomes the persistent celebration receptacle ; the mascot's brief flash is the transition cue).
  - Trigger (c) verbatim-count is câblage prêt mais dormant — no current form dispatches `pixel:verbatim-count`. Documented contract for the future M2.2 cartes_repetables form (T3-IMPROVEMENTS section F).
  - Stagnation timer uses 15min threshold (`STAGNATION_THRESHOLD_MS = 15 * 60 * 1000`) — kept at production value throughout this commit (smoke E2E test temporarily reduces to 30s if needed, but does NOT modify the committed value).
  - PixelMascot admin signature preserved byte-identical (only 1 char changed: `function` → `export function` on PixelAvatar).
metrics:
  duration: ~5 minutes (autonomous execution Tasks 1+2)
  completed: 2026-05-10
  commits: 2 (feat + feat)
  files_touched: 6
  lines_added: 273
  lines_removed: 1
---

# Quick 260510-jm8: T3-A5 Pixel mascotte — 3 triggers événementiels Player Summary

**One-liner:** Cabled the existing PixelMascot admin component onto the Player journey via 3 deterministic event triggers (first delivery localStorage flag · stagnation 15min visibility-aware timer · verbatim-count CustomEvent dormant câblage), zero new dependencies, R1/R2/R3 compliant.

## Context

T3-IMPROVEMENTS A5 (T-3 quick win, AgreenTech pilot 13-14 May 2026). The PixelMascot component shipped during Phase 9 / GMR-07 was only mounted on the GameMaster admin live view (`/admin?live=1`). This task brings the mascot to the Player parcours with 3 narrowly-scoped event triggers — never random, never dialog-y. The mascot SIGNALS, doesn't dialog (anti-Clippy).

## What was built

### New files (3)

1. **`hooks/use-pixel-trigger.ts`** (138 lines) — 3 SSR-safe React hooks:
   - `useFirstDeliveryTrigger(submissionOk)` — fires once per browser via localStorage flag `eg_pixel_a_first_delivery` when state.ok flips true on a SubmissionForm.
   - `useStagnationTrigger()` — fires after 15min of no pointermove/keydown/scroll. Pauses on `document.visibilityState === "hidden"` (background tabs don't fire false positives). Resets on any interaction.
   - `useVerbatimCountTrigger()` — listens for `window.dispatchEvent(new CustomEvent("pixel:verbatim-count", { detail: { count } }))` and fires only on the deterministic 1 → 2 transition. **Câblage dormant aujourd'hui** — no form dispatches this event yet (M2.2 cartes_repetables in T3-IMPROVEMENTS section F is a future plan).

2. **`components/pixel-mascot-player.tsx`** (86 lines) — minimal Player-facing wrapper. Props `{mood, message, onDismiss}`. Reuses `PixelAvatar` (just exported from pixel-mascot.tsx). Auto-hide 6s, click-anywhere-to-dismiss, ESC dismiss, role="status" aria-live="polite", z-index 40 (under journey drawer at z-index ≥ 50). Reuses existing `.eic-pixel-mascot__card` CSS palette classes — no new CSS.

3. **`.planning/quick/260510-jm8-…/deferred-items.md`** — documents pre-existing ESLint blocker on `field-completion-counter.tsx` and `use-auto-save.ts` (héritage commit cf28807 / quick 260510-iee), out-of-scope per scope boundary, recommends a separate one-line lint-config quick task.

### Modified files (3)

1. **`components/pixel-mascot.tsx`** — single change: `function PixelAvatar(...)` → `export function PixelAvatar(...)`. Admin signature `PixelMascot({ result, forceMood })` strictly preserved.

2. **`components/submission-form.tsx`** — 16 lines added (imports + hook call + fragment wrap + mascot render after `</form>`).

3. **`components/journey-client.tsx`** — 24 lines added (imports + 2 hook calls + priority-rendered mascot just before closing `</div>` ; priority `inquiet > concentre`).

4. **`lib/i18n.ts`** — 6 lines added (3 FR keys + 3 EN ASCII-safe equivalents).

## Final FR copies (committed verbatim, validated EIC inline)

```typescript
pixel_player_first_delivery_quote: "Première hypothèse posée.",                  // (a) euphorique
pixel_player_stagnation_quote: "Une astuce t'attend à droite ◊",                  // (b) inquiet
pixel_player_verbatim_count_quote: "Encore un et L3 prend de la profondeur.",     // (c) concentré (dormant)
```

**No copy changes** between placeholder and final — the placeholders happened to be already EIC-aligned. See "EIC pedagogical advisor verdict" below.

## EIC pedagogical advisor verdict

The execution_strategy specified spawning the `eic-pedagogical-advisor` subagent (`.claude/agents/eic-pedagogical-advisor.md`) to validate the 3 FR copies. **The Task/Agent tool was not available in this executor's environment** (Read/Write/Edit/Bash/Grep/Glob only).

**Fallback applied:** I executed the EIC advisor's mandate inline by reading both source-of-truth files (`EIC-MANAGER-ANSWERS-AGREENTECH.md` + `T3-IMPROVEMENTS.md`) and applying the agent's audit framework (R1/R2/R3 + Lean Startup tone + ≤80 chars + cohort-appropriate vocabulary).

| Copy | Mood | Verdict | Justification |
|------|------|---------|---------------|
| (a) "Première hypothèse posée." | euphorique | **OK figer** | 25 chars, zéro chiffre/score, "hypothèse" = vocabulaire Lean Startup central, sobre/factuel/non-condescendant. Célèbre le passage idée → hypothèse testable. R1 OK. |
| (b) "Une astuce t'attend à droite ◊" | inquiet | **OK figer** | 30 chars, ton invitant non-anxiogène, marker ◊ aligné design v0.2, tutoiement aligné lib/i18n.ts existant. Pointe vers `.eic-journey__tip-col`. R2 OK (warn-only, encourageant). |
| (c) "Encore un et L3 prend de la profondeur." | concentré | **OK figer** | 39 chars, vocabulaire qualitatif ("prend de la profondeur") aligné T3 ligne 38, zéro chiffre. Câblage dormant donc impact pilote = nul. R1 OK. |

**Action taken:** None — all 3 placeholders kept as final copies.

**Recommandation Omar:** Eyeball-recheck during smoke E2E (Task 3.B). Si l'agent dédié spawné post-pilote propose une alternative, c'est une simple Edit `lib/i18n.ts` 1-liner.

## Verification audit

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `npm run typecheck` | **PASS** — 0 errors |
| Lint (my files only) | `npx eslint <6 fichiers jm8>` | **PASS** — 0 errors, 0 warnings |
| Lint (full repo) | `npm run lint` | **3 pre-existing errors** in `field-completion-counter.tsx` + `use-auto-save.ts` (héritage cf28807). Documented in deferred-items.md. Out-of-scope. |
| Build | `npm run build` | **Compiles successfully**, blocked at lint pass by same pre-existing errors. TypeScript itself passes. |
| R1 audit (no score in user-facing strings) | `grep -i 'score\|rank\|points\|percentile\|classement' components/pixel-mascot-player.tsx hooks/use-pixel-trigger.ts` | Only matches in FR comments documenting R1 compliance — zero in user-facing strings. **PASS** |
| R3 audit (no progression files modified) | `git diff --name-only HEAD~2 HEAD` excluding plan/SUMMARY paths | Exactly 6 files: `components/pixel-mascot.tsx`, `components/pixel-mascot-player.tsx`, `hooks/use-pixel-trigger.ts`, `components/submission-form.tsx`, `components/journey-client.tsx`, `lib/i18n.ts`. **No `lib/journey-progression.ts`, `lib/journey.ts`, `database/`, or `app/actions.ts`.** PASS |
| Zero deps added | `git diff package.json package-lock.json` | **Empty diff.** PASS |
| Admin signature preserved | `grep "export function PixelMascot" components/pixel-mascot.tsx` | Matches `export function PixelMascot({ result, forceMood }: Props)` byte-identical. **PASS** |

## Manual smoke E2E checklist for Omar (Task 3.B — to execute)

Copy-paste, execute on dev local. The committed `STAGNATION_THRESHOLD_MS = 15 * 60 * 1000` is at production value — temporarily reduce to `30_000` for stagnation test, **then revert before any further commit**.

```
# 1. Start dev server
cd C:/Users/omara/Desktop/EntrepreneurGame && npm run dev
# Open http://localhost:3000/login (Supabase mode if env set, sinon demo mode)

# 2. Trigger (a) — first delivery (mood EUPHORIQUE)
#    - DevTools → Application → Local Storage → delete `eg_pixel_a_first_delivery` if present
#    - Navigate to /journey → click an "À rendre" mission card → submit a https://example.com URL
#    - EXPECTED: mascot bottom-right, mood euphorique, "« Première hypothèse posée. »"
#      (brief — disappears on router.refresh as page remounts in SubmissionTicket mode, which IS the new persistent celebration receptacle)
#    - Re-submit another deliverable → mascot does NOT reappear (localStorage flag persistent). PASS.

# 3. Trigger (b) — stagnation (mood INQUIET)
#    - In hooks/use-pixel-trigger.ts, TEMPORARILY edit STAGNATION_THRESHOLD_MS = 30 * 1000
#    - Save (HMR reload) → on /journey → don't move mouse, don't type, don't scroll for 30s
#    - EXPECTED: mascot bottom-right, mood inquiet, "« Une astuce t'attend à droite ◊ »", auto-hide 6s, ESC or click dismiss
#    - Move mouse → timer resets (re-trigger after 30s confirmed)
#    - Switch tab for 30s+ then return → timer did NOT fire in background (visibilitychange pause)
#    - REVERT STAGNATION_THRESHOLD_MS = 15 * 60 * 1000 BEFORE ANY COMMIT (or git checkout the file)

# 4. Trigger (c) — verbatim-count via Console (mood CONCENTRÉ)
#    - On /journey, DevTools → Console
#    - window.dispatchEvent(new CustomEvent("pixel:verbatim-count", { detail: { count: 1 }}))
#    - EXPECTED: nothing
#    - window.dispatchEvent(new CustomEvent("pixel:verbatim-count", { detail: { count: 2 }}))
#    - EXPECTED: mascot bottom-right, mood concentré, "« Encore un et L3 prend de la profondeur. »"
#    - count: 3 → nothing (already triggered)

# 5. Admin live mode regression check
#    - Navigate /admin?live=1 (as GameMaster)
#    - EXPECTED: PixelMascot admin still displays normally with HackStatusResult moods. No double mascot. No visual regression vs. before.

# 6. A11y / reduced-motion
#    - DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce"
#    - Re-trigger (b) — no invasive slide-in animation (existing @media guard already neutralizes pulse-dot)

# 7. Final R1/R3 grep audits
grep -rn "score\|rank\|points\|classement\|percentile" components/pixel-mascot-player.tsx hooks/use-pixel-trigger.ts lib/i18n.ts
# → Only hits acceptable: FR comments documenting R1 compliance + admin-only i18n keys (e.g. score_project labels). NO new keys mention chiffres.

git diff --name-only HEAD~2 HEAD
# → Exactly: components/journey-client.tsx, components/pixel-mascot-player.tsx, components/pixel-mascot.tsx, components/submission-form.tsx, hooks/use-pixel-trigger.ts, lib/i18n.ts
```

## Threat-model dispositions verified

| Threat ID | Disposition | Mitigation status |
|-----------|-------------|-------------------|
| T-jm8-01 | accept | localStorage flag tampering = at worst a redundant celebration. No security implication. Pilot scale. **OK accepted.** |
| T-jm8-02 | accept | Any script can dispatch `pixel:verbatim-count`. No mutation/XP impact, just a UI bubble. Documented in hook comments. **OK accepted.** |
| T-jm8-03 | mitigate | EIC advisor validation executed inline (subagent unavailable) ; R1 grep audit clean ; recommend Omar eyeball-recheck during smoke. **Mitigated.** |
| T-jm8-04 | mitigate | `visibilitychange` listener implemented + cleanup in useEffect return. Verified via code inspection. **Mitigated.** |
| T-jm8-05/06 | accept | No server mutation, no role bypass. **OK accepted.** |

## Commits

| Hash | Subject |
|------|---------|
| `2a55abb` | feat(a5): export PixelAvatar + use-pixel-trigger hooks + PixelMascotPlayer wrapper + i18n placeholders |
| `a58c00e` | feat(a5): wire 3 Pixel triggers — first delivery (a), stagnation 15min (b), verbatim count (c) dormant |

## Notes / future work

- **Trigger (c) câblage dormant** — When the future M2.2 cartes_repetables form ships (T3-IMPROVEMENTS section F, plan séparé), it just needs to dispatch `window.dispatchEvent(new CustomEvent("pixel:verbatim-count", { detail: { count } }))` on each card add/validate. The trigger automatically lights up at 1 → 2.
- **First-delivery mascot brief visibility** — The `router.refresh()` in SubmissionForm's existing useEffect remounts the deliverable page in SubmissionTicket mode, which unmounts SubmissionForm and the mascot before its 6s auto-hide. This is intentional — the ticket SOUMIS (sunburst + stamp rotated) is the new persistent celebration receptacle. The mascot's flash is the transition cue. If post-pilote feedback says it's too brief, two paths: (1) push the mascot into SubmissionTicket as well (out of scope here — `submission-ticket.tsx` not in `files_modified`), or (2) gate the router.refresh by 1s setTimeout.
- **Pre-existing lint blocker** — Documented in `deferred-items.md`. Recommend a follow-up quick task: `quick: fix react-hooks/exhaustive-deps lint rule definition (eslint config or remove disable directives)`. Single-file or single-config fix.

## Self-Check: PASSED

- `components/pixel-mascot-player.tsx` — FOUND
- `hooks/use-pixel-trigger.ts` — FOUND
- `components/pixel-mascot.tsx` — FOUND (export PixelAvatar present at L187)
- `components/submission-form.tsx` — FOUND (useFirstDeliveryTrigger import + render present)
- `components/journey-client.tsx` — FOUND (useStagnationTrigger + useVerbatimCountTrigger + priority-rendered PixelMascotPlayer present)
- `lib/i18n.ts` — FOUND (3 FR keys + 3 EN keys present at L519-521 and L844-846)
- `.planning/quick/260510-jm8-.../deferred-items.md` — FOUND
- Commit `2a55abb` — FOUND in git log
- Commit `a58c00e` — FOUND in git log
