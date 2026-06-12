# Phase 16: Jury paramétrable + Scoring configurable — Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 14 new/modified files
**Analogs found:** 13 / 14

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `supabase/migrations/2026XXXX_phase16_pitch_criteria.sql` | migration | CRUD | `supabase/migrations/20260611230000_phase15_engine_columns.sql` | exact |
| `supabase/migrations/2026XXXX_phase16_event_settings.sql` | migration | CRUD | `supabase/migrations/20260517224914_phase14_engagement_trigger.sql` | exact |
| `supabase/migrations/2026XXXX_phase16_triggers_parameterized.sql` | migration | event-driven | `supabase/migrations/20260517224914_phase14_engagement_trigger.sql` | exact |
| `lib/pitch-criteria.ts` | service | request-response | `lib/active-event.ts` | role-match |
| `lib/event-settings.ts` | service | request-response | `lib/active-event.ts` | role-match |
| `lib/results.ts` (modify) | service | transform | self (already analog) | exact |
| `lib/score.ts` (modify) | service | transform | self (already analog) | exact |
| `lib/jury.ts` (modify) | service | request-response | self (already analog) | exact |
| `app/actions.ts` — `savePitchScoreFlow` (modify) | action | request-response | self lines 1136-1260 | exact |
| `app/actions.ts` — `saveJuryGridFlow` (new) | action | CRUD | `app/actions.ts:saveDeliverableTemplateFlow` lines 3157-3265 | exact |
| `app/actions.ts` — `saveEventSettingsFlow` (new) | action | CRUD | `app/actions.ts:saveDeliverableTemplateFlow` lines 3157-3265 | role-match |
| `app/jury/jury-form.tsx` (modify) | component | request-response | self lines 1-200 | exact |
| `components/admin-jury-grid-editor.tsx` (new) | component | CRUD | `components/admin-deliverable-template-editor.tsx` | exact |
| `components/admin-event-settings-editor.tsx` (new) | component | CRUD | `components/admin-missions-editor.tsx` | role-match |

---

## Pattern Assignments

### `supabase/migrations/2026XXXX_phase16_pitch_criteria.sql` (migration, CRUD)

**Analog:** `supabase/migrations/20260611230000_phase15_engine_columns.sql`

**Migration structure pattern** (lines 1-15, 13-57):
```sql
-- ============================================================================
-- Phase 16-XX : <description>
-- ============================================================================
-- ADDITIVE ONLY: ADD ... IF NOT EXISTS; idempotent CHECK via DROP-then-ADD.
-- Apply after <predecessor>.sql.
-- Tag de securite : v0.4-pre-phase16
-- PROD apply: deferred to batched operator checkpoint.
-- ============================================================================

BEGIN;

-- New table: pitch_criteria
CREATE TABLE IF NOT EXISTS public.pitch_criteria (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  key      text        NOT NULL,
  label    text        NOT NULL,
  max      smallint    NOT NULL CHECK (max BETWEEN 1 AND 100),
  ord      smallint    NOT NULL DEFAULT 0,
  UNIQUE (event_id, key)
);

-- Additive column on pitch_scores (nullable; legacy rows keep c1..c5 only)
ALTER TABLE public.pitch_scores
  ADD COLUMN IF NOT EXISTS scores jsonb;

-- CHECK: scores jsonb must be null or a non-empty object (no empty {})
ALTER TABLE public.pitch_scores
  DROP CONSTRAINT IF EXISTS pitch_scores_scores_object_or_null;
ALTER TABLE public.pitch_scores
  ADD CONSTRAINT pitch_scores_scores_object_or_null
  CHECK (scores IS NULL OR (jsonb_typeof(scores) = 'object' AND scores <> '{}'::jsonb));

-- Grants (match pattern from phase15 engine columns)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_criteria TO authenticated;

COMMIT;
```

**Key constraint** — `total_score` on `pitch_scores` is `GENERATED ALWAYS AS (c1+c2+c3+c4+c5) STORED` (schema.sql:215). This cannot be changed to read jsonb. The new `scores` jsonb column stores the dynamic totals separately; `lib/results.ts` computes the effective pitch score by reading `scores` when non-null, falling back to `total_score` (c1..c5 path) when null.

**Security/grants pattern** (phase15_engine_columns.sql, bottom):
```sql
REVOKE EXECUTE ON FUNCTION public.<fn>() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.<fn>() TO authenticated;
```

---

### `supabase/migrations/2026XXXX_phase16_event_settings.sql` (migration, CRUD)

**Analog:** `supabase/migrations/20260517224914_phase14_engagement_trigger.sql`

