# Deferred items — Quick 260510-k1f

Items found out-of-scope during execution. Documented per GSD SCOPE BOUNDARY rule.

## Pre-existing ESLint errors (not caused by this task)

3 errors of rule `react-hooks/exhaustive-deps` (rule definition not found) in:
- `components/field-completion-counter.tsx:101:3`
- `hooks/use-auto-save.ts:68:3`
- `hooks/use-auto-save.ts:107:3`

**Root cause**: rule `react-hooks/exhaustive-deps` referenced in inline `eslint-disable-next-line` directives, but the `eslint-plugin-react-hooks` plugin is not installed/registered in `eslint.config.mjs`.

**First introduced in**: commit `cf28807` (quick task 260510-iee — A1 auto-save + A4 compteur Y/N) on 2026-05-10.

**Why deferred**: untouched by quick task 260510-k1f (B1 Cohort Pulse). Files in this list are not modified by the current task. Fix is owned by the originating task or a follow-up quick task.

**Suggested fix** (for a future quick task): add `eslint-plugin-react-hooks` to devDependencies + register `"react-hooks": reactHooksPlugin` in `eslint.config.mjs` plugins block, or replace the inline disable directives with a no-op comment.
