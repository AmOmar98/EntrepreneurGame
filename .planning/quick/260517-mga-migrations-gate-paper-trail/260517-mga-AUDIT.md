# AUDIT — Quick 260517-mga · Migrations gate paper-trail

## Method

- `ls -la` both dirs for sizes
- `git log -1 --format="%h %ai"` per file for last-touch SHA + date
- `md5sum` for byte-equality checks between suspected twins
- `head -20` per file for intent line
- Cross-read `database/schema.sql`, `triggers.sql`, `rls.sql` to confirm what is canonical

## Inventory — `database/migrations/` (8 files)

| # | File | Size | Last commit | Date | Intent (1 line) |
|---|---|---:|---|---|---|
| 1 | `08-mentor-comments.sql` | 4902 | `7328eee` | 2026-05-10 | Phase 8 mentor refonte (MNT-03 + MNT-04): `evaluation_comments` table + `evaluations.expected_action` column. |
| 2 | `09-gamemaster-live.sql` | 5547 | `8352ffc` | 2026-05-10 | Phase 9 GameMaster live mode (GMR-04..09): `deliverable_templates.is_active`, `announcements` table + RLS. |
| 3 | `10-pitch-order.sql` | 1435 | `58f98d9` | 2026-05-10 | Phase 10/C3 pitch order: `events.pitch_order_json` + `events.pitch_order_published_at` (R1-gated). |
| 4 | `202605110007_phase14_engagement_trigger.sql` | 6451 | `d613ff2` | 2026-05-11 | Phase 14 engagement scoring trigger (100/25/50 paliers) — writes to `players.score_engagement`. |
| 5 | `202605111923_fix_evaluation_comments_grants.sql` | 3271 | `f6a30e1` | 2026-05-11 | Hotfix F-16-01: GRANT select/insert/... on `evaluation_comments` to authenticated (RLS alone insufficient). |
| 6 | `202605121200_rls_initplan_fix.sql` | 8780 | `4bcf364` | 2026-05-12 | Supabase advisor `auth_rls_initplan` fix — wrap `auth.uid()` in `(select auth.uid())` for 15 policies. |
| 7 | `202605121201_multiple_permissive_fix.sql` | 5032 | `74a006f` | 2026-05-12 | Supabase advisor `multiple_permissive_policies` fix — split `xxx_gm_all` (FOR ALL) into per-command policies on 5 tables. |
| 8 | `202605121202_fk_indexes.sql` | 2076 | `4a36ac5` | 2026-05-12 | Supabase advisor `unindexed_foreign_keys` fix — add 7 covering indexes for FKs. |

## Inventory — `supabase/migrations/` (16 files)

