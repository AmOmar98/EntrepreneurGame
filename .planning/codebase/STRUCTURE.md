# Codebase Structure

**Analysis Date:** 2026-05-08

## Directory Layout

```
EntrepreneurGame/
├── app/                          # Next.js 15 App Router (pages + actions + api)
│   ├── actions.ts                # Single "use server" module (all mutations)
│   ├── layout.tsx                # Root HTML shell (lang="fr")
│   ├── page.tsx                  # EIC admin cockpit (default role)
│   ├── globals.css               # Tailwind + design tokens
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── game/page.tsx         # Bootcamp quest editor
│   │   └── startups/page.tsx     # Startup CRUD + assignments
│   ├── api/
│   │   └── export/               # Read-only CSV / EML downloads
│   │       ├── cohort.csv/route.ts
│   │       ├── review-queue.csv/route.ts
│   │       ├── kpi-snapshot.csv/route.ts
│   │       ├── committee/[committeeId]/route.ts
│   │       ├── committee/[committeeId].csv/route.ts
│   │       └── eml/[committeeId]/route.ts
│   ├── coach/page.tsx            # Coach validation queue
│   ├── committee/page.tsx        # Committee member dashboard
│   ├── journey/page.tsx          # Founder-facing program map
│   ├── login/page.tsx            # Email/password sign-in
│   ├── mailto/page.tsx           # mailto draft inbox / log
│   ├── onboarding/page.tsx       # Pre-bootcamp KYC form
│   ├── ops/page.tsx              # Ops / status dashboard
│   ├── projects/page.tsx         # Cross-project listing
│   ├── review/page.tsx           # Reviewer queue
│   └── startup/[slug]/page.tsx   # Per-startup detail (proof workflow)
├── components/                   # Reusable UI (mix of server + client)
│   ├── app-shell.tsx             # Sidebar nav + role filter (client)
│   ├── badge.tsx                 # Tone-coded badge
│   ├── onboarding-kyc-form.tsx   # KYC client form (useActionState)
│   ├── page-header.tsx           # Eyebrow / title / actions header
│   ├── project-card.tsx          # Compact project summary card
│   └── proof-workflow.tsx        # Founder proof + bonus claim forms (client)
├── lib/                          # Domain logic, demo seed, helpers
│   ├── data.ts                   # SINGLE SOURCE OF TRUTH (types, seed, helpers)
│   ├── workflow-data.ts          # Journey phases / quest constants
│   ├── csv.ts                    # toCsv + csvResponse helpers
│   ├── i18n.ts                   # FR/EN/AR copy keys
│   └── supabase-status.ts        # hasSupabaseEnv() probe
├── utils/
│   └── supabase/
│       ├── server.ts             # SSR client for server components / actions
│       └── middleware.ts         # Cookie-aware client + auth gate (updateSession)
├── database/                     # Apply IN ORDER
│   ├── schema.sql                # Enums, tables, generated columns
│   ├── triggers.sql              # updated_at + XP ledger triggers
│   ├── rls.sql                   # has_role / is_staff + per-table policies
│   └── seed_bootcamp.sql         # Optional pilot seed
├── ops/                          # Deploy target only (not local dev)
│   ├── compose.app.yml
│   └── Caddyfile
├── screenshots/                  # README assets
├── middleware.ts                 # Delegates to utils/supabase/middleware.ts
├── next.config.ts                # remotePatterns for api.dicebear.com
├── eslint.config.mjs             # Flat config extending `next`
├── tsconfig.json                 # `@/*` → repo root
├── declarations.d.ts
├── next-env.d.ts
├── package.json                  # next 15.5, react 19.2, zod 4.4, @supabase/ssr
├── README.md
├── CLAUDE.md                     # Repo-level instructions for Claude Code
└── dev-server*.log               # Saved dev-server output (gitignorable)
```

## Directory Purposes

**`app/`:**
- Purpose: Every URL the app exposes. Server components by default.
- Contains: `page.tsx` per route, the lone `actions.ts` mutation module, root `layout.tsx`, and read-only `api/export/` route handlers.
- Key files: `app/actions.ts`, `app/layout.tsx`, `app/page.tsx`, `app/startup/[slug]/page.tsx`.

**`app/api/export/`:**
- Purpose: Read-only CSV/EML downloads. Names match the README contract.
- Conventions: filename ending `.csv` is implemented as a directory containing `route.ts`. Dynamic exports use `[committeeId]` segments. CSV bodies always come through `lib/csv.ts:csvResponse`.

**`components/`:**
- Purpose: Reusable presentational and form components.
- Convention: client components carry `"use client"` at the top (`app-shell.tsx`, `proof-workflow.tsx`, `onboarding-kyc-form.tsx`); the rest are server components.
- Key files: `components/app-shell.tsx`, `components/proof-workflow.tsx`, `components/page-header.tsx`.

**`lib/`:**
- Purpose: Pure domain code — no React, no Next imports.
- Contains: types, enums, demo data, helpers, mailto builders, KPI calculators.
- Key files: `lib/data.ts` (single source of truth, ~1285 lines), `lib/workflow-data.ts`, `lib/i18n.ts`, `lib/csv.ts`, `lib/supabase-status.ts`.

**`utils/supabase/`:**
- Purpose: Adapter layer over `@supabase/ssr`.
- Files: `utils/supabase/server.ts` (`createClient()` returns `null` in demo mode), `utils/supabase/middleware.ts` (`updateSession(request)`).

**`database/`:**
- Purpose: Source of truth for the Postgres schema, RLS, and triggers.
- Apply order: `schema.sql` → `triggers.sql` → `rls.sql`. `seed_bootcamp.sql` is optional.
- Generated columns and triggers maintain `projects.total_xp` — prefer documented columns over direct `total_xp` updates.

**`ops/`:**
- Purpose: Production deploy artifacts (`docker compose`, Caddy reverse proxy). Not used for `npm run dev`.
- Generated: No. Committed: Yes.

**`screenshots/`:**
- Purpose: Static images embedded in `README.md`.

**`node_modules/`, `.next/`, `tsconfig.tsbuildinfo`:**
- Generated: Yes. Committed: No.

## Key File Locations

**Entry Points:**
- `middleware.ts`: edge auth gate.
- `app/layout.tsx`: root HTML / metadata.
- `app/page.tsx`: EIC admin cockpit.
- `app/actions.ts`: every mutation in the app.

**Configuration:**
- `next.config.ts`: image remote patterns.
- `tsconfig.json`: `@/*` → repo root path alias.
- `eslint.config.mjs`: flat ESLint extending `next`.
- `package.json`: scripts (`dev`, `build`, `start`, `lint`, `typecheck`).

**Core Logic:**
- `lib/data.ts`: domain types + demo seed.
- `lib/workflow-data.ts`: program-wide workflow constants.
- `app/actions.ts`: server actions with Zod validation.
- `utils/supabase/server.ts`: server-side Supabase factory.
- `database/schema.sql`: tables and enums.
- `database/triggers.sql`: XP / updated_at triggers.
- `database/rls.sql`: RLS policies + `has_role` / `is_staff` helpers.

**Testing:**
- None. No test runner is configured (per CLAUDE.md).

## Naming Conventions

**Files:**
- React components: kebab-case `*.tsx` (e.g., `proof-workflow.tsx`, `app-shell.tsx`).
- Pages and route handlers: literal `page.tsx` / `route.ts` per App Router convention.
- Library modules: kebab-case `.ts` (`workflow-data.ts`, `supabase-status.ts`).
- SQL: snake_case (`schema.sql`, `seed_bootcamp.sql`).

**Directories:**
- Route segments: lowercase, role/feature noun (`coach`, `review`, `committee`, `admin/game`).
- Dynamic segments: `[paramName]` (e.g., `[slug]`, `[committeeId]`).
- CSV download routes: literal extension in segment name (`cohort.csv/route.ts`).

**Identifiers (TypeScript):**
- Types and enums: PascalCase (`Stage`, `BonusType`, `WorkflowState`).
- Functions / hooks: camelCase (`xpSummary`, `calculateBonusClaim`, `submitDeliverableFlow`).
- React components: PascalCase exports (`AppShell`, `ProofWorkflow`).

**Database:**
- Tables and columns: snake_case (`project_holder_kyc`, `pending_xp`).
- Enum types: snake_case (`project_stage`, `checkpoint_band`).

## Where to Add New Code

**New page / route:**
- Create `app/<segment>/page.tsx` (server component by default).
- Wrap content with `<AppShell role="...">` from `components/app-shell.tsx`.
- Pull data from `lib/data.ts`; never query Supabase directly from a page if a helper already exists.

**New mutation / form action:**
- Add to `app/actions.ts` (do NOT create a new actions file — keep the single module).
- Define a Zod schema at the top alongside `deliverableSchema` / `bonusSchema`. Reuse `httpsUrl` for any URL input.
- For `useActionState`-style forms, return `WorkflowState`; for fire-and-forget forms, return `void`.
- Always call `revalidatePath` for every page that displays the mutated entity.

**New domain type / enum:**
- Add to `lib/data.ts` (types) and mirror in `database/schema.sql` (Postgres enum or check constraint).
- Update Zod literal unions in `app/actions.ts` to match.

**New reusable UI:**
- Drop in `components/`. Mark `"use client"` only when interactivity is required.

**New CSV / EML export:**
- Add `app/api/export/<name>/route.ts` (or `<name>.csv/route.ts` for filename matching).
- Use `toCsv(rows)` + `csvResponse(filename, csv)` from `lib/csv.ts`.
- Source rows from a helper in `lib/data.ts` (e.g., `committeeDossierRows`).

**New copy string:**
- Add a key to `lib/i18n.ts`. Avoid inlining French/English literals in components.

**New Supabase table / column:**
- Edit `database/schema.sql`, add any trigger to `database/triggers.sql`, add or adjust policies in `database/rls.sql`. Reapply in order.

**Utilities / helpers:**
- Pure helpers (no React) → `lib/`.
- Helpers that touch Supabase or Next request context → `utils/`.

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD-generated codebase analysis (this file lives here).
- Generated: Yes (by `/gsd-map-codebase`). Committed: Yes.

**`screenshots/`:**
- Purpose: README imagery.
- Generated: No. Committed: Yes.

**`node_modules/`, `.next/`:**
- Purpose: Dependencies / Next build artifacts.
- Generated: Yes. Committed: No.

**`dev-server*.log`:**
- Purpose: Captured dev-server output. Multiple files indicate ports 3000 / 3001 / 3002 were used.
- Generated: Yes. Committed: appears tracked but should be gitignored (see CONCERNS).

**`ops/`:**
- Purpose: Production-only deploy descriptors. Do not invoke from the local dev workflow.

---

*Structure analysis: 2026-05-08*
