# Phase 17: Observabilité + Perf - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Les erreurs prod sont capturées et alertées automatiquement, le funnel produit est tracé, et la plateforme tient la charge de 500 users concurrents avec un P95 acceptable.

Requirements : QUAL-04 (Sentry erreurs serveur/client + alerting), QUAL-05 (PostHog funnel completion par livrable, drop-offs), QUAL-06 (perf test seed 500 users — P95 queries mesuré, RLS initplan vérifié).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices at Claude's discretion — discuss skipped.

### Contraintes verrouillées + réalités opérationnelles
- **Budget 0€ infra** : tiers gratuits Sentry + PostHog uniquement. Les SDK sont câblés **env-gated** : sans `SENTRY_DSN` / `NEXT_PUBLIC_POSTHOG_KEY`, zéro effet (no-op total, demo mode et CI inchangés). Omar crée les comptes et colle les clés dans Vercel env au checkpoint — la requirement est « implémentée, clés au checkpoint ».
- **R1 CARDINAL** : PostHog ne capture AUCUNE donnée de score/rang côté Player ; events de funnel = actions (onboarding_completed, deliverable_submitted, deliverable_validated, mentor_eval_submitted) avec ids techniques, pas de payloads de score. Session recording OFF.
- **Privacy** : pas de PII au-delà des user ids techniques ; IP masquée si option dispo ; conforme à l'esprit pilot-grade.
- **Perf QUAL-06 sans Docker ni staging** : (a) script de seed 500 users idempotent file-first (`scripts/perf-seed-500.sql` + variant `.mjs`) — exécution sur un projet Supabase jetable OU sur PROD hors-event avec cleanup intégral documenté (décision opérateur au checkpoint, défaut = projet jetable) ; (b) script de mesure P95 (`scripts/perf-p95.mjs` — N requêtes chronométrées sur les chemins critiques /journey data, eval, jury via PostgREST) ; (c) vérification RLS initplan = revue statique des policies (toutes en `(SELECT auth.uid())` — déjà vrai depuis kc2/14/16, le vérifier par grep sur PROD via supabase CLI inspect ou sur les fichiers migrations) + doc runbook EXPLAIN.
- **Sentry** : @sentry/nextjs avec config minimale (client + server + edge), tunnel non requis, sourcemaps optionnels (éviter de compliquer le build CI) ; alerting = règle email par défaut documentée (webhook Slack/WhatsApp hors scope — backlog).
- **PostHog** : posthog-js client-only suffit pour le funnel (capture server-side optionnelle non requise) ; provider léger dans app/layout.tsx gated par env ; events nommés `eg_*`.
- **Gate** : typecheck+lint+build+unit(105)+e2e(24) verts ; les SDK env-gated ne doivent PAS dégrader le build CI (no keys in CI). Bundle size : PostHog lazy-loaded.
- **Branche** milestone/v0.4-scale-foundation, push par plan. Migrations : AUCUNE attendue cette phase.
</decisions>

<code_context>
## Existing Code Insights

- next.config.ts minimal (remote images dicebear). Instrumentation Next 15 : `instrumentation.ts` + `instrumentation-client.ts` supportés ; @sentry/nextjs a son wizard mais config manuelle préférée (withSentryConfig optionnel — éviter si sourcemaps non voulus).
- app/layout.tsx racine (html lang fr) — point d'ancrage du provider PostHog client.
- Server actions : app/actions.ts retourne WorkflowState sans throw — la capture Sentry des erreurs serveur passe par captureException dans les branches d'erreur critiques OU onRequestError de instrumentation.ts (Next 15).
- Funnel events côté client : components/proof-workflow.tsx (submission), onboarding form, mentor eval form — hooks useEffect sur state.ok existants.
- scripts/ existants : smoke-rls-prod.mjs, test-rls-cross-cohort.sql, mirror-*.cjs — conventions Node scripts.
- supabase CLI dispo (délégation Omar) : inspect db pour vérifs read-only.
</code_context>

<specifics>
## Specific Ideas

- `instrumentation.ts` (server) : Sentry.init si SENTRY_DSN + export onRequestError = Sentry.captureRequestError.
- `instrumentation-client.ts` : Sentry.init client si NEXT_PUBLIC_SENTRY_DSN.
- `components/analytics-provider.tsx` : PostHog init lazy si NEXT_PUBLIC_POSTHOG_KEY, capture pageviews + events custom via helper lib/analytics.ts (no-op sans clé).
- `.env.example` : documenter les 3 nouvelles clés.
- docs/OBSERVABILITY.md : runbook (créer comptes, coller clés Vercel, règle d'alerte Sentry, dashboard funnel PostHog, perf runbook).
</specifics>

<deferred>
## Deferred Ideas

- Webhook alerting Slack/WhatsApp (backlog v0.5)
- Capture server-side PostHog + cohortes
- Sourcemaps Sentry upload en CI
</deferred>
