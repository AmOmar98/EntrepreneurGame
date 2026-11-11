# Observabilite - Entrepreneur Game

Runbook operateur pour les trois piliers d'observabilite de la plateforme EIC.
Chaque pilier est env-gate : sans les cles correspondantes, l'SDK est no-op total
(build, CI et demo mode inchanges).

---

## Sentry (QUAL-04)

Capture automatique des erreurs serveur et client avec stack traces.
Implemente dans le plan 17-01. Cles a coller dans Vercel au checkpoint 17-03.

### 1. Creer le projet Sentry

1. Aller sur https://sentry.io et creer un compte gratuit (Sentry Free suffit pour le volume pilote).
2. New Project -> Next.js -> donner un nom (ex. `entrepreneur-game`).
3. Copier le DSN affiche a la creation (format `https://<key>@o<org>.ingest.sentry.io/<project>`).

### 2. Coller les cles dans Vercel

Dans le Dashboard Vercel -> Project -> Settings -> Environment Variables, ajouter deux variables en Production :

| Variable | Valeur | Type Vercel |
|---|---|---|
| `SENTRY_DSN` | DSN copie ci-dessus | Encrypted (server-only) |
| `NEXT_PUBLIC_SENTRY_DSN` | Meme DSN | Plain (public, envoye au navigateur) |

Apres avoir sauvegarde, redeploy (Vercel Deployments -> Redeploy).

### 3. Configurer la regle d'alerte email

Dans Sentry -> Alerts -> Create Alert Rule :
- Alert type : Issue
- Conditions : "A new issue is created"
- Actions : Send email to (votre adresse)
- Sauvegarder.

Cela envoie un email automatique sur chaque nouvel incident non vu.
Les webhooks Slack/WhatsApp sont hors-scope pour cette phase (backlog v0.5).

### 4. Verifier la capture end-to-end

Apres redeploy avec les cles :
1. Se connecter a la plateforme avec un compte mentor.
2. Tenter de soumettre une evaluation avec un `submissionId` invalide
   (via les DevTools, modifier temporairement la valeur dans le formulaire).
3. Dans Sentry -> Issues, verifier qu'un nouvel issue apparait avec la stack trace
   et le tag `action: evaluateSubmission`.
4. Optionnel : dans Sentry -> Issues, cliquer sur l'issue et verifier que le fichier
   source `app/actions.ts` est bien identifie.

### 5. Comportement sans les cles (demo / CI)

Sans `SENTRY_DSN` et `NEXT_PUBLIC_SENTRY_DSN` :
- `instrumentation.ts` : la fonction `register()` retourne sans appeler `Sentry.init`.
- `instrumentation-client.ts` : aucun init, SDK inactif cote navigateur.
- `reportServerError` dans `lib/observability.ts` : `Sentry.captureException` est
  elle-meme un no-op quand `init` n'a pas ete appele - aucun effet de bord.
- Build, typecheck, lint, tests unitaires et e2e : inchanges.

---

## PostHog (QUAL-05)

Traçage du funnel produit côté client. Totalement env-gate : sans `NEXT_PUBLIC_POSTHOG_KEY`,
`posthog-js` n'est jamais importé (import dynamique derrière la garde env). Build, CI et
demo mode restent inchangés.

### 1. Créer le projet PostHog

1. Aller sur https://posthog.com et créer un compte gratuit (PostHog Cloud Free suffit pour le volume pilote).
2. Créer un nouveau projet (ex. `entrepreneur-game`).
3. Dans Project Settings -> Project API Key, copier la clé (format `phc_...`).
4. Optionnel : noter l'API host si vous utilisez une instance self-hosted (sinon laisser vide — défaut `https://us.i.posthog.com`).

### 2. Coller les clés dans Vercel

Dans le Dashboard Vercel -> Project -> Settings -> Environment Variables, ajouter en Production :

| Variable | Valeur | Type Vercel |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Clé copiée ci-dessus (phc_...) | Plain (public) |
| `NEXT_PUBLIC_POSTHOG_HOST` | URL host (optionnel, laisser vide pour US cloud) | Plain (public) |

Après avoir sauvegardé, redeploy (Vercel Deployments -> Redeploy).

### 3. Les 4 événements capturés

| Event | Touchpoint | Ce que ça marque |
|---|---|---|
| `eg_onboarding_completed` | `components/onboarding-stepper.tsx` | Porteur a finalisé le KYC et accède pour la 1ère fois au /journey |
| `eg_deliverable_submitted` | `components/submission-form.tsx` | Porteur a soumis une preuve (V1 ou V2) pour un livrable |
| `eg_deliverable_validated` | `components/mentor-evaluation-panel.tsx` | Mentor a rendu un verdict validate_v1 ou validate_v2 |
| `eg_mentor_eval_submitted` | `components/mentor-evaluation-panel.tsx` | Mentor a soumis une évaluation (tous verdicts confondus) |

Props techniques envoyées (exemples) :
- `eg_deliverable_submitted` : `{ deliverableTemplateId: "persona-v1", version: 1 }`
- `eg_deliverable_validated` : `{ submissionId: "<uuid>", version: 1 }`
- `eg_mentor_eval_submitted` : `{ submissionId: "<uuid>", version: 1 }`

### 4. Construire le funnel dans l'interface PostHog

