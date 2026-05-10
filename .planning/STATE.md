---
gsd_state_version: 1.0
milestone: v0.2
milestone_name: EIC Design v2 Refresh — Phases 6-9
status: implementation_complete_pending_human_verification
last_updated: "2026-05-10T11:45:00.000Z"
last_activity: 2026-05-10 — Completed quick task 260510-l3m: B2 RÉTRO — pondération 20/80 AgreenTech (DEFAULT_PITCH_WEIGHT 0.5→0.8)
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-09)

**Core value** : Permettre à 6-15 équipes réelles de vivre le Hack-Days 13-14 mai 2026 — chaque livrable d'atelier soumis, évalué, noté en ligne, classement publié — sans perte de données et sans honte devant les partenaires.

**Current focus** : v0.2 EIC Design v2 Refresh — appliquer le design v2 EIC complet sur l'app v0.1. Mode qualité sans deadline.

## Current Position

Milestone v0.2 : implementation complete — pending human verification.
All 4 phases (6, 7, 8, 9) implementation completed 2026-05-10.
Last activity: 2026-05-10 (autonomous run completed Phases 7+8+9 in single session).

## Active Milestone

**v0.2 — EIC Design v2 Refresh** (implementation complete pending verification)

4 phases ordonnées livrées (Design System → Joueur → Mentor → GameMaster). Chaque phase commit atomique → fallback v0.1 garanti à tout moment via `git reset --hard v0.1-pilot-ready`.

Source de vérité design : `.planning/design-v2/` (bundle Claude Design exporté 2026-05-08).

## Phase Status

| Phase | Goal | Status |
|---|---|---|
| 1-5 | Pilot v0.1 (Foundation, Player, Mentor, GameMaster, Pitch+Deploy) | complete |
| 6 | Design system EIC + AppShell + Login branded | complete (verified 2026-05-10, smoke 7/7 passed) |
| 7 | Joueur : barre charge L0-L7 + drawer + onboarding + ticket SOUMIS | implementation complete (8/8 PLR — 7 commits — VERIFICATION human_needed) |
| 8 | Mentor : commentaires async sur lien + composer V2 | implementation complete (6/6 MNT — 7 commits — VERIFICATION human_needed) |
| 9 | GameMaster + jury + replay + Pixel mascotte | implementation complete (9/9 GMR — 12 commits — VERIFICATION human_needed) |

## Next Action — Pilot Operator Gates (Omar)

**CRITIQUE — avant test E2E v0.2 :**

1. **Apply migration SQL Phase 8** : `database/migrations/08-mentor-comments.sql` sur Supabase prod (sinon comments + expected_action fail at runtime)
2. **Apply migration SQL Phase 9** : `database/migrations/09-gamemaster-live.sql` sur Supabase prod (sinon /admin/deliverables toggle + announcements fail)
3. **Visual review** des 3 phases v0.2 sur dev local + preview Vercel :
   - Phase 7 : `/journey` (barre L0-L7 desktop/mobile), `/onboarding` (3 étapes), `/journey/deliverable/[id]` (ticket SOUMIS + révision V2)
   - Phase 8 : `/mentor/submission/[id]` (link card + history + tagged comments + expected_action)
   - Phase 9 : `/admin?live=1` (radar + Pixel mascot + status banner), `/admin/deliverables`, `/admin/announce`, `/jury?theater=1`, `/results` (replay quand published)
4. **Smoke E2E régression v0.1** : `/login`, `/journey`, `/mentor`, `/admin`, `/jury`, `/results` continuent à marcher en mode standard (sans `?live=1` ni `?theater=1`)
5. **Reduced-motion check** : pulsations radar + ticket rotated + drawer animations respectent `prefers-reduced-motion`
6. **A11y check** : focus, aria-labels, ESC keys, tap targets ≥44px
7. **No-Realtime check** : grep `supabase.channel\|subscribe(` dans `app/`, `components/`, `lib/` → doit être vide

Voir VERIFICATION.md de chaque phase (`.planning/phases/0[789]-*/0[789]-VERIFICATION.md`) pour la liste exhaustive d'items à valider.

## Pilot Operator Action Items (Omar — préservés depuis v0.1)

