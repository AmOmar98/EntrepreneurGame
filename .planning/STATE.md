---
gsd_state_version: 1.0
milestone: v0.1
milestone_name: Pilot Hack-Days Fès-Meknès** — Phases 1-5
status: executing
last_updated: "2026-05-09T22:42:43.362Z"
last_activity: 2026-05-09
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 26
  completed_plans: 28
  percent: 100
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-09)

**Core value** : Permettre à 6-15 équipes réelles de vivre le Hack-Days 13-14 mai 2026 — chaque livrable d'atelier soumis, évalué, noté en ligne, classement publié — sans perte de données et sans honte devant les partenaires.

**Current focus** : v0.2 EIC Design v2 Refresh — appliquer le design v2 EIC complet sur l'app v0.1. Mode qualité sans deadline.

## Current Position

Phase: 6 (Design System EIC — Tokens + Composants partagés + AppShell + Login branded) — EXECUTING
Plan: 3 of 4
Status: Ready to execute
Last activity: 2026-05-09

## Active Milestone

**v0.2 — EIC Design v2 Refresh**

4 phases ordonnées (Design System → Joueur → Mentor → GameMaster). Chaque phase commit atomique → fallback v0.1 garanti à tout moment via `git reset --hard v0.1-pilot-ready`.

Source de vérité design : `.planning/design-v2/` (bundle Claude Design exporté 2026-05-08).

## Phase Status

| Phase | Goal | Status |
|---|---|---|
| 1-5 | Pilot v0.1 (Foundation, Player, Mentor, GameMaster, Pitch+Deploy) | complete |
| 6 | Design system EIC + AppShell + Login branded | pending |
| 7 | Joueur : barre charge L0-L7 + drawer + onboarding + ticket SOUMIS | pending |
| 8 | Mentor : commentaires async sur lien + composer V2 | pending |
| 9 | GameMaster + jury + replay + Pixel mascotte | pending |

## Next Action

**Définir REQUIREMENTS.md v0.2 (DSY-* / PLR-* / MNT-* / GMR-*) puis spawner gsd-roadmapper pour ROADMAP.md.** Une fois roadmap approuvée :

1. `/gsd-discuss-phase 6` — cadrer la fondation design system
2. `/gsd-plan-phase 6` — détailler les plans de Phase 6
3. `/gsd-execute-phase 6` — exécuter

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

---

*Last updated: 2026-05-09 — milestone v0.2 EIC Design v2 Refresh started. v0.1 pilot-ready préservé, design source = `.planning/design-v2/`.*
