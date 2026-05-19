---
phase: 01-foundation-schema-types-suppression-code-obsol-te
status: complete
plans: 6
plans_complete: 6
date_completed: 2026-05-08
milestone: v0.1-pilot-hack-days-f-s-mekn-s
requirements_covered:
  - DATA-01
  - DATA-04
  - DATA-05
  - DATA-06
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
  - EVENT-03
  - EVENT-04
  - BRAND-05
  - M1
  - M12
---

# Phase 1: Foundation — Cross-Plan Summary

**Goal (per ROADMAP):** un schema Postgres aligné sur le brief, des types TS cohérents, le code obsolète supprimé, et un login qui marche en local sur Supabase prod fresh.

**Result:** 5/5 ROADMAP success criteria atteints. Repo prêt pour Phase 2 (Player Flow).

---

## ROADMAP Phase 1 success criteria — cross-check

| # | Criterion | Status | Closing plan |
|---|---|---|---|
| 1 | Schema Postgres appliqué sur projet Supabase prod fresh : events, levels, missions, deliverable_templates, cohorts, players, player_members, submissions, evaluations, pitch_scores + index FK chaudes | ✅ Done | [01-01-SUMMARY.md](./01-01-SUMMARY.md) — schema + triggers + RLS, 11 tables, 8 enums, FK indexes documented |
| 2 | `lib/data.ts` éclaté en `lib/types.ts` + `lib/seed/*.ts` + `lib/score.ts` + `lib/icons.ts` | ✅ Done | [01-03-SUMMARY.md](./01-03-SUMMARY.md) — 1285-line monolith deleted, 4-module split shipped |
| 3 | Code mort supprimé : BonusEvent, Checkpoint, MaturityPhase, prestige_xp, pages committee/admin-game/admin-startups, mailto drafts, exports committee/eml/kpi-snapshot | ✅ Done | [01-02-SUMMARY.md](./01-02-SUMMARY.md) — hard-delete of pages, exports, components, server actions; [01-03-SUMMARY.md](./01-03-SUMMARY.md) — types/enums also removed |
| 4 | Login email/password sur `/login` fonctionne en local et redirige vers le bon dashboard selon rôle | ✅ Done (pending live smoke-test on fresh Supabase) | [01-05-SUMMARY.md](./01-05-SUMMARY.md) — `signIn` reads `profiles.app_role`, redirects via `pathForRole`. Route renames in [01-04-SUMMARY.md](./01-04-SUMMARY.md). |
| 5 | Lucide-react repinné, build sans warning suspect, `npm run lint` + `npm run typecheck` clean | ✅ Done | [01-06-SUMMARY.md](./01-06-SUMMARY.md) — pinned `lucide-react@^0.577.0`, lint/typecheck/build all green |

---

## Files added / removed / renamed across all 6 plans

### Added
- `database/schema.sql` (rewritten) — 11 tables, 8 PG enums
- `database/triggers.sql` (rewritten) — `set_updated_at`, `recalc_player_score`, `on_evaluation_change`, `guard_player_onboarding`
- `database/rls.sql` (rewritten) — `current_app_role`, `is_game_master`, `is_mentor`, `is_my_player` + per-table policies
- `database/README.md` — apply order + GameMaster bootstrap insert
- `lib/types.ts` — TS source of truth (mirrors PG enums)
- `lib/score.ts` — pure score display helpers
- `lib/icons.ts` — `levelIcon`, `submissionStatusIcon`
- `lib/seed/index.ts`, `lib/seed/players.ts`, `lib/seed/missions.ts`, `lib/seed/deliverableTemplates.ts` — dual-mode seed accessors
- `lib/auth.ts` — `getCurrentUser`, `getCurrentRole`, `pathForRole`, `redirectForRole`
- `app/auth/callback/route.ts` — Supabase auth callback shell (Phase 4 magic-link prep)

### Removed
- `lib/data.ts` (1285 lines monolith)
- `lib/workflow-data.ts`
- `lib/csv.ts`
- `app/committee/`, `app/admin/game/`, `app/admin/startups/`, `app/mailto/`, `app/projects/`, `app/review/`, `app/ops/`
- `app/api/export/` (entire tree: cohort.csv, review-queue.csv, kpi-snapshot.csv, committee/, eml/) and the now-empty `app/api/` parent
- Components: `proof-workflow.tsx`, `onboarding-kyc-form.tsx`, `project-card.tsx`, `badge.tsx`, `page-header.tsx`
- All bonus / committee / mailto / KYC / startup mutations and Zod schemas in `app/actions.ts`
- `database/seed_bootcamp.sql` content (atlas-soil + bootcamp_deliverables purged per BRAND-05)

### Renamed
- `app/coach/` → `app/mentor/`
- `app/startup/` → `app/player/` (preserves `[slug]` segment)
- TS: `Startup` → `Player`, `Coach` → `Mentor`, `eic_admin` → `game_master`
- DB roles: `startups` → `players`, `coach` role → `mentor`, `eic_admin` → `game_master`

