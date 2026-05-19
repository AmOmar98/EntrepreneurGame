# PLAN — Perf prod quick wins pilote AgreenTech (260511-spd)

**Statut :** brainstorming validé, design approuvé par Omar 2026-05-11, branche+merge décidés 2026-05-12.
**Branche cible :** `polish/design-v2-match` (branche existante, pas de nouvelle branche). Tous les lots y sont commités.
**Politique main :** stricte. Aucun commit sur `main` avant 14/05 soir. Merge polish→main + apply migration RLS S1 + redeploy = post-pilote.
**Source :** session brainstorming `superpowers:brainstorming` 2026-05-11, prompt initial « brainstorm how we can improve speed ».

---

## 1. Contexte

Pilote AgreenTech 13-14 mai 2026, J-2. Repo en gel `v0.2-pilot-ready` côté `main` (commit `ccdc2bc`). Aucune mesure de perf prod n'a été faite. Ressenti subjectif Omar : `/journey` (porteur) et `/admin` (GameMaster) lents.

**Objectif énoncé** : améliorer la perf prod, en parallèle (1) hotfix pilote-utile et (2) chantier de fond v0.3.

**Contraintes** :
- Policy `main` gelée à `v0.2-pilot-ready` — hotfix uniquement pour bugs blockers R1/R2/R3.
- Solo dev + Claude, fenêtre 11/05 → 12/05 23h00 maxi pour pré-pilote.
- Aucun test E2E automatisé sur perf — validation manuelle Lighthouse + smoke.

## 2. Scope (in)

Six lots issus du diagnostic code + advisors Supabase (`mcp__supabase__get_advisors` 2026-05-11).

### Lot C1 — Vercel Speed Insights (RUM)
- **Quoi** : ajouter `<SpeedInsights />` dans `app/layout.tsx`, dépendance `@vercel/speed-insights`.
- **Pourquoi** : aucun RUM aujourd'hui. Une fois mergé post-pilote, collecte LCP/INP/TTFB sur trafic interne — base de mesure pour v0.3.
- **Trade-off accepté** : pas de RUM pilote 13-14/05 (la fenêtre 11 porteurs sur vrais devices est perdue). Décision Omar 2026-05-12 = strict polish-branch policy prioritaire.
- **Branche** : `polish/design-v2-match`.
- **Fichiers** : `app/layout.tsx`, `package.json`, `package-lock.json`.

### Lot A1 — `Promise.all` route `/journey`
- **Quoi** : transformer 4 awaits séquentiels en `Promise.all`. Spécifiquement :
  ```ts
  // avant : 4 round-trips séquentiels après auth
  const data = await getJourneyData(user?.id ?? "");
  const cohortPulse = await getCohortPulse(user?.id ?? "");
  const announcements = hasSupabaseEnv() && user
    ? await getAnnouncementsForPlayer(user.id, 5) : [];
  // après : 1 round-trip parallèle
  const [data, cohortPulse, announcements] = await Promise.all([
    getJourneyData(user?.id ?? ""),
    getCohortPulse(user?.id ?? ""),
    hasSupabaseEnv() && user ? getAnnouncementsForPlayer(user.id, 5) : Promise.resolve([]),
  ]);
  ```
- **Bonus** : `getCurrentUser` + `getCurrentRole` également séquentiels — à fusionner si helper combiné existe ou à créer `getCurrentUserAndRole()` dans `lib/auth.ts`.
- **Pourquoi** : 3 awaits indépendants → -200 à -500ms TTFB attendu (mesure post-merge).
- **Branche** : `polish/design-v2-match`.
- **Fichiers** : `app/journey/page.tsx`, optionnellement `lib/auth.ts`.

### Lot A2 — `Promise.all` route `/admin`
- **Quoi** : intégrer la query `events` (lignes ~63-78 de `app/admin/page.tsx`) dans le `Promise.all` existant des 3 aggrégats GM. Optionnel : fusionner `getCurrentUser` + `getCurrentRole`.
- **Pourquoi** : -100 à -200ms TTFB sur cockpit GM (mesure post-merge).
- **Branche** : `polish/design-v2-match`.
- **Fichiers** : `app/admin/page.tsx`.

### Lot S1 — RLS initplan fix (16 policies)
- **Quoi** : migration SQL `database/migrations/12-rls-initplan-fix.sql` qui réécrit les 16 policies WARN détectées par `auth_rls_initplan` advisor.
- **Pattern** :
  ```sql
  ALTER POLICY "submissions_member_self_insert" ON public.submissions
    USING (... user_id = (select auth.uid()) ...);
  ```
