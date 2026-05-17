---
quick_id: 260517-mga
slug: migrations-gate-paper-trail
date: 2026-05-17
status: deferred-skeleton
advisor_verdict: pending (zone sensible: database/)
origin: stream A deferred (A3) — orchestrator session 2026-05-17
must_haves:
  truths:
    - "Repo a 2 dossiers de migrations divergents : database/migrations/ (8 files) vs supabase/migrations/ (16 files)"
    - "Conventions de naming differentes entre les 2 dossiers"
    - "CI ne peut pas atteindre prod Supabase pour `supabase migration list` (pas de service_role en CI)"
    - "Zone sensible : tout touche `database/` => spawn eic-pedagogical-advisor obligatoire avant edit"
    - "Pilote AgreenTech termine (14/05 soir) => fenetre de calme pour ranger sans pression"
  artifacts:
    - "260517-mga-PLAN.md (ce fichier)"
    - "260517-mga-AUDIT.md (a produire lors de l'execution)"
    - "260517-mga-ADVISOR-VERDICT.md (a produire — zone database/)"
    - "260517-mga-SUMMARY.md (a produire)"
    - "deferred-items.md"
  key_links:
    - "database/migrations/ (8 files)"
    - "supabase/migrations/ (16 files)"
    - "database/schema.sql, triggers.sql, rls.sql (source of truth applied in order)"
---

# Quick 260517-mga — Migrations gate paper-trail (SKELETON)

## Status

**deferred-skeleton** — non execute. Capture le scope pour reprise post-pilote.

## Why deferred

Origin : orchestrator stream A "ship + push" session 2026-05-17, item A3.

Raison defer (citee verbatim) :
> Repo has two divergent migrations dirs (database/migrations/ 8 files vs supabase/migrations/ 16 files) with mismatched naming conventions, and CI cannot reach prod Supabase to run `supabase migration list`. A paper-trail manifest is doable but design-sensitive; deserves its own session.

## Scope (a confirmer en discuss-phase)

### Objectif
Etablir une **trace papier** unique et auditable de l'etat des migrations entre les 2 dossiers, sans toucher au schema applique en prod.

### Out of scope explicit
- Ne PAS unifier les 2 dossiers dans cette session (decision design separee)
- Ne PAS modifier schema.sql / triggers.sql / rls.sql
- Ne PAS lancer de nouvelle migration en prod
- Ne PAS toucher au CI (gate `supabase migration list` reste defer)

### In scope propose
1. **Inventaire** : lister les 8 + 16 fichiers avec hash + date + nom + intent (1-liner)
2. **Mapping** : identifier overlaps / divergences / orphelins entre les 2 dossiers
3. **Manifest** : produire `database/MANIFEST.md` qui explicite quel dossier est applique en prod, quel dossier est legacy, et la regle pour les futures migrations
4. **Decision design** : recommander (ou pas) l'unification, sans l'executer

## Pre-requisites avant execution

1. Pilote AgreenTech termine (post 14/05 soir 2026)
2. Spawn `eic-pedagogical-advisor` AVANT tout edit (zone `database/`)
3. Lire `database/schema.sql` + `triggers.sql` + `rls.sql` en entier
4. Verifier `git log --oneline -- database/migrations/ supabase/migrations/` pour reconstituer la chrono
5. Confirmer avec Omar quel dossier est "source of truth" en prod actuellement

## Tasks (a planifier en discuss-phase quand reprise)

| # | Task | Files | Verify | Done |
|---|------|-------|--------|------|
| 1 | Inventaire des 24 fichiers (hash + intent) | both dirs | inventaire .md genere | TODO |
| 2 | Mapping overlaps / divergences | (analyse) | tableau dans AUDIT.md | TODO |
| 3 | Brouillon MANIFEST.md | database/MANIFEST.md | advisor PASS | TODO |
| 4 | Spawn eic-pedagogical-advisor pour validation | (review) | ADVISOR-VERDICT.md = PASS ou WARN | TODO |
| 5 | Commit + push | git | commit hash | TODO |

## R1/R2/R3

Zone sensible `database/` → spawn `eic-pedagogical-advisor` AVANT execution. Pas de signal R1/R2/R3 attendu (paper-trail, pas de logique Player).

## Notes

- Si Omar veut unifier les 2 dossiers, c'est une **phase** distincte (pas un quick) — toucher au schema applique en prod = decision design lourde
- Le gate CI `supabase migration list` reste defer separement (besoin service_role en CI, decision infra)
