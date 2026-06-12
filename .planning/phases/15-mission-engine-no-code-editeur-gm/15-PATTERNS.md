# Phase 15: Mission Engine no-code (éditeur GM) - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 18 new/modified files
**Analogs found:** 17 / 18

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/admin/events/page.tsx` | page (server) | request-response | `app/admin/deliverables/page.tsx` | exact |
| `app/admin/events/[id]/missions/page.tsx` | page (server) | request-response | `app/admin/deliverables/page.tsx` | role-match |
| `app/admin/levels/page.tsx` | page (server) | request-response | `app/admin/deliverables/page.tsx` | role-match |
| `components/admin-events-table.tsx` | component (client) | request-response | `components/admin-deliverables-table.tsx` | exact |
| `components/admin-missions-editor.tsx` | component (client) | CRUD | `components/admin-deliverables-table.tsx` | role-match |
| `components/admin-deliverable-template-editor.tsx` | component (client) | CRUD | `components/admin-deliverables-table.tsx` | role-match |
| `components/admin-levels-editor.tsx` | component (client) | CRUD | `components/admin-deliverables-table.tsx` | role-match |
| `app/actions.ts` (mutations added) | service | CRUD | `app/actions.ts` lines 1391-1447 | exact |
| `lib/template-links.ts` (retired/replaced) | utility | transform | `lib/template-links.ts` (consumer sites) | exact |
| `lib/active-event.ts` (consumed) | utility | request-response | `lib/active-event.ts` | exact |
| `lib/levels.ts` (extended) | utility | CRUD | `lib/levels.ts` | exact |
| `lib/get-simulated-now.ts` (new) | utility | request-response | `lib/hack-status.ts` | partial |
| `supabase/migrations/2026XXXX_phase15_engine_columns.sql` | migration | CRUD | `supabase/migrations/20260611120200_levels_data_driven.sql` | exact |
| `lib/seed/deliverableTemplates.ts` (new columns defaults) | config | transform | `lib/seed/deliverableTemplates.ts` | exact |
| `lib/i18n.ts` (new keys) | config | transform | `lib/i18n.ts` | exact |
| Player-side `app/journey/deliverable/[id]/page.tsx` (soft_recommends_before hint) | page | request-response | `components/journey-drawer.tsx` lines 146-153 | exact |
| `app/journey/deliverable/[id]/page.tsx` (de-hardcode MOSCOW_DELIVERABLE_SLUG) | page | request-response | `app/journey/deliverable/[id]/page.tsx` line 60 | exact |
| `app/actions.ts` (de-hardcode fiches-entretien + HARD_BLOCK) | service | CRUD | `app/actions.ts` lines 195-372 | exact |

---

## Pattern Assignments

### `app/admin/events/page.tsx` — Event list/create page (server component)

**Analog:** `app/admin/deliverables/page.tsx`

**Imports pattern** (`app/admin/deliverables/page.tsx` lines 1-10):
```typescript
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AdminDeliverablesTable } from "@/components/admin-deliverables-table";
import { getAdminDeliverables } from "@/lib/admin-deliverables";
import { getCurrentRole, getCurrentUser, pathForRole } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase-status";
```

**Auth/role gate pattern** (`app/admin/deliverables/page.tsx` lines 12-21):
```typescript
export default async function AdminDeliverablesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getCurrentRole();
  if (role && role !== "game_master") {
    redirect(pathForRole(role));
  }

  const rows = hasSupabaseEnv() ? await getAdminDeliverables() : [];
```

**AppShell + demo mode pattern** (`app/admin/deliverables/page.tsx` lines 22-53):
```typescript
return (
  <AppShell role="game_master" variant="staff">
    <main className="eic-admin-deliverables">
      <header ...>
        ...
      </header>
      {!hasSupabaseEnv() ? (
        <p className="...">{t.admin_deliverables_demo_disabled}</p>
      ) : (
        <AdminDeliverablesTable rows={rows} />
      )}
    </main>
  </AppShell>
);
```

**Topbar pattern** (`app/admin/page.tsx` lines 141-175):
```tsx
<header
  className="wf-row"
  style={{
    padding: "18px 28px",
    gap: 14,
    borderBottom: "1px solid var(--wf-line)",
    background: "var(--wf-paper)",
  }}
