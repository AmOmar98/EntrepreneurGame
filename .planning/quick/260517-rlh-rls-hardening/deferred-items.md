# deferred-items — 260517-rlh

## 1. G-08 priv-esc `profiles.app_role` — EXPLOITABLE PROD CONFIRMÉ (2026-05-17)

**Runtime probe résultat :**
- Test user `9c0b65e2-1e3a-4e56-8840-73311d5a8807` (player)
- `SET LOCAL ROLE authenticated` + JWT claim `sub=test_user_id` → `UPDATE profiles SET app_role='game_master' WHERE user_id=auth.uid()` → **SUCCEEDED**
- Reverté immédiatement à `player`. PROD est clean.

**Sévérité : CRITIQUE** (priv-esc complet via anon-key Supabase JS). Pilote terminé donc pas live-blocking, mais N'IMPORTE QUEL Player connecté avec son JWT peut se promouvoir GM.

**Policy fautive :**
```sql
CREATE POLICY profiles_self_or_gm_update ON public.profiles
  FOR UPDATE TO authenticated
  USING  ((user_id = auth.uid()) OR is_game_master())
  WITH CHECK ((user_id = auth.uid()) OR is_game_master());
```

**Fix design proposé (column-level GRANT, PG-native, pas de breaking change RLS) :**
```sql
-- Revoke blanket UPDATE, re-grant column-by-column except app_role
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, locale, mailto_opened_at, updated_at)
  ON public.profiles TO authenticated;
-- app_role + user_id restent gérables UNIQUEMENT via service_role / is_game_master()
```

Alternative (BEFORE UPDATE trigger qui reset OLD.app_role si non-GM) plus défensive mais plus de surface. Préférer column-level GRANT.

**Action requise :** validation Omar + apply via Supabase MCP `apply_migration`.

## 2. G-02 R1 breach `events.pitch_order_json` — CONFIRMÉ PROD (2026-05-17)

**Policy fautive :**
```sql
events_authenticated_select : USING(true)
```

Tout user authenticated lit toutes les colonnes events, y compris `pitch_order_json` AVANT `pitch_order_published_at`. R1 cardinal breach.

**Fix design proposé (column-level GRANT) :**
```sql
REVOKE SELECT ON public.events FROM authenticated;
GRANT SELECT (id, slug, name, description, start_date, end_date, status,
              results_published_at, pitch_order_published_at, created_at, updated_at)
  ON public.events TO authenticated;
-- pitch_order_json reste lisible UNIQUEMENT via is_game_master() (policy events_gm_all couvre)
```

Note : si Player doit voir pitch_order_json APRÈS publish, ajouter une view SECURITY DEFINER `events_with_published_order` qui expose la colonne quand `pitch_order_published_at IS NOT NULL`.

**Action requise :** validation Omar + apply via Supabase MCP.

## 3. Staging Supabase environment

Pas d'env staging dedie aujourd'hui → tester directement sur snapshot PROD ou attendre creation d'un projet staging. A defer separement si besoin d'iterations longues.

## 4. 8 autres gaps (G-01, G-03..G-07, G-09, G-10)

À traiter en suivi après G-08 + G-02 hotfix. Voir `260517-rlh-AUDIT.md` pour le détail par table.
