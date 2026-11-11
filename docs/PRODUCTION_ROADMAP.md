# Production roadmap — EIC first

**Direction confirmed by Omar, 2026-09-29:** improve reliability/maintainability, Player/Mentor/Jury experience, and support for more events together. Serve **EIC first**, retaining a path to other organizations later.

This is a proposed delivery sequence, not a claim that the application is production-ready or that a new release has shipped. The launch target is now **Tuesday 3 November 2026, the Idea'Wave Cycle 1 initiation workshop**, following Omar's clarification. Version number, workshop start time and concurrency target remain undecided. The July 2026 deadline in the old roadmap is historical.

## Idea'Wave launch calendar

Recorded 2026-09-30 from the user-supplied **Reglement-AAP-IdeaWave-Cycle-1-2026-2027.docx**, section *Calendrier prévisionnel*, including footnote 3: *Dates sujettes à modification*. These are provisional programme dates; the source does not specify the workshop time.

| Programme milestone | Source date | Planning implication |
|---|---|---|
| Applications | 1–31 October 2026, closing at 23:59 Morocco time | Recruitment period; this does not imply application processing moves into the game |
| Selection committee | 2 November 2026 | Final roster may only be available the day before launch; rehearse imports/access beforehand |
| Initiation workshop | **3 November 2026** | **Application launch target**; onboarding and the workshop's required flows must be ready |
| Bootcamp, EIC / Eco-campus UEMF | 11–12 November 2026 | Rehearse the full delivery/review/jury sequence before these dates |
| Post-bootcamp support | 16 November–18 December 2026 | Plan continued access, feedback and support after the bootcamp |

The regulation targets **10 selected projects**, then **3 laureates** for post-bootcamp support. These counts do not establish account numbers or simultaneous users: team sizes, mentors, jurors and staff still need sizing.

Proposed internal milestones, not dates prescribed by the regulation:

- **27 October:** complete a staging rehearsal with synthetic accounts across all four roles, including failure/recovery cases.
- **30 October:** feature freeze and release preflight; keep final roster changes separate from application changes.
- **2 November:** after selection, provision the confirmed cohort and verify access and event assignments; timing/owner of the roster handoff remains to agree.
- **3 November:** launch at the initiation workshop after readiness checks pass.
- **9 November:** bootcamp-specific rehearsal using the final programme, criteria and assignments.

All existing release gates remain. Deferring Jury or other functionality beyond 3 November requires an explicit launch-scope decision; the later bootcamp date alone does not authorize it.

## Product outcome

An EIC organizer can configure and rehearse an event, enroll its teams and evaluators, run it without developer intervention, recover from an interruption, and retain reliable archives. Participants understand their next action and can trust that submissions, feedback and jury scores are saved.

Build on the existing Next.js/Supabase application. Avoid a rewrite or simultaneous framework migration while establishing the baseline. Other organizations should eventually get isolated programs and settings, but public signup, billing and a self-service marketplace are outside the first release proposal.

## Release sequence

| Gate | Outcome | Exit evidence |
|---|---|---|
| 0. Establish the baseline | Know what is deployed and what must be preserved | App revision, migration history, environment map, archive status and next event recorded |
| 1. Make data and workflows dependable | Repeatable environments; verified permissions, persistence and scoring | Fresh-install/upgrade tests, authenticated role tests, failure/retry tests, archive comparisons |
| 2. Complete the EIC experience | Players, mentors, jury and organizers complete their jobs confidently | Full event rehearsal, mobile/keyboard review, reliable drafts and feedback, complete event configuration |
| 3. Prove release readiness | Operate, monitor and recover within agreed limits | Restore rehearsal, rollback plan, triggered alert, measured load results, preflight report |
| 4. Extend to other organizations | Independent configuration and administration | Two-organization isolation/configuration suite and separate onboarding rehearsal |

UX research and acceptance scenarios can start during Gate 0. Implement major structural changes after Gate 1 provides regression protection. Gate 4 follows the EIC release; event isolation already matters for EIC's archives and must be tested earlier.

## Prioritized work queue

All items below are **proposed / not started**, except the repository organization delivered in this review. Priority P0 means a release prerequisite; P1 means core release work; P2 means later expansion or cleanup. Evidence is in [REPO_AUDIT.md](REPO_AUDIT.md).