**event_settings table pattern** — prefer a dedicated table over a jsonb column on events (same FK-first approach as phase 14 engagement):
```sql
CREATE TABLE IF NOT EXISTS public.event_settings (
  event_id uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  -- XP rules (default = current hardcoded values)
  xp_first_submission  int NOT NULL DEFAULT 100,
  xp_validate_v1       int NOT NULL DEFAULT 50,
  xp_validate_v2       int NOT NULL DEFAULT 100,
  -- Engagement thresholds (same as SUBMITTED/REVIEWED/VALIDATED constants)
  eng_submitted        int NOT NULL DEFAULT 100,
  eng_reviewed         int NOT NULL DEFAULT 25,
  eng_validated        int NOT NULL DEFAULT 50,
  -- Pitch weight for combined ranking (0.0-1.0)
  pitch_weight         numeric(4,3) NOT NULL DEFAULT 0.800
    CHECK (pitch_weight BETWEEN 0.0 AND 1.0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.event_settings TO authenticated;
GRANT INSERT, UPDATE ON public.event_settings TO authenticated; -- gated by RLS GM-only

-- RLS: only game_master may insert/update
CREATE POLICY event_settings_gm_write ON public.event_settings
  FOR ALL USING (public.is_game_master());
```

**idempotent backfill pattern** (phase14_engagement_trigger.sql:149-157):
```sql
-- Backfill: insert default row for events that don't have one yet.
INSERT INTO public.event_settings (event_id)
SELECT id FROM public.events
ON CONFLICT (event_id) DO NOTHING;
```

---

### `supabase/migrations/2026XXXX_phase16_triggers_parameterized.sql` (migration, event-driven)

**Analog:** `supabase/migrations/20260517224914_phase14_engagement_trigger.sql`

**SECURITY DEFINER + search_path + grants pattern** (phase14_engagement_trigger.sql:30-35, database/triggers.sql:57-84):
```sql
CREATE OR REPLACE FUNCTION public.recalc_player_engagement(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric(6,2);
BEGIN
  ...
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recalc_player_engagement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalc_player_engagement(uuid) TO authenticated;
```

**Parameterized helper pattern** — SETTINGS-03 zero double-hardcode. New helper SQL function reads from `event_settings`:
```sql
-- get_event_setting: returns typed value with fallback default.
-- Used by recalc_player_engagement (SETTINGS-03).
CREATE OR REPLACE FUNCTION public.get_event_setting_int(
  p_event_id uuid,
  p_key      text,
  p_default  int
)
RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE p_key
      WHEN 'xp_first_submission' THEN (SELECT xp_first_submission FROM public.event_settings WHERE event_id = p_event_id)
      WHEN 'xp_validate_v1'      THEN (SELECT xp_validate_v1      FROM public.event_settings WHERE event_id = p_event_id)
      WHEN 'xp_validate_v2'      THEN (SELECT xp_validate_v2      FROM public.event_settings WHERE event_id = p_event_id)
      WHEN 'eng_submitted'       THEN (SELECT eng_submitted        FROM public.event_settings WHERE event_id = p_event_id)
      WHEN 'eng_reviewed'        THEN (SELECT eng_reviewed         FROM public.event_settings WHERE event_id = p_event_id)
      WHEN 'eng_validated'       THEN (SELECT eng_validated        FROM public.event_settings WHERE event_id = p_event_id)
    END,
    p_default
  );
$$;
```

**Trigger binding CREATE-OR-REPLACE + DROP-then-CREATE pattern** (phase15_engine_columns.sql:209-213):
```sql
DROP TRIGGER IF EXISTS trg_<name> ON public.<table>;
CREATE TRIGGER trg_<name>
  AFTER INSERT OR UPDATE ... ON public.<table>
  FOR EACH ROW EXECUTE FUNCTION public.<fn>();
```

**Bootstrap-safe DO $$ block for conditional triggers** (database/triggers.sql:210-227):
```sql
DO $$
BEGIN
  IF to_regclass('public.event_settings') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_event_settings_updated_at ON public.event_settings;
    CREATE TRIGGER trg_event_settings_updated_at
      BEFORE UPDATE ON public.event_settings
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
```

**Parameterized recalc_player_engagement pattern** — updated function reads from event_settings with fallbacks:
```sql
CREATE OR REPLACE FUNCTION public.recalc_player_engagement(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total     numeric(6,2);
  v_event_id  uuid;
  v_eng_submitted int;
  v_eng_reviewed  int;
  v_eng_validated int;
BEGIN
  -- Resolve event_id via player -> cohort -> event
  SELECT e.id INTO v_event_id
  FROM public.players pl
  JOIN public.cohorts c ON c.id = pl.cohort_id
  JOIN public.events  e ON e.id = c.event_id
  WHERE pl.id = p_player_id
  LIMIT 1;

  v_eng_submitted := public.get_event_setting_int(v_event_id, 'eng_submitted', 100);
  v_eng_reviewed  := public.get_event_setting_int(v_event_id, 'eng_reviewed',  25);
  v_eng_validated := public.get_event_setting_int(v_event_id, 'eng_validated', 50);

  WITH
    submitted AS (
      SELECT DISTINCT s.deliverable_template_id AS dt_id
      FROM public.submissions s WHERE s.player_id = p_player_id
    ),
    ...
  SELECT COALESCE(
    (SELECT COUNT(*) FROM submitted) * v_eng_submitted +
    (SELECT COUNT(*) FROM reviewed)  * v_eng_reviewed  +
    (SELECT COUNT(*) FROM validated) * v_eng_validated,
    0
  ) INTO v_total;

  UPDATE public.players SET score_engagement = v_total WHERE id = p_player_id;
END;
$$;
```

