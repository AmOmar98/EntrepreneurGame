# Phase 14 — PLAN.md (Scoring d'engagement livrables)

**Date** : 2026-05-11
**Auteur** : Ralph (Claude Opus 4.7) — branche `ralph/pre-pilot-phases-13-14`
**Base** : commit `a79c063` (post-14-discuss)
**Cutoff** : 2026-05-12 23h00
**Décisions advisor lockées** (cf. `ADVISOR-VERDICT-DISCUSS.md`) :
- Q1=A (paliers qualitatifs Player, zéro chiffre)
- Q2=A (HORS combined ranking — `lib/results.ts:32` et `:269` INTOUCHABLES)
- Q3=A (trigger DB + helper TS dual-mode)
- Q5=A (Soumis/Reviewed irréversibles, Validé recalculé)

## État existant

- `database/schema.sql:148` : colonne `players.score_engagement numeric(6,2) not null default 0` **existe déjà**, jamais alimentée.
- `lib/types.ts:111` : Player.`scoreEngagement: number` **existe déjà**.
- `lib/score.ts:41-49` : `combineScores()` retourne `{ project, engagement, total }` — déjà câblé sur `scoreEngagement` (renvoie 0 actuellement faute d'alimentation).
- `database/triggers.sql:56-110` : pattern de référence `recalc_player_score()` + trigger `trg_evaluation_recalc` sur evaluations.

## 4 Waves (1 sub-task = 1 commit atomique + push)

### Wave 1 — Migration DB (trigger `recalc_player_engagement`)

**Fichier** : `database/migrations/2026XXXX_phase14_engagement_trigger.sql` (nouveau ; XXXX = horodatage `YYYYMMDDHHMM`).

**Contenu** :
- Fonction `public.recalc_player_engagement(p_player_id uuid)` : pour chaque (player, deliverable_template), calcule
  - +100 si ≥1 submission existe pour ce template
  - +25 si ≥1 evaluation existe pour ≥1 submission de ce template (peu importe verdict)
  - +50 si le **verdict le plus récent par template** est `validate_v1` OR `validate_v2`. (Q5=A : recalcul du palier Validé à chaque update verdict — si reject post-validate, perd +50.)
- Update `players.score_engagement = sum(palierTotal par template)`.
- Trigger `trg_submission_engagement` AFTER INSERT on `submissions` → recalc.
- Trigger `trg_evaluation_engagement` AFTER INSERT OR UPDATE OF verdict on `evaluations` → recalc.
- RLS : pas de changement (la colonne `score_engagement` est déjà sous les policies `players_*`).

**Critères acceptance W1** :
1. Migration appliquée localement en mode Supabase (Branche test si possible, sinon documenté pour Omar applique-prod main-merge).
2. Test SQL inline : insert 1 submission → `score_engagement = 100`. Insert 1 evaluation `validate_v1` → 100+25+50 = 175. Update verdict→`reject` → 100+25 = 125 (palier Validé recalculé, paliers Soumis/Reviewed conservés).
3. RLS test rapide : Player A ne voit pas `players.score_engagement` de Player B (existant via policies).

**Spawn advisor** : OUI (zone sensible `database/`).

**Commit msg** : `(14-01-trigger-engagement) feat(db): recalc_player_engagement + triggers submissions/evaluations`

### Wave 2 — Helper TS dual-mode (`sumPlayerScoreEngagement`)

**Fichier** : `lib/score.ts` (extend).

**Ajout** :
```ts
/**
 * Engagement scoring (Phase 14) — 3 paliers cumulatifs par livrable :
 *   +100 si soumis  +25 si reviewed  +50 si verdict validé courant.
 * Q5=A : palier "Validé" recalculé sur dernier verdict par template
 *        (irréversibilité Soumis/Reviewed garantie).
 *
 * R1 : la valeur retournée NE DOIT JAMAIS être rendue côté Player en numérique
 *      ni en composante d'un classement. Player surface = badges qualitatifs
 *      "Soumis ✓ / Lu par le mentor ✓ / Validé ✓" uniquement.
 *
 * Miroir du trigger DB `recalc_player_engagement()` (database/migrations/...).
 * Pour dual-mode demo (hasSupabaseEnv()===false) — l'UI Player demo dérive
 * les 3 booléens via `getEngagementMilestones()` (helper qualitatif voisin).
 */
export function sumPlayerScoreEngagement(
  submissions: Submission[],
  evaluations: Evaluation[],
): number { ... }

/**
 * Returns the 3 qualitative milestone booleans for a given deliverable_template
 * (Q1=A : badges Player). Used by /journey/deliverable/[id]/page.tsx.
 */
export function getEngagementMilestones(
  templateId: string,
  submissions: Submission[],
  evaluations: Evaluation[],
): { submitted: boolean; reviewed: boolean; validated: boolean } { ... }
```

**Critères W2** : typecheck + lint clean. Pas d'introduction d'imports cycliques.

**Spawn advisor** : OUI (lib/score.ts zone sensible).

**Commit msg** : `(14-02-helper-engagement) feat(score): sumPlayerScoreEngagement + getEngagementMilestones`

### Wave 3 — UI Player (badges qualitatifs)

**Fichiers** :
- Nouveau : `components/engagement-milestones-badges.tsx` (client component compact).
- `app/journey/deliverable/[id]/page.tsx` : insertion `<EngagementMilestonesBadges>` au-dessus du `<ProofWorkflow>` / `<SubmissionTicket>` (placement à valider visuellement).
- `app/globals.css` : 3 styles compacts `.eic-engagement-badge`, `.eic-engagement-badge--submitted/reviewed/validated`. Reduced-motion safe.
- `lib/i18n.ts` : 3 nouvelles clés FR `engagement_milestone_submitted` / `_reviewed` / `_validated`.

**Rules R1** :
- Badges purement qualitatifs (icône + label texte), **aucun chiffre** (+100, +25, +50 INTERDITS Player).
- Aucun total cumulé.
- Aucune comparaison entre teams.

**Critères W3** :
- Audit grep R1 post-edit sur composant + page :
  ```
  grep -nE "100|25|50|175|toFixed|points|pts" \
    components/engagement-milestones-badges.tsx \
    app/journey/deliverable/\[id\]/page.tsx
  ```
  → 0 match dans render JSX.
- Visual demo via dev server : 3 badges visibles, transitions fluides, reduced-motion safe.

**Spawn advisor** : OUI (zone hyper-sensible app/journey + composant Player).

**Commit msg** : `(14-03-ui-player-badges) feat(player): qualitative engagement milestones badges on deliverable page`

### Wave 4 — Admin GM column

**Fichier** : `app/admin/players/[id]/page.tsx` (extend) + `app/admin/page.tsx` overview si tableau cohort.

**Ajout** : colonne / ligne "Engagement : XX/175 pts" **visible uniquement GameMaster**. Comme `score_project`, le rendu numérique est OK ici (GM-only surface).

**Critères W4** :
- Numeric render gated par `role === "game_master"` ou équivalent.
- typecheck + lint + build clean.

**Spawn advisor** : OUI (app/admin/ zone sensible quoique GM-side).

**Commit msg** : `(14-04-ui-admin-engagement) feat(admin): score_engagement column in players admin view`

### Wave 5 — Smoke régression + audit final

**Étapes** :
1. Smoke demo mode : curl /landing /journey /admin /results /mentor → tous 200.
2. Smoke Supabase mode (si .env.local activable) : login GM, vérifier colonne engagement visible. Sinon → DEFERRED Omar manuel.
3. Audit grep R1 final sur surfaces Player après tout commit Wave 1-4 :
   ```
   grep -rn "score\|rank\|note\|/100\|/140\|points\|toFixed\|engagement.*\d" \
     app/journey app/results components/results-* components/submission-* \
     components/engagement-* --include="*.tsx"
   ```
   → 0 match Player-facing.
4. typecheck + lint + build clean global.

**Critères W5** : SUMMARY.md écrit avec SHA des 4 waves + verdict R1 final + risques résiduels.

**Commit msg** : `(14-05-smoke-summary) chore(phase14): smoke régression + R1 audit final + SUMMARY`

## Risques identifiés + mitigations

| Risque | Probabilité | Mitigation |
|---|---|---|
| Trigger DB ralentit insertion submissions/evaluations | Faible | recalc_player_score fait déjà le même pattern sans plainte perf. score_engagement est plus simple (3 booléens par template). |
| R1 leak accidentel dans badges UI | Moyen | Advisor spawn obligatoire W3 + audit grep post-edit obligatoire. |
| Migration appliquée localement, oubliée PROD | Moyen | Documenter dans SUMMARY.md la procédure d'application PROD pour Omar (5min via `supabase db push` ou direct SQL Cloud Studio). |
| Helper TS dual-mode désync trigger DB | Faible | Tests d'inline (W1) + miroir strict, mêmes règles `verdict in ('validate_v1','validate_v2')`. |

## Ordre d'exécution

**Sériel** : W1 → W2 → W3 → W4 → W5. (Pas de parallélisme — W3 dépend de W2 helper, W4 dépend de W2.)

Chaque commit doit passer typecheck + lint + build + push origin avant le suivant. Si build fail, 1 tentative de fix, sinon revert et log dans `BLOCKED.md`.

## Conditions GO advisor (rappel)

1. Q1=A, Q2=A, Q3=A+helper, Q5=A ✅ acquis discuss.
2. Audit grep R1 obligatoire ✅ inclus W3 et W5.
3. `lib/results.ts:32` et `:269` INTOUCHABLES ✅ acquis (Phase 14 ajoute, ne remplace pas).
4. Smoke régression W5 ✅ inclus.
5. Tag `v0.2.3-phase14-engagement` à poser par Omar post-merge main (PAS par Ralph — mission §règles transverses).

---

**Plan finalisé. Démarrage W1 immédiat post-commit ce PLAN.md.**
