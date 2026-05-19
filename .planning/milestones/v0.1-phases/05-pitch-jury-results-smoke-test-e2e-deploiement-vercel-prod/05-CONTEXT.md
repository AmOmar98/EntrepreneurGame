# Phase 5: Pitch Jury + Results + Smoke Test E2E + Déploiement Vercel prod - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Page jury fonctionnelle pour le jour 2 du Hack-Days, classement publié à 15h via gate `events.results_published_at`, déploiement Vercel prod, smoke test E2E sur prod, magic links pour testeurs internes. Couvre JURY-01..05, DATA-02 (RLS test), DEPLOY-01..03.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Patterns Phase 1-4 honorés : Zod + WorkflowState, dual-mode Supabase, lib/i18n.ts FR.
- Page `/jury` : un Mentor saisit 5 notes (×20) par Player ; upsert PitchScore avec contrainte unique (juror_id, player_id).
- Page `/results` : tri par classement (moyenne PitchScore + Score Projet pondéré) ; gate `events.results_published_at` pour rôles non-GameMaster ; action "Publier" GameMaster.
- Smoke test E2E : checklist documentée pour exécution manuelle prod.
- Déploiement : configurations Vercel via README + scripts ; pas d'automatisation push prod (l'humain push).
- Magic links testeurs : utiliser route `/admin/players/import` Phase 4 ; pas de feature additionnelle.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/admin/page.tsx`, `app/admin/players/import/page.tsx` (Phase 4)
- `lib/admin.ts`, `lib/admin-import.ts` (data + bulk import)
- `lib/auth.ts`, `lib/journey.ts`, `lib/mentor.ts`
- `app/actions.ts` (Zod patterns, WorkflowState)
- `database/schema.sql` — table `pitch_scores`, `events.results_published_at`
- `database/rls.sql` — policies player/mentor/game_master

### Established Patterns
- Server-first ; client uniquement pour formulaires interactifs
- Tailwind tokens EIC (`--brand-primary`, `--brand-accent`)
- `lib/i18n.ts` keys

### Integration Points
- `/jury` (nouvelle route)
- `/results` (nouvelle route)
- `app/actions.ts` (savePitchScore, publishResults actions)
- `lib/results.ts` (data layer ranking)
- README/scripts Vercel deploy

</code_context>

<specifics>
## Specific Ideas

ROADMAP success criteria :
1. /jury : Mentor saisit 5 notes pitch (×20) par Player, upsert PitchScore (unique juror×player)
2. /results : classement (moyenne PitchScore + Score Projet pondéré) ; gate `events.results_published_at` pour non-GM ; bouton GM "Publier"
3. App déployée Vercel prod avec env Supabase
4. Smoke test E2E prod passant
5. RLS test exhaustif (2 Players ne voient pas mutuels ; Mentor voit tout ; GM voit tout)
6. Magic links 6-15 testeurs internes pour répétition

</specifics>

<deferred>
## Deferred Ideas

Discuss skippé.

</deferred>
</content>
</invoke>