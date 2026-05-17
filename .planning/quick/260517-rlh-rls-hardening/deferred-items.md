# deferred-items — 260517-rlh

## 1. G-08 priv-esc `profiles.app_role` — FIXED 2026-05-17

**Probe résultat AVANT fix :** EXPLOITABLE PROD (test user `9c0b65e2-1e3a-4e56-8840-73311d5a8807` updated app_role player→game_master, reverté).

**Fix appliqué via MCP :** migration `20260517224847_profiles_lock_app_role_column_grant` — column-level GRANT (`REVOKE UPDATE ON profiles FROM authenticated; GRANT UPDATE (full_name, email, updated_at) ON profiles TO authenticated;`).

**Probe APRÈS fix :** priv-esc UPDATE returns `permission denied for table profiles` ✓ ; UPDATE legitime sur `full_name` succeeds ✓.

Fichier paper-trail : `supabase/migrations/20260517224847_profiles_lock_app_role_column_grant.sql`. Manifest log dans `database/MANIFEST.md`.

## 2. G-02 R1 breach `events.pitch_order_json` — DEFERRED to quick `260517-g02`

**Confirmé EXPLOITABLE PROD** mais le fix simple `REVOKE SELECT (pitch_order_json) FROM authenticated` casse 3 callsites lecture qui passent par JWT user (lib/pitch-prep.ts, lib/jury.ts, app/admin/page.tsx). Fix correct nécessite refactor code (SECURITY DEFINER function OU server-actions via service_role).

**Skeleton créé :** `.planning/quick/260517-g02-pitch-order-secdef-or-codepath/PLAN.md` — 3 options (A/B/C) à comparer en discuss-phase avant exécution.

**Pilote terminé** donc pas live-blocking ; à traiter avant le prochain event.

## 3. Staging Supabase environment

Pas d'env staging dedie aujourd'hui → tester directement sur snapshot PROD ou attendre creation d'un projet staging. A defer separement si besoin d'iterations longues.

## 4. 8 autres gaps (G-01, G-03..G-07, G-09, G-10)

À traiter en suivi après G-08 + G-02 hotfix. Voir `260517-rlh-AUDIT.md` pour le détail par table.
