# Deferred items — 260523-kc2-advisors-fix

## Backlog

### Post-mortem corrections

- **Coquille post-mortem section D L131** : prescrit `REVOKE EXECUTE ON FUNCTION ... FROM anon ciblé`. Cette syntaxe est un no-op en Postgres car anon hérite via PUBLIC. Pattern correct utilisé : `REVOKE FROM PUBLIC` + `GRANT TO authenticated`. À documenter dans le post-mortem source pour la prochaine rétro.
  - Fichier : `.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md` ligne 131.
  - Le `D3.sql` documente le pattern correct inline pour traçabilité.

### Advisors résiduels hors scope D

- **11 `authenticated_security_definer_function_executable`** : conservés intentionnellement (post-mortem L131 limite D3 à anon). Si jugé nécessaire plus tard, deux options :
  - (a) Migrer ces functions hors du schema `public` (vers un schema `internal` non exposé via REST). Le plus propre mais nécessite refactor.
  - (b) `REVOKE EXECUTE ON FUNCTION ... FROM authenticated` également. Casserait les server actions qui appellent ces functions en tant qu'authenticated → faut auditer chaque call site avant.
  - Décision actuelle : accepter le faux positif. RLS helpers + server-action callbacks ont besoin d'EXECUTE authenticated.

- **1 `auth_leaked_password_protection`** : cosmétique config Auth Supabase. À activer dans Dashboard Auth Settings (pas SQL). 1 clic Omar quand pratique.

- **2 `multiple_permissive_policies` (performance)** : consolidation policies sur `help_requests` (mentor_select_all + player_select_own) et `jurors` (gm_all + self_select). Gros refactor — chaque table mérite une seule policy unifiée. Quick séparé si avant prochain event.

- **4 INFO `unindexed_foreign_keys`** : help_requests (×3) + jurors (×1). Performance INFO seulement, pas WARN. À indexer si pages mentor/admin deviennent lentes à l'échelle.

- **8 INFO `unused_index`** : indexes créés par migrations qui n'ont jamais servi (deliverable_templates_active_idx, announcements_event_created_idx, announcements_kind_idx, bonus_events × 4, moscow_cards × 2, missions_level_id_idx, pitch_scores_player_id_idx). Hors scope nettoyage ce quick — voir [[project_db_perf_baseline_postpooler_decision]] memory.

### Drift database/ vs PROD

- **2 functions PROD-only** (D1 finding) : `set_help_requests_updated_at` + `set_pitch_mode_closed_at` ne sont pas dans `database/triggers.sql` source. Le `set search_path = ''` a été appliqué uniquement en PROD pour ces 2. À consolider lors du refactor schemas v2 (SEED-001 milestone v0.4).
  - Note ajoutée en fin de `database/triggers.sql` pointant vers les migrations d'origine.

- **Audit consolidation database/** : suite à plusieurs trouvailles drift (functions D1 + announcements grants vs revoke schema), un audit complet `database/` vs PROD est mûr. Quick séparé `(quick-XXX-db-source-consolidation)` à planifier avant le refactor schemas v2.

## Observation reportée (smoke validation)

- **Test fonctionnel au prochain event live** : OFF-PILOT post-Digi (2026-05-23), pas de trafic utilisateur pour valider que :
  - Les 5 RLS policies wrapped fonctionnent toujours en pratique (juror peut voir pitch_scores, player peut INSERT help_requests, etc.)
  - Les 11 RLS helper functions sont toujours appelables en RLS context (authenticated)
  - service_role bypass intact pour server actions
- Cible au prochain event : zero erreur RLS denied sur ces 8 surfaces (5 policies + 3 tables).
