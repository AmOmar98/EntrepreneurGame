# Phase 14: Multi-tenant Schema + Niveaux data-driven — Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 14 new/modified files
**Analogs found:** 14 / 14

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `supabase/migrations/YYYYMMDDHHMMSS_organizations.sql` | migration | batch | `supabase/migrations/20260519120000_jurors_and_pitch_mode.sql` | exact |
| `supabase/migrations/YYYYMMDDHHMMSS_events_is_active.sql` | migration | batch | `supabase/migrations/20260511223000_pitch_order_columns.sql` | role-match |
| `supabase/migrations/YYYYMMDDHHMMSS_levels_data_driven.sql` | migration | batch | `supabase/migrations/20260512100000_help_requests.sql` | role-match |
| `supabase/migrations/YYYYMMDDHHMMSS_rls_org_scope.sql` | migration | batch | `supabase/migrations/20260517225015_rls_initplan_fix.sql` | exact |
| `lib/types.ts` (modify) | model | transform | self | — |
| `lib/journey.ts` (modify) | service | request-response | `lib/cohort-pulse.ts` | exact |
| `lib/journey-progression.ts` (modify) | utility | transform | self | — |
| `lib/schemas.ts` (modify) | utility | transform | self | — |
| `lib/icons.ts` (modify) | utility | transform | self | — |
| `lib/levels.ts` (new) | service | request-response | `lib/pitch-mode.ts` | exact |
| `lib/seed/levels.ts` (new) | utility | transform | `lib/seed/missions.ts` | exact |
| `lib/seed/index.ts` (modify) | utility | transform | self | — |
| `lib/jury.ts` (modify) | service | CRUD | self | — |
| `lib/cohort-pulse.ts` (modify) | service | CRUD | self | — |

---

## Pattern Assignments

### Migration files (new SQL migrations)

**Analogs:**
- `supabase/migrations/20260519120000_jurors_and_pitch_mode.sql` — multi-part, additive, idempotent (`DROP POLICY IF EXISTS`, `CREATE OR REPLACE FUNCTION`), `SET search_path = public`, SECURITY DEFINER + grant pair, `BEGIN`/`COMMIT` block
- `supabase/migrations/20260517225015_rls_initplan_fix.sql` — `BEGIN`/`COMMIT` transaction block, `DROP POLICY IF EXISTS` + `CREATE POLICY` idempotence, `(select auth.uid())` initplan form, rollback comment section

**Header style** (`20260519120000_jurors_and_pitch_mode.sql` lines 1-9):
```sql
-- ============================================================================
-- Quick 260519-jpr : Migration DB pitch-mode + jurors table
-- ============================================================================
-- Appliquée via mcp__plugin_supabase_supabase__apply_migration en 3 parts
-- Spec source : docs/superpowers/specs/...
-- Tag de sécurité : v0.X.Y-pre-<slug>
-- ============================================================================
```

**Transactional block** (`20260517225015_rls_initplan_fix.sql` lines 11, 229):
```sql
BEGIN;
-- ... all DDL ...
COMMIT;

-- ── Rollback (manual) ───
-- Step-by-step revert instructions
```

**Additive ALTER TABLE pattern** (never DROP, always nullable or DEFAULT):
```sql
-- ADD nullable column first, backfill, then add NOT NULL constraint if needed.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;
```

**Idempotent SECURITY DEFINER function with grant pair** (`20260519120000_jurors_and_pitch_mode.sql` lines 26-34 + `database/rls.sql` lines 21-29 + 391-392):
```sql
CREATE OR REPLACE FUNCTION public.is_juror(p_event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.jurors
    WHERE event_id = p_event_id AND user_id = auth.uid()
  )
$$;

-- Always paired with REVOKE + GRANT (never leave PUBLIC access):
REVOKE EXECUTE ON FUNCTION public.is_juror(p_event_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_juror(p_event_id uuid) TO authenticated;
```

**RLS policy idempotence** (`20260517225015_rls_initplan_fix.sql` lines 15-16):
```sql
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
CREATE POLICY "policy_name" ON public.table_name
  AS PERMISSIVE
  FOR SELECT TO authenticated
  USING ( ... (select auth.uid()) ... );  -- initplan form, never raw auth.uid()
```

**Table-level GRANT after RLS** (`20260512100000_help_requests.sql` line 67):
```sql
-- F-16-01 lesson: RLS alone insufficient, table GRANT required.
grant select, insert, update on public.help_requests to authenticated;
```

