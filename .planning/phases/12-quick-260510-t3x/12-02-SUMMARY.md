---
phase: "12-quick-260510-t3x"
plan: "12-02"
subsystem: "database/schema"
tags: ["bonus-events", "schema", "rls", "multiplier", "R1-preserve", "idempotent"]
requirements:
  - T3X-EXPANSION-BONUS-EVENTS-SCHEMA
dependency_graph:
  requires:
    - "12-01 (plan import + brief)"
    - "database/schema.sql (public.players, auth.users)"
    - "database/triggers.sql (public.set_updated_at)"
    - "database/rls.sql (helpers is_my_player, is_mentor, is_game_master)"
  provides:
    - "public.bonus_events table + 3 enums + 4 RLS policies"
    - "Idempotent migration applicable via supabase CLI"
    - "Mirror local applicable via psql -f"
  affects:
    - "Plan 12-04 (apply-migrations-gate consumes this migration)"
    - "Plan 12-05 (lib/types.ts BonusType / BonusStatus / MultiplierScope)"
    - "Plan 12-06 (server actions claim/review)"
    - "Plan 12-07 (lib/score.ts multiplier integration)"
    - "Plan 12-08 (Player UI claim form + qualitative boost indicator)"
tech-stack:
  added:
    - "Postgres enum bonus_type (3 variants)"
    - "Postgres enum bonus_status (4 variants)"
    - "Postgres enum multiplier_scope (2 variants)"
    - "numeric(3,2) precision for multiplier_factor"
  patterns:
    - "Idempotent DDL : DO block + duplicate_object exception for enums"
    - "Idempotent policies : DROP IF EXISTS + CREATE"
    - "FK auth.users ON DELETE SET NULL (review trail survives user deletion)"
    - "FK players(id) ON DELETE CASCADE (bonus events follow their player)"
    - "Partial index for hot path (validated + not consumed)"
key-files:
  created:
    - "supabase/migrations/20260510170000_bonus_events_recreate.sql"
    - "database/bonus_events.sql"
  modified: []
decisions:
  - "D-02 honored : architecture dediee — table bonus_events PROPRE, NOT flag-based on deliverable_templates."
  - "D-03 honored : mecanisme multiplier numeric(3,2) [1.00..3.00] avec scope next_deliverable | rest_of_event + multiplier_consumed_at."
  - "R1 preserve : multiplier_factor stocke en DB mais JAMAIS expose Player en chiffre (UI responsable plan 08)."
  - "Pas de unique (project_id, type) : permettre re-claim apres rejet (unicite active = max(claimed_at) where status=validated)."
  - "CHECK constraint coherence : status validated|rejected ⇒ reviewed_by/at NOT NULL ; draft|submitted ⇒ reviewed_by/at NULL."
  - "Pas d'INSERT seed : les types vivent en enum, les claims naissent runtime via claimBonusEventFlow (Plan 06)."
  - "freeze v0.3 SEED-001 respecte : aucune modification de schema.sql/triggers.sql/rls.sql (additif via migration + mirror separe)."
metrics:
  duration: "~12 min"
  completed: "2026-05-10"
  tasks: 3
  files: 2
  commits: 1
---

# Phase 12 Plan 02: Recreate bonus_events schema + RLS + multiplier mechanism Summary

Recreated the `public.bonus_events` schema (retired in v0.2) with a dedicated architecture (D-02), multiplier mechanism (D-03), 4 RLS policies enforcing R1, and a strict byte-mirror between the Supabase migration and the local apply file.

## 1. Schema bonus_events (17 colonnes + 3 enums + 4 RLS + 3 indexes + 1 trigger)

**Table `public.bonus_events`** — 17 colonnes :
- Identity : `id uuid PK`, `project_id uuid → players(id) ON DELETE CASCADE`
- Claim : `type bonus_type`, `title text`, `description text default ''`, `doc_url text`
- Lifecycle : `status bonus_status default 'submitted'`, `claimed_at timestamptz default now()`, `claimed_by uuid → auth.users(id) ON DELETE SET NULL`
- Review : `reviewed_by uuid → auth.users(id) ON DELETE SET NULL`, `reviewed_at timestamptz`, `feedback text default ''`
- Multiplier : `multiplier_factor numeric(3,2) default 1.50 CHECK [1.00..3.00]`, `multiplier_scope multiplier_scope default 'next_deliverable'`, `multiplier_consumed_at timestamptz`
- Audit : `created_at`, `updated_at` (auto-maintained via trigger)
- Cross-field CHECK : `(draft|submitted ⇒ reviewed_* NULL) OR (validated|rejected ⇒ reviewed_* NOT NULL)`