---

### `lib/pitch-criteria.ts` (service, request-response)

**Analog:** `lib/active-event.ts`

**Imports pattern** (lib/active-event.ts:1-17):
```typescript
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase-status";
```

**Dual-mode accessor + demo fallback pattern** (lib/active-event.ts:65-81):
```typescript
export async function getPitchCriteria(eventId: string): Promise<PitchCriterion[]> {
  if (!hasSupabaseEnv()) return DEMO_PITCH_CRITERIA;

  const supabase = await createClient();
  if (!supabase) return DEMO_PITCH_CRITERIA;

  const { data, error } = await supabase
    .from("pitch_criteria")
    .select("id, event_id, key, label, max, ord")
    .eq("event_id", eventId)
    .order("ord", { ascending: true });

  if (error) return DEMO_PITCH_CRITERIA;
  if (!data || data.length === 0) return DEMO_PITCH_CRITERIA;
  return (data as PitchCriterionRow[]).map(mapCriterion);
}
```

**Demo fallback constant** — mirrors the 4 legacy criteria from `lib/i18n.ts:450-454`:
```typescript
const DEMO_PITCH_CRITERIA: PitchCriterion[] = [
  { id: "00000000-0000-0000-0000-000000000pc1", eventId: "...", key: "innovation",    label: "Innovation",              max: 20, ord: 0 },
  { id: "00000000-0000-0000-0000-000000000pc2", eventId: "...", key: "faisabilite",   label: "Faisabilite technique",   max: 20, ord: 1 },
  { id: "00000000-0000-0000-0000-000000000pc3", eventId: "...", key: "modele",        label: "Modele economique",       max: 20, ord: 2 },
  { id: "00000000-0000-0000-0000-000000000pc4", eventId: "...", key: "equipe",        label: "Equipe",                  max: 20, ord: 3 },
];
```

---

### `lib/event-settings.ts` (service, request-response)

**Analog:** `lib/active-event.ts`

**Fallback-first pattern** (lib/active-event.ts:65-81):
```typescript
export const DEFAULT_EVENT_SETTINGS: EventSettings = {
  xpFirstSubmission: 100,  // lib/journey.ts:347 earnedXp += 100
  xpValidateV1:       50,  // lib/journey.ts:352 earnedXp += 50
  xpValidateV2:      100,  // lib/journey.ts:353 earnedXp += 100
  engSubmitted:      100,  // lib/score.ts:72 SUBMITTED_POINTS
  engReviewed:        25,  // lib/score.ts:73 REVIEWED_POINTS
  engValidated:       50,  // lib/score.ts:74 VALIDATED_POINTS
  pitchWeight:         0.8, // lib/results.ts:33 DEFAULT_PITCH_WEIGHT
};

export async function getEventSettings(eventId: string | null): Promise<EventSettings> {
  if (!eventId || !hasSupabaseEnv()) return DEFAULT_EVENT_SETTINGS;
  const supabase = await createClient();
  if (!supabase) return DEFAULT_EVENT_SETTINGS;

  const { data, error } = await supabase
    .from("event_settings")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error || !data) return DEFAULT_EVENT_SETTINGS;
  // Map with fallback to defaults for each field (pre-migration tolerance)
  return { ...DEFAULT_EVENT_SETTINGS, ...mapSettings(data as EventSettingsRow) };
}
```

---

### `lib/results.ts` (modify — dynamic criteria + retro-compat)

**Self-analog** — exact source: `lib/results.ts`

**Current retro-compat 4/5-criteria pattern** (lib/results.ts:71-78, 286-294):
```typescript
type PitchScoreLite = {
  player_id: string;
  total_score: number | string;
  // c5 selected solely to detect legacy 4-crit vs 5-crit
  c5: number | string;
};

// In aggregate loop (lib/results.ts:288-293):
const totalRaw = typeof r.total_score === "string" ? Number(r.total_score) : r.total_score;
const c5Raw    = typeof r.c5 === "string" ? Number(r.c5) : r.c5;
if (Number.isNaN(totalRaw)) continue;
const normalized = c5Raw > 0 ? totalRaw : totalRaw * 1.25;
```

