---
phase: 03-mentor-flow-evaluation-boucle-v1-v2-scoring
plan: 02
subsystem: mentor-evaluation
tags: [mentor, evaluation, scoring, submission, server-action]
requires:
  - lib/types.ts
  - lib/auth.ts
  - lib/journey.ts
  - lib/i18n.ts
  - lib/supabase-status.ts
  - utils/supabase/server.ts
  - components/app-shell.tsx
  - "database/schema.sql (submissions, evaluations, deliverable_templates)"
  - "database/triggers.sql:trg_evaluation_recalc"
  - "database/rls.sql (evaluations_mentor_self_insert)"
provides:
  - "app/actions.ts:evaluateSubmission"
  - "components/evaluation-form.tsx:EvaluationForm"
  - "/mentor/submission/[id] (role-gated server page)"
affects:
  - app/actions.ts (added evaluationSchema + evaluateSubmission)
  - lib/i18n.ts (added 28 evaluation_* + mentor_back keys FR + EN)
tech_stack:
  added: []
  patterns:
    - "Server-side score recompute via Postgres trigger (no client/server-action math on players.score_project)"
    - "Hidden scoresJson field driven by useMemo to keep server contract stable"
    - "Verdict expressed via <button name=verdict value=...> submit (3 V1 / 2 V2)"
    - "Defense-in-depth: applicative role check + applicative unique check + DB 23505 fallback"
key_files:
  created:
    - components/evaluation-form.tsx
    - app/mentor/submission/[id]/page.tsx
  modified:
    - app/actions.ts
    - lib/i18n.ts
decisions:
  - "scoresJson hidden input over score__<key> per-criterion FormData entries (single Zod object, no key-pattern parsing)"
  - "Applicative role gate at the action layer in addition to RLS - keeps demo/error messages user-readable"
  - "Verdict/version coherence enforced server-side: V1 forbids validate_v2, V2 forbids validate_v1 + request_v2"
  - "Total score computed server-side from rubric + scores; client total is display-only (SCORE-01 trust boundary)"
  - "Readonly summary when current mentor already evaluated; no edit flow (1 mentor = 1 evaluation per submission)"
metrics:
  duration_seconds: 196
  completed_date: 2026-05-08
  tasks_completed: 3
  files_changed: 4
  commits: 3
requirements:
  - EVAL-02
  - EVAL-03
  - SCORE-01
---

# Phase 3 Plan 02: Mentor Submission Evaluation Summary

Server action `evaluateSubmission` + page `/mentor/submission/[id]` + composant `EvaluationForm` permettent au Mentor d'évaluer une Submission V1/V2 selon la rubric, choisir un verdict (validate_v1 / request_v2 / validate_v2 / reject) et persistance + recalc serveur du score Projet via trigger Postgres.

## Tasks executed

| Task | Name                                              | Commit    | Files                                                  |
| ---- | ------------------------------------------------- | --------- | ------------------------------------------------------ |
| 1    | evaluateSubmission server action                  | `97a1d49` | app/actions.ts                                         |
| 2    | evaluation-form client component + i18n keys      | `695e761` | components/evaluation-form.tsx, lib/i18n.ts            |
| 3    | /mentor/submission/[id] page                      | `152490a` | app/mentor/submission/[id]/page.tsx                    |

## Implementation notes

**Server action (`app/actions.ts:evaluateSubmission`).** Suit le contrat `WorkflowState`. Étapes : `hasSupabaseEnv` → `createClient` → parse `scoresJson` (JSON.parse en try/catch) → Zod → `getUser` → role lookup `profiles.app_role` (mentor | game_master) → load submission (with version, player_id, deliverable_template_id) → verdict/version coherence (V1 ne peut pas `validate_v2`, V2 ne peut ni `validate_v1` ni `request_v2`) → load template.rubric → pour chaque criterion vérifie `scores[key]` présent + `0 <= value <= criterion.max` + somme `total_score` → applicative unique check `(submission_id, evaluator_id)` → insert `evaluations` (avec fallback 23505 lisible) → update `submissions.status` selon mapping verdict → `revalidatePath` `/mentor`, `/mentor/submission/[id]`, `/journey/deliverable/[templateId]`, `/journey`. Aucune écriture sur `players.score_project` ; le trigger `trg_evaluation_recalc` recompute automatiquement (SCORE-01).

