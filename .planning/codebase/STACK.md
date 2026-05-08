# Technology Stack

**Analysis Date:** 2026-05-08

## Languages

**Primary:**
- TypeScript ^6.0.3 — All application code (`app/`, `components/`, `lib/`, `utils/`, `middleware.ts`, `next.config.ts`)
- TSX — React components (App Router pages and `components/*.tsx`)

**Secondary:**
- SQL — Database schema, triggers, RLS policies (`database/schema.sql`, `database/triggers.sql`, `database/rls.sql`, `database/seed_bootcamp.sql`)
- CSS — Tailwind utility layer via `app/globals.css`
- JavaScript (ESM) — ESLint flat config (`eslint.config.mjs`)

## Runtime

**Environment:**
- Node.js (Next.js 15 server runtime; specific version not pinned via `.nvmrc`)
- Browser runtime: React 19 client components

**Package Manager:**
- npm (lockfile present at `package-lock.json`)
- `package.json` declares `"type": "commonjs"` while TypeScript is configured for `module: esnext` with `moduleResolution: bundler`

## Frameworks

**Core:**
- Next.js ^15.5.15 — App Router, server actions, route handlers, middleware
- React ^19.2.5 / React DOM ^19.2.5 — UI rendering
- Tailwind CSS — utility styling layered through `app/globals.css` (no separate `tailwind.config` detected; styling driven directly from `globals.css`)

**Testing:**
- None configured — no test runner, no `*.test.*` / `*.spec.*` files, no `jest.config` or `vitest.config`

**Build/Dev:**
- Next.js CLI — `next dev`, `next build`, `next start` (see `package.json` scripts)
- TypeScript compiler in no-emit mode for `npm run typecheck` (`tsc --noEmit`)
- Incremental TS build artifact: `tsconfig.tsbuildinfo`

## Key Dependencies

**Critical:**
- `@supabase/ssr` ^0.10.2 — Server-side Supabase client + cookie-based session refresh (`utils/supabase/middleware.ts`, `utils/supabase/server.ts`)
- `@supabase/supabase-js` ^2.105.3 — Underlying Supabase JS SDK (transitive dependency of `@supabase/ssr`)
- `zod` ^4.4.3 — Input validation for all server actions in `app/actions.ts` (including the shared `httpsUrl` schema enforcing `https://` URLs)
- `next` ^15.5.15 — Framework runtime
- `react` / `react-dom` ^19.2.5 — UI runtime

**Infrastructure:**
- `lucide-react` ^1.14.0 — Icon set used by the app shell and dashboards
- `clsx` ^2.1.1 — Conditional className composition

## Configuration

**TypeScript (`tsconfig.json`):**
- `target: ES2017`, `lib: [dom, dom.iterable, esnext]`
- `strict: true`, `noEmit: true`, `isolatedModules: true`
- `module: esnext`, `moduleResolution: bundler`
- `jsx: preserve` (Next.js handles JSX transform)
- Path alias `@/*` → repo root
- Next.js TS plugin enabled

**Linting (`eslint.config.mjs`):**
- ESLint ^9.39.4 flat config
- Extends `typescript-eslint` recommended
- Adds `@next/eslint-plugin-next` recommended + `core-web-vitals` rules (via `eslint-config-next` ^16.2.4)
- Ignores `.next/**`, `node_modules/**`, `next-env.d.ts`

**Next.js (`next.config.ts`):**
- Remote image patterns whitelist `api.dicebear.com` over HTTPS

**Environment:**
- `.env.example` present at repo root (committed) — documents required public + service role env vars
- No `.env` / `.env.local` detected in working tree

**Build:**
- Next.js handles bundling, transpilation, route compilation (no separate webpack/vite config)
- TypeScript declarations: `next-env.d.ts`, `declarations.d.ts`

## Platform Requirements

**Development:**
- Node.js capable of running Next.js 15 / React 19 (Node 18.18+ / 20+ recommended by Next 15)
- npm
- Local dev server defaults to `http://localhost:3000`; logs in repo reference alternate ports `3001` and `3002` (`dev-server-3001.log`, `dev-server-3002.log`)

**Production:**
- `ops/compose.app.yml` and `ops/Caddyfile` describe a Docker Compose + Caddy reverse-proxy deployment target (not used for local dev)

## Project Scripts (`package.json`)

```
dev        next dev
build      next build
start      next start
lint       eslint .
typecheck  tsc --noEmit
```

---

*Stack analysis: 2026-05-08*
