---
name: Phase 16 — Context (Phase 15 Closeout — DevTools-side + concurrence audits)
phase: 16
slug: phase-15-closeout-devtools-concurrence-audits
gathered: 2026-05-11
status: ready-for-planning (or direct ops execution)
source: décision owner 2026-05-11 — défer les 2 audits Phase 15 non-exécutables via MCP SQL en une Phase 16 dédiée
---

# Phase 16 : Phase 15 Closeout — DevTools-side + concurrence audits

**Date création** : 2026-05-11 (post Phase 15 partial-complete)
**Cutoff souple** : idéalement avant pilote 13/05 8h30, sinon absorbé post-pilote v0.3
**Cardinaux préservés** : R1/R2/R3 — aucun edit code applicatif prévu, audits read-only

<domain>
## Phase Boundary

Phase 16 complète les 2 audits Phase 15 que Claude Code n'a pas pu exécuter via MCP Supabase (mono-session SQL) :

1. **15-03 → 16-01** : Checklist adversariale 20 vecteurs POST sur `submitDeliverable` / `evaluateSubmission` / `submitPitchScore` avec session P11 authentifiée. Test via DevTools (Network → Edit & Replay) ou curl avec cookies de session Supabase Auth.

2. **15-04 → 16-02** : Test concurrence mentors via 2 sessions psql parallèles (vraies race conditions sur evaluations + recalc_player_engagement trigger). Cloud Studio multi-onglets, ou 2 terminaux psql, ou pgbench scénario.

**Hors scope** : pareil que Phase 15 — pas de patches code applicatif spontanés. Si FAIL critique trouvé → escalade owner (D-16/D-17 Phase 15 héritées).
</domain>

<artifacts_existants>
## Artefacts existants (depuis Phase 15)

- `scripts/adversarial-inputs-checklist.md` — 20 vecteurs V-01..V-20 documentés (commit `3081233`)
- `scripts/test-concurrent-evaluations.sql` — 3 scénarios concurrence (commit `301ab43`)
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/ADVERSARIAL-INPUTS-VERDICT.md` — skeleton à remplir
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/CONCURRENCE-VERDICT.md` — skeleton à remplir

**Phase 16 ne crée AUCUN nouveau script** — c'est de l'exécution pure des artefacts Phase 15 + remplissage des 2 verdict markdowns.
</artifacts_existants>

<options_execution>
## Options d'exécution

**Option A — Plan formel GSD (`/gsd-plan-phase 16 --auto`)**
- Pros : traçabilité GSD complète, plan-checker verification, must_haves explicit.
- Cons : overhead pour 2 audits manuels (création PLAN.md + verdict + commit chain).

**Option B — Exécution ops directe (recommandée pour T-2)**
- Lancer les 2 audits manuellement quand Omar a une session DevTools + 2 onglets Cloud Studio dispos.
- Mettre à jour les 2 verdict markdowns (déjà dans phase 15 dir).
- 1 commit final `docs(16): close Phase 15 deferred audits — ADV/CON verdicts filled`.

**Option C — Defer post-pilote v0.3**
- Si la fenêtre T-2 → 12/05 23h00 ne permet pas, absorber dans SEED-002 v0.3 milestone post-pilote.
- Risque accepté : pas de validation empirique concurrence/adversariale avant pilote, mais Phase 15 a déjà sécurisé 3/5 axes critiques (idempotence trigger, RLS cross-cohort, audit R1 cardinale).
</options_execution>

<must_haves>
## Must-haves (héritées Phase 15 D-11..D-15)

- **M1** : `ADVERSARIAL-INPUTS-VERDICT.md` rempli avec PASS/FAIL par vecteur (≥15/20 PASS attendu, 4 KNOWN limitations SSRF/transitions/freeze).
- **M2** : `CONCURRENCE-VERDICT.md` rempli avec PASS/FAIL pour 3 scénarios (race insert eval, V1+V2 concurrence, deadlock detection).
- **M3** : Aucun edit code applicatif (`app/`, `lib/`, `components/`, `database/`) sauf si FAIL critique + escalade owner.
- **M4** : Commits atomiques + push origin main.
- **M5** : Zéro régression `npm run typecheck && lint && build` (devrait rester vert vu zéro edit code).
</must_haves>

<deferred>
## Deferred Ideas (héritées Phase 15)

- Refonte RLS multi-tenant (SEED-002 v0.3)
- Rate limiting Upstash (v0.3)
- Tests automatisés CI (v0.3)
- Mitigation S4 timestamp tie-break trigger Phase 14 (v0.3 — voir IDEMPOTENCE-VERDICT.md §Warning S4)
- CONCERNS.md update (terminologie "projects" obsolète — voir RLS-CROSS-COHORT-VERDICT.md §Findings annexes)
- SSRF allowlist server-side (v0.3)
- Lockfile-strict CI + pin lucide-react/typescript (v0.3)
</deferred>

## Cross-références

- Phase 15 SUMMARY : `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/15-01-SUMMARY.md`
- Phase 15 VERIFICATION : `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/15-VERIFICATION.md`
- Phase 15 HUMAN-UAT : `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/15-HUMAN-UAT.md` (status: resolved, deferred_to: phase-16)
- Verdict skeletons à remplir : `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/{ADVERSARIAL-INPUTS,CONCURRENCE}-VERDICT.md`
- Cardinaux : `CLAUDE.md` §"Pre-edit guards"