Ces actions restent à faire pour le pilote du 13-14 mai 2026, indépendamment de v0.2 (et peuvent être faites en parallèle de v0.2) :

1. Apply schema Supabase prod fresh (`schema.sql` → `triggers.sql` → `rls.sql`)
2. Run `database/rls_test.sql` → verdict ALL PASS dans `RLS-TEST-RESULTS.md`
3. Vercel deploy (env vars + push) selon `docs/DEPLOY.md`
4. Smoke test E2E sur URL prod → verdict PASS dans `SMOKE-TEST-E2E.md`
5. Magic links 6-15 testeurs internes (cf. `INTERNAL-TESTERS.md`) pour répétition
6. Tag git `v0.1-pilot-ready` posé localement (commit `8176419`) — `git push --tags` quand prêt

## Risk Watch (v0.2)

- **Ne pas casser v0.1** : Phase 6 (design system) refactor le shell partagé, risque de régression sur tous les écrans. Mitigation = tester `/login`, `/journey`, `/mentor`, `/admin`, `/jury`, `/results` après chaque commit.
- **Drawer + glass effect mobile** : `backdrop-filter: blur` impacte perfs sur Android low-end. À vérifier avec Chrome devtools throttling.
- **Polices Google Fonts** : Baskervville + Montserrat self-hosted via `next/font/google`. À monitorer LCP après refonte.
- **Mascotte Pixel SVG** : nouveau composant, risque visuel. À builder en isolé d'abord (page de dev) avant de l'intégrer au dashboard GM.

## Decisions

- 2026-05-09 : milestone v0.2 démarrée avant clôture formelle de v0.1 (artefacts `.planning/phases/01-*` à `05-*` préservés). v0.1 sera archivée via `/gsd-complete-milestone` après le pilote du 13-14 mai.
- 2026-05-09 : numérotation phases continue (Phase 6, 7, 8, 9) sans `--reset-phase-numbers`.
- 2026-05-09 : Source de vérité design = `.planning/design-v2/` (extraction locale du bundle Claude Design `tar.gz`). L'URL Anthropic ne sera pas re-fetchée.
- [Phase 06]: Phase 6 Plan 01: EIC tokens copied verbatim, next/font/google self-hosted, glass/aurora utilities prefixed .eic-* — v0.1 surfaces preserved
- [Phase 06]: Phase 6 Plan 02: 5 typed primitives + CSS contracts in globals.css — server-renderable, BEM modifiers, prefers-reduced-motion guard on pulse keyframe
- [Phase 06]: Phase 6 Plan 03: AppShell variant prop split player/staff — TopbarLite + MobileTabBar extracted, .eic-staff-sidebar additive class swaps sidebar to --eic-blue, v0.1 default backward compat preserved
- [Phase 06]: Phase 6 Plan 04: /login refactored to branded EIC v2 — eic-aurora + EICLogo + eic-glass card + 6-partner footer. LoginForm uses React 19 3-tuple useActionState + Button primitive size=lg. PartnerBanner conditional per-partner (PARTNER_SVG_AVAILABLE, all 6 SVGs present). Phase 6 closes — DSY-01..07 all delivered.
- [Phase 07]: Plan 07-01 (atomic PLR-03+PLR-04): journey-track + level-node + drawer + deliverable-card + hero-next-step. Layout grid 3-col desktop / single mobile. AppShell variant=player. Pulsations CSS pure + prefers-reduced-motion guards. backward compat preserved on demo mode (empty fallback).
- [Phase 07]: Plans 07-02/03/04: onboarding 3 étapes éditoriales (welcome stats / team / 3 règles), submission-ticket post-V1 (sunburst + stamp rotated), revision-panel pédagogique (parsing heuristique ✓/⚠ from feedback_text). v0.1 unused components removed (journey-header, journey-timeline, journey-deliverables, onboarding-form). 8/8 PLR delivered.
- [Phase 08]: Migration SQL `08-mentor-comments.sql` separated DDL — evaluation_comments table (RLS: mentor + team SELECT, mentor INSERT, GM DELETE) + evaluations.expected_action column with NOT VALID CHECK (non-empty when verdict=request_v2). Apply via `supabase db push` ou manuel.
- [Phase 08]: Mentor evaluation refactor — link-based central card with type detection (Google Docs/GitHub/Notion/Figma/video/PDF), V1/V2 history antichrono, tagged async comments (remarque/à corriger), expected_action conditional input, confirmation banner with form lock post-submit. Server side: addEvaluationCommentFlow + evaluateSubmission Zod superRefine for expected_action. Zero Realtime confirmed via grep. 6/6 MNT delivered.
- [Phase 09]: Migration SQL `09-gamemaster-live.sql` separated DDL — deliverable_templates.is_active boolean + announcements table (kind/target_kind/target_ids) + RLS via is_game_master() (note: codebase helper, brief said is_staff). Apply via `supabase db push` ou manuel.
- [Phase 09]: Agent 9A delivered GMR-04/05/06/09 — jury pitch theater (?theater=1, timer 5min CSS countdown, /5 grid persisting /20 via existing savePitchScoreFlow), results replay (podium SVG, 5 stats strip, hardcoded timeline moments v0.2), /admin/deliverables toggle is_active + filter in lib/journey.ts, /admin/announce composer 4 kinds × 4 targets + Player strip on /journey.
- [Phase 09]: Agent 9B delivered GMR-01/02/03/07/08 — admin live mode (?live=1) atomic with radar SVG (computeRadarLayout polar arrangement, sized by score, color by activity state), team-circle CSS pulsations + vibrate (no React tick re-render), team-focus editorial layout, status banner 4 states (serein/concentre/inquiet/euphorique) computed from team activity distribution + recent validated events. Pixel mascotte SVG floating bottom-right with 4 moods mirroring hackStatus, foldable to pill. GMR-08 committed BEFORE GMR-07 per ROADMAP DoD. 9/9 GMR delivered.

