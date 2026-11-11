# Milestone v0.3 — Digi-Hackathon (20-22 mai 2026)

**Generated:** 2026-05-23
**Status:** Event clos (J3 22/05) — Post-mortem in_progress
**Purpose:** Onboarding équipe + revue de projet

---

## 1. Project Overview

**Entrepreneur Game** — plateforme d'accompagnement entrepreneurial gamifiée EIC/UEMF (Next.js 15 + React 19 + Supabase). Transforme l'incubation en niveaux progressifs, missions, livrables évaluables et scoring.

**Milestone v0.3 Goal** : livrer le pilote **Digi-Hackathon** (3 jours, 20-22 mai 2026) sur la base PROD AgreenTech (v0.2) **restructurée 13 livrables** alignés sur 8 PDFs Welcome Guide. Mode T-1 : stabilité + smoke prod > nouvelles features.

**Statut actuel** :
- ✅ Prep T-1 complete (13 quicks du 12 → 19 mai)
- ✅ Event live complete (3 jours stables, 1 hotfix J1 `ad86675`, 0 downtime)
- 🟡 Post-mortem in_progress (design fixes brainstormé 23/05, quick A done : `docs/PILOT-PREFLIGHT.md`)

**Bilan terrain** : 10 teams Player + 5 Mentor + 3 Jury + 4 GM. 1 incident Player-bloquant (M3-M5 cachés par filtre `scheduled_date`, fixé en ~7h J1). 0 perte de données. Partenaires non impactés.

---

## 2. Architecture & Technical Decisions

Aucun changement architectural majeur en v0.3 — stack hérité v0.2 (Next.js 15 App Router, Supabase SSR, Zod, dual-mode demo/prod via `lib/supabase-status.ts`, server actions dans `app/actions.ts`).

**Décisions cardinales v0.3** :

- **Mode T-1 quicks-only** : pas de phases formelles avant event. Toute traçabilité via `.planning/quick/YYMMDD-XXX-slug/` (5 artefacts standard). Phases formelles réservées au post-mortem.
  - *Why* : éviter overhead planning pour event imminent
  - *Source* : `docs/superpowers/specs/2026-05-19-planning-reorganisation-v03-design.md`

- **Restructure 12 → 13 livrables** alignés 8 PDFs Welcome Guide (quick 260519-pyx).
  - *Why* : alignement contenu officiel partenaires Digi-Hackathon
  - *Impact* : seed `database/seed_event_digi_hackathon.sql`

- **Exception R3 unique L2 hard-block** : `prep-questions-v1` → `fiches-entretien-v1` (quick 260519-l1l).
  - *Why* : nécessité pédagogique signée Omar 19/05 — sans questions préparées, fiches d'entretien vides
  - *Implementation* : literal slug dans `HARD_BLOCK_DEPENDENCIES` (app/actions.ts) + composer disabled DOM-side + server reject `severity:"warn"`. **Ne se généralise PAS**.

- **Hotfix protocol commit-direct-main** pendant event live : pas de branche feature, push direct + smoke 30 min monitoring.
  - *Why* : réactivité < 1h sur bug Player-bloquant
  - *Validé terrain* : hotfix `ad86675` J1 17h UTC

- **MSU RLS trigger propagation verdict→submissions** (commit `f9939b4`, 12/05) : trigger `on_evaluation_change` propage `evaluations.verdict` → `submissions.status`.

---

## 3. Phases / Activités délivrées

| Phase | Goal | Status | Quand |
|---|---|---|---|
| **Prep T-1** | Restructure 13 livrables + reskin Digi + smoke prod | ✅ complete | jusqu'au 19/05 |
| **Event live** | Pilote 3 jours stable, hotfixes via quicks sur main | ✅ complete | 20-22/05 |
| **Post-mortem** | Audit milestone, backfill résultats, archive v0.3 | 🟡 in_progress | 23-25/05 |

**Quicks Prep T-1 livrés (sélection)** :
- `260512-msu` — MSU RLS submission status propagation fix
- `260515-gu4` — Publish results hybrid pitch proxy pilot
- `260517-mga`/`260517-rlh`/`260517-vsa` — Migrations gate, RLS hardening, validator severity audit
- `260519-pyx` — Restructurer 12→13 livrables Digi
- `260519-l1l` — L1/L2 Persona + Fiches (exception R3)
- `260519-dgh` — Reskin Digi-Hackathon
- `260519-onepagers` — One-pagers PDF cohorte
- `260519-smoke-prod-j1` — Smoke prod J-1
- `260519-tqd` — DB perf top-5 quick wins (pg_stat_statements)
- `260519-uuy` — UI/UX quick wins détail livrable + a11y

**Quicks Event live + Post-mortem** :
- Hotfix J1 `ad86675` — show past+today missions in Player journey
- `260520-124-jury-v1v3` — Jury V1+V3 (drag rotatif, verdict pills, brouillon)
- `260523-hhy-rls-announcements` — RLS announcements
- `260523-hjc-pilot-preflight-doc` — `docs/PILOT-PREFLIGHT.md` (réponse A1 post-mortem MCP tokens)
- `260523-kc2-advisors-fix` — Triple migration advisors D1+D2+D3 (26→12 security WARN, commits `0c44b31`/`2d09a52`/`fe30c6b`)

---

## 4. Requirements Coverage