| # | File | Size | Last commit | Date | Intent (1 line) |
|---|---|---:|---|---|---|
| 1 | `20260508222155_initial_schema.sql` | 318 | `d7b3e80` | 2026-05-10 | **Stub** — aligns local↔remote CLI history; actual schema lives in `database/schema.sql`. |
| 2 | `20260508222224_initial_rls.sql` | 135 | `d7b3e80` | 2026-05-10 | **Stub** — aligns local↔remote CLI history; actual RLS lives in `database/rls.sql`. |
| 3 | `20260510140000_phase08_mentor_comments.sql` | 4902 | `d7b3e80` | 2026-05-10 | Phase 8 mentor refonte — **byte-identical** to `database/migrations/08-mentor-comments.sql` (md5 `f66fa717…`). |
| 4 | `20260510140001_phase09_gamemaster_live.sql` | 5547 | `d7b3e80` | 2026-05-10 | Phase 9 GameMaster live — **byte-identical** to `database/migrations/09-gamemaster-live.sql` (md5 `e559704e…`). |
| 5 | `20260510160000_seed_event_hackdays_agritech.sql` | 29664 | `64569a2` | 2026-05-10 | Phase 2/04 seed — Event `hack-days-fes-meknes-mai-2026`, levels L0..L7, 6 missions AgreenTech, 10 deliverable_templates (idempotent UPSERTs). |
| 6 | `20260510170000_bonus_events_recreate.sql` | 7841 | `06b60d3` | 2026-05-10 | T3X wave1/02 — `bonus_events` table + `bonus_type`/`bonus_status` enums + multiplier mechanism. |
| 7 | `20260510170100_moscow_cards.sql` | 5671 | `afa3d19` | 2026-05-10 | T3X wave1/03 — `moscow_cards` table (Kanban native persistence for fiche-produit-plan-dev-v1). |
| 8 | `20260511000000_reapply_seed_t3_polish_refonte.sql` | 22659 | `dfd61b1` | 2026-05-11 | Re-UPSERT 10 livrables AgreenTech with T3-polish titles (PROD had stale titles after file edit). |
| 9 | `20260511192300_fix_evaluation_comments_grants.sql` | 3271 | `f48cb8e` | 2026-05-11 | Hotfix F-16-01 — **byte-identical** to `database/migrations/202605111923_…` (md5 `26f4e632…`). |
| 10 | `20260511192400_verify_evaluation_comments_grants.sql` | 1225 | `f48cb8e` | 2026-05-11 | Verification probe — emits NOTICE rows for `evaluation_comments` table_privileges (no DDL). |
| 11 | `20260511223000_pitch_order_columns.sql` | 1152 | `dd11aa8` | 2026-05-11 | Polish/design-v2-match V10 — `events.pitch_order_json` + `events.pitch_order_published_at` (idempotent `IF NOT EXISTS`). Mirrors intent of `database/migrations/10-pitch-order.sql` but smaller/cleaner. |
| 12 | `20260512020000_deliverable_is_bonus.sql` | 1471 | `c06e430` | 2026-05-12 | Polish v3 — `deliverable_templates.is_bonus` column (visual badge only) + M1 swap (probleme=1, personae=2 bonus). |
| 13 | `20260512100000_help_requests.sql` | 2736 | `38cf313` | 2026-05-12 | quick-260512-24v — `help_requests` table + `help_request_status` enum + RLS + GRANTs (FAB call-mentor). |
| 14 | `20260512110000_help_requests_mission_context.sql` | 508 | `07c9d6c` | 2026-05-12 | quick-260512-24v deferred #5 — `help_requests.mission_context` text column. |
| 15 | `20260512120000_help_requests_assigned_mentor.sql` | 914 | `6d68b66` | 2026-05-12 | quick-260512-24v deferred #3 — `help_requests.assigned_mentor_id` self-claim column + index. |
| 16 | `20260512130000_help_requests_realtime.sql` | 527 | `c81f0a7` | 2026-05-12 | quick-260512-24v deferred #2 — add `help_requests` to `supabase_realtime` publication. |

## Mapping — overlaps, divergences, orphans

### Overlaps (byte-identical twins) — 3 pairs

| `database/migrations/` | `supabase/migrations/` | md5 | Pattern |
|---|---|---|---|
| `08-mentor-comments.sql` | `20260510140000_phase08_mentor_comments.sql` | `f66fa717…` | Drafted in `database/`, copied verbatim into CLI dir at quick `260510-lu5`. |
| `09-gamemaster-live.sql` | `20260510140001_phase09_gamemaster_live.sql` | `e559704e…` | Same pattern as above. |
| `202605111923_fix_evaluation_comments_grants.sql` | `20260511192300_fix_evaluation_comments_grants.sql` | `26f4e632…` | Hotfix F-16-01 — drafted then copied (already on timestamp naming in source). |

### Divergent twins (same intent, different bytes) — 1 pair

| `database/migrations/` | `supabase/migrations/` | Difference |
|---|---|---|
| `10-pitch-order.sql` (1435 B) | `20260511223000_pitch_order_columns.sql` (1152 B) | Same target columns (`pitch_order_json`, `pitch_order_published_at`). The `supabase/` variant is shorter (idempotent `IF NOT EXISTS` only, with column comments); the `database/` variant has the long header explaining anchor/preselection R1 contract. **Both yield the same DDL** when applied to an empty DB. |

### Orphans in `database/migrations/` (no twin in `supabase/migrations/`) — 4 files

