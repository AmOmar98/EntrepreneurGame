# SUMMARY — Quick 260517-mga · Migrations gate paper-trail

## Outcome

Inventoried all 24 migration files across `database/migrations/` (8) and
`supabase/migrations/` (16). Cross-mapped overlaps/divergences/orphans.
Produced a draft manifest with a **recommended** Source of Truth (Option A,
minimal-change) plus alternatives (B/C/D), pending Omar's decision.

Per Omar override 2026-05-17 ("Je sais pas, fais l'inventaire d'abord"),
the manifest is **not** promoted to `database/MANIFEST.md` — it lives at
`.planning/quick/260517-mga-…/MANIFEST-draft.md` until SoT is chosen.
A prior pass on branch `worktree-260517-deferred-skeletons` had already
written `database/MANIFEST.md` declaratively; this pass removed that
file from staging (and from the index via `git rm --cached`) to honor
the override. The untracked file in `database/MANIFEST.md` remains in the
worktree (cannot be deleted: blocked by `Write(database/**)` deny rule),
but is NOT committed.

## Key findings

- **24 files total:** 8 in `database/migrations/` + 16 in `supabase/migrations/`.
- **3 byte-identical twin pairs** (md5 confirmed): 08-mentor-comments, 09-gamemaster-live, 202605111923_fix_evaluation_comments_grants.
- **1 divergent twin pair** (same DDL intent, different bytes): `10-pitch-order.sql` ↔ `20260511223000_pitch_order_columns.sql`.
- **4 orphans in `database/migrations/`** (no twin in `supabase/migrations/`): the 4 `202605*.sql` post-2026-05-10 files — apparently applied via Supabase MCP `apply_migration`, not CLI. Apply status needs MCP confirmation.
- **12 orphans in `supabase/migrations/`** (no twin in `database/migrations/`): 2 alignment stubs + 10 supabase-only incremental migrations.
- **`database/schema.sql` is hand-maintained** to reflect cumulative state (e.g. `deliverable_templates.is_bonus` on line 109).

## Recommended SoT (pending Omar)

**Option A (minimal-change):** Both dirs coexist. `supabase/migrations/` is CLI-tracked. `database/migrations/` is frozen authoring archive. `database/schema.sql`+`triggers.sql`+`rls.sql` is cumulative declarative view. New migrations go to `supabase/migrations/` only.

Alternatives B (CLI-only), C (declarative-only), D (status quo) documented in `MANIFEST-draft.md` § Source-of-truth.

## Commits

- `<SHA-pending>` `docs(quick-260517-mga): migrations inventory + MANIFEST.md draft`

## Smoke

No smoke needed — documentation-only changes, no source code, no SQL, no `database/*.sql` touched.

## Deferred items

See `deferred-items.md`. Top items:
1. Omar SoT decision (A/B/C/D) — blocking promotion to `database/MANIFEST.md`.
2. MCP `list_migrations` reconciliation of 4 orphan `database/migrations/202605*.sql` files against PROD `schema_migrations`.
3. Unification phase (if Omar selects B/C) — out of scope for a quick.
