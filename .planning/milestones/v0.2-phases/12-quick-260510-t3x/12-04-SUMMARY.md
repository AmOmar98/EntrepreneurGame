---
phase: "12-quick-260510-t3x"
plan: "12-04"
status: complete
completed: 2026-05-10
applied_via: "Supabase MCP apply_migration"
project_ref: "vzzbjxmfkmvqkaqxalhr"
---

# Plan 12-04 — Apply Migrations Gate (Wave 1.5 BLOCKING)

## Applied

Two migrations applied to PROD Supabase (project `vzzbjxmfkmvqkaqxalhr` — EntrepreneurGame, region eu-west-1, ACTIVE_HEALTHY) via `mcp__plugin_supabase_supabase__apply_migration` :

1. `bonus_events_recreate_t3x` (mirror of `supabase/migrations/20260510170000_bonus_events_recreate.sql`)
2. `moscow_cards_t3x` (mirror of `supabase/migrations/20260510170100_moscow_cards.sql`)

Both returned `{success: true}`.

## Verification (single query)

```sql
select 
  (select count(*) from pg_tables where schemaname='public' and tablename in ('bonus_events','moscow_cards')) as tables_count,
  (select count(*) from pg_type where typname in ('bonus_type','bonus_status','multiplier_scope','moscow_bucket')) as enums_count,
  (select count(*) from pg_policies where tablename in ('bonus_events','moscow_cards')) as policies_count,
  (select count(*) from pg_trigger where tgname in ('trg_bonus_events_updated_at','trg_moscow_cards_updated_at')) as triggers_count;
```

Result : `{tables_count: 2, enums_count: 4, policies_count: 8, triggers_count: 2}` — **all expected counts met**.

## Acceptance criteria

- [x] 2 migrations appliquées en prod Supabase
- [x] 4 enums présents (`bonus_type`, `bonus_status`, `multiplier_scope`, `moscow_bucket`)
- [x] 8 RLS policies actives (4 par table)
- [x] 2 triggers `updated_at` attachés
- [x] Idempotency garantie par DDL (DO block + IF NOT EXISTS + DROP+CREATE) — re-apply MCP serait no-op
- [x] Wave 2 (Plans 12-05/06/07) débloquée : `npm run dev` ne lèvera plus `relation "public.bonus_events" does not exist`

## Note

Plan 12-04 est un gate ops sans modification de code. Aucun commit applicatif n'est créé par ce plan (seul ce SUMMARY est ajouté à `.planning/` pour traçabilité).

L'apply a été exécuté par Claude via le MCP Supabase plutôt que par Omar via `npx supabase migration up --linked` (mode autonome user explicite : « execute la migration pas de données sensibles actuellement »).
