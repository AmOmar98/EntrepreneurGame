# Phase 13: DB Consolidation + Test Infrastructure - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 10 new/modified files
**Analogs found:** 9 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `vitest.config.ts` | config | — | `playwright.config.ts` (config structure) | role-match |
| `tests/unit/actions-schemas.test.ts` | test | transform | `tests/smoke/r1-no-score.spec.ts` (test conventions) | role-match |
| `tests/e2e/onboarding.spec.ts` | test | request-response | `tests/smoke/r2-warn-only.spec.ts` | exact |
| `tests/e2e/submit-deliverable.spec.ts` | test | request-response | `tests/smoke/r1-no-score.spec.ts` | exact |
| `tests/e2e/mentor-eval.spec.ts` | test | request-response | `tests/smoke/r2-warn-only.spec.ts` | exact |
| `tests/e2e/jury-pitch.spec.ts` | test | request-response | `tests/smoke/r3-no-hardcoded-block.spec.ts` | exact |
| `tests/e2e/gm-export.spec.ts` | test | request-response | `tests/smoke/r3-no-hardcoded-block.spec.ts` | exact |
| `.github/workflows/ci.yml` | config | — | `package.json` scripts (typecheck/lint/build verbs) | partial |
| `13-NEW.sql` (phase dir) | migration | CRUD | `.planning/quick/260523-kc2-advisors-fix/D1.sql` + `database/migrations/202605110007_phase14_engagement_trigger.sql` | exact |
| `database/triggers.sql` (patch) | migration | event-driven | `database/triggers.sql` existing structure | exact |

---

## Pattern Assignments

### `vitest.config.ts` (config)

**Analog:** `playwright.config.ts` (lines 1-43) + `node_modules/@vercel/speed-insights/vitest.config.mts` (reference only)

**Critical constraint — package.json `"type": "commonjs"`:**
The repo declares `"type": "commonjs"` in `package.json`. Vitest config files ending in `.ts` are loaded by Vitest's own bundler and work fine. However, `vitest.config.mts` uses the `.mts` extension which forces ESM resolution — avoid it. Use `vitest.config.ts` (plain `.ts`).

**TS module/resolution constraint:**
`tsconfig.json` uses `"module": "esnext"` and `"moduleResolution": "bundler"` — these are Next.js bundler settings that Vitest does **not** use. Vitest runs in Node, not via the Next.js bundler. The path alias `@/*` must be explicitly remapped in Vitest config using `resolve.alias`.

**`"use server"` constraint:**
`app/actions.ts` has `"use server"` at line 1 and imports from `next/navigation` (`redirect`) and `next/cache` (`revalidatePath`). These are Next.js runtime-only. Unit tests must NOT import and execute full server actions. Instead, test only the **pure Zod schemas** that are extractable to a separate module, or mock the Next.js imports.

**Pattern to copy from `playwright.config.ts` (lines 1-9):**
```typescript
// Same config file pattern: import defineConfig from the framework,
// set testDir, timeout, reporter. Playwright uses testDir:"./tests/smoke";
// Vitest uses include pattern instead.
import { defineConfig, devices } from "@playwright/test";
// → becomes:
import { defineConfig } from "vitest/config";
```

**Vitest config template (no existing analog — construct from constraints):**
```typescript
// vitest.config.ts  (plain .ts, NOT .mts — repo is "type":"commonjs")
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",           // server actions run in Node, not jsdom
    include: ["tests/unit/**/*.test.ts"],
    globals: false,                // explicit imports only
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),  // mirrors tsconfig paths "@/*" -> "./*"
    },
  },
});
```

**Why `environment: "node"`:** Server actions use Node globals (`process.env`). The `hasSupabaseEnv()` check reads `process.env.NEXT_PUBLIC_SUPABASE_URL` — available in Node env, not jsdom.

---

### `tests/unit/actions-schemas.test.ts` (test, transform)

**Analog:** `tests/smoke/r1-no-score.spec.ts` (test style) + `app/actions.ts` (schemas to extract)

**What to test:** The Zod schemas in `app/actions.ts` are the pure-logic surface that can be tested without Next.js runtime. The approach is to re-export or copy-test the schema logic. Since schemas are not currently exported from `actions.ts`, the unit test file should either:
1. Import the schema behavior indirectly by testing helper functions extracted to a pure module, OR
2. Test the schema directly by importing from a new thin module `lib/schemas.ts` that exports the schemas (and `actions.ts` re-imports from there).

