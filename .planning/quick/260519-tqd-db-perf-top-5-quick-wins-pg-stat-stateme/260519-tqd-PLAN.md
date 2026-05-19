---
id: 260519-tqd
title: DB perf — top 5 quick wins consolidés (pg_stat_statements + 3 indexes + pooler + React.cache + middleware skip)
description: Top 5 quick wins perf consolidés depuis brainstorm 3-agents (Postgres / Next.js applicatif / infra) à appliquer en PROD avant Digi-Hackathon 20-22 mai.
status: planned
created: 2026-05-19
event_window: Digi-Hackathon 20-22 mai 2026 (pilote LIVE)
risk_posture: zero-risk-only — pilote imminent, défère tout doute
commits_budget: 1-5 commits atomiques (préfixe `(quick-260519-tqd)`)
sensitive_zones:
  - middleware.ts (Task 5 — spawn eic-pedagogical-advisor avant edit)
  - lib/auth.ts (Task 4 — pas Player-facing UI, R1/R2/R3 N/A mais smoke obligatoire)
mcp_tools_used:
  - mcp__plugin_supabase_supabase__get_advisors
  - mcp__plugin_supabase_supabase__execute_sql
  - mcp__plugin_supabase_supabase__get_logs
---

# Goal

Réduire la latence Vercel→Supabase observée sur les pages Player/Mentor/GM en appliquant 5 quick wins zero-risk **mesurables** avant le pilote Digi-Hackathon (20-22 mai). Aucune modification fonctionnelle, aucune touche R1/R2/R3, aucune migration schéma destructive. Chaque task est rollbackable indépendamment. Mesure d'abord (Task 1), applique ensuite (Tasks 2-5), mesure à nouveau pour quantifier le gain dans SUMMARY.md.

## Hot queries ciblées par les 3 indexes (Task 2)

| Query | Surface | Index attendu |
|---|---|---|
| Journey full chain pour 1 player (`submissions WHERE player_id=$1`) | `/journey`, `/journey/deliverable/[id]` | `submissions_player_tpl_idx` |
| Mentor inbox (`submissions WHERE status IN ('submitted_v1','submitted_v2') ORDER BY submitted_at DESC`) | `/mentor` | `submissions_pending_recent_idx` (partial) |
| Latest evaluation par submission (`evaluations WHERE submission_id=$1 ORDER BY created_at DESC LIMIT 1`) | `/mentor/submission/[id]`, `DeliverableScoreBlock` | `evaluations_submission_recent_idx` |

Colonnes confirmées présentes dans `database/schema.sql` lignes 170-201 :
- `submissions(player_id, deliverable_template_id, submitted_at, status)` — OK
- `evaluations(submission_id, created_at)` — OK
- Enum `submission_status` inclut `submitted_v1`, `submitted_v2` — OK

---

# Tasks

## Task 1.1 — MESURE pg_stat_statements + Advisor + EXPLAIN ANALYZE baseline

**Description** : Capturer l'état perf AVANT toute modification. Aucun code modifié à cette task. Produit un fichier de référence pour comparaison post-application.

**Files (créés)** :
- `.planning/quick/260519-tqd-db-perf-top-5-quick-wins-pg-stat-stateme/MEASUREMENTS.md`

**Action** :
1. `mcp__plugin_supabase_supabase__execute_sql` :
   - `SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_stat_statements';` → si absent, `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;` (idempotent, no-op si déjà créé via Supabase dashboard).
   - `SELECT pg_stat_statements_reset();` pour repartir d'un état propre **uniquement si l'extension vient d'être activée** (ne pas reset si déjà productive — on perdrait les stats accumulées).
2. `mcp__plugin_supabase_supabase__get_advisors` pour récupérer les recommandations Performance Advisor — coller la sortie JSON dans `MEASUREMENTS.md` section "Advisor".
3. Capturer 3 EXPLAIN ANALYZE via `execute_sql` (utiliser un `player_id` réel via `SELECT id FROM players LIMIT 1` pour le binding) :
   ```sql
   EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
   SELECT * FROM public.submissions WHERE player_id = '<uuid>' ORDER BY submitted_at DESC;

   EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
   SELECT * FROM public.submissions
   WHERE status IN ('submitted_v1','submitted_v2')
   ORDER BY submitted_at DESC LIMIT 50;

   EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
   SELECT * FROM public.evaluations
   WHERE submission_id = '<sub-uuid>'
   ORDER BY created_at DESC LIMIT 1;
   ```
