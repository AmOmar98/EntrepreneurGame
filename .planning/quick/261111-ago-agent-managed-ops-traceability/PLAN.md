# Agent-managed operations, live monitoring & end-to-end traceability

Started 2026-11-11 under quick ID `261111-ago`.

## Objective

Enable full Agent-managed operations across **GitHub**, **Supabase (`vzzbjxmfkmvqkaqxalhr`)**, and **Vercel (`prj_u3jR0YiNr2WnCFEoG6g1yDShikdH`)** with live event monitoring, guarded/isolated live code hotfixing, and end-to-end traceability (`REL-01`, `OPS-01`, `DX-01` partial).

## Steps

1. **Control-Plane Verification & `REL-01` Reconciliation:**
   - Verify GitHub CLI (`gh`), Vercel CLI (`vercel`), and Supabase MCP (`vzzbjxmfkmvqkaqxalhr`) connectivity.
   - Restore paused Supabase instance `vzzbjxmfkmvqkaqxalhr` and query live applied migrations (`supabase_migrations.schema_migrations`), events, cohorts, and archive integrity (AgreenTech + Digi-Hackathon).
2. **Traceability Ledger (`.planning/ops-ledger/`):**
   - Establish structured directories and index in `.planning/ops-ledger/README.md` (`ticks/`, `incidents/`) with required metadata fields (Git SHA, Vercel Deployment UID, Supabase Migration Version, R1/R2/R3 verification verdict, and 1-command rollback).
3. **Cross-Platform Agent Ops CLI (`scripts/agent-ops.mjs`) & R2 Comment False-Positive Fix:**
   - Fix the comment-only false positive in `scripts/check-r2-severity.ps1` and `scripts/check-r2-severity.sh` (ignoring comment lines starting with `//` or `*` while strictly scanning executable TS/TSX code).
   - Create `scripts/agent-ops.mjs` supporting:
     - `status` / `tick`: probes live HTTP endpoints, Vercel latest production & preview deployment statuses via `vercel api`, and writes a structured tick artifact in `.planning/ops-ledger/ticks/`.
     - `gates`: runs cross-platform R1 static audit, R2 static audit, R3 hard-block invariant check, `npm run typecheck`, `npm run lint`, and `npm run test:unit`.
     - `hotfix-worktree`: creates an isolated git worktree from `origin/main` (or target branch) so live hotfixes never collide with dirty local working trees, and generates a traced incident record in `.planning/ops-ledger/incidents/`.
4. **Update Agent Definitions & Documentation:**
   - Update `.claude/agents/pilot-health-watcher.md` and `.claude/agents/pilot-hotfix-prepper.md` to remove hardcoded May-2026 dates, use `query_logs` / `execute_sql` (`project_id: "vzzbjxmfkmvqkaqxalhr"`), use `scripts/agent-ops.mjs`, and enforce isolated worktrees + `.planning/ops-ledger/` traceability.
   - Add `docs/AGENT_OPS.md` and link it from `docs/README.md`.

## Acceptance Criteria

- Live GitHub, Vercel, and Supabase states (including applied migrations and archived event counts) are recorded with real timestamps and IDs in `AUDIT.md` and `.planning/ops-ledger/`.
- `node scripts/agent-ops.mjs gates` and `pwsh ./scripts/check-r2-severity.ps1` pass with exit code 0.
- `node scripts/agent-ops.mjs tick` produces a verified tick report in `.planning/ops-ledger/ticks/` with real Vercel deployment UIDs and live HTTP probe timings.
- Existing uncommitted files are preserved intact.
