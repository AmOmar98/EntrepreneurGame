---
phase: 15-mission-engine-no-code-editeur-gm
plan: "02"
subsystem: engine-events-surface
tags: [engine, events, clone, single-active, gm-editor, ENGINE-03, ENGINE-04, TENANT-03]
dependency_graph:
  requires: [15-01]
  provides: [admin-events-page, createEventFlow, activateEventFlow, cloneEventFlow, AdminEventsTable, getAdminEvents]
  affects: [app/admin/events/page.tsx, components/admin-events-table.tsx, lib/admin-events.ts, app/actions.ts, lib/i18n.ts]
tech_stack:
  added: []
  patterns: [useActionState, server-action-flow, dual-mode-demo-guard, gm-role-gate, two-pass-self-fk-remap, single-active-invariant]
key_files:
  created:
    - lib/admin-events.ts
    - app/admin/events/page.tsx
    - components/admin-events-table.tsx
  modified:
    - app/actions.ts
    - lib/i18n.ts
decisions:
  - "activateEventFlow uses two-step UPDATE (deactivate-all-in-org, then activate-target) to honor single-active invariant (TENANT-03); null-org fallback deactivates all events"
  - "cloneEventFlow two-pass insert: pass1 inserts all clones with soft_recommends_before=null; pass2 remaps via old->new UUID map (T-15-05 mitigated — clones never point to originals)"
  - "Clone success message embeds the new event URL as the last token for the client to extract a 'Voir le clone' link without a separate state field"
  - "orgs fetched server-side in the page and passed as props to avoid a client-side fetch on the GM-only create form"
  - "Demo mode: rows=[], orgs=[] in demo; actions return demo guard message; no DOM disabled on any Player surface (all changes are /admin GM-only)"
metrics:
  duration: "6min"
  completed: "2026-06-11"
  tasks: 3
  files: 5
---

# Phase 15 Plan 02: Events Surface Summary

GM-only `/admin/events` page with event list, single-click clone (ENGINE-03), activate toggle with single-active invariant (TENANT-03), and inline event+cohort creation form (ENGINE-04). Zero SQL required for any of these operations.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | getAdminEvents accessor + i18n keys | d32469e | lib/admin-events.ts, lib/i18n.ts |
| 2 | createEventFlow + activateEventFlow + cloneEventFlow | 75bbe49 | app/actions.ts |
| 3 | /admin/events page + AdminEventsTable client component | 8f12262 | app/admin/events/page.tsx, components/admin-events-table.tsx |

## What Was Built

**lib/admin-events.ts** (`getAdminEvents(): Promise<AdminEventRow[]>`):
- Fetches events ordered by starts_at DESC; joins organizations by org ids (single query set); counts missions per event via in-filter
- Dual-mode safe: returns [] when createClient() returns null
- Pre-migration window: is_active null coerced to false

**app/actions.ts** — three new Flow actions:
- `createEventFlow`: Zod schema with slug regex (`/^[a-z0-9-]+$/`); INSERT event (is_active=false) + one cohort row; GM role gate + demo guard; revalidatePath("/admin/events")
- `activateEventFlow`: resolves event's organization_id; UPDATE all org events to is_active=false; then UPDATE target to true; null-org fallback handles pre-migration window; revalidatePaths("/admin/events", "/admin", "/journey")
- `cloneEventFlow`: two-pass clone — fetch source event+missions+templates; insert cloned event (slug suffixed with -clone-${Date.now()}); iterate missions building old→new map; iterate templates with soft_recommends_before=null (pass1); second loop updates soft_recommends_before via old→new template map (pass2, T-15-05); returns success with new event path embedded in message

**lib/i18n.ts** — 21 new admin_engine_* keys added to both fr and en dictionaries (ASCII-safe, no diacritics per convention): admin_engine_create_event, clone_event, clone_success, clone_error, events_empty, demo_disabled, deactivate_confirm, save_error, soft_recommends_hint, simulate_date_active, plus 10 keys for future plans (missions, levels, template editor surfaces)

**app/admin/events/page.tsx** (server component):
- getCurrentUser → redirect("/login"); getCurrentRole → redirect(pathForRole(role)) if non-GM
- hasSupabaseEnv() guard for data fetching; orgs fetched server-side for create form select
- AppShell role="game_master" variant="staff"; amber demo pill (admin_engine_demo_disabled)
- Passes rows + orgs + demo flag to AdminEventsTable

**components/admin-events-table.tsx** ("use client"):
- Table columns: Nom, Slug, Dates, Statut (eic-pill--green "Actif" / eic-pill--rose "Inactif"), Organisation, Missions, Actions
- Actions per row: "Voir missions" link → /admin/events/[id]/missions; activate toggle (eic-toggle-switch) wired to activateEventFlow with hidden eventId; clone button wired to cloneEventFlow with pending/success/link states
- Inline create form: admin-form-grid 2-col, fields nom/slug/startsAt/endsAt/cohortName/organizationId; submit wired to createEventFlow; cancels to close panel
- All icon-like buttons carry aria-labels; only existing EIC primitives used (.wf-card, .eic-pill, .eic-button, .eic-toggle-switch, .admin-form-grid, .input, .select, .form-status, .form-error)

## Verification

- `npm run typecheck` — green (0 errors)
- `npm run lint` — green (0 warnings)
- `npm run build` — green; /admin/events: 3.49 kB
- `npm run test:unit` — 23/23 passed (no regression)
- `npm run test:e2e` — 15/15 passed (new routes, no existing-route change)
- R1 audit: no score/rank/points leak introduced — all new files are /admin GM-only

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — the `/admin/events/[id]/missions` link targets a route not yet built (plans 03+); the link is a navigable href that will 404 until the missions editor is created. This is intentional scaffolding, not a data stub.

## Threat Flags

No new threat surface beyond what is in the plan's threat model. Mitigations applied:
- T-15-04 (Elevation of Privilege): GM role gate on all three actions + RLS *_gm_all defense-in-depth
- T-15-05 (Tampering soft_recommends_before): two-pass insert confirmed (grep: lines 2843, 2875-2887 of actions.ts)
- T-15-06 (Cross-org event listing): activateEventFlow scopes deactivation to organization_id; RLS org-scope (phase 14) filters reads
- T-15-07 (Partial clone orphans): clone returns error on any failure; additive inserts, no partial-success

## Self-Check: PASSED
