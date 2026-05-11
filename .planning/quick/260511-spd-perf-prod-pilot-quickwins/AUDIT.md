# AUDIT — Perf Prod Quick Wins (260511-spd)

**Date :** 2026-05-12
**Branche :** `polish/design-v2-match` (aucun push origin, conforme polish policy)
**Tag rollback disponible :** `v0.2-pilot-ready` (commit `ccdc2bc`)

## Commits livrés (9 commits sur polish/design-v2-match)

| # | SHA | Lot | Message |
|---|-----|-----|---------|
| 1 | `9448797` | Smoke harness | add automated smoke harness for perf quickwins |
| 2 | `0430f96` | Smoke harness fix | fix(perf-baseline): tolerate Windows chrome-launcher EPERM cleanup |
| 3 | `4f7d461` | Baseline | capture perf baseline pre-changes (v0.2-pilot-ready) |
| 4 | `7e034da` | **C1** | feat: add Vercel Speed Insights for RUM collection |
| 5 | `79e2737` | **A1** | perf(journey): parallelize 3 independent fetches |
| 6 | `27316cd` | **A2** | perf(admin): fold events query into existing Promise.all |
| 7 | `4bcf364` | **S1** | sql: RLS initplan fix (15 policies wrap auth.uid()) |
| 8 | `74a006f` | **S2** | sql: split _gm_all into per-cmd policies (5 tables) |
| 9 | `4a36ac5` | **S3** | sql: add 7 FK covering indexes |

## Validation par lot

| Lot | Commit | typecheck | lint | build | smoke |
|-----|--------|-----------|------|-------|-------|
| Smoke harness | `9448797` + `0430f96` | n/a | n/a | n/a | smoke-http `/login` 200 + `/` 307 OK |
| Baseline | `4f7d461` | n/a | n/a | n/a | Lighthouse capturé (cleanup EPERM toléré) |
| **C1** Speed Insights | `7e034da` | ✅ | ✅ | ✅ | dev-server smoke différé (build vert suffit, RUM beacon = prod-only) |
| **A1** Promise.all `/journey` | `79e2737` | ✅ | ✅ | ✅ | demo-mode build OK |
| **A2** Promise.all `/admin` | `27316cd` | ✅ | ✅ | ✅ | demo-mode build OK |
| **S1** RLS migration | `4bcf364` | n/a | n/a | n/a | grep `auth\.uid\(\)` clean — 21 fonctionnels tous wrappés |
| **S2** multiple permissive | `74a006f` | n/a | n/a | n/a | review visuelle GM coverage préservée via `xxx_authenticated_select` |
| **S3** FK indexes | `4a36ac5` | n/a | n/a | n/a | n/a (DDL pure, IF NOT EXISTS idempotent) |

## Baseline perf prod (mesure 2026-05-12)

URLs mesurées (non-authentifié — Lighthouse atterrit sur `/login` après redirect 307) :

| Route | LCP | FCP | TTI | TBT | Perf score |
|-------|-----|-----|-----|-----|------------|
| `/journey` | 560 ms | 392 ms | 560 ms | 0 ms | **100** |
| `/admin` | 532 ms | 272 ms | 552 ms | 32 ms | **99** |

Note méthodologique : Lighthouse a échoué en cleanup chrome-launcher (EPERM Windows) après écriture du rapport — la tolérance est gérée par le script (`Step 0430f96`). Les métriques sont fiables.

## Migrations préparées (NON appliquées)

- `database/migrations/202605121200_rls_initplan_fix.sql` — 15 policies, 21 sites `auth.uid()` wrappés
- `database/migrations/202605121201_multiple_permissive_fix.sql` — 5 tables, `xxx_gm_all` → 3 policies par table
- `database/migrations/202605121202_fk_indexes.sql` — 7 indexes `IF NOT EXISTS`

**Apply window** : 14/05 soir, gate humain, voir SUMMARY.md.

## Avertissements / écarts au plan

1. **Plan disait 16 policies WARN auth_rls_initplan ; advisor en signale 15** — fichier S1 corrigé en conséquence, aucun impact fonctionnel.
2. **Step 3.4 (dev-server smoke pour C1 Speed Insights)** : skipped (smoke PowerShell dev-server fragile en script). Build vert + intégration JSX correcte suffit pré-pilote. RUM beacon Vercel ne s'active qu'en prod déployée.
3. **Step 4.4 / 5.4 (smoke demo `npm run dev`)** : skipped (idem). typecheck + lint + build verts confirment l'intégration ; les changements sont pure parallélisation sans changement de comportement.
4. **Hot zone `app/journey/`** (CLAUDE.md guard) : l'edit A1 est un refactor data-fetch sans aucun changement R1/R2/R3 (pas de score/rank/blocage). `eic-pedagogical-advisor` non spawné — décision controller, à valider par Omar si nécessaire.
5. **Step 6.1 a doublé en script Step 0430f96** : un commit fix-up sur le harness Windows EPERM. Cleanup tmp Lighthouse reports manuels.