**Key schemas worth unit-testing** (from `app/actions.ts`):

`submissionSchema` (lines 214-240) — validates `deliverableTemplateId` UUID, `kind` enum, `proofUrl`/`proofText` conditional:
```typescript
// lines 214-240 in app/actions.ts
const submissionSchema = z
  .object({
    deliverableTemplateId: z.string().uuid(),
    kind: z.enum(["proof_url", "proof_text"]),
    proofUrl: z.string().optional(),
    proofText: z.string().max(16000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "proof_url") {
      const r = httpsUrl.safeParse(data.proofUrl);
      if (!r.success) {
        ctx.addIssue({ code: "custom", message: "URL https:// requise", path: ["proofUrl"] });
      }
    } else {
      if (!data.proofText || data.proofText.trim().length < 10) {
        ctx.addIssue({ code: "custom", message: "Texte de preuve requis (>=10 caracteres)", path: ["proofText"] });
      }
    }
  });
```

`evaluationSchema` (lines 491-513) — verdict enum, scores record, `request_v2` requires `expectedAction`:
```typescript
// lines 491-513 in app/actions.ts
const evaluationSchema = z
  .object({
    submissionId: z.string().uuid(),
    feedback: z.string().min(0).max(4000),
    verdict: z.enum(["validate_v1", "request_v2", "validate_v2", "reject"]),
    expectedAction: z.string().max(500).optional(),
    scores: z.record(z.string(), z.coerce.number().min(0).max(25)),
  })
  .superRefine((data, ctx) => {
    if (data.verdict === "request_v2") {
      const trimmed = (data.expectedAction ?? "").trim();
      if (trimmed.length === 0) {
        ctx.addIssue({ code: "custom", path: ["expectedAction"], message: "L'action attendue est obligatoire..." });
      }
    }
  });
```

`httpsUrl` schema (lines 184-187):
```typescript
// lines 184-187 in app/actions.ts
const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), "URL doit commencer par https://");
```

**Test file structure (copy from smoke spec style):**
```typescript
// tests/unit/actions-schemas.test.ts
import { describe, it, expect } from "vitest";
// Import schemas from lib/schemas.ts (new thin extraction module)
// OR replicate inline for isolation if extraction is deferred.

describe("submissionSchema", () => {
  it("rejects http:// URLs for proof_url kind", () => {
    const result = submissionSchema.safeParse({
      deliverableTemplateId: "00000000-0000-0000-0000-000000000001",
      kind: "proof_url",
      proofUrl: "http://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts https:// URL for proof_url kind", () => { ... });
  it("rejects proof_text shorter than 10 chars", () => { ... });
});

describe("evaluationSchema", () => {
  it("requires expectedAction when verdict=request_v2", () => { ... });
  it("accepts empty expectedAction for validate_v1", () => { ... });
});
```

**Demo-mode seam for unit tests** (`lib/supabase-status.ts` line 1-3):
```typescript
// lib/supabase-status.ts — the demo gate
export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
// In unit tests: do NOT set these env vars → hasSupabaseEnv() returns false.
// createClient() (utils/supabase/server.ts line 6) returns null → no Supabase calls.
```

---

### `tests/e2e/onboarding.spec.ts` (test, request-response)

**Analog:** `tests/smoke/r2-warn-only.spec.ts` (lines 1-56) — already tests `/onboarding` in demo mode.

**Reuse the webServer config from `playwright.config.ts` lines 29-42:**
```typescript
// playwright.config.ts lines 29-42 — demo mode enforcement
webServer: {
  command: `npm run dev -- -p ${PORT}`,
  url: BASE_URL,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
  env: {
    // Sentinel: empty values trigger hasSupabaseEnv() === false.
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  },
},
```

**Demo-mode behavior of `/onboarding`** (`app/onboarding/page.tsx` lines 34-41):
```typescript
// app/onboarding/page.tsx lines 34-41
if (!hasSupabaseEnv()) {
  return (
    <main style={{ padding: 24 }}>
      <h1>{t.onboarding_title}</h1>
      <p>{t.onboarding_demo_disabled}</p>
    </main>
  );
}
```
In demo mode, onboarding renders a static disabled message — no form. The E2E test for onboarding flow must either:
- Test the page renders (status 200, `<main>` present) — always works in demo mode
- Test the form submission flow — only works with Supabase, so defer to integration or skip via `test.skip` when `!hasSupabaseEnv`

