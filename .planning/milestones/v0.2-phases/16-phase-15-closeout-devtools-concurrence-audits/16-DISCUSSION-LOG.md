# Phase 16 : Phase 15 Closeout — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date :** 2026-05-11
**Phase :** 16-phase-15-closeout-devtools-concurrence-audits
**Mode :** `--auto` (Claude picks recommended defaults, no interactive AskUserQuestion)
**Areas discussed :** Exécution option, Timing, Tooling 16-01, Tooling 16-02, Comptes test, Verdict aggregation, Scope/régression, Plan-checker

---

## G1 — Exécution option (A formal plan / B ops direct / C defer)

| Option | Description | Selected |
|--------|-------------|----------|
| A — Plan formel GSD | `/gsd-plan-phase 16 --auto` puis exécution wave-based | |
| B — Exécution ops directe | Audit manuel + update verdict markdowns + 1-2 commits | ✓ |
| C — Defer post-pilote v0.3 | Absorber SEED-002 v0.3 milestone | (fallback) |

**Choix auto :** Option B
**Justification :** Marquée "recommandée" dans CONTEXT.md original. 2 audits manuels read-only avec verdict skeletons déjà préparés Phase 15 = overhead PLAN.md + plan-checker non justifié pour T-2 windowing.

---

## G2 — Timing (pre-pilote 12/05 23h00 / post-pilote v0.3)

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-pilote | Fenêtre 11/05 → 12/05 23h00, profiter cutoff souple | ✓ |
| Post-pilote v0.3 | Absorber milestone post 14/05 si fenêtre fermée | (fallback) |

**Choix auto :** Tentative pre-pilote, fallback v0.3 explicite
**Justification :** Cohérent avec "cutoff souple" CONTEXT.md ; non-bloquant pilote 13-14/05 (Phase 15 a sécurisé 3/5 axes critiques).

---

## G3 — Tooling 16-01 adversarial inputs

| Option | Description | Selected |
|--------|-------------|----------|
| DevTools Network Edit & Replay | Chrome DevTools sur session Player P11 authentifiée | ✓ |
| curl + session cookies | Extraction cookies puis scripting bash | (fallback) |
| Postman | Import collection + session manuelle | |

**Choix auto :** DevTools Edit & Replay
**Justification :** Recommandé par scripts/adversarial-inputs-checklist.md Phase 15. Debug visuel rapide, accès direct payload + response. Fallback curl si Edit&Replay limité sur certains vecteurs.

---

## G4 — Tooling 16-02 concurrence

| Option | Description | Selected |
|--------|-------------|----------|
| Cloud Studio 2 onglets SQL | Supabase web UI, deux onglets parallèles | ✓ |
| 2 terminaux psql parallèles | `psql $DATABASE_URL` x2 local | (fallback) |
| pgbench scénario | Load test via pgbench scripts | |

**Choix auto :** Cloud Studio 2 onglets
**Justification :** Plus accessible (pas de psql local requis). Fallback explicite vers psql si Cloud Studio session-isolation insuffisante pour reproduire vraie race.

---

## G5 — Comptes test à utiliser

| Option | Description | Selected |
|--------|-------------|----------|
| P11 swarm (16-01) | Compte Player swarm Phase 14, déjà créé en Supabase | ✓ |
| M01 + M02 swarm (16-02) | Comptes Mentor swarm pour race insert evaluations | ✓ |
| Vrais porteurs/mentors cohorte | NON — cohorte production isolée | |
| GameMaster | NON — pas pertinent pour 16-01/16-02 | |

**Choix auto :** P11 (16-01) + M01/M02 (16-02)
**Justification :** Comptes swarm créés Phase 14 spécifiquement pour smoke + tests. Credentials dans `cohorte-agreentech-creds.csv` (gitignored).

---

## G6 — Verdict aggregation (où écrire ?)

| Option | Description | Selected |
|--------|-------------|----------|
| Update verdict markdowns Phase 15 dir | Compléter `ADVERSARIAL-INPUTS-VERDICT.md` + `CONCURRENCE-VERDICT.md` skeletons | ✓ |
| Nouveaux fichiers dans Phase 16 dir | Créer copies dans `phases/16-*` | |
| Les deux (duplication) | Phase 15 + Phase 16 | |

**Choix auto :** Update Phase 15 dir
**Justification :** Cohérent M1/M2 héritées + traçabilité chronologique Phase 15 closeout. Phase 16 dir reste minimaliste (CONTEXT + DISCUSSION-LOG + optionnel SUMMARY).

---

## G7 — Scope code edits

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only audits uniquement | Zéro edit `app/`, `lib/`, `components/`, `database/` | ✓ |
| Fix unilatéral si FAIL trouvé | Claude patche directement | |
| Escalade owner D-16/D-17 si FAIL critique | Pas de fix unilatéral, alert Omar | ✓ |

**Choix auto :** Read-only + escalade owner si FAIL critique
**Justification :** M3 héritage Phase 15 explicite. Préserve cardinaux R1/R2/R3 (aucun edit Player-facing).

---

## G8 — Plan-checker / verification phase

| Option | Description | Selected |
|--------|-------------|----------|
| Skip plan-checker | Option B = pas de PLAN.md donc rien à check | ✓ |
| Lancer plan-checker quand même | Forcer GSD verification phase | |
| Mini-VERIFICATION.md manuel | Omar écrit verdict global lui-même post-run | (optionnel) |

**Choix auto :** Skip plan-checker
**Justification :** Cohérent Option B (D-16-01). VERIFICATION optionnelle déléguée Omar si SUMMARY Phase 16 souhaité.

---

## Claude's Discretion (zones où Omar laisse Claude décider)

- Format final SUMMARY Phase 16 si écrit (markdown libre, table récap PASS/FAIL global)
- Ordre d'exécution 16-01 vs 16-02 (selon dispo Omar : DevTools session ouverte → 16-01 prio, Cloud Studio prêt → 16-02 prio)
- Recouvrement texte avec Phase 15 verdicts (pas obligatoire de re-citer, simple `Cross-réf` suffit)
- Choix entre 1 commit final vs 2 commits atomiques (1 par verdict)

---

## Deferred Ideas (mentionnés mais hors scope Phase 16)

Tous hérités Phase 15 — voir `15-CONTEXT.md` §deferred :
- Refonte RLS multi-tenant → SEED-002 v0.3
- Rate limiting Upstash → v0.3
- Tests automatisés CI → v0.3
- Mitigation S4 timestamp tie-break trigger Phase 14 → v0.3
- CONCERNS.md update terminologie "projects" obsolète → v0.3
- SSRF allowlist server-side → v0.3
- Lockfile-strict CI + pin lucide-react/typescript → v0.3

---

*Auto-mode pass : 2026-05-11 — 8 gray areas résolues sans interaction. CONTEXT.md mis à jour avec `<decisions>` D-16-01..D-16-16 + `<canonical_refs>` + `<code_context>` standardisés GSD.*