**Pré-event (T-1)** :
- ✅ **DIGI-01** — 13 livrables seedés alignés 8 PDFs Welcome Guide
- ✅ **DIGI-02** — Exception R3 L2 hard-block (signée Omar 19/05)
- ✅ **DIGI-03** — Reskin Digi appliqué
- ✅ **DIGI-04** — One-pagers PDF cohorte imprimables (workflow permanent)
- ✅ **DIGI-05** — Smoke prod J-1 OK

**Pendant event** :
- ✅ **DIGI-06** — PROD stable J1-J3 (R1/R2/R3 préservées, 1 hotfix sans régression)
- ✅ **DIGI-07** — Hotfix protocol respecté (commit-direct-main + smoke)

**Post-event** :
- ⚠️ **DIGI-08** — Backfill pitch_scores + publish results (à exécuter)
- ⚠️ **DIGI-09** — Milestone audit v0.3 + archive (à exécuter, ce résumé est un input)

---

## 5. Key Decisions Log

| ID | Décision | Phase | Rationale |
|---|---|---|---|
| D-v03-01 | Mode T-1 quicks-only, no phases | Prep | Overhead planning incompatible avec event imminent |
| D-v03-02 | 13 livrables (vs 12) alignés 8 PDFs | Prep | Alignement contenu officiel partenaires |
| D-v03-03 | Exception R3 unique L2 hard-block | Prep | Pédagogique — pas de généralisation |
| D-v03-04 | Hotfix direct sur `main` pendant event | Live | Réactivité < 1h sur R1/R2/R3 |
| D-v03-05 | Approche A1 PILOT-PREFLIGHT (doc, no code) | Post-mortem | Cause MCP tokens = procédural, pas applicatif |
| D-v03-06 | Approche B1 Supabase Studio cleanup | Post-mortem | Schema drift mgmt-api = SQL snippets obsolètes |

---

## 6. Tech Debt & Deferred Items

**Surveillé pendant event (2 HARD ticks J1 10h37 + 10h52)** :
- Tokens Vercel + Supabase MCP expirés simultanément J1 → surveillance aveugle 3 jours malgré watcher actif. **Fix** : `docs/PILOT-PREFLIGHT.md` (livrée). Lifetime Supabase MCP token : ~1h empirique (commit `bd9a635`).

**Schema drift mgmt-api (B)** :
- ~12 patterns d'erreurs Postgres récurrentes (colonnes/relations/enums obsolètes) en spam constant pendant event, sources = SQL snippets Supabase Studio post-refactor 19/05. Cleanup à faire (B1) ou filtre watcher (B3 fallback).

**Backlog post-mortem (catégorie C+D non détaillées dans ce résumé)** :
- Voir `.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md` pour design A/B/C/D complet.

**Dette héritée v0.2** :
- `polish/design-v2-match` non mergé (commits `c1eca29`, `2864bd5`, `d269829`) — UPDATE SQL rétroactif PROD à exécuter au merge post-pilote.
- Tests automatisés / CI / observabilité structurée toujours absents (cohérent avec scope pilote).

**Welcome Guide PDF désync** :
- 8 PDFs Welcome Guide vs 7 ateliers programmés. Géré hors-code par coordination Omar.

---

## 7. Getting Started

**Run the project** :
- `npm run dev` → `http://localhost:3000` (dual-mode demo si pas d'env Supabase)
- `npm run typecheck && npm run lint && npm run build` avant tout merge

**Tests** : aucun runner configuré. Validation = smoke manuel (cf. `feedback_smoke_minimal_2p_1m_1gm.md` — format 2P+1M+1GM, 30-40 min).

**Key directories** :
- `app/` — routes App Router (player/mentor/admin/jury/results)
- `app/actions.ts` — toutes les server actions ("use server")
- `lib/types.ts` — single source of truth domaine
- `lib/seed/` — données demo + seed Digi-Hackathon
- `database/` — schema.sql → triggers.sql → rls.sql (ordre d'application)
- `.planning/quick/` — source de vérité travail v0.3 (chaque dossier = 5 artefacts)
- `.planning/post-mortem/` — design fixes v0.3 en cours
- `docs/PILOT-PREFLIGHT.md` — checklist J-2 pour prochain pilote

**Where to look first** :
- `CLAUDE.md` — règles cardinales R1/R2/R3 + pre-edit guards (lecture obligatoire)
- `.planning/PROJECT.md` — vision + scope cardinal v0.3
- `.planning/ROADMAP.md` — phases courantes + archive
- `.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md` — état actuel du post-mortem
- `database/seed_event_digi_hackathon.sql` — vérité 13 livrables seedés
- PROD : https://entrepreneur-game-six.vercel.app (22 auth.users Digi en place)

**Cardinal rules (rappel)** :
- **R1** : score visible Player **uniquement** sur détail livrable
- **R2** : validators **warn-only**, jamais bloquants
- **R3** : pas de blocage inter-mission codé en dur (**exception unique L2** signée Omar 19/05)

---

## Stats

- **Timeline** : 2026-05-12 → 2026-05-23 (event 20-22/05)
- **Phases** : 2/3 complete (Prep T-1 + Event live), Post-mortem in_progress
- **Quicks livrés** : ~28 (12/05 → 23/05)
- **Commits depuis archive v0.2** : 93
- **Files changed** : 403 (+22 688 / -1 146)
- **Contributors** : Omar Ameur (solo)
- **Event metrics terrain** : 121 ticks watcher (2 HARD · 35 WARN · 84 VERT) · 1 hotfix · 0 downtime · 0 data loss
