---
phase: 04-gamemaster-bulk-import-branding-page-accueil
plan: 03
subsystem: admin
tags: [admin, player-detail, gamemaster, diagnostics]
requirements: [ADMIN-03, SCORE-02]
dependency-graph:
  requires:
    - phase 02 player schema (players, player_members, submissions, deliverable_templates, profiles)
    - phase 03 evaluations table
    - lib/auth.ts (getCurrentRole, getCurrentUser, pathForRole)
    - lib/journey.ts (levelLabel)
    - phase 04 plan 01 cohort table linking to /admin/players/[id]
  provides:
    - lib/admin-player-detail.ts (getPlayerDetail, PlayerDetail, PlayerDetailMember, PlayerDetailSubmission)
    - /admin/players/[id] GameMaster Player detail dashboard
  affects:
    - lib/i18n.ts (admin_detail_* keys, FR + EN)
tech-stack:
  added: []
  patterns:
    - dual-mode Supabase access (createClient null short-circuit, UUID validation early-return)
    - snake_case row mappers to camelCase domain types (mirrors lib/admin.ts)
    - in-memory bucketing of evaluations per submission via Map keyed by submission_id
key-files:
  created:
    - lib/admin-player-detail.ts
    - app/admin/players/[id]/page.tsx
  modified:
    - lib/i18n.ts
decisions:
  - "UUID validation via regex before any DB roundtrip; bad input -> null -> 'Player introuvable.' with back link."
  - "Per-section error tolerance: members/submissions queries log + return [] without aborting the whole detail (a transient profiles failure must not blank out the rest of the page)."
  - "Submissions ordered by submitted_at desc (latest first) so GameMaster sees the most recent activity at the top of the list."
  - "proof_text preview truncated to 200 chars + ellipsis to keep cards scannable; full text remains in DB for export."
  - "Reused existing journey_status_*, feedback_verdict_* keys for badge labels rather than duplicating; only admin_detail_* keys are new."
metrics:
  duration: ~10 minutes
  completed_date: 2026-05-08
---

# Phase 4 Plan 03: GameMaster Player Detail Summary

GameMaster `/admin/players/[id]` page now renders the full diagnostic view for a single Player (header card with scores, members table, submissions list with nested evaluations) backed by a new `lib/admin-player-detail.ts` data layer. Implements ADMIN-03 and surfaces SCORE-02 values per Player.

## What Was Built

### Task 1 - lib/admin-player-detail.ts (commit `4dffbd7`)

New server-side accessor modeled on `lib/admin.ts` and `lib/mentor.ts`:

- `getPlayerDetail(playerId): Promise<PlayerDetail | null>` returns the full nested aggregate:
  - `player` (mapped to camelCase via `mapPlayer`)
  - `levelLabel` via `levelLabel(player.currentLevel)`
  - `members[]` = `player_members` joined with `profiles` (email, full_name) via a single `IN (user_ids)` lookup
  - `submissions[]` ordered by `submitted_at desc`, each enriched with `templateTitle` (resolved from `deliverable_templates`) and `evaluations[]` (bucketed via Map keyed by `submission_id`)
- Three exported types: `PlayerDetailMember`, `PlayerDetailSubmission`, `PlayerDetail`.
- Dual-mode safe: returns `null` when Supabase env is absent.
- UUID validation: regex check on `playerId` before any DB roundtrip; bad input returns `null` immediately.
- All Supabase errors logged via `console.error("[admin-player-detail] ...")` and never thrown. Sub-section failures degrade gracefully (e.g. profiles unreachable -> members rendered with `null` email/full_name).

### Task 2 - /admin/players/[id]/page.tsx + i18n (commit `32ad5df`)

- New server component using Next 15 async `params` API.
- Auth gates: `getCurrentUser()` -> redirect `/login` if absent; `getCurrentRole()` -> redirect via `pathForRole` if non-`game_master`.
- `null` detail -> renders back link + `t.admin_detail_not_found` message inside `AppShell` (no crash on bad UUID or missing Player).
- Layout (wrapped in `<AppShell role="game_master">`):
  - **Header card**: team name, slug, status badge, current level label, idea (full text, `whiteSpace: pre-wrap`), and a 3-tile grid for Score Projet / Score Engagement (both `.toFixed(1)`) / Onboarded at (formatted date or "Pas encore onboarde").
  - **Members table**: Email / Full name / Team role / Joined at columns; empty state `t.admin_detail_no_members`.
  - **Submissions list**: per-submission `<article>` card with template title, V1/V2 badge, kind, submitted-at, status badge. Proof URL rendered as `<a target="_blank" rel="noreferrer">`; proof text rendered as `<pre>` truncated at 200 chars with ellipsis. Each card embeds the nested evaluations list (verdict label, total score `.toFixed(1)`, feedback `<pre>`); empty states for both submissions and per-card evaluations.
- 31 new i18n keys added to `lib/i18n.ts` (`admin_detail_*`) under both `fr` and `en`. Verdict labels reuse existing `feedback_verdict_*`; submission status labels reuse existing `journey_status_*`.

## Verification

- `npx tsc --noEmit` clean.
- `npx next lint` clean (no ESLint warnings or errors).
- `npm run build` succeeds; `/admin/players/[id]` listed as dynamic route (`ƒ /admin/players/[id]`, 182 B / 110 kB First Load).

## Deviations from Plan

None - plan executed exactly as written. Added one extra i18n key (`admin_detail_member_full_name`) to label the "Nom complet" column in the members table; this stays consistent with the FR/EN dictionary mirror requirement.

## Self-Check: PASSED

- `lib/admin-player-detail.ts` FOUND.
- `app/admin/players/[id]/page.tsx` FOUND.
- `lib/i18n.ts` FOUND with `admin_detail_*` keys (FR + EN).
- Commit `4dffbd7` FOUND (Task 1 - data layer).
- Commit `32ad5df` FOUND (Task 2 - page + i18n).
- typecheck + lint + build all green.
