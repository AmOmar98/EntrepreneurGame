---
phase: 14-multi-tenant-schema-niveaux-data-driven
plan: 04
subsystem: data-layer / event-resolution
tags: [typescript, data-layer, tenant, event-resolution, is_active, sweep, quality-gate]

requires:
  - phase: 14-multi-tenant-schema-niveaux-data-driven
    plan: 03
    provides: full quality gate restored (typecheck/lint/build/16unit/15e2e)

provides:
  - All 13 event-resolution sites rewired from starts_at-desc to is_active=true
  - TENANT-03 consumer side complete
  - saveOnboardingKyc writes current_level_text alongside current_level (W-3)
  - Full quality gate green (typecheck/lint/build/test:unit 16/test:e2e 15)

affects:
  - 14-05: operator checkpoint (supabase db push --linked) will apply is_active column;
    after that all rewired sites return the active event instead of null

tech-stack:
  added: []
  patterns:
    - ".eq('is_active', true).limit(1).maybeSingle() — canonical event-resolution pattern"
    - "Null-tolerance preserved at every swapped site (pre-migration PROD safe)"
    - "W-3: dual-column onboarding write (current_level + current_level_text) prevents enum/text FK drift"

key-files:
  modified:
    - lib/pitch-mode.ts
    - lib/results.ts
    - lib/mentor.ts
    - lib/jury.ts
    - lib/admin.ts
    - lib/admin-live.ts
    - lib/admin-export.ts
    - lib/announcements.ts
    - lib/pitch-prep.ts
    - app/results/page.tsx
    - app/admin/page.tsx
    - app/admin/announce/page.tsx
    - app/actions.ts

key-decisions:
  - "lib/announcements.ts:76 is an event-resolution site (selects from events table) — swapped. The announcements rows ordering (.order('created_at')) is unrelated and left intact."
  - "app/actions.ts current_level literal 'L1_problem' preserved; current_level_text 'L1_problem' added (W-3 dual-write)"
  - "No new dependencies; all server actions return { ok:false, message } on no-active-event path (never throw)"

metrics:
  duration: 12min
  completed: 2026-06-11
  tasks: 2
  files_modified: 13
---

# Phase 14 Plan 04: TENANT-03 Consumer Sweep (is_active event-resolution) Summary

**All 13 event-resolution sites across 13 files rewired from `.order("starts_at", { ascending: false })` to `.eq("is_active", true)`; W-3 dual-column onboarding write applied; full quality gate green.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-11T20:30:00Z (approx)
- **Completed:** 2026-06-11T20:42:00Z (approx)
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

### Task 1 — lib/ sweep (commit `ac72f99`)

All 9 lib event-resolution sites swapped to `.eq("is_active", true).limit(1).maybeSingle()`:

| File | Line | Notes |
|---|---|---|
| `lib/pitch-mode.ts` | 35 | Canonical site; existing `if (!eventRow)` null-branch preserved |
| `lib/results.ts` | 136 | `isResultsPublished` function |
| `lib/results.ts` | 171 | `computeRanking` function; comment updated |
| `lib/mentor.ts` | 92 | Comment updated |
| `lib/jury.ts` | 191 | Comment updated |
| `lib/admin.ts` | 114 | `getCohortOverview` function |
| `lib/admin.ts` | 288 | `getGlobalCounters` function |
| `lib/admin-live.ts` | 144 | `getAdminLiveSnapshot` function |
| `lib/admin-export.ts` | 62 | `getPlayersExportRows` function |
| `lib/announcements.ts` | 76 | `getRecentAnnouncements` — see determination below |
| `lib/pitch-prep.ts` | 95 | `getPitchPrepForUser` function |

**lib/announcements.ts determination:** Line 76 queries `.from("events").select("id")` — this IS an event-resolution site (resolving the current event to scope announcement rows). The `.order("created_at", { ascending: false })` at line 88 is on the `announcements` table (ordering announcement rows), NOT an event-resolution query and was correctly left untouched. Swapped line 76.

Automated verification gate passed: `node -e "..."` returned `OK`.

