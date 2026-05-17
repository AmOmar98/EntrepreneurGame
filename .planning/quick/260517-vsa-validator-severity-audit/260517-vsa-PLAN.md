---
quick_id: 260517-vsa
slug: validator-severity-audit
date: 2026-05-17
status: deferred-skeleton
advisor_verdict: REQUIRED (zone validators = R2 cardinal)
origin: stream A deferred (A6) — orchestrator session 2026-05-17
must_haves:
  truths:
    - "Les `severity: \"error\"` dans `app/actions.ts` (10+ matches) sont des markers `WorkflowState` LEGITIMES, pas des violations R2"
    - "Un grep blind sur `severity: \"error\"` produit du faux positif — il faut un baseline + whitelist design"
    - "R2 cardinal (cf. CLAUDE.md) : validators de **livrables Player** doivent etre warn-only ; mais validators de **server actions** peuvent etre error (different domaine)"
    - "Distinction critique : validator de structure JSON deliverable vs validator de form submission"
    - "Le but de l'audit n'est PAS de tout passer en warn, c'est d'identifier ce qui est cote Player et doit etre warn"
  artifacts:
    - "260517-vsa-PLAN.md (ce fichier)"
    - "260517-vsa-AUDIT.md (a produire — inventaire + classification chaque match)"
    - "260517-vsa-ADVISOR-VERDICT.md (a produire — REQUIRED)"
    - "260517-vsa-SUMMARY.md (a produire)"
    - "deferred-items.md"
    - "docs/validator-severity-baseline.md (a creer — whitelist + rationale)"
  key_links:
    - "app/actions.ts (10+ severity: error markers)"
    - "lib/deliverable-validators.ts (si existe) ou autre lib R2 cardinal"
    - "CLAUDE.md section 'Pre-edit guards' (definition R2)"
    - "memory: feedback_eic_cardinal_rules.md"
---

# Quick 260517-vsa — Validator severity audit (SKELETON)

## Status

**deferred-skeleton** — non execute. Capture le scope pour reprise.

## Why deferred

Origin : orchestrator stream A "ship + push" session 2026-05-17, item A6.

Raison defer (citee verbatim) :
> severity: "error" matches in app/actions.ts (10+) are legitimate WorkflowState markers, not R2 violations. A useful audit needs a baseline + whitelist design, not a blind grep gate.

## Scope (a confirmer en discuss-phase)

### Objectif
Construire un baseline classifiant chaque occurrence de `severity: "error"` dans le codebase comme :
- **R2-relevant** : touche validators de livrables Player → doit etre `warn` (modifier)
- **WorkflowState legit** : marker server-action retournant `{ ok: false }` → ignore
- **Validator structurel** : Zod / JSON schema (autre couche) → ignore mais documenter

Puis produire un grep gate utilisable en CI (avec whitelist), pour catcher les futures regressions R2.

### Out of scope explicit
- Ne PAS modifier les validators WorkflowState legitimes (ils doivent rester error)
- Ne PAS changer la severite de validators Zod (couche differente)
- Ne PAS introduire un nouveau framework de validation
- Ne PAS automatiser le gate CI cette session (sortir whitelist d'abord)

### In scope propose
1. **Inventaire** : grep tous les `severity: "error"` (+ variantes `severity:"error"`, `'error'`, etc.) dans le repo
2. **Classification** : pour chaque match, l'etiqueter (R2-relevant / WorkflowState / Zod / autre)
3. **Action sur R2-relevant** : si match est cote Player validators → spawn advisor + flip a `warn`
4. **Baseline doc** : `docs/validator-severity-baseline.md` qui liste les paths whitelist (WorkflowState legit) + paths sous gate (Player validators must be warn)
5. **Grep script** : `scripts/check-r2-severity.{sh,ps1}` qui parse les matches, retire whitelist, et exit 1 si nouveau match non whiteliste

## Pre-requisites avant execution

1. Spawn `eic-pedagogical-advisor` AVANT toute classification finale (R2 = cardinal)
2. Lire `app/actions.ts` en entier + identifier autres fichiers `lib/*validators*`
3. Re-confirmer avec Omar la definition R2 exacte : est-ce qu'un validator de bonus event compte comme "Player-facing" ?
4. Verifier si une lib type `lib/deliverable-validators.ts` existe ou si la validation est inline

## Tasks (a planifier en discuss-phase quand reprise)

| # | Task | Files | Verify | Done |
|---|------|-------|--------|------|
| 1 | Grep exhaustif `severity` dans app/, lib/, components/ | (analyse) | tableau AUDIT.md avec N matches | TODO |
| 2 | Classification chaque match (R2 / WorkflowState / Zod / autre) | (analyse) | AUDIT.md tableau complet | TODO |
| 3 | Spawn eic-pedagogical-advisor sur AUDIT | (review) | ADVISOR-VERDICT.md | TODO |
| 4 | Flip a warn les matches R2-relevant identifies | fichiers concernes | grep post-fix = 0 R2 errors | TODO |
| 5 | Ecrire `docs/validator-severity-baseline.md` | docs/ | doc complete avec whitelist | TODO |
| 6 | Script gate `scripts/check-r2-severity.{sh,ps1}` | scripts/ | exit 0 sur HEAD actuel | TODO |
| 7 | Doc d'integration CI (sans activer le gate) | docs/ + .github/ (optionnel) | how-to documente | TODO |
| 8 | Commit atomique + push | git | commit hash | TODO |

## R1/R2/R3

- **R2 (warn-only)** : COEUR du scope. Tout fix doit faire l'objet d'un advisor PASS.
- **R1 + R3** : pas concernes directement.

## Notes

- Risque : flip d'un severity error legitime en warn → bug silencieux en prod. Toujours classifier d'abord, agir ensuite.
- Le gate CI peut etre integre comme pre-commit hook ou step GitHub Actions, mais c'est une **decision separee** post-baseline.
- Considerer si Zod validators ont une notion de "warn" — si non, ce n'est pas applicable (Zod = strict par design).
- Le ratio attendu : ~80% WorkflowState legit / ~10% R2-relevant a flipper / ~10% Zod ou autre.
