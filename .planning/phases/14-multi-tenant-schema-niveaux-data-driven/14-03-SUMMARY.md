---
phase: 14-multi-tenant-schema-niveaux-data-driven
plan: 03
subsystem: data-layer / ui-components
tags: [typescript, data-layer, levels, caller-sweep, dual-mode, r1-audit]

requires:
  - phase: 14-multi-tenant-schema-niveaux-data-driven
    plan: 02
    provides: getLevels/getLevelsMap accessors; getLevelStates(levels, currentLevel) signature; levelLabel/levelOrd/getShortLevelLabel/LEVEL_IDS removed

provides:
  - All 16 external caller typecheck errors from Plan 02 resolved
  - Level labels/ords consumed from DB/demo via getLevelsMap() in lib callers
  - Client components receive labels via levelLabels: Record<string,string> prop from server
  - Full quality gate restored (typecheck + lint + build + test:unit 16 + test:e2e 15)
  - LEVELS-03 requirement fully satisfied on the consumer side

affects:
  - 14-04: PROD apply of migrations unblocks the Supabase path for getLevels() and getLevelsMap()
  - Any future component that needs level labels: receive via levelLabels prop from server page

tech-stack:
  added: []
  patterns:
    - "getLevelsMap() fetched once per server function; levelsMap.get(id)?.label ?? id pattern"
    - "getLevels() in Promise.all() alongside other fetches for zero extra round-trip cost"
    - "levelLabels: Record<string,string> prop shape for client components (short label = label.split(' - ')[1] ?? label)"
    - "LEVEL_IDS replaced by Array.from(levelStates.keys()) -- Map preserves ord-sorted insertion order"
    - "levelsOrd: Record<string,number> passed down to sub-components that cannot call async"

key-files:
  modified:
    - lib/admin-deliverables.ts
    - lib/admin-player-detail.ts
    - lib/admin.ts
    - lib/admin-live.ts
    - lib/mentor.ts
    - lib/cohort-pulse.ts
    - lib/jury.ts
    - app/admin/announce/page.tsx
    - app/admin/page.tsx
    - app/mentor/submission/[id]/page.tsx
    - app/journey/page.tsx
    - components/cohort-pulse.tsx
    - components/journey-client.tsx
    - components/journey-drawer.tsx
    - components/journey-hero-next-step.tsx
    - components/journey-track.tsx

key-decisions:
  - "levelLabels: Record<string,string> chosen over Level[] prop for client components (simpler, serializable, no type import needed)"
  - "Short label derivation: level.label.split(' - ')[1] ?? level.label (handles 'Niveau N - Name' format from demoLevels and DB)"
  - "LEVEL_IDS iteration replaced by Array.from(levelStates.keys()) in JourneyTrack (Map insertion order = ord order from getLevelStates)"
  - "levelsOrd: Record<string,number> pattern for LeaderboardTable sub-component (non-async server sub-component)"
  - "app/admin/announce/page.tsx: both Supabase and demo paths now go through loadComposerData() which handles its own fallback via getLevels()"
  - "lib/cohort-pulse.ts demo path: demoLevels Map built inline (synchronous, avoids async in getCohortPulseDemo)"
  - "write-types.js temp script deleted (execution artifact from Plan 02, was causing lint errors)"

metrics:
  duration: 17min
  completed: 2026-06-11
  tasks: 3
  files_modified: 16
---

# Phase 14 Plan 03: Call-site Sweep (LEVELS-03 Consumer Side) Summary

**All 16 external caller typecheck errors from Plan 02 fixed; level labels/ords sourced from getLevels()/getLevelsMap() DB accessors with demo fallback; full quality gate green; R1 audit clean.**

## Performance

- **Duration:** ~17 min
- **Started:** 2026-06-11T19:14:00Z (approx)
- **Completed:** 2026-06-11T19:32:59Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments

