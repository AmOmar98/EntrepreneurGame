---
quick_id: 260517-rlh
artifact: SUMMARY
date: 2026-05-17
status: audit-only-shipped (hardening deferred to follow-up advisor session)
branch: worktree-agent-af7720beb337e5fbd
commit_sha: <recorded in dispatch report — single commit, see git log of branch>
pushed_to_origin: true
advisor_spawned: false (reserved for follow-up session per dispatch scope)
---

# SUMMARY — quick-260517-rlh — RLS hardening (AUDIT phase)

## What shipped

Audit-only dispatch. Zero edits to `database/`. Artifacts produced under
`.planning/quick/260517-rlh-rls-hardening/`:

- `260517-rlh-PLAN.md` (imported from `worktree-260517-deferred-skeletons`)
- `260517-rlh-AUDIT.md` (NEW — full policy inventory + 10 gaps analyzed)
- `260517-rlh-ADVISOR-VERDICT.md` (NEW — DRAFT for follow-up advisor spawn)
- `260517-rlh-SUMMARY.md` (this file)
- `deferred-items.md` (imported from skeleton)
- `rls-tests-proposed/README.md` (NEW — test approach)
- `rls-tests-proposed/test_players_isolation.sql` (NEW — skeleton)
- `rls-tests-proposed/test_evaluations_r1.sql` (NEW — skeleton, R1 lock-in)

> The `rls-tests-proposed/` folder lives under `.planning/` (not
> `database/rls-tests/`) because dispatch scope forbade `database/` writes.
> The follow-up hardening session MUST move it verbatim to
> `database/rls-tests/` after advisor PASS.

## Findings count by severity (draft pre-advisor)

| Severity   | Count | IDs                                  |
| ---------- | ----- | ------------------------------------ |
| BLOCK      | 2     | G-08, G-02                           |
| WARN       | 5     | G-03, G-04, G-06, G-09, G-01         |
| LOW / INFO | 3     | G-05, G-07, G-10                     |

(Tables-audited × policies: 15 tables, ~47 policies inventoried.)

## Top 3 highest-risk gaps

1. **G-08 — `profiles.app_role` self-update priv-esc** (BLOCK candidate, pending
   reachability check). A Player may be able to self-promote to `game_master`
   via direct UPDATE on `public.profiles` because the policy gates on row
   ownership, not column-level. Needs runtime probe with anon-key + Player JWT
   BEFORE any further work — if exploitable, escalate to hotfix.
2. **G-02 — `events.pitch_order_json` exposed pre-publish** (BLOCK, R1
   contract). Migration `10-pitch-order.sql` docstring states the column is
   gated by `pitch_order_published_at` — current RLS does not enforce it.
   Direct R1 contract breach reachable via Supabase JS client.
3. **G-03 — `pitch_scores` visible to own team pre-`results_published_at`**
   (WARN, R1-adjacent). Per CLAUDE.md R1 (revised 2026-05-11), pitch scores
   are NOT deliverable scores and should respect the event-level reveal gate.

## What was NOT done (out of scope by design)

- No edit to `database/rls.sql`, `database/schema.sql`, `database/triggers.sql`.
- No SQL executed against any database (Supabase MCP not used).
- No `eic-pedagogical-advisor` spawn (reserved for follow-up session with
  Omar present).
- No middleware / application code change.
- No test execution.

## Commits

| SHA            | Branch                                | Message                                                                           |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------- |
| (see report)   | worktree-agent-af7720beb337e5fbd      | `docs(quick-260517-rlh): RLS audit + gap analysis + test approach skeleton`        |

Pushed to origin per dispatch policy. Branch NOT merged.

## Cardinals EIC (R1/R2/R3) preservation

- **R1 (score visibility)**: audit explicitly cross-checks R1; findings G-02 +
  G-03 + G-04 flagged as R1-adjacent. No code or SQL changed → R1 status
  unchanged.
- **R2 (warn-only)**: N/A for RLS layer (RLS = hard block by design).
- **R3 (pas de blocage inter-mission)**: N/A for RLS layer.

## Next steps (follow-up session, not now)

1. Omar + advisor session — spawn `eic-pedagogical-advisor` with this AUDIT +
   ADVISOR-VERDICT draft as input.
2. Runtime probe G-08 against PROD (anon-key + Player JWT) — confirm or
   refute privilege escalation reachability.
3. Move `rls-tests-proposed/` → `database/rls-tests/`, generate `_fixtures.sql`.
4. Table-by-table tightening with one atomic commit per table; re-spawn
   advisor before each.
5. Smoke parity check after each commit (11P + 2M + 3J + 4GM).
6. Document final RLS rationale per policy in `database/RLS.md` (per PLAN
   task N+2).

## Self-check (audit dispatch)

- FOUND: `260517-rlh-AUDIT.md` with 15 tables and 10 gaps numbered G-01..G-10.
- FOUND: `260517-rlh-ADVISOR-VERDICT.md` with draft severity classification.
- FOUND: `rls-tests-proposed/README.md` + 2 example `.sql` skeletons.
- CONFIRMED: zero edits under `database/` (git status before commit).
- CONFIRMED: no SQL executed.
