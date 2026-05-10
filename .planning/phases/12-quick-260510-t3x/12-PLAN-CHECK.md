# Phase 12 — PLAN-CHECK Report

**Date** : 2026-05-10 — **Phase** : 12-quick-260510-t3x
**Plans audités** : 11 (12-01..03, 05..12 ; plan 04 absorbé dans 01)

---

## 1. Frontmatter completeness — **PASS**
Les 11 plans déclarent `phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `requirements`, `must_haves.{truths,artifacts,key_links}`. Plan 12 `files_modified: []` cohérent (smoke-only). Requirements `T3X-EXPANSION-*` uniques.

## 2. Wave dependency graph — **PASS**
Acyclique : W0 (01) → W1 (02, 03) → W2 (05, 06, 07) → W3 (08, 09, 10) → W4 (11, 12). Chaque wave > max(deps wave). Plan 04 absent justifié explicitement.

## 3. Acceptance criteria specificity — **PASS**
Truths vérifiables via `Select-String`, `Test-Path`, `npm run typecheck/lint/build`, `git log/diff`, `Compare-Object`. Aucune formulation subjective. Plan 12 inclut audit runtime DevTools + RLS isolation cross-team.

## 4. Files_modified vs CONTEXT.md `<specifics>` — **WARN**
3 fichiers du `<specifics>` absents des `files_modified` agrégés : `database/schema.sql`, `database/triggers.sql`, `database/rls.sql`. Divergence intentionnelle (freeze SEED-001 explicite Plans 02/03), mais CONTEXT.md trompeur.
**Fix** : mettre à jour CONTEXT.md `<specifics>` post-exécution.

## 5. R1/R2/R3 cardinal preservation — **PASS**
- **R1** enforced plans 02 (DDL CHECK), 05 (JSDoc), 07 (`hasActiveBonus` boolean), 08/09/10 (grep tests 0 hit), 12 (audit runtime).
- **R2** zod safeParse + WorkflowState systématique ; warn-only suffix `submitMoscowDeliverableFlow` ; DDL CHECK = invariants légitimes.
- **R3** `disabled={pending}` uniquement sur submit buttons ; ProofWorkflow fallback préservé plan 10 task 7 ; bonus optionnel.

## 6. Goal-backward (7 success criteria ROADMAP) — **PASS**
(1) Wave 0 → Plan 01 ; (2) migrations → 02, 03 ; (3) types/actions/score → 05, 06, 07 ; (4) UI/routes → 08, 09, 10 ; (5) CSV+smoke → 11, 12 ; (6) audit R1 → 08, 09, 10, 12 ; (7) typecheck/lint/build → tous (acceptance_criteria).

## 7. Risk surface T-3 — **WARN**
- Plan 09 inclut `npm run build` gate ✓ + stratégie `--legacy-peer-deps`/`overrides` couverte.
- Plan 12 cutoff défini, aucun rollback automatique (freeze override explicite).
- Plan 01 absorbe refonte 12-slides → diff ~411 ins / 130 del ; checkpoint humain mitige.
- Plan 10 Task 7 surface `<MoscowKanban>` conditionnellement → résout BLOCKER revision précédent ✓.
- Plan 11 typage TS `ord: number` vs DDL `smallint` — coercion mineure.

**Fix** : créer tag `v0.2.X-pre-phase12` AVANT Plan 01.

## 8. Schema push gate — **BLOCK**
**Plans 02 et 03 créent les fichiers SQL mais ne les appliquent pas.** L'apply est différé jusqu'à **Plan 12 Task 1** (Wave 4), après ~9 plans supposant les tables présentes.

Conséquences :
- Plans 06/09/10 compilent (TS) mais tout `npm run dev` entre W2 et W4 → `relation "public.bonus_events" does not exist`.
- `npm run build` ne détecte pas l'absence runtime (build statique Next).
- Smoke E2E Plan 12 = premier moment de découverte régressions runtime — trop tard à T-3.

**Fix BLOCK** : insérer task `[BLOCKING]` apply migrations à la fin de Wave 1 (Plans 02/03 Task 4 ou Plan 04bis). Acceptance : `supabase db push` ou `psql -f` + `\dt` + idempotency re-run.

**Mitigation acceptable** si owner refuse : instruction explicite dans Plan 06 `<read_first>` + Plan 09 Task 1 acceptance "Apply migrations before `npm run dev`". Actuellement absent.

---

## Verdict global : **READY-WITH-NOTES** (bordering BLOCK sur dim. 8)

Plans solides, dépendances correctes, R1/R2/R3 préservés, goal-backward couvert. Faille unique : absence de gate Supabase apply entre Wave 1 et Wave 2.

### Punch list avant `/gsd-execute-phase 12` :

1. **Apply migrations gate** post Plan 03 : Task 4 (02+03) ou Plan 04bis avec `supabase db push` + `\dt` + idempotency.
2. **Tag pre-phase** : `git tag v0.2.X-pre-phase12 && git push --tags`.
3. **CONTEXT.md `<specifics>`** : retirer `schema.sql`/`triggers.sql`/`rls.sql`.
4. **Doc `--legacy-peer-deps`** Plan 09 si overrides : tracer CLAUDE.md ops.

Si owner accepte risque : exécuter 01→03, stopper, apply migrations manuel (procédure Plan 12 Task 1), reprendre 05+. Smoke local après chaque wave.