### Task 1 (commit `8cd5d56`)
Server-side lib callers rewired:
- `lib/admin-deliverables.ts`: `getLevelsMap()` replaces `levelLabel()`
- `lib/admin-player-detail.ts`: `getLevelsMap()` replaces `levelLabel()`
- `lib/admin.ts`: `getLevelsMap()` replaces `levelLabel()`
- `lib/admin-live.ts`: `getLevelsMap()` replaces `levelOrd()`
- `lib/mentor.ts`: `getLevelsMap()` replaces `levelLabel()`
- `lib/cohort-pulse.ts`: `demoLevels` Map built inline for demo path; no async in `getCohortPulseDemo` (synchronous)
- `lib/jury.ts`: Both inline `Record<LevelId, number>` maps (lines ~255 and ~414) replaced with `levelsMap.get(id)?.ord` lookups; single `getLevelsMap()` fetch at function entry

Automated verification gate: `node -e "..."` passed with `OK`.

### Task 2 (commit `3aa7657`)
Page and component callers rewired:
- `app/admin/announce/page.tsx`: `ALL_LEVELS` literal removed; `getLevels()` fetched in `loadComposerData()`; both Supabase and demo branches now call the same function
- `app/admin/page.tsx`: `levelOrd` import removed; `levelsOrd: Record<string,number>` derived from `getLevelsMap()` and passed as prop to `StandardView` → `LeaderboardTable`
- `app/mentor/submission/[id]/page.tsx`: `getLevelsMap()` replaces `levelLabel()` for the player level display
- `app/journey/page.tsx`: `getLevels()` added to `Promise.all()`; `getLevelStates(levels, ...)` now receives the DB-sourced array; `levelLabels` built and passed to `CohortPulse` and `JourneyClient`
- `components/cohort-pulse.tsx`: `levelLabels?: Record<string,string>` prop added; `getShortLevelLabel` removed
- `components/journey-client.tsx`: `levelLabels: Record<string,string>` prop added; propagated to `JourneyTrack`, `JourneyHeroNextStep`, `JourneyDrawer`
- `components/journey-drawer.tsx`: `levelLabel?: string` prop added; `getShortLevelLabel` removed
- `components/journey-hero-next-step.tsx`: `levelLabel?: string` prop added; `getShortLevelLabel` removed
- `components/journey-track.tsx`: `levelLabels: Record<string,string>` prop added; `LEVEL_IDS` import removed; `Array.from(levelStates.keys())` replaces `LEVEL_IDS` iteration

`npm run typecheck && npm run lint && npm run build` all passed.

### Task 3 (commit: included in metadata commit)
Full quality gate results:
- `npm run typecheck`: PASSED
- `npm run lint`: PASSED (after deleting `write-types.js` execution artifact from Plan 02)
- `npm run build`: PASSED (all 28 routes compiled)
- `npm run test:unit`: PASSED (16/16 tests)
- `npm run test:e2e`: PASSED (15/15 tests)

## Prop Shape Chosen for Client-Component Labels

```typescript
// Server page builds:
const levelLabels: Record<string, string> = Object.fromEntries(
  levels.map((l) => [l.id, l.label.split(" - ")[1] ?? l.label]),
);
// e.g. "Niveau 1 - Probleme" -> "Probleme"
//      "Niveau 4 - Modele economique" -> "Modele economique"

// Components receive:
levelLabels: Record<string, string>  // JourneyClient, JourneyTrack, CohortPulse
levelLabel?: string                  // JourneyDrawer, JourneyHeroNextStep (single level)
```

`getLevelNumber()` (regex on id string) is unchanged and still exported.

## R1 Grep Audit

Command:
```
grep -rn "score\|rank\|note\|/100\|/140\|points\|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"
```

**Result:** All matches are in `app/results/`, `components/results-*.tsx` (GM/Jury-only views), and `components/submission-readonly.tsx` (R1 comment only). Zero Player-facing score/rank leaks in `app/journey/` or non-results components.

