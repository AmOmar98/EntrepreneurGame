# Database Migrations Manifest — DRAFT (PENDING OMAR DECISION)

> **Paper-trail manifest** — produced by quick `260517-mga` on 2026-05-17 (post-pilot).
>
> **Status: DRAFT — NOT A DECISION.** Per Omar's instruction (2026-05-17):
> "Je sais pas, fais l'inventaire d'abord." This document is an **inventory + a
> recommendation**, not an enforceable rule. The Source-of-Truth choice and the
> "future migrations" rule remain **PENDING OMAR DECISION**. Until Omar tranche,
> contributors should NOT treat the recommendation below as policy, and this file
> stays under `.planning/quick/260517-mga-…/MANIFEST-draft.md` rather than being
> promoted to `database/MANIFEST.md`.
>
> Reason for existence: the repo carries **two** migration directories that
> diverge in naming convention and partly overlap. CI cannot reach the PROD
> Supabase instance to run `supabase migration list` as a gate, so this file
> serves as the human-readable inventory of "what files exist, where they came
> from, and which overlap with which".

---

## TL;DR (observed facts, not policy)

| Question | Observed |
|---|---|
| What is actually applied in PROD? | Best-evidence reconstruction: `database/schema.sql` -> `database/triggers.sql` -> `database/rls.sql` (one-shot bootstrap), then incremental migrations under `supabase/migrations/`. **Authoritative confirmation requires `mcp__plugin_supabase_supabase__list_migrations` against project `vzzbjxmfkmvqkaqxalhr` — out of scope for this paper-trail.** |
| Which dir does the Supabase CLI track? | `supabase/migrations/` (per `supabase/config.toml` defaults). Confirmed by the quick `260510-lu5` workflow which copied phase-8/9 SQL into this dir to align local-remote CLI history. |
| What has `database/migrations/` historically been used for? | Authoring/staging area. SQL was drafted here during T-3 phases; files that needed CLI replay were copied into `supabase/migrations/` with `YYYYMMDDHHMMSS_<slug>.sql` prefix. The 4 post-2026-05-11 files in `database/migrations/202605*.sql` appear to have been applied via Supabase MCP `apply_migration` (not via CLI), per memory `feedback_postgresql_plpgsql_pitfalls`. |

---

## Source-of-truth — RECOMMENDATION (pending Omar decision)

**Recommended SoT (Option A — minimal-change):**

```
PROD Supabase = (database/schema.sql ; database/triggers.sql ; database/rls.sql)
              + supabase/migrations/* (applied via `supabase db push --linked`)
              + a small set of out-of-band patches under database/migrations/202605*.sql
                (applied via Supabase MCP `apply_migration` — paper trail only)
```

**Rationale for Option A:**
- Matches observed practice — both dirs already exist and have been used this way for 7+ days.
- `database/schema.sql` serves as the **cumulative declarative view** (hand-edited
  when migrations alter tables), which lets a fresh apply reproduce PROD state
  without replaying every migration. This is observable: `deliverable_templates.is_bonus`
  appears both in `schema.sql:109` AND in `supabase/migrations/20260512020000_…`.
- Lowest disruption: no file moves, no retroactive renames, no CI changes.
- Compatible with existing pre-edit guards in `CLAUDE.md` ("zone sensible : `database/`").

**Alternative options Omar may prefer:**

- **Option B — CLI-only SoT.** Make `supabase/migrations/` the *only* SoT.
  Copy the 4 orphan `database/migrations/202605*.sql` files into `supabase/migrations/`
  with retroactive timestamps. Freeze `database/migrations/` permanently (paper trail).
  Keep `database/schema.sql` as a regenerable artifact (or drop it).
  - **Pro:** single source of truth, `supabase migration list` becomes authoritative.
  - **Con:** requires upfront audit of *what is actually applied on PROD* (via MCP
    `list_migrations`) before doing any moves, plus a separate decision on the fate
    of `schema.sql`.
- **Option C — Declarative-only SoT.** Treat `database/schema.sql` / `triggers.sql` /
  `rls.sql` as the only canonical state. Deprecate both `*/migrations/` dirs.
  Regenerate state from declaration on bootstrap (drop + reapply pattern).
  - **Pro:** simplest mental model; perfect schema in repo always matches PROD.
  - **Con:** loses incremental migration history (rollback granularity); requires
    tooling change (no longer `supabase db push`); data migrations become problematic.