**Phase 16 extended type** — read `scores` jsonb if present, else fall back to legacy `total_score`:
```typescript
type PitchScoreLite = {
  player_id: string;
  total_score: number | string;  // KEEP — legacy path
  c5: number | string;            // KEEP — 4-vs-5 criteria discriminant
  scores: Record<string, number> | null;  // NEW: dynamic jsonb path
};

// Extended normalization logic in aggregate loop:
function normalizePitchScore(r: PitchScoreLite, criteria: PitchCriterion[]): number {
  // Dynamic path: scores jsonb present -> sum values, normalize to /100
  if (r.scores && Object.keys(r.scores).length > 0) {
    const maxTotal = criteria.reduce((acc, c) => acc + c.max, 0);
    const rawSum = Object.values(r.scores).reduce((a, b) => a + (b ?? 0), 0);
    return maxTotal > 0 ? (rawSum / maxTotal) * 100 : 0;
  }
  // Legacy path: c1..c5 columns
  const totalRaw = typeof r.total_score === "string" ? Number(r.total_score) : r.total_score;
  const c5Raw    = typeof r.c5 === "string" ? Number(r.c5) : r.c5;
  if (Number.isNaN(totalRaw)) return 0;
  return c5Raw > 0 ? totalRaw : totalRaw * 1.25;  // 4-crit retro-compat
}
```

**DEFAULT_PITCH_WEIGHT usage** (lib/results.ts:33, 84-88):
```typescript
export const DEFAULT_PITCH_WEIGHT = 0.8;  // KEEP as compile-time default

function clampWeight(w: number | undefined): number {
  if (typeof w !== "number" || Number.isNaN(w)) return DEFAULT_PITCH_WEIGHT;
  if (w < 0) return 0;
  if (w > 1) return 1;
  return w;
}
// Phase 16: computeRanking() opts will accept pitchWeight from event_settings
// (passed by the caller app/results/page.tsx after fetching getEventSettings())
```

**SELECT query extension** — add `scores` to fetchPitchScores (lib/results.ts:251-254):
```typescript
async function fetchPitchScores(client: NonNullable<typeof rlsClient>) {
  return client
    .from("pitch_scores")
    .select("player_id, total_score, c5, scores")  // ADD scores
    .eq("event_id", eventId);
}
```

---

### `lib/score.ts` (modify — parameterized engagement thresholds)

**Self-analog** — exact source: `lib/score.ts:72-74`

**Current hardcoded constants** (lib/score.ts:72-74):
```typescript
const SUBMITTED_POINTS = 100;
const REVIEWED_POINTS  = 25;
const VALIDATED_POINTS = 50;
```

**Phase 16 parameterized pattern** — keep constants as module-level defaults; `sumPlayerScoreEngagement` accepts optional override:
```typescript
export const DEFAULT_SUBMITTED_POINTS = 100;
export const DEFAULT_REVIEWED_POINTS  = 25;
export const DEFAULT_VALIDATED_POINTS = 50;

// sumPlayerScoreEngagement signature extended (backwards-compatible):
export function sumPlayerScoreEngagement(
  submissions: Submission[],
  evaluations: Evaluation[],
  opts?: { submittedPoints?: number; reviewedPoints?: number; validatedPoints?: number },
): number {
  const sp = opts?.submittedPoints ?? DEFAULT_SUBMITTED_POINTS;
  const rp = opts?.reviewedPoints  ?? DEFAULT_REVIEWED_POINTS;
  const vp = opts?.validatedPoints ?? DEFAULT_VALIDATED_POINTS;
  ...
}
```

---

### `lib/jury.ts` (modify — dynamic criteria columns)

**Self-analog** — exact source: `lib/jury.ts`

**Current hardcoded PitchScoreRow columns** (lib/jury.ts:119-130):
```typescript
type PitchScoreRow = {
  id: string; event_id: string; player_id: string; juror_id: string;
  c1: number; c2: number; c3: number; c4: number; c5: number;
  total_score: number | string;
  // optional migration columns:
  comment_c1?: ...; comment_c2?: ...; ...; comment_global?: ...;
  is_draft?: boolean | null; verdict?: Verdict | null;
};
```

**Phase 16 extension** — add `scores` to PitchScoreRow and PitchScoreWithComments:
```typescript
type PitchScoreRow = {
  // ... all existing fields unchanged ...
  scores?: Record<string, number> | null;  // NEW: dynamic jsonb
};

export type PitchScoreWithComments = PitchScore & {
  // ... all existing optional fields unchanged ...
  scores?: Record<string, number> | null;  // NEW
};

// In mapPitchScore():
function mapPitchScore(row: PitchScoreRow): PitchScoreWithComments {
  return {
    // ... all existing mappings unchanged ...
    scores: row.scores ?? null,
  };
}
```

**SELECT query extension** (lib/jury.ts:275):
```typescript
const { data: scoreRows, error: scoreErr } = await supabase
  .from("pitch_scores")
  .select("id, event_id, player_id, juror_id, c1, c2, c3, c4, c5, total_score, scores")
  .eq("event_id", eventId)
  .eq("juror_id", user.id);
```

**Aggregate type extension** (lib/jury.ts:64-72):
```typescript
export type JuryAggregate = {
  // ... existing c1Avg..c4Avg, avg100, jurorCount unchanged ...
  // Phase 16: dynamic keyed averages when pitch_criteria present
  criteriaAvg?: Record<string, number>;  // NEW: key -> avg
};
```