**Pattern from r2-warn-only.spec.ts lines 12-29:**
```typescript
test.describe("Onboarding flow — demo mode", () => {
  test("/onboarding renders without error in demo mode", async ({ page }) => {
    const response = await page.goto("/onboarding");
    expect(response?.status() ?? 0).toBeLessThan(500);
    const main = page.locator("main").first();
    await expect(main).toBeVisible({ timeout: 10_000 });
  });
});
```

---

### `tests/e2e/submit-deliverable.spec.ts` (test, request-response)

**Analog:** `tests/smoke/r1-no-score.spec.ts` (lines 21-45) + `tests/smoke/r3-no-hardcoded-block.spec.ts` (lines 38-48)

**Demo-mode behavior of `/journey/deliverable/[id]`:**
In demo mode, the page typically requires auth (`supabase.auth.getUser()` pattern from `app/actions.ts` lines 267-271). The deliverable page will likely redirect to `/login` or render empty. E2E test scope: verify the page responds non-5xx and the journey index renders.

**Key pattern — multi-route non-5xx check** (from r3 spec lines 38-48):
```typescript
test("known Player routes do not 5xx", async ({ page }) => {
  const routes = ["/journey", "/onboarding", "/login"];
  for (const route of routes) {
    const res = await page.goto(route);
    expect(res?.status() ?? 0, `${route} returned ${res?.status()}`).toBeLessThan(500);
  }
});
```

**What to assert for submit flow in demo mode:**
- `/journey` renders `main.eic-journey` (from r1 spec line 27)
- No `[disabled]` anchor tags on journey index (R3 rule, from r3 spec lines 18-21)
- `/journey/deliverable/SOME-DEMO-UUID` either redirects to `/login` (expected) or renders without 5xx

**Demo seed player IDs** (`lib/seed/players.ts` lines 8-33):
```typescript
// Use these UUIDs in E2E tests for demo-mode deliverable routes
"00000000-0000-0000-0000-000000000001"  // demo-alpha
"00000000-0000-0000-0000-000000000002"  // demo-beta
```

---

### `tests/e2e/mentor-eval.spec.ts` (test, request-response)

**Analog:** `tests/smoke/r2-warn-only.spec.ts` (structure) + `app/mentor/submission/[id]/page.tsx` (route behavior)

**Demo-mode behavior of mentor routes:**
`app/mentor/submission/[id]/page.tsx` line 35: `import { hasSupabaseEnv } from "@/lib/supabase-status"` — mentor pages check Supabase. In demo mode the page will short-circuit with a disabled message or redirect.

**Jury page pattern for demo mode** (`app/jury/page.tsx` lines 45-54):
```typescript
// app/jury/page.tsx lines 45-54 — demo mode conditional
const { eventId, rows } = hasSupabaseEnv()
  ? await getJuryOverview()
  : { eventId: null, rows: [] };
const { state: pitchModeState } = hasSupabaseEnv()
  ? await getCurrentPitchModeState()
  : { state: "off" as const };
```
Mentor and jury pages gracefully degrade: rows are empty, no 5xx. E2E test: verify `/mentor` and `/jury` respond < 500.

**Pattern:**
```typescript
test.describe("Mentor eval — demo mode smoke", () => {
  test("/mentor does not 5xx in demo mode", async ({ page }) => {
    const res = await page.goto("/mentor");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });
  test("/mentor/submission/demo-id does not 5xx", async ({ page }) => {
    const res = await page.goto("/mentor/submission/00000000-0000-0000-0000-000000000001");
    // Expected: redirect to /login (302) or 404, not 500
    expect(res?.status() ?? 0).toBeLessThan(500);
  });
});
```

---

### `tests/e2e/jury-pitch.spec.ts` (test, request-response)

**Analog:** `tests/smoke/r3-no-hardcoded-block.spec.ts` (lines 38-48)

**Demo-mode behavior of `/jury`** (`app/jury/page.tsx` lines 25-59):
`getCurrentUser()` is called first (line 30) — this redirects to `/login` in demo mode when no session exists. In demo-mode E2E, `/jury` will redirect to `/login` (302) or show a disabled view. Test: non-5xx response.

**Important — `/jury` is role-gated** (lines 31-36):
```typescript
// app/jury/page.tsx lines 31-36
const user = await getCurrentUser();
if (!user) redirect("/login");
const role = await getCurrentRole();
if (role && role !== "mentor" && role !== "game_master") {
  redirect(pathForRole(role));
}
```
In demo mode without auth, this redirects to `/login`. E2E test assertion: `status < 500` (allow 302).

