# Deferred Items — quick 260519-tqd

**Quick:** DB perf top 5 quick wins (260519-tqd)
**Date:** 2026-05-19 (J-1 Digi-Hackathon)
**Decision:** Apply only zero-risk read-only tasks (1.1 MEASUREMENTS + 1.3 POOLER-doc). Defer all code/schema changes to post-pilote (≥ 2026-05-23).

---

## Tasks deferred from initial PLAN (option 1 retenue)

### Task 1.2 — 3 indexes ciblés
**Deferred to:** post-pilote v0.3 quick, after J+1/J+3 re-measurement
**Reason:**
- PROD volume actuel = 0 submissions / 0 evaluations → impossible de mesurer le gain réel avant pilote
- Application J-1 = changement infra à 24h du pilote, viole le risk_posture "zero-risk-only"
- 1 des 3 indexes (`submissions_player_tpl_idx`) **est redondant** avec `submissions_player_id_deliverable_template_id_version_key` UNIQUE existant (cf. MEASUREMENTS.md §4) → plan doit être revu

**Updated proposal for post-pilote** (2 indexes seulement) :
```sql
-- supabase/migrations/<post-pilot-timestamp>_perf_journey_mentor_indexes.sql
CREATE INDEX IF NOT EXISTS submissions_pending_recent_idx
  ON public.submissions (submitted_at DESC)
  WHERE status IN ('submitted_v1','submitted_v2');

CREATE INDEX IF NOT EXISTS evaluations_submission_recent_idx
  ON public.evaluations (submission_id, created_at DESC);
```
**Process update** : suivre `database/MANIFEST.md` Option A → écrire dans `supabase/migrations/`, apply via `supabase db push --linked` ou MCP `apply_migration`, mettre à jour out-of-band log dans MANIFEST.md, refléter dans `database/schema.sql`.

---

### Task 1.4 — React.cache() sur getCurrentUser + getCurrentRole
**Deferred to:** post-pilote v0.3 quick
**Reason:**
- Touche `lib/auth.ts` = chemin auth critique
- Smoke régression demande 30+ min (typecheck/lint/build + manual /journey/mentor/admin)
- Pas de bug actif à fixer, c'est de l'optimisation
- pg_stat_statements montre que `player_members WHERE user_id=$1` (middleware) a 2107 calls — **finding confirmé**, mais coût unitaire 0.59 ms reste sain au volume pilote

**Updated proposal for post-pilote** : appliquer le patch tel que documenté dans PLAN Task 1.4, + re-mesurer pg_stat_statements pour quantifier la dédup réelle.

---

### Task 1.5 — Middleware skip onboarding DB lookups sur /api/* et /_next/data/*
**Deferred to:** post-pilote v0.3 quick
**Reason:**
- Le planner avait déjà flagué DONE-NOOP probable (le bloc onboarding est skippé via `!isPublic` qui inclut `/api` et `/_next`)
- Vérification définitive nécessite logs PROD post-pilote
- Risque résiduel R3 (gate onboarding) → spawn `eic-pedagogical-advisor` requis avant edit
- pg_stat_statements montre que la query middleware tourne quand même 2107 fois → suggère qu'au moins une fraction des requêtes traverse encore le bloc (probablement les RSC streaming via `/_next/data` qui n'est PAS exclu d'`isPublic`)

**Updated proposal for post-pilote** : analyser pg_stat_statements J+3 pour distinguer hits venant de pages réelles vs hits venant de /_next/data ou /api → si majorité /_next/data, patcher.

---

## Brainstorm items deferred (out of initial PLAN scope)

### Migration région Supabase eu-west-1 → eu-west-3
**Deferred to:** post-pilote v0.3 quick (gros effort)
**Reason:**
- ~30-50 ms RTT supplémentaire par requête Vercel cdg1 (Paris) → Supabase eu-west-1 (Dublin) détecté
- Migration = nouveau projet Supabase + pg_dump + re-seed 20 auth.users + tag safety + downtime
- Hors fenêtre J-1, risque pilote >> gain perf

**Updated proposal** : créer un quick `260523-xxx-region-migration` post-pilote avec tag `v0.3-pre-region-migration` + plan détaillé pg_dump + cutover.

