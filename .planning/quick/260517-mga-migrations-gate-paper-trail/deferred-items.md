# DEFERRED ITEMS — Quick 260517-mga

## 1. Omar SoT decision (BLOCKING manifest promotion) — RESOLVED 2026-05-17

**Resolution:** Omar a confirmé **Option A (coexistence minimal-change)** sur la session du 2026-05-17 ("go with option A").

**Policy actée :**
- `supabase/migrations/` = dir CLI-tracké (autorité pour les futures migrations, format `YYYYMMDDHHMMSS_<slug>.sql`)
- `database/migrations/` = dir frozen (archive authoring, ne plus ajouter de fichiers)
- `database/schema.sql` + `triggers.sql` + `rls.sql` = vue déclarative cumulative à maintenir à la main
- Out-of-band patches via Supabase MCP `apply_migration` autorisés pour hotfix, à logger dans le manifest

**Promotion `database/MANIFEST.md` :** toujours bloquée par `Write(database/**)` / `Edit(database/**)` deny rule. Garde l'intent ici, promotion physique = item #3 (Omar bypass ponctuel ou softening du deny).

## 2. MCP `list_migrations` reconciliation

**Need:** Run `mcp__plugin_supabase_supabase__list_migrations` against PROD project `vzzbjxmfkmvqkaqxalhr` and reconcile against the 4 orphan files in `database/migrations/202605*.sql`:
- `202605110007_phase14_engagement_trigger.sql`
- `202605121200_rls_initplan_fix.sql`
- `202605121201_multiple_permissive_fix.sql`
- `202605121202_fk_indexes.sql`

**Outcome:** Confirm each is either (a) applied via MCP and recorded under its MCP-generated name, or (b) still pending. Update `MANIFEST-draft.md` § Orphans accordingly.

**Suggested quick:** `260518-XXX-mig-reconcile` or similar.

## 3. Cleanup of untracked `database/MANIFEST.md` in worktrees

**Issue:** Prior pass on branch `worktree-260517-deferred-skeletons` had committed `database/MANIFEST.md` (SHA `889e40a`). This pass removed it from staging via `git rm --cached`, but the worktree copy remains untracked because `rm database/MANIFEST.md` is blocked by the `Write(database/**)` deny rule.

**Need:** Omar (or someone with full write perms) to either:
- `rm database/MANIFEST.md` manually, OR
- Approve the file post-SoT decision and let it become tracked (with the override softened).

## 4. Unification phase — NON-APPLICABLE (Omar a choisi Option A 2026-05-17)

Option A = coexistence, pas d'unification requise. Item clos.

## 5. CI gate (long-term)

Independent of SoT choice, a CI gate that runs `supabase migration list --linked` and diffs against `supabase/migrations/` would convert this paper-trail into an automated gate. Blocked today by the fact that CI cannot reach the PROD Supabase instance (no service-role creds in CI).

Possible future option: spin up a Supabase preview branch on PR open, apply migrations, compare. Out of scope.
