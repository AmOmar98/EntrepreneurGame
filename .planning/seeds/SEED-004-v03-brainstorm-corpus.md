---
id: SEED-004
status: dormant
planted: 2026-05-19
updated: 2026-05-19 (post-260517 + Digi-Hackathon reskin)
planted_during: Post-pilote AgreenTech (v0.2 archivé, tag v0.2-pilot-ready)
trigger_when: /gsd-new-milestone v0.3 OU post-Digi-Hackathon (22/05 + retex)
scope: large (corpus — à éclater en seeds/phases individuels au moment du surfaçage)
authors: brainstorm 3-agents parallèles (UX Player / Ops Mentor-GM / Tech-Infra)
related_tags:
  - v0.2-pilot-ready (ccdc2bc) — rollback AgreenTech
  - v0.2.1-pre-digi (cf92fd7) — rollback pre-Digi-Hackathon reskin
---

# SEED-004: Corpus brainstorm v0.3 — 36 améliorations post-pilote AgreenTech

## Why This Matters

Pilote AgreenTech terminé (13-14 mai 2026), milestone v0.2 archivé.
**Update 2026-05-19** : un 2e pilote **Digi-Hackathon 4ème édition** (20-22 mai
2026, 10 teams UEMF) est provisionné et démarre J1 mercredi 20/05 09h00 —
reskin i18n + reseed DB only, aucun changement cardinal (cf. `260519-dgh`).

Avant que le contexte tiède des pilotes ne s'évapore, on capture les 36 idées
remontées par 3 agents indépendants (Player UX / Mentor-Ops / Tech) pour
nourrir la roadmap v0.3.

Ce seed n'est PAS un plan — c'est une **réserve de carburant** à présenter
lors de `/gsd-new-milestone v0.3` ou de toute session brainstorm roadmap
post-pilote. Chaque idée P0/quick-win mérite son propre seed ou sa propre
phase au moment où elle est promue.

## When to Surface

**Trigger:**
- `/gsd-new-milestone v0.3` (recommandation : ouvrir m0.3 après le retex
  Digi-Hackathon 22/05, pendant que les retours partenaires sont frais)
- `/gsd-review-backlog` ou session roadmap explicite
- Toute discussion "qu'est-ce qu'on améliore avant le prochain pilote ?"

## Scope Estimate

**Large** — pas un seul ticket. Le corpus contient :
- ~5 quick-wins UX Player (S/effort) actionnables en quick orchestrators
- ~5 quick-wins Ops Mentor/GM (S/effort) idem
- 4 P0 tech (refactor `app/actions.ts`, codegen types, migrations CLI, Vitest)
- Reste en P1/P2/long-term

Recommandation de découpe au moment du surfaçage : promouvoir 5-8 quick-wins
en seeds individuels, garder le reste comme backlog v0.3.

---

## Progress depuis brainstorm initial (delta 2026-05-13 → 2026-05-19)

Plusieurs items ont avancé pendant la fenêtre T-1→T+5 du pilote AgreenTech
et la prep Digi-Hackathon. À reconcilier au moment du surfaçage v0.3 :

| Item brainstorm | État | Référence |
|---|---|---|
| UX #7 (relance Player feedback_received) | **DONE** | commit `29e67ba`, quick `260515-lhi` |
| Tech T3 (tooling migrations SQL) | **PARTIEL** — inventory + `database/MANIFEST.md` Option A coexistence | quick `260517-mga`, commits `697f964` + `d628dae` |
| Tech T5 (RLS tests CI) | **PARTIEL** — audit + gap analysis + test approach skeleton | quick `260517-rlh`, commit `c0e7268` |
| Tech T4 adjacent (Playwright smoke harness) | **DONE** demo-mode 3 specs R1/R2/R3 | quick `260517-psd`, commit `189694f` |
| R2 validators severity baseline | **DONE** — audit + gate scripts | quick `260517-vsa`, commit `a9cf3ce` |
| Pitch order / publication results | **DONE** — backfill pitch_scores + publish | quick `260515-gu4`, commit `cdb8bb1` |
| RLS bug F-16-01 + MSU status propagation | **FIXED en pilote** | quicks `260511-sbt`, `260512-msu` |
| G-08 hotfix + 4 mga orphans | **APPLIED** Option A coexistence | commit `d628dae` |

