---
phase: "12-quick-260510-t3x"
plan: "12-03"
subsystem: "database/schema-moscow"
tags: [schema, rls, kanban, moscow, t3x-expansion]
requires:
  - "12-01"
provides:
  - "T3X-EXPANSION-MOSCOW-CARDS-SCHEMA"
affects:
  - supabase/migrations/20260510170100_moscow_cards.sql
  - database/moscow_cards.sql
tech-stack:
  added:
    - "PG enum public.moscow_bucket (must/should/could/wont)"
    - "PG table public.moscow_cards (DnD-friendly: ord smallint mutable)"
  patterns:
    - "Idempotent migration (DO block enum, IF NOT EXISTS, DROP+CREATE policies)"
    - "Mirror SQL pair (supabase/migrations/ + database/) with 11-line header skip-diff convention"
    - "RLS Player CRUD complet via helpers is_my_player / is_mentor / is_game_master"
key-files:
  created:
    - supabase/migrations/20260510170100_moscow_cards.sql
    - database/moscow_cards.sql
  modified: []
decisions:
  - "D-04 anchor : DnD client = @dnd-kit/core (Plan 09). Schema reste DnD-agnostic — ord smallint mutable suffit."
  - "Pas d'unique constraint sur (project, deliverable, bucket, ord) — DnD swap-pair update non-atomic en RLS, on tolere doublons d'ord et UI gere tri stable."
  - "FK ON DELETE CASCADE sur project_id ET deliverable_template_id (suppression naturelle des cartes orphelines)."
  - "FK ON DELETE SET NULL sur created_by (auth.users.id) — la suppression d'un compte ne casse pas les cartes."
  - "CHECK length(feature) 1..200 = invariant DDL legitime (carte vide = bug). pourquoi/contrainte peuvent etre vides (warn-only cote rubric Plan 06, R2 preserve)."
metrics:
  duration: "~6min"
  completed: "2026-05-10"
  tasks: 3
  files: 2
---

# Phase 12 Plan 03: moscow_cards schema for Kanban native persistence Summary

