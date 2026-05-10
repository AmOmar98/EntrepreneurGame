---
phase: 260510-k1f
plan: 01
subsystem: journey-player-motivation
tags: [t3, b1, cohort-pulse, r1-anonymisation, dual-mode, additive]
requires:
  - lib/journey.ts:levelOrd
  - lib/journey-progression.ts:getShortLevelLabel
  - lib/seed/index.ts:seedPlayers
  - lib/supabase-status.ts:hasSupabaseEnv
provides:
  - lib/cohort-pulse.ts:getCohortPulse
  - lib/cohort-pulse.ts:CohortPulseEntry
  - components/cohort-pulse.tsx:CohortPulse
  - lib/i18n.ts:cohort_pulse_* (4 keys × 2 locales)
  - app/globals.css:.eic-cohort-pulse* (~60 LOC)
affects:
  - app/journey/page.tsx (mount in 2 render branches)
tech-stack:
  added: []
  patterns:
    - server-component-pure-render
    - dual-mode-supabase-or-seed
    - r1-anti-leak-guard-comments
    - prefers-reduced-motion-guard
key-files:
  created:
    - lib/cohort-pulse.ts
    - components/cohort-pulse.tsx
    - .planning/quick/260510-k1f-b1-cohort-pulse-bar-anonymisee-t3-improv/deferred-items.md
  modified:
    - app/journey/page.tsx
    - lib/i18n.ts
    - app/globals.css
    - components/field-completion-counter.tsx (Rule 3 fix)
    - hooks/use-auto-save.ts (Rule 3 fix)
decisions:
  - 6-level scope L0..L5 (L6 traction / L7 alumni excluded — post-bootcamp)
  - 4-query Supabase plan (no PostgREST inner-joins) for portability across RLS configs
  - Empty-state guard at component level (prevents 0% bars at 8h30 J1)
  - Rule 3 unblocking: removed 3 orphan eslint-disable directives blocking build
metrics:
  duration: ~25 min (3 atomic commits + 1 deferred-items log)
  completed: 2026-05-10
  commits: 3
  files_created: 3
  files_modified: 5
---

# Quick 260510-k1f Summary — B1 Cohort Pulse Bar (anonymisée)

## One-liner

Server-side, anonymised Cohort Pulse Bar component (`X/N équipes ont soumis [niveau]`) mounted on `/journey` for 6 pilot levels — strictly compliant with R1 (no Player names/slugs/scores/ranks anywhere in helper return type, in component props, or in render output).

## Implementation map

### Task 1 — `lib/cohort-pulse.ts` helper (commit `908dc8b`)

- New file, 188 LOC.
- Exports `getCohortPulse(userId: string | null): Promise<CohortPulseEntry[]>` and `type CohortPulseEntry = { levelId, count, total }`.
- **Demo mode** (`!hasSupabaseEnv()`): aggregate over `seedPlayers()`. A player at level X counts as "submitted" all levels strictly < X (heuristic via `levelOrd`).
- **Supabase mode**: 4-query plan to remain portable
  1. `player_members.player_id` for the connected user
  2. `players.cohort_id` from that player_id
  3. `players.id (count exact, head:true) where cohort_id=X and status='active'` → `total`
  4. `missions.id, level_id where level_id IN (PULSE_LEVELS)`, then `deliverable_templates.id, mission_id where mission_id IN (...)`, then `players.id where cohort_id=X` (cohort filter), then `submissions.player_id, deliverable_template_id where deliverable_template_id IN (...) and status IN (submitted_v1, feedback_received, submitted_v2, validated)` — distinct player_id per level via in-memory Sets.
- Silent fallback to empty entries on any error / unresolved cohort (no throw, no leak).

### Task 2 — Component + styles + i18n (commit `dfe2173`)

- `components/cohort-pulse.tsx` — server component, no `use client`, 67 LOC. Empty-state guard renders the empty copy when `total === 0` or no submissions yet.
- 4 i18n keys added to `dictionaries.fr` AND `dictionaries.en`:
  - `cohort_pulse_aria` / `cohort_pulse_kicker` / `cohort_pulse_label_template` / `cohort_pulse_empty`
- `app/globals.css` — `.eic-cohort-pulse*` block appended at end-of-file (~60 LOC), with `@media (prefers-reduced-motion: reduce)` neutralising the bar-fill width transition, `@media (max-width: 540px)` tightening grid columns.

### Task 3 — Mount + Rule 3 unblocking (commit `311dd78`)