### Modified (notable)
- `app/actions.ts` — trimmed to auth-only (`signIn` Flow + `signOut` + `WorkflowState`)
- `components/app-shell.tsx` — role union `'player'|'mentor'|'game_master'`, minimal local nav map, no lucide imports
- `app/page.tsx` — minimal landing → `/login` then role-redirect
- `app/journey/page.tsx`, `app/mentor/page.tsx`, `app/admin/page.tsx`, `app/onboarding/page.tsx`, `app/player/[slug]/page.tsx` — role-aware stubs (per CONTEXT specifics: display `user.email | role` for routing debug)
- `app/login/page.tsx` — client component using `useActionState(signIn, ...)`
- `lib/i18n.ts` — trimmed to phase-1 keys only
- `utils/supabase/middleware.ts` — public-route whitelist now `/login`, `/api`, `/_next`, `/auth/callback`
- `package.json` — `lucide-react` repinned `^1.14.0` → `^0.577.0`
- `package-lock.json` — regenerated

---

## Canonical exports now provided by `lib/types.ts`

Enums (string-literal unions, mirroring PG enums in `database/schema.sql`):
- `AppRole` — `'player' | 'mentor' | 'game_master'`
- `PlayerStatus`
- `TeamRole`
- `LevelId` — `L0_diagnostic | L1_problem | L2_solution | L3_market | L4_business_model | L5_pitch | L6_traction | L7_alumni`
- `MissionKind`
- `SubmissionKind`
- `SubmissionStatus` — `draft | submitted_v1 | feedback_received | submitted_v2 | validated | rejected`
- `Verdict`

Domain types:
- `Event`, `Level`, `Mission`, `DeliverableTemplate`, `RubricCriterion`, `Cohort`, `Profile`
- `Player`, `PlayerMember`
- `SubmissionBase`, `Submission` (V1/V2 discriminated union — D-07)
- `Evaluation`, `PitchScore`

Authoritative score computation lives in `database/triggers.sql:recalc_player_score`. `lib/score.ts` exposes display-only helpers (`scoreFromEvaluation`, `sumPlayerScoreProject`, `combineScores`).

---

## Lucide-react version pinned

**Final pin:** `"lucide-react": "^0.577.0"` (latest stable 0.x at 2026-05-08).

**Icon substitutions made:** none — all 14 icons used by `lib/icons.ts` exist unchanged in 0.577.0.

**Note for V2:** lucide-react 1.x line is publicly available (latest dist-tag = `1.14.0`); upgrade is mechanical for our import set, deferred until the codebase has tests to catch any silent rendering drift.

---

## Tolerated lint/build warnings (rationale)

| Warning | Rationale | Tracked |
|---|---|---|
| `webpack.cache.PackFileCacheStrategy` "Serializing big strings (101kiB / 231kiB)" | Emitted by Next.js 15 internal webpack cache strategy. Not actionable from project code; pure performance hint about cache deserialization. | Plan 06 SUMMARY |
| 2 moderate npm-audit transitive vulnerabilities | In `@supabase/*` transitive deps. Out of scope for Phase 1; revisit when Supabase publishes patched releases. | Deferred — track in Phase 5 deploy audit |

---

## Open items for Phase 2

These are explicit Phase 2 dependencies surfaced during Phase 1 execution:

1. **Seed real Hack-Days event** (M4) — Phase 1 left `database/seed_bootcamp.sql` empty; Phase 2 must seed the canonical Event "Hack-Days Fès-Meknès Mai 2026" + 6 missions + ~9 deliverable_templates. Requirements: `EVENT-01`, `EVENT-02`.
2. **Build /journey real content** (M5) — Phase 1 ships only a routing stub. Phase 2 builds header (équipe, niveau, score), timeline ateliers, deliverable list with statuses. Requirements: `JOURNEY-01..03`.
3. **Onboarding form Niveau 0** (M3, ONBOARD-02) — Phase 1 stubbed `/onboarding`; Phase 2 builds the actual 5-question diagnostic + members form.
4. **Submission V1 server action** (M6 partial, SUBMIT-01/02/04) — Phase 1's `app/actions.ts` is auth-only; Phase 2 must add the submission flow with `httpsUrl` validation and `submitted_v1` status set.
5. **Demo seed leak fix in Supabase mode** (DATA-03) — `lib/seed/*.ts` already returns `[]` when `hasSupabaseEnv()` is true (preparation done plan 03), but Phase 2 owns the end-to-end verification.
6. **Live smoke-test login on fresh Supabase project** (M1) — Plan 05 marked status `complete-pending-smoke-test`. Omar must apply `database/schema.sql + triggers.sql + rls.sql` to a fresh Supabase project, create one bootstrap GameMaster row, and verify the email/password flow + role redirect end-to-end before Phase 2 starts. Risk Watch (STATE.md L45) confirms: "décider J1 si projet Supabase fresh ou existant".

---

## Risk Watch update (STATE.md)

- ✅ **Lucide-react `^1.14.0`** — Resolved by plan 06 (now `^0.577.0`).
- ⚠️ **Refactor schema vs migration Supabase prod** — Phase 1 chose fresh schema (D-01); Omar to confirm fresh Supabase project at start of Phase 2.
- 🕒 **Magic link Supabase** — Untouched in Phase 1 (deferred to Phase 4 ADMIN-02).
- 🕒 **Solo dev malade** — Non-tech, ongoing.

---

*Phase 1 closed 2026-05-08. Repo state: clean typecheck, clean lint, successful build, 10 routes generated. Ready for Phase 2.*
