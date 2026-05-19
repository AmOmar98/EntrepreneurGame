---
name: Phase 16 — Context (Phase 15 Closeout — DevTools-side + concurrence audits)
phase: 16
slug: phase-15-closeout-devtools-concurrence-audits
gathered: 2026-05-11
updated: 2026-05-11 (--auto pass: gray areas auto-resolved)
status: ready-for-execution (Option B — direct ops, no formal PLAN.md)
source: décision owner 2026-05-11 — défer les 2 audits Phase 15 non-exécutables via MCP SQL en une Phase 16 dédiée
---

# Phase 16 : Phase 15 Closeout — DevTools-side + concurrence audits

**Date création** : 2026-05-11 (post Phase 15 partial-complete)
**Cutoff souple** : pré-pilote 12/05 23h00 souhaité, fallback post-pilote v0.3 si fenêtre fermée
**Cardinaux préservés** : R1/R2/R3 — aucun edit code applicatif prévu, audits read-only

<domain>
## Phase Boundary

Phase 16 complète les 2 audits Phase 15 que Claude Code n'a pas pu exécuter via MCP Supabase (mono-session SQL) :

1. **15-03 → 16-01** : Checklist adversariale 20 vecteurs POST sur `submitDeliverable` / `evaluateSubmission` / `submitPitchScore` avec session P11 authentifiée. Test via DevTools (Network → Edit & Replay) ou curl avec cookies de session Supabase Auth.

2. **15-04 → 16-02** : Test concurrence mentors via 2 sessions SQL parallèles (vraies race conditions sur evaluations + recalc_player_engagement trigger). Cloud Studio multi-onglets, ou 2 terminaux psql, ou pgbench scénario.

**Hors scope** : pareil que Phase 15 — pas de patches code applicatif spontanés. Si FAIL critique trouvé → escalade owner (D-16/D-17 Phase 15 héritées).

</domain>

<decisions>
## Implementation Decisions (auto-résolues 2026-05-11)

### Exécution & Tooling
- **D-16-01** : **Option B retenue** — Exécution ops directe, pas de PLAN.md formel GSD. Justification : 2 audits manuels read-only avec verdict skeletons déjà créés en Phase 15 ; overhead plan-checker non justifié pour T-2 windowing.
- **D-16-02** : Tooling 16-01 = **DevTools Network → Edit & Replay** sur session Chrome P11 authentifiée. Fallback : curl avec cookies `sb-access-token` + `sb-refresh-token` extraits via DevTools Application.
- **D-16-03** : Tooling 16-02 = **Supabase Cloud Studio 2 onglets SQL** parallèles (pas de psql local). Fallback : 2 terminaux `psql $DATABASE_URL` si Cloud Studio session-isolation insuffisante pour reproduire race.

### Comptes test
- **D-16-04** : 16-01 Player POST → compte **P11** (cohorte AgreenTech swarm, créé Phase 14 — credentials dans `cohorte-agreentech-creds.csv` gitignored).
- **D-16-05** : 16-02 Mentor concurrence → **M01 + M02** swarm (race insert evaluations + trigger `recalc_player_engagement` sur même `submission_id`).
- **D-16-06** : Aucun test contre comptes vrais porteurs/mentors (cohorte production isolée).

### Critères PASS/FAIL
- **D-16-07** : **M1 (héritage Phase 15)** — `ADVERSARIAL-INPUTS-VERDICT.md` rempli avec PASS/FAIL par vecteur. Seuil acceptable : ≥15/20 PASS, jusqu'à 4 KNOWN limitations documentées (SSRF allowlist, transitions étapes, freeze fenêtres).
- **D-16-08** : **M2 (héritage Phase 15)** — `CONCURRENCE-VERDICT.md` rempli avec PASS/FAIL pour 3 scénarios (race insert eval mentor concurrent, V1+V2 même submission, deadlock detection trigger XP recalc).
- **D-16-09** : FAIL critique = escalade owner immédiate via D-16/D-17 Phase 15 héritées (pas de fix code unilatéral).

### Scope & Régression
- **D-16-10** : **M3** — Zéro edit code applicatif (`app/`, `lib/`, `components/`, `database/`). Seuls fichiers autorisés : 2 verdict markdowns + (optionnel) nouveau `16-SUMMARY.md` si Omar veut traçabilité finale.
- **D-16-11** : **M5** — `npm run typecheck && lint && build` doit rester vert (vu zéro edit code, automatique).
- **D-16-12** : Pas de smoke E2E re-run — Phase 13/14 ont déjà couvert régression fonctionnelle.

