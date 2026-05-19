# SUMMARY — quick 260519-tqd

**Title:** DB perf top 5 quick wins — baseline measurement + pooler doc
**Mode:** quick (option 1 retenue : exec uniquement zero-risk J-1)
**Date:** 2026-05-19 (J-1 Digi-Hackathon 20-22 mai)
**Status:** ✅ DONE (partial — 2/5 tasks applied, 3/5 deferred post-pilote)

---

## Outcome

Baseline perf PROD capturée avant pilote Digi-Hackathon. 17 advisor findings inventoriés (dont 5 résiduels post-fix 17/05 sur `help_requests`). pg_stat_statements confirme 2 hypothèses du brainstorm (middleware DB load + Journey hot path). Aucune modification PROD code/schema appliquée — pilote intact.

## Tasks executed

| # | Task | Status | Artefact |
|---|---|---|---|
| 1.1 | MEASUREMENTS baseline | ✅ DONE | `MEASUREMENTS.md` |
| 1.3 | POOLER Supavisor check | ✅ DONE — no migration needed (REST-only stack) | `POOLER-MIGRATION.md` |
| 1.2 | 3 indexes ciblés | ⏸ DEFERRED post-pilote (1 redondant détecté, 2 valides) | `deferred-items.md` |
| 1.4 | React.cache() auth | ⏸ DEFERRED post-pilote (smoke 30+ min) | `deferred-items.md` |
| 1.5 | Middleware skip DB | ⏸ DEFERRED post-pilote (advisor + smoke requis) | `deferred-items.md` |

## Key findings

1. **Région désalignée** : Supabase `eu-west-1` (Dublin) ↔ Vercel `cdg1` (Paris) = ~30-50 ms RTT supplémentaire. Documenté, defer migration v0.3.
2. **Volume PROD = 0 submissions / 0 evaluations** → impossible de baselineler EXPLAIN avec data réelle. Re-mesure J+1 (21/05 matin) requise.
3. **Index `submissions_player_tpl_idx` proposé = redondant** avec `submissions_player_id_deliverable_template_id_version_key` UNIQUE existant. Plan corrigé : 2 indexes seulement pour la post-pilote re-application.
4. **Middleware DB load confirmé** : `player_members WHERE user_id=$1` = 2107 calls dans pg_stat_statements. Coût unitaire bas (0.59 ms) mais volume valide brainstorm agent 2 idée #1+#4.
5. **Stack REST-only** : aucun client `pg`/Prisma/Drizzle → pooler Supavisor port 6543 non applicable. Le pooler interne Supabase est transparent.
6. **`help_requests` table** (ajoutée 12/05) a 5 advisor lints résiduels non couverts par les fix du 17/05 → quick dédié post-pilote.
7. **Memory `feedback_database_deny_workaround.md` outdated** : `database/MANIFEST.md` (17/05) acte le process officiel via `supabase/migrations/` (PAS deny).

## Files produced

```
.planning/quick/260519-tqd-db-perf-top-5-quick-wins-pg-stat-stateme/
├── 260519-tqd-PLAN.md            (plan initial 5 tasks)
├── 260519-tqd-SUMMARY.md         (ce fichier)
├── MEASUREMENTS.md               (baseline pré-pilote — 17 advisor findings + pg_stat top 14 + indexes inventory + EXPLAIN baseline)
├── POOLER-MIGRATION.md           (verdict: DONE — REST-only stack)
└── deferred-items.md             (3 tasks + 9 brainstorm items + 1 hors-brainstorm + memory update flag)
```

## Commits

| SHA | Message |
|---|---|
| `9ca673f` | `docs(quick-260519-tqd): DB perf baseline + pooler verdict (J-1 Digi-Hackathon)` |

## Re-measurement protocol

- **J+1 = 21 mai matin** : re-run pg_stat_statements top 15 + EXPLAIN sur 3 hot queries avec ~30 submissions de J1. Comparer à MEASUREMENTS.md.
- **J+3 = 23 mai après pilote** : décider quels deferred items appliquer en v0.3.

## Next quick

`260523-xxx-perf-post-pilote-apply` (à créer post-22/05) :
- Apply 2 valid indexes via `supabase/migrations/`
- Apply React.cache() patch sur lib/auth.ts
- Verify middleware skip nécessité avec data J+3
- Apply help_requests advisor fixes (initplan + permissive + 3 FK indexes)
- Update memory `feedback_database_deny_workaround.md` → pointer vers MANIFEST.md

## Risk posture honored

✅ **Zero-risk-only** : aucun code modifié, aucun schéma touché, aucun Vercel env changé. Pilote intact.
✅ **Smoke régression** : N/A (pas de code changé). `npm run typecheck/lint/build` non lancé car aucun fichier source modifié.
✅ **Default = ship + push** : commit + push immédiat après merge ce SUMMARY.
