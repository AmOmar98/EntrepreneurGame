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

> Section a completer par le plan 17-03.

### Ancres prevues

- `scripts/perf-seed-500.sql` : seed idempotent 500 users sur projet Supabase jetable.
- `scripts/perf-p95.mjs` : mesure P95 sur chemins critiques (/journey data, eval, jury).
- Revue statique RLS initplan : policies en `(SELECT auth.uid())` verifiees par grep.
- Runbook EXPLAIN pour les requetes critiques.
