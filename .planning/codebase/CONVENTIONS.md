# Coding Conventions

**Analysis Date:** 2026-05-08

## Naming Patterns

**Files:**
- React components: kebab-case `.tsx` (e.g., `app-shell.tsx`, `proof-workflow.tsx`, `project-card.tsx`, `onboarding-kyc-form.tsx`, `page-header.tsx`)
- Library / utility modules: kebab-case `.ts` (e.g., `lib/workflow-data.ts`, `lib/supabase-status.ts`)
- Single-word libs: lowercase (e.g., `lib/data.ts`, `lib/i18n.ts`, `lib/csv.ts`)
- App Router files: Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`, `middleware.ts`)
- SQL: snake_case (`database/schema.sql`, `database/triggers.sql`, `database/rls.sql`, `database/seed_bootcamp.sql`)
- Path alias: `@/*` resolves to repo root (see `tsconfig.json:17-19`)

**Components:**
- PascalCase exported function components (e.g., `AppShell`, `ProofWorkflow`, `ProjectCard`)
- Named exports preferred over default exports (see `components/app-shell.tsx:7`, `components/proof-workflow.tsx:17`)

**Functions:**
- camelCase (e.g., `submitDeliverable`, `submitDeliverableFlow`, `claimBonusEventFlow`, `calculateBonusClaim`, `formValue`, `mailtoUrl`, `deliverableMailBody`, `getLocale`, `hasSupabaseEnv`)
- Server actions ending in `Flow` return `WorkflowState` (e.g., `submitDeliverableFlow`); legacy void-return variants drop the suffix (e.g., `submitDeliverable`)

**Variables:**
- camelCase for locals and module constants (e.g., `bonusRules`, `journeyPhases`, `navItems`, `dictionaries`)
- Schemas use `<noun>Schema` suffix (e.g., `deliverableSchema`, `bonusSchema`, `kycSchema`, `questSchema`)

**Types:**
- PascalCase exported types and enums (e.g., `Stage`, `Checkpoint`, `MaturityPhase`, `DeliverableStatus`, `BonusType`, `AppRole`, `TeamRole`, `Locale`, `WorkflowState`)
- Type-only imports use `type` keyword: `import { type AppRole } from "@/lib/data"` (see `components/app-shell.tsx:5`)
- String-literal unions preferred over `enum` keyword

**Database columns:**
- snake_case (`project_id`, `doc_url`, `submitted_at`, `pending_xp`, `base_xp`) — distinct from camelCase TypeScript field names; server actions explicitly map between them in `app/actions.ts:96-108`

## Code Style

**Formatting:**
- No Prettier config detected; relies on editor defaults
- 2-space indentation
- Double quotes for strings throughout (`"use server"`, `"use client"`)
- Trailing commas in multi-line literals
- Semicolons present

**Linting:**
- ESLint flat config: `eslint.config.mjs`
- Extends `typescript-eslint` recommended + `@next/next` recommended + `core-web-vitals`
- Ignores: `.next/**`, `node_modules/**`, `next-env.d.ts`
- Run via `npm run lint`

**TypeScript:**
- `strict: true` enabled (`tsconfig.json:7`)
- Target ES2017, module esnext, moduleResolution bundler
- `isolatedModules: true`, `noEmit: true`
- Run via `npm run typecheck`

## Import Organization

**Order observed in `app/actions.ts:1-7` and `components/proof-workflow.tsx:1-13`:**
1. React / Next.js built-ins (`next/cache`, `next/navigation`, `next/link`, `react`)
2. Third-party packages (`zod`, `lucide-react`, `@supabase/ssr`)
3. Internal aliased imports (`@/lib/...`, `@/utils/...`, `@/app/actions`)

**Path Aliases:**
- `@/*` → repo root (configured in `tsconfig.json:17-19`)
- All cross-directory imports use `@/` (never relative `../../`)

**Client/Server boundary:**
- `"use server"` directive at top of `app/actions.ts:1` (single server-actions module)
- `"use client"` directive at top of components needing hooks/state (e.g., `components/app-shell.tsx:1`, `components/proof-workflow.tsx:1`)

## Internationalization

**Source of truth:** `lib/i18n.ts`

**Pattern:**
- Two locales: `fr` (default) and `en` — see `lib/i18n.ts:1`
- Centralized `dictionaries` object keyed by locale, then by string key (`lib/i18n.ts:3-38`)
- Helper: `getLocale(value)` resolves to `"fr" | "en"`; `t(locale)` returns the dictionary
- French is the primary product language; UI copy in components is currently a mix of English placeholders and French content (e.g., `Preuve a valider` in `app/actions.ts:160`, `components/proof-workflow.tsx:43`)
- **Convention:** Add new copy keys to `lib/i18n.ts` rather than inlining French (or English) strings. Components that don't yet use `t()` should still gravitate toward it for new strings.
- Avoid accented characters in code-resident strings (current files use plain ASCII e.g., `XP confirme`, `Preuve a valider`); UMTF/diacritic safety appears intentional for mailto/CSV payloads.

## Validation Pattern

**Library:** Zod (`zod ^4.4.3`)

**Server-action input contract — every action follows this shape (see `app/actions.ts:74-178`):**
1. Define a module-scope `<name>Schema = z.object({...})` next to the action
2. Read `FormData` values via the `formValue(formData, key)` helper (`app/actions.ts:70-72`) — never destructure `formData` directly
3. Call `schema.safeParse({...})` — never `.parse()` (no exceptions thrown out of server actions)
4. On failure: return `{ ok: false, message: parsed.error.issues[0]?.message ?? "Invalid ..." }`
5. On success: branch on `await createClient()` (Supabase mode) vs. fallback (demo mode)
6. After persistence, call `revalidatePath(...)` for every affected route
7. Return `WorkflowState`

**Shared `httpsUrl` schema (`app/actions.ts:15`):**
```ts
const httpsUrl = z.string().url().refine(
  (value) => value.startsWith("https://"),
  "Only https:// links are accepted.",
);
```
Use this for any user-supplied URL (deliverable proofs, bonus proofs, KYC logo URL). Never accept `http://` links — proof workflow assumes externally hosted documents.

**Numeric coercion:**
- Use `z.coerce.number()` for `FormData`-sourced numbers (`baseXp`, `quantity`, `xp`) — `FormData` is always strings.
- Bound numeric inputs (`.min().max()`) to prevent abuse (e.g., `baseXp` 25–150, `quantity` 1–500).

**Enum validation:**
- Mirror domain enums from `lib/data.ts` literally in `z.enum([...])` lists (e.g., `Checkpoint`, `Stage`, `BonusType`). Keep them in sync with `lib/data.ts`.

## Server Action Return Shape

**Every interactive server action returns `WorkflowState` (`app/actions.ts:9-13`):**
```ts
export type WorkflowState = {
  ok: boolean;
  message: string;
  mailto?: string;
};
```

**Conventions:**
- Action signature: `(_prevState: WorkflowState, formData: FormData): Promise<WorkflowState>` — designed for `useActionState` (`components/proof-workflow.tsx:18-22`)
- Initial state on the client: `const initialState: WorkflowState = { ok: false, message: "" };` (`components/proof-workflow.tsx:15`)
- When success requires opening an email draft, populate `mailto`; the client redirects via `window.location.href = state.mailto` inside a `useEffect` watching the action state (`components/proof-workflow.tsx:25-37`)
- `mailto` strings are built with `encodeURIComponent` for subject + body (`app/actions.ts:160-173`); prefer the shared `mailtoUrl` / `deliverableMailBody` helpers from `lib/data.ts` when available
- **Never throw** out of a server action — failures are returned as `{ ok: false, message }`
- Legacy void-return actions (e.g., `submitDeliverable` at `app/actions.ts:74`) exist for non-interactive callers; new code should always use the `<name>Flow` variants returning `WorkflowState`

## Dual-Mode Persistence

Every server action that writes data must handle both modes:
1. Call `await createClient()` from `@/utils/supabase/server`
2. If client is non-null: persist via Supabase, return `{ ok: false, message: error.message }` on `error`
3. If client is null (no env vars): skip persistence silently — demo mode reads from `lib/data.ts` seed
4. Always run `revalidatePath` regardless of mode

See `app/actions.ts:90-115` for the canonical pattern. The mode flag is `hasSupabaseEnv()` from `lib/supabase-status.ts`.

## Error Handling

**Server actions:**
- `safeParse` + early `{ ok: false, ... }` return — no thrown errors
- Supabase errors surfaced via `error.message`
- Generic fallback message strings should be short, action-oriented (e.g., `"Saved. Opening the email draft now."`)

**Client components:**
- React 19 `useActionState` for form lifecycles
- `useEffect` to react to state transitions (e.g., redirect on `state.ok && state.mailto`)
- No try/catch in components observed

## Logging

**Framework:** None — no logger dependency. The repo uses raw `console.*` sparingly (mostly absent from app code).

**Patterns:**
- Server actions silently swallow errors when in void-return form (early `return;`) — acceptable for fire-and-forget actions, but `Flow` variants return errors via `WorkflowState.message`.
- Avoid `console.log` in committed code; if debugging is required during dev, remove before commit (no lint rule enforces this currently).

## Comments

**When to Comment:**
- Code is largely self-documenting; explanatory comments are rare
- No JSDoc/TSDoc blocks observed on exports
- No license headers
- No `TODO`/`FIXME` style markers used as a system

**Recommended:** Document non-obvious domain rules (XP calculation, bonus capping) inline when adding to `lib/data.ts`.

## Function Design

**Size:** Small to medium. Server actions in `app/actions.ts` average 30–60 lines; helpers (`formValue`, `getLocale`) are 1–3 lines.

**Parameters:**
- Server actions: `(_prevState: WorkflowState, formData: FormData)` for action-state form callbacks; `(formData: FormData)` for direct invocations
- Pure helpers prefer single object parameter when 3+ fields (e.g., `mailtoUrl({ to, subject, body })`, `deliverableMailBody({ startup, title, ... })` — see `components/proof-workflow.tsx:42-51`)

**Return Values:**
- Server actions: always `Promise<WorkflowState>` (or `Promise<void>` for legacy)
- Pure helpers: return concrete values, not unions with `undefined` when avoidable

## Module Design

**Exports:**
- Named exports throughout — no `export default` in lib or component files
- Types exported alongside implementation (`export type WorkflowState`, `export type Locale`)
- Co-located: schemas live next to the actions that use them in `app/actions.ts`

**Single-purpose modules in `lib/`:**
- `lib/data.ts` — domain types, enums, seed data, helpers (`mailtoUrl`, `deliverableMailBody`, `calculateBonusClaim`)
- `lib/workflow-data.ts` — workflow constants
- `lib/i18n.ts` — copy strings
- `lib/csv.ts` — CSV serialization for export route handlers
- `lib/supabase-status.ts` — `hasSupabaseEnv()` mode flag

**No barrel files (`index.ts`)** — import directly from the source module.

## UI / Styling Conventions

**Tailwind:** Configured via `app/globals.css` (no `tailwind.config.*` in repo root — using v4-style CSS-first config)

**Class composition:**
- `clsx ^2.1.1` for conditional classes
- Inline `style={...}` used sparingly for one-off values (e.g., `app-shell.tsx:43`, `proof-workflow.tsx:56`)

**Icons:** `lucide-react` — destructure named imports (e.g., `import { Award, Send, Sparkles } from "lucide-react"` at `components/proof-workflow.tsx:4`)

**Accessibility:**
- `aria-label`, `aria-current`, `aria-hidden` consistently applied (see `components/app-shell.tsx:29-45`)
- Forms use semantic `<label>` wrapping inputs (`components/proof-workflow.tsx:73-80`)

---

*Convention analysis: 2026-05-08*