**New table structure reference** (`20260519120000_jurors_and_pitch_mode.sql` lines 15-22):
```sql
CREATE TABLE public.jurors (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  invited_at timestamptz NOT NULL DEFAULT now(),
  invited_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX idx_jurors_user  ON public.jurors(user_id);
CREATE INDEX idx_jurors_event ON public.jurors(event_id);
```

**organizations table** must follow the same pattern — uuid PK, slug, name, created_at — with indexes on slug and FK from events.organization_id.

---

### `lib/levels.ts` (new service, request-response)

**Analog:** `lib/pitch-mode.ts` (lines 1-59) — same pattern: `createClient()` null-check early return, typed row cast, demo fallback constant.

**Full pattern to copy:**
```typescript
// lib/levels.ts
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";
import type { Level } from "@/lib/types";

// Demo fallback — mirrors the PG levels table rows.
// Keeps lib/seed/ shape: id is now a plain string (not enum).
const DEMO_LEVELS: Level[] = [
  { id: "L0_diagnostic", ord: 0, label: "Niveau 0 - Diagnostic", description: "" },
  { id: "L1_problem",    ord: 1, label: "Niveau 1 - Probleme",   description: "" },
  // ...
];

export async function getLevels(): Promise<Level[]> {
  if (!hasSupabaseEnv()) return DEMO_LEVELS;   // same guard as cohort-pulse.ts:77

  const supabase = await createClient();
  if (!supabase) return DEMO_LEVELS;           // same null-check as pitch-mode.ts:28

  const { data, error } = await supabase
    .from("levels")
    .select("id, ord, label, description")
    .order("ord", { ascending: true });

  if (error || !data) return DEMO_LEVELS;
  return (data as Level[]);
}
```

**Key difference from `lib/pitch-mode.ts`:** pitch-mode returns a single row, getLevels returns an array. Use `DEMO_LEVELS` array constant instead of a scalar default — mirrors how `lib/cohort-pulse.ts:57-59` uses `emptyEntries()`.

---

### `lib/types.ts` (modify — LevelId loosening)

**Current definition** (lines 13-21):
```typescript
export type LevelId =
  | "L0_diagnostic"
  | "L1_problem"
  | "L2_solution"
  | "L3_market"
  | "L4_business_model"
  | "L5_pitch"
  | "L6_traction"
  | "L7_alumni";
```

**Target:** Replace string-literal union with `string` (or branded string). Every type that references `LevelId` in `lib/types.ts` is:
- `Level.id` (line 51)
- `Mission.levelId` (line 60)
- `Player.currentLevel` (line 112)

All three fields stay typed as the new `LevelId` — only the underlying type changes to `string`. Use a branded type if you want callsite safety:
```typescript
export type LevelId = string & { readonly __brand: "LevelId" };
// or simpler (preferred for this project — matches "simplicity first"):
export type LevelId = string;
```

**Event type** (lines 41-48) must gain two new optional fields for Phase 14:
```typescript
export type Event = {
  id: string;
  slug: string;
  name: string;
  startsAt: string;
  endsAt: string;
  resultsPublishedAt: string | null;
  isActive?: boolean;           // TENANT-03: replaces order-by-starts_at convention
  organizationId?: string;      // TENANT-01: FK to organizations
};
```

---

### `lib/journey.ts` (modify — LEVEL_LABELS/LEVEL_ORDS removal)

**What to remove:**
- `LEVEL_LABELS` constant (lines 71-80) — replaced by DB lookup in `getLevels()`
- `LEVEL_ORDS` constant (lines 86-95) — replaced by `Level.ord` from DB
- `levelLabel()` export (lines 82-84) — callers switch to looking up from the levels array
- `levelOrd()` export (lines 101-103) — callers switch to `level.ord`

**Callers of `levelLabel()` to update** (exhaustive list from grep):
- `lib/admin-deliverables.ts:6` — imports + calls `levelLabel(level)`
- `lib/admin-player-detail.ts:7` — imports + calls `levelLabel(player.currentLevel)`
- `lib/admin.ts:7` — imports + calls `levelLabel(player.currentLevel)`
- `lib/mentor.ts:7` — imports + calls `levelLabel(player.currentLevel)`
- `app/admin/announce/page.tsx:15` — imports + calls `levelLabel(id)`
- `app/mentor/submission/[id]/page.tsx:36` — imports + calls `levelLabel(player.current_level)`