- `app/journey/page.tsx`:
  - Imports `CohortPulse` + `getCohortPulse`
  - Computes `cohortPulse = await getCohortPulse(user.id)` AFTER `getJourneyData` and BEFORE the `data.empty` early-return
  - Mounts `<CohortPulse entries={cohortPulse} />` in BOTH render branches (empty + normal). In the normal branch, sits between `<PlayerAnnouncementStrip>` and `<JourneyClient>`.
- **Rule 3 fix**: removed 3 orphan `// eslint-disable-next-line react-hooks/exhaustive-deps` directives (1 in `components/field-completion-counter.tsx:101`, 2 in `hooks/use-auto-save.ts:68 + 107`). The referenced ESLint rule is not registered in `eslint.config.mjs` (the `eslint-plugin-react-hooks` plugin is not installed/configured), so the disable directives themselves were the build-blocking errors. Removing them is a no-op behaviorally — no rule was ever firing. Already documented in `deferred-items.md` as a follow-up to register the plugin properly.

## Final FR copies (i18n)

```text
cohort_pulse_aria             "Pouls de la cohorte"
cohort_pulse_kicker           "POULS DE LA COHORTE"
cohort_pulse_label_template   "equipes ont soumis"
cohort_pulse_empty            "Pas encore de soumission dans la cohorte."
```

Rendered example (label + level): `equipes ont soumis Probleme` / `equipes ont soumis Modele eco.`.

## Audit R1 (CRITIQUE)

### `grep -nE "name|slug|score|rank|percentile" lib/cohort-pulse.ts`

```
3:// Strict R1 (score invisible cote Player): the public return type carries
4:// only {levelId, count, total}. Never returns Player names, slugs, ids, scores,
5:// ranks or any per-team row. Server-side aggregation only.
13://   grep -nE "name|slug|score|rank|percentile" lib/cohort-pulse.ts
15://   grep -nE "select.*name|select.*slug" lib/cohort-pulse.ts
85:  // name / slug / scores. R1: the helper must never see those columns.
117:  // missions table - no titles, no slugs.
158:  // proof_text, scores, evaluations, or any Player-identifying join.
```

**Verdict**: ALL hits are inside R1 guard comments (header + inline rationale). Zero hit in `select(...)` queries — confirmed via `grep -nE "select.*name|select.*slug" lib/cohort-pulse.ts` returning empty. Only fields read from `players` / `submissions` / `missions` / `deliverable_templates` are: `id`, `cohort_id`, `player_id`, `mission_id`, `deliverable_template_id`, `level_id`, `status`. No `*.name`, no `*.slug`, no `score_*`, no `idea`, no `current_level`, no `proof_*`.

### `grep -nE "name|slug|score|rank|percentile" components/cohort-pulse.tsx`

```
3:// Designed by intent : never receives nor renders Player names, scores, ranks
7://   grep -nE "name|slug|score|rank|percentile" components/cohort-pulse.tsx
```

**Verdict**: only header comments. No identifier-bearing prop, no rendered string contains a player name/slug/score.

### `grep -nE "Player|player\." components/cohort-pulse.tsx`

```
3:// Designed by intent : never receives nor renders Player names, scores, ranks
9://   grep -nE "Player|player\." components/cohort-pulse.tsx
10://     -> only inside this header guard (no Player prop, no player.* render).
24:  // first Player to land on /journey at 8h30 J1).
```

**Verdict**: only header + 1 inline rationale comment. Component's `CohortPulseProps` does NOT contain `Player` type, no `player.*` access in render.

## Audit R3 (FORBIDDEN files modified?)

```bash
git diff --name-only 908dc8b~1..HEAD
```

```
.planning/quick/260510-k1f-b1-cohort-pulse-bar-anonymisee-t3-improv/deferred-items.md
app/globals.css
app/journey/page.tsx
components/cohort-pulse.tsx
components/field-completion-counter.tsx   (Rule 3 fix only)
hooks/use-auto-save.ts                     (Rule 3 fix only)
lib/cohort-pulse.ts
lib/i18n.ts
```

**Verdict**: NONE of the FORBIDDEN files modified —
- `lib/journey.ts` ✅ untouched
- `lib/journey-progression.ts` ✅ untouched
- `database/` ✅ untouched
- `app/actions.ts` ✅ untouched
- `components/journey-client.tsx` ✅ untouched

The only "out of scope" edits are the 3 lines removed in `field-completion-counter.tsx` + `use-auto-save.ts` for Rule 3 (build unblocking). These were ESLint disable directives referencing an unregistered rule.

## Audit deps (no new packages)

```bash
git diff 908dc8b~1..HEAD -- package.json package-lock.json
```

