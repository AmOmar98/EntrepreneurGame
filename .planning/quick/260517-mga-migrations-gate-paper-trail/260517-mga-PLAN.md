---
quick_id: 260517-mga
slug: migrations-gate-paper-trail
date: 2026-05-17
status: executed
advisor_verdict: pending
origin: post-pilot housekeeping — CLAUDE.md says `database/schema.sql + triggers.sql + rls.sql` is source-of-truth applied in PROD, but two divergent migration dirs (`database/migrations/` 8 files + `supabase/migrations/` 16 files) exist with no manifest. CI cannot reach PROD Supabase to run `supabase migration list`, so a paper-trail manifest is the practical gate.
must_haves:
  truths:
    - "`database/schema.sql` -> `triggers.sql` -> `rls.sql` is the canonical bootstrap applied to PROD Supabase project `vzzbjxmfkmvqkaqxalhr` (see database/README.md + memory `project_pilot_status`)."
    - "`supabase/migrations/` is the CLI-tracked dir (`supabase db push --linked`) and matches the remote `supabase_migrations.schema_migrations` table — established by quick 260510-lu5 (B3 retro)."
    - "`database/migrations/` is an authoring/staging area where mig SQL was first drafted before being copied (sometimes renamed) into `supabase/migrations/` with a UTC timestamp prefix."
    - "Several files have 1:1 byte-identical twins across both dirs (08-mentor-comments.sql == 20260510140000_phase08_mentor_comments.sql, etc.); a few are orphans on one side only."
    - "Future rule: new migrations MUST be authored directly in `supabase/migrations/` with `YYYYMMDDHHMMSS_<slug>.sql`. `database/migrations/` is frozen (paper trail only)."
  artifacts:
    - .planning/quick/260517-mga-migrations-gate-paper-trail/260517-mga-PLAN.md
    - .planning/quick/260517-mga-migrations-gate-paper-trail/260517-mga-AUDIT.md
    - .planning/quick/260517-mga-migrations-gate-paper-trail/260517-mga-ADVISOR-VERDICT.md
    - .planning/quick/260517-mga-migrations-gate-paper-trail/260517-mga-SUMMARY.md
    - .planning/quick/260517-mga-migrations-gate-paper-trail/deferred-items.md
    - database/MANIFEST.md
  key_links:
    - database/README.md
    - database/schema.sql
    - database/triggers.sql
    - database/rls.sql
    - supabase/config.toml
    - .planning/quick/260510-lu5-b3retro-apply-migrations-phase-8-9-to-pr/260510-lu5-PLAN.md
---

# PLAN — Quick 260517-mga · Migrations gate paper-trail

## Objective

Produce a `database/MANIFEST.md` documenting the relationship between
`database/migrations/` (8 files) and `supabase/migrations/` (16 files), explain
which is source-of-truth in PROD, and define the rule for future migrations.

This is a **paper-trail manifest, not an automated gate** — CI cannot reach the
PROD Supabase instance to run `supabase migration list`.

## Scope

### DO
1. Inventory the 24 migration files with size + last commit + 1-line intent.
2. Cross-reference with `database/schema.sql`, `triggers.sql`, `rls.sql` (the canonical bootstrap).
3. Identify overlaps (same intent in both dirs), divergences, orphans.
4. Write `database/MANIFEST.md` with source-of-truth declaration + inventory table + mapping table + future rule.
5. Write the 5 standard quick artifacts (PLAN / AUDIT / ADVISOR-VERDICT / SUMMARY / deferred-items).
6. Spawn `eic-pedagogical-advisor` and wait for PASS/WARN before committing changes to `database/`.

### DO NOT
- Modify `database/schema.sql`, `database/triggers.sql`, `database/rls.sql`, or any file under `database/migrations/` / `supabase/migrations/`.
- Unify the two directories (separate decision — a phase, not a quick).
- Touch CI config.
- Push to `main` directly. Push the worktree branch and report it back.

## Risk frame

Zone sensible: `database/`. Even though we only ADD `database/MANIFEST.md` (no
edits to existing SQL), the manifest is normative documentation that future
contributors will rely on. Advisor sign-off required per CLAUDE.md pre-edit guards.

R1/R2/R3: **NA** — no Player-facing surface touched, no validators, no gating.

## Commit chain

1. `(quick-260517-mga) scaffold planning skeleton`
2. `(quick-260517-mga) inventory 24 migration files across two dirs`
3. `(quick-260517-mga) draft database/MANIFEST.md source-of-truth + mapping`
4. `(quick-260517-mga) record advisor verdict for MANIFEST` (after advisor)
5. `(quick-260517-mga) summary + deferred items`

Each smoke gate: `npm run typecheck && npm run lint && npm run build` at the end.

## Success criteria

- [x] `database/MANIFEST.md` lists all 24 files with provenance.
- [x] Manifest declares `supabase/migrations/` as the CLI-tracked dir matched against PROD.
- [x] Manifest names `database/migrations/` as a frozen authoring archive.
- [x] Future rule: "new migrations go in `supabase/migrations/` with timestamp prefix".
- [x] Overlaps / divergences / orphans are explicit.
- [x] Advisor verdict captured verbatim.
- [x] Branch pushed to origin, SHAs returned to caller.