DDL schema pour la persistance native du Kanban MoSCoW (livrable #4 `fiche-produit-plan-dev-v1`) : 1 enum `moscow_bucket` + 1 table `moscow_cards` + 4 RLS policies + 3 indexes + 1 trigger `updated_at`, livre via migration Supabase idempotente avec mirror local byte-identique.

## 1. Schema moscow_cards — 11 colonnes + enum + 4 RLS + 3 indexes + trigger

**Table `public.moscow_cards`** (11 colonnes) :
- `id` uuid PK default `gen_random_uuid()`
- `project_id` uuid NOT NULL FK `players(id)` ON DELETE CASCADE
- `deliverable_template_id` uuid NOT NULL FK `deliverable_templates(id)` ON DELETE CASCADE
- `bucket` `public.moscow_bucket` NOT NULL
- `ord` smallint NOT NULL DEFAULT 0
- `feature` text NOT NULL CHECK `length(trim(feature)) >= 1 AND length(feature) <= 200`
- `pourquoi` text NOT NULL DEFAULT '' CHECK `length <= 500`
- `contrainte` text NOT NULL DEFAULT '' CHECK `length <= 200`
- `created_by` uuid FK `auth.users(id)` ON DELETE SET NULL
- `created_at` timestamptz NOT NULL DEFAULT now()
- `updated_at` timestamptz NOT NULL DEFAULT now()

**Enum `public.moscow_bucket`** : `must` / `should` / `could` / `wont` (4 valeurs strictes).

**RLS — 4 policies pour Player CRUD complet + GM fallback** :
1. `moscow_cards_select` — `is_my_player(project_id) OR is_mentor()`
2. `moscow_cards_player_insert` — `(is_my_player AND created_by = auth.uid()) OR is_game_master()`
3. `moscow_cards_player_update` — `is_my_player OR is_game_master()` (re-bucket, edit feature, reorder via ord)
4. `moscow_cards_player_delete` — `is_my_player OR is_game_master()` (suppression carte)

**Indexes** :
- `moscow_cards_project_idx` sur `(project_id)`
- `moscow_cards_deliverable_idx` sur `(deliverable_template_id)`
- `moscow_cards_kanban_view_idx` sur `(project_id, deliverable_template_id, bucket, ord)` — couvre la query principale du Kanban Plan 09

**Trigger** : `trg_moscow_cards_updated_at BEFORE UPDATE` reuse `public.set_updated_at` (defini dans `database/triggers.sql`).

## 2. DnD-friendly design — ord smallint mutable, swap simple via UPDATE

L'architecture du Kanban (Plan 09 via `@dnd-kit/core`) ne necessite que :
- **Re-bucket** : `UPDATE moscow_cards SET bucket = $new_bucket WHERE id = $card_id` (une carte change de colonne).
- **Reorder** : `UPDATE moscow_cards SET ord = $new_ord WHERE id = $card_id` (positionnement dans la colonne).

Pas d'unique constraint sur `(project_id, deliverable_template_id, bucket, ord)` car le swap-pair (echange de 2 cartes) en SQL/RLS necessiterait soit :
- une transaction explicite (impossible cote action server sans plpgsql),
- soit un offset temporaire (~bricolage),
- soit un re-numbering complet (cout O(n)).

Plan 06 `reorderMoscowCardsFlow` fera un **UPDATE batch idempotent** : re-applique l'ordre complet (0..N) apres un drag. Pas d'unique = pas de race, UI gere le tri stable.

## 3. R1/R2/R3 preservation — 0 score, warn-only via rubric (pas DDL), no blocking

- **R1** : 0 colonne `score`, `rank`, `points`, `/140`, `percentile`. Audit grep verifie : `Select-String -Pattern "score\|rank\|/140\|percentile" => 0 hit`. La carte est purement contenu pedagogique (feature/pourquoi/contrainte) — les notes vivent ailleurs (submissions/evaluations).
- **R2** : Les recommandations rubric MoSCoW (>=2 MUST, >=1 WONT) sont **warn-only au niveau application** (Plan 06 zod, Plan 09 UI hint). **Aucun trigger SQL ne rejette** une INSERT/UPDATE basee sur ces seuils. CHECK `length(feature) >= 1` reste un invariant DDL legitime (carte vide = bug logique, pas warn).
- **R3** : Aucun trigger qui bloque les autres tables (submissions, evaluations) depuis moscow_cards. CASCADE safe : `DELETE deliverable_template -> DELETE cartes liees` (consistance, pas blocage). Aucun `blocks_progression_to` ni `disabled` codes en dur.

## 4. Idempotency — DO block enum, IF NOT EXISTS, DROP+CREATE policies

Migration re-applicable a l'infini sans erreur :
- Enum cree via `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$`
- Table via `CREATE TABLE IF NOT EXISTS`
- Indexes via `CREATE INDEX IF NOT EXISTS`
- Trigger via `DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER ...`
- Policies via `DROP POLICY IF EXISTS ... ; CREATE POLICY ...`
- Grants explicites (rejouables sans erreur)

Test idempotence (manuel, post-apply) :
```bash
psql $SUPABASE_DB_URL -f database/moscow_cards.sql
psql $SUPABASE_DB_URL -f database/moscow_cards.sql  # 2e run = no-op
```

## 5. Mirror SQL — database/moscow_cards.sql <-> supabase/migrations/20260510170100_*

Pair de fichiers strictement byte-identique au-dela de l'en-tete 11 lignes :
- `supabase/migrations/20260510170100_moscow_cards.sql` (canonical pour `supabase migration up`)
- `database/moscow_cards.sql` (mirror pour `psql -f` direct)

Convention header 11 lignes pour aligner avec Plan 12-02 `bonus_events`. Diff verification :
```bash
diff <(tail -n +12 supabase/migrations/20260510170100_moscow_cards.sql) \
     <(tail -n +12 database/moscow_cards.sql)
# => silence (byte-identical)
```

## 6. Apply path operator

**Path Supabase officiel** :
```bash
supabase migration up
```

**Path manuel psql** (pour Omar, hors CI) :
```bash
psql $SUPABASE_DB_URL -f database/moscow_cards.sql
```

Les deux paths sont equivalents (la migration vit dans `supabase/migrations/`, le mirror est byte-identique apres header).

Apply gate prod : la migration ne sera **pas** appliquee en production tant que le Plan 12-04 (apply gate Supabase) n'est pas execute. Cela suit la convention v0.3 SEED-001 (schema core freeze).

## 7. Files modified — 2 fichiers, schema core intact

| Fichier | Type | Lignes |
| ------- | ---- | ------ |
| `supabase/migrations/20260510170100_moscow_cards.sql` | created | 111 |
| `database/moscow_cards.sql` | created | 111 |

**Schema core intact** : `database/schema.sql`, `database/triggers.sql`, `database/rls.sql`, `database/seed_event_hackdays.sql` non modifies (freeze v0.3 SEED-001 preserve).

## 8. Next consumers

| Plan | Owner | Consomme moscow_cards via |
| ---- | ----- | ------------------------- |
| 12-04 | apply-migrations-gate | psql -f apply en prod (gating manuel) |
| 12-05 | types | `lib/types.ts` exporte `MoscowBucket`, `MoscowCard` (mirror enum + table) |
| 12-06 | server actions | `app/actions.ts` : `createMoscowCardFlow`, `updateMoscowCardFlow`, `deleteMoscowCardFlow`, `reorderMoscowCardsFlow`, `submitMoscowDeliverableFlow` |
| 12-09 | UI Kanban | `components/moscow-kanban.tsx` (DnD via @dnd-kit/core) + `app/journey/deliverable/[id]/page.tsx` |
| 12-10 | SSR snapshot | `app/journey/deliverable/[id]/moscow-snapshot/route.ts` (JSON viewer pour submission proof) |
| 12-11 | CSV export | `app/admin/export/moscow-cards.csv/route.ts` (GM cohort review) |

## Deviations from Plan

None — plan execute exactement comme ecrit. Header 11 lignes respecte la convention Plan 12-02 confirmee par le contexte orchestrator.

## Commit

| Hash | Message |
| ---- | ------- |
| `afa3d19` | `feat(t3x-moscow): add moscow_cards schema for Kanban native persistence (D-04)` |

## Self-Check: PASSED

- [x] `supabase/migrations/20260510170100_moscow_cards.sql` exists (Test-Path True)
- [x] `database/moscow_cards.sql` exists (Test-Path True)
- [x] Commit `afa3d19` present (`git log --oneline -1`)
- [x] Mirror byte-identical post-skip-11 (diff silence)
- [x] R1 audit clean (0 hit on score/rank/percentile/140)
- [x] 1 enum + 1 table + 3 indexes + 4 policies + 1 trigger = 10 DDL statements
- [x] Acceptance criteria Task 1: 6/6 pass
- [x] Acceptance criteria Task 2: 2/2 pass
- [x] Acceptance criteria Task 3: 3/3 pass
