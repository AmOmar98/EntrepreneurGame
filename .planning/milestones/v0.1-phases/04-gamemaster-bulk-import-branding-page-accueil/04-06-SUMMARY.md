---
phase: 04-gamemaster-bulk-import-branding-page-accueil
plan: 06
subsystem: phase-closeout
tags: [smoke-test, i18n-audit, anti-leak, build-verification, gamemaster, branding]
requirements: [BRAND-04, ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ONBOARD-01]
dependency-graph:
  requires:
    - phase 04 plans 01..05 (GM dashboard, CSV import, player detail, CSV export, branding + login)
    - lib/i18n.ts (FR/EN dictionaries from plans 01-05)
    - .env.example (SUPABASE_SERVICE_ROLE_KEY documented in plan 02)
  provides:
    - .planning/phases/04-gamemaster-bulk-import-branding-page-accueil/04-SMOKE-TEST.md (10-step manual walkthrough)
  affects:
    - .planning/STATE.md (phase 04 closeout)
    - .planning/ROADMAP.md (phase 04 progress)
tech-stack:
  added: []
  patterns:
    - "i18n parity audit via inline tsx script comparing FR/EN keysets"
    - "anti-leak audit via scoped grep on app/components/lib/public"
    - "auto-mode checkpoint: smoke test template authored, manual sign-off deferred to operator"
key-files:
  created:
    - .planning/phases/04-gamemaster-bulk-import-branding-page-accueil/04-SMOKE-TEST.md
  modified: []
decisions:
  - "i18n.ts already at perfect parity (195 FR / 195 EN keys, zero divergence) - no edits required"
  - "Anti-leak grep on app/components/lib/public returns zero hits except 4 anti-leak guard comments in lib/seed/*.ts (intentional, never rendered, kept per Plan 05 decision)"
  - ".env.example already documents SUPABASE_SERVICE_ROLE_KEY since Plan 02 - no edits required"
  - "Auto-mode: human-verify checkpoint auto-approved; operator runs the 10-step walkthrough at their convenience using the committed checklist"
metrics:
  duration: ~5 minutes
  completed_date: 2026-05-08
---

# Phase 4 Plan 06: Polish Final + Smoke Test Summary

Phase 4 closeout: i18n FR/EN parity audit, anti-leak grep, build verification, and authored 10-step GameMaster smoke test checklist. All automated gates green; manual smoke deferred to operator (auto-mode).

## What Was Built

### Task 1 - i18n parity audit + anti-leak grep + build (verification only, no commit)

**i18n parity:** Inline `tsx` script over `lib/i18n.ts` confirmed:
- FR dictionary: 195 keys
- EN dictionary: 195 keys
- Missing in EN: `[]`
- Missing in FR: `[]`

No edits required to `lib/i18n.ts` - perfect parity already in place after Plans 01-05.

**Anti-leak grep** on `app/`, `components/`, `lib/`, `public/`:
- 0 matches in `app/`
- 0 matches in `components/`
- 0 matches in `public/`
- 4 matches in `lib/seed/{players,missions,deliverableTemplates,index}.ts` - all are **anti-leak guard comments** documenting that those names must never be reintroduced (per Plan 05 decision: "Removing them would weaken the BRAND-05 guard"). These strings are never rendered to UI / metadata / network responses.

**`.env.example`** already documents `SUPABASE_SERVICE_ROLE_KEY` with the contract comment from Plan 02. No edit required.

**Automated gates:**
- `npm run typecheck` - clean.
- `npm run lint` (`eslint .`) - clean (no warnings or errors).
- `npm run build` - success, 14 routes compiled including `/admin`, `/admin/players/[id]`, `/admin/players/import`, `/admin/export/players.csv`, `/login` (static, 4.46 kB-class).

### Task 2 - Manual smoke test checklist (commit `7373297`)

Auto-mode (`AUTO_CHAIN=true`): the `checkpoint:human-verify` is auto-approved per executor protocol. To preserve the must_have artifact, a 10-step operator-facing checklist was authored at `.planning/phases/04-gamemaster-bulk-import-branding-page-accueil/04-SMOKE-TEST.md`.

The checklist mirrors the plan's `<how-to-verify>` and adds:
- Pre-requisites block (env, GM credentials, Supabase user, dev console).
- One PASS/FAIL line + free-text notes per step.
- Embedded automated baseline (typecheck/lint/build/i18n parity/anti-leak grep) already green at commit time.
- Sign-off block for operator.

The 10 steps cover:
1. Anon root redirect to `/login`.
2. Login partner banner (logo + 6 partners + footnote, no leak strings).
3. Login as game_master → `/admin`.
4. Cohort dashboard (header, 3 counters, table, action buttons).
5. CSV import first run (`created=1`, `invitesSent=2` or `invitesSkipped=2`).
6. CSV import idempotency (`created=0`, `alreadyExisted=1`).
7. Player detail page (header, members, "Aucune soumission").
8. Export `players.csv` download (RFC 4180, header line, spreadsheet-readable).
9. Sidebar EIC logo across `/admin/*`.
10. 403 on `/admin/export/players.csv` from anon (Supabase mode).

## Verification

- `npx tsc --noEmit` -> clean.
- `npx next lint` -> clean.
- `npx next build` -> success, 14 routes (no regression vs Plans 01-05 build output).
- i18n parity FR/EN -> 195/195, no divergence.
- Anti-leak grep on `app/components/lib/public` -> 0 hits in renderable code; only documented guard comments remain in `lib/seed/`.

## Deviations from Plan

### Auto-fixed Issues

None.

### Auto-mode adjustments

**1. [Auto-mode] checkpoint:human-verify auto-approved**
- **Found during:** Task 2 entry.
- **Plan said:** Operator runs the 10-step walkthrough live and types `approved`.
- **Auto-mode behaviour:** `AUTO_CHAIN=true` -> auto-approve `checkpoint:human-verify`, log auto-approval, continue.
- **Mitigation:** committed the operator-runnable checklist as `04-SMOKE-TEST.md` so the manual walkthrough can be executed at any time before Phase 5 deploy without losing the must_have artifact.
- **Outcome:** plan completes; operator sign-off remains a pre-deploy gate but is no longer a synchronous executor block.

## Authentication Gates

None. No code mutations; no Supabase round-trips required during this plan.

## Self-Check: PASSED

Files verified:
- FOUND: `.planning/phases/04-gamemaster-bulk-import-branding-page-accueil/04-SMOKE-TEST.md`

Commits verified:
- FOUND: `7373297` (Task 2 - smoke test checklist).

Automated baseline:
- typecheck + lint + build all green.
- i18n parity 195 / 195.
- anti-leak grep clean across `app/`, `components/`, `public/`; only intentional guard comments remain in `lib/seed/`.
