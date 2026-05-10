# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server (default `http://localhost:3000`; alternate ports 3001/3002 are used in saved logs)
- `npm run build` / `npm start` — production build & serve
- `npm run lint` — ESLint via flat config (`eslint.config.mjs`, extends `next`)
- `npm run typecheck` — `tsc --noEmit` (no test runner is configured in this repo)

Path alias: `@/*` → repo root (see `tsconfig.json`).

## Architecture

Next.js 15 App Router (React 19, TypeScript, Tailwind via `globals.css`) for the EIC Venture Journey pilot — a multi-role dashboard (founder / coach / reviewer / committee / EIC admin) gamifying startup progress through stages L0→L5 and three checkpoints (`make_it`, `sell_it`, `look_after_it`).

### Data layer dual-mode

The app runs in two modes governed by `lib/supabase-status.ts:hasSupabaseEnv()`:

1. **Demo / fallback** — when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent, all reads come from the in-memory seed in `lib/seed/` (players, missions, deliverable templates). The app is fully navigable without a backend.
2. **Supabase-backed** — when env vars are set, `middleware.ts` delegates to `utils/supabase/middleware.ts:updateSession` to refresh auth cookies and gate routes; server actions in `app/actions.ts` write through `utils/supabase/server.ts:createClient` (SSR client from `@supabase/ssr`).

When editing data flow, keep both modes working: type/shape changes in `lib/types.ts` must be reflected in the SQL schema and vice versa.

### Domain types (lib/types.ts — single source of truth)

Core enums — `Stage` (L0_diagnostic…L5_alumni), `Checkpoint`, `MaturityPhase`, `DeliverableStatus`, `BonusStatus`, `BonusType`, `AppRole` (`founder | mentor | reviewer | committee_member | eic_admin`), `TeamRole`. The XP model distinguishes confirmed XP, pending XP, prestige XP, validated deliverables, and capped bonus achievements; bonus rules and `calculateBonusClaim` live here too.

### Server actions & validation

`app/actions.ts` is the single `"use server"` module. All inputs are validated with Zod; URLs are restricted to `https://` via the shared `httpsUrl` schema. Actions emit a `WorkflowState` `{ ok, message, mailto? }`. The proof flow is **link-based**: instead of file upload, deliverable/bonus submissions generate a `mailto:` draft addressed to the assigned coach + EIC — see `components/proof-workflow.tsx`.

### Routes (App Router)

Role-segmented pages under `app/`:
- Player flow: `onboarding/`, `journey/`, `journey/deliverable/[id]/`
- Mentor flow: `mentor/`, `mentor/submission/[id]/`
- GameMaster flow: `admin/`, `admin/players/[id]/`, `admin/players/import/`
- Pitch + results: `jury/`, `results/`
- Public: `login/`, `player/[slug]/`, root `/` (redirects auth)

Route handlers (non-page):
- `auth/callback/route.ts` — Supabase magic link landing
- `admin/export/players.csv/route.ts` — GameMaster CSV export (auth-gated, `dynamic = "force-dynamic"`)

Earlier phases referenced `app/api/export/{cohort,review-queue,kpi-snapshot}.csv`, `committee/[id]`, `eml/[id]` route handlers; these were retired during the Phase 4 admin refactor and only `admin/export/players.csv` remains. CSV serialization still flows through `lib/csv.ts`.

### Database

SQL lives in `database/` and must be applied in order: `schema.sql` → `triggers.sql` → `rls.sql`. `seed_bootcamp.sql` is optional pilot data. RLS is pilot-grade — verify policy implications before relaxing. Triggers maintain XP aggregates and stage transitions, so prefer updating via documented columns rather than bypassing them.

### UI shell

`app/layout.tsx` + `components/app-shell.tsx` provide the persistent navigation; icons come from `lucide-react`; `clsx` for class composition. `lib/i18n.ts` holds copy strings — prefer adding keys there over inlining French text.

### Ops

