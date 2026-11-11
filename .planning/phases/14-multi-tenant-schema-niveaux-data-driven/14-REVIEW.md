---
phase: 14-multi-tenant-schema-niveaux-data-driven
reviewed: 2026-06-11T00:00:00Z
depth: deep
files_reviewed: 32
files_reviewed_list:
  - lib/levels.ts
  - lib/active-event.ts
  - lib/types.ts
  - lib/journey.ts
  - lib/journey-progression.ts
  - lib/seed/levels.ts
  - lib/seed/index.ts
  - lib/admin-deliverables.ts
  - lib/admin-export.ts
  - lib/admin-live.ts
  - lib/admin-player-detail.ts
  - lib/admin.ts
  - lib/announcements.ts
  - lib/cohort-pulse.ts
  - lib/icons.ts
  - lib/jury.ts
  - lib/mentor.ts
  - lib/pitch-mode.ts
  - lib/pitch-prep.ts
  - lib/results.ts
  - app/actions.ts
  - app/admin/announce/page.tsx
  - app/admin/page.tsx
  - app/journey/page.tsx
  - app/mentor/submission/[id]/page.tsx
  - app/results/page.tsx
  - components/cohort-pulse.tsx
  - components/journey-client.tsx
  - components/journey-drawer.tsx
  - components/journey-hero-next-step.tsx
  - components/journey-track.tsx
  - scripts/mirror-phase14-declarative.cjs
  - supabase/migrations/20260611120000_organizations.sql
  - supabase/migrations/20260611120100_events_is_active.sql
  - supabase/migrations/20260611120200_levels_data_driven.sql
  - supabase/migrations/20260611120300_rls_org_scope.sql
  - database/schema.sql
  - database/rls.sql
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-06-11
**Depth:** deep
**Files Reviewed:** 38
**Status:** issues_found

## Summary

Phase 14 introduces multi-tenant schema foundations (organizations table, `events.is_active` flag, `levels_v2` data-driven table) and sweeps 13+ event-resolution call-sites from `starts_at DESC LIMIT 1` to `.eq("is_active", true)`. The dual-mode demo contract is preserved throughout. R1 (score/rank invisibility to Players) is clean across all changed surfaces.

The overall sweep is correct and safe. One critical structural bug exists: the `events_org_scope_select` RLS policy is non-functional because the older `events_authenticated_select (USING true)` policy was not removed, making PostgreSQL's OR-semantics bypass the org filter entirely. Three warnings cover: (1) a dead module `lib/active-event.ts` that is built and shipped but never imported, (2) a duplicate `getLevels()` DB call per journey-page request, and (3) the `getLevelNumber()` function silently returning wrong results for multi-digit level ordinals. Three info items cover dead exports and a label parsing assumption.

---

## R1 Cardinal Audit

Ran the CLAUDE.md R1 grep:
```
grep -rn "score|rank|note|/100|/140|points|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"
```

Results in `app/results/` are all GM/juror-facing (gated by role checks in `app/results/page.tsx`). No score or rank values reach the Player-facing journey surfaces. **R1 is clean.** The `levelLabels` propagation through `JourneyClient -> JourneyTrack -> JourneyDrawer -> JourneyHeroNextStep` carries only string labels (e.g. "Problème"), never numeric scores.

## Structural Findings (fallow)

No structural pre-pass was provided.

---

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: `events_org_scope_select` RLS policy is non-functional — org isolation never enforced

**File:** `supabase/migrations/20260611120300_rls_org_scope.sql:69-77` / `database/rls.sql:471-479`
**Issue:** The migration adds `events_org_scope_select` as a new PERMISSIVE policy on `public.events`. However, `database/rls.sql:76-77` (and the equivalent in `rls.sql`) already defines `events_authenticated_select` with `USING (true)` — which grants every authenticated user access to every event row. PostgreSQL evaluates multiple permissive policies for the same role/operation with **OR semantics**: if any one passes, the row is visible. Because `events_authenticated_select` always returns `true`, `events_org_scope_select` is never evaluated as a restricting gate. The org-scoped isolation that TENANT-02/TENANT-03 intends to introduce is completely bypassed. Any authenticated user can still query any event in any organization.

The migration comment acknowledges "PROD is currently mono-org (one EIC org) so the policy is structurally inter-org but has no behavioral change in the current pilot." This is technically correct right now, but the policy is shipping in a state that makes org isolation permanently non-functional even when multiple orgs are added. An operator adding a second org would believe isolation is enforced — it is not.

**Fix:** Either (a) drop the original broad policy before adding the scoped one, or (b) add it as a RESTRICTIVE policy:

```sql
-- Option A: replace the broad policy (breaking change for anon/unauthenticated
-- who currently see all events — but the current setup already requires auth).
DROP POLICY IF EXISTS "events_authenticated_select" ON public.events;
-- then keep events_org_scope_select as-is.

-- Option B: make it restrictive so it combines with AND semantics:
DROP POLICY IF EXISTS "events_org_scope_select" ON public.events;
CREATE POLICY "events_org_scope_select" ON public.events
  AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR public.is_in_org(organization_id)
    OR public.is_game_master()
  );
```

Option B is safer: it doesn't change existing behavior for the current mono-org setup but will correctly restrict multi-org access when a second org is added. Note this will break mentor access to `events` if `is_in_org` returns false for mentors (mentors are not in `player_members`). Before applying option B, `is_in_org` must be extended to include the `profiles` join for mentors, or a separate mentor-org linkage must exist.

---

## Warnings

### WR-01: `lib/active-event.ts` is dead code — ships but is never imported

**File:** `lib/active-event.ts:1-98`
**Issue:** `lib/active-event.ts` exports `getActiveEvent()` and `getActiveEventId()` as the canonical "single active event" accessors. The file is the intended abstraction for the 13-site TENANT-03 sweep. However, none of the 13 call-sites actually import from this module — they all inline the `.eq("is_active", true).limit(1).maybeSingle()` query directly. The module is built into the Next.js bundle on every deploy but provides zero value. More importantly, any future fix to the active-event query (e.g., error handling improvement, org-scope filtering) must be applied to 13 separate inlined copies rather than one canonical function.

The `getActiveEventId()` function also has an asymmetry with `getActiveEvent()`: on `error`, `getActiveEvent()` returns `null` (line 74), but `getActiveEventId()` also returns `null` on `!data` (line 96: `if (error || !data) return null`). In demo/null-client mode, `getActiveEvent()` returns the full `DEMO_EVENT` but `getActiveEventId()` returns `DEMO_EVENT.id`. These are internally consistent but the demo-mode return path is duplicated (both check `!hasSupabaseEnv()` then `!supabase` independently).

**Fix:** Either use `getActiveEvent()`/`getActiveEventId()` at the 13 call-sites (the original plan) and delete the inline queries, OR delete `lib/active-event.ts` if the decision is to keep the inline pattern for transparency. Currently the file is misleading documentation.

### WR-02: Double `getLevels()` DB call on every `/journey` page load

**File:** `lib/journey.ts:197` and `app/journey/page.tsx:57`
**Issue:** `app/journey/page.tsx` calls `getLevels()` in its `Promise.all` (line 57) to build the `levelLabels` map for the client components. But `getJourneyData()` in `lib/journey.ts:197` also calls `getLevels()` internally to build its own `resolveLabel` closure for `levelLabel` in the returned `JourneyData`. Each call issues a `SELECT id, ord, label, description FROM levels_v2 ORDER BY ord` against Supabase. On every player journey page load, this fires twice. The second call result (`JourneyData.levelLabel`) is the label of `player.currentLevel` only — a single string that could be computed from the levels array already fetched by the page.

**Fix:** Refactor `getJourneyData` to accept an optional `levels?: Level[]` parameter. The page passes its already-fetched levels array; `getJourneyData` falls back to fetching when not provided:

```typescript
// lib/journey.ts
export async function getJourneyData(
  userId: string,
  now: Date = new Date(),
  levels?: Level[],
): Promise<JourneyData> {
  // ...
  const resolvedLevels = levels ?? await getLevels();
  const levelsMap = new Map(resolvedLevels.map((l) => [l.id, l]));
  // ...
}
```

```typescript
// app/journey/page.tsx
const [data, cohortPulse, announcements, levels] = await Promise.all([...]);
// Then pass levels to getJourneyData — but note getJourneyData is already
// called in the parallel array; restructure to fetch levels first if this
// optimization is needed.
```

Alternatively, the `levelLabel` field in `JourneyData` can be removed and the page computes it from the `levels` array it already holds.

### WR-03: `getLevelNumber()` silently returns wrong character for multi-digit ordinals

**File:** `lib/journey-progression.ts:25-27`
**Issue:** `getLevelNumber` returns `levelId.charAt(1)` — the character at position 1 in the ID string. This works correctly for the current 8-level set (`L0_diagnostic` → `"0"`, ..., `L7_alumni` → `"7"`). However, after `LevelId = string` (Phase 14-02), the type constraint was relaxed and the DB can now store arbitrary text level IDs. If a future level has a two-digit ordinal in its ID (e.g., `L10_expansion`), `charAt(1)` returns `"1"` instead of `"10"`, silently producing wrong level node numbers in `JourneyTrack`, `JourneyDrawer`, and `JourneyHeroNextStep` ARIA labels without any error.

