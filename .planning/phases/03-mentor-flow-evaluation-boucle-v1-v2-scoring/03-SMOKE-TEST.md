# Phase 3 Smoke Test

**Date:** 2026-05-08 (template created during Plan 03-04 execution)
**Tester:** Omar (to be executed during final UAT before 2026-05-13)
**Env:** Supabase prod (target) / local (acceptable for rehearsal)
**Status:** Template ready - awaits manual E2E execution.

---

## Static Audits (Plan 03-04 Task 2)

Run on commit `4a03f45` (post i18n cleanup).

### Audit 1 - No TS write on `players.score_project`

Command:
```
grep -rn "score_project" app/ lib/ components/ utils/
```

Result: **PASS**. All occurrences are SELECT-side reads or type/i18n/comment references:
- `lib/mentor.ts:34, 49, 106` -> type field + select column.
- `lib/journey.ts:104, 118, 190` -> type field + select column.
- `app/mentor/submission/[id]/page.tsx:44, 147, 198, 200, 201, 202` -> select column + display.
- `components/journey-header.tsx:40` -> display label.
- `lib/i18n.ts:34, 93, 158, 217` -> i18n labels.
- `app/actions.ts:310, 449` -> comments documenting that the trigger does the recompute.

No `update.*score_project`, no `.set(...score_project...)`, no direct mutation. SCORE-01 trust boundary respected.

### Audit 2 - No reference to deprecated Phase 1 concepts

Command:
```
grep -rn "BonusEvent\|prestige_xp\|atlas-soil\|MaturityPhase\|bonusRules" app/ lib/ components/
```

Result: **PASS**. The only matches are in `lib/seed/*.ts` comment headers that explicitly forbid usage of `atlas-soil` (BRAND-05 guardrail). No code reference to `BonusEvent`, `prestige_xp`, `MaturityPhase`, or `bonusRules`.

### Audit 3 - V2 path gated on `status === "feedback_received"`

Command:
```
grep -n "version: 2" app/actions.ts
```

Result: **PASS**. Single occurrence at `app/actions.ts:265`, inside the `if (latest.status === "feedback_received")` branch (line 260). No path inserts a V2 submission without a prior request_v2 verdict.

---

## Manual E2E Smoke Test Checklist

**Pre-requisites:**
- Supabase prod env configured (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Phase 2 smoke test passed: at least 1 Player onboarded with 1 Submission V1 already created.
- 1 user with `profiles.app_role = 'mentor'`.
- 1 user with `profiles.app_role = 'player'` (owner of the V1 submission above).

### Steps

| Step | Action | Expected | Result | Notes |
|------|--------|----------|--------|-------|
| 1 | Login Mentor on `/login` | Redirect to `/mentor`. List shows columns: Equipe / Idee / Niveau / Score Projet / Soumis/Total / En attente. Filter checkbox toggles `?pending=1`. | TBD | |
| 2 | Click "Evaluer" on a Player with pending | `/mentor/submission/[id]` opens. Header shows team, idee, level, current score Projet. Submission block shows version=1, proof link clickable (target=_blank) or proof_text. Form: 1 numeric input per criterion (max enforced), live total, textarea feedback, 3 verdict buttons (Valider V1 / Demander V2 / Rejeter). | TBD | |
| 3 | Submit verdict request_v2 with full scores (e.g. 30/40, 25/30, 15/20, 5/10) and non-empty feedback | Page reloads, banner "Vous avez deja evalue cette soumission." in readonly mode. SQL check: `select * from evaluations where submission_id='...'` -> row present, scores JSONB matches, total_score = sum. `select status from submissions where id='...'` -> 'feedback_received'. `select score_project from players where id='...'` -> UNCHANGED (V1 not validated). | TBD | |
| 4 | Logout, login Player owner of the submission | `/journey` shows deliverable status = "Feedback recu". `/journey/deliverable/[id]` renders feedback card (verdict V2 demandee, total, scores breakdown, message), then form "Soumettre la V2". | TBD | |
| 5 | Player submits V2 (URL `https://example.com/v2` or text >=10 chars) | Message "Soumission V2 enregistree." `/journey` -> status "Soumis V2". SQL: `select * from submissions where player_id=... and deliverable_template_id=... order by version` -> 2 rows (V1 status=feedback_received, V2 status=submitted_v2). | TBD | |
| 6 | Logout, login Mentor, return to `/mentor` | Player has "En attente" >= 1 (V2 new). Click Evaluer -> `/mentor/submission/[v2-id]`. Form proposes ONLY validate_v2 and reject (no request_v2). | TBD | |
| 7 | Mentor verdict validate_v2 with full scores | Action OK. SQL: `select status from submissions where id='[v2-id]'` -> 'validated'. `select score_project from players where id='...'` -> EQUAL to total_score V2 (Postgres trigger `trg_evaluation_recalc` recompute). | TBD | |
| 8 | Login Player | `/journey` shows status "Valide" and score Projet up to date. | TBD | |
| 9 | Anti-regression: same Mentor reopens `/mentor/submission/[v2-id]` | Sees readonly "Vous avez deja evalue cette soumission." A second mentor (if available) can submit a separate evaluation; the first mentor cannot evaluate twice (UI readonly + DB unique constraint `(submission_id, evaluator_id)`). | TBD | |
| 10 | Final automated audit | `npm run lint`, `npm run typecheck`, `npm run build` -> 0 error, 0 suspicious warning. | TBD | |

---

## Sign-off

- Phase 3 status: [ ] PASS  [ ] FAIL
- Handoff Phase 4: [ ] READY  [ ] BLOCKED

**Operator:** _________________   **Date:** __________

---

## Notes

- This template is pre-filled with the static audit results captured during Plan 03-04 (commit `4a03f45`).
- The manual E2E section MUST be executed during final UAT before the Hack-Days kickoff (2026-05-13). Mark each row PASS / FAIL and add notes inline.
- If any step fails, log a fix as a deviation in this file and re-execute the impacted block before signing off.
- The Plan 03-04 checkpoint (Task 3) is auto-approved in FULL AUTO MODE for this run; the manual smoke test is deferred to UAT and tracked here.