---

### `app/actions.ts` — `savePitchScoreFlow` (modify)

**Self-analog** — exact source: `app/actions.ts:1111-1260`

**Current Zod schema** (app/actions.ts:1111-1134):
```typescript
const pitchScoreSchema = z.object({
  playerId: z.string().uuid(),
  eventId: z.string().uuid(),
  c1: z.coerce.number().int().min(0).max(20),
  c2: z.coerce.number().int().min(0).max(20),
  c3: z.coerce.number().int().min(0).max(20),
  c4: z.coerce.number().int().min(0).max(20),
  c5: z.coerce.number().int().min(0).max(20).optional().default(0),
  // ... optional comments, isDraft, verdict ...
});
```

**Phase 16 extension** — add `scoresJson` field parallel to existing c1..c5 (same tolerant pattern as commentC1..C5):
```typescript
const pitchScoreSchema = z.object({
  // ... all existing fields UNCHANGED ...
  // Phase 16: optional dynamic scores jsonb (format: JSON object key->value)
  scoresJson: z.string().optional().nullable(),
});
```

**Upsert payload extension** (app/actions.ts:1205-1232, same tolerant pattern):
```typescript
// Parse scoresJson if present (tolerant: skip if absent or parse fails)
let scoresPayload: Record<string, number> | null = null;
if (parsed.data.scoresJson) {
  try {
    scoresPayload = JSON.parse(parsed.data.scoresJson) as Record<string, number>;
  } catch { /* ignore: legacy path */ }
}

const payload: Record<string, unknown> = {
  event_id: parsed.data.eventId,
  player_id: parsed.data.playerId,
  juror_id: user.id,
  c1: parsed.data.c1,  // KEEP: legacy compat + total_score GENERATED column
  c2: parsed.data.c2,
  c3: parsed.data.c3,
  c4: parsed.data.c4,
  c5: parsed.data.c5,
};
if (scoresPayload) {
  payload.scores = scoresPayload;  // ADD dynamic path
}
// ... rest unchanged: hasComments, is_draft, verdict, upsert pattern ...
```

**Upsert uniqueness** (app/actions.ts:1232):
```typescript
const { error: upsertErr } = await supabase
  .from("pitch_scores")
  .upsert(payload, { onConflict: "event_id,player_id,juror_id" });  // UNCHANGED unique constraint
```

---

### `app/actions.ts` — `saveJuryGridFlow` (new action)

**Analog:** `app/actions.ts:saveDeliverableTemplateFlow` (lines 3157-3265)

**GM-only action pattern** (app/actions.ts:3209-3219):
```typescript
export async function saveJuryGridFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Mode demo — aucune ecriture possible." };
  }
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };

  // Parse criteria JSON from hidden input (same pattern as rubric in saveDeliverableTemplateFlow)
  let rawCriteria: unknown;
  try {
    rawCriteria = JSON.parse(formData.get("criteriaJson") as string ?? "[]");
  } catch {
    return { ok: false, message: "Criteria JSON invalide." };
  }

  const parsed = saveJuryGridSchema.safeParse({ eventId: formData.get("eventId"), criteria: rawCriteria });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifie." };

  // Role gate (defense-in-depth alongside RLS)
  const { data: profileRow, error: profileErr } = await supabase
    .from("profiles").select("app_role").eq("user_id", user.id).maybeSingle();
  if (profileErr) return { ok: false, message: profileErr.message };
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };

  // Delete-then-insert (criteria is a set, not individually updated)
  const { error: delErr } = await supabase
    .from("pitch_criteria")
    .delete()
    .eq("event_id", parsed.data.eventId);
  if (delErr) return { ok: false, message: delErr.message };

  if (parsed.data.criteria.length > 0) {
    const rows = parsed.data.criteria.map((c, i) => ({
      event_id: parsed.data.eventId,
      key: c.key,
      label: c.label,
      max: c.max,
      ord: i,
    }));
    const { error: insertErr } = await supabase.from("pitch_criteria").insert(rows);
    if (insertErr) return { ok: false, message: insertErr.message };
  }

  revalidatePath(`/admin/events`);
  revalidatePath(`/jury`);
  return { ok: true, message: "Grille jury enregistree." };
}
```

**Zod schema** — mirrors rubricSchema shape (lib/schemas.ts):
```typescript
const juryGridCriterionSchema = z.object({
  key:   z.string().min(1),
  label: z.string().min(1),
  max:   z.coerce.number().int().min(1).max(100),
});
const saveJuryGridSchema = z.object({
  eventId:  z.string().uuid(),
  criteria: z.array(juryGridCriterionSchema).min(1).max(10),
});
```

---

### `app/actions.ts` — `saveEventSettingsFlow` (new action)

**Analog:** `app/actions.ts:saveDeliverableTemplateFlow` (lines 3157-3265, GM-only CRUD pattern)

