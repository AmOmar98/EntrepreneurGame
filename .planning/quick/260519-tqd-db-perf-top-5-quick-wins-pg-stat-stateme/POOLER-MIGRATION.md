# POOLER-MIGRATION — Supavisor / Connection Pooler (quick 260519-tqd Task 1.3)

**Status:** ✅ **DONE — no migration needed**
**Verified:** 2026-05-19

---

## Verdict

Le projet n'utilise **aucune connexion Postgres directe** (port 5432 ou 6543). Tous les accès DB passent par **PostgREST** via `@supabase/ssr`, lui-même routé à travers le pooler interne Supabase. Aucun changement env ni redeploy nécessaire.

---

## Evidence

### 1. Aucun client Postgres direct dans le codebase

```bash
grep -rn 'from "pg"\|import.*Pool.*from' --include="*.ts" --include="*.tsx" --include="*.cjs"
```
→ Aucun match applicatif (les `Pool` matchent uniquement `node_modules/undici-types/*`, qui est un HTTP client transitif, sans rapport avec Postgres).

### 2. Stack DB confirmé `@supabase/ssr` only

`.env.example` n'expose que :
- `NEXT_PUBLIC_SUPABASE_URL` → REST endpoint (PostgREST)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → client public
- `SUPABASE_SERVICE_ROLE_KEY` → server actions privilégiées (REST aussi)

**Aucun `DATABASE_URL` / `POSTGRES_URL` / `SUPAVISOR_URL`.**

Toutes les écritures passent par `app/actions.ts` → `utils/supabase/server.ts:createClient()` → `@supabase/ssr` → PostgREST (HTTPS) → Postgres derrière le pooler interne Supabase.

### 3. Conséquence

- **Connection pool saturation impossible côté app** : pas de connexion TCP persistante 5432 → pas de risque "60 connexions max free tier" mentionné dans le brainstorm agent 3.
- **Le pooler interne Supabase (Supavisor) est déjà en jeu** pour les requêtes PostgREST côté infrastructure Supabase. Transparent pour l'app.
- **Le finding brainstorm "port 6543 transaction mode"** ne s'applique qu'aux stacks ORM (Prisma, Drizzle, raw `pg`). Ce projet est purement REST.

---

## Si une migration ORM est envisagée post-pilote

Si à terme l'équipe introduit un client direct (`pg`, `Prisma`, `Drizzle`, edge function avec deno-postgres, etc.), suivre alors :

1. Supabase Dashboard → Project Settings → Database → Connection pooling
2. Copier la **Transaction mode** connection string (port **6543**, format `aws-0-eu-west-1.pooler.supabase.com:6543`)
3. Vercel Dashboard → projet `entrepreneur-game-six` → Settings → Environment Variables
4. Ajouter `DATABASE_URL` sur Production + Preview + Development
5. **NE PAS** utiliser le port 5432 (direct) en production → saturation 60 connexions au-delà de ~30 sessions concurrentes
6. Transaction mode ne supporte pas `LISTEN/NOTIFY` ni session-level `SET` → si ces features sont requises, utiliser session mode (port 5432 via pooler ou direct)

**Rollback** : si redeploy casse, revenir à la direct connection string (port 5432) le temps de diagnostiquer.

---

## Référence

- Cf. brainstorm agent 3 (couche infra/observabilité), idée #2 — désormais marquée DONE pour ce projet.
- Cf. memory `project_pilot_status.md` (stack `@supabase/ssr` confirmée).