- Pilot prod is deployed on Vercel (region `cdg1`) at https://entrepreneur-game-six.vercel.app — config in `vercel.json`, deploy procedure in `docs/DEPLOY.md`. Note the slug is `entrepreneur-game-six` (Vercel auto-suffixed `-six` because `entrepreneur-game.vercel.app` is squatted by an unrelated quiz project — do not link to or test against the squat URL).
- `ops/compose.app.yml` and `ops/Caddyfile` describe an alternative Docker+Caddy deploy target; not used for local dev or the Vercel pilot.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Entrepreneur Game**

L'Entrepreneur Game est la plateforme d'accompagnement entrepreneurial gamifiée de l'EIC/UEMF. Elle transforme le parcours d'incubation en niveaux progressifs (0-7), missions concrètes, livrables évaluables, scores et badges, tout en gardant le projet réel des participants au centre. Cible : porteurs de projets étudiants/doctorants/chercheurs, mentors, jurys et partenaires de l'écosystème EIC.

**Core Value:** Permettre à 6-15 équipes réelles de vivre un Hack-Days 2 jours (13-14 mai 2026) où chaque livrable produit pendant les ateliers est soumis, évalué et noté en ligne, avec un classement final calculé et publié — sans perte de données, sans honte devant les partenaires (Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace).

### Constraints