⚠️ Au surfaçage v0.3, **ne pas reproposer** ces items tels quels — vérifier
le SHA et la couverture réelle avant de planifier suite.

---

## Nouveaux items v0.3 (ajoutés post-brainstorm)

Issus des `deferred-items.md` des quicks 260517-* et 260519-dgh :

| # | Titre | Source | Priorité |
|---|---|---|---|
| N1 | Renommer slug event `hack-days-fes-meknes-mai-2026` → `digi-hackathon-mai-2026` (refactor 15+ fichiers TS hardcodés) | `260519-dgh/deferred` | P2 cohérence reporting multi-event |
| N2 | Paramétrer `app/admin/players/import/page.tsx:10` `DEFAULT_COHORT_SLUG` (actuellement hardcodé) | `260519-dgh/deferred` | P1 |
| N3 | Cleanup chaînes hardcodées AgriTech/agriculteur hors `lib/i18n.ts` (grep ciblé composants narratifs) | `260519-dgh/deferred` | P1 résidu reskin |
| N4 | `npm audit` postcss <8.5.10 XSS — fix via `overrides` package.json + smoke (non-exploitable runtime mais pollue audit) | `260519-dgh/deferred` | P1 sécu housekeeping |
| N5 | Migration `bonus_events` table dédiée (vs `is_bonus=true` dans deliverable_templates) | `260519-dgh/deferred` | P1 schéma propre |
| N6 | Modèle event/cohort multi-pilote first-class (AgreenTech + Digi + futurs sans re-wipe) | observation 260519-dgh | P0 si 3e pilote ≤ 3 mois |
| N7 | UI multilingue EN complète (`dictionaries.en` incomplet, mentor M01 Digi anglophone) | `260519-dgh/deferred` | P2 |
| N8 | Membres équipes secondaires (co-founders/contributors) saisissables post-onboarding | `260519-dgh/deferred` | P2 |
| N9 | Real emails jury/mentor patterns paramétrables (placeholders `@digi.uemf.ma` Digi, à généraliser) | `260519-dgh/deferred` | P2 |

---

## 1️⃣ Player UX (R1/R2/R3 safe — vérifier à chaque promotion)

| # | Titre | Effort | Risque cardinal |
|---|---|---|---|
| 1 | Bump L0→L1 automatique + animation niveau débloqué (résout `project_onboarding_level_bump_sql.md`) | S | R3 — animation cosmétique, pas conditionner accès |
| 2 | Timeline statut livrable 4 étapes (Brouillon→Envoyé→Reçu mentor→Évalué) sans score avant étape finale | M | R1 — ne pas dévoiler score hors `DeliverableScoreBlock` |
| 3 | Aide contextuelle "Comment livrer un bon X" avec checklist + exemple anonymisé | S | R2 — warn-only |
| 4 | Preview mailto (To/Subject/Body) avant ouverture client mail | S | aucun |
| 5 | Verbatim mentor AU-DESSUS du score sur détail livrable | S | R1 OK (page détail = surface autorisée) |
| 6 | Narration L0→L5 plutôt que jauge XP sur /journey ; XP relégué à drawer "Mes stats" | M | R1 — pas de score/rang dans narration |
| 7 | ~~Bandeau ambre "3 livrables encore ouverts" non-bloquant~~ **DONE 2026-05-15** (commit `29e67ba`, quick `260515-lhi`) | S | R3 OK |
| 8 | Mode Hack-Days live : agenda du jour + mission courante en haut du shell | M | aucun |
| 9 | Empty states pédagogiques (illustration + exemple anonymisé) sur détail livrable vide | S | aucun |
| 10 | Re-soumission v2 explicite avec diff visuel v1 vs commentaires mentor | M | R2 OK |
| 11 | Encart "Besoin d'aide ?" (relire consigne / voir exemple / mailto mentor) — pas d'IA | S | aucun |
| 12 | Synthèse "Mon parcours EIC" exportable PDF (livrables + verbatims, AUCUN rang/percentile) | L | R1 strict |