**3 enums** (idempotent via DO block + exception duplicate_object) :
- `bonus_type` = `bonus_verbatims_terrain | bonus_dev_plan | bonus_prototype_draft`
- `bonus_status` = `draft | submitted | validated | rejected`
- `multiplier_scope` = `next_deliverable | rest_of_event`

**4 RLS policies** :
- `bonus_events_select` — Player (is_my_player) OR Mentor/GM (is_mentor)
- `bonus_events_player_insert` — own player + claimed_by=auth.uid() + status='submitted' + reviewed_* NULL ; OR GM bypass
- `bonus_events_mentor_update` — Mentor OR GM (validation/rejection)
- `bonus_events_gm_delete` — GM only

**3 indexes** :
- `bonus_events_project_idx (project_id)` — hot FK
- `bonus_events_status_idx (status)` — filter by lifecycle
- `bonus_events_validated_active_idx (project_id, claimed_at) WHERE status='validated' AND multiplier_consumed_at IS NULL` — hot path lib/score.ts (plan 07)

**1 trigger** :
- `trg_bonus_events_updated_at` BEFORE UPDATE → reuses `public.set_updated_at` from `database/triggers.sql` (zero modification du fichier source).

## 2. Multiplier mechanism (D-03)

- `multiplier_factor numeric(3,2)` — coefficient [1.00..3.00] enforced par CHECK constraint. Defense-in-depth : `lib/score.ts` (Plan 07) applique aussi `Math.min(3.0, …)` cap global, et choisit le max parmi les actifs (pas de stacking).
- `multiplier_scope` :
  - `next_deliverable` = consomme au 1er score post-claim (Plan 07 set `multiplier_consumed_at = now()` lors du recompute submission).
  - `rest_of_event` = persiste jusqu'à `events.ends_at` (Plan 07 filtre by event timeline).
- Mapping reference des 3 types (documente en commentaire SQL §6, applique runtime par `claimBonusEventFlow` Plan 06) :
  - `bonus_verbatims_terrain` → 1.50× next_deliverable
  - `bonus_dev_plan` → 1.50× next_deliverable
  - `bonus_prototype_draft` → 2.00× next_deliverable

## 3. R1 preservation

**Où le multiplier_factor est exposé** :
- DB only : column `bonus_events.multiplier_factor`, CHECK constraint, comment, partial index predicate.
- Server-side : `lib/score.ts` (Plan 07) lit la valeur pour multiplier les scores ; jamais retournée verbatim au client Player.

**Où il NE DOIT PAS apparaître** (responsabilité plans aval, non couvert ici) :
- Plan 08 (Player UI claim form + indicator) : afficher uniquement « Boost actif » qualitatif, jamais le chiffre `1.50` ou `2.00`.
- Audit grep R1 post-Plan 08 : `grep -rn "multiplier_factor\|x[0-9]\." app/journey app/mission components/*player*` doit retourner 0 hit côté Player.

**Vérification grep clean (post-commit)** : `Select-String -Pattern '/140|percentile|score_total|rank ' supabase/migrations/20260510170000_*, database/bonus_events.sql` → **0 hit**. R1 preserved côté schema.

## 4. Idempotency strategy

- **Enums** : 3 DO blocks `BEGIN ... CREATE TYPE ... EXCEPTION WHEN duplicate_object THEN NULL` → re-apply = no-op.
- **Table** : `CREATE TABLE IF NOT EXISTS` → re-apply = no-op.
- **Indexes** : `CREATE INDEX IF NOT EXISTS` (3×) → re-apply = no-op.
- **Trigger** : `DROP TRIGGER IF EXISTS … ; CREATE TRIGGER …` → re-apply = no-op.
- **Policies** : `DROP POLICY IF EXISTS … ; CREATE POLICY …` (4×) → re-apply = no-op (pattern recommande Supabase).
- **Grants** : `GRANT … TO authenticated, service_role` → idempotent par definition Postgres.
- **Aucun** `DROP TABLE`, `TRUNCATE`, `DELETE FROM` → safe migration.

## 5. Mirror SQL preserved

- `supabase/migrations/20260510170000_bonus_events_recreate.sql` — source de verite Supabase CLI (apply via `supabase migration up`).
- `database/bonus_events.sql` — mirror local (apply via `psql $SUPABASE_DB_URL -f`).
- Vérification post-commit : `Get-Content … | Select-Object -Skip 11 | Compare-Object` → **0 line diff past header**. Body parfait byte-identique des lignes 12 à fin.
- Seul l'en-tête diffère (11 lignes vs 11 lignes — adresse + apply instructions ; le reste DDL est strictement mirror).

## 6. Apply path operator (Wave 2 prêt à consommer)

```bash
# Option A — Supabase CLI (recommande, applique migration declaree)
supabase migration up

# Option B — psql direct (utile pour test local OU patch prod manuel apres backup)
psql $SUPABASE_DB_URL -f database/bonus_events.sql
psql $SUPABASE_DB_URL -f database/bonus_events.sql  # 2eme run = no-op idempotent
```

