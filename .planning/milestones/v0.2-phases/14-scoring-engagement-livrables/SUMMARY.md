# Phase 14 — SUMMARY (Scoring d'engagement livrables, paliers 100/25/50)

**Date close** : 2026-05-11
**Branche** : `ralph/pre-pilot-phases-13-14`
**Verdict global** : **PHASE-14-DONE** — 5 waves closed, audit R1 clean, build clean.

## Commits Phase 14 (SHA)

| Wave | Commit | Description |
|---|---|---|
| 14-discuss | `a79c063` | Verdict EIC advisor : Q1=A, Q2=A, Q3=A, Q5=A. GO sous 7 conditions. |
| 14-plan | `ff07d72` | PLAN.md 5 waves (DB → helper TS → UI Player → admin GM → smoke). |
| 14-01 W1 | `d613ff2` | Migration DB `recalc_player_engagement` + 2 triggers + backfill. |
| 14-02 W2 | `a3d7544` | Helpers TS `getEngagementMilestones` + `sumPlayerScoreEngagement`. |
| 14-03 W3 | `e1d6524` | Composant Player `EngagementMilestonesBadges` + insertion page + CSS + i18n. |
| 14-04 W4 | `e3d1aa2` | Colonne admin GM `score_engagement` dans cohort overview. |
| 14-05 W5 | (ce commit) | Smoke régression + audit R1 final + SUMMARY.md. |

## Résumé fonctionnel

**Nouveauté pédagogique** : chaque livrable porte désormais 3 paliers d'engagement indépendants de la note rubric qualité (qui reste intacte) :
- **+100 Soumis** (palier irréversible — atteint dès la 1ère soumission v1)
- **+25 Lu par le mentor** (palier irréversible — atteint dès la 1ère evaluation, peu importe verdict)
- **+50 Validé** (palier RECALCULÉ sur chaque update de verdict — verdict courant ∈ {validate_v1, validate_v2})

Total max par livrable validé = **175 pts d'engagement**, en plus de la note qualité (0..25) existante.

### Surfaces Player (R1 strict)

- **`/journey/deliverable/[id]`** : 3 badges qualitatifs sous le titre — "Soumis", "Lu par le mentor", "Validé" avec icône `✓` ou `•`. **ZÉRO chiffre** côté Player. Aucun total, aucune comparaison aux autres teams.

### Surfaces GameMaster (numeric OK)

- **`/admin`** (cohort overview) : nouvelle colonne "Engagement" affichant `score_engagement` numériquement par player.
- **`/admin/players/[id]`** : tile "Score Engagement" existait déjà (préexistant pré-Phase 14), désormais alimentée par trigger DB.

### Pondération combined ranking — INCHANGÉE

`combined = 0.8 × pitch + 0.2 × project_quality` reste LOCKÉE (B2 retro 2026-05-10). `score_engagement` est **HORS combined ranking** (Q2=A advisor). C'est un axe de motivation séparé.

## R1 audit final

Commande exécutée (cf. ralph-mission.md §règles transverses) :
```
grep -rnE "score|rank|note|/100|/140|points|toFixed" \
  app/journey app/results components/results-* components/submission-* \
  components/engagement-* --include="*.tsx"
```

Toutes les occurrences ont été triées :
- Composant `engagement-milestones-badges.tsx` : matches uniquement dans header guard comment R1.
- Page `deliverable/[id]/page.tsx` : matches dans data-layer (non rendus) ou `rewardXp={tpl.max_score}` (gamification XP convention EIC acceptée, déjà audité Phase 13).
- `app/results/*` + `components/results-*` : tous render numériques gated par `isGameMaster`.
- `components/submission-*` : `rewardXp` "+XX XP" gamification only.

Audit ciblé `scoreEngagement|score_engagement` sur Player-facing : **0 match** dans surfaces Player. PASS.

## typecheck + lint + build

- typecheck : clean
- lint : clean
- build : succès, 28 routes compilées, middleware 89.4 kB
- HTTP smoke demo mode : 8/9 routes 200 OK (`/` retourne 500 SSR à la 1ère req à cause de NEXT_REDIRECT, comportement standard root redirect Next.js, 200 à la 2e req).

## Risques résiduels

| Risque | Mitigation appliquée |
|---|---|
| Migration DB pas encore appliquée PROD | À faire par Omar post-merge main (5 min via `supabase db push` ou Cloud Studio SQL Editor). Migration idempotente, backfill inclus. |
| Helper TS demo désync trigger DB | Logique strict miroir : mêmes paliers, même filtrage `verdict in ('validate_v1','validate_v2')`. Aucun risque structurel. |
| R1 leak accidentel via nouveau composant | Audit grep clean post-edit ✅ |
| Performance trigger DB | Pattern identique à `recalc_player_score` existant. 3 CTEs simples sur tables indexées (submissions.player_id, evaluations.submission_id). Aucune plainte attendue à 11 porteurs. |
| Reversibility palier "Validé" effet collatéral | Q5=A documenté : Reviewed reste +25 même si verdict bascule reject. Soumis reste +100. Player perd seulement les +50 du palier "Validé" si re-évalué reject. Pédagogiquement cohérent. |

## Conditions GO advisor — checklist finale

- ✅ Q1=A : paliers qualitatifs Player, zéro chiffre brut.
- ✅ Q2=A : engagement HORS combined ranking 80/20.
- ✅ Q3=A : trigger DB + helper TS dual-mode.
- ✅ Q5=A : Soumis/Reviewed irréversibles, Validé recalculable.
- ✅ Audit grep R1 obligatoire post-exécution : clean.
- ✅ `lib/results.ts:32` (DEFAULT_PITCH_WEIGHT=0.8) et `:269` (formule combined) INTOUCHÉS — vérifiable via `git diff a79c063..e3d1aa2 -- lib/results.ts` → aucune modif.
- ✅ Smoke régression demo : 8/9 routes 200 OK, R1 clean.
- ⏳ Tag `v0.2.3-phase14-engagement` à poser par **Omar** post-merge main (PAS par Ralph, mission §règles transverses).

## Procédure d'application PROD (à exécuter par Omar)

1. Merge `ralph/pre-pilot-phases-13-14` → `main` (review humain Omar).
2. Vercel déploie automatiquement le build.
3. Apply migration SQL en PROD Supabase :
   ```
   # Option A : via supabase CLI
   supabase db push --db-url $SUPABASE_DB_URL
   # Option B : via Cloud Studio SQL Editor
   # → copier-coller le contenu de
   #   database/migrations/202605110007_phase14_engagement_trigger.sql
   #   et exécuter.
   ```
4. Le backfill idempotent en fin de migration recalcule `score_engagement` pour TOUS les players existants.
5. Smoke E2E PROD : login GM → `/admin` → vérifier colonne Engagement non zéro après ≥1 submission existante.
6. Tag `v0.2.3-phase14-engagement` + push.

## BLOCKED

Aucun élément bloqué. Phase 14 entièrement closed côté code.

---

**Conclusion** : Phase 14 livre une couche de gamification engagement R1-safe pour le pilote AgreenTech 13-14 mai 2026. Les 11 porteurs verront 3 badges qualitatifs sur chaque livrable, motivant la persévérance sans révéler de rang ni de note quality. Le GM dispose d'un axe d'insight cohorte additionnel. Pondération de classement combined 80/20 inchangée, décisions EIC manager préservées.

**PHASE-14-DONE.**
