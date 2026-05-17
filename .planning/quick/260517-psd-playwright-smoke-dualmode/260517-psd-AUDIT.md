# Quick 260517-psd — AUDIT

## What was built

- Installed `@playwright/test ^1.60.0` as devDependency + `chromium` browser.
- `playwright.config.ts` at repo root: 1 chromium project, `baseURL=http://localhost:3001`, `webServer` auto-boots `npm run dev -- -p 3001` with `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` forced to `""` to guarantee `hasSupabaseEnv() === false` (demo seed fallback).
- 3 spec files in `tests/smoke/`:
  - `r1-no-score.spec.ts` — 2 tests on `/journey` + `/results`, regex set on score / rank / percentile / leaderboard.
  - `r2-warn-only.spec.ts` — 2 tests on `/onboarding` + `/journey`, asserts no `severity=error` blocking alert at load and no uncaught console errors.
  - `r3-no-hardcoded-block.spec.ts` — 2 tests: no `<a disabled>`, any `<button disabled>` must sit inside `.eic-locked-hint--amber`; key Player routes don't 5xx.
- `npm run smoke` script added to `package.json`.
- `docs/SMOKE.md` how-to + CI hook stub.
- `.gitignore` extended with `playwright-report/`, `test-results/`, `playwright/.cache/`.

## Decisions

1. **Demo-mode only (override Omar 2026-05-17)**. PLAN originally targeted dual-mode; we ship single-pass against seed fallback. CI Supabase project provisioning (deferred A3) is a prerequisite for dual-mode.
2. **No custom boot script** — Playwright's built-in `webServer` config handles boot/teardown atomically; the scripts/smoke-boot proposal in PLAN was redundant.
3. **`main.first()`** locator in R2/R3 — the app renders 2 `<main>` elements (AppShell wrapper + page main); `.first()` is the deterministic root.
4. **R1 assertions are textual+structural** — regex over body innerText catches `\d+/100`, `\d+/140`, percentile, classement, leaderboard, rank patterns. Plus `data-score`/`data-rank`/`data-percentile` attr count == 0.
5. **R2 console scan** ignores benign hydration warnings; gates only on `uncaught | hydration failed | Cannot read prop` patterns.
6. **Empty-state acceptable** for R1 — demo mode without a seed player renders the empty journey, which still passes the no-score contract.

## Verification

```
npm run lint        # clean
npm run typecheck   # clean
npm run smoke       # 6 passed (29.6s)
```

Smoke output:
- R1 /journey index hides score/rank — PASS
- R1 /results no rank in demo banner — PASS
- R2 /onboarding no error severity at load — PASS
- R2 /journey no blocking error severity at load — PASS
- R3 /journey no disabled anchors / disabled buttons constrained to amber — PASS
- R3 known Player routes don't 5xx — PASS

## Deviation vs PLAN

| PLAN task | Status |
|---|---|
| 1 — install Playwright + chromium | DONE |
| 2 — playwright.config.ts | DONE |
| 3 — scripts/smoke-boot.{ps1,sh} | SKIPPED (webServer config replaces it) |
| 4 — R1 spec | DONE |
| 5 — R2 spec | DONE |
| 6 — R3 spec | DONE |
| 7 — `npm run smoke:dualmode` script | REPLACED by `npm run smoke` (single-pass per Omar override) |
| 8 — docs/SMOKE.md | DONE |
| 9 — atomic commit + push | DONE (see SUMMARY) |

## R1 / R2 / R3 advisor verdict

The harness itself introduces no Player-facing UI surface; advisor spawn not required (PLAN says "zone test, pas advisor"). The specs **enforce** the cardinals — that's the whole point.
