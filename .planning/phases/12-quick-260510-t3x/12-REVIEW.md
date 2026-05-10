---
phase: 12-quick-260510-t3x
reviewed: 2026-05-10T22:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - app/actions.ts
  - app/api/export/moscow/[deliverableId].csv/route.ts
  - app/journey/bonus/[type]/page.tsx
  - app/journey/deliverable/[id]/moscow-snapshot/page.tsx
  - app/journey/deliverable/[id]/page.tsx
  - app/journey/page.tsx
  - app/mentor/bonus/[id]/page.tsx
  - components/bonus-claim-form.tsx
  - components/bonus-status-badge.tsx
  - components/mentor-bonus-review-form.tsx
  - components/moscow-card.tsx
  - components/moscow-kanban.tsx
  - database/bonus_events.sql
  - database/moscow_cards.sql
  - database/seed_event_hackdays.sql
  - lib/bonus.ts
  - lib/i18n.ts
  - lib/moscow.ts
  - lib/score.ts
  - lib/types.ts
  - package.json
  - supabase/migrations/20260510160000_seed_event_hackdays_agritech.sql
  - supabase/migrations/20260510170000_bonus_events_recreate.sql
  - supabase/migrations/20260510170100_moscow_cards.sql
findings:
  critical: 1
  warning: 6
  info: 5
  total: 12
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-05-10T22:00:00Z
**Depth:** standard
**Files Reviewed:** 23 (T3X Phase 12 — bonus_events + MoSCoW Kanban + snapshot + CSV export)
**Status:** issues_found

## Summary

T3X Phase 12 introduces three new feature surfaces:
1. **Bonus events** — Player claim form + Mentor review + DB-backed multiplier mechanism (R1-aware).
2. **MoSCoW Kanban** — Native DnD board (@dnd-kit) with CRUD + reorder + submit-as-deliverable.
3. **Snapshot + CSV export** — Public snapshot URL consumed as proof_url; GM-gated CSV export.

Overall the implementation respects R1 (no numeric score/multiplier rendered Player-side — `BonusStatusBadge` is strictly qualitative, snapshot page renders only feature/pourquoi/contrainte), R2 (Zod safeParse + warn-only validators with no thrown errors), and R3 (no DOM-level blocking, no `disabled` cross-mission, recommendations surfaced as warn-suffix). DB DDL + RLS policies look solid (CHECK constraints on multiplier_factor, defense-in-depth with `is_my_player` / `is_mentor`).

**However**, one CRITICAL bug exists in `lib/score.ts:applyBonusMultiplier` that allows a single validated `next_deliverable` bonus to be applied to multiple submissions (multiplier never marked consumed in DB). Combined with 6 warnings — hardcoded prod URL in snapshot path, missing application-level state guard on bonus review, N+1 reorder loop without transaction, and missing defense-in-depth role gate on the snapshot page — these together represent measurable pilot risk for the 13/05 cutoff.

The critical issue is a **fairness bug** for the Hack-Days scoring: not a data-loss/crash, but an unintended multiplier-stack that the partners may notice. Recommend fixing before pilot start.

## Critical Issues

### CR-01: `applyBonusMultiplier` never marks bonus as consumed — multiplier can apply to multiple submissions

**File:** `lib/score.ts:78-113`
**Issue:** `applyBonusMultiplier` filters for bonuses with `multiplierConsumedAt === null` and `multiplierScope === "next_deliverable"`, picks a winner, returns the boosted score and `applied: winner.id` — but **never UPDATEs** the bonus row to set `multiplier_consumed_at`. The DB column exists (`bonus_events.multiplier_consumed_at timestamptz`, idx `bonus_events_validated_active_idx WHERE ... multiplier_consumed_at IS NULL`), the type field exists in `BonusEvent`, and the filter clause is wired to consume it — but no code path writes it. Net effect: a single validated `bonus_verbatims_terrain` (1.5x) applies to **every subsequent validated submission for the rest of the event**, identical to the `rest_of_event` scope. This breaks the documented D-03 semantics and is a scoring-fairness bug that partners (Tamwilcom / Bank of Africa / Innov Invest / Bluespace) may notice if they audit the formula. R1 is preserved (still not Player-visible), but mentor/GM scoreboards drift.

**Fix:** After applying the multiplier, persist the consumption. Either:

```typescript
// Option A — caller responsibility (preferred for pure function)
// In the caller (likely lib/score.ts or DB trigger):
const { boostedScore, applied } = applyBonusMultiplier({ ... });
if (applied) {
  await supabase
    .from("bonus_events")
    .update({ multiplier_consumed_at: new Date().toISOString() })
    .eq("id", applied)
    .is("multiplier_consumed_at", null); // conditional, race-safe
}
```

Or — preferred for T-3 hardening — move consumption to the DB-side `trg_evaluation_recalc` trigger that already runs on `evaluations` insert, so consumption is atomic with score recompute. Document in `database/triggers.sql` and add a follow-up plan if not feasible by 13/05 04:00.