### Verdict aggregation
- **D-16-13** : Les 2 verdicts s'écrivent **dans le dossier Phase 15** (`.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/{ADVERSARIAL-INPUTS,CONCURRENCE}-VERDICT.md`), pas dans Phase 16. Phase 16 dir reste minimaliste (CONTEXT + DISCUSSION-LOG + éventuellement SUMMARY).
- **D-16-14** : Commit unique final `docs(16): close Phase 15 deferred audits — ADV/CON verdicts filled` (chain : 1-2 commits atomiques max).

### Timing
- **D-16-15** : **Tentative pre-pilote** dans fenêtre 11/05 → 12/05 23h00 si Omar a 1-2h DevTools + Cloud Studio dispos. **Fallback explicite** : si fenêtre fermée → absorbé SEED-002 v0.3 milestone post-pilote 14/05 soir.
- **D-16-16** : Pas de bloquage pilote 13-14/05 — Phase 15 a déjà sécurisé 3/5 axes critiques (idempotence trigger, RLS cross-cohort, R1 cardinale).

### Claude's Discretion
- Format final SUMMARY Phase 16 : libre (markdown court avec table récap PASS/FAIL global + lien vers 2 verdicts Phase 15).
- Ordre d'exécution 16-01 vs 16-02 : Claude décide selon dispo Omar (DevTools session ouverte vs Cloud Studio).
- Recouvrement avec Phase 15 IDEMPOTENCE/RLS/R1 : pas obligatoire de re-citer, simple `Cross-réf` suffit.

### Folded Todos
Aucun todo backlog folded — Phase 16 strictement scoped à Phase 15 closeout.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (executor ops, ou Omar manual) MUST read these before executing audits.**

### Phase 15 héritage (artefacts source)
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/15-CONTEXT.md` — décisions D-01..D-15 Phase 15 (héritage scope, must-haves, deferred ideas)
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/15-01-PLAN.md` — plan Phase 15 complet (incluant 15-03/15-04 originaux)
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/15-01-SUMMARY.md` — résumé exécution Phase 15 (3/5 PASS)
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/15-HUMAN-UAT.md` — items déférés status `resolved → phase-16`

### Scripts audit prêts à exécuter
- `scripts/adversarial-inputs-checklist.md` — 20 vecteurs V-01..V-20 documentés (commit `3081233` / `f4cf557`) — **input pour 16-01**
- `scripts/test-concurrent-evaluations.sql` — 3 scénarios concurrence SQL ready-to-run (commit `301ab43`) — **input pour 16-02**

### Verdict skeletons à remplir (output target)
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/ADVERSARIAL-INPUTS-VERDICT.md` — skeleton 20 lignes PASS/FAIL/KNOWN, à compléter par 16-01
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/CONCURRENCE-VERDICT.md` — skeleton 3 scénarios PASS/FAIL, à compléter par 16-02

