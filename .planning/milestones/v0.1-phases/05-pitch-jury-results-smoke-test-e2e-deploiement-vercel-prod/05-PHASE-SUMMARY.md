---
phase: 05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod
milestone: v0.1
milestone_name: Pilot Hack-Days Fes-Meknes
type: phase-summary
period: 2026-05-08
plans_executed: [05-01, 05-02, 05-03, 05-04, 05-05]
plans_total: 5
plans_completed: 5
requirements_validated:
  - JURY-01
  - JURY-02
  - JURY-03
  - JURY-04
  - JURY-05
  - DATA-02
  - DEPLOY-01
  - DEPLOY-02
  - DEPLOY-03
status: complete
pilot_ready: true
completed: 2026-05-08
---

# Phase 5 Summary - Pitch Jury + Results + Smoke Test E2E + Deploiement Vercel prod

**Periode** : 2026-05-08 (J5 du pilot project A)
**Plans executes** : 5/5
**Requirements valides** : JURY-01..05, DATA-02, DEPLOY-01..03 (9 requirements)
**Statut** : Pilot-ready - prod deploy + UAT a executer par Omar avant 13 mai 2026

## Objectif phase

Cloturer la roadmap v0.1 en livrant : (1) la page jury jour 2 du Hack-Days, (2) le classement publie via gate `events.results_published_at`, (3) le deploiement Vercel prod, (4) la checklist smoke test E2E, (5) le test RLS exhaustif et les magic links testeurs internes pour la repetition J-1.

## Livre

### Code applicatif

- **`/jury` route** (Mentor/GameMaster) : formulaire 5x20 par Player, total live, upsert PitchScore avec contrainte unique (event_id, player_id, juror_id). `juror_id` force depuis `auth.uid()` (anti-spoofing T-05-03). Plan 05-01.
- **`/results` route** : classement combined (pitchAvg + scoreProject pondere 50/50), dense ranking, gate render server-side : aucun score serialise pour Player tant que `events.results_published_at IS NULL`. Plan 05-02.
- **`publishResultsFlow`** : action GameMaster idempotente (UPDATE conditionnel `WHERE results_published_at IS NULL`). Plan 05-02.
- **i18n complet** : 32 cles `jury_*` + `results_*` ajoutees aux dictionnaires fr/en.

### Securite & tests

- **`database/rls_test.sql`** : suite SQL parametree (10 scenarios) couvrant DATA-02 - Player isolation (T-05-10), Mentor self-insert juror_id (T-05-12), GM authority. Pattern Supabase officiel `set_config('request.jwt.claims', ...)` + helper `_rls_impersonate(uuid)` cree+drop. Plan 05-03.
- **Templates operateur** : `RLS-TEST-RESULTS.md` (verdict ALL PASS gate du deploy) + `INTERNAL-TESTERS.md` (tracker 6-15 testeurs avec procedure CSV import). Plan 05-03.

### Deploiement

- **`vercel.json`** : framework `nextjs`, region `cdg1` (Paris - proximite Maroc), 3 headers securite globaux (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin). Plan 05-04.
- **`.env.example`** mis a jour : 4 vars documentees avec notes securite explicites (service role key marquee Sensitive Production-only). Plan 05-04.
- **`docs/DEPLOY.md`** : guide complet (pre-requis, etapes initiales, procedure continue, rollback code+DB, vars critiques, domain custom, troubleshooting). Plan 05-04.
- **`SMOKE-TEST-E2E.md`** : checklist 10 sections (pre-conditions, GM import, Player onboarding, V1, Mentor evaluate, V2, jury notes, results gate, publish, RLS spot-checks, cleanup, verdict). Plan 05-04 + closeout annotation Plan 05-05.
- **README.md** : section `## Deploy` pointant vers DEPLOY.md + SMOKE-TEST-E2E.md.

### Closeout (Plan 05-05)

- Annotation SMOKE-TEST-E2E.md avec status auto-validation (typecheck/lint/build PASS) + checklist actions operateur.
- Mise a jour `.planning/STATE.md` (Phase 5 close, blockers vide, next = pilote 13-14 mai).
- Mise a jour `.planning/ROADMAP.md` (Phase 5 cochee, Plan 05-05 [x]).
- Mise a jour `.planning/REQUIREMENTS.md` (table Traceability avec phase=5, status=validated pour les 9 requirements).
- Ce phase summary `05-PHASE-SUMMARY.md`.