**Priorité brainstorm** : #1, #2, #4, #5, #10 (recheck post-Digi-Hackathon retex)

---

## 2️⃣ Ops Mentor / Jury / GM

Note : Digi-Hackathon 20-22/05 sera le **2e terrain de validation** de ces
items — capter pendant le live ce qui manque vraiment vs ce qui n'est
remonté que côté brainstorm.

| # | Titre | Effort | Impact |
|---|---|---|---|
| 1 | File mentor priorisée par SLA (tri `submitted_at` + badge couleur) | S | -30% temps cycle |
| 2 | Autosave brouillon évaluation localStorage par submission_id | S | Élimine frustration #1 |
| 3 | Commentaires structurés (forces / axes / next-step) 3 textareas obligatoires | S | Qualité pédagogique constante |
| 4 | Réassignation mentor en 1 clic depuis `admin/players/[id]` | M | GM autonome sans Omar |
| 5 | Dashboard GM `admin/live` (4 KPI + heatmap players×missions, refresh 30s) | M | Crédibilité partenaires |
| 6 | Alertes opérationnelles via webhook Supabase (status stuck > 4h, RLS denials) | M | Détection proactive |
| 7 | Export `admin/export/evaluations.csv` enrichi (`lag_minutes`, rubric_1..5) | S | Reporting partenaires |
| 8 | Jury reveal scripté 11→1 avec timing + état persistant DB | L | Moment fort cérémonie |
| 9 | Pondération 0.20/0.80 configurable runtime (table `scoring_config`) | M | Adaptabilité futurs pilotes |
| 10 | Import porteurs avec dry-run + diff avant confirmation | M | Zéro panique J-1 |
| 11 | Route `/api/health` (DB + RLS + triggers) JSON green/red | S | Smoke 30s avant J1 |
| 12 | `docs/HOTFIX-PLAYBOOK.md` 5 scénarios pré-écrits avec SQL diagnostic + patch | S | 5 min au lieu de 45 |

**Priorité brainstorm** : #2, #5, #7, #11, #12

---

## 3️⃣ Tech / Infra / Quality (roadmap v0.3 structurée)

### P0 — bloquants v0.3

| # | Titre | Effort | État |
|---|---|---|---|
| T1 | Découper `app/actions.ts` (2149 lignes) par domaine en barrel pattern | M | TODO |
| T2 | Codegen Supabase types (`supabase gen types typescript --linked > lib/database.types.ts`) | S | TODO |
| T3 | Tooling migrations (`supabase/migrations/` + CLI déjà en devDep) | M | **PARTIEL** — `database/MANIFEST.md` Option A coexistence appliquée (260517-mga) ; reste à standardiser migration CLI |
| T4 | Vitest sur `lib/score.ts` + `lib/results.ts` + `calculateBonusClaim` + `lib/journey-progression.ts` (~20 tests à haute valeur) | S | TODO ; Playwright smoke harness existe déjà côté E2E (260517-psd) |
| N6 ★ | Modèle event/cohort multi-pilote first-class (vs re-wipe DB entre chaque event) | M | NOUVEAU — promu P0 vu Digi-Hackathon = 2e pilote en 7 jours |

### P1 — qualité / sécurité