**Schema pattern:**
```typescript
const saveEventSettingsSchema = z.object({
  eventId:           z.string().uuid(),
  xpFirstSubmission: z.coerce.number().int().min(0).max(500),
  xpValidateV1:      z.coerce.number().int().min(0).max(500),
  xpValidateV2:      z.coerce.number().int().min(0).max(500),
  engSubmitted:      z.coerce.number().int().min(0).max(500),
  engReviewed:       z.coerce.number().int().min(0).max(500),
  engValidated:      z.coerce.number().int().min(0).max(500),
  pitchWeight:       z.coerce.number().min(0).max(1),
});
```

**Upsert pattern** (same as events single-row approach, ON CONFLICT on PK):
```typescript
const { error: upsertErr } = await supabase
  .from("event_settings")
  .upsert({ event_id: parsed.data.eventId, ...settingsPayload }, { onConflict: "event_id" });
```

---

### `app/jury/jury-form.tsx` (modify — dynamic criteria)

**Self-analog** — exact source: `app/jury/jury-form.tsx`

**Current hardcoded fields array** (jury-form.tsx:75-86):
```typescript
const fields: ReadonlyArray<{
  key: "c1" | "c2" | "c3" | "c4";
  label: string; help: string; value: number; setter: (n: number) => void;
}> = [
  { key: "c1", label: dict.jury_c1_label, help: dict.jury_c1_help, value: c1, setter: setC1 },
  { key: "c2", label: dict.jury_c2_label, help: dict.jury_c2_help, value: c2, setter: setC2 },
  { key: "c3", label: dict.jury_c3_label, help: dict.jury_c3_help, value: c3, setter: setC3 },
  { key: "c4", label: dict.jury_c4_label, help: dict.jury_c4_help, value: c4, setter: setC4 },
];
```

**Phase 16 dynamic pattern** — `criteria` prop replaces static dict keys; `useState` map replaces 4 individual state vars:
```typescript
// Props extension (backwards-compatible via optional):
type Props = {
  player: Player;
  existing: PitchScoreWithComments | null;
  eventId: string;
  dict: Dict;
  aggregate?: JuryAggregate | null;
  pitchModeState?: PitchModeState;
  criteria?: PitchCriterion[];  // NEW: dynamic from pitch_criteria table
};

// Inside component:
// Fallback to legacy 4-criteria when criteria prop absent (pré-migration):
const activeCriteria = criteria && criteria.length > 0
  ? criteria
  : LEGACY_CRITERIA;  // derived from dict.jury_c1_label..c4_label

// Dynamic scores map instead of c1/c2/c3/c4 state vars:
const [scores, setScores] = useState<Record<string, number>>(
  existing?.scores
    ? existing.scores
    : Object.fromEntries(activeCriteria.map((c) => [c.key, 0]))
);

// Hidden input: legacy c1..c4 for backwards-compat (c5=0 always):
// ALSO send scoresJson for the new dynamic path.
// The server action reads both and uses scoresJson when present.
```

**Legacy path preservation** — always send `c1..c4` hidden inputs from scores map when criteria keys match legacy keys; send `scoresJson` for dynamic path. Server action `savePitchScoreFlow` upserts both.

---

### `components/admin-jury-grid-editor.tsx` (new component, CRUD)

**Analog:** `components/admin-deliverable-template-editor.tsx` — exact structural copy of rubric builder section

**"use client" + useActionState pattern** (admin-deliverable-template-editor.tsx:1-12):
```typescript
"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { saveJuryGridFlow, type WorkflowState } from "@/app/actions";
import { slugifyToKey } from "@/lib/schemas";
import { dictionaries } from "@/lib/i18n";
import type { PitchCriterion } from "@/lib/pitch-criteria";

const t = dictionaries.fr;
const initialState: WorkflowState = { ok: false, message: "" };
```

**Props pattern** (mirrors AdminDeliverableTemplateEditor props):
```typescript
type Props = {
  eventId: string;
  initialCriteria?: PitchCriterion[];
  demo: boolean;
};
```

**Rubric-builder rows pattern** (admin-deliverable-template-editor.tsx:74-125):
```typescript
type CriterionRow = { key: string; label: string; max: number };

// State:
const [criteria, setCriteria] = useState<CriterionRow[]>(
  initialCriteria && initialCriteria.length > 0
    ? initialCriteria.map((c) => ({ key: c.key, label: c.label, max: c.max }))
    : [{ key: "", label: "", max: 20 }],
);

function addCriterion() {
  setCriteria((prev) => [...prev, { key: "", label: "", max: 20 }]);
}
function removeCriterion(idx: number) {
  if (criteria.length <= 1) return;
  setCriteria((prev) => prev.filter((_, i) => i !== idx));
}
function updateCriterion(idx: number, field: "key" | "label" | "max", value: string | number) {
  setCriteria((prev) =>
    prev.map((c, i) => i === idx ? { ...c, [field]: field === "max" ? Number(value) : value } : c)
  );
}

// Serialize for hidden input (same approach as rubricJson):
const criteriaJson = JSON.stringify(
  criteria.map((c) => ({
    key: c.key && c.key.trim() ? c.key.trim() : slugifyToKey(c.label),
    label: c.label,
    max: c.max,
  }))
);
```

