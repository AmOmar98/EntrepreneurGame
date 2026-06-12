---
phase: 13-db-consolidation-test-infrastructure
plan: "01"
status: complete
requirements: [OPS-01, OPS-02]
commits:
  - 71afa42: "docs(13-04+13-01): drift report + 13-NEW.sql + patterns"
  - fa97296: "docs(13-01): OPS-02 verdict DIGI-08 (PENDING-LIVE-CHECK)"
  - 715c470: "fix(13-01): source 2 PROD-only trigger functions + copy jurors/pitch_mode migration"
completed: 2026-06-11
executor: orchestrator-inline
note: "Exécuté inline par l'orchestrateur — les outils MCP Supabase n'ont jamais pu être propagés (4 flows OAuth + 1 restart session, échec systématique de l'enregistrement des outils). Évidence PROD = vérifications documentées kc2 2026-05-23."
---

# Plan 13-01 — DB Consolidation + DIGI-08 : COMPLETE

## Ce qui a été livré

1. **`OPS-01-drift-report.md`** — drift table 4 dimensions (fonctions/grants/policies/colonnes) `database/` + `supabase/migrations/` vs PROD. Constats clés :
   - Grants D3 (11 paires) et policies D2 (5) + announcements anon : **déjà présents dans rls.sql** — pas de drift.
   - 2 fonctions PROD-only vs triggers.sql : `set_help_requests_updated_at` (sourcée en migration sans search_path) et `set_pitch_mode_closed_at` (sourcée NULLE PART dans les dirs canoniques — quick-jpr jamais recopié).
   - Drift structurel documenté pour Phase 14 : `jurors` + pitch_mode hors `supabase/migrations/`, vue déclarative schema.sql en retard de 6 objets (PARTIAL).
2. **`13-NEW.sql`** — consolidation idempotente no-op PROD (2 fonctions avec `search_path=''` + 11 grants verbatim D3).
3. **Mirror appliqué (autorisé Omar, script Node)** : `database/triggers.sql` définit désormais les 2 fonctions (gap comment l.169-178 remplacé) ; `supabase/migrations/20260519120000_jurors_and_pitch_mode.sql` créé (règle 3 MANIFEST réparée).
4. **`OPS-02-verdict.md`** — DIGI-08 : verdict **PENDING-LIVE-CHECK** avec 3 scénarios pré-arbitrés (SUFFICIENT / PUBLISH-ONLY / OMAR-DECIDE) + requête de décision read-only fournie. Non bloquant pour v0.4.

## Déviations

- Tasks 1-2 exécutées inline par l'orchestrateur (l'agent gsd-executor n'a pas les outils MCP ; les outils MCP n'étaient de toute façon pas disponibles) — évidence PROD = kc2 SUMMARY 2026-05-23 (PROD idle depuis), re-vérification live en annexe du drift report.
- Le mirror Task 3 a été appliqué par script Node avec autorisation explicite Omar (au lieu d'une édition manuelle).

## Item ouvert (deferred non bloquant)

- **DIGI-08 live check** : exécuter la requête de `OPS-02-verdict.md` dans le SQL Editor Supabase et mettre à jour le verdict (3 scénarios pré-arbitrés). À faire lors de la prochaine session Studio d'Omar ou dès que le MCP Supabase fonctionne.
