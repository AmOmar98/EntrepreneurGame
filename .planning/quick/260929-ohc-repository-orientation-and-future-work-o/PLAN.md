---
quick: 260929-ohc
title: Repository orientation and future work organization
date: 2026-09-29
status: complete
scope: documentation-only
---

# Repository orientation and future work organization

## Objective

Make the repository understandable and ready for sustained improvement toward a production-ready version serving EIC first, with a path to other organizations later. Organize all three workstreams: reliability and maintainability, Player/Mentor/Jury experience, and support for more events and organizations.

This task documents the existing application and proposes future work. It does not implement features, change application behavior, apply migrations, deploy, modify remote systems, commit, or discard existing local changes.

## Task 1 — Establish an evidence-based baseline

- Inspect the tracked application, scripts, tests, database migration policy and relevant planning records; preserve unrelated modifications and untracked work.
- Record the checkout and dated evidence in `docs/REPO_AUDIT.md` and this quick task's audit record. Keep credentials, personal records and unrelated monitoring logs out of the audit.
- Run appropriate available local baseline checks. Record exact commands and outcomes, including prerequisites or limitations; do not claim that historical test results or local demo checks verify production.
- Distinguish implemented code, historical deployment claims, outstanding live verification, and proposed work. Record contradictions in legacy documents without silently declaring old requirements complete.

**Acceptance:** The audit identifies current evidence and material gaps, records the initial dirty-work boundary, and reports the actual checks run. No application or external state is changed.

## Task 2 — Create a concise repository entry point and working guide

- Refresh `README.md` with the current product, supported local setup, commands and documentation links.
- Add `AGENTS.md`, `docs/README.md`, `docs/REPOSITORY_GUIDE.md` and `docs/DEVELOPMENT.md` with current code ownership by area, reading order, dual-mode behavior, development workflow, tests and production-sensitive boundaries.
- Link existing database, deployment, smoke, observability and preflight guidance while identifying historical or conflicting instructions. Preserve established planning paths and existing user changes, including `CLAUDE.md`.
- Keep current onboarding guidance separate from archived pilot evidence; avoid duplicating the full legacy roadmap or reorganizing source folders without a concrete need.

**Acceptance:** A new contributor can find the main routes and domain modules, start the local demo, identify relevant checks, and distinguish current guides from historical records. New local links resolve and commands match repository configuration.

## Task 3 — Organize a reviewable production roadmap and handoff

- Write `docs/PRODUCTION_ROADMAP.md` as a proposed sequence across reliability/maintainability, role-specific UX, and multi-event/multi-organization readiness, with EIC as the first production customer.
- Prioritize release-state reconciliation, authenticated isolation and archive verification, meaningful workflow tests, and completion of observability/performance evidence before broader product expansion.
- Give each proposed stage a concrete outcome, dependencies and acceptance criteria. Mark unknown dates and release decisions explicitly; the old July 2026 event deadline is historical, not a new commitment.
- Record completed documentation and checks in this quick task's summary, and preserve unresolved product or operational decisions in its deferred-items record.

**Acceptance:** The roadmap is clearly proposed rather than an assertion of live production status. All three user-requested workstreams have actionable next steps. The final handoff explains what changed, what was checked, and what remains to decide, without implementing, deploying or committing.

## Verification and completion

Review the final diff and changed-file list against the initial baseline. Check new Markdown links and relevant command references. Report any baseline failures as findings rather than repairing unrelated application code in this documentation task. Preserve all pre-existing work and keep runtime behavior unchanged.
