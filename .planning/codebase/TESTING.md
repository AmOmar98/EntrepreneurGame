# Testing Patterns

**Analysis Date:** 2026-05-08

## Test Framework

**Runner:** None configured.

- No `jest.config.*`, `vitest.config.*`, `playwright.config.*`, or `cypress.config.*` present in the repo
- No `*.test.*` or `*.spec.*` files exist in `app/`, `components/`, `lib/`, or `utils/`
- No test-related scripts in `package.json:6-12` (`dev`, `build`, `start`, `lint`, `typecheck` only)
- No testing dependencies in `package.json` (no `jest`, `vitest`, `@testing-library/*`, `playwright`, `cypress`, etc.)

**Assertion Library:** None.

**Run Commands:**
```bash
# (No test commands available)
npm run lint        # closest available quality gate
npm run typecheck   # closest available correctness gate
```

## Quality Gates Currently In Use

The repo relies on **static analysis only** as its quality bar.

### 1. ESLint — `npm run lint`

- Config: `eslint.config.mjs` (flat config)
- Extends:
  - `typescript-eslint` recommended (full set, spread via `...tseslint.configs.recommended`)
  - `@next/eslint-plugin-next` recommended rules
  - Next.js `core-web-vitals` rules
- Ignores: `.next/**`, `node_modules/**`, `next-env.d.ts`
- Catches: unused vars, `any` misuse, missing `key` props, `<img>` instead of `next/image`, missing `await` on Promises, etc.

### 2. TypeScript — `npm run typecheck`

- Config: `tsconfig.json`
- `strict: true` (full strict suite: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `alwaysStrict`, `useUnknownInCatchVariables`)
- `noEmit: true` — type-check only
- Incremental build cache at `tsconfig.tsbuildinfo`
- Catches: shape mismatches between Zod schemas, `WorkflowState`, Supabase row types, and React props

### 3. Next.js Build — `npm run build`

- Implicitly type-checks and lints during production build
- Will fail on missing data, broken imports, server/client boundary violations

### 4. Manual Runtime Checks

- `npm run dev` is exercised manually; saved logs in repo root (`dev-server.log`, `dev-server-3001.log`, `dev-server-3002.log`, plus `.err.log` counterparts) suggest manual inspection is the validation method
- Screenshots saved to `screenshots/` directory imply visual QA

## Test File Organization

**Not applicable.** No tests exist.

When tests are added, the recommended layout (matching ecosystem norms for Next.js 15 + React 19) is:

```
EntrepreneurGame/
  app/
    actions.test.ts             # co-located server-action tests
  components/
    proof-workflow.test.tsx     # co-located component tests
  lib/
    data.test.ts
    csv.test.ts
  __tests__/                    # OR a top-level folder for integration tests
    workflows/
      submit-deliverable.test.ts
  e2e/                          # Playwright specs (separate from unit/integration)
    journey.spec.ts
```

## Test Structure

**Not applicable** — no patterns established.

## Mocking

**Not applicable** — no mocking framework configured.

When testing is introduced, the things most needing mocks are:
- `@/utils/supabase/server` `createClient()` — already returns `null` in demo mode, so tests can rely on the dual-mode design (no mock needed for the fallback path)
- `next/cache` `revalidatePath` — must be mocked for unit tests of server actions
- `next/navigation` `redirect` — throws by design; mock to assert redirect target
- `Date.now()` / `new Date().toISOString()` in `app/actions.ts:107,151` — freeze for deterministic snapshots
- `window.location.href` assignment in `components/proof-workflow.tsx:28,35` — JSDOM environment + spy

## Fixtures and Factories

**Not applicable.** However, `lib/data.ts` already contains a comprehensive in-memory seed (the demo-mode dataset) which doubles as a fixture source. Tests should import from `lib/data.ts` rather than re-fabricate startups, coaches, stages, or bonus rules.

`database/seed_bootcamp.sql` is the SQL counterpart and could seed an integration test database.

## Coverage

**Requirements:** None enforced.

**View Coverage:** Not available.

## Test Types

**Unit Tests:** None.
**Integration Tests:** None.
**E2E Tests:** None.

## Recommended Additions

These are not implemented; they describe a sensible roadmap that fits the stack and would unblock CI gating.

### Priority 1 — Server Action Unit Tests

Highest leverage given that `app/actions.ts` is the single mutation surface and uses Zod schemas.

- **Tool:** Vitest (faster cold start than Jest, native ESM, works with Next 15)
- **What to test:**
  - Each Zod schema (`deliverableSchema`, `bonusSchema`, `kycSchema`, `questSchema`) — happy + boundary + invalid cases
  - The shared `httpsUrl` schema — assert `http://`, missing protocol, and malformed URLs are rejected
  - `WorkflowState` shape: every action returns `{ ok, message, mailto? }`; failure paths populate a non-empty `message`
  - `formValue` helper coerces missing keys to `""` (not `"undefined"`)
  - `mailto` payload encoding (assert `encodeURIComponent` round-trips French characters and quotes)
- **Suggested install:**
  ```bash
  npm i -D vitest @vitest/ui jsdom
  ```
  Add `"test": "vitest"` and `"test:ci": "vitest run"` to `package.json` scripts.

### Priority 2 — Pure Function Unit Tests

- `lib/data.ts` `calculateBonusClaim` — bonus capping rules, prestige XP transitions
- `lib/csv.ts` — CSV escaping (commas, quotes, newlines), UTF-8 BOM, header order matching the README export contract
- `lib/i18n.ts` `getLocale` — fallback to `"fr"` for unknown values

### Priority 3 — Component Tests

- **Tool:** Vitest + `@testing-library/react` + `jsdom`
- **What to test:**
  - `ProofWorkflow` — submitting the form invokes the action, renders the success message, and triggers the `mailto` redirect side effect (spy on `window.location`)
  - `AppShell` — role-based nav filtering; current-phase highlighting based on `pathname`
  - `OnboardingKycForm` — required field validation surfaces the right Zod error messages

### Priority 4 — Integration / E2E

- **Tool:** Playwright (built-in test runner, parallel workers, trace viewer)
- **Smoke flows:**
  - Founder onboarding → KYC submit → first deliverable proof → mailto draft opens
  - Coach validation queue → approve deliverable → XP increments
  - CSV export endpoints under `app/api/export/` return the documented column shape
- **Run modes:** demo mode (no Supabase env) for deterministic CI; Supabase-backed mode behind a `PLAYWRIGHT_LIVE=1` flag for staging smoke tests

### Priority 5 — Database Tests

- Apply `database/schema.sql` → `triggers.sql` → `rls.sql` to a throwaway Postgres (Supabase local CLI), then exercise the trigger that maintains XP aggregates
- Verify RLS policies block cross-tenant reads (founder cannot read another startup's deliverables)

## CI Gating (recommended)

No CI configuration is present (no `.github/workflows/`, `.gitlab-ci.yml`, or similar). When CI is added, the minimum gate per PR should be:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
# (npm test once Priority 1 above lands)
```

## Common Patterns

**Async Testing:** Not yet established. Server actions are `async`; use `await` + `await expect(promise).resolves.toEqual(...)`.

**Error Testing:** Server actions never throw — assert on returned `{ ok: false, message }` rather than wrapping in `expect(...).rejects`.

---

*Testing analysis: 2026-05-08*