- **Timeline** : 13 mai 2026 8h30 → premier Player se logue. Toute fonction MUST doit marcher à cette date. T-5 jours au moment de l'écriture.
- **Tech stack** : Next.js 15 + React 19 + TypeScript + Supabase + Vercel (figés, héritage codebase).
- **Équipe** : solo dev (Omar) avec Claude Code en pair. Triple casquette : code + setup pilote + animation workshop le 13. Pas de débogage en live possible.
- **Volume pilote** : 6-15 Players, 2-4 Mentors, 1 GameMaster — concurrence max ~30 sessions.
- **Hosting** : Vercel (gratuit, déploiement Next.js natif). Supabase pour DB+Auth (projet déjà créé).
- **Budget** : 0€ infra (tiers gratuits Vercel + Supabase suffisent au volume pilote).
- **Sécurité** : RLS minimal correct (Player ne voit pas autres Players). Pilot-grade accepté ailleurs. Aucune perte de données tolérable.
- **Crédibilité partenaires** : aucune mention « démo » apparente, aucun seed (`atlas-soil` etc.) ne doit fuiter en prod. Branding EIC professionnel attendu.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript ^6.0.3 — All application code (`app/`, `components/`, `lib/`, `utils/`, `middleware.ts`, `next.config.ts`)
- TSX — React components (App Router pages and `components/*.tsx`)
- SQL — Database schema, triggers, RLS policies (`database/schema.sql`, `database/triggers.sql`, `database/rls.sql`, `database/seed_bootcamp.sql`)
- CSS — Tailwind utility layer via `app/globals.css`
- JavaScript (ESM) — ESLint flat config (`eslint.config.mjs`)
## Runtime
- Node.js (Next.js 15 server runtime; specific version not pinned via `.nvmrc`)
- Browser runtime: React 19 client components
- npm (lockfile present at `package-lock.json`)
- `package.json` declares `"type": "commonjs"` while TypeScript is configured for `module: esnext` with `moduleResolution: bundler`
## Frameworks
- Next.js ^15.5.15 — App Router, server actions, route handlers, middleware
- React ^19.2.5 / React DOM ^19.2.5 — UI rendering
- Tailwind CSS — utility styling layered through `app/globals.css` (no separate `tailwind.config` detected; styling driven directly from `globals.css`)
- None configured — no test runner, no `*.test.*` / `*.spec.*` files, no `jest.config` or `vitest.config`
- Next.js CLI — `next dev`, `next build`, `next start` (see `package.json` scripts)
- TypeScript compiler in no-emit mode for `npm run typecheck` (`tsc --noEmit`)
- Incremental TS build artifact: `tsconfig.tsbuildinfo`
## Key Dependencies
- `@supabase/ssr` ^0.10.2 — Server-side Supabase client + cookie-based session refresh (`utils/supabase/middleware.ts`, `utils/supabase/server.ts`)
- `@supabase/supabase-js` ^2.105.3 — Underlying Supabase JS SDK (transitive dependency of `@supabase/ssr`)
- `zod` ^4.4.3 — Input validation for all server actions in `app/actions.ts` (including the shared `httpsUrl` schema enforcing `https://` URLs)
- `next` ^15.5.15 — Framework runtime
- `react` / `react-dom` ^19.2.5 — UI runtime
- `lucide-react` ^1.14.0 — Icon set used by the app shell and dashboards
- `clsx` ^2.1.1 — Conditional className composition
## Configuration
- `target: ES2017`, `lib: [dom, dom.iterable, esnext]`
- `strict: true`, `noEmit: true`, `isolatedModules: true`
- `module: esnext`, `moduleResolution: bundler`
- `jsx: preserve` (Next.js handles JSX transform)
- Path alias `@/*` → repo root
- Next.js TS plugin enabled
- ESLint ^9.39.4 flat config
- Extends `typescript-eslint` recommended
- Adds `@next/eslint-plugin-next` recommended + `core-web-vitals` rules (via `eslint-config-next` ^16.2.4)
- Ignores `.next/**`, `node_modules/**`, `next-env.d.ts`
- Remote image patterns whitelist `api.dicebear.com` over HTTPS
- `.env.example` present at repo root (committed) — documents required public + service role env vars
- No `.env` / `.env.local` detected in working tree
- Next.js handles bundling, transpilation, route compilation (no separate webpack/vite config)
- TypeScript declarations: `next-env.d.ts`, `declarations.d.ts`
## Platform Requirements
- Node.js capable of running Next.js 15 / React 19 (Node 18.18+ / 20+ recommended by Next 15)
- npm
- Local dev server defaults to `http://localhost:3000`; logs in repo reference alternate ports `3001` and `3002` (`dev-server-3001.log`, `dev-server-3002.log`)
- `ops/compose.app.yml` and `ops/Caddyfile` describe a Docker Compose + Caddy reverse-proxy deployment target (not used for local dev)
## Project Scripts (`package.json`)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: kebab-case `.tsx` (e.g., `app-shell.tsx`, `proof-workflow.tsx`, `project-card.tsx`, `onboarding-kyc-form.tsx`, `page-header.tsx`)
- Library / utility modules: kebab-case `.ts` (e.g., `lib/workflow-data.ts`, `lib/supabase-status.ts`)
- Single-word libs: lowercase (e.g., `lib/types.ts`, `lib/i18n.ts`, `lib/csv.ts`)
- App Router files: Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`, `middleware.ts`)
- SQL: snake_case (`database/schema.sql`, `database/triggers.sql`, `database/rls.sql`, `database/seed_bootcamp.sql`)
- Path alias: `@/*` resolves to repo root (see `tsconfig.json:17-19`)
- PascalCase exported function components (e.g., `AppShell`, `ProofWorkflow`, `ProjectCard`)
- Named exports preferred over default exports (see `components/app-shell.tsx:7`, `components/proof-workflow.tsx:17`)
- camelCase (e.g., `submitDeliverable`, `submitDeliverableFlow`, `claimBonusEventFlow`, `calculateBonusClaim`, `formValue`, `mailtoUrl`, `deliverableMailBody`, `getLocale`, `hasSupabaseEnv`)
- Server actions ending in `Flow` return `WorkflowState` (e.g., `submitDeliverableFlow`); legacy void-return variants drop the suffix (e.g., `submitDeliverable`)
- camelCase for locals and module constants (e.g., `bonusRules`, `journeyPhases`, `navItems`, `dictionaries`)
- Schemas use `<noun>Schema` suffix (e.g., `deliverableSchema`, `bonusSchema`, `kycSchema`, `questSchema`)
- PascalCase exported types and enums (e.g., `Stage`, `Checkpoint`, `MaturityPhase`, `DeliverableStatus`, `BonusType`, `AppRole`, `TeamRole`, `Locale`, `WorkflowState`)
- Type-only imports use `type` keyword: `import { type AppRole } from "@/lib/types"` (see `lib/types.ts:7`)
- String-literal unions preferred over `enum` keyword
- snake_case (`project_id`, `doc_url`, `submitted_at`, `pending_xp`, `base_xp`) — distinct from camelCase TypeScript field names; server actions explicitly map between them in `app/actions.ts:96-108`
## Code Style
- No Prettier config detected; relies on editor defaults
- 2-space indentation
- Double quotes for strings throughout (`"use server"`, `"use client"`)
- Trailing commas in multi-line literals
- Semicolons present
- ESLint flat config: `eslint.config.mjs`
- Extends `typescript-eslint` recommended + `@next/next` recommended + `core-web-vitals`
- Ignores: `.next/**`, `node_modules/**`, `next-env.d.ts`
- Run via `npm run lint`
- `strict: true` enabled (`tsconfig.json:7`)
- Target ES2017, module esnext, moduleResolution bundler
- `isolatedModules: true`, `noEmit: true`
- Run via `npm run typecheck`
## Import Organization
- `@/*` → repo root (configured in `tsconfig.json:17-19`)
- All cross-directory imports use `@/` (never relative `../../`)
- `"use server"` directive at top of `app/actions.ts:1` (single server-actions module)
- `"use client"` directive at top of components needing hooks/state (e.g., `components/app-shell.tsx:1`, `components/proof-workflow.tsx:1`)
## Internationalization
- Two locales: `fr` (default) and `en` — see `lib/i18n.ts:1`
- Centralized `dictionaries` object keyed by locale, then by string key (`lib/i18n.ts:3-38`)
- Helper: `getLocale(value)` resolves to `"fr" | "en"`; `t(locale)` returns the dictionary
- French is the primary product language; UI copy in components is currently a mix of English placeholders and French content (e.g., `Preuve a valider` in `app/actions.ts:160`, `components/proof-workflow.tsx:43`)
- **Convention:** Add new copy keys to `lib/i18n.ts` rather than inlining French (or English) strings. Components that don't yet use `t()` should still gravitate toward it for new strings.
- Avoid accented characters in code-resident strings (current files use plain ASCII e.g., `XP confirme`, `Preuve a valider`); UMTF/diacritic safety appears intentional for mailto/CSV payloads.
## Validation Pattern
- Use `z.coerce.number()` for `FormData`-sourced numbers (`baseXp`, `quantity`, `xp`) — `FormData` is always strings.
- Bound numeric inputs (`.min().max()`) to prevent abuse (e.g., `baseXp` 25–150, `quantity` 1–500).
- Mirror domain string-literal unions from `lib/types.ts` literally in `z.enum([...])` lists (e.g., `LevelId`, `SubmissionStatus`, `AppRole`). Keep them in sync with `lib/types.ts`.
## Server Action Return Shape
- Action signature: `(_prevState: WorkflowState, formData: FormData): Promise<WorkflowState>` — designed for `useActionState` (`components/proof-workflow.tsx:18-22`)
- Initial state on the client: `const initialState: WorkflowState = { ok: false, message: "" };` (`components/proof-workflow.tsx:15`)
- When success requires opening an email draft, populate `mailto`; the client redirects via `window.location.href = state.mailto` inside a `useEffect` watching the action state (`components/proof-workflow.tsx:25-37`)
- `mailto` strings are built with `encodeURIComponent` for subject + body (`app/actions.ts`).
- **Never throw** out of a server action — failures are returned as `{ ok: false, message }`
- Legacy void-return actions (e.g., `submitDeliverable` at `app/actions.ts:74`) exist for non-interactive callers; new code should always use the `<name>Flow` variants returning `WorkflowState`
## Dual-Mode Persistence
## Error Handling
- `safeParse` + early `{ ok: false, ... }` return — no thrown errors
- Supabase errors surfaced via `error.message`
- Generic fallback message strings should be short, action-oriented (e.g., `"Saved. Opening the email draft now."`)
- React 19 `useActionState` for form lifecycles
- `useEffect` to react to state transitions (e.g., redirect on `state.ok && state.mailto`)
- No try/catch in components observed
## Logging
- Server actions silently swallow errors when in void-return form (early `return;`) — acceptable for fire-and-forget actions, but `Flow` variants return errors via `WorkflowState.message`.
- Avoid `console.log` in committed code; if debugging is required during dev, remove before commit (no lint rule enforces this currently).
## Comments
- Code is largely self-documenting; explanatory comments are rare
- No JSDoc/TSDoc blocks observed on exports
- No license headers
- No `TODO`/`FIXME` style markers used as a system
## Function Design
- Server actions: `(_prevState: WorkflowState, formData: FormData)` for action-state form callbacks; `(formData: FormData)` for direct invocations
- Pure helpers prefer single object parameter when 3+ fields (e.g., `mailtoUrl({ to, subject, body })`, `deliverableMailBody({ startup, title, ... })` — see `components/proof-workflow.tsx:42-51`)
- Server actions: always `Promise<WorkflowState>` (or `Promise<void>` for legacy)
- Pure helpers: return concrete values, not unions with `undefined` when avoidable
## Module Design
- Named exports throughout — no `export default` in lib or component files
- Types exported alongside implementation (`export type WorkflowState`, `export type Locale`)
- Co-located: schemas live next to the actions that use them in `app/actions.ts`
- `lib/types.ts` — all domain types and string-literal unions (single source of truth for TS shapes)
- `lib/seed/` — in-memory demo seed data (players, missions, deliverable templates)
- `lib/i18n.ts` — copy strings
- `lib/csv.ts` — CSV serialization for export route handlers
- `lib/supabase-status.ts` — `hasSupabaseEnv()` mode flag
## UI / Styling Conventions
- `clsx ^2.1.1` for conditional classes
- Inline `style={...}` used sparingly for one-off values (e.g., `app-shell.tsx:43`, `proof-workflow.tsx:56`)
- `aria-label`, `aria-current`, `aria-hidden` consistently applied (see `components/app-shell.tsx:29-45`)
- Forms use semantic `<label>` wrapping inputs (`components/proof-workflow.tsx:73-80`)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- App Router server-first rendering. Pages are server components that import typed data from domain modules under `lib/`; client components are introduced only where interactivity demands (e.g., `components/proof-workflow.tsx`, `components/app-shell.tsx`).
- Single `"use server"` module (`app/actions.ts`) for every mutation — there are no API mutation routes. Read-only endpoints under `app/api/export/` exist solely to stream CSV/EML downloads.
- Dual-mode data layer guarded by `lib/supabase-status.ts:hasSupabaseEnv()`. Without env vars, the app reads in-memory seed data from `lib/seed/`; with env vars, server actions write through `utils/supabase/server.ts:createClient` and middleware enforces auth.
- Link-based proof flow — the app never accepts uploads. Founders submit `https://` URLs to deliverables / bonus events, which are recorded in Supabase and surfaced via a generated `mailto:` draft to coach + EIC.
- Domain types live in `lib/types.ts`; demo seed data lives in `lib/seed/`. The Postgres schema in `database/schema.sql` mirrors these shapes.
## Layers
- Purpose: Refresh Supabase auth cookies and gate non-public routes.
- Location: `middleware.ts` → `utils/supabase/middleware.ts`
- Contains: `updateSession(request)`. No-ops when env is absent (demo mode); otherwise rebuilds an SSR client, calls `supabase.auth.getUser()`, redirects unauthenticated visitors to `/login` for any path outside `/login`, `/api`, `/_next`.
- Matcher excludes `_next/static`, images, and favicons.
- Purpose: Render dashboards per role.
- Location: `app/<role-area>/page.tsx`
- Imports: domain types and helpers from `lib/types.ts` and role-specific modules (e.g., `lib/journey.ts`, `lib/mentor.ts`, `lib/admin.ts`), layout from `components/app-shell.tsx`, server actions from `app/actions.ts` (passed as `action={...}` to `<form>`).
- Examples: `app/page.tsx` (EIC cockpit), `app/journey/page.tsx` (founder map), `app/startup/[slug]/page.tsx` (per-startup detail), `app/coach/page.tsx`, `app/review/page.tsx`, `app/committee/page.tsx`, `app/admin/game/page.tsx`, `app/admin/startups/page.tsx`, `app/ops/page.tsx`, `app/onboarding/page.tsx`, `app/login/page.tsx`, `app/mailto/page.tsx`.
- Purpose: Persistent sidebar navigation, role-filtered nav items, current-phase indicator.
- Location: `components/app-shell.tsx` (client component, `usePathname`).
- Renders `navItems` filtered by `role` prop, plus `journeyPhases` rail. Pages opt in by wrapping content with `<AppShell role="founder|mentor|reviewer|committee_member|eic_admin">`.
- Global styling: `app/globals.css` (Tailwind + design tokens), `app/layout.tsx` (root with `<html lang="fr">`).
- Purpose: All writes (deliverables, bonus events, KYC, startups, assignments, auth, reviews).
- Location: `app/actions.ts` (single `"use server"` module).
- Pattern: Each action validates `FormData` with a Zod schema, optionally calls `createClient()` (no-op when Supabase is absent), performs the insert/update, calls `revalidatePath` on every affected route, and returns either `void` or `WorkflowState = { ok, message, mailto? }`.
- Workflow variants: actions ending in `Flow` (e.g., `submitDeliverableFlow`, `claimBonusEventFlow`, `saveOnboardingKyc`) are designed for `useActionState` and additionally compute a `mailto:` draft.
- Purpose: Domain types, enums, demo seed, derived helpers, mailto builders, KPI rollups.
- Location: domain layer split across ~22 modules under `lib/`: `lib/types.ts` (all TS domain types), `lib/score.ts` (scoring), `lib/journey.ts` (player journey + deliverable status), `lib/journey-progression.ts` (level progression), `lib/mentor.ts` (mentor evaluation), `lib/admin.ts` + `lib/admin-*.ts` (game master views), `lib/jury.ts` (pitch scoring), `lib/results.ts` (ranking), `lib/hack-status.ts` (live mode), `lib/announcements.ts`, `lib/team-activity.ts`, `lib/seed/` (in-memory demo seed). Shared utilities: `lib/i18n.ts` (copy keys), `lib/csv.ts` (CSV serializer + `csvResponse`), `lib/supabase-status.ts` (env probe).
- Contains: `LevelId`, `AppRole`, `TeamRole`, `Profile`, `Player`, `Mission`, `DeliverableTemplate`, `Submission`, `Evaluation`, `PitchScore` (all in `lib/types.ts`); role-specific aggregates and helpers in their respective domain modules.
- Purpose: Issue cookie-aware Supabase clients in middleware and server contexts.
- Location: `utils/supabase/server.ts` (server components / actions), `utils/supabase/middleware.ts` (edge auth refresh).
- Both short-circuit when `hasSupabaseEnv()` is false. `createClient()` returns `null` in demo mode — every action checks `if (supabase) { ... }` before writing.
- Purpose: Stream CSV / EML attachments for cohort, review queue, KPI snapshot, committee dossiers, and committee email exports.
- Location: `app/api/export/cohort.csv/route.ts`, `app/api/export/review-queue.csv/route.ts`, `app/api/export/kpi-snapshot.csv/route.ts`, `app/api/export/committee/[committeeId]/route.ts`, `app/api/export/committee/[committeeId].csv/route.ts`, `app/api/export/eml/[committeeId]/route.ts`.
- Pattern: `GET` handlers pull rows via `lib/admin-export.ts` helpers and return `csvResponse(filename, toCsv(rows))` from `lib/csv.ts`.
- Purpose: Persistent store, RLS policies, XP triggers.
- Location: `database/schema.sql` (enums, tables, generated columns), `database/triggers.sql` (XP ledger, `updated_at` propagation, stage transitions), `database/rls.sql` (`has_role`, `is_staff` helpers + per-table policies), `database/seed_bootcamp.sql` (optional pilot data).
- Apply order: `schema.sql` → `triggers.sql` → `rls.sql`. Triggers maintain `projects.total_xp` and `xp_ledger`; bypassing them risks aggregate drift.
## Data Flow
- No client store. Server components own data; client components use `useState`, `useActionState`, and `useEffect` only.
- Cache invalidation is explicit via `revalidatePath` in actions — no usage of `revalidateTag`.
## Key Abstractions
- Purpose: Uniform return shape for `useActionState`-driven flows.
- Definition: `{ ok: boolean; message: string; mailto?: string }`.
- Location: `app/actions.ts`.
- Purpose: Allow every action and middleware path to run unmodified without Supabase.
- Pattern: `const supabase = await createClient(); if (supabase) { ... }`.
- Helpers: `hasSupabaseEnv()` in `lib/supabase-status.ts`.
- Purpose: Drive XP gates and route logic across UI and DB.
- TS source: `lib/types.ts` (`LevelId`, `SubmissionStatus`, `AppRole`, `TeamRole`).
- SQL mirror: `database/schema.sql` (corresponding Postgres enums and columns).
- When changing one side, update both — Zod schemas in `app/actions.ts` also enumerate these literals.
- Purpose: Per-bonus-type XP per unit, caps, and target checkpoint.
- Note: bonus XP rules (`bonusRules`, `calculateBonusClaim`) were removed during v0.2 — scoring now flows through `lib/score.ts`.
- Purpose: Generate consistent `mailto:` URLs (FR copy) for proof, bonus, reminders, committee dossiers.
- Location: `app/actions.ts` — `mailto:` draft strings are built inline using `encodeURIComponent`.
## Entry Points
- Location: `middleware.ts` → `utils/supabase/middleware.ts:updateSession`
- Triggers: every non-static request matched by the middleware config.
- Responsibilities: cookie refresh, redirect to `/login` when authenticated session is missing in Supabase mode.
- Location: `app/page.tsx` (root cockpit, defaults to `eic_admin` role).
- Other top-level entries: `app/journey/page.tsx`, `app/login/page.tsx`, `app/onboarding/page.tsx`.
- Location: `app/actions.ts` exports — `submitDeliverable`, `submitDeliverableFlow`, `claimBonusEvent`, `claimBonusEventFlow`, `reviewDeliverable`, `reviewBonusEvent`, `signIn`, `signOut`, `saveOnboardingKyc`, `updateBootcampQuest`, `markMailtoOpened`, `createStartup`, `assignProjectMember`, `assignCoach`, `updateStartupStatus`.
- Location: route handlers under `app/api/export/`. CSV filenames follow the README contract (`cohort.csv`, `review-queue.csv`, `kpi-snapshot.csv`, `committee/[id].csv`, `eml/[id]`).
## Error Handling
- Zod `safeParse` on every action; non-`Flow` variants `return` early on parse failure (no message surfaced). `Flow` variants return `{ ok: false, message: parsed.error.issues[0]?.message }`.
- Supabase errors: non-`Flow` actions silently return; `Flow` actions return `{ ok: false, message: error.message }`.
- Auth redirects via `redirect("/login?error=1")` in `signIn` and `redirect("/login")` in `signOut`.
- Middleware redirects unauthenticated requests to `/login`.
## Cross-Cutting Concerns
- Provider: Supabase Auth (email/password via `signInWithPassword`).
- Session refresh: middleware on every request.
- Demo mode: middleware no-ops, `createClient()` returns `null`, pages render with hard-coded role assumptions.
- Always Zod (`zod ^4.4.3`) inside `app/actions.ts`. Shared `httpsUrl` schema enforces `https://` on every link the user submits.
- No structured logger; only `console.*` if any. Supabase error objects are returned to client via `WorkflowState.message` for `Flow` actions.
- Page copy is mostly French inline; translation keys live in `lib/i18n.ts`. New copy should be added there rather than inlined.
- RLS policies in `database/rls.sql` use `has_role(_role)` and `is_staff()` SQL helpers (security definer) to gate per-table reads/writes. Pilot-grade — verify before relaxing.
- App-level role gating is currently advisory (the `<AppShell role>` prop just filters nav); enforcement relies on RLS.
- Every mutating action calls `revalidatePath` for affected pages. There is no `revalidateTag` usage.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