**Row render pattern** (admin-deliverable-template-editor.tsx:336-376):
```tsx
{criteria.map((criterion, idx) => (
  <div key={idx} className="admin-form-grid" style={{ gap: 8, marginBottom: 8, minHeight: 40 }}>
    <div style={{ flex: 1 }}>
      <input className="input" value={criterion.key}
        onChange={(e) => updateCriterion(idx, "key", e.target.value)}
        placeholder="ex: innovation" aria-label={`Cle du critere ${idx + 1}`} />
    </div>
    <div style={{ flex: 3 }}>
      <input className="input" value={criterion.label}
        onChange={(e) => updateCriterion(idx, "label", e.target.value)}
        placeholder="Ex: Innovation" aria-label={`Libelle du critere ${idx + 1}`} />
    </div>
    <div style={{ flex: 1 }}>
      <input type="number" className="input" value={criterion.max}
        onChange={(e) => updateCriterion(idx, "max", e.target.value)}
        min={1} max={100} aria-label={`Max du critere ${idx + 1}`} />
    </div>
    <div>
      <button type="button" className="button icon" aria-label="Supprimer le critere"
        onClick={() => removeCriterion(idx)}
        disabled={criteria.length <= 1} style={{ opacity: criteria.length <= 1 ? 0.4 : 1 }}>
        <Trash2 size={14} aria-hidden />
      </button>
    </div>
  </div>
))}
```

**Demo read-only guard pattern** (app/admin/events/[id]/missions/page.tsx:100-112):
```tsx
{!hasSupabaseEnv() && (
  <div className="wf-pill is-amber" style={{ padding: "10px 14px", fontSize: 12, marginBottom: 16, display: "inline-flex" }}>
    {t.admin_engine_demo_disabled}
  </div>
)}
<AdminJuryGridEditor eventId={eventId} initialCriteria={criteria} demo={!hasSupabaseEnv()} />
```

**Status/error message pattern** (admin-deliverable-template-editor.tsx:419-427):
```tsx
{state.message ? (
  <p className={state.ok ? "form-status" : "form-error"} role="status" style={{ marginTop: 10 }}>
    {state.ok ? "Grille enregistree." : state.message}
  </p>
) : null}
```

---

### `components/admin-event-settings-editor.tsx` (new component, CRUD)

**Analog:** `components/admin-missions-editor.tsx` (MissionCard edit form section lines 168-250)

**"use client" + useActionState + form pattern** (admin-missions-editor.tsx:49-58):
```typescript
"use client";

import { useActionState } from "react";
import { saveEventSettingsFlow, type WorkflowState } from "@/app/actions";
import { dictionaries } from "@/lib/i18n";
import type { EventSettings } from "@/lib/event-settings";

const t = dictionaries.fr;
const initialState: WorkflowState = { ok: false, message: "" };
```

**Numeric input pattern** (admin-missions-editor.tsx:232-244):
```tsx
<div>
  <label htmlFor="xp-first-submission" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
    XP premiere soumission (défaut 100)
  </label>
  <input
    id="xp-first-submission"
    name="xpFirstSubmission"
    type="number"
    className="input"
    defaultValue={settings.xpFirstSubmission}
    min={0}
    max={500}
    required
  />
</div>
```

---

## Shared Patterns

### GM Role Gate (defense-in-depth)
**Source:** `app/actions.ts` lines 3212-3219 (`saveDeliverableTemplateFlow`)
**Apply to:** `saveJuryGridFlow`, `saveEventSettingsFlow`
```typescript
const { data: profileRow, error: profileErr } = await supabase
  .from("profiles")
  .select("app_role")
  .eq("user_id", user.id)
  .maybeSingle();
if (profileErr) return { ok: false, message: profileErr.message };
const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
if (role !== "game_master") return { ok: false, message: "Acces reserve au GameMaster." };
```

### Demo-mode guard (WorkflowState)
**Source:** `app/actions.ts` lines 3161-3163
**Apply to:** All new Flow actions
```typescript
if (!hasSupabaseEnv()) {
  return { ok: false, message: "Mode demo — aucune ecriture possible." };
}
```

### Dual-mode data accessor (read)
**Source:** `lib/active-event.ts` lines 65-81
**Apply to:** `lib/pitch-criteria.ts`, `lib/event-settings.ts`
```typescript
if (!hasSupabaseEnv()) return DEMO_CONSTANT;
const supabase = await createClient();
if (!supabase) return DEMO_CONSTANT;
// ... query ... if (error || !data) return DEMO_CONSTANT;
```

