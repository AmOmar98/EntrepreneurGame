# Réorganisation `.planning/` — Ouverture v0.3 Digi-Hackathon

**Date** : 2026-05-19
**Auteur** : Omar + brainstorm Claude
**Statut** : Design validé, en attente review utilisateur
**Approche retenue** : A — Minimaliste T-1

---

## Contexte

L'état actuel de `.planning/` est désynchronisé par rapport au travail réel :

- `STATE.md` déclare `milestone: v0.1` mais mélange contenu v0.2 + entries d'activité jusqu'au 2026-05-19
- `PROJECT.md` indique "Current Milestone: v0.2 EIC Design v2 Refresh" alors que v0.2 est archivée (tag `v0.2-pilot-ready`, commit `ccdc2bc`)
- `MILESTONES.md` (root) = 24 lignes de fragments incohérents, aucune trace de v0.3
- `ROADMAP.md` + `REQUIREMENTS.md` ne référencent que v0.1 + v0.2
- 13 quicks Digi-Hackathon (260512-24v → 260519-uuy) ne sont référencés nulle part dans STATE/MILESTONES
- 4 artefacts root traînants (`v0.1-MILESTONE-AUDIT.md`, `REVIEW-V02.md`, `PLAN-SMOKE-V02-AUTO.md`, `SMOKE-V02-AUTO.md`) auraient leur place dans `milestones/`

Le Digi-Hackathon démarre le **2026-05-20** (J-1). L'objectif est d'ouvrir formellement v0.3 et de remettre `.planning/` à jour avec un minimum d'effort, sans investir dans une roadmap pré-event détaillée (mode quick par défaut pendant l'event, post-mortem ensuite).

## Décisions de cadrage (validées en brainstorm)

| Question | Réponse |
|---|---|
| Cadrage Digi-Hackathon | Nouveau milestone v0.3 formel |
| Timeline event | 20-22 mai 2026 (J-1 à J+3) |
| Mode de travail | T-1 / Event live / Post-mortem — pas de phases formelles pré-event |
| Sort des 13 quicks orphelins | Rétro-rattacher en bloc à v0.3 dans STATE.md (index seulement, pas de phase rétro) |
| Approche réorganisation | A — Minimaliste T-1 (B = milestone complet rejeté car ~1-2h de paperasse à J-1 ; C = reset convention rejeté car casse GSD standard) |

## Design

### 1. Archive v0.2 — 4 `mv` vers `milestones/`

Aucune suppression. Tout reste auditable.

| Source (racine `.planning/`) | Destination (`milestones/`) |
|---|---|
| `v0.1-MILESTONE-AUDIT.md` (122 lignes) | `v0.1-MILESTONE-AUDIT.md` |
| `REVIEW-V02.md` (108 lignes) | `v0.2-REVIEW.md` |
| `PLAN-SMOKE-V02-AUTO.md` (74 lignes) | `v0.2-PLAN-SMOKE-AUTO.md` |
| `SMOKE-V02-AUTO.md` (156 lignes) | `v0.2-SMOKE-AUTO.md` |

