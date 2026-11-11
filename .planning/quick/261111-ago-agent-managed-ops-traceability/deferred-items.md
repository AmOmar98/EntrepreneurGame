# Deferred Items (`261111-ago`)

1. **Merge PR `#1` (`milestone/v0.4-scale-foundation` -> `main`):**
   - Production Supabase (`vzzbjxmfkmvqkaqxalhr`) already has all 31 migrations up to Phase 16 (`20260611240200_phase16_triggers_parameterized`), while Vercel Production (`https://entrepreneur-game-six.vercel.app`) is still on `main` (`381a3ce`). Merging PR `#1` after final operator sign-off will align Production app code with the Production database.
2. **`DB-01` Bootstrap Mirror Fixes (`database/triggers.sql` & `database/rls.sql`):**
   - `database/triggers.sql` dollar-quoting (`as $` vs `$$;`) and `database/rls.sql` table ordering still need a dedicated disposable-database verification slice before running fresh declarative bootstraps.
3. **Supabase Security Advisor Hardening (`0029_authenticated_security_definer_function_executable`):**
   - Revoke public/authenticated RPC execution on trigger/internal `SECURITY DEFINER` functions (`recalc_player_score`, `recalc_player_engagement`, `on_*`) via a tracked migration in `supabase/migrations/`.
4. **Stale `.planning/pilot-alerts/OFF-PILOT-2026-05-23*` Cleanup:**
   - 31 untracked `OFF-PILOT-*` tick files from May 23, 2026 remain in the working tree (preserved per `AGENTS.md` rule not to discard unrelated untracked files without explicit confirmation).