---

### Materialized view `mv_event_leaderboard`
**Deferred to:** v0.3 (post-pilote)
**Reason:** Refactor invasive, R1 surface (results), nécessite RLS via SECURITY DEFINER + refresh CONCURRENTLY via trigger jumeau on pitch_scores. Brainstorm agent 1 idée #4.

---

### RPC consolidée `get_journey_data(player_id)`
**Deferred to:** v0.3 (post-pilote)
**Reason:** 5 round-trips → 1 RPC, refactor `lib/journey.ts` invasif, multi-callers. Brainstorm agent 1 idée #8.

---

### Fusion `getCurrentUserAndRole()`
**Deferred to:** v0.3 (post-pilote)
**Reason:** Refactor invasif, call sites multiples. Brainstorm agent 2 bonus de l'idée #1.

---

### Cookie signé `eic-onboarded=1` (élimine SELECT player_members onboarding gate)
**Deferred to:** v0.3 (post-pilote)
**Reason:** Stateful side-channel, risque > 0 (désync cookie ↔ DB possible). Brainstorm agent 2 bonus de l'idée #4.

---

### `unstable_cache` + `revalidateTag` sur catalogue events/missions/templates
**Deferred to:** v0.3 (post-pilote)
**Reason:** Refactor de lib/admin.ts, lib/mentor.ts, lib/journey.ts. Gain potentiel énorme (5 pages × 30 sessions) mais touche tous les helpers de read catalogue. Brainstorm agent 2 idée #3.

---

### Streaming `<Suspense>` sur cockpit admin
**Deferred to:** v0.3 (post-pilote)
**Reason:** Refactor `app/admin/page.tsx` en sous-composants serveurs. Gain UX > DB raw. Brainstorm agent 2 idée #5.

---

### `revalidate = 30` sur `/results` post-publish
**Deferred to:** v0.3 (post-pilote)
**Reason:** `computeRanking()` lourd, mais page peu trafiquée. Brainstorm agent 2 idée #8.

---

### Sentry free tier sur server actions Flow
**Deferred to:** v0.3 (post-pilote)
**Reason:** Ajout dépendance + wizard, risque casser build Vercel à J-1. Brainstorm agent 3 idée #8.

---

## Findings hors brainstorm — à traiter post-pilote

### `help_requests` table — 5 advisor lints non couverts par fix 17/05
- 3 unindexed FK (`acknowledged_by`, `requested_by`, `resolved_by`)
- 1 `auth_rls_initplan` WARN sur `help_requests_player_insert_own` (table ajoutée 12/05, ratée par migration `rls_initplan_fix` du 17/05)
- 1 `multiple_permissive_policies` WARN sur SELECT (`help_requests_mentor_select_all` + `help_requests_player_select_own` overlap)

**Updated proposal** : quick `260523-xxx-help-requests-perf-followup` — répliquer le pattern des migrations `20260517225015_rls_initplan_fix` + `20260517225027_multiple_permissive_fix` + `20260517225034_fk_indexes` sur la table `help_requests`. Volume tiny (probablement 0 rows actuellement, à confirmer post-pilote) → priorité basse.

---

## Memory updates required

### `feedback_database_deny_workaround.md` — **OUTDATED**
La memory dit : « `Write/Edit(database/**)` deny dans settings.local.json · workaround = NEW.sql dans quick dir + apply PROD via MCP execute_sql ».

**Realité 2026-05-17** : `database/MANIFEST.md` (Option A coexistence) acte le process officiel :
- `supabase/migrations/<timestamp>_<slug>.sql` est l'endroit autoritaire (PAS deny)
- Apply via `supabase db push --linked` ou MCP `apply_migration`
- `database/` reste deny mais `supabase/migrations/` est libre

**Action** : mettre à jour la memory pour pointer vers `database/MANIFEST.md` et clarifier que le workaround "NEW.sql dans quick dir" n'est plus nécessaire — utiliser `supabase/migrations/` directement.

---

## Tag safety

À poser avant Task 1.2/1.4/1.5 (post-pilote) : `v0.2.2-pre-perf-quickwins` (tag `v0.2.1-pre-digi` du 17/05 ne couvre pas les derniers commits l1l).
