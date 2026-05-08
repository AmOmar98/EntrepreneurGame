---
phase: 03-mentor-flow-evaluation-boucle-v1-v2-scoring
plan: 03
subsystem: player-v1-v2-loop
tags: [player, submission, v2, feedback, scoring]
requires:
  - lib/types.ts
  - lib/i18n.ts
  - lib/auth.ts
  - lib/supabase-status.ts
  - utils/supabase/server.ts
  - components/app-shell.tsx
  - components/submission-form.tsx
  - components/submission-readonly.tsx
  - "app/actions.ts:submitDeliverable"
  - "database/schema.sql (submissions, evaluations)"
  - "database/triggers.sql:trg_evaluation_recalc"
provides:
  - "components/submission-feedback-card.tsx:SubmissionFeedbackCard"
  - "app/actions.ts:submitDeliverable (V2 path)"
  - "components/submission-form.tsx (version prop)"
  - "/journey/deliverable/[id] feedback + V2 form rendering"
affects:
  - app/actions.ts (V2 branching in submitDeliverable)
  - app/journey/deliverable/[id]/page.tsx (load evaluation + render feedback + V2 form)
  - components/submission-form.tsx (optional version prop, dynamic submit label)
  - lib/i18n.ts (12 new feedback_card_* / feedback_verdict_* / submission_v2_* keys FR + EN)
tech_stack:
  added: []
  patterns:
    - "Server-authoritative V1/V2 routing: client never sends version, action infers from latest DB row state"
    - "Evaluation lookup gated on submissions.status='feedback_received' to avoid an extra round-trip on locked/empty cases"
    - "Verdict-coloured border-left on feedback card (visual semantics: purple=request_v2, green=validate_*, red=reject)"
    - "Score retenu = max(total_score) per (player, template) on validated submissions — by construction V2 is the only validated row after a request_v2 loop, so the trigger's MAX agg already yields V2 score (no trigger change needed)"
key_files:
  created:
    - components/submission-feedback-card.tsx
  modified:
    - app/actions.ts
    - app/journey/deliverable/[id]/page.tsx
    - components/submission-form.tsx
    - lib/i18n.ts
decisions:
  - "Keep submit-deliverable a single server action; route V1 vs V2 server-side based on latest submission status (no separate submitDeliverableV2)"
  - "Do not modify recalc_player_score trigger: max(total_score) already respects 'V2 wins' because V1 with request_v2 has status=feedback_received (excluded from the validated agg)"
  - "Fail-closed for unexpected statuses (draft / submitted_v2): explicit 'Soumission impossible dans l'etat actuel.' rather than silently inserting"
  - "Feedback card is a server component (no interactivity needed) and reuses RubricCriterion + Verdict from lib/types"
  - "Leave submission_feedback_pending_v2 i18n key in place (unused) to avoid a churn-only edit, even though the placeholder banner is gone"
metrics:
  duration_seconds: 720
  completed_date: 2026-05-08
  tasks_completed: 4
  files_changed: 5
  commits: 4
requirements:
  - SUBMIT-03
  - SCORE-01
---

# Phase 3 Plan 03: Player V1->V2 Loop Summary

Quand le Mentor rend un verdict `request_v2`, le Player voit le feedback (verdict, scores, message) sur `/journey/deliverable/[id]` et peut soumettre une Submission V2. La V2 transite par la meme server action `submitDeliverable` qui route automatiquement selon l'etat DB. Score Projet recalcule serveur via le trigger `trg_evaluation_recalc` existant (V2 prime sur V1 par construction de l'agg).

## Tasks executed

| Task | Name                                                | Commit    | Files                                                 |
| ---- | --------------------------------------------------- | --------- | ----------------------------------------------------- |
| 1    | submitDeliverable accepte le chemin V2              | `e09959c` | app/actions.ts                                        |
| 2    | submission-feedback-card + i18n keys                | `a8fc15d` | components/submission-feedback-card.tsx, lib/i18n.ts  |
| 3    | submission-form supporte version V2 (prop)          | `2cbc07f` | components/submission-form.tsx                        |
| 4    | page deliverable display feedback + V2 form         | `5f1319f` | app/journey/deliverable/[id]/page.tsx                 |

## Implementation notes

**`submitDeliverable` V2 routing (Task 1).** Le bloc `if (existing && existing.length > 0)` ne refuse plus systematiquement. Il branche sur `latest.version` puis `latest.status` :
- `version === 2` -> refus "V2 deja soumise."
- `version === 1`, `status === "submitted_v1"` -> refus existant (V1 en attente).
- `version === 1`, `status === "validated"` -> refus "Livrable deja valide."
- `version === 1`, `status === "rejected"` -> refus "Livrable rejete. Contactez le Mentor."
- `version === 1`, `status === "feedback_received"` -> insert V2 (`version=2`, `status="submitted_v2"`), revalidatePath `/journey`, `/journey/deliverable/[id]`, `/mentor`, return `{ ok:true, message:"Soumission V2 enregistree." }`.
- fallback (draft / submitted_v2 inattendu) -> refus generique `"Soumission impossible dans l'etat actuel."`.

Aucune ecriture sur `players.score_project` ; le trigger Postgres handle le recompute quand la V2 sera evaluee `validated`.

**`SubmissionFeedbackCard` (Task 2).** Server component pur, props `evaluation: { scores, totalScore, feedback, verdict }` + `rubric: RubricCriterion[]`. Card avec `border-left` colore (violet/vert/rouge selon verdict), badge verdict, `evaluation.totalScore.toFixed(1)`, liste `criterion.label : scores[key] / criterion.max`, et message feedback en `whiteSpace: pre-wrap` (placeholder italique si vide). 12 cles i18n ajoutees FR + EN (`feedback_card_*`, `feedback_verdict_*`, `submission_v2_*`).