**Callers of `levelOrd()` to update:**
- `app/admin/page.tsx:22` — uses `levelOrd(row.player.currentLevel)` for radar sort
- `lib/admin-live.ts:10` — uses `levelOrd(p.current_level)` for level sort
- `lib/cohort-pulse.ts:19` — uses `levelOrd(levelId)` for pulse comparison

**Pattern for callers after removal** — pass a `levels: Level[]` param or look up from a pre-fetched map:
```typescript
// Before:
import { levelLabel } from "@/lib/journey";
const label = levelLabel(player.currentLevel);

// After — pass levels from accessor or prop:
const levelsMap = new Map(levels.map((l) => [l.id, l]));
const label = levelsMap.get(player.currentLevel)?.label ?? player.currentLevel;
const ord   = levelsMap.get(player.currentLevel)?.ord   ?? 0;
```

**Row mapper to update** (lines 114-136): `current_level` field typed as `LevelId` (now `string`) — no functional change needed since it's already read as a string from the DB.

**`getJourneyData` active-event** (line 224 area): currently selects cohort's event_id directly from `cohorts.event_id`. No `starts_at` ordering here — no change needed for TENANT-03. The `is_active` flag affects the top-level event resolution in other accessors listed below.

---

### `lib/journey-progression.ts` (modify — LEVEL_IDS/SHORT_LABELS removal)

**What to remove:**
- `LEVEL_IDS` export (lines 22-31) — ordered array, replaced by `levels.sort((a,b) => a.ord - b.ord).map(l => l.id)`
- `SHORT_LABELS` constant (lines 35-43) — replaced by `Level.label` (or a new `shortLabel` column in DB)
- `getShortLevelLabel()` export (lines 51-53) — callers receive levels array
- `getLevelNumber()` (line 47-49) — regex on level id string, still valid after `LevelId = string`, keep

**`getLevelStates()` signature change** (lines 85-100): currently uses `LEVEL_IDS.indexOf(currentLevel)` for index lookup. After removal, accept an ordered `levels: Level[]` parameter:
```typescript
// Before:
export function getLevelStates(currentLevel: LevelId): Map<LevelId, LevelState> {
  const currentIdx = LEVEL_IDS.indexOf(currentLevel);
  for (let i = 0; i < LEVEL_IDS.length; i++) { ... }
}

// After:
export function getLevelStates(
  levels: Level[],   // sorted by ord ASC, fetched from DB/demo
  currentLevel: LevelId,
): Map<LevelId, LevelState> {
  const ordered = [...levels].sort((a, b) => a.ord - b.ord);
  const currentIdx = ordered.findIndex((l) => l.id === currentLevel);
  for (let i = 0; i < ordered.length; i++) { ... }
}
```

**`getLevelXp()` and `getTotalEarnedXp()`** (lines 107-127): compare `m.mission.levelId !== levelId` — still works with `LevelId = string`, no change.

**Caller of `getLevelStates`** at `app/journey/page.tsx:20,77`: must pass the `levels` array fetched from `getLevels()`.

---

### `lib/schemas.ts` (modify — Zod LevelId z.enum removal)

**Current pattern** (`lib/schemas.ts` does not currently have a `LevelId` z.enum — confirmed by grep). The level literal appears directly in `app/actions.ts:166`:
```typescript
current_level: "L1_problem",
```

This hard-coded string in the onboarding action (saveOnboardingKyc) does NOT use z.enum for LevelId validation — it is a literal. After the migration, it should remain a string literal `"L1_problem"` (still valid in DB as text FK).

**If a `z.enum(LevelId)` appears in any schema**: replace with `z.string().min(1)` and add server-side check against the fetched levels table. The existing `z.refine` pattern in `lib/schemas.ts` (lines 16-19) is the model:
```typescript
// Analog for DB-validated string instead of enum:
export const levelIdSchema = z.string().min(1).refine(
  async (id) => {
    const levels = await getLevels();
    return levels.some((l) => l.id === id);
  },
  "Niveau invalide"
);
// Or simpler (permissive string + server-side check in the action):
export const levelIdSchema = z.string().min(1);
```

---

### `lib/icons.ts` (modify — `Record<LevelId, LucideIcon>`)

**Current definition** (lines 20-29):
```typescript
export const levelIcon: Record<LevelId, LucideIcon> = {
  L0_diagnostic: Compass,
  L1_problem: Target,
  // ...
};
```

After `LevelId = string`, `Record<LevelId, LucideIcon>` becomes `Record<string, LucideIcon>`. The object literal stays identical — no runtime change. Only the TypeScript type annotation changes.

---

### `lib/seed/levels.ts` (new utility file)