## Accumulated Context (préservé v0.1)

- 2026-05-08 : lucide-react pinné à `^0.577.0` (latest 0.x stable). Le 1.x existe mais upgrade différé jusqu'à présence de tests (V2).
- 2026-05-08 : Phase 1 ferme avec stub `/auth/callback` posé pour Phase 4 (magic link bulk import).
- 2026-05-08 : Phase 5 closeout (Plan 05-05) en mode FULL AUTO — artefacts livres, deploy + smoke test reels deferres a Omar avant 13 mai.

### Décisions héritées des phases 1-5

- [Phase 02]: Likert q1..q5 et membres present non persistes (pas de table diagnostic Phase 1) - validation server-side conservee pour UX
- [Phase 02]: Plan 03: V2 fully blocked at action level until Phase 3 introduces verdict-based gating
- [Phase 02]: Phase 2 cloturee : i18n complet, anti-leak audite clean, SMOKE.md livre comme procedure UAT executable avant 13 mai.
- [Phase 03]: Mentor data layer aggregates submissions+evaluations in two bulk queries (no N+1), per-player pending derived from status + connected user's evaluations
- [Phase 03]: evaluateSubmission keeps players.score_project untouched - relies on trg_evaluation_recalc trigger
- [Phase 03]: Single submitDeliverable action routes V1 vs V2 server-side based on latest submission status; client never sends version
- [Phase 03]: No trigger change: max(total_score) on validated submissions naturally yields V2 score because V1 with request_v2 stays at feedback_received (excluded from validated agg)
- [Phase 03]: Phase 3 closed via static grep audits (SCORE-01, SUBMIT-03, no Phase 1 concepts) + 03-SMOKE-TEST template; manual E2E deferred to UAT before 2026-05-13
- [Phase 04]: Demo mode bypasses role gate on /admin/export/players.csv to return header-only CSV (per must_have)
- [Phase 04]: Conserve les tokens CSS legacy en plus des nouveaux --brand-* pour eviter regressions sur components existants
- [Phase 04]: PartnerBanner = server component, LoginForm = client subcomponent, LoginPage = server shell
- [Phase 04]: Plan 04-02: GameMaster CSV bulk import idempotent (parseCsv pure helpers + service-role optional invites)
- [Phase 05]: Pondération ranking 50/50 par défaut + dense ranking
- [Phase 05]: Publish results idempotent (UPDATE conditionnel sur results_published_at IS NULL)
- [Phase 05]: Plan 05-03: RLS test suite via set_config Supabase pattern + 10 scenarios + templates operateur