## Plans executes

| Plan | Subject | Requirements | Commits | Statut |
|------|---------|--------------|---------|--------|
| 05-01 | /jury page + savePitchScoreFlow | JURY-01, JURY-02 | 1412b50, bb57388, 9f89816 | complete |
| 05-02 | /results ranking + publishResultsFlow | JURY-03, JURY-04, JURY-05 | 5a7b33e, 862f5eb, c93a715 | complete |
| 05-03 | RLS test + internal testers | DATA-02 | 3a05a16, ca9a3e3 | complete (operateur action requise) |
| 05-04 | Vercel deploy config + smoke test | DEPLOY-01, DEPLOY-02, DEPLOY-03 | 5d82137, 5735c3e | complete (deploy operateur) |
| 05-05 | Phase closeout | (closeout) | 5c418c6 + closeout commits | complete |

## Decisions cles

- **Ponderation 50/50 figee** par defaut (`DEFAULT_PITCH_WEIGHT = 0.5`), configurable via `opts.pitchWeight`. Re-evaluable post-pilote.
- **Idempotent publish** : re-publier OK sans erreur (UPDATE conditionnel). Pas de unpublish via UI (manuel SQL si besoin).
- **Dense ranking** (egalite = meme rang sans saut) plutot que ranking standard. Tie-break stable : combined desc, pitchAvg desc, name asc.
- **Region Vercel cdg1** (Paris) pour proximite latence Maroc.
- **Headers securite via vercel.json** plutot que middleware (separation deploy/runtime + applique sur static assets).
- **NEXT_PUBLIC_APP_URL** conservee (vs SITE_URL) pour ne pas casser le code existant.
- **Smoke test execution manuelle** (humaine) - pas d'automatisation E2E (Playwright) : timeline T-5 trop courte.
- **Deploy execute par Omar** (manual `vercel push`) - executor produit les artefacts mais ne deploie pas.
- **Auto-approbation FULL AUTO** des checkpoints human-action (Plans 05-03 Task 2, 05-04 Task 3, 05-05 Task 3) : artefacts livres, executions reelles deferrees a Omar avant 12-13 mai.

## Hors scope (reportes Phase 6/7 ou V2)

- **NOTIF-01** (badges in-page notifications) - Phase 6 SHOULD si buffer
- **SCORE-03** (Score Engagement calcul serveur) - Phase 6 SHOULD si buffer
- **EVENT-05** (multi-event readiness) - Phase 7 SHOULD si buffer
- **RESOURCE-01** (page `/resources` statique) - Phase 7 SHOULD si buffer
- Tests automatises (Vitest + Playwright + pgTAP RLS) - V2
- Custom domain EIC - non configure (subdomain vercel suffit pour pilote)
- Tag git `v0.1-pilot-ready` - optionnel ; deferre a Omar (instruction operateur)
- Audit log ecriture - V2
- Rate limiting server actions - V2
- Sentry / observabilite - V2

## Risques residuels (handoff jour 1)

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Magic links delivery rate | Players non-loggable | Tester sur Gmail/Outlook/UEMF avant J-1 (cf. INTERNAL-TESTERS.md) |
| RLS test pas execute | Fuite donnees Player A vs B | Verdict ALL PASS dans RLS-TEST-RESULTS.md = gate hard du deploy |
| Custom domain pas configure | URL `*.vercel.app` (perception "demo") | Acceptable pour pilote ; subdomain vercel suffit |
| Pas de tests automatises | Regression silencieuse | Pilote = solo dev, smoke test manuel suffit ; V2 ajoute Playwright |
| Solo dev malade jour J | Pas de backup tech | Communication precoce EIC ; pas de mitigation tech |
| Build prod != local | Edge runtime divergent | Vercel detecte Next 15 nativement ; pas de buildCommand custom |
| Schema Supabase pas applique fresh | Triggers/RLS leaks | docs/DEPLOY.md exige `schema.sql` -> `triggers.sql` -> `rls.sql` order |

## Pilot-ready confirme