(empty output)

**Verdict**: zero new dependencies added.

## Build status

| Check                  | Result | Notes                                                          |
| ---------------------- | ------ | -------------------------------------------------------------- |
| `npm run typecheck`    | PASS   | tsc --noEmit clean                                             |
| `npm run lint`         | PASS   | 0 errors, 0 warnings                                           |
| `npm run build`        | PASS   | 15 routes generated, /journey 4.3kB / 131kB First Load JS      |

## Demo mode rendered ratio

With `demoPlayers = [Alpha (L1_problem), Beta (L0_diagnostic)]` (`total = 2`):

| levelId             | ord | count | display    |
| ------------------- | --- | ----- | ---------- |
| L0_diagnostic       | 0   | 1     | `1/2` (50%) — Alpha is past L0 |
| L1_problem          | 1   | 0     | `0/2`      |
| L2_solution         | 2   | 0     | `0/2`      |
| L3_market           | 3   | 0     | `0/2`      |
| L4_business_model   | 4   | 0     | `0/2`      |
| L5_pitch            | 5   | 0     | `0/2`      |

`anyCount === true` (because L0 has 1) → component renders the 6-row list (not the empty state).

## Supabase mode behavior

- Resolves cohort via `player_members → players.cohort_id`.
- `total` = count of `players where cohort_id=X AND status='active'`.
- `count` per level = distinct `submissions.player_id` (cohort-filtered) submitting any deliverable whose template's mission has matching `level_id` (status ∈ `submitted_v1 / feedback_received / submitted_v2 / validated`).
- Silent fallback to `entries[]` with `count=0, total=0` if cohort can't be resolved or any query errors. No throw, no leak.

## Mount point confirmation

| Branch                    | File                  | Line |
| ------------------------- | --------------------- | ---- |
| empty / non-onboarded     | `app/journey/page.tsx` | 53   |
| normal (data.player set)  | `app/journey/page.tsx` | 109  |

Confirmed via `git show 311dd78:app/journey/page.tsx | grep -n CohortPulse`.

## Success criteria checklist

- [x] Player connecté voit `<CohortPulse>` en haut de `/journey`
- [x] 6 lignes : L0 Diagnostic, L1 Probleme, L2 Solution, L3 Marche, L4 Modele eco., L5 Pitch
- [x] Chaque ligne expose UNIQUEMENT label + bar + `X/N`
- [x] Audit R1 grep vide (sauf garde-fous en commentaires)
- [x] Mode demo : `seedPlayers()` aggregate plausible (L0 → 1/2)
- [x] Mode Supabase : agrégat réel cohorte du Player connecté (4-query plan)
- [x] `npm run typecheck && npm run lint && npm run build` PASSENT
- [x] `prefers-reduced-motion` désactive la transition CSS
- [x] FORBIDDEN files non modifiés (`lib/journey.ts`, `lib/journey-progression.ts`, `database/`, `components/journey-client.tsx`, `app/actions.ts`)
- [x] Aucune nouvelle dépendance npm

## Deviations

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed 3 orphan `// eslint-disable-next-line react-hooks/exhaustive-deps` directives**

- **Found during**: Task 3 verification (`npm run build` failed)
- **Issue**: The directives reference rule `react-hooks/exhaustive-deps`, but the `eslint-plugin-react-hooks` plugin is not registered in `eslint.config.mjs`. The TypeScript-ESLint v8+ engine treats unknown rule references as errors, blocking `next build`.
- **Pre-existing**: yes — first introduced in commit `cf28807` (quick task 260510-iee A1+A4). Not caused by this plan.
- **Fix**: removed the 3 directive lines, kept the explanatory `// NOTE:` comments, added a note to re-add when the plugin lands.
- **Files modified**: `components/field-completion-counter.tsx`, `hooks/use-auto-save.ts`
- **Commit**: `311dd78` (combined with Task 3 mount)
- **Documented as deferred**: `deferred-items.md` records the proper follow-up (install + register `eslint-plugin-react-hooks`).

### Auth gates

None.

## Self-Check: PASSED

- `lib/cohort-pulse.ts` exists ✅
- `components/cohort-pulse.tsx` exists ✅
- 3 commits exist (`908dc8b`, `dfe2173`, `311dd78`) ✅
- `npm run typecheck && npm run lint && npm run build` PASS ✅
- R1 audit grep returns ONLY guard comments ✅
- 4 i18n keys × 2 locales = 8 keys added ✅
- FORBIDDEN files all untouched ✅
- Zero new npm deps ✅