---

### `tests/e2e/gm-export.spec.ts` (test, request-response)

**Analog:** `app/admin/export/players.csv/route.ts` (the actual route) + `tests/smoke/r3-no-hardcoded-block.spec.ts` pattern

**Demo-mode behavior** (`app/admin/export/players.csv/route.ts` lines 26-35):
```typescript
// app/admin/export/players.csv/route.ts lines 26-35
export async function GET() {
  // Demo mode (no Supabase env): bypass role gate and emit a valid header-only CSV
  if (hasSupabaseEnv()) {
    const role = await getCurrentRole();
    if (role !== "game_master") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }
  const rows = await getPlayersExportRows();
  // rows = [] in demo mode → header-only CSV
```
This is the best E2E flow for demo mode: `/admin/export/players.csv` returns 200 + CSV header in demo mode without auth. This is a reliable testable assertion.

**Pattern:**
```typescript
test.describe("GM Export — demo mode", () => {
  test("/admin/export/players.csv returns 200 CSV in demo mode", async ({ page }) => {
    const response = await page.goto("/admin/export/players.csv");
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain("team_slug");  // CSV header
  });
});
```

---

### `.github/workflows/ci.yml` (config)

**No existing analog** — `.github/` directory does not exist yet in the repo.

**Derive from `package.json` scripts** (lines 6-13):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "smoke": "playwright test"
}
```

**Critical constraints for CI yml:**

1. **Windows dev, Linux CI:** Dev machine is Windows 11. GitHub Actions runs Ubuntu. `npm run build` must work on Linux — it does (Next.js is cross-platform). Playwright must install browsers on Linux CI: `npx playwright install --with-deps chromium`.

2. **`"type": "commonjs"` + ESM configs:** `eslint.config.mjs` and `playwright.config.ts` both use ESM exports (`export default`). This works because:
   - `.mjs` files are always ESM regardless of `package.json "type"`
   - `.ts` files are compiled by their respective loaders (Playwright uses its own ts-node variant)
   - A new `vitest.config.ts` also works (Vitest compiles it internally)
   - Do NOT create `.cjs` variants — use `.ts` or `.mjs` for configs

3. **Demo mode for E2E in CI:** The existing `playwright.config.ts` already handles this: `env: { NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }` and `reuseExistingServer: !process.env.CI`. On CI, `reuseExistingServer` is `false`, so Playwright boots a fresh dev server.

4. **No Supabase env needed in CI:** Unit tests and E2E tests both run in demo mode. No `SUPABASE_URL` secret needed in CI for QUAL-01/QUAL-02.

**CI yml structure pattern:**
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: ["**"]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ""
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ""

  unit:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run test:unit   # vitest run

  e2e:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e    # playwright test --project=chromium
        env:
          CI: "true"
          NEXT_PUBLIC_SUPABASE_URL: ""
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ""
```

---

### `13-NEW.sql` (migration, CRUD — OPS-01 consolidation + DIGI-08)

**Analog 1 — PROD-only function pattern:** `.planning/quick/260523-kc2-advisors-fix/D1.sql` (lines 1-9)
```sql
-- D1.sql — pattern for ALTER FUNCTION to fix search_path
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.guard_player_onboarding() SET search_path = '';
ALTER FUNCTION public.set_help_requests_updated_at() SET search_path = '';
ALTER FUNCTION public.set_pitch_mode_closed_at() SET search_path = '';
```

**Analog 2 — CREATE OR REPLACE FUNCTION pattern:** `database/triggers.sql` lines 8-16
```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  new.updated_at = now();
  return new;
end;
$$;
```

**Analog 3 — SECURITY DEFINER + set search_path = public pattern:** `database/triggers.sql` lines 57-84
```sql
create or replace function public.recalc_player_score(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
...
$$;
```

**Analog 4 — idempotent backfill pattern:** `database/migrations/202605110007_phase14_engagement_trigger.sql` lines 149-157
```sql
do $$
declare
  rec record;
begin
  for rec in select id from public.players loop
    perform public.recalc_player_engagement(rec.id);
  end loop;
end;
$$;
```

**Analog 5 — pitch_scores UPSERT backfill pattern:** `.planning/quick/260515-gu4-publish-results-hybrid-pitch-proxy-pilot/backfill.sql` lines 21-96
```sql
INSERT INTO pitch_scores (event_id, player_id, juror_id, c1, c2, c3, c4, c5, total_score)
VALUES (...)
ON CONFLICT (event_id, player_id, juror_id) DO UPDATE
SET c1 = EXCLUDED.c1, ..., updated_at = now();
```

