---
quick_id: 260517-psd
slug: playwright-smoke-dualmode
date: 2026-05-17
status: deferred-skeleton
advisor_verdict: pending (zone test harness, pas Player-facing direct)
origin: stream A deferred (A4) — orchestrator session 2026-05-17
must_haves:
  truths:
    - "Harness Playwright dual-mode non trivial : install browsers + port management + server boot/teardown"
    - "Agent `smoke-tester` deja defini avec playbook complet (cf. .claude/agents/smoke-tester.md)"
    - "Doit etre un commit atomique separe (pas de squeeze dans un quick existant)"
    - "Dual-mode = demo (sans env Supabase) ET supabase-backed (avec env) — les 2 doivent passer"
    - "Convention CLAUDE.md : 3 cardinaux R1/R2/R3 a verifier sur surfaces Player (`app/journey/`, `app/results/`, etc.)"
  artifacts:
    - "260517-psd-PLAN.md (ce fichier)"
    - "260517-psd-AUDIT.md (a produire)"
    - "260517-psd-SUMMARY.md (a produire avec SHA)"
    - "deferred-items.md"
    - "tests/smoke/*.spec.ts (a creer)"
    - "scripts/smoke-dualmode.{sh,ps1} (a creer pour orchestration locale)"
  key_links:
    - ".claude/agents/smoke-tester.md (playbook deja ecrit)"
    - "lib/supabase-status.ts:hasSupabaseEnv() (toggle dual-mode)"
    - "middleware.ts (no-op en demo mode)"
    - "package.json (ajouter script `smoke:dualmode`)"
---

# Quick 260517-psd — Playwright smoke dual-mode (SKELETON)

## Status

**deferred-skeleton** — non execute. Capture le scope pour reprise.

## Why deferred

Origin : orchestrator stream A "ship + push" session 2026-05-17, item A4.

Raison defer (citee verbatim) :
> non-trivial harness (browser install, port management, server boot/teardown). Better as its own atomic commit; the smoke-tester agent definition already covers the playbook.

## Scope (a confirmer en discuss-phase)

### Objectif
Mettre en place un smoke E2E Playwright qui tourne dans les 2 modes (demo seed fallback + supabase-backed) pour catcher les regressions R1/R2/R3 avant chaque merge polish/*.

### Out of scope explicit
- Ne PAS introduire un test runner unit (Jest/Vitest) — c'est un autre debat
- Ne PAS lancer en CI cloud cette session (CI Supabase prod = bloqueur A3)
- Ne PAS modifier `lib/score.ts` ou surfaces Player

### In scope propose
1. **Install Playwright** + browsers (chromium uniquement suffit pour pilote)
2. **Harness boot/teardown** : script qui lance `npm run dev` sur port libre, attend ready, lance specs, kill server
3. **Specs minimal** (couvre R1/R2/R3) :
   - Player /journey ne montre PAS de score/rang
   - Player /results visible seulement post-ceremony
   - Mentor /mentor voit submissions assignees
   - GameMaster /admin voit tous les players
4. **Dual-mode toggle** : meme specs tournent avec ENV vide (seed) ET avec ENV Supabase de test
5. **Script `npm run smoke:dualmode`** : execute les 2 passes sequentiellement

## Pre-requisites avant execution

1. Lire `.claude/agents/smoke-tester.md` en entier (playbook deja ecrit)
2. Verifier que `package.json` n'a pas deja Playwright (eviter doublon)
3. Confirmer avec Omar : ENV Supabase de test = projet dedie ou re-use prod en lecture seule ?
4. Confirmer port strategy : auto-detect (next:dev sur 3000/3001/3002) ou port fixe ?

## Tasks (a planifier en discuss-phase quand reprise)

| # | Task | Files | Verify | Done |
|---|------|-------|--------|------|
| 1 | `npm i -D @playwright/test` + `npx playwright install chromium` | package.json | playwright.config.ts genere | TODO |
| 2 | Ecrire `playwright.config.ts` (1 projet chromium, baseURL dynamique) | racine | config valide | TODO |
| 3 | Ecrire harness boot (`scripts/smoke-boot.{ps1,sh}`) | scripts/ | `npm run dev` lance + ready check | TODO |
| 4 | Spec R1 : Player /journey sans score | tests/smoke/r1-no-score.spec.ts | grep negatif passe | TODO |
| 5 | Spec R2 : validators warn-only | tests/smoke/r2-warn-only.spec.ts | aucun error severity sur form submit | TODO |
| 6 | Spec R3 : pas de blocage inter-mission | tests/smoke/r3-no-hardcoded-block.spec.ts | tous CTA cliquables ou ambre hint | TODO |
| 7 | Script orchestrateur `smoke:dualmode` | package.json scripts | 2 passes (seed + supabase) | TODO |
| 8 | Doc dans `docs/SMOKE.md` | docs/SMOKE.md | how-to local + CI hook | TODO |
| 9 | Commit atomique + push | git | commit hash | TODO |

## R1/R2/R3

Le harness lui-meme n'introduit pas de signal cardinal. Les specs **verifient** les 3 cardinaux. Pas besoin d'advisor (zone test, pas Player surface).

## Notes

- Smoke E2E reste manuel via swarm-harness en attendant cette automatisation (cf. memory `feedback_smoke_minimal_2p_1m_1gm.md`)
- Si Omar veut Lighthouse / a11y audit en bonus → phase distincte
- Conflit potentiel avec node_modules Playwright si jamais re-installe : verifier `.gitignore` couvre `playwright-report/` et `test-results/`