- **Option D — Status quo, no manifest.** Don't pick an SoT, keep current
  ambiguity. Lowest cost short-term but the situation that triggered this quick
  recurs.

**Decision needed from Omar:** which option (A / B / C / D / other) becomes policy.
Until then, the "Rule for future migrations" below is a **proposal**, not policy.

---

## Rule for future migrations — PROPOSAL (pending Omar decision)

If Omar selects Option A, the proposal is:

1. **Author directly in `supabase/migrations/`** with a UTC timestamp prefix:
   `YYYYMMDDHHMMSS_<short_slug>.sql` (matching the format already in use).
2. **Idempotent or wrapped in a transaction** — use `IF NOT EXISTS`,
   `DROP POLICY IF EXISTS`, `ON CONFLICT DO UPDATE`, etc. Replays / dry runs /
   re-applies after a soft-reset must not error.
3. **Apply via `supabase db push --linked`** (CLI) for normal flow. Use Supabase
   MCP `apply_migration` only for hotfixes that must land before the next CLI
   push is feasible — and document the out-of-band apply in this manifest.
4. **Reflect cumulative state in `database/schema.sql`** when the migration
   alters tables/columns/enums. Triggers go in `database/triggers.sql`, RLS
   policies in `database/rls.sql`. This keeps the fresh-bootstrap path
   reproducible.
5. **Do NOT add new files to `database/migrations/`.** That directory becomes
   frozen as of the Omar-decision date. If you find yourself wanting to add
   one, write it under `supabase/migrations/` instead.

Options B/C imply different rules — not drafted here until/unless Omar selects them.

---

## Inventory — `database/migrations/` (8 files)

