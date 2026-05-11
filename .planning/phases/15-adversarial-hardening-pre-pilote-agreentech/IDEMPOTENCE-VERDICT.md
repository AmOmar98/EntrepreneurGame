# Phase 15-01 — Verdict idempotence trigger engagement Phase 14

**Date exécution** : YYYY-MM-DD HH:MM (à remplir)
**Exécuté par** : Omar (manuel Cloud Studio SQL Editor)
**Script** : `scripts/test-engagement-trigger-idempotence.sql`
**Migration testée** : `database/migrations/202605110007_phase14_engagement_trigger.sql`

## Procédure d'exécution

1. Ouvrir Cloud Studio : https://supabase.com/dashboard/project/vzzbjxmfkmvqkaqxalhr/sql/new
2. Copier-coller le contenu de `scripts/test-engagement-trigger-idempotence.sql` (tout le fichier).
3. Exécuter (`Run` ou `Ctrl+Enter`). Tous les blocs sont wrappés `begin; ... rollback;` — aucun risque de pollution PROD.
4. Lire les sorties `NOTICE:` dans le panneau "Results" / "Messages".
5. Pour chaque scénario, reporter ci-dessous PASS/FAIL + valeur observée.

## Résultats par scénario

| # | Scénario | Verdict attendu | Verdict observé | PASS/FAIL |
|---|----------|-----------------|-----------------|-----------|
| 1 | Insert duplicate submission (V1+V2 même template) | `score_engagement = 100` (palier Soumis distinct par template) | _à remplir_ | _à remplir_ |
| 2 | Update verdict validate_v1 → reject → validate_v2 | 175 → 125 → 175 (palier Validé Q5=A recalculé) | _à remplir_ | _à remplir_ |
| 3 | Delete submission cascade evaluation | base+175 → base (retour score d'origine) | _à remplir_ | _à remplir_ |
| 4 | Re-eval par 2 mentors distincts (UNIQUE submission_id,evaluator_id) | 175 stable (palier Reviewed distinct par template) | _à remplir_ | _à remplir_ |
| 5 | Backfill idempotent (re-run 2× consécutifs) | `diff = 0` (sum(score_engagement) stable) | _à remplir_ | _à remplir_ |

## Verdict global

_À remplir post-exécution : ALL PASS / N PASS + M FAIL avec détails / SKIP si pré-requis manquants_

## Known limitations / Actions follow-up

_Vide si ALL PASS._

Sinon, deux options :
- **D-02** : known limitation defer SEED-002 v0.3 si non-bloquant pilote.
- **D-16** : escalade owner si FAIL critique compromet l'intégrité du scoring pendant le pilote (par exemple Scénario 5 backfill non-idempotent = drift cumulatif dangereux).

## Notes

- Enum verdict réel en PROD (`database/schema.sql:51`) : `validate_v1 | request_v2 | validate_v2 | reject`. Le PLAN.md mentionnait `reject_v1`/`reject_v2` — n'existent pas, un seul `reject` couvre les deux cas. Le scénario 2 utilise `reject` (et non `reject_v1`).
- Le scénario 4 dépend de l'existence de ≥2 mentors distincts en base (cohorte AgreenTech : M01 + M02 → ok). SKIP si moins.
- Tous les scénarios sont PROD-safe (`rollback;` final).

## Cross-références

- Migration Phase 14 : `database/migrations/202605110007_phase14_engagement_trigger.sql`
- Helper TS miroir : `lib/score.ts:sumPlayerScoreEngagement`
- Q5=A decision : `.planning/phases/14-scoring-engagement-livrables/14-CONTEXT.md`
- Cardinal R1 (badges qualitatifs Player) : `CLAUDE.md` §"Pre-edit guards"
