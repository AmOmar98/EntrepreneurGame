---
phase: 8
status: verified
verified_at: 2026-05-10
human_review_validated_at: 2026-05-11
human_reviewer: Omar (operator)
must_haves_verified: 6
must_haves_total: 6
closure_evidence:
  - "Migration 08-mentor-comments.sql appliquée en PROD (B3 fixé, commits d7b3e80 + cd8482f)"
  - "Bug RLS evaluation_comments F-16-01 fixé via quick 260511-sbt (commit 2b78801)"
  - "Smoke swarm PROD 2026-05-10 — M01 mentor login + parcours évaluation validés"
---

# Phase 8 — Mentor flow refondu link-based · VERIFICATION

## Result summary

| Code   | Must-have                                                                                                  | Status        | Evidence (file:line)                                                                            |
| ------ | ---------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| MNT-01 | Submission link card central w/ type detection + URL + note + "Ouvrir" target=_blank                       | ✓ Implemented | `lib/link-type.ts:31-95` ; `components/mentor-link-card.tsx:1-130` ; rendered at `app/mentor/submission/[id]/page.tsx` left column |
| MNT-02 | Antichrono history of submission versions (V1/V2) — current highlighted, replaced faded                   | ✓ Implemented | `components/mentor-submission-history.tsx:1-89` + history fetch in `app/mentor/submission/[id]/page.tsx` |
| MNT-03 | Tagged async comments (remarque/à corriger), composer + list, both sides (Mentor + Player revision panel) | ✓ Implemented | `components/mentor-comments-list.tsx`, `components/mentor-comment-composer.tsx`, `app/actions.ts addEvaluationCommentFlow`, `database/migrations/08-mentor-comments.sql` |
| MNT-04 | Verdict=revision → Action attendue obligatoire (server validated) — persisted in `evaluations.expected_action` | ✓ Implemented | `app/actions.ts evaluationSchema.superRefine` ; insert with `expected_action` ; UI conditional input in `components/mentor-evaluation-panel.tsx` ; CHECK constraint in migration |
| MNT-05 | Toast confirmation post-evaluation + form lock to prevent double-submit                                    | ✓ Implemented | `components/mentor-confirmation-banner.tsx` + JSON payload in `app/actions.ts evaluateSubmission` + `MentorEvaluationPanel` `<fieldset disabled={locked}>` |
| MNT-06 | Aucun chat live, aucun Realtime — sync via reload page/`revalidatePath`                                   | ✓ Implemented | No `supabase.channel(`/`subscribe(` references added in this phase. Only `revalidatePath` used in actions. |

## Build / lint / typecheck

- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run build` — clean (Next.js 15.5.18 production build, 13/13 pages generated)

## Files added (10)

- `lib/link-type.ts` — detectLinkType helper (Google Docs/Drive, GitHub, Notion, Figma, video, PDF, other)
- `components/mentor-link-card.tsx` — central submitted link card (server)
- `components/mentor-submission-history.tsx` — antichrono history list (server)
- `components/mentor-comments-list.tsx` — tagged comments list (server)
- `components/mentor-comment-composer.tsx` — textarea + tag select + submit (client)
- `components/mentor-evaluation-panel.tsx` — refactored evaluation form (client)
- `components/mentor-confirmation-banner.tsx` — post-eval toast (client)
- `database/migrations/08-mentor-comments.sql` — DDL for evaluation_comments + expected_action column + RLS
- `.planning/phases/08-mentor-vue-lien-historique-commentaires-async-action-attendue/08-VERIFICATION.md` — this file

## Files modified (4)

- `lib/i18n.ts` — Phase 8 mentor keys (FR + EN)
- `app/globals.css` — `.eic-mentor-*` primitives + `.sr-only` a11y utility
- `app/actions.ts` — added `addEvaluationCommentFlow`, extended `evaluateSubmission` with required `expected_action` validation when `verdict=request_v2`, returns JSON toast payload on success
- `app/mentor/submission/[id]/page.tsx` — full page refonte (link-based, 2-column layout)
- `app/journey/deliverable/[id]/page.tsx` — fetch + pass evaluation_comments + expected_action to RevisionPanel
- `components/revision-panel.tsx` — added `commentsSlot` prop + "Action attendue" aside

## Commits (atomic, 5)

1. `9e8be3d` feat(08): add link-type detection helper + mentor-link-card
2. `2eac6a0` feat(08): add mentor submission history component
3. `7328eee` feat(db): add evaluation_comments table + expected_action column migration
4. `3f64a3d` feat(08): add mentor comments composer + list + addEvaluationCommentFlow
5. `977d2b5` feat(08): refactor mentor evaluation page link-based + required expected_action

## Dependencies on Phase 7

- `RevisionPanel` (Phase 7) extended with `commentsSlot` and `expectedAction` to consume the new MNT-03 comments + MNT-04 expected_action fields. Phase 7 player-side surface keeps working without the new fields (`expectedAction` is optional).

## human_verification (manual gates required before deploy)

- [ ] **DDL applied to Supabase prod**: run `database/migrations/08-mentor-comments.sql` on the pilot project. Verify `evaluation_comments` table exists, `expected_action` column added on `evaluations`, RLS policies enabled. Without this, the comments + expected_action features will throw at runtime (column / table missing).
- [ ] **Visual review of /mentor/submission/[id]** at desktop (>=1280px) and tablet (768–1024px) and mobile (390px). Expected: 2-col grid → 1-col stack at ≤1024px. Confirm link card border / icon match the wireframe (`MentorFeedback` lines 184–360).
- [ ] **End-to-end smoke as Mentor**:
  - Open a submitted V1, paste a comment with tag `à corriger`, click Publier. Page reloads, comment appears at top of list.
  - Pick verdict `Demander V2` — verify the "Action attendue" input is revealed and the submit button stays disabled until a value is entered.
  - Submit with empty action → server-side error message ("L'action attendue est obligatoire pour une demande de revision.") expected.
  - Submit with valid action → confirmation banner renders, form fieldset becomes disabled (no double-submit).
- [ ] **End-to-end smoke as Player** on `/journey/deliverable/[id]` after the Mentor requested V2: confirm the "Action attendue" aside is visible, the comment list shows both Mentor's comment and Player's reply when published, and resubmitting V2 still works.
- [ ] **Backward compat regression**: open `/login`, `/journey`, `/admin`, `/jury`, `/results`, `/onboarding`, `/journey/deliverable/[id]` (without verdict=request_v2) — no regression expected from Phase 7 baseline.
- [ ] **Demo-mode gate**: with `NEXT_PUBLIC_SUPABASE_URL` unset, `/mentor/submission/[id]` shows the demo-disabled fallback (existing behavior preserved). Comment composer never reaches the client because the page short-circuits before rendering.

## Risk notes

- The legacy `components/evaluation-form.tsx` is intentionally kept on disk (referenced via `void EvaluationForm` in the mentor page) as a safety fallback for any future code path that re-enables it. It is not rendered today.
- The `expected_action` CHECK constraint is `NOT VALID` — existing legacy rows (no expected_action with verdict=request_v2) are tolerated. To enforce strictly post-pilot: `alter table public.evaluations validate constraint evaluations_expected_action_required_for_request_v2;`.
- Comment authorship visibility relies on the `profiles` table containing `full_name` / `email`; rows missing both fall back to "Membre" with `?` initials.

