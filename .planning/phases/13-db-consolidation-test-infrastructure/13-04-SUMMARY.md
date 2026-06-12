---
phase: 13-db-consolidation-test-infrastructure
plan: "04"
status: complete
requirements: [QUAL-03]
commits:
  - d59f3ea: "ci(13-04): add GitHub Actions CI workflow (typecheck/lint/build/unit/e2e, demo mode)"
completed: 2026-06-11
note: "SUMMARY rédigé par l'orchestrateur — l'agent exécuteur a été interrompu par un restart de session entre son commit et l'écriture du SUMMARY (close-out manuel via safe_resume_gate)."
---

# Plan 13-04 — CI GitHub Actions : COMPLETE

## Ce qui a été livré

`.github/workflows/ci.yml` — gate CI sur chaque push et pull request, 100 % en mode démo (`NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` vides → `hasSupabaseEnv() === false`, zéro secret requis) :

| Job | Steps | Dépend de |
|---|---|---|
| `check` | npm ci → typecheck → lint → build (env demo) | — |
| `unit` | npm ci → `npm run test:unit` (Vitest, 14 tests) | check |
| `e2e` | npm ci → `npx playwright install --with-deps chromium` → `npm run test:e2e` (15 tests, CI=true, env demo) | check |

## Vérification

- YAML valide (workflow committé `d59f3ea`).
- Référence les scripts exacts de package.json créés par 13-02 (`test:unit`) et 13-03 (`test:e2e`).
- Node 20, cache npm, ubuntu-latest — conforme aux contraintes du plan.
- Première exécution réelle du workflow : au prochain push de la branche `milestone/v0.4-scale-foundation` vers origin.

## Déviations

- Close-out manuel du SUMMARY par l'orchestrateur (restart session) — aucun écart de contenu vs plan.
