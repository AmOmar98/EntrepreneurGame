# Deferred Items — quick 260510-jm8

Out-of-scope discoveries that were NOT fixed in this task per scope boundary
(only auto-fix issues directly caused by current task changes).

## Pre-existing ESLint blocker on `npm run build`

**Discovered during:** Task 2 verification (`npm run build`)

**Files (pre-existing, not modified by jm8):**
- `components/field-completion-counter.tsx:101` — `Definition for rule 'react-hooks/exhaustive-deps' was not found`
- `hooks/use-auto-save.ts:68` — same
- `hooks/use-auto-save.ts:107` — same

**Last commit touching them:** `cf28807` (quick 260510-iee, T3-A4 + T3-A1).

**Root cause:** The flat ESLint config (`eslint.config.mjs`) does not register the
`react-hooks/exhaustive-deps` rule, but the source files use
`// eslint-disable-next-line react-hooks/exhaustive-deps` directives. ESLint then
errors on the unknown disable directive.

**Impact:** `npm run lint` and `npm run build --no-lint` are blocked. TypeScript
compilation itself succeeds (`npm run typecheck` passes; the Next.js bundler
also succeeds — only the ESLint pass after compile fails).

**Why deferred:** Out-of-scope per `deviation_rules` SCOPE BOUNDARY. Files NOT in
`260510-jm8-PLAN.md` `files_modified`. The fix is one-line — either install
`eslint-plugin-react-hooks` or remove the now-unused disable comments — but it
belongs to a separate quick task focused on lint config.

**Recommended next quick task:** `quick: fix react-hooks/exhaustive-deps lint
rule definition (eslint config or remove disable directives)`.

## My modified files: clean

`npx eslint components/pixel-mascot.tsx components/pixel-mascot-player.tsx
components/submission-form.tsx components/journey-client.tsx
hooks/use-pixel-trigger.ts lib/i18n.ts` → 0 errors, 0 warnings.

`npm run typecheck` → passes clean.