Note: this is the **only place** the `multiplier_consumed_at` column gets observed but never written; `bonus_events_validated_active_idx` is currently a partial index that always matches every validated row.

## Warnings

### WR-01: `reviewBonusEventFlow` has no application-level guard against re-reviewing

**File:** `app/actions.ts:1427-1482`
**Issue:** The schema allows `decision ∈ {validated, rejected}` and the action does `UPDATE bonus_events SET status, reviewed_by, reviewed_at, feedback WHERE id = X`, with no filter on the current status. A mentor could call this twice (e.g., first `rejected` then `validated`) and silently overwrite the prior decision. The DB CHECK constraint passes both times because `reviewed_by`/`reviewed_at` are non-null after the first review. RLS policy `bonus_events_mentor_update` permits any mentor to update any row — there is no audit log. For pilot, this allows accidental double-clicking or two mentors stepping on each other.
**Fix:** Add `.eq("status", "submitted")` to the UPDATE and detect zero-row update:

```typescript
const { data: updRows, error: updErr } = await supabase
  .from("bonus_events")
  .update({ ... })
  .eq("id", parsed.data.bonusEventId)
  .eq("status", "submitted")
  .select("id");
if (updErr) return { ok: false, message: updErr.message };
if (!updRows || updRows.length === 0) {
  return { ok: false, message: "Bonus deja review ou inexistant." };
}
```

### WR-02: Hardcoded production URL in `submitMoscowDeliverableFlow` snapshot link

**File:** `app/actions.ts:1722`
**Issue:** `const snapshotUrl = \`https://entrepreneur-game-six.vercel.app/journey/deliverable/${...}/moscow-snapshot?p=${playerId}\`;` hardcodes the prod hostname. If a Player submits from a preview deployment (e.g., Vercel preview branch during a last-minute hotfix), the snapshot URL still points to prod where the row may not yet exist, breaking the mentor's "Voir la preuve" link. Also breaks any future hostname change.
**Fix:** Use the request origin or an env var:

```typescript
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://entrepreneur-game-six.vercel.app";
const snapshotUrl = `${baseUrl}/journey/deliverable/${parsed.data.deliverableTemplateId}/moscow-snapshot?p=${playerId}`;
```

Set `NEXT_PUBLIC_SITE_URL` in Vercel env for prod + preview. Falling back to the literal preserves current behavior if env is unset.

### WR-03: MoSCoW reorder is N+1 sequential UPDATEs with no transaction

**File:** `app/actions.ts:1665-1671`
**Issue:** `reorderMoscowCardsFlow` loops through up to 200 items and issues one `supabase.from("moscow_cards").update(...).eq("id", ...)` per item. If the 5th update fails (RLS denial, network hiccup), the first 4 are committed and the Kanban is in a half-reordered state. The function returns `{ ok: false, message }` but provides no rollback. During the 13-14 May pilot with ~15 teams reordering simultaneously, this is a realistic data-consistency risk.
**Fix (minimal, T-3 safe):** Wrap in a Postgres RPC that takes a JSON array and updates atomically. Out-of-scope for T-3 if not already designed — at minimum, document the risk in `database/moscow_cards.sql` and consider catching partial-commit by re-fetching state on error in the client (which `MoscowKanban` already does via `router.refresh()`). No code change required if accepted as known limitation, but should be tracked.

### WR-04: `moscow-snapshot/page.tsx` missing defense-in-depth auth/role gate

**File:** `app/journey/deliverable/[id]/moscow-snapshot/page.tsx:21-48`
**Issue:** The snapshot page reads `params.id` (deliverable) and `searchParams.p` (playerId) and calls `getMoscowCardsForPlayerDeliverable(playerId, deliverableTemplateId)` without ever calling `getCurrentUser()` or `getCurrentRole()`. Defense relies entirely on (a) middleware redirecting unauthenticated requests to `/login` and (b) RLS policy `moscow_cards_select using (is_my_player(project_id) or is_mentor())`. Both are correct, but the pattern violates the codebase convention of double-gating (every other Player-facing page in `app/journey/**` checks `getCurrentUser` + `getCurrentRole`). If RLS is ever relaxed (intentional or accidental during pilot ops), an authenticated player could read another team's MoSCoW cards by guessing the playerId UUID. The page also returns `notFound()` only if `playerId` is absent; if `playerId` is wrong, it silently renders empty buckets (which is fine but ungrokkable for the mentor).
**Fix:** Add the standard guard pattern matching `app/journey/deliverable/[id]/page.tsx`:

```typescript
const user = await getCurrentUser();
if (!user) redirect("/login");
const role = await getCurrentRole();
if (role && role !== "player" && role !== "mentor" && role !== "game_master") {
  redirect(pathForRole(role));
}
```

Demo-mode short-circuit (return empty buckets) is fine — but `getCurrentUser` must be after the `hasSupabaseEnv()` check to preserve dual-mode.

### WR-05: `MoscowKanban` warn-detection couples on French substring