>
  <div className="wf-brand">
    <div className="wf-brand-mark">E</div>
    <div className="wf-stack" style={{ gap: 2 }}>
      <div className="wf-brand-name">{t.admin_title}</div>
      <div className="wf-brand-sub">EIC · UEMF · Régie Digi-Hackathon</div>
    </div>
  </div>
  <span className="wf-grow" />
  <div className="wf-row" style={{ gap: 8, flexWrap: "wrap" }}>
    <span className="wf-pill is-blue" style={{ fontSize: 11 }}>...</span>
    <a className="wf-btn is-primary" href="...">...</a>
  </div>
</header>
```

**Demo mode notice** (`app/admin/page.tsx` lines 227-240):
```tsx
{!hasSupabaseEnv() && (
  <div
    className="wf-pill is-amber"
    style={{
      padding: "10px 14px",
      fontSize: 12,
      marginBottom: 16,
      width: "auto",
      display: "inline-flex",
    }}
  >
    {t.admin_demo_disabled}
  </div>
)}
```

---

### `components/admin-events-table.tsx` — Client component for event list + toggle

**Analog:** `components/admin-deliverables-table.tsx`

**"use client" + imports pattern** (lines 1-8):
```typescript
"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { toggleDeliverableActiveFlow, type WorkflowState } from "@/app/actions";
import type { AdminDeliverableRow } from "@/lib/admin-deliverables";
import { dictionaries } from "@/lib/i18n";
```

**useActionState + optimistic state pattern** (lines 44-57):
```typescript
function DeliverableRow({ row }: { row: AdminDeliverableRow }) {
  const [state, formAction, pending] = useActionState(
    toggleDeliverableActiveFlow,
    initialState,
  );
  const [optimistic, setOptimistic] = useState<boolean>(row.isActive);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    setOptimistic(row.isActive);
  }, [row.isActive]);
```

**Toggle form + hidden inputs pattern** (lines 79-107):
```tsx
<form
  action={formAction}
  ref={formRef}
  className="eic-admin-deliverables__toggle-form"
>
  <input name="templateId" type="hidden" value={row.id} />
  <input name="nextActive" type="hidden" value={next ? "true" : "false"} />
  <button
    aria-label={next ? t.admin_deliverable_toggle_on : t.admin_deliverable_toggle_off}
    aria-pressed={optimistic}
    className={optimistic ? "eic-toggle-switch eic-toggle-switch--on" : "eic-toggle-switch"}
    disabled={pending}
    onClick={() => setOptimistic(next)}
    type="submit"
  >
    <span className="eic-toggle-switch__track" aria-hidden="true">
      <span className="eic-toggle-switch__thumb" />
    </span>
    <span className="eic-toggle-switch__label">
      {optimistic ? t.admin_deliverable_active : t.admin_deliverable_inactive}
    </span>
  </button>
</form>
```

**State message display pattern** (lines 108-119):
```tsx
{state.message ? (
  <p
    className={
      state.ok
        ? "eic-admin-deliverables__toggle-msg eic-admin-deliverables__toggle-msg--ok"
        : "eic-admin-deliverables__toggle-msg eic-admin-deliverables__toggle-msg--err"
    }
    role="status"
  >
    {state.message}
  </p>
) : null}
```

---

### `app/actions.ts` — All new GM editor Flow actions

**Analog:** `app/actions.ts` lines 1383-1447 (`toggleDeliverableActiveFlow`)

**Zod schema + Flow action skeleton** (lines 1383-1447):
```typescript
// Schema declaration (co-located before the action)
const toggleDeliverableSchema = z.object({
  templateId: z.string().uuid(),
  nextActive: z.coerce.boolean(),
});

