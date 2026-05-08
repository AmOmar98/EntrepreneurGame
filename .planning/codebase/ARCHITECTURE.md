# Architecture

**Analysis Date:** 2026-05-08

## Pattern Overview

**Overall:** Next.js 15 App Router monolith with role-segmented routes, a single server-actions module, and a dual-mode data layer (in-memory demo seed vs. Supabase-backed SSR).

**Key Characteristics:**
- App Router server-first rendering. Pages are server components that import data directly from `lib/data.ts`; client components are introduced only where interactivity demands (e.g., `components/proof-workflow.tsx`, `components/app-shell.tsx`).
- Single `"use server"` module (`app/actions.ts`) for every mutation — there are no API mutation routes. Read-only endpoints under `app/api/export/` exist solely to stream CSV/EML downloads.
- Dual-mode data layer guarded by `lib/supabase-status.ts:hasSupabaseEnv()`. Without env vars, the app reads the in-memory seed in `lib/data.ts`; with env vars, server actions write through `utils/supabase/server.ts:createClient` and middleware enforces auth.
- Link-based proof flow — the app never accepts uploads. Founders submit `https://` URLs to deliverables / bonus events, which are recorded in Supabase and surfaced via a generated `mailto:` draft to coach + EIC.
- Domain types and demo data are co-located in `lib/data.ts` (single source of truth). The Postgres schema in `database/schema.sql` mirrors these enums and shapes.

## Layers

**Routing & Auth Edge:**
- Purpose: Refresh Supabase auth cookies and gate non-public routes.
- Location: `middleware.ts` → `utils/supabase/middleware.ts`
- Contains: `updateSession(request)`. No-ops when env is absent (demo mode); otherwise rebuilds an SSR client, calls `supabase.auth.getUser()`, redirects unauthenticated visitors to `/login` for any path outside `/login`, `/api`, `/_next`.
- Matcher excludes `_next/static`, images, and favicons.

**Page Layer (server components):**
- Purpose: Render dashboards per role.
- Location: `app/<role-area>/page.tsx`
- Imports: domain helpers from `lib/data.ts`, layout from `components/app-shell.tsx`, server actions from `app/actions.ts` (passed as `action={...}` to `<form>`).
- Examples: `app/page.tsx` (EIC cockpit), `app/journey/page.tsx` (founder map), `app/startup/[slug]/page.tsx` (per-startup detail), `app/coach/page.tsx`, `app/review/page.tsx`, `app/committee/page.tsx`, `app/admin/game/page.tsx`, `app/admin/startups/page.tsx`, `app/ops/page.tsx`, `app/onboarding/page.tsx`, `app/login/page.tsx`, `app/mailto/page.tsx`.

**UI Shell:**
- Purpose: Persistent sidebar navigation, role-filtered nav items, current-phase indicator.
- Location: `components/app-shell.tsx` (client component, `usePathname`).
- Renders `navItems` filtered by `role` prop, plus `journeyPhases` rail. Pages opt in by wrapping content with `<AppShell role="founder|mentor|reviewer|committee_member|eic_admin">`.
- Global styling: `app/globals.css` (Tailwind + design tokens), `app/layout.tsx` (root with `<html lang="fr">`).

**Server Actions (mutations):**
- Purpose: All writes (deliverables, bonus events, KYC, startups, assignments, auth, reviews).
- Location: `app/actions.ts` (single `"use server"` module).
- Pattern: Each action validates `FormData` with a Zod schema, optionally calls `createClient()` (no-op when Supabase is absent), performs the insert/update, calls `revalidatePath` on every affected route, and returns either `void` or `WorkflowState = { ok, message, mailto? }`.
- Workflow variants: actions ending in `Flow` (e.g., `submitDeliverableFlow`, `claimBonusEventFlow`, `saveOnboardingKyc`) are designed for `useActionState` and additionally compute a `mailto:` draft.

