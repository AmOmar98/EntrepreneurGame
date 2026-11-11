---
phase: 15-mission-engine-no-code-editeur-gm
plan: "03"
subsystem: engine-mission-editor
tags: [engine, missions, templates, rubric-builder, crud, ENGINE-01, ENGINE-02, VALID-02, R2, R3]
dependency_graph:
  requires: [15-01, 15-02]
  provides: [admin-missions-page, createMissionFlow, updateMissionFlow, reorderMissionFlow, saveDeliverableTemplateFlow, AdminMissionsEditor, AdminDeliverableTemplateEditor, getEventMissions]
  affects: [app/actions.ts, lib/admin-missions.ts, app/admin/events/[id]/missions/page.tsx, components/admin-missions-editor.tsx, components/admin-deliverable-template-editor.tsx]
tech_stack:
  added: []
  patterns: [useActionState, server-action-flow, dual-mode-demo-guard, gm-role-gate, rubric-key-slugify, warn-only-static-note, soft-recommends-advisory]
key_files:
  created:
    - lib/admin-missions.ts
    - app/admin/events/[id]/missions/page.tsx
    - components/admin-missions-editor.tsx
    - components/admin-deliverable-template-editor.tsx
  modified:
    - app/actions.ts
decisions:
  - "saveDeliverableTemplateFlow included in Task 1 commit (d171f70) since it shares the same file as the mission CRUD actions"
  - "slugifyToKey() normalizes accented chars via NFD decomposition before stripping; mirrors client-side slugifyToKey in template editor"
  - "rubric serialized as [{key,label,max}] — key auto-slugified from label server-side as defense-in-depth even if client sends pre-slugified keys"
  - "validationRules always submitted as [] from editor (no severity field exposed); action parses through z.array(validationRuleSchema) as defense-in-depth"
  - "soft_recommends_before rendered as plain .select with Aucun empty option; no disabled DOM, no pointer-events blocking (R3 CARDINAL)"
  - "Reorder uses single-step ord change per click (no bulk reorder payload); simpler and sufficient for short mission lists"
  - "allTemplates for soft_recommends_before assembled server-side from already-fetched mission data (no extra DB query)"
metrics:
  duration: "7min"
  completed: "2026-06-11"
  tasks: 3
  files: 5
---

# Phase 15 Plan 03: Mission Editor (ENGINE-01/02) Summary

GM-only `/admin/events/[id]/missions` page with mission CRUD (create/edit/deactivate/reorder) and a deliverable-template editor featuring a dynamic rubric builder that emits the exact `{ key, label, max }` shape the mentor eval form depends on.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | getEventMissions accessor + mission CRUD/reorder + saveDeliverableTemplateFlow + i18n | d171f70 | lib/admin-missions.ts, app/actions.ts |
| 2 | saveDeliverableTemplateFlow (rubric {key,label,max} + warn-only validation_rules) | d171f70 | app/actions.ts (included in Task 1) |
| 3 | Missions page + AdminMissionsEditor + AdminDeliverableTemplateEditor | 12c59c1 | app/admin/events/[id]/missions/page.tsx, components/admin-missions-editor.tsx, components/admin-deliverable-template-editor.tsx |

## What Was Built

**lib/admin-missions.ts** (`getEventMissions(eventId: string): Promise<AdminMissionRow[]>`):
- Fetches missions ordered by ord ASC; joins deliverable_templates per mission in a single in-filter query
- `AdminMissionRow` includes nested `templates: AdminTemplateRow[]` for the editor
- Dual-mode safe: returns [] when createClient() returns null
- `AdminTemplateRow` includes composerKind with defensive "simple" fallback

**app/actions.ts** — four new Flow actions:
- `createMissionFlow`: Zod schema with MissionKind enum, GM gate + demo guard; INSERT missions; revalidatePath for event missions page + /journey
- `updateMissionFlow`: adds missionId + isActive; UPDATE by id; same revalidation
- `reorderMissionFlow`: schema { eventId, items: [{id,ord}] }; batch UPDATE loop (same pattern as reorderMoscowCardsFlow); JSON parsed from hidden input
- `saveDeliverableTemplateFlow`: full template create-or-update; rubric normalized to [{key,label,max}] server-side; validationRules parsed through z.array(validationRuleSchema) (defense-in-depth vs severity:'error'); no hard-block field (VALID-02); revalidates /admin/events/[id]/missions + /journey + /mentor

**server-side `slugifyToKey()`**: NFD-normalized label→key (lowercase, hyphenate, max 64 chars). Ensures rubric keys are stable slugs even when the GM doesn't provide explicit keys.

