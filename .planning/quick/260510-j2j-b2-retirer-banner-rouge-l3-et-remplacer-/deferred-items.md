# Deferred Items — 260510-j2j

Out-of-scope issues discovered during execution but NOT caused by this plan's changes.

## Pre-existing lint errors (unrelated to journey tooltip work)

ESLint reports rule `react-hooks/exhaustive-deps` is undefined. Plugin missing/misconfigured.

- `components/field-completion-counter.tsx:101` — Definition for rule 'react-hooks/exhaustive-deps' was not found
- `hooks/use-auto-save.ts:68` — Definition for rule 'react-hooks/exhaustive-deps' was not found
- `hooks/use-auto-save.ts:107` — Definition for rule 'react-hooks/exhaustive-deps' was not found

Verified pre-existing via `git stash` + `npm run lint` on `main` HEAD `f40b5f2` (prior to any j2j changes). Most likely introduced by quick task `260510-iee` (T3 quick wins A1 auto-save) which added the hook + counter — the eslint-disable comments reference a plugin not installed in `eslint.config.mjs`.

Recommendation: separate quick task to either install `eslint-plugin-react-hooks` (already a transitive dep of `eslint-config-next`) and register it in flat config, or remove the `eslint-disable` comments and let lint pass. Out of scope here — purely visual surface change for B2.

## Resolution
Track only — no fix attempted in 260510-j2j.