### JSON hidden input → Zod parse → action (rubric/criteria builder)
**Source:** `app/actions.ts` lines 3169-3181, `components/admin-deliverable-template-editor.tsx` lines 118-128
**Apply to:** `saveJuryGridFlow`, `AdminJuryGridEditor`
```typescript
// In action: parse JSON from hidden input
let rawCriteria: unknown;
try { rawCriteria = JSON.parse(formData.get("criteriaJson") as string ?? "[]"); }
catch { return { ok: false, message: "Criteria JSON invalide." }; }

// In component: serialize state to hidden input
const criteriaJson = JSON.stringify(criteria.map((c) => ({ key: ..., label: ..., max: ... })));
<input type="hidden" name="criteriaJson" value={criteriaJson} />
```

### WorkflowState return shape + useActionState hook
**Source:** `app/actions.ts` lines 38-48, `components/admin-deliverable-template-editor.tsx` lines 68-71
**Apply to:** All new client components
```typescript
// Action: { ok: boolean; message: string; severity?: "ok"|"warn"|"error" }
// Component:
const [state, formAction, pending] = useActionState(saveJuryGridFlow, initialState);
```

### SECURITY DEFINER + search_path = public + grants revoke/grant
**Source:** `supabase/migrations/20260517224914_phase14_engagement_trigger.sql` lines 30-35
**Apply to:** All new PL/pgSQL functions in phase 16 migration
```sql
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
-- After CREATE OR REPLACE FUNCTION:
REVOKE EXECUTE ON FUNCTION public.<fn>(...) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.<fn>(...) TO authenticated;
```

### Tolerant pre-migration column access
**Source:** `app/actions.ts` lines 1198-1204, `lib/jury.ts` lines 287-318
**Apply to:** Any new column access in `savePitchScoreFlow`, `getJuryOverview`
```typescript
// Pattern: only include new columns in payload if they produce a meaningful value.
// On upsert error mentioning new column name -> retry without that column.
const { error: upsertErr } = await supabase.from("pitch_scores").upsert(payload, { onConflict: "..." });
if (upsertErr) {
  const msg = upsertErr.message ?? "";
  if (msg.includes("scores") || msg.includes("column")) {
    delete payload.scores;
    const { error: retryErr } = await supabase.from("pitch_scores").upsert(payload, { onConflict: "..." });
    if (retryErr) return { ok: false, message: retryErr.message };
  } else {
    return { ok: false, message: upsertErr.message };
  }
}
```

### revalidatePath after GM writes
**Source:** `app/actions.ts` lines 3261-3264
**Apply to:** `saveJuryGridFlow`, `saveEventSettingsFlow`
```typescript
revalidatePath(`/admin/events`);
revalidatePath(`/jury`);
revalidatePath(`/results`);
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `supabase/migrations/2026XXXX_phase16_triggers_parameterized.sql` — `get_event_setting_int` | utility SQL | request-response | No parameterized trigger helper SQL exists yet; pattern assembled from PL/pgSQL conventions observed in phase14+15 migrations |

---

## Critical Pitfalls (Planner Notes)

1. **`total_score` GENERATED column is immutable** — `pitch_scores.total_score smallint generated always as (c1+c2+c3+c4+c5) stored` (schema.sql:215). Phase 16 must NEVER attempt to INSERT/UPDATE `total_score` directly. The `scores` jsonb column is a separate nullable column; effective pitch total is computed in TS (`lib/results.ts`), not via the generated column.

2. **Unique constraint preserved** — `onConflict: "event_id,player_id,juror_id"` (app/actions.ts:1232). The new `scores` column does NOT change this constraint.

3. **Archive retro-compat is cardinal** — lib/results.ts `normalizePitchScore` must retain the `c5Raw > 0 ? totalRaw : totalRaw * 1.25` branch (lines 288-293) for AgreenTech + Digi archived rows that have no `scores` column value.

4. **rubric `{key, label, max}` shape mirrors pitch_criteria** — keep naming consistent. `evaluations.scores` uses `key` from `rubric`; `pitch_scores.scores` uses `key` from `pitch_criteria`. Both are jsonb `{key: number}` maps.

5. **R1 CARDINAL** — `lib/score.ts` and `lib/results.ts` changes must pass the R1 grep audit before commit: `grep -rn "score\|rank\|note\|/100\|/140\|points\|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx" | grep -v "app/journey/deliverable/" | grep -v "components/deliverable-score-block"`.

6. **Demo mode jury form** — when `!hasSupabaseEnv()`, `/jury` renders `t.jury_demo_disabled` (app/jury/page.tsx:181). No data fetches are called. The dynamic criteria form must preserve this early-exit path.

---

## Metadata

**Analog search scope:** `app/actions.ts`, `app/jury/`, `components/admin-*`, `lib/results.ts`, `lib/jury.ts`, `lib/score.ts`, `lib/active-event.ts`, `lib/seed/`, `database/triggers.sql`, `database/schema.sql`, `supabase/migrations/20260517224914*`, `supabase/migrations/20260611230000*`, `supabase/migrations/20260611220000*`
**Files scanned:** 18
**Pattern extraction date:** 2026-06-11