**Client form (`components/evaluation-form.tsx`).** `useActionState(evaluateSubmission, ...)`. État local `scores: Record<string, number>` initialisé à `{key: 0}` pour chaque criterion ; `<input type=number min=0 max={c.max} step=1>` par criterion ; total live calculé via `useMemo`. Hidden `scoresJson` mis à jour à chaque changement (useMemo `JSON.stringify(scores)`). Hidden `submissionId`. Textarea `feedback` (max 4000). Trois boutons submit `<button type=submit name=verdict value=...>` (V1) ou deux (V2), désactivés pendant `pending`. `useEffect(state.ok)` → `router.refresh()` pour basculer en mode readonly. Banner success/error coloré.

**Page (`app/mentor/submission/[id]/page.tsx`).** Server component. Pattern `app/journey/deliverable/[id]/page.tsx`. Next 15 `params: Promise<...>` awaited. `getCurrentUser` → /login. `getCurrentRole` ; non-mentor non-GM → `pathForRole(role)`. Mode demo / `createClient null` → bandeau `evaluation_demo_disabled`. Charge `submission` (`maybeSingle`) → `notFound()` si absent. Charge `player` + `deliverable_template` + `existingEval` (`evaluator_id = user.id`). Header avec equipe / idée / niveau / score Projet. Bloc soumission : version, submitted_at, lien externe `target=_blank rel=noreferrer` ou `<pre>` pour proof_text. Si `existingEval` → readonly summary (scores par critère, total, verdict label, feedback) avec banner `evaluation_already_evaluated` ; sinon `<EvaluationForm />`.

**i18n.** 28 nouvelles clés FR + EN (préfixe `evaluation_*`) + `mentor_back` ; convention plain-ASCII respectée (`Equipe`, `Idee`, `Critere`, etc.).

## Deviations from Plan

None - plan executed as written.

## Verification

- `npx tsc --noEmit` (Task 1) → clean.
- `npx tsc --noEmit` (Task 2) → clean.
- `npm run lint` (Task 3) → clean.
- `npm run typecheck` (Task 3) → clean.
- `npm run build` → success ; `/mentor/submission/[id]` listed (4.74 kB / 111 kB First Load JS).
- Demo mode (no Supabase env) : page rend "Mode demo : evaluation desactivee." (pas de crash).
- Supabase mode (logique) :
  - Player non-mentor → redirect via `pathForRole(role)` (Player vers `/journey`, GM vers `/admin` n'est PAS redirigé car GM autorisé).
  - Submission inconnue → `notFound()` (404).
  - Form V1 affiche 3 boutons (Valider V1 / Demander V2 / Rejeter).
  - Form V2 affiche 2 boutons (Valider V2 / Rejeter).
  - Soumission OK → row `evaluations` créée + `submissions.status` mis à jour + trigger `trg_evaluation_recalc` recompute `players.score_project`.
  - 2e soumission par le même Mentor → `{ ok:false, message:"Vous avez deja evalue cette soumission." }`.
  - verdict `request_v2` sur V1 → `submissions.status='feedback_received'`.
  - verdict `validate_v1` ou `validate_v2` → `submissions.status='validated'`.
  - verdict `reject` → `submissions.status='rejected'`.

## Threat Flags

None - les nouvelles surfaces (action `evaluateSubmission`, route `/mentor/submission/[id]`) opèrent sur des tables RLS-protégées existantes. Le scoring est calculé serveur (action + trigger) ; le client ne soumet que des notes brutes validées contre la rubric serveur. Aucune nouvelle frontière de confiance.

## Self-Check: PASSED

- FOUND: app/actions.ts (modified, evaluateSubmission exported)
- FOUND: components/evaluation-form.tsx
- FOUND: app/mentor/submission/[id]/page.tsx
- FOUND: lib/i18n.ts (modified, evaluation_* keys)
- FOUND: commit 97a1d49 (Task 1)
- FOUND: commit 695e761 (Task 2)
- FOUND: commit 152490a (Task 3)

## Next steps (handoff to Plan 03)

- Player view of feedback : `/journey/deliverable/[id]` doit afficher le feedback (et le verdict) de la dernière evaluation V1 quand `submissions.status='feedback_received'`, avec un bouton "Re-soumettre V2" qui passe par un nouveau flow `submitDeliverableV2`.
- La banner `submission_feedback_pending_v2` actuelle ("V2 disponible en Phase 3") doit être remplacée par un vrai form V2 + lecture `evaluations` du dernier mentor évaluateur.
- Plan 04 traitera la finalisation du scoring (best-of V1/V2 → déjà couvert par `recalc_player_score` qui prend `max(total_score)` parmi les submissions `validated`).