- **Tables impactées** : `profiles` (3), `player_members` (1), `submissions` (2), `evaluations` (2), `pitch_scores` (2), `evaluation_comments` (1), `announcements` (2), `bonus_events` (1), `moscow_cards` (1).
- **Pourquoi** : à 11 porteurs gain modéré ; à 50+ devient majeur. Migration mécanique, comportement RLS strictement identique. Sur le hot path `getJourneyData` (`player_members`, `submissions`).
- **Branche fichier SQL** : `polish/design-v2-match` (commit du fichier de migration uniquement).
- **Application Supabase prod** : ⚠️ DIFFÉRÉE au moment du merge polish→main post-pilote (14/05 soir). NE PAS appliquer via `mcp__supabase__apply_migration` avant cette date — la migration tourne en même temps que le redeploy Vercel post-merge.
- **Validation** : tests RLS via swarm porteur P01 + mentor M01 après application — pas de régression accès.

### Lot S2 — `multiple_permissive_policies` (5 tables)
- **Quoi** : consolidation ou marquage `restrictive` des policies dupliquées sur `cohorts`, `deliverable_templates`, `events`, `levels`, `missions`.
- **Pourquoi** : chaque SELECT exécute 2 policies (`xxx_authenticated_select` + `xxx_gm_all`) — surcoût RLS modéré.
- **Branche fichier SQL** : `polish/design-v2-match`. Application Supabase prod = même fenêtre que S1 (post-merge 14/05).

### Lot S3 — Indexes FK manquants
- **Quoi** : `CREATE INDEX CONCURRENTLY` sur 7 FKs identifiés par `unindexed_foreign_keys` advisor.
- **FKs** : `announcements.created_by_user_id`, `bonus_events.claimed_by`, `bonus_events.reviewed_by`, `missions.level_id`, `moscow_cards.created_by`, `pitch_scores.player_id`, `submissions.submitted_by`.
- **Pourquoi** : utile pour jointures GM et cascade DELETE. Impact pilote négligeable (11 porteurs).
- **Branche fichier SQL** : `polish/design-v2-match`. Application Supabase prod = même fenêtre que S1 (post-merge 14/05).

## 3. Hors scope (queued v0.3)

- Refonte `getJourneyData` en RPC Postgres unique (collapse 5 queries → 1).
- Suspense streaming sur `/journey` (CohortPulse + Announcements + BonusRail).
- Partial Prerendering (PPR) Next.js 15 sur shell `/journey`.
- Bundle splitting `JourneyClient`.
- `loading.tsx` skeletons par route.
- Cleanup 6 unused indexes (`deliverable_templates_active_idx`, `announcements_event_created_idx`, `announcements_kind_idx`, `bonus_events_status_idx`, `bonus_events_validated_active_idx`, `moscow_cards_project_idx`).
- Audit bundle JS client + tree-shaking lucide-react.
- Cache headers DiceBear avatars.

## 4. Ordre d'exécution

**Phase pré-pilote (12/05 — sur `polish/design-v2-match`, AUCUN commit main)** :

| # | Lot | Action locale | Validation locale |
|---|-----|---------------|-------------------|
| 1 | C1 Speed Insights | `npm i @vercel/speed-insights` + edit `app/layout.tsx` + commit | typecheck + lint + build |
| 2 | A1 Promise.all /journey | edit `app/journey/page.tsx` (+ `lib/auth.ts` si helper combiné) + commit | typecheck + lint + build + smoke local `/journey` (npm run dev, compte demo) |
| 3 | A2 Promise.all /admin | edit `app/admin/page.tsx` + commit | typecheck + lint + build + smoke local `/admin` |
| 4 | S1 fichier migration | créer `database/migrations/12-rls-initplan-fix.sql` (16 ALTER POLICY) + commit. ⚠️ NE PAS apply Supabase. | Lint SQL local, validation visuelle pattern `(select auth.uid())` partout |
| 5 | S2 fichier migration | créer `database/migrations/13-multiple-permissive-fix.sql` + commit | Lint SQL local |
| 6 | S3 fichier migration | créer `database/migrations/14-fk-indexes.sql` (`CREATE INDEX CONCURRENTLY`) + commit | Lint SQL local |

**Phase post-pilote (14/05 soir, après cérémonie reveal)** :

| # | Action | Détails |
|---|--------|---------|
| A | Tag pré-merge | `git tag v0.2.1-pre-perf-merge` sur `main` HEAD (= `v0.2-pilot-ready`) + `git push origin v0.2.1-pre-perf-merge` — rollback distant disponible |
| B | Merge polish→main | `git checkout main && git merge polish/design-v2-match --no-ff` (ou rebase selon état branche) |
| C | Apply S1 migration | `mcp__supabase__apply_migration` avec contenu de `12-rls-initplan-fix.sql` |
| D | Re-run advisor | `mcp__supabase__get_advisors --type performance` → 0 WARN `auth_rls_initplan` |
| E | Apply S2 + S3 migrations | dans l'ordre 13 puis 14 |
| F | Push main + redeploy Vercel | `git push origin main` (déclenche redeploy automatique) |
| G | Smoke prod | swarm porteur P01 + mentor M01 (login + flux principal) — vérifier 0 erreur RLS |
| H | Mesure perf | Lighthouse mobile prod `/journey` + `/admin` — comparaison vs baseline pré-merge |

