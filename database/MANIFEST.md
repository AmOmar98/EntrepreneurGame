# Database Migrations Manifest

> **Policy actée** par Omar le 2026-05-17 — **Option A : coexistence minimal-change**.
> Promu depuis `.planning/quick/260517-mga-migrations-gate-paper-trail/MANIFEST-draft.md`.
> Voir aussi `.planning/quick/260517-mga-…/260517-mga-AUDIT.md` pour l'inventaire détaillé.

## Source-of-Truth (Option A)

```
PROD Supabase = (database/schema.sql ; database/triggers.sql ; database/rls.sql)   ← bootstrap déclaratif
              + supabase/migrations/*                                                ← CLI-tracké, autorité
              + (legacy) database/migrations/*                                       ← archive frozen, ne plus ajouter
```

- **`supabase/migrations/`** — dir CLI-tracké, **autorité pour toutes les futures migrations**. Format `YYYYMMDDHHMMSS_<short_slug>.sql`. C'est ce que Supabase enregistre dans la table `schema_migrations` et ce qui doit refléter l'état réel appliqué en PROD.
- **`database/migrations/`** — dir frozen, **archive authoring uniquement**. Ne plus ajouter de nouveau fichier ici. Les 8 fichiers existants restent pour traçabilité historique.
- **`database/schema.sql` + `triggers.sql` + `rls.sql`** — vue déclarative cumulative. À maintenir à la main quand une migration ajoute/modifie tables/triggers/policies, pour qu'un bootstrap fresh reproduise PROD sans replay de l'historique.

## Règles pour les futures migrations

1. **Author directement dans `supabase/migrations/`** avec timestamp UTC : `YYYYMMDDHHMMSS_<short_slug>.sql`. Le timestamp doit être strictement croissant par rapport au dernier appliqué.
2. **Idempotent ou wrappé en transaction** — utiliser `IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `ON CONFLICT DO UPDATE`, etc. Les replays/dry-runs/re-applies après soft-reset doivent passer sans erreur.
3. **Apply via `supabase db push --linked`** (CLI) pour le flow normal. **Supabase MCP `apply_migration`** est autorisé uniquement pour hotfix qui doit landed avant le prochain CLI push (la version MCP doit ensuite être copiée dans `supabase/migrations/` avec le même `version_name.sql` pour garder l'historique cohérent).
4. **Refléter l'état cumulatif dans `database/schema.sql`** quand la migration altère tables/columns/enums. Triggers → `database/triggers.sql`, RLS policies → `database/rls.sql`.
5. **Ne PAS ajouter de nouveau fichier dans `database/migrations/`.** Si tu te retrouves à vouloir le faire, écris dans `supabase/migrations/` à la place.

## Out-of-band apply log (MCP)

Hotfix appliqués via Supabase MCP `apply_migration` en dehors du CLI push. Le fichier `.sql` correspondant dans `supabase/migrations/` est créé après-coup avec le même `version_name`.

| Date UTC | Version | Name | Raison |
|---|---|---|---|
| 2026-05-11 | `20260511192300` | `fix_evaluation_comments_grants` | Hotfix F-16-01 RLS grants (cf. quick `260511-sbt`) |
| 2026-05-17 | `20260517224847` | `profiles_lock_app_role_column_grant` | G-08 hotfix : column-level GRANT bloque priv-esc `app_role` self-update (cf. quick `260517-rlh`) |
| 2026-05-17 | `20260517224914` | `phase14_engagement_trigger` | Apply post-pilot du trigger engagement (cf. quick `260517-mga` reconciliation) |
| 2026-05-17 | `20260517225015` | `rls_initplan_fix` | Supabase advisor `auth_rls_initplan` — wrap `auth.uid()` (15 policies) |
| 2026-05-17 | `20260517225027` | `multiple_permissive_fix` | Supabase advisor `multiple_permissive_policies` — split `xxx_gm_all` sur 5 tables |
| 2026-05-17 | `20260517225034` | `fk_indexes` | Supabase advisor `unindexed_foreign_keys` — 7 covering indexes |

## Apply order pour bootstrap fresh

1. `database/schema.sql` (enums, tables, generated columns)
2. `database/triggers.sql` (XP ledger, updated_at, stage transitions)
3. `database/rls.sql` (helpers `has_role`, `is_staff`, policies)
4. `supabase db push --linked` (replay des migrations CLI-tracked)
5. (optionnel) `database/seed_bootcamp.sql` (données pilote)

## Inventaire — voir `260517-mga-AUDIT.md`

L'inventaire détaillé (24 fichiers, twins identiques, divergences, orphans) vit dans `.planning/quick/260517-mga-migrations-gate-paper-trail/260517-mga-AUDIT.md`. Mise à jour 2026-05-17 : tous les orphans `database/migrations/202605*.sql` ont été appliqués en PROD via MCP (voir log out-of-band ci-dessus) et copiés dans `supabase/migrations/`.

## Références

- `database/README.md` — bootstrap procedure
- `supabase/config.toml` — CLI project link (project `vzzbjxmfkmvqkaqxalhr`)
- `.planning/quick/260510-lu5-b3retro-apply-migrations-phase-8-9-to-pr/` — origine du pattern `database/migrations/` → `supabase/migrations/` copy
- `.planning/quick/260517-mga-migrations-gate-paper-trail/` — inventaire complet + decision context
- `CLAUDE.md` § Database — apply order summary + pre-edit guards