4. Vérifier alignement région Vercel↔Supabase :
   - `mcp__plugin_supabase_supabase__get_project_url` → noter le hostname.
   - Vercel : `vercel.json` déclare `regions: ["cdg1"]` (Paris). Supabase project doit être région EU (Paris/Frankfurt). Si mismatch détecté → ajouter une note dans `MEASUREMENTS.md` section "Region" (rien à fixer cette task, migration hors-scope, juste documenter).
5. Écrire `MEASUREMENTS.md` avec sections : `Advisor`, `EXPLAIN baseline (3 queries)`, `Region alignment`, `pg_stat_statements top 10` (`SELECT query, calls, mean_exec_time, total_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10`).

**Verify** :
- Fichier `MEASUREMENTS.md` existe et non vide.
- 3 EXPLAIN plans présents (texte complet).
- Sortie Advisor capturée.

**Done** :
- Baseline mesurable archivée. Tasks 2-5 pourront comparer.

**Risk** : Zéro — read-only. `CREATE EXTENSION` est idempotent.

**Advisor check** : N/A (pas de code Player-facing modifié, pas de zone sensible R1/R2/R3).

**Rollback** : N/A (aucune modification).

**Commit** : Pas de commit code à cette task — `MEASUREMENTS.md` sera committé groupé avec Task 2 sous `(quick-260519-tqd) perf: baseline measurements + 3 targeted indexes`.

---

## Task 1.2 — 3 INDEXES CIBLÉS (CREATE INDEX CONCURRENTLY via MCP)

**Description** : Appliquer 3 index zero-risk en PROD via `mcp__plugin_supabase_supabase__execute_sql`. `CONCURRENTLY` = no table lock, safe sur prod live. Workaround database deny : SQL staged dans le quick dir (cf. memory `feedback_database_deny_workaround.md`), application via MCP.

**Files (créés)** :
- `.planning/quick/260519-tqd-db-perf-top-5-quick-wins-pg-stat-stateme/indexes.sql` (stage SQL — pas dans `database/`, deny respecté)

**Action** :
1. Écrire `indexes.sql` avec :
   ```sql
   -- Targeted index 1: Journey hot query (submissions per player + template)
   CREATE INDEX CONCURRENTLY IF NOT EXISTS submissions_player_tpl_idx
     ON public.submissions (player_id, deliverable_template_id);

   -- Targeted index 2: Mentor inbox (pending submissions, recent first)
   -- Partial index: only rows with status submitted_v1/submitted_v2 (small subset)
   CREATE INDEX CONCURRENTLY IF NOT EXISTS submissions_pending_recent_idx
     ON public.submissions (submitted_at DESC)
     WHERE status IN ('submitted_v1','submitted_v2');

   -- Targeted index 3: Latest evaluation per submission
   CREATE INDEX CONCURRENTLY IF NOT EXISTS evaluations_submission_recent_idx
     ON public.evaluations (submission_id, created_at DESC);
   ```
2. Appliquer les 3 `CREATE INDEX CONCURRENTLY` **un par un** via `execute_sql` (CONCURRENTLY ne supporte pas la transaction multi-statement). Vérifier après chaque :
   ```sql
   SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname IN
     ('submissions_player_tpl_idx','submissions_pending_recent_idx','evaluations_submission_recent_idx');
   ```
   Doit retourner 1 ligne après chaque create, 3 lignes à la fin.
3. Re-run les 3 EXPLAIN ANALYZE de Task 1.1, coller les nouveaux plans dans `MEASUREMENTS.md` section "Post-index EXPLAIN".
4. Commenter dans `MEASUREMENTS.md` les gains observés (planning time / execution time / Index Scan vs Seq Scan).

**Verify** :
- 3 lignes retournées par la query `pg_indexes` ci-dessus.
- `MEASUREMENTS.md` montre passage `Seq Scan` → `Index Scan` ou `Bitmap Index Scan` sur au moins 2/3 queries.
- Pas d'erreur dans `mcp__plugin_supabase_supabase__get_logs` (service: `db`) dans la fenêtre de 5 min suivant l'application.

**Done** :
- 3 indexes créés, présents dans `pg_indexes`, EXPLAIN post documenté.