**Baseline pré-merge à capturer avant phase post-pilote** : Lighthouse mobile sur prod actuelle (`v0.2-pilot-ready`) `/journey` + `/admin` + Network waterfall — sauvegarder dans `SUMMARY.md` pour comparaison après-merge.

## 5. Plan validation

**Phase pré-pilote (par commit local sur polish branch)** :
- `npm run typecheck && npm run lint && npm run build` — exit 0 obligatoire avant chaque commit.
- Smoke local manuel `/journey` (mode demo, pas besoin de Supabase) + `/admin` (mode demo) après A1 et A2.
- Validation visuelle SQL S1/S2/S3 — diff manuel des policies / index avec `database/rls.sql` actuel pour détecter divergences.

**Phase post-pilote (après merge + apply migrations)** :
- Re-run `mcp__supabase__get_advisors --type performance` → 0 WARN `auth_rls_initplan`, 0 WARN `multiple_permissive_policies`, 0 INFO `unindexed_foreign_keys` sur les 7 FKs ciblés.
- Smoke prod manuel : login P01 → /journey → soumission L2.1 ; login M01 → /mentor → eval submission. Aucune erreur RLS access denied.
- Lighthouse mobile prod `/journey` + `/admin` — capture LCP/TTFB/INP delta vs baseline.

## 6. Risques + mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Speed Insights cassé / lourd | Très faible | Faible (lazy script) | Composant Vercel officiel. Rollback = revert 1 commit. |
| Migration RLS S1 casse accès post-merge | Faible | Élevé (régression post-pilote détectée tard) | Pattern `(select auth.uid())` strictement équivalent. Smoke prod immédiat post-apply (étape G). Rollback = ALTER POLICY revert (script préparé en commentaire de la migration). |
| `Promise.all` casse comportement | Très faible | Moyen | Refactor pur sémantique-équivalent. Smoke local complet avant commit. Détection au plus tard au smoke post-merge. |
| S2 multiple_permissive consolidation modifie sémantique GM | Moyenne | Moyen | Lecture attentive de `database/rls.sql` actuel + diff manuel. Si ambigu : queue S2 v0.3 (ne pas livrer dans ce batch). |
| Merge polish→main conflits massifs | Moyenne | Moyen | Polish branch a déjà 2-3 commits design. Anticiper résolution conflits sur `app/layout.tsx` (si autre polish y touche). |
| Lighthouse local ≠ prod | Moyenne | Faible | Mesurer aussi sur prod après merge — c'est la vraie référence. |

## 7. Décisions ouvertes

Aucune. Décisions actées :
- Tout polish strict (pas de hotfix main pré-pilote) — Omar 2026-05-12.
- Branche : `polish/design-v2-match` existante — Omar 2026-05-12.
- S1 migration appliquée au moment du merge polish→main — Omar 2026-05-12.
- S2 + S3 OK pour ce batch — Omar 2026-05-12.

## 8. Critères de succès

**Pré-pilote (12/05)** :
- 6 commits sur `polish/design-v2-match` : C1, A1, A2, S1 SQL, S2 SQL, S3 SQL.
- typecheck + lint + build verts à chaque étape.
- Baseline Lighthouse prod capturée et stockée dans `SUMMARY.md`.

**Post-pilote (14/05 soir)** :
- Merge polish→main réussi sans conflit non-résolu.
- 3 migrations appliquées Supabase (S1, S2, S3) — 0 WARN advisor sur les 16+5+0 items ciblés.
- Smoke prod P01 + M01 OK — 0 erreur RLS.
- Speed Insights actif et capture des premières datapoints.
- Mesure Lighthouse post-merge documentée — delta vs baseline visible.

## 9. Artefacts attendus dans ce dossier

- `PLAN.md` (ce fichier) — design validé.
- `AUDIT.md` — diff git + résultats typecheck/lint/build par lot.
- `ADVISOR-VERDICT.md` — verdict `eic-pedagogical-advisor` sur changements zone Player (R1/R2/R3 — devrait être PASS systématique car aucun changement comportement Player).
- `SUMMARY.md` — SHA des commits + métriques avant/après Lighthouse + screenshots.
- `deferred-items.md` — items reportés v0.3 (cf. section 3 Hors scope).
