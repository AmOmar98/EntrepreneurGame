# Agent-Managed Operations & Traceability (`AGENT_OPS`)

This guide defines the operational architecture, tooling, safety gates, and traceability rules for running **Entrepreneur Game** under full agent management across **GitHub**, **Supabase**, and **Vercel**—including live event monitoring and guarded live hotfixing.

---

## 1. Connected Infrastructure Matrix

| Platform | Resource Identifier | Primary Interface | Fallback / CLI Interface |
|---|---|---|---|
| **GitHub** | `AmOmar98/EntrepreneurGame` | `gh` CLI + `git` | `git worktree` (isolated hotfix checkouts) |
| **Vercel** | `entrepreneur-game` (`prj_u3jR0YiNr2WnCFEoG6g1yDShikdH`) | `vercel` CLI (`vercel api`, `vercel rollback`) | Vercel MCP (`vercel-plugin_vercel`) |
| **Supabase** | `EntrepreneurGame` (`vzzbjxmfkmvqkaqxalhr`, `eu-west-1`) | Supabase MCP (`supabase_mcp`: `execute_sql`, `query_logs`, `get_advisors`, `list_migrations`, `restore_project`) | `npx supabase` CLI (`supabase/migrations/`) |

---

## 2. Unified Agent CLI (`scripts/agent-ops.mjs`)

All static cardinal gates, health ticks, isolated hotfix worktrees, and incident records are standardized in [`scripts/agent-ops.mjs`](../scripts/agent-ops.mjs):

```bash
# 1. Run cardinal R1/R2/R3 static checks (+ optional typecheck, lint, unit tests)
node scripts/agent-ops.mjs gates
node scripts/agent-ops.mjs gates --with-tests

# 2. Run a live health tick (probes Prod URLs + Vercel API + local gates)
# Writes .planning/ops-ledger/ticks/TICK-<UTC>.md and .json
node scripts/agent-ops.mjs tick --event-label IDEA-WAVE-J1

# 3. Create an isolated Git worktree for a live hotfix (never touches local dirty files)
node scripts/agent-ops.mjs worktree-create <slug> --base main

# 4. Initialize a structured incident record in .planning/ops-ledger/incidents/
node scripts/agent-ops.mjs incident-init <slug> --tier 1 --trigger TICK-<UTC>
```

---

## 3. Live Event Monitoring Protocol (`pilot-health-watcher`)

During an active event (or scheduled preflight rehearsal), the watcher runs on a recurring schedule (every 5–15 minutes):

1. **Execute Baseline Probe:**
   Run `node scripts/agent-ops.mjs tick --event-label <EVENT_SLUG>` to probe HTTP statuses/latencies on `https://entrepreneur-game-six.vercel.app/` and `/login`, verify the active Vercel Production deployment (`dpl_...`), and check local cardinal gates.
2. **Enrich with Live Supabase Telemetry (`supabase_mcp`, `project_id: "vzzbjxmfkmvqkaqxalhr"`):**
   - **Active sessions (SELECT-only):**
     ```sql
     SELECT count(*) AS active_sessions_15m
     FROM auth.sessions
     WHERE updated_at > now() - interval '15 minutes';
     ```
   - **Active event & submission velocity (SELECT-only):**
     ```sql
     SELECT e.slug, count(DISTINCT s.id) AS submissions_total,
            count(DISTINCT s.id) FILTER (WHERE s.submitted_at > now() - interval '15 minutes') AS submissions_15m,
            count(DISTINCT ev.id) FILTER (WHERE ev.created_at > now() - interval '15 minutes') AS evaluations_15m
     FROM public.events e
     LEFT JOIN public.cohorts c ON c.event_id = e.id
     LEFT JOIN public.players p ON p.cohort_id = c.id
     LEFT JOIN public.submissions s ON s.player_id = p.id
     LEFT JOIN public.evaluations ev ON ev.submission_id = s.id
     WHERE e.is_active = true
     GROUP BY e.slug;
     ```
   - **Unified Logs (`query_logs`):** Query `postgres_logs` and `edge_logs` over the last 15 minutes for `permission denied`, slow queries (`> 1000ms`), or `5xx` statuses.
   - **Advisors (`get_advisors`):** Check `security` and `performance` lints.