**Analog 6 — grants pattern:** `.planning/quick/260523-kc2-advisors-fix/D2.sql` and `D3.sql` (multiple REVOKE/GRANT blocks for secdef functions)

**Structure for 13-NEW.sql:**
```sql
-- Phase 13 OPS-01/OPS-02 consolidation SQL
-- Apply via MCP execute_sql or Omar manual apply.
-- Idempotent: uses CREATE OR REPLACE and ON CONFLICT DO UPDATE.

-- ===== PART 1: Source PROD-only trigger functions into triggers.sql canonical =====
-- (CREATE OR REPLACE so safe to re-run)

create or replace function public.set_help_requests_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.set_pitch_mode_closed_at()
returns trigger language plpgsql set search_path = ''
as $$ begin ... end; $$;

-- ===== PART 2: Grants drift reconciliation =====
-- REVOKE FROM PUBLIC + GRANT TO authenticated (11 secdef functions)

-- ===== PART 3: DIGI-08 pitch_scores verdict backfill =====
-- Idempotent UPSERT, same pattern as backfill.sql

BEGIN;
INSERT INTO pitch_scores (...) VALUES (...)
ON CONFLICT (...) DO UPDATE SET ... , updated_at = now();
COMMIT;
```

**Key known drifts to consolidate** (from `database/triggers.sql` lines 169-178 comment):
- `public.set_help_requests_updated_at()` — exists PROD only, missing from `triggers.sql`
- `public.set_pitch_mode_closed_at()` — exists PROD only, missing from `triggers.sql`
- `SET search_path = ''` applied only on PROD for all 4 simple trigger functions
- Grants: 11 security-definer functions had `REVOKE EXECUTE FROM PUBLIC` + `GRANT EXECUTE TO authenticated` applied via D2/D3 but may not be in canonical sql files

---

### `database/triggers.sql` (patch, event-driven)

**Analog:** Existing `database/triggers.sql` lines 169-178 — the comment block already documents the gap.

**Write-deny workaround** (from memory `feedback_database_deny_workaround`):
`database/**` is Write/Edit-deny in settings.local.json. The canonical approach is:
1. Write new SQL in `13-NEW.sql` (in phase dir)
2. Apply to PROD via MCP `execute_sql`
3. Ask Omar to manually apply the same SQL to `database/triggers.sql` source files, OR use the workaround of writing to a temp file and having the executor paste it

The PATTERNS.md content for `database/triggers.sql` changes is: place all CREATE OR REPLACE statements in `13-NEW.sql`. The actual `database/triggers.sql` edit is deferred to Omar manual apply.

---

## Shared Patterns

### Demo-Mode Guard (applies to all E2E tests and unit tests)
**Source:** `lib/supabase-status.ts` line 1-3 + `utils/supabase/server.ts` line 5-6
```typescript
// lib/supabase-status.ts
export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// utils/supabase/server.ts line 6
if (!hasSupabaseEnv()) return null;
```
**Apply to:** All tests. Set `NEXT_PUBLIC_SUPABASE_URL=""` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=""` in test env to force demo mode. Playwright already does this via webServer `env:` block. Vitest unit tests must not set these env vars (leave unset = falsy).

### WorkflowState Return Shape (applies to all unit tests of server actions)
**Source:** `app/actions.ts` lines 26-36
```typescript
export type WorkflowState = {
  ok: boolean;
  message: string;
  severity?: "ok" | "warn" | "error";
  mailto?: string;
};
```
**Apply to:** All unit tests. Assert `result.ok === false` + `result.message` contains expected substring. Never assert exact French strings (they may change) — assert structural properties.

### Zod safeParse Pattern (applies to all schema unit tests)
**Source:** `app/actions.ts` lines 44-49
```typescript
const parsed = credentialsSchema.safeParse({
  email: formData.get("email"),
  password: formData.get("password"),
});
if (!parsed.success) {
  return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input" };
}
```
**Apply to:** Unit tests should call `schema.safeParse(...)` directly and assert `result.success === false` / `result.error.issues[0]?.message`. Do not go through `FormData` in unit tests — pass plain objects.

### SQL search_path Convention (applies to all SQL in 13-NEW.sql)
**Source:** `database/triggers.sql` lines 11 and 103
- Simple utility functions (no cross-table joins, no security needs): `set search_path = ''`
- SECURITY DEFINER functions that query `public.*` tables: `set search_path = public`
- The D1.sql fix applied `set search_path = ''` to the 4 simple trigger functions (correct pattern)

### Playwright webServer Demo Mode (applies to all E2E specs)
**Source:** `playwright.config.ts` lines 29-43
```typescript
webServer: {
  command: `npm run dev -- -p ${PORT}`,
  url: BASE_URL,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  },
},
```
**Apply to:** The E2E tests in `tests/e2e/` reuse this same `playwright.config.ts`. Add `testDir` to include both `tests/smoke/` and `tests/e2e/` — or create a second config file `playwright.e2e.config.ts` for the new flows.

### Playwright Test File Header Convention (applies to all E2E specs)
**Source:** `tests/smoke/r1-no-score.spec.ts` lines 1-11
```typescript
// R1 — Score is NOT visible on Player-facing surfaces.
// CLAUDE.md cardinal: [rule summary]
// Demo-mode note: [what demo mode does on this page]
import { test, expect } from "@playwright/test";
```
**Apply to:** All new E2E spec files. Start with a comment block documenting: (1) what flow is tested, (2) what the demo-mode fallback behavior is, (3) which cardinal rules (R1/R2/R3) are relevant.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.github/workflows/ci.yml` | config | — | No CI infrastructure exists yet; derived from package.json scripts and GitHub Actions conventions |