export async function toggleDeliverableActiveFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  // 1. Demo guard
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Backend non configure." };
  }
  // 2. Client creation
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Backend non configure." };
  }
  // 3. Zod parse
  const parsed = toggleDeliverableSchema.safeParse({
    templateId: formData.get("templateId"),
    nextActive: rawNext === "true" || rawNext === "1" || rawNext === "on",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Donnees invalides" };
  }
  // 4. Auth + role gate (defense-in-depth alongside RLS)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { return { ok: false, message: "Non authentifie." }; }
  const { data: profileRow } = await supabase
    .from("profiles").select("app_role").eq("user_id", user.id).maybeSingle();
  const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
  if (role !== "game_master") {
    return { ok: false, message: "Acces reserve au GameMaster." };
  }
  // 5. DB mutation
  const { error: updErr } = await supabase
    .from("deliverable_templates")
    .update({ is_active: parsed.data.nextActive })
    .eq("id", parsed.data.templateId);
  if (updErr) { return { ok: false, message: updErr.message }; }
  // 6. revalidatePath all affected routes
  revalidatePath("/admin/deliverables");
  revalidatePath("/journey");
  // 7. Return WorkflowState
  return { ok: true, message: parsed.data.nextActive ? "Livrable active." : "Livrable masque." };
}
```

**Batch update loop pattern** (used for reorder — lines 1906-1913):
```typescript
// Batch UPDATE via boucle (Supabase JS lib n'a pas de bulk update conditionnel propre)
for (const it of parsed.data.items) {
  const { error: updErr } = await supabase
    .from("moscow_cards")
    .update({ bucket: it.bucket, ord: it.ord })
    .eq("id", it.id);
  if (updErr) return { ok: false, message: updErr.message };
}
```

**Clone pattern** — must copy from `database/seed_event_digi_hackathon.sql` insert pattern with new UUID + slug suffix. No direct TS analog exists (first clone action); use INSERT pattern from lines 56-88 of seed file.

---

### Hardcoded behavior sites (exhaustive inventory for ENGINE-05 de-hardcoding)

#### Site 1: `HARD_BLOCK_DEPENDENCIES` — `app/actions.ts` lines 195-197
```typescript
const HARD_BLOCK_DEPENDENCIES: Record<string, string> = {
  "fiches-entretien-v1": "prep-questions-v1",
};
```
**De-hardcoding plan:** Replace with a DB lookup `deliverable_templates WHERE id = $id SELECT soft_recommends_before_id` — but NOTE: this is the R3 EXCEPTION hard-block (not soft_recommends_before). After ENGINE-05, the `HARD_BLOCK_DEPENDENCIES` literal is retained but only checked when `auto_validate = true` on the template. The general lookup path reads `deliverable_templates.soft_recommends_before` (nullable FK). The literal slug pair stays as-is per R3 locked constraint.

#### Site 2: Auto-validate flow for fiches-entretien — `app/actions.ts` lines 309-372
```typescript
if (templateSlug === "fiches-entretien-v1") {
  // ... 10-URL JSON parse + insert with status='validated' ...
}
```
**De-hardcoding plan:** After ENGINE-05, replace slug check with `tplRow.auto_validate === true`. The `fichesEntretienSchema` multi-URL shape is retained for `auto_validate=true` templates with `composer_kind='multi_url'`. UUID `59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334` lives in SQL trigger `fn_auto_eval_fiches_entretien` (not in TS) — trigger parameterization is a separate migration concern.

#### Site 3: `MOSCOW_DELIVERABLE_SLUG` — `app/journey/deliverable/[id]/page.tsx` line 60
```typescript
const MOSCOW_DELIVERABLE_SLUG = "fiche-produit-plan-dev-v1";
// Used at line 175:
const isMoscowDeliverable = tpl.slug === MOSCOW_DELIVERABLE_SLUG;
```
**De-hardcoding plan:** After ENGINE-05, replace with `tpl.composer_kind === "moscow"` read from the DB column. Remove the literal constant.

#### Site 4: `"fiches-entretien-v1"` literal — `app/journey/deliverable/[id]/page.tsx` line 183
```typescript
const isFichesEntretienDeliverable = tpl.slug === "fiches-entretien-v1";
```
**De-hardcoding plan:** Replace with `tpl.composer_kind === "multi_url"` AND `tpl.auto_validate === true` (both conditions together identify the fiches-entretien behavior). Slug literal removed.

#### Site 5: `getTemplateLink(tpl.slug)` — `app/journey/deliverable/[id]/page.tsx` lines 401-428
```typescript
const link = getTemplateLink(tpl.slug);
// Renders <a href={link.templateUrl}>Ouvrir le template OneDrive</a>
```
**De-hardcoding plan:** Replace `getTemplateLink(tpl.slug)` with `tpl.template_url` from DB column. Remove import of `getTemplateLink` from `@/lib/template-links`. Keep `WELCOME_GUIDE_URL` import in `app/journey/page.tsx` until it too has a data-driven replacement.

#### Site 6: `WELCOME_GUIDE_URL` — `app/journey/page.tsx` line 19
```typescript
import { WELCOME_GUIDE_URL } from "@/lib/template-links";
```
**Scope:** This import is for the global welcome guide link (not per-deliverable). Consider leaving this for Phase 16 or storing as event-level field — out of ENGINE-05 deliverable_templates column scope. Planner should scope this explicitly.

#### Site 7: UUID G01 in trigger `fn_auto_eval_fiches_entretien` — `.planning/quick/260519-smoke-prod-j1/fix_h1_auto_eval_trigger.sql` line 58
```sql
'59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334'::uuid,  -- G01 Omar evaluator
```
The trigger currently checks `v_slug <> 'fiches-entretien-v1'` (line 39 of trigger file). **De-hardcoding plan:** Change the slug check to `NOT EXISTS (SELECT 1 FROM deliverable_templates WHERE id = NEW.deliverable_template_id AND auto_validate = true)` — this means any template with `auto_validate=true` fires the auto-eval. UUID stays as a `SECURITY DEFINER` evaluator parameter stored in a DB config table or left as-is if only one auto-evaluator exists. The Phase 15 migration must update the trigger body.

---

### `app/journey/deliverable/[id]/page.tsx` — soft_recommends_before amber hint

**Analog:** `components/journey-drawer.tsx` lines 146-153

**eic-locked-hint--amber rendering pattern** (journey-drawer.tsx lines 146-153):
```tsx
{state === "locked" && cards.length > 0 ? (
  <p
    className="eic-locked-hint--amber"
    role="note"
    style={{ margin: 0 }}
  >
    {t.journey_v2_locked_hint_amber}
  </p>
) : null}
```

**CSS definition** (`app/globals.css` lines 2059-2068):
```css
.eic-locked-hint--amber {
  background: var(--wf-amber-tint);
  color: var(--wf-amber);
  border: 1px solid #DCC394;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.4;
  font-weight: 500;
}
```

**Application for soft_recommends_before** — New code to add in `app/journey/deliverable/[id]/page.tsx` after fetching template row:
```tsx
{/* soft_recommends_before amber hint — R3 CARDINAL: advisory only, no disabled DOM */}
{tpl.soft_recommends_before && !prerequisiteValidated ? (
  <p className="eic-locked-hint--amber" role="note" style={{ marginBottom: 16 }}>
    <Info size={14} aria-hidden style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
    {t.admin_engine_soft_recommends_hint.replace("[titre]", prerequisiteTitle)}
  </p>
) : null}
```
**NEVER** add `disabled`, `pointer-events: none`, or any form of click-blocking alongside this hint.

---

### `lib/get-simulated-now.ts` — ENGINE-07 date injection

**No direct analog.** Closest pattern is `lib/hack-status.ts` (date-based computations using `Date.now()`).

**Current date usage in `lib/admin.ts` lines 221-228** (what getSimulatedNow replaces):
```typescript
// 6. Compute "elapsed missions" = missions whose scheduled_at <= now (null = future).
const now = Date.now();
let elapsedMissions = 0;
for (const m of missions) {
  if (!m.scheduled_at) continue;
  const t = new Date(m.scheduled_at).getTime();
  if (!Number.isNaN(t) && t <= now) elapsedMissions++;
}
```
**De-hardcoding plan:** Replace `Date.now()` with `getSimulatedNow()` everywhere `scheduled_at` comparisons occur. The helper reads `?simulate_date=YYYY-MM-DD` from the request query string (server) via `headers()` or searchParams, falling back to `Date.now()`. GM-only: only active on `/admin/**` routes.

Call sites to update:
- `lib/admin.ts` line 222 — `const now = Date.now()` → `const now = await getSimulatedNow()`
- `lib/journey.ts` line 216-218 — `.order("scheduled_at", ...)` query (may also need filter injection)

---

### Migration: `supabase/migrations/2026XXXX_phase15_engine_columns.sql`

**Analog:** `supabase/migrations/20260611120200_levels_data_driven.sql`

**Migration file conventions** (phase 14 migration structure):
```sql
-- ============================================================================
-- Phase XX-YY : <description> (<requirement refs>)
-- ============================================================================
-- ADDITIVE ONLY: <list changes>. Zero in-place type changes.
-- Apply after <previous migration file>.
-- Tag de securite : v0.4-pre-phase15
-- ============================================================================

BEGIN;

-- 1. <description>
ALTER TABLE public.deliverable_templates
  ADD COLUMN IF NOT EXISTS composer_kind text NOT NULL DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS template_url text,
  ADD COLUMN IF NOT EXISTS auto_validate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS soft_recommends_before uuid REFERENCES public.deliverable_templates(id),
  ADD COLUMN IF NOT EXISTS validation_rules jsonb NOT NULL DEFAULT '[]'::jsonb;

-- CHECK constraint: validation_rules severity must be 'warn' only (R2 CARDINAL)
ALTER TABLE public.deliverable_templates
  ADD CONSTRAINT validation_rules_severity_warn_only
  CHECK (
    validation_rules = '[]'::jsonb
    OR NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(validation_rules) AS r
      WHERE (r->>'severity') <> 'warn'
    )
  );

-- 2. Backfill current 13 Digi-Hackathon templates
UPDATE public.deliverable_templates dt
SET
  composer_kind = CASE dt.slug
    WHEN 'moscow-v1' THEN 'moscow'
    WHEN 'fiches-entretien-v1' THEN 'multi_url'
    ELSE 'simple'
  END,
  template_url = CASE dt.slug
    WHEN 'persona-v1' THEN '<DESIGN_THINKING_URL>'
    WHEN 'design-thinking-v1' THEN '<DESIGN_THINKING_URL>'
    -- ... (all 13 slugs from lib/template-links.ts)
    ELSE NULL
  END,
  auto_validate = (dt.slug = 'fiches-entretien-v1')
WHERE mission_id IN (
  SELECT m.id FROM public.missions m
  JOIN public.events e ON e.id = m.event_id
  WHERE e.slug = 'hack-days-fes-meknes-mai-2026'
);

COMMIT;

-- ── Rollback ─────────────────────────────────────────────────────────────────
-- ALTER TABLE public.deliverable_templates
--   DROP COLUMN IF EXISTS validation_rules,
--   DROP COLUMN IF EXISTS soft_recommends_before,
--   DROP COLUMN IF EXISTS auto_validate,
--   DROP COLUMN IF EXISTS template_url,
--   DROP COLUMN IF EXISTS composer_kind;
```

---

### `lib/seed/deliverableTemplates.ts` — New columns safe defaults

**Analog:** `lib/seed/deliverableTemplates.ts` current shape (lines 1-40)

**Current DeliverableTemplate seed shape** (lines 9-25):
```typescript
export const demoDeliverableTemplates: DeliverableTemplate[] = [
  {
    id: "00000000-0000-0000-0000-0000000000d1",
    missionId: "00000000-0000-0000-0000-0000000000b1",
    slug: "demo-problem-statement",
    title: "Demo - Enonce du probleme",
    description: "Demo deliverable for the problem mission.",
    rubric: [
      { key: "clarity", label: "Clarte", max: 25 },
      { key: "specificity", label: "Specificite", max: 25 },
    ],
    maxScore: 100,
    ord: 1,
    isBonus: false,
  },
```

**New columns to add with safe defaults:**
```typescript
// Add to every demoDeliverableTemplate entry:
composerKind: "simple",       // default: 'simple' — no special composer
templateUrl: null,            // no OneDrive URL in demo
autoValidate: false,          // default: no auto-validation
softRecommendsBefore: null,   // default: no soft recommendation
validationRules: [],          // default: no validation rules
```
The corresponding `lib/types.ts:DeliverableTemplate` type must add these fields with optional or nullable types.

---

### Clone event server action — ENGINE-03

**No exact TS analog** (first clone action in codebase). Use `database/seed_event_digi_hackathon.sql` as the structural reference.

**Clone INSERT pattern** (`database/seed_event_digi_hackathon.sql` lines 56-88):
```sql
insert into public.events (slug, name, starts_at, ends_at)
values (
  'hack-days-fes-meknes-mai-2026',
  'Digi-Hackathon 4ème édition',
  '2026-05-20 09:00:00+01',
  '2026-05-22 13:00:00+01'
)
on conflict (slug) do update ...;
```

**TS clone action structure** — use `gen_random_uuid()` via Supabase `.insert()`, suffix slugs with `-clone-${Date.now()}`, copy missions in `ord` order, copy deliverable_templates per mission preserving rubric/max_score/ord/is_bonus/composer_kind/template_url/auto_validate/soft_recommends_before (self-referential FK must be re-mapped to new IDs). Pattern:
```typescript
export async function cloneEventFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  if (!hasSupabaseEnv()) return { ok: false, message: "Mode demo — aucune ecriture possible." };
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Backend non configure." };
  // ... role gate (same as toggleDeliverableActiveFlow) ...
  // 1. Fetch source event + missions + templates
  // 2. Insert cloned event (slug suffixed)
  // 3. For each mission: insert with new UUID, map event_id to new event
  // 4. For each template: insert with new UUID, map mission_id to new mission
  //    NOTE: soft_recommends_before must be re-mapped via old→new UUID map
  // 5. revalidatePath("/admin/events")
  // 6. return { ok: true, message: t.admin_engine_clone_success, redirectTo: `/admin/events/${newEventId}/missions` }
}
```

---

### `lib/active-event.ts` — Activate event action anchor

**Analog:** `lib/active-event.ts` lines 65-81 (already built, consumed by Phase 15)

**Pattern to replicate for activate event server action** — when GM activates an event, must deactivate others (single-active invariant). Use two operations:
```typescript
// Step 1: deactivate all events for this org
const { error: deactivateErr } = await supabase
  .from("events")
  .update({ is_active: false })
  .eq("organization_id", orgId);
// Step 2: activate target event
const { error: activateErr } = await supabase
  .from("events")
  .update({ is_active: true })
  .eq("id", parsed.data.eventId);
// Step 3: revalidatePath
revalidatePath("/admin/events");
revalidatePath("/admin");
revalidatePath("/journey");
```

---

### `lib/levels.ts` (LEVELS-04 CRUD extension)

**Analog:** `lib/levels.ts` lines 1-51

**Data access pattern** (lines 26-39):
```typescript
export const getLevels = cache(async function getLevels(): Promise<Level[]> {
  if (!hasSupabaseEnv()) return DEMO_LEVELS;

  const supabase = await createClient();
  if (!supabase) return DEMO_LEVELS;

  const { data, error } = await supabase
    .from("levels_v2")
    .select("id, ord, label, description")
    .order("ord", { ascending: true });

  if (error || !data) return DEMO_LEVELS;
  return data as Level[];
});
```

New CRUD actions for levels follow `toggleDeliverableActiveFlow` skeleton:
- `createLevelFlow` — INSERT into `levels_v2`, revalidatePath("/admin/levels")
- `updateLevelFlow` — UPDATE by id, revalidatePath("/admin/levels")
- `reorderLevelFlow` — batch UPDATE ord (same loop pattern as `reorderMoscowCardsFlow` lines 1906-1913)
- `deleteLevelFlow` — DELETE by id, guard: check 0 missions reference it first

---

## Shared Patterns

### Authentication / GM role gate
**Source:** `app/actions.ts` lines 1412-1431
**Apply to:** All new GM editor server actions

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) { return { ok: false, message: "Non authentifie." }; }
const { data: profileRow } = await supabase
  .from("profiles").select("app_role").eq("user_id", user.id).maybeSingle();
const role = (profileRow as { app_role?: AppRole } | null)?.app_role;
if (role !== "game_master") {
  return { ok: false, message: "Acces reserve au GameMaster." };
}
```

### Demo mode guard (server action)
**Source:** `app/actions.ts` lines 1395-1401
**Apply to:** All new GM editor server actions

```typescript
if (!hasSupabaseEnv()) {
  return { ok: false, message: "Backend non configure." };
}
const supabase = await createClient();
if (!supabase) { return { ok: false, message: "Backend non configure." }; }
```

### Demo mode guard (page/component)
**Source:** `app/admin/deliverables/page.tsx` lines 44-50 and `app/admin/page.tsx` lines 227-240
**Apply to:** All new GM editor page components

```typescript
// Server component: hasSupabaseEnv() guard before data fetch
const rows = hasSupabaseEnv() ? await getData() : [];

// Client component: amber pill banner when demo
{!hasSupabaseEnv() && (
  <div className="wf-pill is-amber" style={{ padding: "10px 14px", fontSize: 12, marginBottom: 16 }}>
    {t.admin_engine_demo_disabled}
  </div>
)}
```

### AppShell GM staff variant
**Source:** `app/admin/deliverables/page.tsx` line 24
**Apply to:** All new `/admin/**` pages

```typescript
<AppShell role="game_master" variant="staff">
```

### Zod httpsUrl validator
**Source:** `app/actions.ts` line 7 — `import { httpsUrl } from "@/lib/schemas";`
**Apply to:** All server actions that accept `template_url` input

```typescript
// In schema definition for deliverable template editor action:
template_url: httpsUrl.nullable().optional(),
```

### revalidatePath pattern for engine routes
**Source:** `app/actions.ts` lines 1441-1442
**Apply to:** All new GM editor mutations — call revalidatePath on all affected surfaces

```typescript
revalidatePath("/admin/events");
revalidatePath("/admin/events/[id]/missions", "page");  // Next.js dynamic route
revalidatePath("/admin/levels");
revalidatePath("/journey");   // Player surfaces when template data changes
```

### WorkflowState return shape
**Source:** `app/actions.ts` lines 33-43

```typescript
export type WorkflowState = {
  ok: boolean;
  message: string;
  severity?: "ok" | "warn" | "error";
  mailto?: string;
};
```
All new actions return `WorkflowState`. Never throw. Failures return `{ ok: false, message }`. Success returns `{ ok: true, message }`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `lib/get-simulated-now.ts` | utility | request-response | No date-injection helper exists; current code hardcodes `Date.now()`. Closest pattern is how `lib/admin.ts` uses `Date.now()` for scheduled_at comparisons (lines 221-228). |
| Clone server action (ENGINE-03) | service | CRUD | No clone/deep-copy action in codebase. Use seed SQL file structure as reference for field mapping. Note: soft_recommends_before self-FK requires old→new UUID remap. |

---

## Critical Pitfalls

### Rubric jsonb shape — mentor eval forms depend on it
**Source:** `database/seed_event_digi_hackathon.sql` lines 168-175 and `lib/seed/deliverableTemplates.ts` lines 17-22

Current rubric shape: `[{ "key": string, "label": string, "max": number }]`

The mentor evaluation form reads rubric criterion keys to populate the score form. **If the rubric jsonb shape changes, mentor eval forms break.** The Phase 15 rubric builder must output the exact same `{ key, label, max }` structure. The `key` field is used as the score map key in `evaluations.scores` jsonb. Auto-generate `key` from `label` (slugified) when not provided by the GM.

### validation_rules vs existing rubric validators
`validation_rules` is a NEW column (not the existing `rubric`). The existing `rubric` array stays unchanged. `validation_rules` is additive: `[{ rule: string, severity: "warn", message: string }]`. The Zod schema for this field must use `z.literal("warn")` for severity (R2 enforcement). The CHECK SQL constraint enforces the same at DB level.

### auto_validate semantics — trigger must generalize
The trigger `fn_auto_eval_fiches_entretien` currently checks `v_slug <> 'fiches-entretien-v1'` (slug literal). After Phase 15, the trigger must check `auto_validate = false` from the `deliverable_templates` table instead of the slug. Migration must include a `CREATE OR REPLACE FUNCTION` to update the trigger body. The G01 UUID `59a2b0f7-fa2c-41dd-b3ee-408b0eaf1334` stays in the trigger as the canonical system evaluator.

### HARD_BLOCK_DEPENDENCIES — R3 exception must NOT become configurable
The literal `HARD_BLOCK_DEPENDENCIES` map in `app/actions.ts` lines 195-197 is preserved as-is. The Phase 15 editor must NEVER expose a UI for hard-block dependencies. The soft_recommends_before FK is the only configurable recommendation mechanism.

### is_active migration timing (pre-migration window)
`lib/active-event.ts` documents that during the pre-migration window `is_active` column may not exist in PROD. New code that reads `deliverable_templates.composer_kind / template_url / auto_validate / soft_recommends_before` must similarly handle the pre-migration case (columns absent → fallback to current slug-based behavior). Use `tplRow?.composer_kind ?? "simple"` defensive reads.

---

## Metadata

**Analog search scope:** `app/admin/`, `app/actions.ts`, `components/admin-*`, `components/journey-*`, `lib/seed/`, `lib/levels.ts`, `lib/active-event.ts`, `lib/template-links.ts`, `lib/journey.ts`, `lib/admin.ts`, `database/schema.sql`, `supabase/migrations/20260611*.sql`, `.planning/quick/260519-smoke-prod-j1/`
**Files scanned:** 24
**Pattern extraction date:** 2026-06-11