**Analog:** `lib/seed/missions.ts` (full file) — same header comment, same `import type { X } from "@/lib/types"`, same `export const demoX: X[]` shape.

```typescript
// DEMO DATA ONLY (DATA-03) — used only when hasSupabaseEnv() is false.
import type { Level } from "@/lib/types";

export const demoLevels: Level[] = [
  { id: "L0_diagnostic", ord: 0, label: "Niveau 0 - Diagnostic", description: "" },
  { id: "L1_problem",    ord: 1, label: "Niveau 1 - Probleme",   description: "" },
  { id: "L2_solution",   ord: 2, label: "Niveau 2 - Solution",   description: "" },
  { id: "L3_market",     ord: 3, label: "Niveau 3 - Marche",     description: "" },
  { id: "L4_business_model", ord: 4, label: "Niveau 4 - Modele economique", description: "" },
  { id: "L5_pitch",      ord: 5, label: "Niveau 5 - Pitch",      description: "" },
  { id: "L6_traction",   ord: 6, label: "Niveau 6 - Traction",   description: "" },
  { id: "L7_alumni",     ord: 7, label: "Niveau 7 - Alumni",     description: "" },
];
```

---

### `lib/seed/index.ts` (modify)

**Current pattern** (lines 20-30):
```typescript
export function seedPlayers(): Player[] {
  return hasSupabaseEnv() ? [] : demoPlayers;
}
```

**Add** a `seedLevels()` export using the identical pattern:
```typescript
import { demoLevels } from "./levels";
// ...
export function seedLevels(): Level[] {
  return hasSupabaseEnv() ? [] : demoLevels;
}
```

---

### Active-event convention sites (TENANT-03)

**All 19 sites using `.order("starts_at", { ascending: false }).limit(1)` pattern:**

| File | Line | Context |
|---|---|---|
| `app/results/page.tsx` | 35 | event resolution |
| `lib/admin.ts` | 114, 288 | event resolution |
| `lib/admin-live.ts` | 144 | event resolution |
| `lib/results.ts` | 136, 171 | event resolution (×2) |
| `lib/pitch-prep.ts` | 95 | event resolution |
| `lib/pitch-mode.ts` | 35 | event resolution |
| `lib/mentor.ts` | 92 | event resolution |
| `lib/jury.ts` | 191 | event resolution |
| `lib/admin-export.ts` | 62 | event resolution |
| `lib/announcements.ts` | 76 | event resolution |
| `app/admin/page.tsx` | 68 | event resolution |
| `app/admin/announce/page.tsx` | 47 | event resolution |
| `app/actions.ts` | 852, 1532 | event resolution (×2) |

**Replacement pattern** — after adding `events.is_active boolean DEFAULT false`, each site changes from:
```typescript
// BEFORE (19 sites):
.from("events")
.select("id, ...")
.order("starts_at", { ascending: false })
.limit(1)
.maybeSingle();

// AFTER:
.from("events")
.select("id, ...")
.eq("is_active", true)
.limit(1)
.maybeSingle();
```

**Canonical example to copy** is `lib/pitch-mode.ts` lines 32-37 (the full pattern including error handling on null result — lines 38-45).

---

### `lib/jury.ts` (modify — inline levelRank maps)

**Two inline `Record<LevelId, number>` maps** at lines 255-264 and 414-423 — both duplicate `LEVEL_ORDS`. After removal of `LEVEL_ORDS` from `lib/journey.ts`, replace with ord lookup:

```typescript
// Before (lib/jury.ts:272):
const dl = (levelRank[b.currentLevel] ?? -1) - (levelRank[a.currentLevel] ?? -1);

// After — receive levels: Level[] as parameter or module-level await:
const levelsMap = new Map(levels.map((l) => [l.id, l]));
const dl = (levelsMap.get(b.currentLevel)?.ord ?? -1) - (levelsMap.get(a.currentLevel)?.ord ?? -1);
```

---

### `lib/cohort-pulse.ts` (modify — PULSE_LEVELS + levelOrd)

**`PULSE_LEVELS` constant** (lines 29-35) — typed as `LevelId[]`, still a string array, works as-is after `LevelId = string`.

**`levelOrd(levelId)` usage** (lines 67-68) — after `levelOrd` is removed from `lib/journey.ts`, use the levels map:
```typescript
// Before (cohort-pulse.ts:67-68):
const ord = levelOrd(levelId);
const count = players.filter((p) => levelOrd(p.currentLevel) > ord).length;

// After:
const ordOf = (id: LevelId) => levelsMap.get(id)?.ord ?? 0;
const ord = ordOf(levelId);
const count = players.filter((p) => ordOf(p.currentLevel) > ord).length;
```