---

## Key Pitfalls

### Pitfall 1 — `"type": "commonjs"` vs ESM config files
`package.json` declares `"type": "commonjs"`. Config files using `export default` must use `.mjs` extension or `.ts` extension (compiled by the tool's own bundler). Never use `.js` extension for Vitest/Playwright configs — would be interpreted as CommonJS and `export default` would fail. The existing `playwright.config.ts` uses `.ts` (works because Playwright has its own ts loader). Use `vitest.config.ts` (`.ts`) — Vitest also has its own bundler.

### Pitfall 2 — `"module": "esnext"` + `"moduleResolution": "bundler"` in tsconfig
These settings are for Next.js's bundler (webpack/turbopack), not for Node.js execution. Vitest runs in Node. The `@/*` path alias is NOT automatically resolved in Vitest — must configure `resolve.alias` in `vitest.config.ts`. Missing this causes `Cannot find module '@/lib/types'` errors in unit tests.

### Pitfall 3 — Next.js runtime-only imports in `app/actions.ts`
`app/actions.ts` imports `redirect` from `"next/navigation"` and `revalidatePath` from `"next/cache"`. These modules do not exist outside Next.js runtime. Unit tests must NOT import and call `submitDeliverable` or `evaluateSubmission` directly — only test the extracted Zod schemas. Plan A: extract schemas to `lib/schemas.ts`. Plan B: mock `next/navigation` and `next/cache` in Vitest setup.

### Pitfall 4 — `"use server"` directive
`app/actions.ts` starts with `"use server"`. Importing this module in a Vitest test environment will either fail (if Next.js server action runtime isn't available) or behave unexpectedly. Schema extraction to `lib/schemas.ts` eliminates this problem entirely.

### Pitfall 5 — Windows line endings in SQL files
Dev is Windows 11. SQL files committed from Windows may have CRLF. `13-NEW.sql` should be written with LF endings (or CRLF is fine for Supabase MCP execution — Postgres ignores whitespace). Not a blocking issue.

### Pitfall 6 — Playwright E2E in CI needs `next build` or `next dev`
The existing `playwright.config.ts` uses `npm run dev` (development server). In CI, `next dev` compiles on demand — slower but correct. An alternative is `next build && next start` for production-like E2E. The existing config uses `next dev` with `reuseExistingServer: !process.env.CI`, which is fine for CI correctness (boots fresh server each run).

### Pitfall 7 — DIGI-08 pitch_scores backfill verdict
The CONTEXT.md states: "clarifier si le publish pré-event du 15/05 (proxy) suffit ou si re-backfill des pitch_scores live Digi est requis — vérifier l'état PROD via MCP". The backfill.sql pattern (AgreenTech, 44 rows UPSERT) is the confirmed approach for idempotent PROD backfill. DIGI-08 backfill SQL goes into `13-NEW.sql` PART 3 only AFTER MCP `execute_sql` verification of current PROD state.

---

## Metadata

**Analog search scope:** `tests/`, `app/`, `lib/`, `database/`, `.planning/quick/`, config files
**Files scanned:** 25 source files + 8 SQL migration files
**Pattern extraction date:** 2026-06-11
