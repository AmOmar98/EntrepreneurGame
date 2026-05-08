# Phase 4: GameMaster + Bulk Import + Branding + Page accueil - Context

**Gathered:** 2026-05-08
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

GameMaster pilote la cohorte (dashboard, import CSV, export, détail Player). L'app a une identité visuelle EIC professionnelle. Page d'accueil/login affiche les partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace, EIC, UEMF). Aucune mention seed démo apparente. Couvre ADMIN-01..04, ONBOARD-01, BRAND-01..05.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Conventions Phase 1-3 honorées : Zod + WorkflowState, dual-mode Supabase, lib/i18n.ts FR par défaut, App Router server-first.
- Branding EIC : palette inspirée du brand UEMF (bleu/or institutionnel), logos partenaires en SVG/PNG (placeholders documentés si absents), typo system + Inter (par défaut Tailwind/Next).
- Import CSV : parser server-side, idempotent par email ; envoi magic link via `supabase.auth.admin.inviteUserByEmail` côté server avec service-role uniquement si configuré.
- Page accueil : `/` redirige vers `/login` si non authentifié ; bandeau partenaires sur `/login`.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/login/page.tsx` (peut accueillir bandeau partenaires)
- `app/admin/page.tsx` (scaffold actuel)
- `lib/auth.ts` (game_master role guard)
- `lib/journey.ts`, `lib/mentor.ts` (patterns data layer)
- `app/actions.ts` (Zod patterns)
- `lib/seed/players.ts` (cohort demo data)

### Established Patterns
- Server components par défaut, client uniquement pour formulaires
- `clsx`, Tailwind via globals.css
- `lib/i18n.ts` keys

### Integration Points
- `/admin` (existing scaffold)
- `/admin/players/import` (new)
- `/admin/players/[id]` (new)
- `/admin/export/players.csv` (new — route handler)
- Logo + brand assets in `public/`
- `app/layout.tsx` metadata + theming

</code_context>

<specifics>
## Specific Ideas

ROADMAP success criteria :
1. /admin : tableau cohorte (Player, Niveau, Score Projet, Statut, Prochain livrable) + compteurs globaux
2. /admin/players/import : upload CSV → create Players + PlayerMembers + magic links ; idempotent
3. /admin/players/[id] : détail Player (membres, submissions, evaluations, scores)
4. /admin/export/players.csv : download CSV
5. Identité visuelle EIC ; bandeau partenaires sur /login ; aucune mention démo apparente

Partenaires : Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace, EIC, UEMF.

</specifics>

<deferred>
## Deferred Ideas

Discuss skippé.

</deferred>
</content>
</invoke>