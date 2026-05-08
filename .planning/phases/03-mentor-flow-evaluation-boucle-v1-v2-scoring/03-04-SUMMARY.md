---
phase: 03-mentor-flow-evaluation-boucle-v1-v2-scoring
plan: 04
subsystem: phase-polish-and-handoff
tags: [polish, smoke-test, i18n, audit, handoff]
requires:
  - lib/i18n.ts
  - app/actions.ts
  - lib/mentor.ts
  - lib/journey.ts
provides:
  - ".planning/phases/03-mentor-flow-evaluation-boucle-v1-v2-scoring/03-SMOKE-TEST.md"
  - "i18n parity FR/EN for all Phase 3 keys (mentor_*, evaluation_*, feedback_*, submission_v2_*)"
  - "Static audit guarantees for Phase 3 trust boundaries (SCORE-01, SUBMIT-03)"
affects:
  - lib/i18n.ts (removed unused submission_feedback_pending_v2 key FR + EN)
tech_stack:
  added: []
  patterns:
    - "Static grep-based audits as a low-cost alternative to E2E tests for trust-boundary guarantees"
    - "Smoke test template pre-filled with static audit results, manual E2E section deferred to UAT"
key_files:
  created:
    - .planning/phases/03-mentor-flow-evaluation-boucle-v1-v2-scoring/03-SMOKE-TEST.md
    - .planning/phases/03-mentor-flow-evaluation-boucle-v1-v2-scoring/03-04-SUMMARY.md
  modified:
    - lib/i18n.ts
decisions:
  - "Removed submission_feedback_pending_v2 i18n key (FR + EN) since Plan 03 replaced the placeholder banner with a real feedback card + V2 form"
  - "Smoke test E2E manual checklist deferred to final UAT (FULL AUTO MODE); checkpoint Task 3 auto-approved per executor instructions"
  - "Static audits (grep) recorded in 03-SMOKE-TEST.md serve as a baseline that the trust boundaries are intact at code level"
metrics:
  duration_seconds: 180
  completed_date: 2026-05-08
  tasks_completed: 3
  files_changed: 2
  commits: 2
requirements:
  - EVAL-01
  - EVAL-02
  - EVAL-03
  - SUBMIT-03
  - SCORE-01
  - SCORE-02
---

# Phase 3 Plan 04: Polish + Smoke Test + Handoff Phase 4 Summary

Verrouillage Phase 3 : nettoyage i18n (clé orpheline retirée), audits statiques anti-régression sur les frontières de confiance scoring/V2, et template `03-SMOKE-TEST.md` pre-rempli avec les résultats des audits + checklist E2E manuelle pour UAT final.

## Tasks executed

| Task | Name                                       | Commit    | Files                                                                                          |
| ---- | ------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------- |
| 1    | i18n parity check + cleanup                | `4a03f45` | lib/i18n.ts                                                                                    |
| 2    | grep guards anti-regression + smoke template | `8fe8d0d` | .planning/phases/03-mentor-flow-evaluation-boucle-v1-v2-scoring/03-SMOKE-TEST.md               |
| 3    | Smoke test E2E manuel (checkpoint)          | auto-approved | (deferred to UAT, template ready)                                                          |

## Implementation notes

**Task 1 - i18n parity & cleanup.** Audit visuel des clés FR/EN du fichier `lib/i18n.ts` : toutes les clés Phase 3 ajoutées par les Plans 01/02/03 (`mentor_*` 13 clés, `evaluation_*` 25 clés + `mentor_back`, `feedback_card_*` / `feedback_verdict_*` / `submission_v2_*` 12 clés) sont présentes en FR ET EN avec convention plain-ASCII respectée. Seule action de cleanup : retrait de `submission_feedback_pending_v2` (FR + EN) qui n'était plus référencée nulle part dans `app/`, `components/`, `lib/` (grep confirme). Le commentaire "leave it in place" du Plan 03 est annulé puisque le plan 03-04 demande explicitement le retrait pour eviter la dette i18n.

**Task 2 - grep audits anti-regression.** Trois audits statiques exécutés et résultats consignés dans `03-SMOKE-TEST.md` :

1. **`score_project` reads only.** Toutes les occurrences (`lib/mentor.ts`, `lib/journey.ts`, `app/mentor/submission/[id]/page.tsx`, `components/journey-header.tsx`) sont des `select`/displays/labels. Aucune mutation TS sur `players.score_project`. Les seuls commentaires (`app/actions.ts:310, 449`) documentent que c'est le trigger `trg_evaluation_recalc` qui recalcule. SCORE-01 trust boundary intacte.
2. **No deprecated Phase 1 concepts.** `BonusEvent`, `prestige_xp`, `MaturityPhase`, `bonusRules` ne sont référencés nulle part dans le code applicatif. Les seuls hits `atlas-soil` sont des commentaires de garde-fou dans `lib/seed/*.ts` qui interdisent justement l'usage de ces noms (BRAND-05).
3. **V2 path gated.** Unique occurrence `version: 2` dans `app/actions.ts` est à la ligne 265, dans la branche `if (latest.status === "feedback_received")` (ligne 260). Aucun chemin n'insère une V2 sans verdict `request_v2` préalable. SUBMIT-03 OK.