The function has no guard or comment noting this assumption. The comment says "Regex on id string — still valid after LevelId = string" but this only addresses type safety, not the single-character assumption.

**Fix:** Add a defensive extraction that handles multi-digit ordinals:

```typescript
// Extract digits after the leading "L" until the first "_"
export function getLevelNumber(levelId: LevelId): string {
  const match = /^L(\d+)_/.exec(levelId);
  return match?.[1] ?? levelId.charAt(1);
}
```

This is backward-compatible with all 8 current IDs and future-safe for multi-digit ordinals.

---

## Info

### IN-01: `seedLevels()` export in `lib/seed/index.ts` is never imported

**File:** `lib/seed/index.ts:33-35`
**Issue:** `seedLevels()` is exported but no file imports it. `getLevels()` in `lib/levels.ts` imports `demoLevels` from `lib/seed/levels.ts` directly (bypassing `seedLevels()`). The export is dead code created by Phase 14 that follows the pattern of `seedPlayers()` / `seedMissions()` but was never wired up.

**Fix:** Either remove the export, or update `lib/levels.ts` to use `seedLevels()` for consistency:
```typescript
// lib/levels.ts — option: use seedLevels() for pattern consistency
import { seedLevels } from "@/lib/seed";
export const DEMO_LEVELS: Level[] = seedLevels();
```
However, this creates a circular import if `lib/seed/index.ts` ever imports from `lib/levels.ts`. The current direct import of `demoLevels` in `lib/levels.ts` is actually the safer pattern; remove the `seedLevels` export.

### IN-02: `label.split(' - ')[1] ?? label` — implicit label format contract

**File:** `app/journey/page.tsx:62`
**Issue:** The short-label derivation `l.label.split(" - ")[1] ?? label` encodes an implicit contract: DB-stored labels must follow the format `"Niveau N - ShortName"` to produce usable short labels. The demo seed in `lib/seed/levels.ts` uses this format. If a GameMaster creates a custom level with a label that doesn't contain ` - ` (e.g., "Introduction"), `split(" - ")[1]` returns `undefined` and the fallback `?? label` uses the full label instead of a short one — the `JourneyTrack` nodes and `JourneyHeroNextStep` kicker would display the verbose full label in the UI chip.

This isn't a crash but is invisible breakage when a new level is added without following the undocumented convention.

**Fix:** Document the label format contract in the `levels_v2` table comment and in `lib/seed/levels.ts`, or make the short-label derivation explicit in the `Level` type:
```typescript
// lib/types.ts — add optional shortLabel column
export type Level = {
  id: string;
  ord: number;
  label: string;
  shortLabel?: string;  // If absent, derive from label.split(' - ')[1] ?? label
  description: string;
};
```

### IN-03: `is_in_org` does not cover mentors — breaks `organizations_member_select` for mentor role

**File:** `supabase/migrations/20260611120300_rls_org_scope.sql:26-39`
**Issue:** `is_in_org(p_org_id)` joins exclusively through `player_members → players → cohorts → events`. Mentors have `app_role = 'mentor'` in `profiles` but are not in `player_members`. For a mentor user, `is_in_org(org_id)` always returns `false`. The `organizations_member_select` policy (`USING: is_in_org(id) OR is_game_master()`) would deny mentors SELECT access to any `organizations` row.

In the current PROD setup this has no effect because (a) there are no API calls that query `organizations` for mentors, (b) the `events_org_scope_select` is overridden by `events_authenticated_select` anyway (CR-01). But when CR-01 is fixed and org-scoped isolation is actually enforced, mentors will be locked out of the active event query entirely.

The comment "PROD is currently mono-org" documents awareness that this is deferred, but the mentor gap is not explicitly documented.

**Fix:** When implementing CR-01 properly, extend `is_in_org` to also check mentor assignments:
```sql
CREATE OR REPLACE FUNCTION public.is_in_org(p_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.events e
    JOIN public.cohorts c   ON c.event_id = e.id
    JOIN public.players p   ON p.cohort_id = c.id
    JOIN public.player_members pm ON pm.player_id = p.id
    WHERE e.organization_id = p_org_id
      AND pm.user_id = (select auth.uid())
  )
  OR EXISTS(
    -- Mentors are not in player_members; include them via profiles
    SELECT 1 FROM public.events e
    JOIN public.profiles pr ON pr.app_role IN ('mentor', 'game_master')
    WHERE e.organization_id = p_org_id
      AND pr.user_id = (select auth.uid())
  )
$$;
```

---

_Reviewed: 2026-06-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
