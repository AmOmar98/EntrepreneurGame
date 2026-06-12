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

> Section a completer par le plan 17-02.

### Ancres prevues

- Provider client dans `app/layout.tsx` (env-gate sur `NEXT_PUBLIC_POSTHOG_KEY`).
- Helper `lib/analytics.ts` avec events `eg_*`.
- Events captures : `eg_onboarding_completed`, `eg_deliverable_submitted`, `eg_deliverable_validated`, `eg_mentor_eval_submitted`.
- Session recording OFF ; aucune donnee de score/rang cote Player (R1 cardinal).

---

## Perf (QUAL-06)

> Section a completer par le plan 17-03.

### Ancres prevues

- `scripts/perf-seed-500.sql` : seed idempotent 500 users sur projet Supabase jetable.
- `scripts/perf-p95.mjs` : mesure P95 sur chemins critiques (/journey data, eval, jury).
- Revue statique RLS initplan : policies en `(SELECT auth.uid())` verifiees par grep.
- Runbook EXPLAIN pour les requetes critiques.