---

## Blockers

_None_

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260510-heu | Audit R1 (score invisible côté Player) + 1 patch | 2026-05-10 | 1291f94 | [260510-heu-audit-r1-score-invisible-cote-player-et-](./quick/260510-heu-audit-r1-score-invisible-cote-player-et-/) |
| 260510-hzv | Update CLAUDE.md — sync lib/ refactor v0.2 (17 edits) | 2026-05-10 | bedf685 | [260510-hzv-update-claude-md-sync-lib-refactor-v02](./quick/260510-hzv-update-claude-md-sync-lib-refactor-v02/) |
| 260510-iee | T3 quick wins A1 (auto-save 8s + pastille) + A4 (compteur Y/N champs) | 2026-05-10 | cf28807 | [260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c](./quick/260510-iee-t3-quick-wins-a1-auto-save-a4-compteur-c/) |
| 260510-j2j | B2 banner L3 → tooltip ambre warn-only (R2/R3) | 2026-05-10 | 4733406 | [260510-j2j-b2-retirer-banner-rouge-l3-et-remplacer-](./quick/260510-j2j-b2-retirer-banner-rouge-l3-et-remplacer-/) |
| 260510-jm8 | A5 Pixel mascotte 3 triggers Player (a) 1er livrable (b) stagnation 15min (c) verbatim n°2 (dormant) | 2026-05-10 | a58c00e | [260510-jm8-a5-pixel-mascotte-3-triggers-evenementie](./quick/260510-jm8-a5-pixel-mascotte-3-triggers-evenementie/) |
| 260510-k1f | B1 Cohort Pulse Bar anonymisée /journey (R1, dual-mode, 6 lignes L0-L5) | 2026-05-10 | 311dd78 | [260510-k1f-b1-cohort-pulse-bar-anonymisee-t3-improv](./quick/260510-k1f-b1-cohort-pulse-bar-anonymisee-t3-improv/) |
| 260510-kpw | **B1 RÉTRO CRITICAL FIX** — R1 leak /results colmaté (gate isGameMaster sur podium scores + ranking table, annonce qualitative Players + EIC-validated FR copy) | 2026-05-10 | 16aa0f7 | [260510-kpw-b1retro-r1-leak-results-gate-isgamemaste](./quick/260510-kpw-b1retro-r1-leak-results-gate-isgamemaste/) |
| 260510-l3m | **B2 RÉTRO** — pondération 20/80 AgreenTech (DEFAULT_PITCH_WEIGHT 0.5→0.8) — décision EIC manager 10/05 | 2026-05-10 | 8199fb1 | [260510-l3m-b2retro-ponderation-20-80-default-pitch-](./quick/260510-l3m-b2retro-ponderation-20-80-default-pitch-/) |

### Seeds Planted

| ID | Title | Trigger | Date |
|----|-------|---------|------|
| [SEED-001](./seeds/SEED-001-schemas-v2-architectural-refacto.md) | Schemas v2 architectural refacto (T3-IMPROVEMENTS section F) | Post-pilote AgreenTech, milestone v0.3 ouverte | 2026-05-10 |

---

*Last updated: 2026-05-10 — milestone v0.2 EIC Design v2 Refresh implementation complete (Phases 6+7+8+9 = 33 commits feat/db/docs/chore depuis v0.1-pilot-ready). 23 v0.2 requirements implémentés (DSY×7 + PLR×8 + MNT×6 + GMR×9). Pending : apply migrations SQL (08+09), visual review, smoke E2E régression, a11y/reduced-motion check. v0.1 pilot-ready intact via tag `v0.1-pilot-ready` ; rollback distant possible si nécessaire. Sprint T-3 quick wins 2026-05-10 : audit R1 (260510-heu, 1 patch) + CLAUDE.md sync lib/ refactor (260510-hzv, 17 edits) + T3 A1+A4 (260510-iee, auto-save 8s + compteur Y/N champs) + B2 banner L3 → tooltip ambre warn-only (260510-j2j, 3 commits, R2/R3 conformes) + SEED-001 v0.3 schemas v2 planté.*
