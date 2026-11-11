---
phase: 13
plan: 02
subsystem: test-infrastructure
tags: [vitest, unit-tests, schema-extraction, zod, quality]
dependency_graph:
  requires: []
  provides: [QUAL-01]
  affects: [app/actions.ts, lib/schemas.ts]
tech_stack:
  added: [vitest@4.1.8]
  patterns: [schema-extraction, tdd-red-green]
key_files:
  created:
    - vitest.config.ts
    - lib/schemas.ts
    - tests/unit/actions-schemas.test.ts
    - tests/unit/score.test.ts
  modified:
    - package.json
    - app/actions.ts
decisions:
  - Used Zod v4-compatible nil UUID (all-zeros) in tests — Zod v4 tightened uuid regex and rejects non-standard UUIDs like 00000000-0000-0000-0000-000000000001
  - Plain vitest.config.ts (not .mts) — avoids ESM extension conflict with package.json "type":"commonjs"
  - lib/schemas.ts imports ONLY from "zod" — no Next.js coupling, safely testable in Vitest/Node
metrics:
  duration: 15min
  completed: 2026-06-11
  tasks_completed: 2
  files_changed: 7
---

# Phase 13 Plan 02: Vitest + Schema Extraction Summary

**One-liner:** Vitest installed with Node environment and @/* alias; 5 Zod schemas extracted from app/actions.ts to pure lib/schemas.ts; 14 unit tests pass (schemas + pure scoring logic).

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Install Vitest, create vitest.config.ts, extract schemas to lib/schemas.ts | eda4f6d |
| 2 | Write unit tests for schemas and pure scoring logic (TDD RED→GREEN) | 8ff34fd |

## What Was Built

### vitest.config.ts
- `environment: "node"` (pure Node, no jsdom)
- `include: ["tests/unit/**/*.test.ts"]`
- `resolve.alias` mapping `"@"` to repo root — required because tsconfig `moduleResolution: bundler` is not used by Vitest's Node runner

### lib/schemas.ts
Pure module exporting 5 schemas extracted from app/actions.ts:
- `httpsUrl` — URL must start with `https://`
- `onboardingSchema` — KYC form (teamName, idea, q1–q5)
- `fichesEntretienSchema` — 10-URL HTTPS array for fiches-entretien-v1
- `submissionSchema` — deliverableTemplateId + kind + conditional proof validation (superRefine preserved exactly)
- `evaluationSchema` — submissionId + feedback + verdict + scores (0–25 per criterion) + request_v2 expectedAction rule (superRefine preserved exactly)

### app/actions.ts
- Imports all 5 schemas from `@/lib/schemas`
- Local schema definitions removed (behavior identical — same Zod messages, same superRefine logic)
- `import { z } from "zod"` retained (still used by credentialsSchema, addCommentSchema, importSchema, pitchScoreSchema)

### tests/unit/actions-schemas.test.ts (7 tests)
1. submissionSchema rejects http:// URLs for proof_url kind
2. submissionSchema accepts https:// URL for proof_url kind with valid uuid
3. submissionSchema rejects proof_text shorter than 10 chars
4. submissionSchema accepts proof_text with 10+ chars
5. evaluationSchema requires expectedAction when verdict=request_v2 (structural path assertion)
6. evaluationSchema accepts empty expectedAction for verdict=validate_v1
7. evaluationSchema rejects score value above max 25

### tests/unit/score.test.ts (7 tests)
1. scoreFromEvaluation sums all rubric subscores (c1=10+c2=15+c3=20 = 45)
2. scoreFromEvaluation returns 0 for empty scores map
3. combineScores returns correct project, engagement, and total values
4. combineScores total equals project + engagement (exact: 120+50=170)
5. applyBonusMultiplier returns rawScore unchanged when no bonus events
6. applyBonusMultiplier returns rawScore unchanged when rawScore <= 0
7. applyBonusMultiplier applies a 2x multiplier for a valid next_deliverable bonus (50*2=100)

## Verification Results

- `npm run typecheck`: PASS (tsc --noEmit, 0 errors)
- `npm run build`: PASS (Next.js build succeeds, actions.ts re-imports work in bundler)
- `npm run test:unit`: PASS — 14 tests, 0 failures, 2 test files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 UUID regex rejects non-nil non-v4 UUIDs**
- **Found during:** Task 2 (RED phase — expected fails, but wrong reason)
- **Issue:** Plan specified UUID `00000000-0000-0000-0000-000000000001` as the test UUID. Zod v4 tightened the uuid validator regex to require version digit `[1-8]` or the nil UUID (all zeros). `...000001` is neither — fails validation.
- **Fix:** Changed test UUID to `00000000-0000-0000-0000-000000000000` (nil UUID, explicitly accepted by Zod v4)
- **Files modified:** tests/unit/actions-schemas.test.ts
- **Commit:** 8ff34fd (included in Task 2 commit)

## TDD Gate Compliance

- RED gate (test commit before implementation): Task 1 was non-TDD (infra setup) — committed first. Task 2 started with RED: test files written first (failing due to UUID issue), then fixed to GREEN in same task as required by plan.
- GREEN gate: All 14 tests pass after fix.
- No REFACTOR commit needed.

## Known Stubs

None — this plan creates test infrastructure only; no UI/data rendering stubs.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes at trust boundaries. lib/schemas.ts is a pure read-only extraction.

## Self-Check: PASSED

Files exist:
- vitest.config.ts: FOUND
- lib/schemas.ts: FOUND
- tests/unit/actions-schemas.test.ts: FOUND
- tests/unit/score.test.ts: FOUND

Commits exist:
- eda4f6d: FOUND (feat(13-02): install Vitest, extract Zod schemas)
- 8ff34fd: FOUND (test(13-02): add unit tests)
