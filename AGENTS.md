# Working in Entrepreneur Game

Read `docs/README.md`, `docs/REPOSITORY_GUIDE.md` and `docs/PRODUCTION_ROADMAP.md` first. `docs/REPO_AUDIT.md` records the 2026-09-29 baseline and its limitations.

## Scope and evidence

- Product direction: production-ready for EIC first, other organizations later. Reliability, role-specific UX and event management all matter.
- Preserve existing uncommitted work. Inspect `git status` before editing; do not stage everything or discard unrelated changes.
- `CLAUDE.md` contains established domain rules and the GSD workflow. Its generated architecture/testing sections and `.planning/codebase/` are historical and contain stale facts. Check current source/configuration before relying on them.
- Keep small tasks in `.planning/quick/` using the existing GSD entry point when available, with plan, audit, summary and deferred-items records. Do not invent live verification or deployment evidence.
- Keep historical paths stable. Organize through indexes before moving source, SQL or event artifacts.

## Product invariants

- **R1:** Players may see a score only on their deliverable detail page. Never expose rank/leaderboard/percentile to Players, including in that detail view. Preserve existing Jury/GameMaster access rules.
- **R2:** Pedagogical deliverable validation is warn-only. Authentication, malformed requests and infrastructure failures can still return errors. `lib/schemas.ts` encodes configurable validation severity as `z.literal("warn")`.
- **R3:** Configurable prerequisites are soft amber hints. Preserve the documented single L2 exception: `fiches-entretien-v1` requires mentor validation of `prep-questions-v1`. Do not generalize it without a product decision.
- Preserve existing demo behavior and Supabase behavior. Demo is currently partial; do not describe it as a full authenticated workflow.
- Preserve archived event results and organization/event boundaries when changing queries, actions, scoring or SQL.

## Where changes belong

- Pages/routes: `app/`; server mutations: `app/actions.ts`; UI: `components/`; domain/data access: `lib/`; Supabase clients/session handling: `utils/supabase/`.
- Validation: `lib/schemas.ts`; types: `lib/types.ts`; score calculations: `lib/score.ts`, `lib/results.ts`; database triggers also maintain derived values.
- New migrations: `supabase/migrations/` only. Maintain the declarative mirrors according to `database/MANIFEST.md`; the bootstrap defects in the audit need a separate verified repair.
- Never use historical reset/provisioning/performance scripts as ordinary local setup. Do not read, print or commit credentials or real participant data for routine development.

## Verification

Use `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run build`, and relevant browser checks. Do not run build and the development/browser server simultaneously against the same `.next` directory. UI changes need visual checks for the affected roles.

For database, authorization or scoring changes, add meaningful authenticated integration evidence on a disposable development database. Current demo browser tests and static SQL scans do not establish RLS isolation, persistence, migration correctness or production capacity. Report failures and environment limitations accurately.
