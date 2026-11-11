# Development guide

## Setup

Use npm and the committed lockfile: `npm ci`. CI currently selects Node 20 in `.github/workflows/ci.yml`; there is no `engines` declaration or runtime version file. The 2026-09-29 local audit used Node 24.14.0 / npm 11.9.0. Runtime alignment is an explicit backlog item, not a claim that every version is supported.

### Local demo

On a clean checkout without Supabase environment variables, run `npm run dev` and open `http://localhost:3000`.

If `.env.local` already exists, force demo mode in a **dedicated terminal**. The following block was verified with **PowerShell 7.6.6**: empty process variables override the file without editing it. Do not use this block in Windows PowerShell 5.1, which removes variables assigned an empty string and can let `.env.local` reactivate the backend. Use the Node command below in that shell.

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = ''
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = ''
$env:SUPABASE_SERVICE_ROLE_KEY = ''
$env:SENTRY_DSN = ''
$env:NEXT_PUBLIC_SENTRY_DSN = ''
$env:NEXT_PUBLIC_POSTHOG_KEY = ''
npm run dev
```

Equivalent for a POSIX shell:

```bash
NEXT_PUBLIC_SUPABASE_URL='' NEXT_PUBLIC_SUPABASE_ANON_KEY='' SUPABASE_SERVICE_ROLE_KEY='' SENTRY_DSN='' NEXT_PUBLIC_SENTRY_DSN='' NEXT_PUBLIC_POSTHOG_KEY='' npm run dev
```

Close that terminal to discard its overrides. Demo mode has intentional empty states and login redirects; it cannot exercise persisted submissions, real mentor reviews or jury scoring.

For Windows PowerShell 5.1, this command passes explicit empty values directly to the Next.js child process:

```powershell
node -e "const {spawn}=require('node:child_process'); const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_ANON_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',SENTRY_DSN:'',NEXT_PUBLIC_SENTRY_DSN:'',NEXT_PUBLIC_POSTHOG_KEY:''}; spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev'],{env,stdio:'inherit'}).on('exit',code=>process.exit(code??1));"
```

### Connected development

Use a dedicated development Supabase project with synthetic participants. `.env.example` documents configuration names; create a local environment file only if needed and do not overwrite an existing one. Client URL/anon key enable connected mode; the service-role key is server-only and supports privileged provisioning. Optional monitoring keys are unnecessary for normal local work.

Database setup is currently a known gap: [the audit](REPO_AUDIT.md) identifies malformed trigger declarations and bootstrap ordering conflicts. Do not assume copying the old `database/README.md` sequence will create a valid environment. Establish and verify a disposable-database procedure as roadmap item DB-01 first.

## Verification

| Command | What it establishes |
|---|---|
| `npm run typecheck` | TypeScript consistency |
| `npm run lint` | Configured lint rules; `.cjs` scripts are excluded |
| `npm run test:unit` | Pure logic/schema tests selected by `vitest.config.ts` |
| `npm run build` | Next.js production compilation; use demo/telemetry overrides for an offline-data check |
| `npm run test:e2e` / `npm run smoke` | The same Playwright suite, currently Chromium/demo mode |
| `./scripts/check-r2-severity.ps1` | Static severity scan on Windows; baseline false positive documented in the audit |

Install the matching browser once with `npx playwright install chromium` if needed. Playwright starts the app on port 3001. Its configuration permits reusing an existing server locally: stop your own server there first, or set `CI=true` in the dedicated test terminal to require a fresh server. Do not run tests against an unknown reused server. Do not run the build alongside the dev/test server because both write `.next/`.

Passing demo checks does not prove database writes, role isolation, archive preservation or concurrency. Changes to these behaviors need authenticated integration tests against disposable data. UI changes also require visual checks for affected roles and small screens.

The build uses `next/font/google` in `app/layout.tsx`, so it may require network access to fetch fonts. Distinguish environment failures from source failures when reporting a result.

## Change workflow

1. Inspect the working tree and read the relevant domain code, `AGENTS.md`, and current task evidence. Preserve other work.
2. Record a bounded task and acceptance criteria under `.planning/`; use the existing GSD quick/phase workflow where available.
3. Change one behavior or boundary at a time. Preserve R1/R2/R3, event archives and both runtime modes.
4. Run relevant checks. For merge readiness, the established policy includes typecheck, lint and build; add unit/browser/integration checks appropriate to the behavior.
5. Record what passed, what failed, and what was not exercised. Update current docs when behavior changes; retain historical evidence.

## Database changes

Author future migrations only in `supabase/migrations/`, maintain cumulative mirrors as required by [the manifest](../database/MANIFEST.md), and prove both a fresh install and an upgrade on disposable databases. Review authorization policies and scoring-trigger effects together with application changes.

Provisioning, reset, seed, production-smoke and performance scripts are operator tools, not setup shortcuts. In particular, `database/_reset_pre_event.sql` deletes records across events. The existing performance script measures repeated query timings; a 500-user seed does not establish 500 simultaneous users.

## Deployment handoff

Use [DEPLOY.md](DEPLOY.md), [PILOT-PREFLIGHT.md](PILOT-PREFLIGHT.md) and [OBSERVABILITY.md](OBSERVABILITY.md) as existing references after confirming the environment and current configuration. A release needs the application revision, applied migration versions, authenticated rehearsal, recovery procedure and monitoring evidence. A local build alone does not establish these.