**`SubmissionForm` version prop (Task 3).** Ajout `version?: 1 | 2` (default 1). Le label du bouton submit devient `t.submission_v2_submit` quand `version=2`, sinon `t.submission_submit` (existant). Aucun changement de contrat avec l'action serveur : le composant n'envoie pas la version, c'est `submitDeliverable` qui la deduit de l'etat DB. `pending` continue d'afficher `t.submission_submitting`.

**Page `/journey/deliverable/[id]` (Task 4).** Apres avoir charge `latest` via `subRows`, on conserve aussi la `SubmissionRow` brute pour acceder a `latest.id`. Si `status === "feedback_received"`, fetch `evaluations` (`scores, total_score, feedback, verdict`) `eq submission_id = latest.id`, `order created_at desc limit 1 maybeSingle`, mappe vers `latestEvaluation`. Le bloc `isFeedbackPendingV2` rend desormais `<SubmissionFeedbackCard />` (si evaluation chargee) + un titre `t.submission_v2_title` + `<SubmissionForm version={2} />`. La banner placeholder Phase 2 (`submission_feedback_pending_v2`) est supprimee du rendu (la cle i18n reste dans `lib/i18n.ts` pour eviter du churn ; non referencee).

**Score retenu = V2 (decision documentee dans le plan).** Le trigger `recalc_player_score` somme `max(total_score)` sur les submissions `status='validated'` regroupees par `(player_id, deliverable_template_id)`. Sequence reelle :
1. V1 evaluee `request_v2` -> `submissions[V1].status='feedback_received'` (jamais `validated` apres une boucle).
2. V2 soumise puis evaluee `validate_v2` -> `submissions[V2].status='validated'`.
3. Seule la V2 est dans l'agregat -> score retenu = V2. ✓

Si V1 est evaluee `validate_v1` directement, il n'y a pas de V2 -> score retenu = V1. ✓ Aucune modification de trigger necessaire.

## Deviations from Plan

None - plan executed exactly as written. La cle `submission_feedback_pending_v2` (FR + EN, lignes 75 et 188 de `lib/i18n.ts`) est conservee comme suggere par le plan ("la laisser ne casse rien") ; elle n'est plus referencee mais ne nuit pas.

## Verification

- `npx tsc --noEmit` apres Task 1 -> clean.
- `npx tsc --noEmit` apres Task 2 -> clean.
- `npx tsc --noEmit` apres Task 3 -> clean.
- `npm run lint && npm run typecheck` apres Task 4 -> clean.
- `npm run build` -> success ; `/journey/deliverable/[id]` listed (4.42 kB / 110 kB First Load JS, +0.1 kB vs Plan 02).
- Demo mode (no Supabase env) : page rend `submission_demo_disabled` (pas de crash, pas de fetch evaluations).
- Supabase mode (logique) :
  - V1 + status `feedback_received` + evaluation existante -> page rend feedback card + titre `Soumettre la V2` + form V2.
  - V1 + status `feedback_received` + evaluation absente (cas extreme) -> rend uniquement form V2 (la card est sautee gracieusement via `latestEvaluation ? ... : null`).
  - Player resoumet V2 via le form (kind=proof_url ou proof_text) -> action route vers la branche V2, insert `submissions{version:2, status:"submitted_v2"}`, return `{ok:true,"Soumission V2 enregistree."}`, le `router.refresh()` cote client repaint en mode `isLocked` (status `submitted_v2` est dans `lockedStatuses`).
  - Mentor evalue ensuite V2 sur `/mentor/submission/[v2-id]` (Plan 02) avec verdict `validate_v2` -> `submissions[V2].status='validated'` -> trigger `trg_evaluation_recalc` recompute `players.score_project`.
  - Tentative de re-submit apres V2 deja soumise -> refus "V2 deja soumise.".
  - Tentative de submit apres V1 `validated` -> refus "Livrable deja valide.".
  - Tentative de submit apres V1 `rejected` -> refus "Livrable rejete. Contactez le Mentor.".

## Threat Flags

None - aucune nouvelle frontiere de confiance. La lecture `evaluations` cote page Player est filtree par `submission_id` (qui appartient deja au Player via RLS sur `submissions`). Le V2 path reutilise la meme RLS / ownership check (`player_members`) que V1. Aucun nouveau endpoint reseau, aucune nouvelle ecriture sur `players.score_project`.

## Self-Check: PASSED

- FOUND: components/submission-feedback-card.tsx
- FOUND: app/actions.ts (modified, V2 branch added)
- FOUND: app/journey/deliverable/[id]/page.tsx (modified, feedback + V2 form rendering)
- FOUND: components/submission-form.tsx (modified, version prop)
- FOUND: lib/i18n.ts (modified, 12 new keys FR + EN)
- FOUND: commit e09959c (Task 1)
- FOUND: commit a8fc15d (Task 2)
- FOUND: commit 2cbc07f (Task 3)
- FOUND: commit 5f1319f (Task 4)

## Next steps (handoff to Plan 04)

- Plan 04 finalisera le scoring (best-of V1/V2 confirme empiriquement, classement final, exports Hack-Days). Aucun travail residuel sur la boucle V1->V2 cote produit.
- Suggere : tests E2E manuels en mode Supabase pour la sequence complete V1 -> request_v2 -> feedback affiche -> V2 -> validate_v2 -> score Projet recalcule, avant le 13 mai 2026.
