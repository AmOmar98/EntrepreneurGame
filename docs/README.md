# Documentation index

Current orientation was reviewed on **2026-09-29**, against branch `milestone/v0.4-scale-foundation` at `937468f`. Production was not inspected in this review.

## Reading order

| Document | Use it for |
|---|---|
| [Repository guide](REPOSITORY_GUIDE.md) | Understand the product, architecture and code boundaries |
| [Development guide](DEVELOPMENT.md) | Run locally, select checks and make changes |
| [Repository audit](REPO_AUDIT.md) | See measured results, defects and evidence gaps |
| [Production roadmap](PRODUCTION_ROADMAP.md) | Plan the EIC-first production release and later expansion |
| [Agent guidance](../AGENTS.md) | Preserve product rules and working conventions |

## Operating references

| Document | Status / use |
|---|---|
| [Database manifest](../database/MANIFEST.md) | Authority for **new migration authorship**; bootstrap steps have known conflicts described in the audit |
| [Database README](../database/README.md) | Historical pilot bootstrap, including destructive operations; not a routine setup guide |
| [Deployment](DEPLOY.md) | Existing Vercel deployment/rollback reference; validate current branch/environment before execution |
| [Smoke](SMOKE.md) | Existing test harness guide; compare with current configuration and audit |
| [Preflight](PILOT-PREFLIGHT.md) | Event rehearsal checklist to adapt to the next confirmed event |
| [Observability](OBSERVABILITY.md) | Sentry/PostHog and performance tooling; configured/verified status is still to establish |
| [Agent operations & traceability](AGENT_OPS.md) | Live monitoring, guarded hotfix worktrees, and `.planning/ops-ledger/` traceability across GitHub, Supabase and Vercel |
| [Bootcamp Idea'Wave 16–17 Nov 2026](IDEAWAVE_BOOTCAMP_16_17_NOV.md) | Live event IDs (`ideawave-bootcamp-nov-2026`), 16–17 Nov schedule, deliverable catalog, and CSV team import guide |
| [Validator severity](validator-severity-baseline.md) | R2 rationale and static-gate scope |
| [Pilot event runbook](PILOT-J1J2-RUNBOOK.md), [swarm runbook](SWARM-PROD-RUNBOOK.md) | Historical operations context, not current monitoring evidence |

## Planning and history

- [State](../.planning/STATE.md), [roadmap](../.planning/ROADMAP.md), [requirements](../.planning/REQUIREMENTS.md): existing v0.4 execution records. Completed implementation may still require operational verification.
- [Milestones](../.planning/MILESTONES.md) and [archive](../.planning/milestones/): shipped pilot history.
- [Quick tasks](../.planning/quick/) and [design specifications](superpowers/specs/): decisions and task evidence; preserve their links.
- [Old codebase maps](../.planning/codebase/): May 2026 snapshots, superseded for onboarding by the current repository guide.
- [This organization task](../.planning/quick/260929-ohc-repository-orientation-and-future-work-o/PLAN.md): scope and verification trail.

For a new task, put its execution record in `.planning/`, update the relevant current guide if behavior changes, and link release-level work back to the production roadmap. Avoid another parallel backlog with different status definitions.