Fichiers déjà bien placés (rester en l'état) :
- `milestones/v0.2-MILESTONE-AUDIT.md`
- `milestones/v0.2-REQUIREMENTS.md`
- `milestones/v0.2-ROADMAP.md`
- `milestones/v0.2-phases/`
- `milestones/v0.1-phases/`

### 2. Nouveau v0.3 — 3 fichiers à patcher

#### `PROJECT.md`

Remplacer la section "Current Milestone: v0.2 EIC Design v2 Refresh" (et sa sous-section "Target features (4 phases)") par :

```markdown
## Current Milestone: v0.3 Digi-Hackathon (20-22 mai 2026)

**Goal :** Livrer le pilote Digi-Hackathon (3 jours, 20-22 mai 2026) sur la base PROD AgreenTech (v0.2-pilot-ready) restructurée 13 livrables alignés 8 PDFs Welcome Guide. Mode T-1 : stabilité + smoke prod > nouvelles features.

**Scope cardinal** :
- 13 livrables (5 bonus) répartis sur 7 missions M1→M7
- Exception R3 unique : `prep-questions-v1` → `fiches-entretien-v1` hard-block pédagogique (signée Omar 19/05)
- Reskin Digi appliqué (quick 260519-dgh)
- One-pagers PDF cohorte imprimables (workflow `docs/templates/event-onepager/`)

**Approche** : mode quick par défaut ; phases formelles uniquement post-event (post-mortem).

**Source PROD** : https://entrepreneur-game-six.vercel.app — 20 auth.users (11P + 2M + 3J + 4GM) inchangés depuis pilote AgreenTech.
```

#### `ROADMAP.md`

Ajouter en tête du fichier (avant le contenu existant v0.1) :

```markdown
# Roadmap — Entrepreneur Game

## v0.3 Digi-Hackathon (20-22 mai 2026, current)

Mode T-1 : pas de phases formelles avant event. Travail traçable via `.planning/quick/`.

| Phase | Goal | Status | Quand |
|---|---|---|---|
| Prep T-1 | Restructure 13 livrables + reskin Digi + smoke prod | **complete** (13 quicks 260512→260519) | jusqu'au 2026-05-19 |
| Event live | Pilote 3 jours stable, hotfixes via /gsd-quick sur main | **planned** | 2026-05-20 → 2026-05-22 |
| Post-mortem | Audit milestone, backfill résultats, archive v0.3 | **planned** | 2026-05-23 → 2026-05-25 |

Plans détaillés : aucun pré-event. Quicks live = source de vérité.

---

## ✅ v0.2 EIC Design v2 Refresh — archivé 2026-05-11
Voir `milestones/v0.2-MILESTONE-AUDIT.md` + `milestones/v0.2-ROADMAP.md`.

---

## ✅ v0.1 Pilot Hack-Days Fès-Meknès — archivé 2026-05-08
[contenu v0.1 actuel conservé tel quel ci-dessous]
```

Le contenu actuel du `ROADMAP.md` (header + phases 1-5 v0.1) est conservé sous le séparateur final, sans modification.

#### `REQUIREMENTS.md`

Ajouter en tête (avant la section "v1 Requirements (Pilot Project A — v0.1)") :

```markdown
## v0.3 Requirements (Digi-Hackathon — 20-22 mai 2026)

**Pré-event (T-1, complete)** :
- [x] **DIGI-01** : 13 livrables seedés alignés 8 PDFs Welcome Guide (seed `database/seed_event_digi_hackathon.sql`) _(quick 260519-pyx)_
- [x] **DIGI-02** : Exception R3 unique L2 hard-block `prep-questions-v1` → `fiches-entretien-v1` _(quick 260519-l1l, signée Omar 19/05)_
- [x] **DIGI-03** : Reskin visuel Digi-Hackathon appliqué _(quick 260519-dgh)_
- [x] **DIGI-04** : One-pagers PDF cohorte imprimables (workflow permanent `docs/templates/event-onepager/`) _(quick 260519-onepagers)_
- [x] **DIGI-05** : Smoke prod J-1 OK (typecheck/lint/build clean, 13 livrables visibles dual-mode) _(quicks 260519-psd + 260519-smoke-prod-j1)_

**Pendant event (J1-J3, planned)** :
- [ ] **DIGI-06** : PROD stable J1-J3 (pas de crash bloquant, R1/R2/R3 préservées)
- [ ] **DIGI-07** : Hotfix protocol respecté (commit direct main + push + smoke 30 min)

**Post-event (J+1 à J+3, planned)** :
- [ ] **DIGI-08** : Backfill pitch_scores + publish results (hybrid pitch proxy, cf. pattern quick 260515-gu4)
- [ ] **DIGI-09** : Milestone audit v0.3 + archive (`milestones/v0.3-MILESTONE-AUDIT.md`)
```

### 3. STATE.md — rewrite complet

Remplacer les ~180 lignes actuelles par ~80 lignes alignées v0.3 :

```markdown
---
gsd_state_version: 1.0
milestone: v0.3
milestone_name: Digi-Hackathon (20-22 mai 2026)
status: in_progress
last_updated: "2026-05-19T<timestamp ISO 8601>"
last_activity: 2026-05-19
phase: prep-t-1
---

# Project State

## Project Reference
See: `.planning/PROJECT.md` (mis à jour 2026-05-19 — milestone v0.3)

**Core value (v0.3)** : Livrer Digi-Hackathon 20-22 mai 2026 sur base PROD AgreenTech restructurée 13 livrables, sans perte de données ni honte partenaires.

## Current Position

**Milestone** : v0.3 Digi-Hackathon
**Phase courante** : Prep T-1 (complete) → bascule "Event live" 2026-05-20 00h00
**PROD** : https://entrepreneur-game-six.vercel.app (région cdg1) — 20 auth.users inchangés depuis pilote AgreenTech 13-14/05

**Dernière activité** : 2026-05-19 — quick 260519-uuy completed (UI/UX detail livrable, 3 commits atomiques)

## Phase Status (v0.3)

| Phase | Goal | Status |
|---|---|---|
| Prep T-1 | Restructure 13 livrables + reskin + smoke prod | ✅ complete (13 quicks 12-19/05) |
| Event live | Pilote 3j stable, hotfixes via quicks sur main | 🟡 planned 20-22/05 |
| Post-mortem | Audit + backfill résultats + archive | 🟡 planned 23-25/05 |

## Next Action

**Avant J1 (20/05 matin)** :
1. ✅ Smoke prod J-1 (déjà fait, quick 260519-smoke-prod-j1)
2. ✅ One-pagers PDF cohorte imprimés (quick 260519-onepagers)
3. ⚠️ Vérifier pilot-health-watcher cron actif pour J1-J3
4. ⚠️ Vérifier accès Vercel + Supabase MCP pour hotfixes live

## Risk Watch (v0.3)

- **PROD stabilité J1-J3** : aucun déploiement risqué après 2026-05-19 23h00. Hotfix only.
- **R1/R2/R3 cardinaux** : surface étendue post quick-260519-uuy (CTA back-to-prep en bannière locked). Re-audit grep R1 obligatoire avant tout merge live.
- **Exception L2 hard-block** : nouvelle (signée 19/05), pas testée en charge cohorte 11 porteurs. Monitor M2 J1.
- **Welcome Guide désync** : 8 PDFs ateliers ≠ 7 missions code (gérée hors-code par Omar coordination).

## Quick Tasks Completed — v0.3 prep (T-1, 2026-05-12 → 2026-05-19)

| # | Description | Date | Commit |
|---|-------------|------|--------|
| 260512-24v | FAB Call mentor Player + table help_requests + RLS | 2026-05-12 | b3cfe04 |
| 260512-d3m | Design v3 mockups | 2026-05-12 | (cf. quick) |
| 260512-hw0 | SUPERSEDED — P12 Ezzouzi pas provisionné | 2026-05-12 | 09130b8 |
| 260512-msu | RLS fix propagation verdict→submissions.status | 2026-05-12 | f9939b4 |
| 260515-gu4 | Publish results hybrid pitch proxy (backfill 44 pitch_scores) | 2026-05-15 | cdb8bb1 |
| 260515-lhi | UX V1→V2 CTA relance Player (hotfix /journey) | 2026-05-15 | 29e67ba |
| 260517-g02 | Pitch order sec-def or codepath | 2026-05-17 | (cf. quick) |
| 260517-mga | Migrations gate paper trail | 2026-05-17 | (cf. quick) |
| 260517-psd | Playwright smoke dualmode | 2026-05-17 | (cf. quick) |
| 260517-rlh | RLS hardening | 2026-05-17 | (cf. quick) |
| 260517-vsa | Validator severity audit | 2026-05-17 | (cf. quick) |
| 260519-dgh | Digi-Hackathon reskin visuel | 2026-05-19 | (cf. quick) |
| 260519-l1l | L1+L2 restructure persona + fiches (exception R3) | 2026-05-19 | (cf. quick) |
| 260519-onepagers | PDF one-pagers cohorte imprimables | 2026-05-19 | (cf. quick) |
| 260519-pyx | Restructure 12→13 livrables Digi-Hackathon | 2026-05-19 | (cf. quick) |
| 260519-rwi | Patch pilot-health-watcher + pilot-hotfix-prepper | 2026-05-19 | (cf. quick) |
| 260519-smoke-prod-j1 | Smoke prod J-1 final | 2026-05-19 | (cf. quick) |
| 260519-t3a | (t3 add) | 2026-05-19 | (cf. quick) |
| 260519-tqd | DB perf baseline + pooler verdict (Option 1) | 2026-05-19 | 9ca673f |
| 260519-uuy | UI/UX quick-wins detail livrable (3 commits atomiques) | 2026-05-19 | 7338ae4 |

## Seeds Planted

| ID | Title | Trigger | Date |
|----|-------|---------|------|
| [SEED-001](./seeds/SEED-001-schemas-v2-architectural-refacto.md) | Schemas v2 architectural refacto | Post-pilote AgreenTech, milestone v0.4 (renumbered, was v0.3) | 2026-05-10 |

## Blockers
_None_

## Historique Milestones
- **v0.1** Pilot Hack-Days Fès-Meknès — archivé 2026-05-08 (voir `milestones/v0.1-MILESTONE-AUDIT.md`)
- **v0.2** EIC Design v2 Refresh — archivé 2026-05-11 (voir `milestones/v0.2-MILESTONE-AUDIT.md`, tag `v0.2-pilot-ready`)
- **v0.3** Digi-Hackathon — in_progress depuis 2026-05-19

---

*Last updated: 2026-05-19 — milestone v0.3 ouvert formellement, archive v0.2 propre. 13 quicks Digi T-1 listés rétroactivement. Prep T-1 complete, attente bascule Event live 2026-05-20.*
```

Notes sur le rewrite STATE.md :
- SEED-001 : trigger renuméroté de "v0.3" → "v0.4" (puisque v0.3 = Digi-Hackathon, pas le refacto schemas qui était prévu post-pilote AgreenTech)
- Suppression intégrale de la section "Decisions" héritée des phases 1-9 (déjà archivée dans `milestones/v0.2-*`)
- Suppression de "Quick Tasks Completed" v0.1/v0.2 (déjà archivée dans `milestones/v0.2-MILESTONE-AUDIT.md`)
- Suppression de "Risk Watch (v0.2)" et "Roadmap Evolution" (obsolètes)
- SHA commits marqués `(cf. quick)` quand pas en mémoire — à remplir via `git log` au moment de l'écriture si Omar veut le détail

### 4. MILESTONES.md root — rewrite complet

Remplacer les 24 lignes de fragments par un changelog plat :

```markdown
# Milestones — Entrepreneur Game

Changelog des milestones livrés. Détails dans `milestones/<vX.Y>-MILESTONE-AUDIT.md`.

---

## v0.3 Digi-Hackathon (in_progress depuis 2026-05-19, event 20-22 mai 2026)

**Goal** : Livrer pilote Digi-Hackathon 3 jours sur base PROD AgreenTech restructurée 13 livrables alignés 8 PDFs Welcome Guide.

**Status** : Prep T-1 complete (13 quicks 12→19/05), Event live 20-22/05 planned, Post-mortem 23-25/05 planned.

**Mode** : pas de phases formelles pré-event, travail traçable via `.planning/quick/`.

**Tag prévu post-event** : `v0.3-digi-pilot-ready` (à poser 2026-05-22 soir si pilote stable).

Audit : à créer post-event dans `milestones/v0.3-MILESTONE-AUDIT.md`.

---

## ✅ v0.2 EIC Design v2 Refresh (livré 2026-05-11)

**Goal livré** : Refonte visuelle complète design v2 EIC + AppShell + Login branded + parcours Joueur/Mentor/GameMaster repensés sur base v0.1 pilot-ready.

**Tag** : `v0.2-pilot-ready` (commit `ccdc2bc`)

**Scope** : 4 phases (Design System / Joueur / Mentor / GameMaster), 26 plans, 23 requirements (DSY×7 + PLR×8 + MNT×6 + GMR×9), 33 commits.

**Post-livraison** : pilote AgreenTech 13-14 mai 2026 exécuté avec succès. MSU RLS fix `f9939b4` propagation verdict→submissions livré 2026-05-12.

Audit : `milestones/v0.2-MILESTONE-AUDIT.md`
Roadmap archive : `milestones/v0.2-ROADMAP.md`
Requirements archive : `milestones/v0.2-REQUIREMENTS.md`
Review archive : `milestones/v0.2-REVIEW.md`
Smoke archives : `milestones/v0.2-SMOKE-AUTO.md`, `milestones/v0.2-PLAN-SMOKE-AUTO.md`

---

## ✅ v0.1 Pilot Hack-Days Fès-Meknès (livré 2026-05-08)

**Goal livré** : Plateforme fonctionnelle pour pilote 13-14 mai 2026 (auth, onboarding, journey, submissions, mentor evaluation, jury, results), Supabase + Vercel déployé.

**Tag** : `v0.1-pilot-ready` (commit `8176419`)

**Scope** : 5 phases (Foundation / Player / Mentor / GameMaster / Pitch+Deploy), 26 plans.

Audit : `milestones/v0.1-MILESTONE-AUDIT.md`
Phases archive : `milestones/v0.1-phases/`
```

## Récapitulatif des changements

**Filesystem** (4 `mv`, 0 `rm`) :
- `.planning/v0.1-MILESTONE-AUDIT.md` → `.planning/milestones/v0.1-MILESTONE-AUDIT.md`
- `.planning/REVIEW-V02.md` → `.planning/milestones/v0.2-REVIEW.md`
- `.planning/PLAN-SMOKE-V02-AUTO.md` → `.planning/milestones/v0.2-PLAN-SMOKE-AUTO.md`
- `.planning/SMOKE-V02-AUTO.md` → `.planning/milestones/v0.2-SMOKE-AUTO.md`

**Réécritures** (2 rewrites, 3 patches) :
- `.planning/STATE.md` — rewrite (180 → ~80 lignes)
- `.planning/MILESTONES.md` — rewrite (24 fragments → changelog propre)
- `.planning/PROJECT.md` — patch section "Current Milestone" (v0.2 → v0.3)
- `.planning/ROADMAP.md` — header v0.3 ajouté, v0.1/v0.2 archivés en dessous
- `.planning/REQUIREMENTS.md` — bloc v0.3 (DIGI-01 → DIGI-09) ajouté en tête

**Total** : 9 changements, ~20-30 min d'exécution.

## Hors-scope (déféré post-event ≥ 2026-05-23)

- Création de `milestones/v0.3-MILESTONE-AUDIT.md` (à faire au post-mortem)
- Pose du tag `v0.3-digi-pilot-ready` (à faire 2026-05-22 soir si pilote stable)
- Migration éventuelle vers convention `.planning/` simplifiée (Approche C du brainstorm) — décision post-event selon retour Digi
- Renumérotation `SEED-001` dans son propre fichier (`seeds/SEED-001-*.md`) si le trigger v0.3→v0.4 n'est pas reflété ailleurs

## Critères d'acceptation

- [ ] `cat .planning/STATE.md` affiche `milestone: v0.3` en frontmatter
- [ ] `cat .planning/PROJECT.md` affiche "Current Milestone: v0.3 Digi-Hackathon" (pas v0.2)
- [ ] `cat .planning/MILESTONES.md` liste v0.3 / v0.2 / v0.1 dans cet ordre, sans fragments
- [ ] `cat .planning/ROADMAP.md` commence par "## v0.3 Digi-Hackathon", v0.1 préservé sous séparateur
- [ ] `grep DIGI- .planning/REQUIREMENTS.md` retourne 9 lignes (DIGI-01..09)
- [ ] `ls .planning/*.md` ne contient plus `REVIEW-V02.md`, `PLAN-SMOKE-V02-AUTO.md`, `SMOKE-V02-AUTO.md`, `v0.1-MILESTONE-AUDIT.md` à la racine
- [ ] `ls .planning/milestones/` contient les 4 nouveaux fichiers `v0.1-MILESTONE-AUDIT.md`, `v0.2-REVIEW.md`, `v0.2-PLAN-SMOKE-AUTO.md`, `v0.2-SMOKE-AUTO.md`
- [ ] Tous les liens internes des fichiers réécrits pointent vers des fichiers existants