| # | Titre | Effort | État |
|---|---|---|---|
| T5 | RLS tests automatisés CI (`rls_test.sql` via `psql -v ON_ERROR_STOP=1`) | M | **PARTIEL** — audit + gap analysis + skeleton (260517-rlh) ; reste à wirer CI |
| T6 | GitHub Actions CI : typecheck/lint/build/vitest/playwright + pre-commit Husky | M | TODO |
| T7 | Observabilité : Sentry Next.js SDK OU Vercel Log Drains → Axiom | S | TODO |
| T8 | Rate limiting Upstash Ratelimit sur `signIn`, `submitDeliverableFlow`, `claimBonusEventFlow` | S | TODO |
| T9 | Helper `defineAction({ schema, requireRole?, revalidate, handler })` DRY | M | TODO |
| T10 | Zod-validate `process.env` au boot (`lib/env.ts`) + migration creds CSV → Vercel Blob | S | TODO |
| N4 ★ | postcss <8.5.10 XSS overrides + smoke | S | NOUVEAU — fix post-22/05 |
| N3 ★ | Cleanup AgriTech hardcodés hors `lib/i18n.ts` | S | NOUVEAU — résidu reskin Digi |
| N2 ★ | Paramétrer `DEFAULT_COHORT_SLUG` import UI | S | NOUVEAU |
| N5 ★ | Migration `bonus_events` table dédiée | M | NOUVEAU — proposé déjà en backlog |

### P2 — polish

| # | Titre | Effort |
|---|---|---|
| T11 | PPR Next 15 `experimental.ppr = "incremental"` + `<Suspense>` autour fragments dynamiques | M |
| T12 | `"type": "commonjs"` → `"module"` + `.cjs` → `.mjs` + `.nvmrc` Node 20 LTS | S |
| N1 ★ | Slug event rename `hack-days-fes-meknes-mai-2026` → `digi-hackathon-mai-2026` | M |
| N7 ★ | UI EN complète (dictionaries.en) | M |
| N8 ★ | Membres équipes secondaires (co-founders) | S |
| N9 ★ | Email patterns jury/mentor paramétrables | S |

**Reco brainstorm** (mise à jour 2026-05-19) :
- démarrer v0.3 par **T2 + finir T3** (codegen + migrations CLI sur la base
  MANIFEST.md déjà posée) — débloquent tout le reste et règlent la dette SQL
- enchaîner **N6** (event multi-pilote first-class) — la répétition AgreenTech
  → Digi-Hackathon montre que le besoin est concret, pas hypothétique
- puis **T1 + T4 + T9** en parallèle

---

## Surfacing Pattern

Quand ce seed remonte (via `/gsd-new-milestone v0.3` ou review backlog) :

1. **Récolter le retex Digi-Hackathon** (22-23/05) avant de prioriser —
   plusieurs items "Ops Mentor/GM" auront été testés 2 fois plutôt qu'1.
2. **Trier par chaud/froid** : quels items résonnent encore avec les retours
   pilote (Players, mentors, partenaires) ? Couper le reste.
3. **Promouvoir 5-8 quick-wins en seeds individuels** (un fichier `SEED-00X-*.md`
   par idée S/effort) pour faciliter `/gsd-plan-phase` ultérieur.
4. **Tech P0 (T1-T4 + N6) = 1 phase v0.3 dédiée** "Foundations v0.3" en
   ouverture de milestone — refactor + tooling + tests cœur métier + multi-event.
5. **Garder ce SEED-004 en statut `dormant`** comme référence corpus complet
   tant que la totalité n'est pas adressée.

## Cardinal Rules Reminder

Tout item Player-facing (catégorie 1) doit passer `eic-pedagogical-advisor`
avant implémentation — vérifier R1 (score visible UNIQUEMENT sur détail
livrable), R2 (validators warn-only), R3 (pas de blocage inter-mission codé
en dur). Cf. `CLAUDE.md` section "Pre-edit guards".

R1/R2/R3 baseline post-260517 confirmé par audits :
- R1 : `260519-dgh/PLAN.md` audit snapshot (tag `v0.2.1-pre-digi`)
- R2 : `260517-vsa` validator severity audit + gate scripts
- R3 : `260517-psd` Playwright smoke 3 specs verts