### Cardinaux & cross-réf
- `CLAUDE.md` §"Pre-edit guards" — règles cardinales R1/R2/R3 (Phase 16 read-only donc pas d'edit côté Player, mais R3 vérifiable via 20 vecteurs)
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/R1-AUDIT-PHASE14-EXTENSION.md` — précédent R1 audit Phase 15
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/IDEMPOTENCE-VERDICT.md` — précédent verdict format à imiter
- `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/RLS-CROSS-COHORT-VERDICT.md` — précédent verdict format

### Credentials swarm (gitignored, root)
- `cohorte-agreentech-creds.csv` — comptes P01..P11 + M01/M02 + GM Supabase swarm Phase 14 (P11 utilisé 16-01, M01/M02 utilisés 16-02)

### Roadmap
- `.planning/ROADMAP.md` §"Phase 16" (lignes 552-560) — définition phase + dependencies + plans status

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`scripts/adversarial-inputs-checklist.md`** — 20 vecteurs déjà documentés (URL malformées, longueurs limite, transitions interdites, XSS, IDOR, etc.). Phase 16 exécute, n'ajoute pas.
- **`scripts/test-concurrent-evaluations.sql`** — 3 transactions SQL multi-session pré-rédigées (insert race, V1+V2 same submission, trigger deadlock test). Phase 16 lance, n'ajoute pas.
- **Verdict template format** — `IDEMPOTENCE-VERDICT.md` + `RLS-CROSS-COHORT-VERDICT.md` Phase 15 montrent le format markdown attendu (header, table résultats, KNOWN limitations annexes).

### Established Patterns
- **Verdict markdown format** : 1 fichier par audit, header YAML (status, executor, date), table résultats PASS/FAIL, section Findings, section KNOWN limitations, section Recommandations.
- **Phase 16 dir minimalist** : CONTEXT + DISCUSSION-LOG + optionnel SUMMARY ; verdicts vivent dans Phase 15 dir (héritage, traçabilité chronologique).
- **Commits atomiques** : 1 commit par verdict rempli + 1 commit SUMMARY = max 3 commits Phase 16.

### Integration Points
- **Server actions cibles 16-01** : `app/actions.ts:submitDeliverableFlow`, `evaluateSubmissionFlow` (alias mentor), `submitPitchScoreFlow` — endpoints POST testés via DevTools Replay.
- **Triggers cibles 16-02** : `database/triggers.sql:recalc_player_engagement` + `evaluations` table contraintes uniques (lecture seule).
- **Auth Supabase** : session P11/M01/M02 obtenue via `/login` UI (pas API direct) → DevTools extrait cookies `sb-access-token` + `sb-refresh-token` pour curl fallback.
- **MCP Supabase** : ne peut PAS exécuter 16-02 (limitation mono-session déjà documentée Phase 15). DOIT utiliser Cloud Studio multi-onglets ou psql.

</code_context>

<specifics>
## Specific Ideas (du discuss original Phase 16)

- "Pas de plan formel pour 2 audits manuels" — décision owner explicite, cohérent avec convention quick orchestrator (<2 commits = pas de phase formelle).
- "Verdicts dans Phase 15 dir, pas dans Phase 16" — préserve cohérence Phase 15 closeout narrative.
- "Tentative pre-pilote, fallback v0.3" — pas de blocage pilote 13/05, Phase 15 a déjà sécurisé l'essentiel.
- "Escalade FAIL critique D-16/D-17 héritées Phase 15" — pas de fix code unilatéral Claude.

</specifics>

<options_execution>
## Options d'exécution (rappel — Option B locked auto)

**~~Option A — Plan formel GSD~~** (`/gsd-plan-phase 16 --auto`)
- Pros : traçabilité GSD complète, plan-checker verification, must_haves explicit.
- Cons : overhead pour 2 audits manuels (création PLAN.md + verdict + commit chain).
- **Auto-rejected** : overhead non justifié T-2.

**Option B — Exécution ops directe ✅ LOCKED**
- Lancer les 2 audits manuellement quand Omar a une session DevTools + 2 onglets Cloud Studio dispos.
- Mettre à jour les 2 verdict markdowns (déjà dans phase 15 dir).
- 1-2 commits final `docs(16): close Phase 15 deferred audits — ADV/CON verdicts filled`.

**~~Option C — Defer post-pilote v0.3~~**
- **Auto-relégué en fallback** de B. Si fenêtre 11/05 → 12/05 23h00 fermée → absorbé SEED-002 v0.3.

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

### Reviewed Todos (not folded)
Aucun todo backlog matched Phase 16 scope (audits hyper-ciblés Phase 15 closeout).

</deferred>

## Cross-références

- Phase 15 SUMMARY : `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/15-01-SUMMARY.md`
- Phase 15 VERIFICATION : `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/15-VERIFICATION.md`
- Phase 15 HUMAN-UAT : `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/15-HUMAN-UAT.md` (status: resolved, deferred_to: phase-16)
- Verdict skeletons à remplir : `.planning/phases/15-adversarial-hardening-pre-pilote-agreentech/{ADVERSARIAL-INPUTS,CONCURRENCE}-VERDICT.md`
- Cardinaux : `CLAUDE.md` §"Pre-edit guards"

---

*Phase: 16-phase-15-closeout-devtools-concurrence-audits*
*Context gathered: 2026-05-11*
*Auto-pass: 2026-05-11 — 8 gray areas résolues (G1..G8) avec defaults recommandés*