1. Dans PostHog -> Insights -> New insight -> Funnel.
2. Ajouter les étapes dans l'ordre :
   - Étape 1 : `eg_onboarding_completed`
   - Étape 2 : `eg_deliverable_submitted`
   - Étape 3 : `eg_deliverable_validated`
   - Étape 4 : `eg_mentor_eval_submitted`
3. Sauvegarder sous "EIC Funnel — livrables".
4. Le taux de conversion entre chaque étape = friction produit visible.
   Un drop-off élevé entre Étape 1 et 2 indique que les porteurs n'accèdent pas aux livrables.
   Un drop-off entre 2 et 3 indique que les mentors n'évaluent pas dans les délais.

### 5. Confidentialité / R1

- **Session recording OFF** (`disable_session_recording: true`).
- **Autocapture OFF** (`autocapture: false`) — seuls les événements `eg_*` explicites sont envoyés.
- **Aucun score, rang, note** dans les payloads des événements côté Player (R1 cardinal).
  Les props sont uniquement des identifiants techniques (`deliverableTemplateId`, `submissionId`, `version`).
- L'IP est envoyée à PostHog par défaut (comportement PostHog Cloud) ; pour masquer :
  ajouter `person_profiles: "never"` dans l'init si RGPD strict requis (hors scope pilote).

### 6. Comportement sans clé (demo / CI)

Sans `NEXT_PUBLIC_POSTHOG_KEY` :
- `components/analytics-provider.tsx` : l'import dynamique `import("posthog-js")` ne s'exécute jamais.
- `captureEvent` dans `lib/analytics.ts` : l'instance `_posthog` reste `undefined`, toutes les captures sont des no-ops silencieux.
- Build, typecheck, lint, tests unitaires (105) et e2e (24) : inchangés.

---

## Perf (QUAL-06)

Perf toolkit livré dans le plan 17-03. Les scripts sont en place et prêts à l'emploi.
L'exécution réelle est une décision opérateur (run optionnel avant freeze event).

### Décision : projet jetable (defaut) vs PROD hors-event

**Défaut** = projet Supabase jetable (nouveau projet gratuit, isolé de PROD).
PROD hors-event = décision opérateur explicite ; le cleanup block **doit** être exécuté après.

### 1. Seed : créer 500 utilisateurs synthétiques

**Via Node (recommandé — crée de vrais auth.users) :**
```bash
NEXT_PUBLIC_SUPABASE_URL=<url-projet-jetable> \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
node scripts/perf-seed-500.mjs 500 perf-report.json
```

**Via SQL (Supabase SQL editor ou psql) :**
```bash
psql $DATABASE_URL -f scripts/perf-seed-500.sql
```

Marqueur synthétique : toutes les lignes sont taguées `@perf-seed.invalid` / `perf-seed-player-NNNN`
pour que le cleanup soit total et ne touche rien d'autre.

### 2. Mesurer le P95 sur les 3 chemins critiques

```bash
NEXT_PUBLIC_SUPABASE_URL=<url> \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key> \
SMOKE_PLAYER_EMAIL=<email-porteur> SMOKE_PLAYER_PWD=<pwd> \
SMOKE_MENTOR_EMAIL=<email-mentor>  SMOKE_MENTOR_PWD=<pwd> \
SMOKE_JURY_EMAIL=<email-jury>      SMOKE_JURY_PWD=<pwd>   \
node scripts/perf-p95.mjs 100 perf-out.json
```

Chemins mesurés :
- `journey`    : `player_members` + `submissions` (session Porteur)
- `evaluation` : `submissions` + `evaluations` (session Mentor)
- `jury`       : `pitch_scores` + `pitch_criteria` (session Jury)

Le rapport JSON est écrit dans `perf-out.json` ; `console.table` affiche le résumé P50/P95/P99.

### 3. Vérification RLS initplan (statique)

```bash
node scripts/perf-p95.mjs --check-rls
```

Vérifie que tout `auth.uid()` à l'intérieur d'un sous-requête `EXISTS (...)` est
wrappé en `(SELECT auth.uid())` (initplan caching, O(1) au lieu de O(n) par ligne).
Sortie exit 0 = propre ; exit 1 = violation détectée.

Pour confirmer le caching initplan via EXPLAIN ANALYZE dans l'éditeur SQL Supabase :
```sql
EXPLAIN ANALYZE
SELECT id FROM public.submissions WHERE player_id = '<uuid>';
```
Rechercher `InitPlan` dans le plan d'exécution — confirme que `auth.uid()` n'est
pas ré-évalué pour chaque ligne de résultat.

### 4. Cleanup

```bash
# Via Node
NEXT_PUBLIC_SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> \
node scripts/perf-seed-500.mjs --cleanup

# Via SQL : décommenter le bloc CLEANUP en bas de scripts/perf-seed-500.sql
```

Le cleanup supprime toutes les lignes synthétiques dans l'ordre FK-safe (submissions →
player_members → profiles → auth.users → players → deliverable_templates → missions →
cohort → event → organization).

### 5. Coller les résultats dans 17-VERIFICATION.md

Après le run, copier le tableau P95 dans `.planning/phases/17-observabilite-perf/17-VERIFICATION.md`
sous la section QUAL-06 et marquer la ligne de statut comme `VERIFIED`.