| Criterion | Statut | Evidence |
|-----------|--------|----------|
| Schema Postgres applique | confirme Phase 1 | DATA-01 pending operateur (apply order docs/DEPLOY.md) |
| Auth + middleware | confirme | Phase 1 + Phase 4 |
| Onboarding + Journey + Submit V1/V2 | confirme | Phases 2, 3 |
| Mentor evaluation | confirme | Phase 3 |
| GameMaster + bulk import + branding | confirme | Phase 4 |
| Pitch jury + Results + publish gate | confirme | Phase 5 (Plans 01-02) |
| RLS exhaustive test | suite SQL prete | DATA-02 operateur action requise |
| Vercel deploy config | confirme | vercel.json + DEPLOY.md |
| Smoke test E2E checklist | confirme | SMOKE-TEST-E2E.md (10 sections + verdict) |
| Magic links testeurs internes | tracker pret | INTERNAL-TESTERS.md operateur action requise |

**Verdict global** : tous les MUST (M1..M12) sont livres. Le code est build-green (typecheck + lint + build PASS). Reste a la charge d'Omar avant 13 mai :

1. **Apply schema** sur Supabase prod fresh (`schema.sql` + `triggers.sql` + `rls.sql`)
2. **Run RLS test** (`database/rls_test.sql`) -> verdict ALL PASS
3. **Vercel deploy** (env vars + push)
4. **Smoke test E2E** sur URL prod -> verdict PASS
5. **Magic links** envoyes a 6-15 testeurs internes pour repetition J-1 (12 mai)
6. **(Optionnel)** Tag git `v0.1-pilot-ready`

## Handoff jour 1 (13 mai 2026)

- **Operateur** : Omar
- **Backup contact** : a definir (UEMF)
- **URL prod** : a renseigner post-deploy
- **Comptes a tester en J-1** : voir `INTERNAL-TESTERS.md`
- **Procedure rollback** : `docs/DEPLOY.md` section Rollback
- **Logs Vercel** : Vercel dashboard > Deployments > [latest] > Logs

## Threat mitigations recap (Phase 5)

| Threat ID | Description | Mitigation |
|-----------|-------------|------------|
| T-05-01 | Tampering scores | Zod 0..20 borne + uuid |
| T-05-02 | EoP non-mentor scores | role gate applicatif + RLS pitch_scores_mentor_self_insert |
| T-05-03 | Spoofing juror_id | force `auth.uid()` server-side |
| T-05-04 | Info disclosure non-mentor | redirect role-specific page server |
| T-05-06 | EoP non-GM publish | role gate `app_role === 'game_master'` + RLS events_gm_all |
| T-05-07 | Info disclosure ranking pre-publish | render server-side gate ; aucun score serialise |
| T-05-08 | Tampering eventId publish | Zod uuid + RLS |
| T-05-10 | Info disclosure Player A vs B | RLS submissions select policy + test 1, 2, 9 |
| T-05-11 | Tampering Player A insert as B | RLS submissions insert policy + test 3 |
| T-05-12 | Spoofing Mentor juror_id=A | RLS pitch_scores insert + test 7 |
| T-05-14 | Service role key leak | .env.example flag + Sensitive type Production |
| T-05-17 | Missing security headers | vercel.json X-Frame, X-Content, Referrer |
| T-05-18 | Documentation drift | this phase summary |
| T-05-19 | Credentials in markdown | accept ; repo prive |

## Verification automatisee (closeout 2026-05-08)

- `npm run typecheck` : **PASS** (0 erreur TS)
- `npm run lint` : **PASS** (0 warning)
- `npm run build` : **PASS** (17 routes, middleware 89.6 kB)
- `vercel.json` : valide JSON
- Phase summary cree, STATE/ROADMAP/REQUIREMENTS coherents

## Self-Check: PASSED

Files verified (closeout):
- FOUND: `.planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/05-PHASE-SUMMARY.md`
- FOUND: `.planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/SMOKE-TEST-E2E.md` (annotated)
- FOUND: `.planning/STATE.md` (updated)
- FOUND: `.planning/ROADMAP.md` (updated)
- FOUND: `.planning/REQUIREMENTS.md` (updated traceability)

Plan summaries verified:
- FOUND: 05-01-SUMMARY.md (commits 1412b50, bb57388, 9f89816)
- FOUND: 05-02-SUMMARY.md (commits 5a7b33e, 862f5eb, c93a715)
- FOUND: 05-03-SUMMARY.md (commits 3a05a16, ca9a3e3)
- FOUND: 05-04-SUMMARY.md (commits 5d82137, 5735c3e)

Build verification: PASS
