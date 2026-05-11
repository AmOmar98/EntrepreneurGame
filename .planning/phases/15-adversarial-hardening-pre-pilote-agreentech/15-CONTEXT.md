---
name: Phase 15 — Context (Adversarial Hardening Pré-Pilote AgreenTech)
phase: 15
slug: adversarial-hardening-pre-pilote-agreentech
gathered: 2026-05-11
status: ready-for-planning
mode: auto (--auto chain → /gsd-plan-phase 15 → /gsd-execute-phase 15)
scope_locked_by: owner Omar (réponse Q1 = "Edge cases data + concurrence" — 2026-05-11)
---

# Phase 15 : Adversarial Hardening Pré-Pilote AgreenTech — Context

**Date** : 2026-05-11 (T-2, J-2 du pilote)
**Cutoff** : `2026-05-12 23h00` (T-1, dernier moment merge main + redéploy Vercel)
**Cardinaux préservés** : R1 (score invisible Player), R2 (validators warn-only), R3 (pas de blocage codé en dur)

<domain>
## Phase Boundary

Phase 15 durcit l'application contre les **edge cases data** et **scénarios concurrence** qui pourraient corrompre l'état pédagogique pendant le pilote 13-14 mai (15 Players + 2-4 Mentors + 1 GameMaster simultanés). Le scope est **purement défensif** : audit + patches préventifs ciblés sur les surfaces déjà livrées (Phases 1-14), pas d'ajout de feature, pas de refonte profonde.

**Cinq axes d'attaque adversariale couverts :**

1. **Idempotence trigger Phase 14** — `recalc_player_engagement` (`database/migrations/202605110007_phase14_engagement_trigger.sql`) sous insert/update/delete répétés sur `submissions` et `evaluations`.
2. **RLS cross-cohort / cross-team** — un Player ne doit jamais voir submissions/evaluations d'un autre Player ni d'une autre cohorte (cf. `database/codebase/CONCERNS.md` §Pilot-grade RLS — known weak policies).
3. **Inputs adversariaux server actions** — `submitDeliverable` (`app/actions.ts:207`), `evaluateSubmission` (rubric 5×5=25), `submitPitchScore`, `claimBonusEventFlow` : URLs malformées, longueurs limite (textareas 4000 chars), scores hors-bornes coerced.
4. **Concurrence mentors / Players** — 2 mentors évaluant la même submission, Player soumettant V1+V2 quasi-simultanément, GameMaster publishing results pendant qu'un Player charge `/results`.
5. **Audit grep cardinaux R1/R2/R3 post-Phase 14** — vérifier que les badges qualitatifs engagement (cf. `components/engagement-milestones-card.tsx`) n'ont introduit aucune fuite de score numérique côté Player.

