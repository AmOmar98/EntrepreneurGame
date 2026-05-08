# Phase 2: Player Flow (Onboarding + Journey + Submission) - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Un Player peut se logger, faire son onboarding (Niveau 0), voir sa progression sur `/journey`, et soumettre un livrable V1 sur un DeliverableTemplate. Couvre : ONBOARD-02, ONBOARD-03, EVENT-01, EVENT-02, JOURNEY-01, JOURNEY-02, JOURNEY-03, SUBMIT-01, SUBMIT-02, SUBMIT-04, DATA-03 (suppression seed leak).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions established in Phase 1 to guide decisions.

Established conventions to honor:
- Server actions in `app/actions.ts` validated with Zod, returning `WorkflowState`
- `lib/types.ts` is single source of truth for domain types (Player, Mission, Submission, etc.)
- Auth via `lib/auth.ts:pathForRole`; player redirects to `/journey`
- Supabase client via `utils/supabase/server.ts:createClient` (returns null in demo mode)
- French copy via `lib/i18n.ts`
- App Router server-first; client components only when interactivity required

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/auth.ts` — `pathForRole`, role helpers
- `lib/types.ts` — Player, Mission, Submission, DeliverableTemplate types
- `lib/seed/` — seed data for missions, deliverable templates, players
- `app/actions.ts:signIn` — Zod validation pattern + `WorkflowState`
- `components/app-shell.tsx` — persistent navigation
- Supabase RLS policies in `database/rls.sql` for players/submissions

### Established Patterns
- `useActionState` for form lifecycles
- `revalidatePath` after every mutation
- `if (supabase) { ... }` dual-mode guard
- Tailwind via `globals.css`; `clsx` for conditional classes
- `lib/i18n.ts` keys instead of inlined strings

### Integration Points
- `/journey` (existing route, currently scaffolding only — needs real content)
- `/onboarding` (existing route, needs Niveau 0 form)
- `app/actions.ts` (add submit action + onboarding action)
- Database: `players.onboarded_at`, `submissions` table

</code_context>

<specifics>
## Specific Ideas

Success criteria from ROADMAP:
1. Premier login Player sans `onboarded_at` → redirect `/onboarding` → form complet (équipe, idée, diagnostic 5Q, membres) → soumission set `onboarded_at`
2. `/journey` : header (équipe, niveau, score), timeline ateliers du jour, liste DeliverableTemplates avec statuts
3. `/journey/deliverable/[id]` : soumettre Submission V1 (proof_url ou proof_text) → status `submitted_v1` → form se verrouille
4. Player ne peut accéder/soumettre que pour son propre player (RLS + check applicatif)
5. Mode Supabase prod : aucune fuite seed (`atlas-soil`, etc.) — `lib/workflow-data.ts` retourne tableaux vides quand DB vide

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
</content>
</invoke>