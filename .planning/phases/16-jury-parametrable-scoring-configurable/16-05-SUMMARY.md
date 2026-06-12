---
phase: 16-jury-parametrable-scoring-configurable
plan: "05"
status: complete
requirements: [JURY-06, SETTINGS-03]
completed: 2026-06-12
executor: orchestrator-inline
---

# Plan 16-05 — Checkpoint opérateur batché : apply PROD + mirror : COMPLETE

## Apply PROD (GO Omar explicite)

- Tag de sécurité `v0.4.0-pre-phase16-migrate` poussé avant apply.
- Dry-run vérifié (exactement 5 migrations), GO Omar, puis `echo Y | npx supabase db push --linked`.
- **Incident & fix en cours d'apply** : `20260611230000` rejetée par PostgreSQL — `cannot use subquery in check constraint` (le CHECK warn-only utilisait NOT EXISTS/SELECT). Transaction par fichier → rollback propre, `20260611220000` déjà appliquée. Fix : réécriture du CHECK avec `jsonb_path_exists(validation_rules, '$[*] ? (@.severity != "warn")')` (fonction, autorisée en CHECK, sémantique identique). Re-push → **les 5 migrations appliquées sans erreur**.
- Migrations appliquées : `220000_events_org_scope_enforce` (CR-01 — policy permissive events DROPpée, scope org effectif), `230000_phase15_engine_columns`, `240000_phase16_pitch_criteria`, `240100_phase16_event_settings`, `240200_phase16_triggers_parameterized`.

## Vérifications post-apply (read-only)

- `table-stats` : `pitch_criteria` créée (0 rows — normal), `event_settings` backfillée (**2 rows** = 2 events), `deliverable_templates` 72→88 kB (colonnes engine), organizations/levels_v2 inchangées.
- Smoke HTTP PROD : `/login` 200, `/`, `/journey`, `/results` 307 (redirect anonyme attendu) — comportement inchangé post org-scope-enforce.
- Smoke RLS runtime authentifié (3 surfaces avec comptes réels) : à jouer au preflight phase 18 (J-2) — structurel vérifié (helpers + policies + grants).

## Mirror déclaratif (pattern Node-script autorisé — FLAGGED)

- `database/schema.sql`, `database/rls.sql`, `database/triggers.sql` mis à jour via `scripts/mirror-phase15-16-declarative.cjs` (committé, idempotent) : colonnes engine + pitch_criteria + event_settings (DDL), is_in_org élargi + note DROP policy, note triggers paramétrés.
- Drift résiduel pré-existant (6 objets PARTIAL, cf. OPS-01) : inchangé, chantier séparé.

## État des lieux

PROD porte désormais TOUT le schéma v0.4 (multi-tenant + engine + jury paramétrable + settings). L'app PROD déployée (main) n'utilise pas encore ces objets — l'activation produit se fera au merge de la PR #1 (déploiement Vercel) après phase 18.
