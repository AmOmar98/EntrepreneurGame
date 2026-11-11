# Live Control-Plane & Traceability Audit (`261111-ago`)

**Audited (UTC):** `2026-11-11T12:42:00Z`
**Scope:** Reconcile GitHub, Vercel, and Supabase live states (`REL-01`), fix the R2 comment false positive (`DX-01`), and verify Agent Ops monitoring + traceability (`OPS-01`).

---

## 1. Live Infrastructure Reconciliation (`REL-01`)

| Layer | Identifier | Verified Live State |
|---|---|---|
| **GitHub** | `AmOmar98/EntrepreneurGame` | Authenticated via `gh` (`AmOmar98`, scopes: `repo`, `workflow`, `read:org`, `gist`, `delete_repo`). Open PR `#1`: `milestone/v0.4-scale-foundation` (`937468f`) -> `main` (`origin/main` at `381a3ce`; local `main` has 1 unpushed research commit `8f3d9f0`). |
| **Vercel Production** | `prj_u3jR0YiNr2WnCFEoG6g1yDShikdH` (`entrepreneur-game`) | Deployment `dpl_7AexVk5Zfnc7WvBPZfFqDRnJ2wQP` (`READY` / `PROMOTED`) serving `https://entrepreneur-game-six.vercel.app` from branch `main` @ `381a3ce` (*archive v0.3 Digi-Hackathon milestone*). |
| **Vercel Preview (v0.4)** | PR `#1` (`milestone/v0.4-scale-foundation`) | Deployment `dpl_FisUBgpXw1hcT4mWWULAtTadZq2T` (`READY` / `STAGED`) serving branch `milestone/v0.4-scale-foundation` @ `937468f` (*docs(17-03): complete perf toolkit plan*). |
| **Supabase Postgres** | `vzzbjxmfkmvqkaqxalhr` (`EntrepreneurGame`, `eu-west-1`, PG `17.6.1.121`) | Restored from `INACTIVE` (Free-tier auto-pause) to `ACTIVE_HEALTHY` via `restore_project` at `2026-11-11T12:41:46Z`. All **31 migrations** in `supabase/migrations/` (`20260508222155` through `20260611240200_phase16_triggers_parameterized`) are applied in `supabase_migrations.schema_migrations`. |

### Live Event & Archive Counts in `vzzbjxmfkmvqkaqxalhr`

| Event UUID | Slug | Name | `is_active` | Organization UUID | Cohorts | Players | Submissions | Evaluations | Pitch Scores |
|---|---|---|---|---|---|---|---|---|---|
| `f9a386aa-a547-4d0d-91d0-0bb16a29364e` | `agreentech-fes-meknes-mai-2026` | AgreenTech Fes-Meknes Mai 2026 | `false` | `588bc094-d46c-472d-8c91-023738026be4` | 1 | 0 | 0 | 0 | 0 |
| `084824a7-6678-42d8-a066-b5133f79b6c0` | `hack-days-fes-meknes-mai-2026` | Digi-Hackathon 4ème édition | `true` | `588bc094-d46c-472d-8c91-023738026be4` | 1 | 10 | 50 | 42 | 0 |

> **Key `REL-01` Finding:** The production database `vzzbjxmfkmvqkaqxalhr` already has all v0.4 schema migrations (Phases 14, 15, and 16) applied, while the production Vercel alias (`entrepreneur-game-six.vercel.app`) still serves `main` (`381a3ce`, v0.3). Merging PR `#1` (`milestone/v0.4-scale-foundation`) into `main` will align the deployed Next.js code with the already-migrated database schema. Also note that `pitch_scores_count` on `hack-days-fes-meknes-mai-2026` is `0` (`DIGI-08` / `OPS-02` tech debt remains open if historical pitch scores need backfilling).

---

## 2. Supabase Security Advisor Findings (`get_advisors`)

1. **`0029_authenticated_security_definer_function_executable` (WARN — 13 functions):**
   `SECURITY DEFINER` functions in `public` (`current_app_role`, `fn_auto_eval_fiches_entretien`, `get_event_setting_int`, `is_game_master`, `is_in_org`, `is_juror`, `is_mentor`, `is_my_player`, `on_evaluation_change`, `on_evaluation_engagement_change`, `on_submission_engagement_change`, `recalc_player_engagement`, `recalc_player_score`) are executable by `authenticated` via PostgREST `/rest/v1/rpc/...`. Trigger functions and internal recalc helpers should have `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon, authenticated;` in a future hardening migration.
2. **`auth_leaked_password_protection` (WARN — 1 finding):**
   HaveIBeenPwned password check is currently disabled in Supabase Auth settings.