| File | Notes |
|---|---|
| `202605110007_phase14_engagement_trigger.sql` | Phase 14 engagement scoring trigger. Status: applied via Supabase MCP `apply_migration` per quick context (memory `feedback_postgresql_plpgsql_pitfalls` + MSU quick). Not in `supabase/migrations/` because applied out-of-band (MCP `apply_migration` records its own row in `schema_migrations` under a generated name). |
| `202605121200_rls_initplan_fix.sql` | Post-pilot perf fix. Header explicitly says "DO NOT APPLY pre-pilot. APPLY = post-pilot 14/05 evening". Status as of 2026-05-17: needs confirmation whether applied via MCP or still pending. |
| `202605121201_multiple_permissive_fix.sql` | Same window as 1200 — post-pilot perf fix. |
| `202605121202_fk_indexes.sql` | Same window as 1200 — post-pilot perf fix. |

### Orphans in `supabase/migrations/` (no twin in `database/migrations/`) — 11 files

| File | Notes |
|---|---|
| `20260508222155_initial_schema.sql` | Empty stub aligning CLI history with PROD's pre-CLI bootstrap (`database/schema.sql`). |
| `20260508222224_initial_rls.sql` | Empty stub aligning CLI history with PROD's pre-CLI bootstrap (`database/rls.sql`). |
| `20260510160000_seed_event_hackdays_agritech.sql` | Authored directly in `supabase/migrations/` (also lives at `database/seed_event_hackdays.sql` in the legacy non-`migrations/` slot, distinct file). |
| `20260510170000_bonus_events_recreate.sql` | T3X-EXPANSION migration (also has a legacy twin at `database/bonus_events.sql` — distinct file outside `migrations/`). |
| `20260510170100_moscow_cards.sql` | T3X-EXPANSION migration (also has a legacy twin at `database/moscow_cards.sql` — distinct file outside `migrations/`). |
| `20260511000000_reapply_seed_t3_polish_refonte.sql` | Patch UPSERT — supabase-only, no `database/migrations/` equivalent. |
| `20260511192400_verify_evaluation_comments_grants.sql` | Verification probe (NOTICE rows only) — supabase-only. |
| `20260512020000_deliverable_is_bonus.sql` | Polish v3 — supabase-only (column is already documented in `database/schema.sql:109`). |
| `20260512100000_help_requests.sql` | quick-260512-24v — supabase-only. |
| `20260512110000_help_requests_mission_context.sql` | quick-260512-24v deferred — supabase-only. |
| `20260512120000_help_requests_assigned_mentor.sql` | quick-260512-24v deferred — supabase-only. |
| `20260512130000_help_requests_realtime.sql` | quick-260512-24v deferred — supabase-only. |

## Source-of-truth findings

1. **Bootstrap canonical**: `database/schema.sql` -> `database/triggers.sql` -> `database/rls.sql`. Applied once to a fresh `public` schema before the Supabase CLI was wired up (per `database/README.md` + quick `260510-lu5` PLAN context).
2. **Incremental canonical**: `supabase/migrations/` is the **CLI-tracked dir** matched against `supabase_migrations.schema_migrations` on PROD (project `vzzbjxmfkmvqkaqxalhr`). This is the only dir `supabase db push --linked` will consider.
3. **`database/migrations/` is an authoring archive**. Files were drafted here first (phase artifacts during T-3), and the ones intended for CLI replay were copied into `supabase/migrations/` with timestamp prefixes (quick `260510-lu5`). The 4 post-2026-05-10 files (`202605110007_…`, `202605121200_…`, `…1201`, `…1202`) were authored here but applied via Supabase MCP `apply_migration` rather than copied into `supabase/migrations/`.
4. **Latest cross-reference of `schema.sql` with migrations**: `deliverable_templates.is_bonus boolean` is present in `database/schema.sql:109` AND added incrementally in `supabase/migrations/20260512020000_deliverable_is_bonus.sql`. This is the expected pattern post-bootstrap — `database/schema.sql` was hand-edited to reflect the cumulative state.

## Risks & deferred items

- **Confirm whether `202605121200/01/02` perf fixes are actually applied on PROD**. Header says "post-pilot 14/05 evening"; pilot ended 14/05 evening. Out of scope for this paper-trail quick — should be verified via Supabase MCP `list_migrations` in a separate task (added to `deferred-items.md`).
- **Unification of the two dirs** is a separate phase, not a quick. Doing it now would require: (a) audit which `database/migrations/` orphans are truly unapplied, (b) decide whether to copy them into `supabase/migrations/` with retroactive timestamps, (c) update CI / docs. Out of scope.