**Hors scope explicite :**
- Refonte RLS (sera Phase v0.3 post-pilote, cf. SEED-001).
- Ajout rate-limiting / Upstash (architectural, hors fenêtre T-2).
- Observability / Sentry / audit_log writes.
- Tests automatisés Vitest / Playwright en CI (jamais configuré, hors scope).
- Tout changement schéma DB (figé jusqu'au pilote).

</domain>

<decisions>
## Implementation Decisions

### Périmètre et timing
- **D-01:** Scope locked par owner 2026-05-11 = "Edge cases data + concurrence" (Q1 réponse). Aucune extension de scope acceptée jusqu'au cutoff `2026-05-12 23h00`.
- **D-02:** Patches **préventifs uniquement** — si un audit révèle un bug non-patcheable en <24h sans risque régression, on documente comme "known limitation pré-pilote" + SEED-002 v0.3, on ne le fixe pas dans Phase 15.
- **D-03:** Commits atomiques 1 sub-task = 1 commit, push immédiat origin main après `npm run typecheck && npm run lint && npm run build` clean (cf. CLAUDE.md §"Default = ship + push").

### Méthodologie d'audit
- **D-04:** Tests SQL idempotence Phase 14 = **scripts inline pgTAP-style** dans un fichier `scripts/test-engagement-trigger-idempotence.sql` (PROD-safe : wrapped dans `begin; ... rollback;`). Exécutable manuellement via Cloud Studio SQL Editor. Pas de framework pgTAP à installer.
- **D-05:** Audit RLS cross-cohort = **scripts SQL** `scripts/test-rls-cross-cohort.sql` simulant `set local role authenticated; set local request.jwt.claim.sub = '<player_uuid>'` pour 3 scénarios : P01→P02 submissions, P01→P02 evaluations, Mentor M01→submissions d'une autre cohorte. Verdict ALL PASS exigé.
- **D-06:** Tests adversariaux server actions = **fichier markdown** `scripts/adversarial-inputs-checklist.md` listant 15-20 vecteurs (URL `javascript:`, `ftp://`, 10k chars proofText, score=99 hors-bornes Zod, etc.) avec verdict attendu (rejet propre via WorkflowState ou Zod). Exécutable manuellement via curl ou DevTools.
- **D-07:** Audit concurrence mentors = **script SQL** simulant 2 evaluations insert simultanées via `pg_sleep + dblink` ou simplement 2 transactions parallèles dans 2 sessions psql, puis verification `recalc_player_engagement` cohérent.
- **D-08:** Audit grep R1 final = réutilisation de `scripts/audit-r1.sh` (commit `02c0798`) étendu pour couvrir `components/engagement-milestones-card.tsx` et `components/cohort-pulse-bar.tsx`.

### Surfaces sensibles à protéger
- **D-09:** Zones nécessitant `eic-pedagogical-advisor` avant tout edit (cf. CLAUDE.md §Pre-edit guards) : `app/actions.ts` (submitDeliverable, evaluateSubmission, submitPitchScore), `database/triggers.sql`, `database/migrations/202605110007_phase14_engagement_trigger.sql`, `lib/score.ts`, `components/engagement-milestones-card.tsx`, `app/results/page.tsx`.
- **D-10:** Aucun patch ne doit ajouter `redirect("/login")` ou `getCurrentUser()` avant un check `hasSupabaseEnv()` (cf. memory `feedback_dual_mode_demo_guard`). Régression interdite mode démo.

### Livrables Phase 15 (scope locked, 5 sub-tâches max)
- **D-11:** **15-01** — Test SQL idempotence trigger engagement (`scripts/test-engagement-trigger-idempotence.sql`) + procédure manuelle Cloud Studio. 5 scénarios minimum : insert duplicate submission, update verdict aller-retour validate→reject→validate, delete submission cascade, race re-eval same submission, backfill idempotent.
- **D-12:** **15-02** — Test SQL RLS cross-cohort (`scripts/test-rls-cross-cohort.sql`) + rapport `RLS-CROSS-COHORT-VERDICT.md` dans phase dir. Verdict PASS/FAIL par scénario. Si FAIL trouvé : patch RLS minimal ou documentation known limitation.
- **D-13:** **15-03** — Checklist adversariale inputs (`scripts/adversarial-inputs-checklist.md`) + exécution manuelle sur PROD avec compte test (P11 ou compte burner). Rapport `ADVERSARIAL-INPUTS-VERDICT.md` (PASS/FAIL par vecteur).
- **D-14:** **15-04** — Test concurrence mentors (`scripts/test-concurrent-evaluations.sql` ou script bash 2-sessions psql) + rapport `CONCURRENCE-VERDICT.md`.
- **D-15:** **15-05** — Audit grep R1/R2/R3 extension `scripts/audit-r1.sh` + commit + rapport `R1-AUDIT-PHASE14-EXTENSION.md` confirmant zéro fuite numérique côté Player.

### Claude's Discretion
- Choix exact des seuils de longueur pour vecteurs adversariaux (10k, 100k chars, etc.) — Claude décide selon limites Zod actuelles (4000 sur `proofText`, 2000 sur `feedback`, etc.).
- Choix exact des 15-20 vecteurs adversariaux dans la checklist — Claude génère depuis OWASP top 10 + adapté au stack Next.js/Supabase.
- Format précis des rapports verdict (markdown table vs liste) — uniformiser avec format existant (cf. `.planning/phases/13-*/SUMMARY.md`).

### Stop conditions (interrompre Phase 15)
- **D-16:** Si un FAIL critique RLS découvre une fuite cross-cohort active en PROD → STOP, escalade owner, décision go/no-go pilote.
- **D-17:** Si un patch nécessaire casse `npm run build` ou introduit régression cardinale R1/R2/R3 → revert immédiat, documenter known limitation, ne pas insister.
- **D-18:** Si l'horloge atteint `2026-05-12 22h00` avec sub-tâches non démarrées → arrêt phase, documenter restantes comme SEED-002 v0.3.

### Folded Todos
Aucun todo folded (Phase 15 démarrée sur demande directe owner, pas via backlog).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cardinaux EIC (R1/R2/R3)
- `CLAUDE.md` §"T-3 Critical Gates" et §"Pre-edit guards (zones sensibles)" — règles obligatoires + grep R1.
- `.claude/agents/eic-pedagogical-advisor.md` — agent à spawner avant tout edit zone sensible.

### Phases prérequises
- `.planning/phases/14-scoring-engagement-livrables/14-CONTEXT.md` — Q5=A réversibilité palier Validé (recalculable par trigger sur update verdict).
- `.planning/phases/14-scoring-engagement-livrables/SUMMARY.md` — 5 waves Phase 14 livrées, 175 pts max par livrable.
- `.planning/phases/13-smoke-completion-phase11-gates-bug-annexes/SUMMARY.md` — bug fixes logout type=button + Pouls L0, gates G2/G3 PASS.

### Audit et concerns existants
- `.planning/codebase/CONCERNS.md` — section "Pilot-grade RLS — known weak policies" (members_same_project_or_staff_select self-join bug, bootcamp_deliverables_all_authenticated_select cohort scoping faible), "XP triggers vs server-action math", "Test Coverage Gaps §Triggers / RLS / Server-action validation".

### Code surfaces ciblées
- `app/actions.ts:174-205` — `httpsUrl` Zod + `submissionSchema` superRefine.
- `app/actions.ts:207-340` — `submitDeliverable` (ownership check + duplicate block).
- `app/actions.ts:335-360` — `evaluateSubmission` schema (scores .min(0).max(25), expectedAction).
- `database/migrations/202605110007_phase14_engagement_trigger.sql` — fonction `recalc_player_engagement` + triggers `trg_submission_engagement` + `trg_evaluation_engagement`.
- `database/rls.sql` — toutes policies (à auditer en lecture, pas modifier).
- `database/schema.sql:95,179,199` — checks `^https://` côté SQL (défense en profondeur).
- `lib/score.ts` — `sumPlayerScoreEngagement` miroir TS du trigger (dual-mode parité).
- `scripts/audit-r1.sh` — script audit grep R1 Player-facing à étendre.

### Memory pertinente
- `feedback_eic_cardinal_rules.md` — R1/R2/R3 reformulées.
- `feedback_dual_mode_demo_guard.md` — jamais `redirect("/login")` avant `hasSupabaseEnv()`.
- `feedback_design_freeze_cardinal_first.md` — tout design audité R1/R2/R3 avant codage.
- `feedback_route_via_gsd.md` — toujours passer par GSD workflow, pas d'edit direct.

### TODO opérationnel pilote
- `TODO-TESTING.md` (racine repo) — checklist pré-pilote Omar (NE PAS doublonner ici, Phase 15 est code-side ; TODO-TESTING est ops-side).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/audit-r1.sh` (commit `02c0798`) — script grep automatisé sur surfaces Player-facing. Étendre pour Phase 14 badges + cohort-pulse-bar.
- `eic-pedagogical-advisor` agent (`.claude/agents/eic-pedagogical-advisor.md`) — à invoquer avant chaque edit zone sensible.
- `httpsUrl` Zod refinement (`app/actions.ts:174`) — déjà robuste contre `http://`, `javascript:`, `ftp://`. À tester comme baseline.
- Backfill idempotent dans migration Phase 14 (`do $$ ... for rec in select id from players ...`) — pattern réutilisable pour test re-run.
- `npx supabase` CLI scaffolding posé en Phase 8/9 (commit `d7b3e80`) — permet `supabase db push` pour appliquer scripts test SQL en PROD.

### Established Patterns
- **Server actions return `WorkflowState`** — adversarial inputs doivent retourner `{ ok: false, message }` (pas throw) — vérifier dans checklist.
- **Zod `safeParse` + early return** — aucune action ne doit jeter une exception sur input adversarial.
- **Triggers DB sont source de vérité** — toute math d'engagement passe par trigger, helper TS `sumPlayerScoreEngagement` est miroir lecture-seule.
- **RLS via helpers SQL `has_role(_role)` / `is_staff()`** — `security definer` functions, à auditer en lecture pour vérifier qu'elles narrowent correctement.
- **Demo-mode preservé** — chaque test doit également fonctionner en mode demo (sans Supabase env), Zod côté client/server identique.

### Integration Points
- `database/migrations/202605110007_phase14_engagement_trigger.sql` déjà appliqué en PROD (cf. `TODO-TESTING.md` pré-requis option A Cloud Studio).
- Cohorte AgreenTech : 11 comptes Players P01..P11 + 2 Mentors M01/M02 + 1 GameMaster G01 (cf. `cohorte-agreentech-creds.csv` gitignored, memory `reference_cohort_csvs`).
- Vercel deploy auto sur push main — chaque commit Phase 15 redéploie. Monitoring runtime logs 30 min post-commit recommandé.
- Supabase project `vzzbjxmfkmvqkaqxalhr` — URL Cloud Studio SQL Editor : `https://supabase.com/dashboard/project/vzzbjxmfkmvqkaqxalhr/sql/new`.

</code_context>

<specifics>
## Specific Ideas

- **Scénario "race deux mentors"** : reproduire le cas où M01 et M02 ouvrent simultanément `/mentor/submission/[id]` puis cliquent "Évaluer" à <1s d'intervalle. Vérifier : (a) aucune duplicate evaluation (unique constraint ?), (b) `recalc_player_engagement` recalcule sur le verdict le plus récent (Q5=A), (c) UI mentor affiche feedback approprié si conflit.
- **Scénario "v2 après reject"** : Player soumet V1 → Mentor reject_v1 → Player soumet V2 → Mentor validate_v2. Vérifier paliers engagement : Soumis (+100, irréversible) + Reviewed (+25, irréversible) + Validé (+50, recalculé sur dernier verdict = validate_v2) = 175 pts.
- **Scénario "Player tente déboucher V1 lockée"** : POST direct sur `submitDeliverable` avec deliverableTemplateId d'un livrable déjà submitted_v1. Vérifier message d'erreur explicite (déjà couvert `actions.ts:268-272`).
- **Vecteur "URL data:text/html"** : `data:text/html,<script>alert(1)</script>` doit être rejeté par `httpsUrl` (refine `startsWith("https://")`). À vérifier.
- **Vecteur "SSRF localhost"** : `https://127.0.0.1:8080/admin`, `https://169.254.169.254/latest/meta-data/` — actuellement acceptés par `httpsUrl` mais jamais fetched server-side (cf. CONCERNS §`logo_url` SSRF). Documenter known limitation.

</specifics>

<deferred>
## Deferred Ideas

### Reportées v0.3 (post-pilote)
- **Refonte RLS multi-tenant** — fix `members_same_project_or_staff_select` self-join bug, tighten cohort scoping sur `bootcamp_deliverables` et `missions`. Hors fenêtre T-2.
- **Rate limiting Upstash sur server actions** — `submitDeliverable`, `evaluateSubmission`, `claimBonusEventFlow`. Architectural, post-pilote.
- **Observability Sentry + audit_log writes** — table `audit_log` existe mais vide. Hors fenêtre T-2.
- **Tests automatisés CI** — Vitest pour `lib/score.ts`, Playwright pour smoke E2E, pgTAP pour triggers + RLS. Bloqué par absence framework (CONCERNS §Missing Critical Features).
- **SSRF allowlist server-side** — actuellement aucun fetch server-side des `logo_url` / `doc_url`, donc pas exploitable. À auditer si Phase v0.3 ajoute du fetch côté serveur.
- **Lockfile-strict CI + pin lucide-react / typescript versions** — CONCERNS §Dependencies at Risk. Post-pilote.

### Note pour v0.3 roadmap
- Créer **SEED-002 Adversarial Hardening v0.3** récapitulant : RLS multi-tenant refonte + rate-limiting + observability + tests CI. À planter dans `.planning/seeds/` à la fin de Phase 15 si pas déjà fait.

</deferred>

---

*Phase: 15-adversarial-hardening-pre-pilote-agreentech*
*Context gathered: 2026-05-11 (auto-mode --auto)*
*Scope verrouillé par owner Q1 = "Edge cases data + concurrence"*
*Cutoff strict : 2026-05-12 23h00*
