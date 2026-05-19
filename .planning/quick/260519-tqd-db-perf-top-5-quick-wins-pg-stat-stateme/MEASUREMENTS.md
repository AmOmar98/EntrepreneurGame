# MEASUREMENTS — Baseline perf PROD (quick 260519-tqd)

**Captured:** 2026-05-19 (J-1 Digi-Hackathon 20-22 mai)
**Project:** `vzzbjxmfkmvqkaqxalhr` (EntrepreneurGame)
**Postgres:** 17.6.1.121
**State context:** Post 5 migrations 2026-05-17 (G-08 grant lock + engagement trigger + RLS initplan fix + permissive split + 7 FK indexes). Cf. `database/MANIFEST.md`.

---

## 1. Region alignment (FINDING)

| Element | Region | Latence vs Paris |
|---|---|---|
| Vercel deployment (`vercel.json`) | `cdg1` (Paris) | 0 ms |
| Supabase project `vzzbjxmfkmvqkaqxalhr` | **`eu-west-1` (Dublin)** | **+30-50 ms RTT** |

**Status:** Désalignement détecté mais accepté pour le pilote (migration région = downtime, hors fenêtre J-1).
**Defer to:** post-pilote v0.3 (cf. `deferred-items.md`).

---

## 2. Volume PROD actuel (état post-wipe pré-pilote)

| Table | Rows |
|---|---:|
| players | 10 |
| submissions | **0** |
| evaluations | **0** |
| deliverable_templates | 25 |
| missions | 13 |
| events | 2 (AgreenTech archivé + Digi-Hackathon) |

**Implication baseline** : EXPLAIN ANALYZE sur `submissions`/`evaluations` retourne **Seq Scan trivial sur 0 rows** — impossible de mesurer le gain réel des indexes proposés avant que le pilote génère du volume. Re-mesure J+1 (21 mai matin) ou post-pilote (22 mai soir) requise.

---

## 3. pg_stat_statements top queries (hot path PROD réel)

`pg_stat_statements 1.11` actif. Top 13 queries hors `pg_*`/`BEGIN/COMMIT/SET` :

| # | Query (résumé) | Calls | Mean (ms) | Total (ms) | Source |
|---|---|---:|---:|---:|---|
| 1 | `realtime.list_changes(...)` — internal | 96 957 | 5.09 | 493 320 | Supabase Realtime (interne, hors scope) |
| 2 | `SELECT name FROM pg_timezone_names` | 77 | 444.51 | 34 227 | Reflection — hors scope |
| 3 | `submissions WHERE player_id = ANY(...) ORDER BY submitted_at DESC` | 374 | 15.73 | 5 882 | **Journey hot path** (lib/journey.ts) |
| 4 | `realtime.subscription INSERT` | 282 | 12.98 | 3 660 | Realtime |
| 5 | `submissions WHERE deliverable_template_id = ANY(...) AND status = ANY(...)` | 293 | 10.81 | 3 168 | **Cohort-pulse / admin** (lib/cohort-pulse.ts) |
| 6 | PostgREST proc reflection | 77 | 35.77 | 2 754 | Internal |
| 7 | `players WHERE cohort_id=$1 AND status=$2` | 293 | 8.25 | 2 418 | **Admin counters** |
| 8 | `evaluations WHERE evaluator_id=$1 AND submission_id = ANY(...)` | 282 | 8.53 | 2 405 | **Mentor self-eval lookup** (lib/mentor.ts) |
| 9 | `players WHERE cohort_id = ANY(...) ORDER BY name` | 455 | 5.26 | 2 392 | **Admin players list** |
| 10 | PostgREST relation reflection | 77 | 22.28 | 1 716 | Internal |
| 11 | `pg_type` resolution | 36 | 44.39 | 1 598 | Internal |
| 12 | `pg_backup_start(...)` | 12 | 129.26 | 1 551 | Internal backup |
| 13 | `INSERT INTO submissions` | 114 | 12.41 | 1 414 | Submission write path |
| **14** | `player_members LEFT JOIN players WHERE user_id=$1` | **2 107** | **0.59** | **1 238** | **MIDDLEWARE onboarding gate** (utils/supabase/middleware.ts) |

**Key insights** :
- Query #14 = `player_members WHERE user_id=$1` appelée **2107 fois** depuis le middleware. Coût unitaire bas (0.59 ms) mais **volume confirme finding brainstorm agent 2** : skip middleware DB sur `/api/*` + `/_next/data/*` aurait éliminé une fraction non négligeable.
- Queries #3, #5, #7, #8, #9 sont les hot reads applicatifs. Mean stable 5-15 ms — sain au volume actuel.
- Aucune query applicative >50 ms mean.

---

## 4. Indexes existants sur tables hot (état post-17/05)

### `submissions`
- `submissions_pkey` (UNIQUE id)
- `submissions_player_id_idx` — `(player_id)`
- `submissions_deliverable_template_id_idx` — `(deliverable_template_id)`
- `submissions_submitted_by_idx` — `(submitted_by)` *(ajouté 17/05 fk_indexes)*
- **`submissions_player_id_deliverable_template_id_version_key` — UNIQUE `(player_id, deliverable_template_id, version)`** ⬅ **Couvre déjà ma proposition d'index composite Task 1.2 idée #1** (Postgres peut utiliser un index UNIQUE pour des lookups non-unique sur préfixe).

### `evaluations`
- `evaluations_pkey` (UNIQUE id)
- `evaluations_evaluator_id_idx` — `(evaluator_id)`
- `evaluations_submission_id_idx` — `(submission_id)`
- `evaluations_submission_id_evaluator_id_key` — UNIQUE `(submission_id, evaluator_id)`

