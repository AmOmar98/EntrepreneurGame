# Playwright Smoke Harness

Lightweight E2E smoke test harness introduced by quick `260517-psd` to lock
the 3 EIC cardinal rules (R1 / R2 / R3 — see `CLAUDE.md`) against regression
on every merge.

## Scope

- **Demo mode only** (no Supabase env). Specs run against the seed fallback
  rendered by `lib/seed/`. This is intentional: smoking against real Supabase
  pollutes prod and `/results` is gated to a demo banner anyway.
- 1 chromium project, 3 specs, ~30s total runtime locally.

## Local usage

```bash
# Install browsers (one-off after npm install)
npx playwright install chromium

# Run the smoke
npm run smoke
```

The Playwright `webServer` config will:

1. Boot `npm run dev -- -p 3001` automatically in the background.
2. Wait for `http://localhost:3001` to respond.
3. Run all 3 specs sequentially (workers: 1, fullyParallel: false).
4. Tear the dev server down.

If you already have a dev server on 3001, Playwright will reuse it (CI mode
forces a fresh boot via `reuseExistingServer: false`).

## Specs

| Spec | Cardinal | Asserts |
|---|---|---|
| `r1-no-score.spec.ts` | R1 | No score / rank / percentile / leaderboard text on `/journey` or `/results` |
| `r2-warn-only.spec.ts` | R2 | No `severity=error` blocking alert on `/journey` or `/onboarding` at load; no uncaught console errors |
| `r3-no-hardcoded-block.spec.ts` | R3 | No `<a disabled>`; any `<button disabled>` must sit inside `.eic-locked-hint--amber`; key routes don't 5xx |

## CI hook (future)

Suggested GitHub Actions stub (not yet wired):

```yaml
- run: npm ci
- run: npx playwright install --with-deps chromium
- run: npm run smoke
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

CI integration is intentionally deferred until the deferred A3 (Supabase test
project) is provisioned — running the smoke in CI without it would silently
exercise demo mode only, which is what local runs already cover.

## Out of scope

- Unit tests (no Jest/Vitest).
- Dual-mode (demo + Supabase) — Omar override 2026-05-17: demo-only single pass.
- Visual regression / Lighthouse — separate phase.
