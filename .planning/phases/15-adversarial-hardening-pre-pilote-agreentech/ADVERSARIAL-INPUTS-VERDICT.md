# Phase 15-03 — Verdict adversarial inputs server actions

**Date** : YYYY-MM-DD HH:MM (à remplir)
**Exécuté par** : Omar (DevTools/curl sur PROD avec compte P11 ou compte burner)
**Checklist** : `scripts/adversarial-inputs-checklist.md`

## Résultats par vecteur

| ID | Catégorie | Payload (résumé) | Verdict attendu | Verdict observé | PASS/FAIL/KNOWN |
|----|-----------|------------------|-----------------|-----------------|-----------------|
| V-01 | URL js: | `javascript:alert(1)` | Zod refuse | _à remplir_ | _à remplir_ |
| V-02 | URL data: | `data:text/html,<script>` | Zod refuse | _à remplir_ | _à remplir_ |
| V-03 | URL ftp: | `ftp://...` | Zod refuse | _à remplir_ | _à remplir_ |
| V-04 | URL file: | `file:///etc/passwd` | Zod refuse | _à remplir_ | _à remplir_ |
| V-05 | SSRF localhost | `https://127.0.0.1:8080/admin` | **ACCEPTÉ** (known limitation) | _à remplir_ | KNOWN |
| V-06 | SSRF AWS metadata | `https://169.254.169.254/...` | **ACCEPTÉ** (known limitation) | _à remplir_ | KNOWN |
| V-07 | proofText 4001 chars | overflow max(4000) | Zod refuse | _à remplir_ | _à remplir_ |
| V-08 | proofText < 10 chars | `"abc"` | superRefine refuse | _à remplir_ | _à remplir_ |
| V-09 | feedback 4001 chars | overflow max(4000) | Zod refuse | _à remplir_ | _à remplir_ |
| V-10 | expectedAction 501 chars | overflow max(500) | Zod refuse | _à remplir_ | _à remplir_ |
| V-11 | score=99 | hors max 25 | Zod refuse | _à remplir_ | _à remplir_ |
| V-12 | score=-5 | hors min 0 | Zod refuse | _à remplir_ | _à remplir_ |
| V-13 | score='abc' | non numérique | coerce → NaN refuse | _à remplir_ | _à remplir_ |
| V-14 | scoresJson cassé | JSON malformed | early return msg | _à remplir_ | _à remplir_ |
| V-15 | Ownership bypass | compte sans player_members | `{ ok:false, "Aucun Player..." }` | _à remplir_ | _à remplir_ |
| V-16 | Duplicate V1 | re-submit V1 existant | `"V1 existe deja"` message | _à remplir_ | _à remplir_ |
| V-17 | validate_v2 sur version=1 | transition invalide | **ACCEPTÉ** (known limitation) | _à remplir_ | KNOWN |
| V-18 | update post results_published | freeze absent | **ACCEPTÉ** (known limitation) | _à remplir_ | KNOWN |
| V-19 | SQL injection feedback | `'; DROP TABLE players; --` | PASS by design (param queries) | _à remplir_ | _à remplir_ |
| V-20 | UUID invalide | `'not-a-uuid'` | Zod `.uuid()` refuse | _à remplir_ | _à remplir_ |

## Verdict global

_À remplir post-exécution_ : N/20 PASS, K/20 KNOWN limitation (au moins V-05, V-06, V-17, V-18 = 4 known by design), F/20 FAIL.

Acceptation pour pilote AgreenTech : tolère KNOWN limitations documentées en SEED-002 v0.3. **FAIL non-known = STOP** (escalade owner si vecteur critique XSS/SQLi/Auth bypass).

## Known limitations differées v0.3 (SEED-002)

- **V-05 / V-06 SSRF localhost + AWS metadata** : `httpsUrl` Zod accepte hostnames internes. Non-exploitable actuellement (aucun fetch server-side de `proof_url`). À blocker via allowlist hostname si v0.3 introduit fetch côté serveur (preview cards, OG scraping). Source : `app/actions.ts:174` + CONCERNS §SSRF.
- **V-17 verdict transitions invalides** : pas de state machine stricte côté Zod. Trigger `trg_evaluation_recalc` recalcule correctement `score_project` (max validated). Acceptable pilote, à durcir v0.3 si bug pédagogique observé.
- **V-18 update post-publish** : aucun freeze applicatif des évaluations après `events.results_published_at`. Discipline GameMaster requise pendant pilote. À ajouter check `not null` blocking en v0.3.

## Cross-références

- `app/actions.ts:174` (`httpsUrl`)
- `app/actions.ts:179-205` (`submissionSchema`)
- `app/actions.ts:333-355` (`evaluationSchema`)
- `database/schema.sql:95,179,199` (checks `^https://` SQL)
- `scripts/adversarial-inputs-checklist.md` (20 vecteurs)