### `player_members`
- `player_members_pkey` (UNIQUE id)
- `player_members_player_id_idx` — `(player_id)`
- `player_members_user_id_idx` — `(user_id)` ⬅ Indexé, query #14 utilise déjà cet index.
- `player_members_player_id_user_id_key` — UNIQUE `(player_id, user_id)`

### `help_requests` (NEW depuis 12/05, non couvert par 17/05)
- `help_requests_pkey`, `help_requests_player_idx`, `help_requests_status_created_idx`, `help_requests_assigned_mentor_idx`
- **Missing** : `acknowledged_by_fkey`, `requested_by_fkey`, `resolved_by_fkey` (cf. advisor §5)

---

## 5. Supabase Advisor (Performance) — 17 findings

### WARN (2)
- `auth_rls_initplan` sur `help_requests_player_insert_own` — résiduel, raté par la migration `20260517225015_rls_initplan_fix` (table `help_requests` ajoutée le 12/05, le fix ne l'a pas couverte).
- `multiple_permissive_policies` sur `help_requests` SELECT (`help_requests_mentor_select_all` + `help_requests_player_select_own` overlap).

### INFO — Unindexed FK (3)
- `help_requests.acknowledged_by_fkey`
- `help_requests.requested_by_fkey`
- `help_requests.resolved_by_fkey`

### INFO — Unused Index (11)
Logique : `submissions`/`evaluations`/`bonus_events` à 0 rows → indexes pas encore consultés. À ré-évaluer post-pilote :
- `deliverable_templates_active_idx`
- `announcements_event_created_idx`, `announcements_kind_idx`
- `bonus_events_status_idx`, `bonus_events_validated_active_idx`, `bonus_events_claimed_by_idx`, `bonus_events_reviewed_by_idx`
- `moscow_cards_project_idx`, `moscow_cards_created_by_idx`
- `missions_level_id_idx`
- `pitch_scores_player_id_idx`

---

## 6. EXPLAIN ANALYZE baseline (3 hot queries — volume 0)

### Q1 : `submissions WHERE player_id=$1 ORDER BY submitted_at DESC`
```
Sort  (cost=0.01..0.02 rows=1 width=1401) (actual time=0.597..0.598 rows=0 loops=1)
  Sort Key: submitted_at DESC
  Sort Method: quicksort  Memory: 25kB
  Buffers: shared hit=3
  ->  Seq Scan on submissions  (cost=0.00..0.00 rows=1 width=1401) (actual time=0.011..0.011 rows=0 loops=1)
        Filter: (player_id = '5b27f2a1-ce5d-44f6-9858-862e83ae1ed4'::uuid)
Planning Time: 1.844 ms
Execution Time: 0.679 ms
```
**Verdict** : 0 rows → Seq Scan trivial. Re-mesure J+1 nécessaire.

### Q2 : `submissions WHERE status IN ('submitted_v1','submitted_v2') ORDER BY submitted_at DESC LIMIT 50`
```
Limit  (cost=0.01..0.02 rows=1 width=1401) (actual time=0.044..0.045 rows=0 loops=1)
  Buffers: shared hit=3
  ->  Sort  (cost=0.01..0.02 rows=1 width=1401) (actual time=0.043..0.043 rows=0 loops=1)
        Sort Key: submitted_at DESC
        Sort Method: quicksort  Memory: 25kB
        ->  Seq Scan on submissions  (cost=0.00..0.00 rows=1 width=1401) (actual time=0.022..0.022 rows=0 loops=1)
              Filter: (status = ANY ('{submitted_v1,submitted_v2}'::submission_status[]))
Planning Time: 0.660 ms
Execution Time: 0.104 ms
```
**Verdict** : idem 0 rows.

### Q3 : `evaluations WHERE submission_id=$1 ORDER BY created_at DESC LIMIT 1`
Non capturé (volume 0 → résultat identique trivial).

---

## 7. Corrections au PLAN initial (post-baseline)

| Plan Task | Status après baseline | Justification |
|---|---|---|
| 1.2 idée #1 — `submissions(player_id, deliverable_template_id)` | **REDUNDANT** | Couvert par `submissions_player_id_deliverable_template_id_version_key` UNIQUE existant. |
| 1.2 idée #2 — partial index pending recent | TOUJOURS VALIDE | Aucun index `(submitted_at DESC) WHERE status IN (...)` existant. |
| 1.2 idée #3 — `evaluations(submission_id, created_at DESC)` | TOUJOURS VALIDE | `evaluations_submission_id_idx` simple existe mais pas composite avec `created_at DESC`. |
| 1.5 middleware skip | CONFIRMÉ JUSTIFIÉ | Query #14 = 2107 calls de `player_members WHERE user_id=$1` venant du middleware. |
| 1.4 React.cache() | CONFIRMÉ JUSTIFIÉ | Query #14 confirme la duplication d'appels auth-adjacent par render. |
| Région migration | DOCUMENTÉ — defer | eu-west-1 vs cdg1 = ~30-50 ms RTT. Pilote tient. |

**Nouvelle finding hors plan** : `help_requests` table a 3 FK non indexés + 1 RLS initplan WARN + 1 multiple_permissive WARN. Non bloquant pour pilote (volume tiny). À traiter post-pilote dans un quick dédié `help_requests_perf_followup`.

---

## 8. Re-measurement protocol (J+1 et J+3)

À re-exécuter (mêmes queries) :
- **J+1 = 21 mai matin** après ~30 submissions générées J1 — capturer EXPLAIN avec data réelle, comparer aux baselines ici.
- **J+3 = 23 mai après pilote** — décider quelles tasks 1.2/1.4/1.5 mériteraient encore d'être appliquées en v0.3.

Stocker dans `MEASUREMENTS-J1.md` et `MEASUREMENTS-J3.md` dans ce même quick dir.