**app/admin/events/[id]/missions/page.tsx** (server component):
- getCurrentUser → redirect("/login"); getCurrentRole → redirect(pathForRole(role)) if non-GM
- hasSupabaseEnv() guard; getLevels() + getEventMissions() only in Supabase mode
- Assembles allTemplates from fetched missions for soft_recommends_before select
- AppShell role="game_master" variant="staff"; breadcrumb Admin > Events > {eventName}; amber demo pill

**components/admin-missions-editor.tsx** ("use client"):
- Mission list as `.mission-card` rows with titre, niveau (`.eic-level-badge`), kind (`.eic-pill--blue`), ord, is_active status
- Up/down reorder via `.button.icon` with lucide ChevronUp/ChevronDown; aria-labels "Monter la mission"/"Descendre la mission"; boundary buttons disabled at 0.4 opacity
- Inline edit form (updateMissionFlow) + nested template section (AdminDeliverableTemplateEditor + AddTemplatePanel)
- Create mission form (createMissionFlow) with titre, niveau, kind, scheduled_date, ord
- Empty state admin_engine_missions_empty; pending → "Enregistrement en cours…"

**components/admin-deliverable-template-editor.tsx** ("use client"):
- Full template form: titre (auto-generates slug), description, slug (editable), composer_kind select, template_url, auto_validate/is_bonus/is_active checkboxes, max_score, ord
- `soft_recommends_before`: plain `.select` listing other event templates with "Aucun" empty option; advisory note; zero disabled DOM (R3 CARDINAL)
- **Rubric builder**: dynamic criterion rows in React local state; each row = label `.input` + max number `.input` (1-100); "Ajouter un critere" button; remove via `.button.icon` lucide Trash2 (aria-label "Supprimer le critere"); min 1 criterion (last row's remove button disabled)
- On submit: serializes criteria as JSON `[{key: slugifyToKey(label), label, max}]` into hidden `rubric` input
- **validation_rules**: always `"[]"` — no severity input field anywhere (R2 CARDINAL); static amber note `admin_engine_validation_warn_only_note` rendered
- useActionState wired to saveDeliverableTemplateFlow; success → admin_engine_template_saved; error displayed in .form-error

## Verification

- `npm run typecheck` — green (0 errors)
- `npm run lint` — green (0 warnings)
- `npm run build` — green; /admin/events/[id]/missions: 5.56 kB
- `npm run test:unit` — 23/23 passed (no regression)
- `npm run test:e2e` — 15/15 passed (new routes, no existing-route change)
- R1 audit: no score/rank/points leak introduced; all new files are /admin GM-only
- R3 audit: no `blocks_progression_to` or hard-block `disabled` in editor; only UI-state `disabled` (pending, boundary, min-criterion)
- VALID-02: no hard-block field in editor; HARD_BLOCK_DEPENDENCIES literal in actions.ts untouched

## Deviations from Plan

**1. [Rule 1 - Bug] saveDeliverableTemplateFlow merged into Task 1 commit**
- **Found during:** Task 2 (no actual deviation — plan allowed this implicitly as both tasks modify app/actions.ts)
- **Decision:** Since both tasks touch app/actions.ts, merging into a single commit for atomicity. Task 2 is recorded as part of Task 1 commit (d171f70).
- **Impact:** None — all acceptance criteria met.

## Known Stubs

None — the editor is wired to real server actions. The form submits to saveDeliverableTemplateFlow which writes to Supabase in production. In demo mode, the actions return a demo guard message (no write). All fields render with real initial values when templateId is provided.

## Threat Flags

No new threat surface beyond what is in the plan's threat model. Mitigations applied:
- T-15-08 (Rubric jsonb shape): server-side `slugifyToKey()` + Zod z.array({key,label,max}).min(1) — both present
- T-15-09 (validation_rules severity=error): z.array(validationRuleSchema) (z.literal "warn") enforced; editor exposes no severity field
- T-15-10 (non-GM mutation): GM role gate on all four actions + RLS *_gm_all defense-in-depth
- T-15-11 (hard-block re-introduced): editor exposes only soft_recommends_before; grep confirms no dependency/hard-block field

## Self-Check: PASSED

Files exist:
- lib/admin-missions.ts — FOUND
- app/admin/events/[id]/missions/page.tsx — FOUND
- components/admin-missions-editor.tsx — FOUND
- components/admin-deliverable-template-editor.tsx — FOUND

Commits exist:
- d171f70 (feat: accessor + actions) — FOUND
- 12c59c1 (feat: page + components) — FOUND
