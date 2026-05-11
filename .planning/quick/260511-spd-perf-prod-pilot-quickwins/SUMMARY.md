# SUMMARY — Perf Prod Quick Wins (260511-spd)

## Statut

✅ **Phase 1 complete** — 6 lots livrés (3 perf app + 3 SQL migrations) sur `polish/design-v2-match`. 10 commits atomiques. Migrations préparées **mais NON appliquées**. Awaiting Omar **14/05 evening** pour Phase 2 (apply + merge polish → main).

## Décisions clés

- **Tout polish strict** : aucun commit `main` pré-pilote (policy CLAUDE.md). Omar 2026-05-12.
- **Branche** : `polish/design-v2-match` (locale uniquement, pas de push origin).
- **Apply migrations + merge polish→main** : post-pilote 14/05 soir (gate humain).
- **Plan EXEC-PLAN.md** : 9/10 tasks exécutées as-is. Écarts documentés dans AUDIT.md §Avertissements.

## Commits livrés (10 sur polish/design-v2-match)

```
4a36ac5  (quick-260511-spd) sql: add 7 FK covering indexes
74a006f  (quick-260511-spd) sql: split _gm_all into per-cmd policies (5 tables)
4bcf364  (quick-260511-spd) sql: RLS initplan fix (15 policies wrap auth.uid())
27316cd  (quick-260511-spd) perf(admin): fold events query into existing Promise.all
79e2737  (quick-260511-spd) perf(journey): parallelize 3 independent fetches
7e034da  (quick-260511-spd) feat: add Vercel Speed Insights for RUM collection
4f7d461  (quick-260511-spd) capture perf baseline pre-changes (v0.2-pilot-ready)
0430f96  (quick-260511-spd) fix(perf-baseline): tolerate Windows chrome-launcher EPERM cleanup
9448797  (quick-260511-spd) add automated smoke harness for perf quickwins
cbb1e6f  (quick-260511-spd) audit: validation results per lot
```
*(SUMMARY commit + deferred-items à venir.)*

## Baseline perf (v0.2-pilot-ready, 2026-05-12)

| Route | LCP | FCP | TTI | TBT | Score |
|-------|-----|-----|-----|-----|-------|
| `/journey` | 560 ms | 392 ms | 560 ms | 0 ms | **100** |
| `/admin` | 532 ms | 272 ms | 552 ms | 32 ms | **99** |

Mesure non-authentifiée (Lighthouse hit `/login` après redirect 307). Acceptable comme baseline TTFB shell. Mesure authentifiée = scope v0.3.

## Apply procedure 14/05 soir (gate humain)

⚠️ **Aucune étape ci-dessous ne doit être exécutée par un agent pré-pilote.** Reste un guide pour l'opérateur humain.

1. **Tag pré-merge `main`** :
   ```powershell
   git checkout main
   git tag v0.2.1-pre-perf-merge
   git push origin v0.2.1-pre-perf-merge
   ```

2. **Smoke régression sur polish** (avant merge) :
   ```powershell
   git checkout polish/design-v2-match
   npm run typecheck && npm run lint && npm run build
   ```

3. **Merge polish → main** :
   ```powershell
   git checkout main
   git merge polish/design-v2-match --no-ff -m "merge polish/design-v2-match -> main (post-pilote 14/05)"
   ```
   Conflits probables sur `app/layout.tsx` si autre polish y a touché (résolution manuelle, garder `<SpeedInsights />`).

4. **Apply migrations Supabase via MCP** (ordre strict) :
   - `mcp__plugin_supabase_supabase__apply_migration` name=`rls_initplan_fix` query=contenu `database/migrations/202605121200_rls_initplan_fix.sql`
   - idem `multiple_permissive_fix` (`202605121201_*.sql`)
   - idem `fk_indexes` (`202605121202_*.sql`)

5. **Re-run advisor** `mcp__plugin_supabase_supabase__get_advisors --type performance` → vérifier :
   - 0 WARN `auth_rls_initplan`
   - 0 WARN `multiple_permissive_policies` sur 5 tables ciblées
   - 0 INFO `unindexed_foreign_keys` sur les 7 FKs ciblés

6. **Push main + redeploy Vercel auto** :
   ```powershell
   git push origin main
   ```

7. **Smoke prod automatisé** (env vars depuis `.env.local`) :
   ```powershell
   node scripts/smoke-http.mjs
   $env:SMOKE_EMAIL="<P01 email>"; $env:SMOKE_PWD="<P01 pwd>"
   $env:NEXT_PUBLIC_SUPABASE_URL="<prod url>"; $env:NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key>"
   node scripts/smoke-rls-prod.mjs
   node scripts/perf-baseline.mjs .planning/quick/260511-spd-perf-prod-pilot-quickwins/post-merge-prod.json
   ```

8. **Comparer baseline vs post-merge** :
   ```powershell
   Get-Content .planning/quick/260511-spd-perf-prod-pilot-quickwins/baseline-prod.json
   Get-Content .planning/quick/260511-spd-perf-prod-pilot-quickwins/post-merge-prod.json
   ```
   Compléter cette section avec le delta mesuré.

9. **Rollback distant** si régression critique :
   ```powershell
   git reset --hard v0.2.1-pre-perf-merge
   git push origin main --force-with-lease
   # Et appliquer le rollback SQL (commentaires en footer de chaque fichier migration)
   ```

## Critères de succès atteints

- [x] 1 smoke harness + 1 baseline + 6 commits feature + 1 AUDIT + 1 SUMMARY = 10 commits atomiques sur polish branch.
- [x] typecheck + lint + build verts pour chaque commit code (C1, A1, A2).
- [x] Baseline perf capturée.
- [x] Migrations préparées mais **NON appliquées** (gate humain post-pilote).
- [x] Aucun push origin sur polish branch (policy CLAUDE.md respectée).
- [x] Tag `v0.2-pilot-ready` (`ccdc2bc`) intact comme rollback distant.

## Gates humains restants (pré-pilote)

Aucun. Le scope quick est livré. Le pilote 13-14/05 tourne sur `v0.2-pilot-ready` inchangé.

## Gates humains post-pilote (14/05 soir)

1. Décision merge polish→main (Omar)
2. Apply 3 migrations Supabase via MCP
3. Smoke prod authentifié (smoke-rls-prod.mjs + perf-baseline post-merge)
4. Validation delta perf vs baseline → décider keep/rollback