**Risk** : Très faible.
- `CONCURRENTLY` = no lock, no blocking sur table live.
- `IF NOT EXISTS` = idempotent (re-run safe).
- Indexes additifs uniquement → pas de DROP, pas de modification de schéma.
- Coût stockage négligeable au volume pilote (~11 players × ~13 deliverables × 2 versions ≈ 286 lignes max).

**Advisor check** : N/A (DB-only, pas de UI Player-facing touchée).

**Rollback** :
```sql
DROP INDEX CONCURRENTLY IF EXISTS public.submissions_player_tpl_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.submissions_pending_recent_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.evaluations_submission_recent_idx;
```
À appliquer via MCP `execute_sql` si dégradation inattendue (improbable mais doc'd).

**Commit** :
```
(quick-260519-tqd) perf: baseline measurements + 3 targeted DB indexes (CONCURRENTLY)

- MEASUREMENTS.md baseline (EXPLAIN avant/après, Advisor, region check)
- indexes.sql staged (workaround database/** deny)
- submissions_player_tpl_idx, submissions_pending_recent_idx, evaluations_submission_recent_idx
  appliqués PROD via MCP execute_sql

Files: .planning/quick/260519-tqd-.../MEASUREMENTS.md, indexes.sql
Risk: very low (CONCURRENTLY + IF NOT EXISTS, additive only)
```
Push immédiat `origin/main` après commit (cf. CLAUDE.md "Default = ship + push").

---

## Task 1.3 — POOLER Supavisor (config Vercel env — documentation only)

**Description** : Vérifier si le Vercel env utilise déjà le pooler Supavisor en transaction mode (port 6543). Si oui → DONE-DOC. Si non → produire checklist d'action pour Omar (orchestrator ne peut pas modifier Vercel env sans CLI authentifié explicitement).

**Files (créés)** :
- `.planning/quick/260519-tqd-db-perf-top-5-quick-wins-pg-stat-stateme/POOLER-MIGRATION.md`

**Action** :
1. Tenter `vercel env ls` (Bash). Si auth absente → noter dans le MD "vercel CLI auth absente, checklist manuelle".
2. Vérifier la valeur de `NEXT_PUBLIC_SUPABASE_URL` (visible côté client → safe à lire) et la présence potentielle de `DATABASE_URL` / `SUPABASE_DB_URL` côté server-only.
3. Format pooler attendu : `aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true` (transaction mode).
4. Écrire `POOLER-MIGRATION.md` avec :
   - Section "Current state" (valeurs détectées ou marquées "à vérifier par Omar dans Vercel dashboard").
   - Section "Migration checklist" pas-à-pas :
     a. Aller dans Supabase Dashboard → Project Settings → Database → Connection pooling
     b. Copier la "Transaction" connection string (port 6543)
     c. Vercel Dashboard → entrepreneur-game (slug `entrepreneur-game-six`) → Settings → Environment Variables
     d. Si `DATABASE_URL` existe : mettre à jour la valeur sur les 3 environments (Production, Preview, Development)
     e. Si `DATABASE_URL` n'existe pas (cas probable — `@supabase/ssr` utilise REST API via `NEXT_PUBLIC_SUPABASE_URL` + anon key, pas Postgres direct) : **MARK DONE** — pas de pooler à migrer, le client SSR Supabase passe par PostgREST et bénéficie déjà du pooler interne Supabase.
     f. Redeploy Vercel (`vercel --prod` ou via git push).
   - Section "Rollback" : si redeploy casse, revenir à la direct connection string (port 5432).
5. Note importante : ce projet utilise `@supabase/ssr` (REST via PostgREST), pas de Prisma/Drizzle/pg direct. Le pooler concerne donc surtout les éventuels usages directs `pg` ou route handlers Postgres direct → grep `from "pg"` / `import.*Pool` pour confirmer absence.

**Verify** :
- `POOLER-MIGRATION.md` existe.
- Statut clair en haut du fichier : `DONE` (déjà sur pooler ou pas de DATABASE_URL applicable) OR `ACTION REQUIRED (Omar manual step)`.

**Done** :
- Documentation livrée. Si action manuelle requise → Omar exécute hors-bande puis marque section "Verified by Omar" avec date.

**Risk** : Zéro (documentation only, aucun env Vercel modifié par l'orchestrator).

**Advisor check** : N/A.

**Rollback** : N/A (rien modifié — section rollback inclue dans le MD pour Omar).

**Commit** :
```
(quick-260519-tqd) docs: pooler Supavisor migration checklist (action-required for Omar)
```
Groupable avec Task 1.4 si elles tombent dans la même wave temporelle.

---

## Task 1.4 — React.cache() sur getCurrentUser + getCurrentRole

**Description** : Wrapper `getCurrentUser()` et `getCurrentRole()` dans `lib/auth.ts` avec `import { cache } from "react"` pour dédupliquer les appels `supabase.auth.getUser()` au sein d'un même render request. Multiple pages/components appellent ces helpers en parallèle (cf. `app/journey/page.tsx`, `app/admin/page.tsx`, `app/mentor/page.tsx`, etc.) → cache request-scoped élimine les round-trips redondants.

**Files (modifiés)** :
- `lib/auth.ts` (1 fichier)

**Action** :
1. Lire `lib/auth.ts` (déjà fait : 46 lignes, 2 helpers async + 1 sync + 1 redirect).
2. Patcher :
   ```typescript
   import { cache } from "react";
   import { redirect } from "next/navigation";
   import { createClient } from "@/utils/supabase/server";
   import type { AppRole } from "@/lib/types";

   export const getCurrentUser = cache(async () => {
     const supabase = await createClient();
     if (!supabase) return null;
     const { data: { user } } = await supabase.auth.getUser();
     return user;
   });

   export const getCurrentRole = cache(async (): Promise<AppRole | null> => {
     const supabase = await createClient();
     if (!supabase) return null;
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return null;
     const { data, error } = await supabase
       .from("profiles")
       .select("app_role")
       .eq("user_id", user.id)
       .maybeSingle();
     if (error || !data) return "player";
     return data.app_role as AppRole;
   });

   // pathForRole + redirectForRole inchangés
   ```
3. Vérifier que les call sites importent toujours `import { getCurrentUser } from "@/lib/auth"` — pas de breaking change car `cache(fn)` retourne une fonction avec la même signature.
4. Bonus DÉFÉRÉ : ne PAS fusionner en `getCurrentUserAndRole()` (cf. deferred-items.md) — réfactor invasive, peut être post-pilote.

**Verify** :
- `npm run typecheck` → OK
- `npm run lint` → OK
- `npm run build` → OK
- Grep sanity : `grep -n "cache(" lib/auth.ts` → 2 occurrences attendues.

**Done** :
- `lib/auth.ts` patché, build clean, dédup React request-scoped active.

**Risk** : Très faible.
- `cache()` est read-only memoization request-scoped.
- Signature identique côté caller (toujours `async () => User | null`).
- Pas Player-facing UI, pas de zone R1/R2/R3.
- Mode demo (no Supabase) : `createClient()` retourne `null` → premier `return null` immédiat → cache inerte.

**Advisor check** : NON requis (pas de zone sensible R1/R2/R3, c'est de la dédup de read auth — pédagogie/scoring intacts).

**Rollback** : `git revert <sha>` chirurgical. 1 fichier, 1 commit.

**Commit** :
```
(quick-260519-tqd) perf: React.cache() wrap getCurrentUser + getCurrentRole (request-scoped dedup)

Eliminates duplicate supabase.auth.getUser() round-trips when multiple
components on the same page call these helpers (e.g. AppShell + page server
component + layout). cache() is request-scoped → no cross-request leak.

Files: lib/auth.ts
Risk: low (signature unchanged, demo mode null-guard preserved)
Smoke: typecheck/lint/build all clean
```
Push immédiat `origin/main`.

---

## Task 1.5 — Middleware skip DB sur /api/* et /_next/data/*

**Description** : Court-circuiter le bloc onboarding gate (SELECT profiles + SELECT player_members → 2 round-trips DB par requête) sur les routes `/api/*` et `/_next/data/*` qui n'ont pas besoin du gate. Le bloc auth refresh + redirect /login reste actif (encore nécessaire pour cookies). **Spawn `eic-pedagogical-advisor` avant edit** car `middleware.ts` + `utils/supabase/middleware.ts` sont zones sensibles (CLAUDE.md pre-edit guards).

**Files (modifiés)** :
- `utils/supabase/middleware.ts` (1 fichier — modifie le `isPublic` ou ajoute un `skipOnboardingGate`)
- (Optionnel — défère si trop complexe) `middleware.ts` matcher peut rester tel quel — `/api/*` et `/_next/*` sont déjà partiellement exclus.

**Action** :
1. **Spawn `eic-pedagogical-advisor`** sur le diff prévu (cf. `.claude/agents/eic-pedagogical-advisor.md`). Attendu : verdict PASS (R1/R2/R3 N/A, c'est de la perf middleware, pas de Player UI ni scoring touché). Si verdict BLOCK ou FLAG → adresser avant edit.
2. Patcher `utils/supabase/middleware.ts` ligne 30-42 zone `isPublic` + bloc onboarding (ligne 46-80) :
   ```typescript
   const pathname = request.nextUrl.pathname;
   const isPublic =
     pathname.startsWith("/login") ||
     pathname.startsWith("/landing") ||
     pathname.startsWith("/api") ||
     pathname.startsWith("/_next") ||
     pathname.startsWith("/auth/callback");

   if (!user && !isPublic) {
     const url = request.nextUrl.clone();
     url.pathname = "/login";
     return NextResponse.redirect(url);
   }

   // Onboarding gate skip: /api/* and /_next/data/* don't need profile/membership
   // lookups — Page-level checks already gate Player UI. This saves 2 DB
   // round-trips per RSC streaming request.
   const skipOnboardingGate =
     pathname.startsWith("/api") ||
     pathname.startsWith("/_next/data") ||
     pathname.startsWith("/_next/");

   if (user && !isPublic && !skipOnboardingGate) {
     // ... existing onboarding block unchanged ...
   }
   ```
   **NOTE** : `isPublic` exclut déjà `/api` et `/_next` du redirect /login (ligne 34-35). Le bug perf actuel : le bloc onboarding (ligne 46) ne re-vérifie pas `isPublic` négativement — il check `if (user && !isPublic)` ce qui SKIP déjà /api et /_next. **Lecture attentive** : le bloc onboarding est DÉJÀ skippé sur /api et /_next via `!isPublic`. Donc la "task 5" est probablement déjà no-op en pratique.

   **Vérifier d'abord avec un EXPLAIN/log avant de patcher** :
   - `mcp__plugin_supabase_supabase__get_logs` service `postgres` filtré sur queries `from profiles WHERE user_id=` → si volume élevé sur des paths `/api/*`, alors patch nécessaire. Sinon → marquer **DONE-NOOP** (déjà skippé via isPublic).

   Si DONE-NOOP : ajouter dans `deferred-items.md` que cette task a été validée comme déjà couverte par le check `!isPublic` existant. Pas de commit code.

   Si patch nécessaire (ex: RSC streaming via `/_next/data/*` non couvert par `isPublic`) : élargir comme ci-dessus, ajouter `pathname.startsWith("/_next/data")` au `isPublic` ou variable dédiée.

3. **NE PAS toucher** au bloc auth refresh (ligne 9-28) — cookies session refresh reste nécessaire sur toutes les routes non-statiques.
4. **Cookie signé `eic-onboarded=1`** → DÉFÈRE (deferred-items.md) — implem stateful side-channel, risque > 0 pour pilote imminent.

**Verify** :
- Si patch appliqué :
  - `npm run typecheck && npm run lint && npm run build` → OK.
  - Smoke manuel : navigate vers `/journey` en non-onboardé → doit toujours rediriger `/onboarding` (R3 gate préservé).
  - Smoke manuel : navigate vers `/api/export/...` (admin) en onboardé → doit retourner CSV sans lookup profiles inutile.
- Si DONE-NOOP : confirmation dans MD + advisor pass note.

**Done** :
- Soit patch appliqué + smoke OK + advisor PASS.
- Soit DONE-NOOP avec preuve dans `deferred-items.md`.

**Risk** : Faible si patch.
- Gate onboarding Player-facing reste actif sur `/journey`, `/mission`, `/onboarding`.
- Auth redirect /login inchangé.
- Risque résiduel : un RSC payload qui dépend de l'état onboardé d'un user pourrait bypasser le gate → mitigation = le check page-level reste actif (e.g. `app/journey/page.tsx` peut ajouter son propre check si critique). À vérifier au smoke.

**Advisor check** : OBLIGATOIRE — spawn `eic-pedagogical-advisor` avant edit. Verdict attendu : PASS (zéro touche R1/R2/R3, c'est du middleware perf).

**Rollback** : `git revert <sha>` chirurgical, 1 fichier.

**Commit** (si patch) :
```
(quick-260519-tqd) perf: middleware skip onboarding DB lookups on /api/* + /_next/data/*

Eliminates 2 DB round-trips (profiles + player_members) per RSC streaming
request on /_next/data/* and /api/* paths. Auth refresh + /login redirect
preserved. Page-level Player gates preserved.

Files: utils/supabase/middleware.ts
Risk: low (R3 gate still active on /journey, /mission, /onboarding)
Advisor: PASS (R1/R2/R3 N/A — middleware perf only)
Smoke: typecheck/lint/build OK + manual /journey non-onboarded redirect OK
```
Push immédiat `origin/main`.

---

# Smoke gates (obligatoires)

| After Task | Command | Required pass |
|---|---|---|
| Task 1.2 (indexes) | `pg_indexes` query returns 3 rows | YES |
| Task 1.4 (React.cache) | `npm run typecheck && npm run lint && npm run build` | YES — block commit on fail |
| Task 1.5 (middleware) | `npm run typecheck && npm run lint && npm run build` + manual `/journey` non-onboarded redirect | YES — block commit on fail |
| End of quick | Vercel preview smoke /journey + /mentor + /admin sans regression | YES — before declaring SUMMARY DONE |

---

# Rollback plan global

| Task | Rollback |
|---|---|
| 1.1 MEASUREMENTS | N/A — read-only |
| 1.2 Indexes | `DROP INDEX CONCURRENTLY IF EXISTS` 3x via MCP `execute_sql` |
| 1.3 Pooler doc | N/A — documentation only |
| 1.4 React.cache | `git revert <sha>` (1 commit) |
| 1.5 Middleware | `git revert <sha>` (1 commit) |

Si dégradation globale détectée post-pilote en preview Vercel : `git revert` Tasks 1.4 + 1.5 en chaîne, puis DROP indexes Task 1.2 si nécessaire. Tag de safety à poser AVANT exécution : `git tag -a v0.2.x-pre-perf-quickwins -m "before 260519-tqd"` (cf. CLAUDE.md merge policy).

---

# Out of scope (déférés explicites)

| Item | Raison | Cible |
|---|---|---|
| Materialized view leaderboard | Refactor invasive, R1 surface | post-pilote v0.3 |
| RPC consolidée `get_journey_data(player_id)` | Refactor invasive, multi-callers | post-pilote v0.3 |
| Migration région Supabase EU → US/inverse | Migration majeure, downtime requis | post-pilote v0.3 |
| Fusion `getCurrentUserAndRole()` | Refactor invasif, call sites multiples | post-pilote v0.3 |
| Cookie signé `eic-onboarded=1` | Stateful side-channel, risque > 0 | post-pilote v0.3 |
| `EXPLAIN ANALYZE` sur queries Realtime | No Realtime dans codebase (grep confirme `app/`/`components/`/`lib/` vides) | N/A |
| Optimisations `lib/journey.ts` / `lib/mentor.ts` (N+1, bulk fetch) | Hors scope brainstorm 3-agents — déjà bulk via aggregations (cf. Phase 03 decision) | post-pilote v0.3 |

Tous ces items à archiver dans `deferred-items.md` à la fin du quick (cf. convention orchestrator quick).

---

# Artefacts à produire en clôture (convention quick)

1. `260519-tqd-PLAN.md` (ce fichier)
2. `260519-tqd-AUDIT.md` — synthèse exécution + verdicts smoke + EXPLAIN avant/après
3. `260519-tqd-ADVISOR-VERDICT.md` — verdict eic-pedagogical-advisor sur Task 1.5 (obligatoire, middleware zone sensible)
4. `260519-tqd-SUMMARY.md` — SHA des commits + gains quantifiés + statut chaque task
5. `deferred-items.md` — items hors scope ci-dessus + bonus déférés Task 1.4/1.5
6. `MEASUREMENTS.md` — baseline + post-application (livré par Task 1.1+1.2)
7. `indexes.sql` — SQL appliqué (livré par Task 1.2)
8. `POOLER-MIGRATION.md` — checklist Omar (livré par Task 1.3)
