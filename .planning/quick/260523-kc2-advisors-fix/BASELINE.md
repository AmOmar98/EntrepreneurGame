# Baseline snapshot — Quick 260523-kc2 (Advisors triple migration)

**Date** : 2026-05-23
**Project Supabase** : `vzzbjxmfkmvqkaqxalhr` (Digi PROD)
**MCP status** : Supabase + Vercel OK (tick 14h33).
**Référence post-mortem** : `.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md` section D.

---

## Vue d'ensemble advisors

### Security advisors (snapshot quick C BASELINE.md §3, identique)

- 4 `function_search_path_mutable` → **cible D1**
- 11 `anon_security_definer_function_executable` → **cible D3** (REVOKE EXECUTE FROM anon ciblé)
- 10 `authenticated_security_definer_function_executable` → **hors scope D** (post-mortem ligne 131 dit "anon ciblé")
- 1 `auth_leaked_password_protection` → cosmétique, hors scope D

### Performance advisors (nouveau ce quick)

- **5 WARN `auth_rls_initplan`** → **cible D2**
- 2 WARN `multiple_permissive_policies` → hors scope D (consolidation policies, gros refactor)
- 4 INFO `unindexed_foreign_keys` → hors scope D (perf scale, pas le sujet)
- 8 INFO `unused_index` → hors scope D (indexes inutilisés post quick-260519-tqd)

---

## D1 — Functions à fixer search_path (4)

Toutes `LANGUAGE plpgsql`, toutes `SECURITY INVOKER` (pas DEFINER), toutes simples 5-15 lignes, aucune n'a `proconfig` (search_path non set).

| Function | Args | Lang | Definer | Definition (extrait) |
|---|---|---|---|---|
| `set_updated_at` | () | plpgsql | INVOKER | `new.updated_at = now(); return new;` (1 ligne) |
| `guard_player_onboarding` | () | plpgsql | INVOKER | Trigger anti-clear `players.onboarded_at` |
| `set_help_requests_updated_at` | () | plpgsql | INVOKER | `new.updated_at := now(); return new;` |
| `set_pitch_mode_closed_at` | () | plpgsql | INVOKER | Trigger pitch_mode_state transitions |

**Fix prévu** : `ALTER FUNCTION public.<name>() SET search_path = '';` pour chaque (4 statements).

**Risque** : très faible. Toutes les 4 sont des triggers internes ne référencant que des columns de `NEW`/`OLD`. Aucun appel à une autre table sans qualification. `search_path = ''` force la qualification explicite et casserait `now()` SI l'appel n'était pas qualifié — mais `now()` est dans `pg_catalog` (toujours implicitement dans le search_path).

---

## D2 — Policies à wrapper auth.uid() (5)

Toutes ces policies utilisent `auth.uid()` direct au lieu de `(SELECT auth.uid())`, ce qui force PostgreSQL à le ré-évaluer par row (O(n) au lieu de O(1)).

| Table | Policy | Cmd | qual / with_check | Fix |
|---|---|---|---|---|
| `pitch_scores` | `pitch_scores_juror_self_insert` | INSERT | `with_check: ((juror_id = auth.uid()) AND is_juror(event_id)) OR is_game_master()` | wrap `auth.uid()` |
| `pitch_scores` | `pitch_scores_juror_self_update` | UPDATE | `qual = with_check: (((juror_id = auth.uid()) AND is_juror(event_id)) OR is_game_master())` | wrap `auth.uid()` (×2) |
| `pitch_scores` | `pitch_scores_select_visibility` | SELECT | `qual: is_game_master() OR ((juror_id = auth.uid()) AND is_juror(event_id)) OR (is_juror(event_id) AND EXISTS(...))` | wrap `auth.uid()` |
| `help_requests` | `help_requests_player_insert_own` | INSERT | `with_check: is_my_player(player_id) AND (requested_by = auth.uid())` | wrap `auth.uid()` |
| `jurors` | `jurors_self_select` | SELECT | `qual: (user_id = auth.uid())` | wrap `auth.uid()` |

**Fix prévu** : DROP + CREATE chaque policy avec `(SELECT auth.uid())` à la place de `auth.uid()`. 5 policies = 5 DROP/CREATE pairs.

**Risque** : modéré. La sémantique RLS est identique, seule l'évaluation diffère (O(1) au lieu de O(n)). Si on perd une virgule ou un opérateur dans la copie, on casse la policy. → planifier verbatim avec récupération depuis `pg_policies` plutôt que copie post-mortem.

---

## D3 — Functions SECURITY DEFINER callables anon (11)

Les 11 fonctions secdef exposées via `/rest/v1/rpc/<name>` au rôle anon :

| Function | Args | Usage probable | Décision REVOKE FROM anon |
|---|---|---|---|
| `current_app_role` | () | RLS helper interne | ✅ REVOKE anon (utilisé en RLS, jamais en client) |
| `fn_auto_eval_fiches_entretien` | () | Trigger auto-eval | ✅ REVOKE anon (trigger only) |
| `is_game_master` | () | RLS helper | ✅ REVOKE anon |
| `is_juror` | `p_event_id uuid` | RLS helper | ✅ REVOKE anon |
| `is_mentor` | () | RLS helper | ✅ REVOKE anon |
| `is_my_player` | `p_player_id uuid` | RLS helper | ✅ REVOKE anon |
| `on_evaluation_change` | () | Trigger | ✅ REVOKE anon |
| `on_evaluation_engagement_change` | () | Trigger | ✅ REVOKE anon |
| `on_submission_engagement_change` | () | Trigger | ✅ REVOKE anon |
| `recalc_player_engagement` | `p_player_id uuid` | Server action / trigger | ✅ REVOKE anon |
| `recalc_player_score` | `p_player_id uuid` | Server action / trigger | ✅ REVOKE anon |

**Fix prévu** : `REVOKE EXECUTE ON FUNCTION public.<name>(<args>) FROM anon;` × 11 statements.

**Risque** : faible si aucun code client (Next.js RSC ou client component) n'appelle ces functions via Supabase REST. À grep avant d'appliquer.

**Hors scope D3** : les 10 `authenticated_security_definer_function_executable` advisors restent. Post-mortem ligne 131 limite explicitement le scope D3 à `anon`. Les fonctions doivent être callables par `authenticated` pour que les server actions / RLS-helpers serveur fonctionnent.

---

## Cible quantitative

| Avant | Après cible D | Δ |
|---|---|---|
| Security advisors : **26 WARN** | ≤15 WARN | -11 (4 search_path + 11 anon secdef = 15, mais 10 auth secdef restent → 16 WARN attendus) |
| Performance advisors : **8 WARN** (5 initplan + 2 mult perm + 1 ?) | ≤3 WARN | -5 (initplan) |

Cible post-mortem ligne 139 : 26 → ≤5 WARN résiduels. **Atteignable seulement si on traite aussi les 10 authenticated secdef** (hors scope D3 strict). À discuter en fin de D3 selon état.

---

## Critères smoke post-D

Après chaque migration :
- `get_advisors(type=security)` + `get_advisors(type=performance)` snapshot
- Diff avec baseline : compter WARN éliminés
- `pg_policies` query sur tables touchées (D2) : qual/with_check doivent contenir `( SELECT auth.uid() AS uid)` (la forme expanded de PostgreSQL)
- `pg_proc` query sur 4 functions (D1) : `proconfig` doit contenir `search_path=`
- `information_schema.role_table_grants` query (D3) : `anon` ne doit plus avoir EXECUTE sur les 11 functions

Aucune régression applicative attendue (zone DB pure, dual-mode demo inchangé).