**Domain / Data Library:**
- Purpose: Domain types, enums, demo seed, derived helpers, mailto builders, KPI rollups.
- Location: `lib/data.ts` (~1285 lines), `lib/workflow-data.ts` (workflow constants), `lib/i18n.ts` (FR/EN copy keys), `lib/csv.ts` (CSV serializer + `csvResponse`), `lib/supabase-status.ts` (env probe).
- Contains: `Stage`, `Checkpoint`, `MaturityPhase`, `DeliverableStatus`, `BonusStatus`, `BonusType`, `AppRole`, `TeamRole`, `Startup`, `Deliverable`, `BonusEvent`, `Profile`, `bonusRules`, `calculateBonusClaim`, `journeyPhases`, `navItems`, `dashboardMetrics`, `xpSummary`, `mailtoUrl`, `deliverableMailBody`, `committeeDossierRows`.

**Supabase SSR Adapters:**
- Purpose: Issue cookie-aware Supabase clients in middleware and server contexts.
- Location: `utils/supabase/server.ts` (server components / actions), `utils/supabase/middleware.ts` (edge auth refresh).
- Both short-circuit when `hasSupabaseEnv()` is false. `createClient()` returns `null` in demo mode — every action checks `if (supabase) { ... }` before writing.

**Export Route Handlers (read-only API):**
- Purpose: Stream CSV / EML attachments for cohort, review queue, KPI snapshot, committee dossiers, and committee email exports.
- Location: `app/api/export/cohort.csv/route.ts`, `app/api/export/review-queue.csv/route.ts`, `app/api/export/kpi-snapshot.csv/route.ts`, `app/api/export/committee/[committeeId]/route.ts`, `app/api/export/committee/[committeeId].csv/route.ts`, `app/api/export/eml/[committeeId]/route.ts`.
- Pattern: `GET` handlers pull rows from `lib/data.ts` helpers and return `csvResponse(filename, toCsv(rows))` from `lib/csv.ts`.

**Database (Postgres / Supabase):**
- Purpose: Persistent store, RLS policies, XP triggers.
- Location: `database/schema.sql` (enums, tables, generated columns), `database/triggers.sql` (XP ledger, `updated_at` propagation, stage transitions), `database/rls.sql` (`has_role`, `is_staff` helpers + per-table policies), `database/seed_bootcamp.sql` (optional pilot data).
- Apply order: `schema.sql` → `triggers.sql` → `rls.sql`. Triggers maintain `projects.total_xp` and `xp_ledger`; bypassing them risks aggregate drift.

## Data Flow

**Founder submits a proof (deliverable):**
1. `app/startup/[slug]/page.tsx` renders `<ProofWorkflow startup={...} />` (client component).
2. `components/proof-workflow.tsx` uses `useActionState(submitDeliverableFlow, initialState)`; the form posts `FormData` to the server action.
3. `app/actions.ts:submitDeliverableFlow` parses with `deliverableSchema` (Zod, requires `https://` URL), inserts into `deliverables` if Supabase is configured, builds a `mailto:coach,eic@uemf.ma` draft, calls `revalidatePath` on `/startup/[slug]`, `/coach`, `/admin`, and returns `{ ok: true, message, mailto }`.
4. Client `useEffect` redirects `window.location.href = state.mailto` to open the user's mail client.
5. Coach reviews via `app/coach/page.tsx` calling `reviewDeliverable` server action; XP triggers in `database/triggers.sql` flip `pending_xp` → confirmed XP via `xp_ledger`.

**Page render (server component):**
1. Page imports helpers from `lib/data.ts` (e.g., `dashboardMetrics`, `xpSummary`, `startups`).
2. In demo mode these resolve against the in-memory seed; in Supabase mode the same shapes are expected from queries (current implementation primarily reads from the seed — see CONCERNS).
3. Server component renders inside `<AppShell role="...">` and emits forms whose `action={serverAction}` points at exports of `app/actions.ts`.

**State Management:**
- No client store. Server components own data; client components use `useState`, `useActionState`, and `useEffect` only.
- Cache invalidation is explicit via `revalidatePath` in actions — no usage of `revalidateTag`.

## Key Abstractions

**WorkflowState:**
- Purpose: Uniform return shape for `useActionState`-driven flows.
- Definition: `{ ok: boolean; message: string; mailto?: string }`.
- Location: `app/actions.ts`.

**Dual-mode client guard:**
- Purpose: Allow every action and middleware path to run unmodified without Supabase.
- Pattern: `const supabase = await createClient(); if (supabase) { ... }`.
- Helpers: `hasSupabaseEnv()` in `lib/supabase-status.ts`.

