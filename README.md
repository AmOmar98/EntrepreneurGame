# Entrepreneur Game

EIC/UEMF's platform for running entrepreneurship programs: teams complete missions, submit deliverables, receive mentor feedback, and present to a jury. GameMasters configure events, missions, evaluation criteria and scoring.

The next product direction is **a production-ready version for EIC first, prepared for other organizations later**. The [production roadmap](docs/PRODUCTION_ROADMAP.md) covers reliability, user experience and event management together.

Launch target: **3 November 2026**, the Idea'Wave Cycle 1 initiation workshop, according to the supplied provisional programme calendar. See the [launch calendar](docs/PRODUCTION_ROADMAP.md#ideawave-launch-calendar) for related dates and proposed rehearsal milestones.

## Start here

- [Documentation index](docs/README.md) — reading order and operational references.
- [Repository guide](docs/REPOSITORY_GUIDE.md) — architecture, roles, routes and where to make changes.
- [Development guide](docs/DEVELOPMENT.md) — setup, checks and contribution workflow.
- [Repository audit](docs/REPO_AUDIT.md) — verified baseline, known gaps and evidence.
- [Production roadmap](docs/PRODUCTION_ROADMAP.md) — prioritized work and release criteria.

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. CI currently uses Node 20; see the development guide for the local verification environment and runtime alignment work.

Without Supabase configuration, the app provides a **limited demo mode**: some pages show seed or empty data; protected dashboards may redirect to login. Full submission, review and jury workflows require a configured Supabase development project and test accounts. Existing `.env.local` files are loaded automatically; use the [explicit demo commands](docs/DEVELOPMENT.md#local-demo) when one is present.

## What is in this checkout

- Next.js 15 App Router, React 19 and TypeScript; custom CSS and design tokens.
- Supabase authentication, PostgreSQL data and row-level access policies.
- Player onboarding, journey, versioned submissions, bonus claims and help requests.
- Mentor review, evaluations and comments.
- Jury assignment, pitch sessions, configurable criteria and results.
- GameMaster event creation/cloning/activation, mission and deliverable editors, levels, scoring settings and CSV exports.
- Vitest unit tests, Playwright browser checks, GitHub Actions CI, and optional Sentry/PostHog instrumentation.

The audited branch is `milestone/v0.4-scale-foundation`, at `937468f` on 2026-09-29. Code completion and historical planning checkboxes do **not** establish the current deployed version. Production configuration, database parity and operational readiness still need evidence; see the audit.

## Checks

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

Browser checks currently exercise demo behavior, not authenticated database persistence. See [verification guidance](docs/DEVELOPMENT.md#verification).

## Database and deployment

New migrations belong in `supabase/migrations/`; `database/migrations/` is historical. Follow [the migration policy](database/MANIFEST.md) for authorship, and read the [audit's bootstrap findings](docs/REPO_AUDIT.md) before attempting database setup. The historical fresh-database instructions are not currently a verified setup procedure.

Existing operator references: [deployment](docs/DEPLOY.md), [smoke tests](docs/SMOKE.md), [preflight](docs/PILOT-PREFLIGHT.md), [observability](docs/OBSERVABILITY.md). Confirm the target environment and deployed revision before using operational procedures.