| ID | Priority | Work | Done when |
|---|---|---|---|
| REL-01 | P0 | Reconcile branch, deployed app, database versions and old phase 18 | Dated evidence names each environment/revision, records archive status, and confirms the required 3 November Idea'Wave launch scope against the provisional calendar |
| DB-01 | P0 | Repair and verify database bootstrap/upgrade workflow | A disposable empty database and an upgrade fixture both reach the expected schema; triggers/policies compile; one current runbook reproduces it without destructive production steps |
| QA-01 | P0 | Add authenticated workflow and access tests | Player submits V1/V2; mentor evaluates/comments; jury saves scores; GM configures/publishes/exports; each persists and reloads correctly. Unauthorized users and a second event/organization cannot read/write outside their scope |
| UX-01 | P0 | Verify and fix draft ownership/restoration | Switching accounts or submission versions never shares a draft; URL/text mode survives reload; navigation and submission errors do not silently discard recent work |
| DATA-01 | P0 | Make event operations reliable under failure | Event activation is atomic; failed or retried clone/configuration writes leave a recoverable, consistent state; cloned criteria/settings match source; concurrent evaluations do not corrupt aggregates |
| OPS-01 | P0 | Establish recovery, alerts and release rehearsal | A restore into an isolated environment works; code/DB rollback compatibility is documented; a test incident reaches the designated operator; preflight passes all roles |
| UX-02 | P1 | Polish Player journey and feedback | Participants can identify the next task, required evidence, save/submission status, requested changes and mentor response without assistance; mobile/keyboard checks pass; R1/R2/R3 remain intact |
| UX-03 | P1 | Complete Mentor and Jury workflows | Review queues, team/event context, scoring criteria, save confirmation and recovery from interrupted sessions are clear; repeated/retried saves behave correctly |
| EVT-01 | P1 | Complete the organizer event lifecycle | Create/clone/configure/preview/activate/archive can be rehearsed end-to-end; dates, content, branding and displayed XP match event settings; a participant can return for another EIC event without ambiguous membership; archived results remain stable |
| PERF-01 | P1 | Define capacity and measure realistic load | Agreed concurrent-user/session mix, latency/error budgets and environment are recorded; authenticated concurrent load meets them; results include write contention and cleanup evidence |
| DX-01 | P1 | Make CI and local checks reproducible | Local/CI runtime policy matches; browser servers are isolated; failure traces are retained; the R2 comment false positive is fixed without weakening validation checks; supported demo behavior is documented and tested |
| ARCH-01 | P1 | Reduce maintenance cost incrementally | Extract one domain at a time from `app/actions.ts`, deduplicate authorization/event context, and consolidate styling with regression coverage; preserve public action contracts |
| TEN-01 | P2 | Finish organization-specific administration | Explicit organization membership/admin permissions, program/level ownership, event context and branding are defined and verified with two independent organizations |
| PROD-02 | P2 | Consider broader product features | EIC usage evidence justifies onboarding other organizations, richer analytics or additional pedagogical content; each has a separate product decision and acceptance criteria |

## User journeys to rehearse

| Role | End-to-end scenario | Failure/recovery scenario |
|---|---|---|
| Player | Join team → onboard → find mission → save draft → submit → read mentor feedback → revise | Reload, weak connection, account switch on a shared browser, expired session |
| Mentor | Open assigned queue → inspect evidence → evaluate → request changes → validate revision | Two reviewers, double submit, interrupted save, stale version |
| Jury | Access assigned event → open correct team → understand criteria → save scores → finish session | Refresh, retry, changed pitch order, closed session |
| GameMaster | Clone program → set dates/missions/rubrics/roles → preview → activate → run event → publish/archive | Incomplete clone, activation failure, mistaken configuration, restore/recovery |

Pedagogical guardrails remain: Players see a score only in their deliverable detail and never a rank; validation stays warn-only; configurable prerequisites are soft hints, preserving the existing single L2 exception.

## Release checklist

- [x] The target event and first audience are identified: EIC, Idea'Wave initiation workshop, 3 November 2026 (provisional programme date).
- [ ] Workshop time, final launch scope, supported devices and concurrent usage are agreed.
- [ ] Application and database revision evidence is current; historical archives have a preservation check.
- [ ] Database bootstrap and upgrade are reproducible; backup/restore and release rollback are rehearsed.
- [ ] Authenticated critical flows and negative access tests pass in staging with synthetic users.
- [ ] Draft, retry, concurrent-write and interrupted-session scenarios pass.
- [ ] All four role journeys pass a realistic EIC rehearsal, including mobile and keyboard use.
- [ ] Monitoring captures a deliberate test failure and the responsible operator receives it.
- [ ] Concurrent load meets agreed latency/error targets; seeded account count is not used as proof of concurrency.
- [ ] Open defects are triaged with explicit release decisions; no untested prerequisite is marked complete.
- [ ] Operational ownership, event preflight and support/recovery instructions are handed over.

## First implementation slice

Start with **DB-01 + the setup portion of QA-01**: build one reproducible disposable environment with synthetic Player, Mentor, Jury and GM accounts, verify the existing migrations, and prove one submission → evaluation → reload path. In parallel, reproduce UX-01 on synthetic data and write its acceptance cases. This creates the foundation for safe changes across all three workstreams.

Plan toward 3 November 2026 while confirming workshop time, expected concurrent users, operator ownership and available hosting budget. Reconfirm the provisional programme calendar before freezing the release. The old roadmap's 500-user ambition is a historical target, not an agreed capacity requirement for this release.