**File:** `components/moscow-kanban.tsx:226`
**Issue:** `const isWarnMessage = submitMessage.toLowerCase().includes("recommandation");` infers warn vs success styling from the server message text. Any future copy change to `submitMoscowDeliverableFlow`'s warn suffix (e.g., translating, rewording, or moving to i18n keys) silently flips the badge color. Brittle coupling between two files that change independently.
**Fix:** Extend `WorkflowState` with an optional severity flag:

```typescript
export type WorkflowState = { ok: boolean; message: string; severity?: "ok" | "warn" | "error" };
```

Then in `submitMoscowDeliverableFlow` set `severity: warns.length > 0 ? "warn" : "ok"`, and the client checks `state.severity === "warn"`. Backwards-compatible (existing callers ignore the new field).

### WR-06: `MoscowKanban` uses `window.prompt` / `window.confirm` for create/edit/delete

**File:** `components/moscow-kanban.tsx:165, 196-199, 110` (also `components/moscow-card.tsx:110`)
**Issue:** `window.prompt`/`window.confirm` are blocked in iframes, may be disabled in some browsers (Firefox prompts after repeated dialogs), break keyboard navigation, are not styleable, fail accessibility audits, and screenshot poorly in partner demos. Pilot has 6-15 teams with mixed devices (mobiles possible). Editing a card needs **three sequential prompts** (feature → pourquoi → contrainte) — UX is fragile. Comment in code says "Dialog custom out of scope T-3" but flagging for pilot risk.
**Fix:** Pre-pilot — accept as known limitation, ensure mentors can demo a working scenario on Chrome desktop. Post-pilot v0.3 — replace with an inline form or a modal (Radix Dialog / custom). Not blocking but document in `deferred-items.md`.

## Info

### IN-01: `bonus-status-badge.tsx` validates R1 strictly — good

**File:** `components/bonus-status-badge.tsx:1-64`
**Issue:** Excellent R1 compliance — qualitative labels only, multiplier_factor never rendered, prop signature `consumedAt` is the only numeric-adjacent input and is converted to a French qualifier. No action needed; calling out as a positive pattern other files should follow.
**Fix:** None — keep as canonical example of R1-safe Player-facing badge.

### IN-02: i18n inconsistent diacritics in newer keys

**File:** `lib/i18n.ts` (multiple lines, e.g. `bonus_status_rejected: "Bonus rejete"` line 719)
**Issue:** Newer T3X keys (`bonus_*`, `moscow_*`) use plain ASCII French (`rejete`, `cree`, `revision`) while older keys mix proper accents (`Préfére`, `révision`, `équipe`). Inconsistent visual quality in the UI but not a bug. Convention per CLAUDE.md is ASCII-pure in code-resident strings — newer keys actually follow the rule more strictly. Older keys are the violators.
**Fix:** Either align newer keys to add diacritics (now safe since values are React-rendered, not mailto/CSV), or leave as-is. Low priority; accept as visual inconsistency for pilot.

### IN-03: Defense-in-depth cap on `BONUS_MULTIPLIER_CAP` is dead code today

**File:** `app/actions.ts:1399` + `lib/types.ts:213-232`
**Issue:** `Math.min(defaults.multiplierFactor, BONUS_MULTIPLIER_CAP)` where defaults are 1.5/1.5/2.0 and cap is 3.0 — `Math.min` always returns the default. Not a bug; the cap is defense for future per-claim overrides. Kept as documented intent.
**Fix:** None.

### IN-04: `MoscowKanban` drag handle has `role="button"` + `tabIndex=0` but no `onKeyDown` handler

**File:** `components/moscow-card.tsx:60-74`
**Issue:** The hamburger drag handle exposes `role="button"` and `tabIndex={0}` for a11y but the actual keyboard drag is delegated to `useSortable` → `KeyboardSensor` (which uses Space to grab and arrows to move). The `role="button"` on the inner div may confuse screen readers because there's no `onClick` either — it's a pure drag affordance. Minor a11y signal noise.
**Fix:** Either remove `role="button"` (let dnd-kit's KeyboardSensor handle the announcement) or add `aria-roledescription="draggable card"`. Low priority.

### IN-05: `app/journey/page.tsx` hardcodes bonus type list separately from `BONUS_DEFAULTS`

**File:** `app/journey/page.tsx:118-122` + `app/journey/bonus/[type]/page.tsx:19-23`
**Issue:** Two separate arrays of `BonusType` values (`bonusEntries` and `VALID_BONUS_TYPES`) replicate the same enum from `lib/types.ts:BONUS_DEFAULTS`. Adding a 4th bonus type tomorrow requires editing three places. Pre-existing pattern in the codebase (whitelist over-iteration) but flag for awareness.
**Fix:** Derive once: `const VALID_BONUS_TYPES = Object.keys(BONUS_DEFAULTS) as BonusType[];` Optional, low priority.

---

_Reviewed: 2026-05-10T22:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
