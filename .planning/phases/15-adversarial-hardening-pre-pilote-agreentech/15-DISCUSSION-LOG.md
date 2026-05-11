# Phase 15 — Discussion Log (Audit Trail)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `15-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 15 — adversarial-hardening-pre-pilote-agreentech
**Mode:** `--auto` (single interactive scope-locking question, then auto-selection of recommended defaults)
**Areas discussed:** Scope lock, Méthodologie audit, Surfaces sensibles, Livrables, Stop conditions

---

## Scope Lock (question interactive owner)

| Option | Description | Selected |
|---|---|---|
| Robustesse cardinaux R1/R2/R3 | Audit adversarial des 3 règles | |
| Edge cases data + concurrence | Stress 15 Players concurrents, race conditions, RLS leaks, inputs adversariaux | ✓ |
| Smoke gaps J1-mentor + J2-jury | Ops PROD via swarm-harness | |
| Owner précise en texte libre | Périmètre custom | |

**User's choice:** "Edge cases data + concurrence"
**Notes:** Owner Omar 2026-05-11 — réponse directe via AskUserQuestion. Périmètre verrouillé.

---

## Méthodologie d'audit (auto-sélection)

| Option | Description | Selected |
|---|---|---|
| Scripts SQL inline (pgTAP-style, manual run) | Pas de framework à installer, exécutable Cloud Studio | ✓ (recommended default) |
| Framework pgTAP CI | Test suite robuste mais install + setup CI 4-6h | |
| Tests Playwright concurrent | Excellent pour racing UI mais lourd à scripter T-2 | |

**[auto]** Q: "Méthodologie audit" → Selected: "Scripts SQL inline" (recommended default, plus rapide pré-pilote, idempotent via begin/rollback)

**Notes:** Cohérent avec décision T-3 retro de privilégier scripts manuels + checklists markdown plutôt que d'introduire framework de test pré-pilote.

---

## Surface RLS — niveau de fix accepté (auto)

| Option | Description | Selected |
|---|---|---|
| Audit lecture-seule + documentation known limitations | Pas de patch SQL pré-pilote sauf fuite active critique | ✓ (recommended default) |
| Refonte cohort scoping + self-join bug fix | Risque régression élevé T-2 | |
| Ajout RLS policies missing (evidence INSERT/UPDATE, etc.) | Hors scope edge-cases | |

**[auto]** Q: "RLS fix scope" → Selected: "Audit lecture-seule + documentation" (recommended, refonte = SEED-002 v0.3)

---

## Inputs adversariaux — couverture (auto)

| Option | Description | Selected |
|---|---|---|
| Checklist markdown 15-20 vecteurs + run manuel curl/DevTools | Léger, traçable, exécutable PROD compte burner | ✓ (recommended default) |
| Suite automatisée Playwright + Zod fuzzing | Bloqué par absence framework Vitest/Playwright | |
| Sample minimal 5 vecteurs critiques only | Insuffisant pour audit adversarial | |

**[auto]** Q: "Adversarial inputs methodology" → Selected: "Checklist markdown + manual run"

---

## Concurrence mentors — méthodologie (auto)

| Option | Description | Selected |
|---|---|---|
| 2 sessions psql parallèles + verification recalc | Reproductible, scriptable | ✓ (recommended default) |
| Playwright 2 contexts swarm-harness | Lourd, plus représentatif UI mais T-2 risqué | |
| Test inline trigger SQL pg_sleep + dblink | Complexe, pg_sleep peu fiable cross-tx | |

**[auto]** Q: "Concurrence methodology" → Selected: "2 sessions psql parallèles"

---

## Audit R1 extension (auto)

| Option | Description | Selected |
|---|---|---|
| Étendre `scripts/audit-r1.sh` pour Phase 14 surfaces | Réutilise asset existant commit 02c0798 | ✓ (recommended default) |
| Réécrire script en TypeScript | Pas justifié pré-pilote | |
| Audit manuel grep one-shot | Pas re-runnable post-pilote | |

**[auto]** Q: "R1 audit extension" → Selected: "Extend audit-r1.sh"

---

## Stop conditions — sévérité gating (auto)

| Option | Description | Selected |
|---|---|---|
| FAIL critique RLS cross-cohort = STOP go/no-go pilote | Owner escalation immediate | ✓ (recommended default) |
| Aucun stop, tout patché coûte que coûte avant cutoff | Risque régression élevé | |
| Stop sur n'importe quel FAIL même mineur | Bloque phase trop facilement | |

**[auto]** Q: "Stop condition severity" → Selected: "Critical RLS leak = STOP"

---

## Cutoff timing strict (auto)

| Option | Description | Selected |
|---|---|---|
| Cutoff 2026-05-12 23h00 = arrêt strict, restantes deferred SEED-002 | Cohérent CLAUDE.md "deadline freeze interne" | ✓ (recommended default) |
| Cutoff 2026-05-13 04h00 (T-1, jour pilote) | Risque burn-out + zéro buffer | |
| Cutoff floating "jusqu'à ce que tout marche" | Pas de discipline scope | |

**[auto]** Q: "Cutoff timing" → Selected: "2026-05-12 23h00 strict"

---

## Claude's Discretion (déléguée explicitement)

- Choix exact des seuils de longueur pour vecteurs adversariaux
- Choix exact des 15-20 vecteurs adversariaux dans la checklist (basé sur OWASP top 10 adapté Next.js/Supabase)
- Format précis des rapports verdict (markdown table vs liste — uniformiser avec phases précédentes)

## Deferred Ideas (notées dans CONTEXT.md `<deferred>`)

- Refonte RLS multi-tenant (cohort scoping + self-join bug) → SEED-002 v0.3
- Rate limiting Upstash sur server actions → v0.3
- Observability Sentry + audit_log writes → v0.3
- Tests automatisés CI (Vitest + Playwright + pgTAP) → bloqué tant que framework absent
- SSRF allowlist server-side → audit conditionnel si v0.3 ajoute fetch server-side
- Pin versions lucide-react / typescript + lockfile-strict CI → v0.3

---

*Phase: 15-adversarial-hardening-pre-pilote-agreentech*
*Discussion log generated: 2026-05-11*
*Mode: --auto (1 interactive scope-lock + 7 auto-selected defaults)*