Secondary rank grep:
```
grep -rn "rank\|classement\|percentile\|leaderboard" app/journey/deliverable/
```
**Result:** Only one match — a comment `// R1 STRICT : no score/rank/multiplier in render.` confirming compliance.

**R1 audit: CLEAN**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] StandardView/LeaderboardTable split required prop threading**
- **Found during:** Task 2, fixing `app/admin/page.tsx`
- **Issue:** `levelOrd` usage was inside `LeaderboardTable`, a third nested sub-component, not directly in `StandardView`. TypeScript reported `levelsMap` not found when it was defined in `AdminPage` outer scope.
- **Fix:** Derived `levelsOrd: Record<string, number>` in `AdminPage`, passed to `StandardView` then to `LeaderboardTable`.
- **Files modified:** `app/admin/page.tsx`

**2. [Rule 1 - Bug] write-types.js execution artifact causing lint errors**
- **Found during:** Task 3 lint run
- **Issue:** `.planning/phases/14-multi-tenant-schema-niveaux-data-driven/write-types.js` (untracked Plan 02 execution artifact) contained `require()` calls triggering `@typescript-eslint/no-require-imports` errors.
- **Fix:** Deleted the file (it was never committed, purely an execution artifact).
- **Files modified:** deleted `write-types.js`

### No Other Deviations

- All 16 typecheck error sites addressed exactly as planned
- No test assertions broke (all 16 unit + 15 E2E still pass)
- Dual-mode demo preserved: `getLevels()` falls back to `DEMO_LEVELS` in all server pages

## Known Stubs

None. All level labels are resolved from `getLevels()` (DB in Supabase mode, `DEMO_LEVELS` in demo mode). No hardcoded label strings remain in caller files.

## Threat Flags

No new threat surface beyond the plan's `<threat_model>`. Mitigations verified:
- T-14-07 (R1 score/rank on Player journey): R1 grep audit clean — no new score/rank surface
- T-14-08 (client component DoS from removed getShortLevelLabel): all client components receive labels via props from server page

## Self-Check: PASSED

- FOUND: lib/admin-deliverables.ts (getLevelsMap, no levelLabel import from journey)
- FOUND: lib/admin-player-detail.ts (getLevelsMap, no levelLabel import from journey)
- FOUND: lib/admin.ts (getLevelsMap, no levelLabel import from journey)
- FOUND: lib/admin-live.ts (getLevelsMap, no levelOrd import from journey)
- FOUND: lib/mentor.ts (getLevelsMap, no levelLabel import from journey)
- FOUND: lib/cohort-pulse.ts (demoLevels import, no levelOrd import from journey)
- FOUND: lib/jury.ts (getLevelsMap, no Record<LevelId,number> maps)
- FOUND: app/admin/announce/page.tsx (getLevels, no ALL_LEVELS, no levelLabel)
- FOUND: app/admin/page.tsx (getLevelsMap, no levelOrd, levelsOrd passed to LeaderboardTable)
- FOUND: app/mentor/submission/[id]/page.tsx (getLevelsMap, no levelLabel from journey)
- FOUND: app/journey/page.tsx (getLevels in Promise.all, getLevelStates(levels, ...), levelLabels built)
- FOUND: components/cohort-pulse.tsx (levelLabels prop, no getShortLevelLabel)
- FOUND: components/journey-client.tsx (levelLabels prop, no getShortLevelLabel)
- FOUND: components/journey-drawer.tsx (levelLabel prop, no getShortLevelLabel)
- FOUND: components/journey-hero-next-step.tsx (levelLabel prop, no getShortLevelLabel)
- FOUND: components/journey-track.tsx (levelLabels prop, Array.from(levelStates.keys()), no LEVEL_IDS)
- FOUND commit: 8cd5d56
- FOUND commit: 3aa7657

---
*Phase: 14-multi-tenant-schema-niveaux-data-driven*
*Completed: 2026-06-11*
