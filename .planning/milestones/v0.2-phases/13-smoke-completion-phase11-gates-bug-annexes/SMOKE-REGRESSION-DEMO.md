# Wave D / 13-09 — Smoke régression demo mode

**Date** : 2026-05-10
**Auteur** : Ralph (Claude Opus 4.7) — branche `ralph/pre-pilot-phases-13-14`
**Mode** : demo (sans `.env.local` Supabase — fallback seed `lib/seed/`)
**Verdict global** : **PASS** — Aucune régression côté demo après Wave B (G1/G3/G4) + Wave C (13-07/13-08) + cohort-pulse L0 fix.

## HTTP smoke (curl, port 3000 clean)

Toutes les routes critiques répondent HTTP 200 en demo mode après reset .next cache + restart dev server.

| Route | Code | Statut |
|---|---|---|
| `/` | 200 | OK |
| `/landing` | 200 | OK |
| `/login` | 200 | OK |
| `/journey` | 200 | OK |
| `/onboarding` | 200 | OK |
| `/mentor` | 200 | OK |
| `/admin` | 200 | OK |
| `/results` | 200 | OK |
| `/jury` | 200 | OK |

> Note : en demo mode `hasSupabaseEnv() === false`, donc `middleware.ts` no-op et aucune route ne redirige vers /login. Toutes les pages rendent le seed `lib/seed/` (joueur démo Atlas Soil etc.).

## R1 audit grep — surfaces Player-facing

Commande (par mission `ralph-mission.md` §règles transverses) :

```
grep -rn "score\|rank\|note\|/100\|/140\|points\|toFixed" \
  app/journey app/results components/results-* components/submission-* \
  --include="*.tsx"
```

### Verdict matches → analyse R1

Toutes les occurrences ont été triées par destination de rendu :

| Fichier | Ligne | Match | R1 statut |
|---|---|---|---|
| `app/journey/bonus/[type]/page.tsx` | 4 | `R1 STRICT : no score / multiplier numerique render. Only qualitative BonusStatusBadge.` | Comment guard — pas de leak |
| `app/journey/deliverable/[id]/moscow-snapshot/page.tsx` | 5 | `R1 STRICT : no score/rank/multiplier in render.` | Comment guard — pas de leak |
| `app/journey/deliverable/[id]/page.tsx` | 43, 153, 192, 194, 203, 210, 217-218 | `max_score`, `scores`, `total_score`, `totalScore` dans data shape | Data-layer uniquement ; non rendu (cf RevisionPanel) |
| `app/journey/deliverable/[id]/page.tsx` | 359, 397 | `rewardXp={tpl.max_score}` passé à `SubmissionTicket` / `RevisionPanel` | Gamification XP "+25 XP" (max possible du livrable), pas une note qualité mentor → OK convention EIC |
| `app/results/page.tsx` | 47-87 | `score_project`, `totalScoreProject`, agrégats | Computed server-side, rendu uniquement dans branches `isGm ?` (L140-148, L162-... GM preview) |
| `app/results/page.tsx` | 113-241 | `ranking.rows`, `rank`, `pitchAvg.toFixed(1)`, `scoreProject.toFixed(1)`, `combined.toFixed(1)` | Tous dans branche GM (L162+ GameMaster preview table) ou dans `<ResultsReplay isGameMaster={isGm}>` qui propage le gate jusqu'aux numeric renders |
| `components/results-podium.tsx` | 15, 34, 65 | `isGameMaster: boolean` prop, score render `isGameMaster ? ...` | Gate explicite ; Player voit medal+team name, pas le score |
| `components/results-replay.tsx` | 25, 50, 86, 94, 179 | `isGameMaster` prop propagé + gates conditionnels | OK |
| `components/results-stats-strip.tsx` | 27 | `stats.totalScoreProject.toLocaleString` | Component consommé par `ResultsReplay` qui gate par `isGameMaster` |
| `components/submission-readonly.tsx` | (legacy) | aucune mention score | OK |
| `components/submission-form.tsx` | (form input) | aucun render score | OK |
| `components/submission-ticket.tsx` | 25, 54, 66-67 | `rewardXp` rendu `+{rewardXp} XP` + aria-label | Gamification XP (cf. ci-dessus). Pas note mentor. R1 OK. |

### Composants dead-code identifiés

- **`components/submission-feedback-card.tsx`** : contient `evaluation.totalScore.toFixed(1)` (R1 leak potentiel) mais **n'est plus consommé** par aucune page (replaced par `RevisionPanel` cf. comment `revision-panel.tsx:2`). Dead code — cleanup recommandé post-pilote (5 min).

## Audit grep R1 — Verdict final

**PASS** côté Player-facing strict. Aucune note quality / rang / pourcentage / total mentor ne fuite côté Player. Les seuls render numériques sont :
1. `+XX XP` (gamification XP = max_score du livrable, motivation) — convention EIC acceptée.
2. Comptes "X/Y" du cohort pulse (anonymisé, aucune identification team).

## Régression Wave B/C — Vérifications spécifiques

| Sous-tâche Wave B/C | Vérification régression | Résultat |
|---|---|---|
| 13-07 logout button type | `/journey` rend `LogoutButton` `type="button"` ; flux signOut conservé | OK (200 sur /journey) |
| 13-08 Pouls L0 fix | `PULSE_LEVELS` passé de 6 à 5, composant CohortPulse itère dynamiquement | OK (typecheck clean, /journey 200) |
| 13-05 Reduced-motion | 13 guards CSS + 1 guard JS | OK (audit code) |
| 13-06 Mobile 390 topbar | `@media (max-width: 420px)` cache pills+brand-sub | OK (scrollWidth=clientWidth après fix) |
| 13-04 G4 radar dashed | SVG `strokeDasharray="1.2 1.2"` dans admin-radar.tsx | OK (code review, attend visual confirm PROD) |

## typecheck + lint + build

```
$ npm run typecheck && npm run lint && npm run build
```

- typecheck : clean
- lint : clean
- build : succès, 28 routes statiques + dynamiques compilées, middleware 89.4 kB

## Conclusion

Wave D **PASS**. Aucune régression introduite par les Wave B/C fixes. Tous les audits R1 sont clean côté Player-facing. Pas de blocker pour le pilote AgreenTech 13/05 8h30 côté demo / code.

### À retenir pour Omar pré-pilote
1. **PROD smoke E2E** (Wave A 13-01/02/03) reste à faire avec credentials swarm + MCP isolated ou ops manuelle.
2. **Visual confirm /admin?live=1 dashed radar** : 5 min ops post-merge.
3. **Cleanup dead code** `submission-feedback-card.tsx` : 5 min cleanup post-pilote (non blocker).
