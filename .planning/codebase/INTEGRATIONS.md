# External Integrations

**Analysis Date:** 2026-05-08

## APIs & External Services

**Backend-as-a-Service:**
- Supabase — Authentication, Postgres database, Row Level Security
  - SDK/Client: `@supabase/ssr` ^0.10.2 (wraps `@supabase/supabase-js` ^2.105.3)
  - Server client factory: `utils/supabase/server.ts` (`createClient` — cookie-bound SSR client via `next/headers`)
  - Middleware client + session refresh: `utils/supabase/middleware.ts` (`updateSession`)
  - Auth env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Privileged ops env var: `SUPABASE_SERVICE_ROLE_KEY` (declared in `.env.example`; not currently referenced from source — reserved for admin-side operations)
  - Dual-mode toggle: `lib/supabase-status.ts:hasSupabaseEnv()` returns `true` only when both public env vars exist; when `false`, the app falls back to in-memory seed data in `lib/data.ts` and `lib/workflow-data.ts`

**Image / Avatar Service:**
- DiceBear — Avatar generation
  - Base URL: `https://api.dicebear.com`
  - Whitelisted in `next.config.ts` `images.remotePatterns` for `next/image` optimization
  - No SDK; consumed via direct HTTPS image URLs

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: managed by Supabase; configured through `NEXT_PUBLIC_SUPABASE_URL`
  - Client: `@supabase/ssr` `createServerClient` (SSR cookie-aware)
  - Schema: `database/schema.sql`
  - Triggers (XP aggregation, stage transitions): `database/triggers.sql`
  - Row Level Security policies: `database/rls.sql` (pilot-grade — must be applied)
  - Optional pilot seed: `database/seed_bootcamp.sql`
  - Apply order is mandatory: `schema.sql` → `triggers.sql` → `rls.sql`

**File Storage:**
- None — the proof-submission workflow is link-based (no file uploads). Submissions generate `mailto:` drafts via `components/proof-workflow.tsx` instead of uploading artifacts.

**Caching:**
- None detected (no Redis, no in-process cache layer beyond Next.js defaults)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (cookie-based SSR sessions)
  - Session refresh: `utils/supabase/middleware.ts:updateSession` invoked from `middleware.ts`
  - Route gating: middleware redirects unauthenticated users to `/login`; public paths are `/login`, `/api/*`, `/_next/*`
  - User retrieval: `supabase.auth.getUser()` in middleware
  - Login UI: `app/login/page.tsx`
  - Onboarding/KYC flow: `app/onboarding/page.tsx`, `components/onboarding-kyc-form.tsx`
- Demo mode bypass: when Supabase env vars are absent, middleware short-circuits with `NextResponse.next()` and the app is fully navigable against in-memory seed data

**Roles (`AppRole` in `lib/data.ts`):**
- `founder`, `mentor`, `reviewer`, `committee_member`, `eic_admin`

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry / Datadog / Bugsnag SDKs detected)

**Logs:**
- Local dev server stdout/stderr captured to root-level files: `dev-server.log`, `dev-server.err.log`, `dev-server-3001.{log,err.log}`, `dev-server-3002.{log,err.log}`
- No structured logging library configured

## CI/CD & Deployment

**Hosting:**
- Self-hosted via Docker Compose + Caddy
  - Compose definition: `ops/compose.app.yml`
  - Reverse proxy config: `ops/Caddyfile`
  - Production hostnames referenced in `.env.example`: `https://api.eic-game.uemf.ma`, `https://eic-game.uemf.ma`

**CI Pipeline:**
- None detected (no `.github/workflows/`, no `.gitlab-ci.yml`, no other CI config in repo root)

## Environment Configuration

**Required env vars (from `.env.example`):**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (public, browser-exposed)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (public, browser-exposed)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only; declared but not yet consumed in source)
- `NEXT_PUBLIC_APP_URL` — Public app URL (used for absolute links / redirects; declared but referenced in templates)

**Consumption sites:**
- `lib/supabase-status.ts:2` — feature gate
- `utils/supabase/server.ts:11-12` — server client init
- `utils/supabase/middleware.ts:10-11` — middleware client init

**Secrets location:**
- Local: `.env.local` / `.env` (not present in working tree)
- Template: `.env.example` (committed, contains placeholder values only)
- Production: assumed to be injected via Docker / environment at deploy time (`ops/compose.app.yml`)

## Server Actions & Validation Boundary

- All mutations funnel through `app/actions.ts` (single `"use server"` module)
- Inputs validated with Zod schemas; URL fields restricted to `https://` via shared `httpsUrl` schema
- Actions return a uniform `WorkflowState`: `{ ok, message, mailto? }`
- Outbound side effect is the generated `mailto:` draft (recipients: assigned coach + EIC admin) — see `components/proof-workflow.tsx`

## Route Handlers (Export APIs)

CSV / committee pack / EML exports under `app/api/export/`:
- `app/api/export/cohort.csv/` — cohort CSV
- `app/api/export/review-queue.csv/` — review queue CSV
- `app/api/export/kpi-snapshot.csv/` — KPI snapshot CSV
- `app/api/export/committee/[id]/` — committee pack (per-startup)
- `app/api/export/eml/[id]/` — EML export (per-record)

CSV serialization helper: `lib/csv.ts`

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None (proof submissions produce client-side `mailto:` URIs rather than HTTP callbacks)

## Data Flow Boundaries

1. **Browser → Middleware** — every non-static request hits `middleware.ts` → `updateSession`. With Supabase env present, auth cookies are refreshed and unauthenticated users are redirected to `/login`. Without env, requests pass through.
2. **Server Component → Supabase** — pages call `createClient()` from `utils/supabase/server.ts`; if it returns `null`, the page reads from `lib/data.ts` seed instead.
3. **Client Form → Server Action** — forms post into `app/actions.ts`; Zod validates; action either writes through Supabase server client or, in demo mode, mutates in-memory state and returns a `WorkflowState` (sometimes including a `mailto:` URI for the proof workflow).
4. **Database Triggers** — XP aggregates and stage transitions are maintained by SQL triggers in `database/triggers.sql`; application code should update documented columns rather than aggregate fields directly.
5. **Export Endpoints** — `app/api/export/*` route handlers serialize current state to CSV / committee pack / EML using `lib/csv.ts`.

---

*Integration audit: 2026-05-08*
