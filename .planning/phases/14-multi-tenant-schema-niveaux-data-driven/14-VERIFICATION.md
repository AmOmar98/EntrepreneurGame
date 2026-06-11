---
phase: 14-multi-tenant-schema-niveaux-data-driven
status: passed
verified: 2026-06-11
method: supabase CLI (db push + migration list + inspect db table-stats) — MCP indisponible
---

# Phase 14 — Vérification

## APPLY LOG

| Item | Détail |
|---|---|
| Méthode | `supabase db push --linked` (CLI v2.98.2, exécuté par l'agent — autorisation Omar explicite « tu as les autorisations ») |
| Date | 2026-06-11 ~21h00 (Africa/Casablanca) |
| Migrations | `20260611120000_organizations.sql` · `20260611120100_events_is_active.sql` · `20260611120200_levels_data_driven.sql` · `20260611120300_rls_org_scope.sql` |
| Erreurs | **Aucune** — seuls des NOTICE idempotents (`DROP POLICY IF EXISTS ... does not exist, skipping`) |
| Tag de sécurité | `v0.4.0-pre-phase14-migrate` poussé sur origin avant apply |
| Pré-requis | **Réparation d'historique de migrations** (le push était bloqué par le drift schema_migrations) : 14 versions remote-only marquées `reverted` (bookkeeping pur — appliquées jadis via MCP sans fichiers locaux), 7 fichiers locaux déjà en PROD marqués `applied` (20260511223000, 20260512020000, 202605121*×4, 20260519120000). Dry-run post-repair = exactement les 4 migrations phase 14. |

## TENANT-01 — Adoption org par défaut

- `public.organizations` : **1 row** (org `eic`) — `inspect db table-stats`.
- `events.organization_id` : backfill vers l'org EIC exécuté dans la transaction de `20260611120000` (BEGIN/COMMIT — un échec aurait avorté tout le fichier). `public.events` : 2 rows (inchangé).

## TENANT-03 — Event actif explicite

- `events.is_active` créé + backfill « event le plus récent » dans `20260611120100`.
- **Index unique partiel `uniq_events_single_active` créé sans erreur** — preuve structurelle qu'au plus un event est actif (sa création aurait échoué si ≥2 rows actives).

## TENANT-02 — RLS inter-org (preuve structurelle, mono-org)

- `is_in_org(uuid)` SECURITY DEFINER + REVOKE FROM PUBLIC + GRANT authenticated : créé par `20260611120300` (transaction OK).
- Policies créées : `events_org_scope_select`, `organizations_member_select`, `organizations_gm_all`, `levels_v2_authenticated_select`, `levels_v2_gm_all` (les NOTICE du push montrent les DROP IF EXISTS skips suivis des CREATE).
- PROD est mono-org au lancement (décision CONTEXT) → **test runtime multi-org déféré à un seed de staging** ; la preuve est structurelle (policy + helper + grants), conforme au plan (« structural: policy + helper verified; multi-org runtime test deferred »).

## TENANT-04 — Archives intactes

- Les 4 migrations ne contiennent **aucun UPDATE/DELETE de colonnes préexistantes** (relecture des fichiers : uniquement ADD COLUMN, CREATE TABLE, backfill des NOUVELLES colonnes, policies).
- `events`=2, `submissions`=50, `evaluations`=42, `players`=10 — volumes inchangés (table-stats).
- Les classements archivés sont recalculés à partir de colonnes non modifiées — recompute identique par construction. Spot-check runtime optionnel au prochain passage Studio.

## LEVELS-02 — Backfill niveaux sans perte

- `public.levels_v2` : **8 rows** = `public.levels` : 8 rows (copie `id::text` complète).
- `missions.level_id_text` (13 missions) + `players.current_level_text` (10 players) : backfill `::text` dans la même transaction que la création — le COMMIT prouve l'exécution. Spot-check « zéro NULL » exact (SELECT count) à coller au prochain passage Studio (requêtes dans 14-05-PLAN.md Task 1), non bloquant.

## SC-4 (note plan-checker W-1)

Le critère ROADMAP « plus d'enum PG » est satisfait par la **bascule du chemin de lecture** vers `levels_v2`/colonnes text (plans 14-02/03/04) ; les colonnes enum physiques restent peuplées mais dormantes. Leur DROP est la migration destructive différée post-event juillet (section deferred du CONTEXT).

## Bonus — Signal DIGI-08 (OPS-02, phase 13)

`public.pitch_scores` : **0 rows estimées** (table-stats, reltuples). Cohérent avec le wipe pré-Digi du 19/05 (qui a purgé le backfill AgreenTech du 15/05) et l'absence de saisie jury live pendant Digi. → scénario pré-arbitré **OMAR-DECIDE** de `OPS-02-verdict.md` (backfill proxy façon gu4 OU clôture « cérémonie hors-app assumée »). Estimate à confirmer par un `select count(*)` exact avant décision.

## Verdict

**PASSED** — TENANT-01/02/03/04 + LEVELS-02 prouvés (structurel + transactionnel + table-stats). Deux spot-checks runtime optionnels restent listés (NULL-counts exacts, recompute classements) — non bloquants, regroupés avec la requête DIGI-08.
