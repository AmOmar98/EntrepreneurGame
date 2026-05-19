# Phase 3: Mentor Flow (Évaluation + Boucle V1→V2 + Scoring) - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Mentor évalue Submissions selon rubric, donne feedback, choisit verdict. Player voit feedback et peut soumettre V2. Score Projet recalculé serveur. Couvre EVAL-01, EVAL-02, EVAL-03, SUBMIT-03, SCORE-01, SCORE-02.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
Toutes les décisions d'implémentation reviennent à Claude — discuss skippé. Honorer les conventions Phase 1/2 :
- Server actions Zod + `WorkflowState`
- Types canoniques dans `lib/types.ts`
- Auth via `lib/auth.ts:pathForRole`; mentor → `/mentor`
- Supabase via `utils/supabase/server.ts`; dual-mode demo
- French copy via `lib/i18n.ts`

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/auth.ts` (pathForRole, role guards)
- `lib/types.ts` (Player, Submission, Evaluation, Verdict types)
- `lib/seed/` for demo mode
- `app/actions.ts` (signIn, saveOnboarding, submitDeliverable patterns)
- `lib/journey.ts` (status computation, can be extended for mentor-side queries)
- `database/schema.sql` — `evaluations` table, `submissions.status` enum, scoring triggers
- `database/rls.sql` — mentor-side policies

### Established Patterns
- `useActionState` for forms
- `revalidatePath` after mutations
- Dual-mode (`if (supabase) { ... }`)

### Integration Points
- `/mentor` route (existing scaffold)
- `/mentor/submission/[id]` (new)
- `app/actions.ts` (add `evaluateSubmission`)
- `app/journey/deliverable/[id]/page.tsx` (display feedback when verdict=demander_v2, allow V2)

</code_context>

<specifics>
## Specific Ideas

ROADMAP success criteria:
1. `/mentor` : liste Players avec score Projet, nb soumis/total, filtre "en attente revue"
2. `/mentor/submission/[id]` : grille scoring rubric, feedback texte, verdict (valider_v1 | demander_v2 | rejeter)
3. Soumission éval → row Evaluation, update Submission.status, recalc score Projet serveur
4. Si verdict=demander_v2 → Player voit feedback sur `/journey` (statut "feedback_recu") → peut soumettre V2 → score retenu = V2
5. Mentor ne peut évaluer 2× même Submission (unique constraint ou check)

</specifics>

<deferred>
## Deferred Ideas

Discuss skippé.

</deferred>
</content>
</invoke>