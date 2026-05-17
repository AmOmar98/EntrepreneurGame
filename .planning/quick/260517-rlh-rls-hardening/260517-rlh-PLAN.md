---
quick_id: 260517-rlh
slug: rls-hardening
date: 2026-05-17
status: deferred-skeleton
advisor_verdict: REQUIRED (zone securite + database/rls.sql)
origin: stream A deferred (A5) — orchestrator session 2026-05-17
must_haves:
  truths:
    - "Zone cardinale : touche `database/rls.sql` (security-sensitive)"
    - "Spawn `eic-pedagogical-advisor` OBLIGATOIRE avant tout edit (cf. CLAUDE.md pre-edit guards)"
    - "RLS actuel = pilot-grade (cf. CLAUDE.md ops) — fonctionne pour 11P+2M+3J+4GM mais pas valide pour scale"
    - "Test approach distinct du Playwright smoke (necessite SQL fixtures + role impersonation via service_role)"
    - "Bug RLS evaluation_comments F-16-01 fixe en quick 260511-sbt (commit 2b78801) — point d'attention historique"
  artifacts:
    - "260517-rlh-PLAN.md (ce fichier)"
    - "260517-rlh-AUDIT.md (a produire — inventaire policies actuelles)"
    - "260517-rlh-ADVISOR-VERDICT.md (a produire — REQUIRED)"
    - "260517-rlh-SUMMARY.md (a produire avec SHA)"
    - "deferred-items.md"
    - "database/rls-tests/*.sql (a creer — tests RLS via SET ROLE)"
  key_links:
    - "database/rls.sql (policies actuelles + helpers has_role + is_staff)"
    - "database/schema.sql (tables a couvrir)"
    - ".planning/quick/260511-sbt-fix-rls-evaluation-comments-bug-f-16-01/ (historique fix RLS)"
    - "memory: feedback_eic_cardinal_rules.md (R1/R2/R3 cardinaux)"
---

# Quick 260517-rlh — RLS hardening (SKELETON)

## Status

**deferred-skeleton** — non execute. Capture le scope pour reprise post-pilote.

## Why deferred

Origin : orchestrator stream A "ship + push" session 2026-05-17, item A5.

Raison defer (citee verbatim) :
> touches database/rls.sql, security-sensitive, requires eic-pedagogical-advisor review and a separate test approach.

## Scope (a confirmer en discuss-phase)

### Objectif
Auditer et durcir les RLS policies actuelles (pilot-grade) pour passer a un standard production-grade, sans casser le dual-mode demo ni le pilote en cours.

### Out of scope explicit
- Ne PAS refactorer le schema lui-meme (separer de A3 migrations gate)
- Ne PAS introduire de nouveau role applicatif (rester sur les 5 actuels : founder/mentor/reviewer/committee_member/eic_admin)
- Ne PAS modifier les triggers XP (`database/triggers.sql`)
- Ne PAS toucher au middleware Next.js (l'enforcement est cote DB, le middleware est advisory)

### In scope propose
1. **Inventaire policies** : lister toutes les policies par table avec USING/WITH CHECK + role gating
2. **Audit gap** : identifier policies manquantes / trop permissives / inconsistentes
3. **Test approach** : creer `database/rls-tests/*.sql` qui font `SET LOCAL ROLE` + tentent operations attendues/interdites, asserts via psql
4. **Hardening** : tightener les policies identifiees gap, **une table a la fois** avec commit atomique
5. **Re-test pilot** : verifier que les 11 porteurs + 2 mentors + jury + GM voient toujours les memes data qu'avant

## Pre-requisites avant execution

1. Pilote AgreenTech termine (post 14/05 soir 2026) **OU** fenetre de calme >= 48h confirmee
2. Spawn `eic-pedagogical-advisor` AVANT chaque edit `database/rls.sql`
3. Lire `database/rls.sql` + `database/schema.sql` en entier
4. Re-lire la rétro `260511-sbt` (bug evaluation_comments) pour comprendre les pieges connus
5. Backup PROD Supabase : tag DB + export schema snapshot avant toute modif

## Tasks (a planifier en discuss-phase quand reprise)

| # | Task | Files | Verify | Done |
|---|------|-------|--------|------|
| 1 | Inventaire policies actuelles (tableau) | database/rls.sql | AUDIT.md liste 100% des tables | TODO |
| 2 | Identifier gaps par table (Player/Mentor/GM cross-access) | (analyse) | tableau AUDIT.md | TODO |
| 3 | Spawn eic-pedagogical-advisor sur AUDIT | (review) | ADVISOR-VERDICT.md | TODO |
| 4 | Test harness SQL (SET LOCAL ROLE) | database/rls-tests/ | au moins 1 test par table | TODO |
| 5..N | Tightening table-par-table (1 commit = 1 table) | database/rls.sql | tests passent + advisor PASS par table | TODO |
| N+1 | Smoke pilot data (11P + 2M + jury + GM) | (manuel via PROD ou snapshot) | aucune regression visible | TODO |
| N+2 | Doc dans `database/RLS.md` (rationale par policy) | database/RLS.md | doc complete | TODO |

## R1/R2/R3

- **R1 (score visibility)** : verifier qu'aucune policy n'expose `evaluations` ou `pitch_scores` au role Player en dehors de la page detail livrable
- **R2 (warn-only)** : N/A (RLS = blocage par design, c'est attendu cote DB ; R2 concerne validators applicatifs)
- **R3 (pas de blocage inter-mission)** : N/A (RLS ne fait pas de progression check)

## Notes

- Si l'audit revele un trou critique → escalader en hotfix immediat (pas attendre cette session)
- Considerer postgres `security_invoker` vs `security_definer` sur les helpers (`has_role`, `is_staff`) — point d'audit
- Pour tests, considerer pgTAP si Omar veut un framework dedie (sinon SQL brut suffit pour pilot+1)
- Risque elevé : 1 mauvaise policy peut bloquer Player en prod → toujours tester en staging d'abord (mais staging Supabase n'existe pas actuellement → defer secondaire)