| File | Size (B) | Last commit | Date | Intent |
|---|---:|---|---|---|
| `08-mentor-comments.sql` | 4902 | `7328eee` | 2026-05-10 | Phase 8 mentor refonte — `evaluation_comments` table + `evaluations.expected_action` column. |
| `09-gamemaster-live.sql` | 5547 | `8352ffc` | 2026-05-10 | Phase 9 GameMaster — `deliverable_templates.is_active`, `announcements` table + RLS. |
| `10-pitch-order.sql` | 1435 | `58f98d9` | 2026-05-10 | Phase 10/C3 — `events.pitch_order_json` + `pitch_order_published_at` (R1-gated). |
| `202605110007_phase14_engagement_trigger.sql` | 6451 | `d613ff2` | 2026-05-11 | Phase 14 engagement scoring trigger — paliers 100/25/50 on `players.score_engagement`. |
| `202605111923_fix_evaluation_comments_grants.sql` | 3271 | `f6a30e1` | 2026-05-11 | Hotfix F-16-01 — explicit GRANTs on `evaluation_comments` (the bulk grant in `rls.sql:267-269` is one-shot, doesn't cover tables created later). |
| `202605121200_rls_initplan_fix.sql` | 8780 | `4bcf364` | 2026-05-12 | Supabase advisor `auth_rls_initplan` — wrap `auth.uid()` in `(select auth.uid())` for 15 policies. Apply window: post-pilot. |
| `202605121201_multiple_permissive_fix.sql` | 5032 | `74a006f` | 2026-05-12 | Supabase advisor `multiple_permissive_policies` — split `xxx_gm_all` into per-command policies on 5 tables. Apply window: post-pilot. |
| `202605121202_fk_indexes.sql` | 2076 | `4a36ac5` | 2026-05-12 | Supabase advisor `unindexed_foreign_keys` — add 7 covering indexes. Apply window: post-pilot. |

## Inventory — `supabase/migrations/` (16 files, CLI-tracked)

| File | Size (B) | Last commit | Date | Intent |
|---|---:|---|---|---|
| `20260508222155_initial_schema.sql` | 318 | `d7b3e80` | 2026-05-10 | **Stub** — aligns local-remote CLI history with the pre-CLI bootstrap (`database/schema.sql`). |
| `20260508222224_initial_rls.sql` | 135 | `d7b3e80` | 2026-05-10 | **Stub** — aligns local-remote CLI history with `database/rls.sql`. |
| `20260510140000_phase08_mentor_comments.sql` | 4902 | `d7b3e80` | 2026-05-10 | Phase 8 — byte-identical copy of `database/migrations/08-mentor-comments.sql`. |
| `20260510140001_phase09_gamemaster_live.sql` | 5547 | `d7b3e80` | 2026-05-10 | Phase 9 — byte-identical copy of `database/migrations/09-gamemaster-live.sql`. |
| `20260510160000_seed_event_hackdays_agritech.sql` | 29664 | `64569a2` | 2026-05-10 | Event seed AgreenTech 2026 — levels L0..L7, 1 event, 1 cohort, 6 missions, 10 deliverable_templates (idempotent UPSERTs). |
| `20260510170000_bonus_events_recreate.sql` | 7841 | `06b60d3` | 2026-05-10 | T3X — `bonus_events` table + `bonus_type`/`bonus_status` enums + multiplier mechanism. |
| `20260510170100_moscow_cards.sql` | 5671 | `afa3d19` | 2026-05-10 | T3X — `moscow_cards` table (Kanban native persistence). |
| `20260511000000_reapply_seed_t3_polish_refonte.sql` | 22659 | `dfd61b1` | 2026-05-11 | Re-UPSERT 10 livrables AgreenTech with T3-polish titles (PROD had stale titles after file edit). |
| `20260511192300_fix_evaluation_comments_grants.sql` | 3271 | `f48cb8e` | 2026-05-11 | Hotfix F-16-01 — byte-identical copy of `database/migrations/202605111923_...`. |
| `20260511192400_verify_evaluation_comments_grants.sql` | 1225 | `f48cb8e` | 2026-05-11 | Verification probe — emits NOTICE rows for `evaluation_comments` table_privileges (no DDL). |
| `20260511223000_pitch_order_columns.sql` | 1152 | `dd11aa8` | 2026-05-11 | Mirrors `database/migrations/10-pitch-order.sql` (same target columns, cleaner idempotent form). |
| `20260512020000_deliverable_is_bonus.sql` | 1471 | `c06e430` | 2026-05-12 | Polish v3 — `deliverable_templates.is_bonus` column + M1 swap (probleme=1, personae=2 bonus). |
| `20260512100000_help_requests.sql` | 2736 | `38cf313` | 2026-05-12 | quick-260512-24v — `help_requests` table + `help_request_status` enum + RLS + GRANTs. |
| `20260512110000_help_requests_mission_context.sql` | 508 | `07c9d6c` | 2026-05-12 | quick-260512-24v deferred #5 — `help_requests.mission_context` text column. |
| `20260512120000_help_requests_assigned_mentor.sql` | 914 | `6d68b66` | 2026-05-12 | quick-260512-24v deferred #3 — `help_requests.assigned_mentor_id` self-claim column + index. |
| `20260512130000_help_requests_realtime.sql` | 527 | `c81f0a7` | 2026-05-12 | quick-260512-24v deferred #2 — add `help_requests` to `supabase_realtime` publication. |

---

## Mapping — overlaps / divergences / orphans

### Overlaps (byte-identical twins) — 3 pairs

These pairs are literally `cp` of one another (md5 confirmed). Either side could
be deleted with no behavioural change; both are kept for paper-trail clarity.

| `database/migrations/` | `supabase/migrations/` | md5 |
|---|---|---|
| `08-mentor-comments.sql` | `20260510140000_phase08_mentor_comments.sql` | `f66fa717afc9b5e4c722eca947ec15c9` |
| `09-gamemaster-live.sql` | `20260510140001_phase09_gamemaster_live.sql` | `e559704eccf356a0450b7d64187d8ee7` |
| `202605111923_fix_evaluation_comments_grants.sql` | `20260511192300_fix_evaluation_comments_grants.sql` | `26f4e6328078440cea596538250a68b8` |

### Divergent twins (same intent, different bytes) — 1 pair

| `database/migrations/` | `supabase/migrations/` | Difference |
|---|---|---|
| `10-pitch-order.sql` (1435 B) | `20260511223000_pitch_order_columns.sql` (1152 B) | Target columns identical (`pitch_order_json`, `pitch_order_published_at`). The `supabase/` variant is the idempotent (`IF NOT EXISTS`) cleaner form actually replayed by the CLI; the `database/` variant carries the long R1-contract header. Applying either to a fresh DB yields the same DDL. |

### Orphans in `database/migrations/` (no twin in `supabase/migrations/`) — 4 files

These were authored in `database/migrations/` but never copied into the CLI dir
because they appear to have been applied out-of-band via Supabase MCP
`apply_migration` (or are queued for post-pilot apply).

| File | Apply status (as of 2026-05-17) |
|---|---|
| `202605110007_phase14_engagement_trigger.sql` | Likely applied via MCP (engagement scoring trigger is observably live in PROD per memory `feedback_postgresql_plpgsql_pitfalls`). **Confirm via MCP `list_migrations`.** |
| `202605121200_rls_initplan_fix.sql` | Header says "apply post-pilot 14/05 evening". **Confirm via Supabase MCP `list_migrations`** — deferred. |
| `202605121201_multiple_permissive_fix.sql` | Same window — confirm via MCP. |
| `202605121202_fk_indexes.sql` | Same window — confirm via MCP. |

### Orphans in `supabase/migrations/` (no twin in `database/migrations/`) — 12 files

These were authored directly in the CLI dir. Two are alignment stubs; the rest
are normal incremental migrations.

| File | Notes |
|---|---|
| `20260508222155_initial_schema.sql` | Stub. |
| `20260508222224_initial_rls.sql` | Stub. |
| `20260510160000_seed_event_hackdays_agritech.sql` | Seed — also lives at `database/seed_event_hackdays.sql` (legacy non-`migrations/` slot, distinct file). |
| `20260510170000_bonus_events_recreate.sql` | T3X — `database/bonus_events.sql` is the historic non-`migrations/` twin (distinct file). |
| `20260510170100_moscow_cards.sql` | T3X — `database/moscow_cards.sql` is the historic non-`migrations/` twin (distinct file). |
| `20260511000000_reapply_seed_t3_polish_refonte.sql` | Patch UPSERT — supabase-only. |
| `20260511192400_verify_evaluation_comments_grants.sql` | Verification probe (NOTICE only) — supabase-only. |
| `20260512020000_deliverable_is_bonus.sql` | Polish v3 — column already reflected in `database/schema.sql:109`. |
| `20260512100000_help_requests.sql` | quick-260512-24v — supabase-only. |
| `20260512110000_help_requests_mission_context.sql` | quick-260512-24v deferred #5. |
| `20260512120000_help_requests_assigned_mentor.sql` | quick-260512-24v deferred #3. |
| `20260512130000_help_requests_realtime.sql` | quick-260512-24v deferred #2. |

---

## What is NOT covered by this manifest

- **The actual `schema_migrations` table on PROD.** This manifest documents the
  intent and provenance of files in the repo. To confirm what Supabase has
  actually recorded as applied, run via Supabase MCP:
  `mcp__plugin_supabase_supabase__list_migrations`. This is the only authoritative
  source for "is migration X applied". A follow-up task is recommended to
  reconcile the 4 `database/migrations/202605*.sql` orphans against the real list.
- **Unification of the two directories.** Out of scope for this paper-trail
  quick — would require a dedicated phase (audit applied-ness of orphans,
  decide retroactive timestamps, update CI + docs, possibly squash duplicates).
- **Promotion to `database/MANIFEST.md`.** Blocked by the `Write(database/**)` /
  `Edit(database/**)` deny rule in `.claude/settings.local.json`, AND by Omar's
  override pending the SoT decision. Promote post-decision.

---

## References

- `database/README.md` — bootstrap procedure.
- `database/schema.sql` / `triggers.sql` / `rls.sql` — canonical bootstrap files.
- `supabase/config.toml` — CLI project link.
- `.planning/quick/260510-lu5-b3retro-apply-migrations-phase-8-9-to-pr/260510-lu5-PLAN.md` — establishes the `database/migrations/` -> `supabase/migrations/` copy pattern.
- `.planning/quick/260512-msu-mentor-rls-submission-status-propagation/` — example of in-place edit to `database/triggers.sql` + MCP apply (no migration file).
- `CLAUDE.md` § "Database" — apply order summary.