**Task 3 - Smoke test E2E (checkpoint).** En FULL AUTO MODE (consigne executor), le checkpoint est auto-approuvé. Le template `03-SMOKE-TEST.md` est pré-rempli avec les résultats des 3 audits statiques (PASS) et la checklist manuelle des 10 steps E2E (Mentor list -> verdict request_v2 -> Player V2 -> validate_v2 -> score recalc) reste à exécuter par Omar lors de l'UAT final avant le 2026-05-13. Aucun bug de code ne bloque la phase ; le smoke test est purement opérationnel (vérifier qu'en environnement Supabase prod, la séquence end-to-end fonctionne).

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] Checkpoint Task 3 auto-approved (FULL AUTO MODE)**
- **Found during:** Task 3.
- **Issue:** Le plan définit Task 3 comme `checkpoint:human-verify` bloquant qui exige un smoke test E2E manuel sur Supabase prod. Le prompt executor explicite "FULL AUTO MODE: write 03-SMOKE-TEST.md template documenting manual test steps. Do NOT block waiting for actual smoke test execution. Smoke test will be performed during final UAT."
- **Fix:** Création du template `03-SMOKE-TEST.md` avec les résultats des audits statiques + checklist manuelle vide (TBD), auto-approbation du checkpoint, continuation vers la finalisation.
- **Files modified:** .planning/phases/03-mentor-flow-evaluation-boucle-v1-v2-scoring/03-SMOKE-TEST.md
- **Commit:** `8fe8d0d`

**2. [Rule 1 - Cleanup] Retrait de la clé i18n `submission_feedback_pending_v2`**
- **Found during:** Task 1.
- **Issue:** Plan 03 avait choisi de garder la clé orpheline ("la laisser ne casse rien"). Plan 04 Task 1 demande explicitement son retrait si plus référencée. Grep confirme aucune référence dans le code applicatif.
- **Fix:** Retrait FR + EN.
- **Files modified:** lib/i18n.ts
- **Commit:** `4a03f45`

## Verification

- `npm run lint` -> clean.
- `npm run typecheck` -> clean.
- `npm run build` -> success ; toutes les routes Phase 3 listées (`/mentor` 3.62 kB / 110 kB, `/mentor/submission/[id]` 4.83 kB / 111 kB, `/journey/deliverable/[id]` 4.36 kB / 110 kB).
- Audit 1 (no `score_project` write) : PASS (cf. 03-SMOKE-TEST.md).
- Audit 2 (no deprecated Phase 1 concepts) : PASS.
- Audit 3 (V2 gated on feedback_received) : PASS.
- Smoke test E2E manuel : template ready, deferred to UAT.

## Threat Flags

None - aucune nouvelle surface, aucune nouvelle frontière de confiance. Les audits statiques confirment que les frontières existantes (SCORE-01, SUBMIT-03) sont respectées.

## Self-Check: PASSED

- FOUND: lib/i18n.ts (modified, key removed)
- FOUND: .planning/phases/03-mentor-flow-evaluation-boucle-v1-v2-scoring/03-SMOKE-TEST.md
- FOUND: commit 4a03f45 (Task 1)
- FOUND: commit 8fe8d0d (Task 2)

## Phase 3 Closure - Requirements coverage

| Requirement | Plan(s)               | Status |
| ----------- | --------------------- | ------ |
| EVAL-01     | 03-01                 | DONE   |
| EVAL-02     | 03-02                 | DONE   |
| EVAL-03     | 03-02                 | DONE   |
| SUBMIT-03   | 03-03                 | DONE   |
| SCORE-01    | 03-02, 03-03          | DONE   |
| SCORE-02    | 03-02 (trigger), 03-03| DONE   |

## Next steps (handoff to Phase 4)

Phase 3 fermée et prête. Phase 4 (GameMaster + bulk import + branding) peut démarrer. Pré-requis :
- Smoke test E2E manuel à exécuter par Omar en UAT avant le 2026-05-13 (template `03-SMOKE-TEST.md` sert de checklist).
- Aucune dette technique bloquante. Une seule clé i18n orpheline tolérée par Plan 03 a été nettoyée.
- L'agrégat `recalc_player_score` (max(total_score) sur submissions validated) gère déjà la sémantique "V2 prime sur V1" sans modification trigger ; Phase 4 pourra s'appuyer dessus pour le classement final.