**Stage / Checkpoint enums:**
- Purpose: Drive XP gates and route logic across UI and DB.
- TS source: `lib/data.ts` (`Stage`, `Checkpoint`, `MaturityPhase`, `BonusType`).
- SQL mirror: `database/schema.sql` (`project_stage`, `checkpoint_band`, `maturity_phase`, `bonus_type`).
- When changing one side, update both — Zod schemas in `app/actions.ts` also enumerate these literals.

**BonusRules + calculateBonusClaim:**
- Purpose: Per-bonus-type XP per unit, caps, and target checkpoint.
- Location: `lib/data.ts` (`bonusRules`, `calculateBonusClaim`).
- Used by: `app/actions.ts:claimBonusEvent(Flow)` to compute `claimed_xp` and target `checkpoint`.

**mailto builders:**
- Purpose: Generate consistent `mailto:` URLs (FR copy) for proof, bonus, reminders, committee dossiers.
- Location: `lib/data.ts` (`mailtoUrl`, `deliverableMailBody`, `reviewReminderBody`).

## Entry Points

**Web request entry:**
- Location: `middleware.ts` → `utils/supabase/middleware.ts:updateSession`
- Triggers: every non-static request matched by the middleware config.
- Responsibilities: cookie refresh, redirect to `/login` when authenticated session is missing in Supabase mode.

**Page entry:**
- Location: `app/page.tsx` (root cockpit, defaults to `eic_admin` role).
- Other top-level entries: `app/journey/page.tsx`, `app/login/page.tsx`, `app/onboarding/page.tsx`.

**Mutation entry:**
- Location: `app/actions.ts` exports — `submitDeliverable`, `submitDeliverableFlow`, `claimBonusEvent`, `claimBonusEventFlow`, `reviewDeliverable`, `reviewBonusEvent`, `signIn`, `signOut`, `saveOnboardingKyc`, `updateBootcampQuest`, `markMailtoOpened`, `createStartup`, `assignProjectMember`, `assignCoach`, `updateStartupStatus`.

**Export entry:**
- Location: route handlers under `app/api/export/`. CSV filenames follow the README contract (`cohort.csv`, `review-queue.csv`, `kpi-snapshot.csv`, `committee/[id].csv`, `eml/[id]`).

## Error Handling

**Strategy:** Defensive but silent on the server side; user-facing errors only on `*Flow` actions.

**Patterns:**
- Zod `safeParse` on every action; non-`Flow` variants `return` early on parse failure (no message surfaced). `Flow` variants return `{ ok: false, message: parsed.error.issues[0]?.message }`.
- Supabase errors: non-`Flow` actions silently return; `Flow` actions return `{ ok: false, message: error.message }`.
- Auth redirects via `redirect("/login?error=1")` in `signIn` and `redirect("/login")` in `signOut`.
- Middleware redirects unauthenticated requests to `/login`.

## Cross-Cutting Concerns

**Auth:**
- Provider: Supabase Auth (email/password via `signInWithPassword`).
- Session refresh: middleware on every request.
- Demo mode: middleware no-ops, `createClient()` returns `null`, pages render with hard-coded role assumptions.

**Validation:**
- Always Zod (`zod ^4.4.3`) inside `app/actions.ts`. Shared `httpsUrl` schema enforces `https://` on every link the user submits.

**Logging:**
- No structured logger; only `console.*` if any. Supabase error objects are returned to client via `WorkflowState.message` for `Flow` actions.

**Internationalisation:**
- Page copy is mostly French inline; translation keys live in `lib/i18n.ts`. New copy should be added there rather than inlined.

**Authorization (DB):**
- RLS policies in `database/rls.sql` use `has_role(_role)` and `is_staff()` SQL helpers (security definer) to gate per-table reads/writes. Pilot-grade — verify before relaxing.
- App-level role gating is currently advisory (the `<AppShell role>` prop just filters nav); enforcement relies on RLS.

**Caching / Revalidation:**
- Every mutating action calls `revalidatePath` for affected pages. There is no `revalidateTag` usage.

---

*Architecture analysis: 2026-05-08*