### Task 2 — app/ sweep + W-3 fix + full gate (commit `e91b097`)

Four app files swapped:

| File | Line | Notes |
|---|---|---|
| `app/results/page.tsx` | 35 | `loadReplayStats` inner query |
| `app/admin/page.tsx` | 68 | `fetchCurrentEvent` inner function |
| `app/admin/announce/page.tsx` | 47 | `loadComposerData` inner query |
| `app/actions.ts` | 852 | `importPlayers` action — event-resolution for cohort upsert |
| `app/actions.ts` | 1532 | `postAnnouncement` action — event-resolution for announcement insert |

**W-3 fix applied** in `saveOnboardingKyc` (app/actions.ts ~line 166):
```typescript
// Before:
current_level: "L1_problem",
// After (W-3):
current_level: "L1_problem",
current_level_text: "L1_problem",
```
Both server actions at lines 852 and 1532 already had proper `{ ok: false, message }` returns for the no-active-event path — no new guard needed.

## Grep Proof

Command run:
```
node -e "scan app+lib .ts/.tsx files; flag any .order('starts_at', { ascending: false })"
```

**Result:** `OK — zero event-resolution order(starts_at desc) in app+lib`

All 13 original sites swapped. No application code remains on the old convention.

## Full Quality Gate

| Check | Result |
|---|---|
| `npm run typecheck` | PASSED |
| `npm run lint` | PASSED |
| `npm run build` | PASSED (28 routes compiled) |
| `npm run test:unit` | PASSED (16/16) |
| `npm run test:e2e` | PASSED (15/15) |

## lib/announcements.ts Determination

**Determination: event-resolution site — swapped.**

Line 76 in `getRecentAnnouncements`:
```typescript
// BEFORE:
.from("events").select("id").order("starts_at", { ascending: false }).limit(1).maybeSingle()
// AFTER:
.from("events").select("id").eq("is_active", true).limit(1).maybeSingle()
```

The function then queries announcements filtered by `event_id`, ordering them by `created_at` (line 88). That ordering is on announcement rows (not event resolution) and was correctly left unchanged.

## Deviations from Plan

### None

All 13 call-site files rewired exactly as planned. No unexpected issues encountered:
- All existing null/no-active-event branches preserved (pre-migration PROD tolerance intact)
- No new guards needed — server actions already had proper `{ ok:false, message }` fallbacks
- W-3 fix applied cleanly (single field addition in the players.update call)
- lib/announcements.ts:76 confirmed as event-resolution; announcement-row ordering at line 88 left intact

## Known Stubs

None. All rewired sites serve the `is_active` row in Supabase mode (after Plan 05 migration) and are null-tolerant pre-migration. Demo mode never reaches these queries.

## Threat Flags

No new threat surface. Mitigations verified:
- T-14-09 (DoS on null event): all sites have null-tolerant branches / `{ ok:false, message }` returns
- T-14-10 (swapping wrong query): lib/announcements.ts determination documented; only events query swapped

## Self-Check: PASSED

- FOUND commit: ac72f99 (lib/ sweep)
- FOUND commit: e91b097 (app/ sweep + W-3 + gate)
- FOUND: lib/pitch-mode.ts (is_active)
- FOUND: lib/results.ts (is_active x2)
- FOUND: lib/mentor.ts (is_active)
- FOUND: lib/jury.ts (is_active)
- FOUND: lib/admin.ts (is_active x2)
- FOUND: lib/admin-live.ts (is_active)
- FOUND: lib/admin-export.ts (is_active)
- FOUND: lib/announcements.ts (is_active)
- FOUND: lib/pitch-prep.ts (is_active)
- FOUND: app/results/page.tsx (is_active)
- FOUND: app/admin/page.tsx (is_active)
- FOUND: app/admin/announce/page.tsx (is_active)
- FOUND: app/actions.ts (is_active x2; current_level_text W-3)
- FOUND: grep proof zero starts_at desc event-resolution in app+lib

---
*Phase: 14-multi-tenant-schema-niveaux-data-driven*
*Completed: 2026-06-11*
