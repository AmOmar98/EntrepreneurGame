# OPS-01 — Drift report `database/` + `supabase/migrations/` vs PROD

**Date :** 2026-06-11
**Méthode :** les outils MCP Supabase étant indisponibles dans cette session (échec de propagation post-OAuth, limitation connue nécessitant un restart Claude Code), les preuves PROD proviennent des **vérifications PROD documentées** du quick `260523-kc2-advisors-fix` (SUMMARY.md, 2026-05-23 — postérieur à la dernière migration appliquée) croisées avec les fichiers SQL committés. PROD est resté idle entre l'archivage v0.3 (23/05) et aujourd'hui (aucun commit ni migration). Les requêtes de re-vérification live sont en annexe — à exécuter au checkpoint opérateur.

**Référentiel source de vérité (MANIFEST.md, Option A, Omar 2026-05-17) :**
`PROD = database/{schema,triggers,rls}.sql (bootstrap déclaratif) + supabase/migrations/* (autorité CLI) + database/migrations/* (archive frozen)`

---

## Tableau de drift

### Dimension 1 — Fonctions

| Objet | État PROD | État source | Drift ? | Action de consolidation |
|---|---|---|---|---|
| `set_updated_at()` | existe, `search_path=''` (kc2 D1 vérifié PROD 23/05) | `database/triggers.sql:8-17` avec `set search_path = ''` | PRESENT-IN-SOURCE | Aucune |
| `guard_player_onboarding()` | existe, `search_path=''` (kc2 D1 vérifié) | `database/triggers.sql:152-163` avec `set search_path = ''` | PRESENT-IN-SOURCE | Aucune |
| `set_help_requests_updated_at()` | existe, `search_path=''` (kc2 D1 vérifié) | `supabase/migrations/20260512100000_help_requests.sql:26-34` **sans** `set search_path` ; `database/triggers.sql` = commentaire de gap uniquement (l.169-178) | **PROD-ONLY** (attribut search_path) + absent de la vue déclarative | 13-NEW.sql Part 1 → sourcer dans `database/triggers.sql` avec `set search_path = ''` (remplace le commentaire de gap) |
| `set_pitch_mode_closed_at()` | existe, `search_path=''` (kc2 D1 vérifié) | **uniquement** dans `.planning/quick/260519-jpr-pitch-mode-replay/migrations/01-jurors-and-pitch-mode.sql:58-68` — absent de `database/` ET de `supabase/migrations/` (violation règle 3 MANIFEST : apply MCP jamais recopié) | **PROD-ONLY** | 13-NEW.sql Part 2 → sourcer dans `database/triggers.sql` + recopier la migration jpr dans `supabase/migrations/` (checkpoint opérateur) |
| `recalc_player_score`, `on_evaluation_change` | existent, SECURITY DEFINER (msu f9939b4) | `database/triggers.sql:57-146` | PRESENT-IN-SOURCE | Aucune |
| `recalc_player_engagement`, `on_*_engagement_change` | existent (phase14 trigger) | `supabase/migrations/20260517224914_phase14_engagement_trigger.sql` | PRESENT-IN-SOURCE (migrations) | Refléter dans triggers.sql au refactor Phase 14 (règle 4 MANIFEST) |

**Évidence PROD (kc2 SUMMARY, requête `pg_proc.proconfig` du 23/05) :** les 4 fonctions D1 affichent `["search_path=\"\""]` ; advisor `function_search_path_mutable` 4 → 0.

### Dimension 2 — Grants (11 fonctions SECURITY DEFINER, kc2 D3)

| Objet | État PROD | État source | Drift ? | Action |
|---|---|---|---|---|
| Les 11 fonctions secdef (`current_app_role`, `fn_auto_eval_fiches_entretien`, `is_game_master`, `is_juror(p_event_id uuid)`, `is_mentor`, `is_my_player(p_player_id uuid)`, `on_evaluation_change`, `on_evaluation_engagement_change`, `on_submission_engagement_change`, `recalc_player_engagement(p_player_id uuid)`, `recalc_player_score(p_player_id uuid)`) | PUBLIC EXECUTE = 0/11, authenticated EXECUTE = 11/11, service_role = 11/11 (kc2 SUMMARY, vérifié PROD 23/05 ; advisor 11 → 0) | `database/rls.sql:391-422` — les 11 paires REVOKE FROM PUBLIC + GRANT TO authenticated **présentes verbatim** (commit fe30c6b) | PRESENT-IN-SOURCE | Aucune — 13-NEW.sql Part 3 les ré-inclut par idempotence (no-op PROD) pour l'intégrité de l'artefact |

### Dimension 3 — Policies RLS (5 policies kc2 D2)