---

## Shared Patterns

### Demo fallback guard (apply to all new `lib/` accessors)

**Source:** `lib/cohort-pulse.ts:77` and `lib/seed/index.ts:21`

```typescript
// Pattern 1 — pure function fallback (for getLevels, getActiveEvent):
if (!hasSupabaseEnv()) return DEMO_CONSTANT;
const supabase = await createClient();
if (!supabase) return DEMO_CONSTANT;

// Pattern 2 — conditional accessor (for seedLevels in index.ts):
export function seedLevels(): Level[] {
  return hasSupabaseEnv() ? [] : demoLevels;
}
```

**Rule (CLAUDE.md):** Never add `redirect("/login")` or `getCurrentUser()` before the `hasSupabaseEnv()` check.

### SECURITY DEFINER helper function (apply to `is_in_org()`)

**Source:** `database/rls.sql` lines 21-29 (is_game_master) + `supabase/migrations/20260519120000_jurors_and_pitch_mode.sql` lines 26-34 (is_juror)

```sql
CREATE OR REPLACE FUNCTION public.is_in_org(p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.events e
    JOIN public.cohorts c ON c.event_id = e.id
    JOIN public.players p ON p.cohort_id = c.id
    JOIN public.player_members pm ON pm.player_id = p.id
    WHERE e.organization_id = p_org_id
      AND pm.user_id = auth.uid()
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_in_org(p_org_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_in_org(p_org_id uuid) TO authenticated;
```

### Row mapper snake_case → camelCase (apply to `organizations`, `Level` DB rows)

**Source:** `lib/journey.ts` lines 109-136 (mapPlayer), `lib/journey.ts` lines 138-158 (mapMission)

```typescript
type LevelRow = {
  id: string;         // was enum, now text FK
  ord: number;
  label: string;
  description: string;
};

function mapLevel(row: LevelRow): Level {
  return {
    id: row.id,
    ord: row.ord,
    label: row.label,
    description: row.description,
  };
}
```

### RLS initplan `(select auth.uid())` form (mandatory)

**Source:** `supabase/migrations/20260517225015_rls_initplan_fix.sql` throughout, and `database/rls.sql` line 48 (`is_my_player`)

All new policies must use `(select auth.uid())` not `auth.uid()` inline (Supabase advisor `auth_rls_initplan` rule). Example from rls_initplan_fix.sql line 30:
```sql
WHERE pm.user_id = (select auth.uid())
```

---

## Enum Migration Pitfalls (Phase-specific notes for planner)

1. **PG enum cannot shrink** — `public.level_id` enum stays as-is in PROD. The new `levels` table uses a `text` PK (not the enum). Missions and players get a new `level_id_text text` column, backfilled from the enum cast, then reads switch to the text column.

2. **ALTER COLUMN type is destructive** — do NOT attempt `ALTER COLUMN missions.level_id TYPE text`. Use additive approach: new column → backfill → switch FK reference.

3. **Zod `z.enum` removal** — replace with `z.string().min(1)`. No existing `z.enum([...LevelId values...])` was found in `lib/schemas.ts` (only in `app/actions.ts:166` as a literal string, not a schema). If one surfaces during planning, the analog is the `z.refine` pattern at `lib/schemas.ts:17-19`.

4. **Sort by `ord` everywhere** — after removing `LEVEL_ORDS`, any sort that relied on enum ordinal order (PG sorts enums by creation order) must explicitly use `ORDER BY ord`. The `lib/jury.ts` inline `levelRank` maps (lines 255-264, 414-423) are the most dangerous sites.

5. **Tests reference level labels** — `tests/unit/actions-schemas.test.ts` does not reference level literals. `tests/e2e/` specs use demo mode and do not assert on level labels. However, any new unit test for `getLevels()` must import from `lib/levels.ts` (not `lib/journey.ts`) to stay outside the Next.js runtime.

---

## No Analog Found

None — all files have close analogs. However, the `organizations` table concept is new; use `public.events` in `database/schema.sql` (lines 62-73) as the structural template for `public.organizations` (same uuid PK + slug + name + timestamps pattern).

---

## Metadata

**Analog search scope:** `supabase/migrations/`, `database/`, `lib/`, `app/`, `components/`, `tests/`
**Files scanned:** 35
**Pattern extraction date:** 2026-06-11
