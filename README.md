# EIC Venture Journey

V2 pilot app for the Entrepreneur Game / EIC Venture Journey.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` or `http://localhost:3001` if you start the alternate dev port.

## What is built

- Next.js App Router application with a cockpit, founder startup interface, coach overview, EIC admin analytics, startup admin, review queue, committee pack, ops checklist, and mailto lab.
- Founder-facing checkpoints: Make it, Sell it, Look after it.
- XP model with confirmed XP, pending XP, prestige XP, deliverable validation, and capped bonus achievements.
- Link-based deliverable and bonus proof flow using `mailto:` drafts to assigned coach plus EIC.
- Server route handlers for the requested exports:
  - `/api/export/cohort.csv`
  - `/api/export/review-queue.csv`
  - `/api/export/committee/com-2026-05`
  - `/api/export/kpi-snapshot.csv`
  - `/api/export/eml/com-2026-05`
- Seeded pilot data so the app runs before Supabase credentials exist.
- Supabase-ready auth helpers, middleware, server actions, SQL schema, triggers, and pilot RLS.

## Supabase integration path

The app has a demo fallback in `lib/data.ts`. When Supabase env vars are present, middleware protects the app and server actions write to Supabase tables.

Apply the SQL in this order:

```bash
database/schema.sql
database/triggers.sql
database/rls.sql
```

Then create users in Supabase Auth, add their rows to `profiles` and `user_roles`, create startups through `/admin/startups`, and assign founders/coaches.

## Deploy

The app is deployed on Vercel for the pilot. See [`docs/DEPLOY.md`](docs/DEPLOY.md) for the full deployment guide:

- First-time setup (Vercel link + env vars + Supabase Auth config)
- Continuous deploy procedure (push to `master`)
- Rollback procedure (code + DB)
- Custom domain configuration
- Troubleshooting

After every production deploy, execute the smoke test checklist in [`.planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/SMOKE-TEST-E2E.md`](.planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/SMOKE-TEST-E2E.md) before opening to internal testers.
