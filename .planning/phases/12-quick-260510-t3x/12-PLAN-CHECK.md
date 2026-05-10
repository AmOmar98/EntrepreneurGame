# Phase 12 — PLAN-CHECK Report

**Date** : 2026-05-10 — **Phase** : 12-quick-260510-t3x
**Plans audités** : 12 (12-01..03, 04, 05..12 ; plan 04 = `apply-migrations-gate` ajoute via patch 260510-rxa, n'est plus "absorbe dans 01")
**Patch 2026-05-10 (quick 260510-rxa)** : BLOCK dim. 8 résolu via insertion Plan 12-04 `apply-migrations-gate` (Wave 1.5, depends_on [12-02, 12-03], type checkpoint:human-verify blocking). Verdict global passe de **READY-WITH-NOTES (bordering BLOCK)** → **READY**. Voir §8 ci-dessous + `.planning/quick/260510-rxa-patcher-block-dim-8-schema-apply-gate-ph/`.

---

## 1. Frontmatter completeness — **PASS**
Les 11 plans déclarent `phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `requirements`, `must_haves.{truths,artifacts,key_links}`. Plan 12 `files_modified: []` cohérent (smoke-only). Requirements `T3X-EXPANSION-*` uniques.

## 2. Wave dependency graph — **PASS** (mise a jour patch 260510-rxa)
Acyclique : W0 (01) → W1 (02, 03) → **W1.5 (04 apply-migrations-gate, blocking)** → W2 (05, 06, 07) → W3 (08, 09, 10) → W4 (11, 12). Chaque wave > max(deps wave).

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

## 8. Schema push gate — **FIXED via Plan 12-04** (etait BLOCK)
**Plans 02 et 03 créent les fichiers SQL mais ne les appliquent pas.** L'apply est différé jusqu'à **Plan 12 Task 1** (Wave 4), après ~9 plans supposant les tables présentes.

Conséquences (avant fix) :
- Plans 06/09/10 compilent (TS) mais tout `npm run dev` entre W2 et W4 → `relation "public.bonus_events" does not exist`.
- `npm run build` ne détecte pas l'absence runtime (build statique Next).
- Smoke E2E Plan 12 = premier moment de découverte régressions runtime — trop tard à T-3.

**FIX APPLIQUÉ (quick 260510-rxa, 2026-05-10)** : nouveau **Plan 12-04 `apply-migrations-gate`** insere en Wave 1.5, `depends_on: [12-02, 12-03]`, type `checkpoint:human-verify gate=blocking`. Acceptance documentee :
- `npx supabase migration up --linked` apply les 2 migrations
- `psql -c "\dt public.bonus_events public.moscow_cards"` retourne 2 lignes
- 4 enums verifies (`bonus_type`, `bonus_status`, `multiplier_scope`, `moscow_bucket`)
- 8 RLS policies actives
- Idempotency : 2e run = no-op

Wave 2 (05/06/07) ne demarre qu'apres Omar tape "applied" avec proof `\dt`.

**Mitigation alternative** (non retenue, documentee) : instruction explicite dans Plan 06 `<read_first>` + Plan 09 Task 1 acceptance — moins propre, perd la tracabilite atomique du gate.

---

## Verdict global : **READY** (BLOCK dim. 8 fixe via Plan 12-04 — patch 260510-rxa)

Plans solides, dépendances correctes, R1/R2/R3 préservés, goal-backward couvert. **Faille du gate Supabase apply entre Wave 1 et Wave 2 fixee via Plan 12-04** (quick 260510-rxa, 2026-05-10).

### Punch list avant `/gsd-execute-phase 12` :

1. ~~**Apply migrations gate**~~ ✅ **FIXE** via Plan 12-04 (Wave 1.5 blocking) — patch 260510-rxa.
2. **Tag pre-phase** : `git tag v0.2.X-pre-phase12 && git push --tags` — toujours TODO avant Plan 01.
3. **CONTEXT.md `<specifics>`** : retirer `schema.sql`/`triggers.sql`/`rls.sql` — toujours TODO post-execution (WARN §4).
4. **Doc `--legacy-peer-deps`** Plan 09 si overrides : tracer CLAUDE.md ops — toujours TODO (WARN §7).

Sequence d'execution : 01 → 02+03 → **04 (Omar applique migrations + verifie idempotency)** → 05+. Smoke local apres chaque wave.
