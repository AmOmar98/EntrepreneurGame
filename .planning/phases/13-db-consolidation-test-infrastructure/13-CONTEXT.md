# Phase 13: DB Consolidation + Test Infrastructure - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

La codebase a un filet de sécurité test opérationnel et `database/` est la source de vérité unique alignée sur PROD avant tout refactor schéma.

Requirements couverts : OPS-01 (consolidation database/ vs PROD), OPS-02 (DIGI-08 backfill pitch_scores clos), QUAL-01 (Vitest server actions critiques), QUAL-02 (Playwright E2E 5 flows), QUAL-03 (CI GitHub Actions gates).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Contraintes verrouillées (Omar 2026-06-11, PROJECT.md § Key Decisions)
- OPS-01 est le pré-requis bloquant de TOUT refactor schéma (phases 14+) — cette phase doit le fermer en premier.
- `database/**` est Write/Edit-deny (settings.local.json) : le SQL consolidé s'écrit en NEW.sql dans le dossier de phase, puis Omar (ou MCP execute_sql pour PROD) l'applique ; pour les fichiers sources `database/*.sql`, demander à Omar d'appliquer ou utiliser le workaround documenté (memory `feedback_database_deny_workaround`).
- Branche de travail : `milestone/v0.4-scale-foundation` — pas de push sur main.
- R1/R2/R3 + dual-mode demo préservés (aucun impact attendu en Phase 13 — pure infra).
- Drift connu : 2 functions PROD-only absentes de `database/triggers.sql` (`set_help_requests_updated_at`, `set_pitch_mode_closed_at`) + fix `search_path` appliqué seulement en PROD + grants divergents (quick 260523 advisors d1-d3 : REVOKE FROM PUBLIC + GRANT authenticated sur 11 secdef).
- DIGI-08 : clarifier si le publish pré-event du 15/05 (proxy) suffit ou si re-backfill des pitch_scores live Digi est requis — vérifier l'état PROD via MCP, documenter le verdict.

</decisions>

<code_context>
## Existing Code Insights

- Aucune infra test : pas de Vitest, pas de Playwright config, pas de `.github/workflows/`.
- Scripts existants : `npm run dev/build/lint/typecheck` (tsc --noEmit). `package.json` type commonjs, TS module esnext/bundler.
- Server actions critiques dans `app/actions.ts` (module unique "use server", Zod, retour WorkflowState).
- Mode demo (hasSupabaseEnv()===false → seed lib/seed/) permet de jouer les flows E2E sans Supabase — base idéale pour Playwright en CI.
- PROD Supabase accessible via plugin MCP (execute_sql, get_advisors, get_logs) pour le diff schéma.

</code_context>

<specifics>
## Specific Ideas

- Le diff database/ vs PROD doit produire un rapport (quelles functions/grants/policies divergent) + le SQL de consolidation.
- Les 5 flows E2E cibles (QUAL-02) : onboarding, soumission livrable, éval mentor, pitch jury, export GM — exécutables en mode demo.
- CI : gate typecheck + lint + build + vitest sur push (GitHub Actions).

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