| Objet | État PROD | État source | Drift ? | Action |
|---|---|---|---|---|
| `help_requests_player_insert_own`, `jurors_self_select`, `pitch_scores_juror_self_insert`, `pitch_scores_juror_self_update`, `pitch_scores_select_visibility` | qual/with_check en forme `(SELECT auth.uid())` (kc2 SUMMARY vérifié ; advisor auth_rls_initplan 5 → 0) | `database/rls.sql:313-360` (commit 2d09a52) | PRESENT-IN-SOURCE | Aucune |
| `announcements_anon_select` + `grant select to anon` | existe (quick 260523-hhy, e4416ee) | `database/rls.sql:263-288` | PRESENT-IN-SOURCE | Aucune |

### Dimension 4 — Tables / colonnes (vue déclarative `schema.sql` vs PROD)

| Objet | État PROD | État source | Drift ? | Action |
|---|---|---|---|---|
| Table `jurors` | existe (quick 260519-jpr Part A) | `schema.sql` ✗ · `supabase/migrations/` ✗ · policies présentes dans rls.sql (incohérence interne : rls.sql référence une table que schema.sql ne crée pas) | **PROD-ONLY** (vs dirs canoniques) | Recopier la migration jpr dans `supabase/migrations/` (checkpoint) ; intégration déclarative → Phase 14 schemas v2 |
| Enum `pitch_mode_state` + colonnes `events.pitch_mode_state`, `events.pitch_mode_closed_at` + trigger `trg_set_pitch_mode_closed_at` | existent (quick jpr Part B) | idem ci-dessus | **PROD-ONLY** | idem |
| Table `help_requests` (+ mission_context, assigned_mentor, realtime) | existe | `supabase/migrations/202605121*` ✓ (4 fichiers) · `schema.sql` déclaratif ✗ | PARTIAL (règle 4 MANIFEST non appliquée) | Refléter dans schema.sql au refactor Phase 14 |
| Table `announcements` | existe | `supabase/migrations/20260510140001` ✓ · schema.sql ✗ | PARTIAL | Phase 14 |
| Table `evaluation_comments` + `evaluations.expected_action` | existe | `supabase/migrations/20260510140000` ✓ · schema.sql ✗ | PARTIAL | Phase 14 |
| `deliverable_templates.is_active` | existe | `supabase/migrations/20260510140001` ✓ · schema.sql ✗ (`is_bonus` ✓ l.109) | PARTIAL | Phase 14 |
| `events.pitch_order_json`, `events.pitch_order_published_at` | existent | `supabase/migrations/20260511223000` ✓ · schema.sql ✗ | PARTIAL | Phase 14 |
| `pitch_scores.total_score` colonne générée stored (c1+..+c5) | existe (évidence : backfill gu4 INSERT sans total_score sur 44 rows, 15/05) | `schema.sql:205-220` ✓ | PRESENT-IN-SOURCE | Aucune |
| `events.results_published_at` | existe (UPDATE gu4 15/05) | `schema.sql` (events) ✓ | PRESENT-IN-SOURCE | Aucune |

---

## Synthèse

- **Drift bloquant résolu par 13-NEW.sql** : les 2 fonctions PROD-only (`set_help_requests_updated_at`, `set_pitch_mode_closed_at`) sourcées avec `search_path=''` → à mirrorer dans `database/triggers.sql` (checkpoint opérateur, remplace le commentaire de gap l.169-178).
- **Drift structurel (non bloquant pour OPS-01, entrée de Phase 14)** : la migration quick-jpr (jurors + pitch_mode) doit être recopiée dans `supabase/migrations/` ; la vue déclarative `schema.sql` est en retard de 6 objets sur PROD (PARTIAL — couverts par migrations). Le refactor multi-tenant Phase 14 doit partir de **PROD réel** (= migrations + jpr), pas de schema.sql seul.
- **Aucun drift** sur grants (D3), policies (D2 + hhy), scoring triggers.

## Annexe — Requêtes de re-vérification live (à exécuter au checkpoint, read-only)

```sql
-- A1. Fonctions + search_path
select p.proname, p.prosecdef, p.proconfig
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('set_updated_at','guard_player_onboarding','set_help_requests_updated_at','set_pitch_mode_closed_at');

-- A2. Grants des 11 secdef (PUBLIC doit être absent de l'ACL, authenticated présent)
select p.proname, coalesce(p.proacl::text, '(default)') as acl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in
 ('current_app_role','fn_auto_eval_fiches_entretien','is_game_master','is_juror','is_mentor','is_my_player',
  'on_evaluation_change','on_evaluation_engagement_change','on_submission_engagement_change',
  'recalc_player_engagement','recalc_player_score');
```
