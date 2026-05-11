# Phase 15-04 — Verdict concurrence mentors / V1+V2 / publish results

**Date** : YYYY-MM-DD HH:MM (à remplir)
**Exécuté par** : Omar (Cloud Studio, 2 onglets pour scénario A vraie concurrence)
**Script** : `scripts/test-concurrent-evaluations.sql`

## Procédure d'exécution

### Run baseline déterministe (1 onglet)
1. Cloud Studio SQL Editor : https://supabase.com/dashboard/project/vzzbjxmfkmvqkaqxalhr/sql/new
2. Coller tout le contenu de `scripts/test-concurrent-evaluations.sql`
3. Run → lire les `NOTICE:` des 3 scénarios + bonus uniqueness.

### Run racy (2 onglets — vraie concurrence)
Voir bloc `\echo` final du script SQL. Ouvrir 2 onglets Cloud Studio en parallèle :
- Onglet 1 : `begin;` + insert eval M01 → laisser ouvert
- Onglet 2 : `begin;` + insert eval M02 sur même submission → `commit;`
- Retour onglet 1 : `commit;`
- Lire `score_engagement` final.

## Résultats

| # | Scénario | Verdict attendu | Verdict observé | PASS/FAIL |
|---|----------|-----------------|-----------------|-----------|
| A | 2 mentors M1+M2 evaluations même submission | 2 evaluations distinctes (UNIQUE submission_id,evaluator_id) + score_engagement=175 (Q5=A dernier verdict) | _à remplir_ | _à remplir_ |
| A-bonus | UNIQUE violation insert duplicate par M1 | unique_violation captée | _à remplir_ | _à remplir_ |
| B | V1 + V2 quasi-simultanées | 2 submissions coexistent + score_engagement=base+100 (palier Soumis distinct par template) | _à remplir_ | _à remplir_ |
| B-bonus | UNIQUE violation insert V1 dupliquée | unique_violation captée | _à remplir_ | _à remplir_ |
| C | Verrous concurrents | aucun deadlock (pg_locks blocked=0 baseline) | _à remplir_ | _à remplir_ |
| Racy 2-onglets | Vraie concurrence M1+M2 commit ordre arbitraire | 2 evals + score_engagement final stable | _à remplir_ | _à remplir_ |

## Verdict global

_À remplir post-exécution._

Options :
- **ALL PASS** : défense applicative + UNIQUE constraints suffisantes pour pilote AgreenTech.
- **FAIL scénario A/A-bonus** : UNIQUE constraint cassée ou trigger Q5=A non recalculé → ESCALADE D-16 (corruption pédagogique pendant pilote = critique).
- **FAIL scénario C deadlock** : besoin lock optimiste applicatif → SEED-002 v0.3 (pas de fix pré-pilote, fenêtre trop courte).
- **FAIL racy 2-onglets** : race condition réelle observée → analyse approfondie post-pilote (probabilité faible : transactions Postgres gèrent l'atomic via 2PL + UNIQUE).

## Findings architecturaux

À documenter post-exécution :

- **Contraintes UNIQUE observées** (déjà identifiées en lecture statique `database/schema.sql`) :
  - `evaluations` : UNIQUE (submission_id, evaluator_id) — ligne 198
  - `submissions` : UNIQUE (player_id, deliverable_template_id, version) — ligne 179
- **Triggers Phase 14** déclenchent `recalc_player_engagement` après chaque insert/update/delete sur `submissions` et `evaluations`. Aucune utilisation de `pg_advisory_lock` — l'idempotence vient de la formule cumulative déterministe (CTE distinct + verdict le plus récent).
- **Pas de freeze post-publish** : aucun check sur `events.results_published_at` côté `evaluateSubmission` (cf. V-18 Phase 15-03 known limitation).

## Recommandations v0.3 (SEED-002)

- Ajouter `pg_advisory_xact_lock(player_id)` autour de `recalc_player_engagement` si race conditions observées en stress test 30+ Players simultanés (improbable pour pilote 15 Players).
- Ajouter check applicatif `events.results_published_at is null` dans `evaluateSubmission` (cf. V-18).
- Considérer lock optimiste (version column sur `evaluations`) si bug pédagogique observé.

## Cross-références

- `database/migrations/202605110007_phase14_engagement_trigger.sql` (triggers + fonction)
- `database/schema.sql:179,198` (UNIQUE constraints)
- `app/actions.ts:357+` (evaluateSubmission)
- `scripts/adversarial-inputs-checklist.md` V-17, V-18 (transitions verdict)
