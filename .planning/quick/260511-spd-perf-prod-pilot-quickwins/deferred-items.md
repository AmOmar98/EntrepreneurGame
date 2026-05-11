# Deferred items — v0.3 perf

Items identifiés pendant 260511-spd, sortis de scope pilote :

## Côté app / Next.js
- Refonte `getJourneyData` en RPC Postgres unique (collapse ~5 queries → 1).
- Suspense streaming sur `/journey` (CohortPulse + Announcements + BonusRail).
- Partial Prerendering (PPR) Next.js 15 sur le shell `/journey`.
- Bundle splitting `JourneyClient` (lazy-load drawer + hover details).
- `loading.tsx` skeletons par route (Player + GM).
- Audit bundle JS client + tree-shaking `lucide-react`.
- Cache headers DiceBear avatars (`api.dicebear.com`).
- Mesure perf authentifiée (Lighthouse + cookies session) — actuellement baseline mesure le shell `/login` après redirect 307.

## Côté Supabase
- Cleanup 6 unused indexes signalés par advisor `unused_index` :
  - `deliverable_templates_active_idx`
  - `announcements_event_created_idx`
  - `announcements_kind_idx`
  - `bonus_events_status_idx`
  - `bonus_events_validated_active_idx`
  - `moscow_cards_project_idx`
- Évaluer impact réel des `fk_indexes` post-pilote (volumes pilote << 1k rows, gain mesurable surtout en GM cockpit ou cascades DELETE).
- Audit `_authenticated_select` policies (qual=true) — sécurité : tout authenticated voit toutes les rows de `cohorts`, `levels`, `missions`, `events`, `deliverable_templates`. À durcir si scope multi-cohorte v0.3.

## Côté observability
- Wire Speed Insights → dashboard interne post-merge (LCP / INP / TTFB par route et par device).
- Ajouter Sentry / log structuré (actuellement `console.*` ad hoc).
- Audit RUM real-user data 14-21 mai → roadmap perf v0.3 priorisée par données.

## Côté process
- Step 3.4 (smoke dev-server detect script tag) : à automatiser proprement via Playwright headless en v0.3 (au lieu de PowerShell start/stop process).
- Step 4.4 / 5.4 (smoke routes demo) : idem.
- Lighthouse CLI cleanup EPERM Windows : ouvrir issue upstream `chrome-launcher` ou switcher vers Playwright Lighthouse plugin.