Plan **12-04 `apply-migrations-gate`** (Wave 1.5 blocking, depends_on [12-02, 12-03]) — patché via quick `260510-rxa` (`8f03c68`) — est le gate operator qui executera Option A en PROD apres revue. Aucune consommation TS (plans 12-05+) ne doit demarrer avant que 12-04 confirme l'apply.

## 7. Files modified

**2 fichiers créés** :
- `supabase/migrations/20260510170000_bonus_events_recreate.sql` (168 lignes, 1 migration Supabase déclarative)
- `database/bonus_events.sql` (165 lignes, mirror local pour psql -f)

**0 fichier core modifié** : `database/schema.sql`, `database/triggers.sql`, `database/rls.sql` intacts (freeze SEED-001 v0.3 respecté — l'architecture additive via fichier dédié évite tout regen mass-edit du core).

**Commit atomique** : `06b60d3` — `feat(t3x-bonus): recreate bonus_events schema + RLS + multiplier mechanism (D-02 D-03)`.

## 8. Next consumers (downstream plans)

| Plan | Consume | Wave |
|------|---------|------|
| 12-03 | Mirror seed data (if needed) — autonomous mirror task in parallel | 1 |
| 12-04 | **apply-migrations-gate** — operator runs `supabase migration up` against PROD | 1.5 (blocking) |
| 12-05 | TypeScript types : `BonusType`, `BonusStatus`, `MultiplierScope`, `BonusEvent` row shape | 2 |
| 12-06 | Server actions : `claimBonusEventFlow`, `reviewBonusEventFlow` (with mailto draft) | 2 |
| 12-07 | `lib/score.ts` multiplier integration : filter validated + not consumed, apply max factor, Math.min(3.0), update `multiplier_consumed_at` on apply | 3 |
| 12-08 | Player UI claim form + qualitative "Boost actif" indicator (R1 critical surface) | 3 |

## Deviations from Plan

**1. [Rule 3 - Blocking issue] Mirror header line-count alignment**
- **Found during:** Task 2 verification (mirror diff Compare-Object Select-Object -Skip 11)
- **Issue:** Plan stated "the 11 first lines" pour le mirror header, but le bloc DDL de la migration en Task 1 avait 15 lignes header → `Select-Object -Skip 11` du verification command produisait 3 lignes de drift.
- **Fix:** Tightened both file headers to exactly 11 lines (compressed migration apply order + idempotency notes into 2 lines instead of 4), preserving all essential info. Body from "1. Enums" onwards remains byte-identical between the two files.
- **Files modified:** `supabase/migrations/20260510170000_bonus_events_recreate.sql` (header lines 1-11), `database/bonus_events.sql` (header lines 1-11)
- **Verification:** `Compare-Object (Get-Content … | Skip 11)` returns null = parfait mirror past header.
- **Commit:** `06b60d3` (fix inclus dans le commit unique du plan)

## Auth Gates

None — pure SQL DDL plan, no runtime auth involved.

## Known Stubs

None — pure schema work. The 3 reference multiplier_factor values (1.50, 1.50, 2.00) documented in §6 comment block are NOT stubs : they are the design reference (D-03) that `claimBonusEventFlow` Plan 06 will read from the type→factor mapping table. The schema doesn't enforce these values (only the [1.00..3.00] range CHECK), allowing GameMaster override post-pilote.

## Self-Check: PASSED

**Files exist:**
- FOUND: `supabase/migrations/20260510170000_bonus_events_recreate.sql`
- FOUND: `database/bonus_events.sql`

**Commit exists:**
- FOUND: `06b60d3` (`feat(t3x-bonus): recreate bonus_events schema + RLS + multiplier mechanism (D-02 D-03)`)

**Acceptance criteria automated (9/9 PASS) :**
- `Test-Path` migration → True ✓
- `create type public.bonus_type` hits → 1 ✓
- `bonus_verbatims_terrain` hits → 2 (enum + comment) ✓
- `bonus_dev_plan` hits → 2 ✓
- `bonus_prototype_draft` hits → 2 ✓
- `create table if not exists public.bonus_events` hits → 1 ✓
- `create policy` hits → 4 (select, player_insert, mentor_update, gm_delete) ✓
- `multiplier_factor numeric(3,2)` hits → 1 ✓
- R1 grep (/140|percentile|rank ) hits → 0 ✓

**Mirror diff (Skip 11, Compare-Object) :** 0 diff lines past header → PARFAIT ✓

**DDL completeness :** 12 hits (1 table + 4 policies + 3 indexes + 1 trigger + 3 types) ✓

**R1 audit final (both files) :** 0 leak ✓