3. **Verdict & Escalation:**
   - **`VERT`**: All metrics nominal. Tick artifact saved in `.planning/ops-ledger/ticks/`.
   - **`WARN`**: Non-blocking latency or isolated warning. Recorded in tick artifact.
   - **`HARD`**: HTTP failure, `>= 3` 5xx errors in 15m, `>= 5` unexpected RLS denials, or failed deployment. Initialize an incident via `node scripts/agent-ops.mjs incident-init` and invoke the Hotfix workflow.

---

## 4. Guarded Live Code Changes (`pilot-hotfix-prepper`)

Live code changes during an event follow a strict **2-Tier Governance Policy** and **never** edit a dirty working tree directly:

### Isolation Rule (Mandatory)
Always create a clean Git worktree from `origin/main` (or the target release branch) using:
```bash
git fetch origin
node scripts/agent-ops.mjs worktree-create <slug> --base origin/main
```

### Tier 1 — Autonomous Fix & Deploy (Low Blast Radius, Non-Cardinal)
- **Criteria:** `<= 2` files changed, `<= 40` lines changed, does **not** alter `R1`/`R2`/`R3` cardinal logic, `lib/types.ts`, scoring formulas (`lib/score.ts`, `lib/results.ts`), or SQL (`database/**`, `supabase/migrations/**`).
- **Execution Sequence:**
  1. Reproduce the defect (unit test or deterministic trace).
  2. Apply the minimal surgical fix inside the isolated worktree.
  3. Run all mandatory gates inside the worktree:
     ```bash
     node scripts/agent-ops.mjs gates --with-tests
     pwsh ./scripts/check-r2-severity.ps1
     npm run build
     ```
  4. Tag the pre-hotfix commit (`git tag pre-hotfix-<timestamp>`), commit with an `Incident-Id: INC-...` trailer, and push to `origin/main`.
  5. Poll Vercel deployment status via `vercel api "/v6/deployments?app=entrepreneur-game&limit=1" --method GET` until `state === "READY"` and run `node scripts/smoke-http.mjs`.
  6. **Auto-Rollback on Failure:** If the deployment fails or `smoke-http.mjs` fails, immediately execute `git revert HEAD --no-edit && git push origin main` (or `vercel rollback <prev_dpl_uid> --yes`) and escalate to the operator.

### Tier 2 — Staged Branch & Preview URL for Operator Approval (Cardinal / Scoring / Auth / SQL)
- **Criteria:** Any change touching `R1`/`R2`/`R3` surfaces (`app/journey/`, `app/results/`, `components/results-*`, `components/submission-*`, `lib/score.ts`, `lib/results.ts`, `lib/types.ts`) or requiring a Supabase migration (`supabase/migrations/`).
- **Execution Sequence:**
  1. Author and verify the fix in the isolated worktree (`hotfix/<timestamp>-<slug>`).
  2. Push the branch to GitHub (`git push -u origin hotfix/<timestamp>-<slug>`) so Vercel builds an isolated **Preview Deployment**.
  3. Record the diff, verification gates, Preview URL, and 1-click merge/apply commands in `.planning/ops-ledger/incidents/INC-<timestamp>-<slug>.md` and request operator confirmation before merging to `main` or applying a migration.

---

## 5. End-to-End Traceability Checklist

Every agent-managed operation leaves four linked artifacts:
1. **Tick Snapshot:** `.planning/ops-ledger/ticks/TICK-<UTC>.md` + `.json`
2. **Incident Report:** `.planning/ops-ledger/incidents/INC-<UTC>-<slug>.md`
3. **Git Audit Trail:** Pre-hotfix tag (`pre-hotfix-<UTC>`) + atomic commit with `Incident-Id:` trailer
4. **Platform IDs:** Vercel Deployment UID (`dpl_...`) + Supabase Migration Version (`YYYYMMDDHHMMSS`)
