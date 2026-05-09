# Deploiement prod - Entrepreneur Game

## Pre-requis
- Compte Vercel (free tier suffit pour le pilote)
- Projet Supabase prod cree avec schema applique (database/schema.sql -> triggers.sql -> rls.sql)
- Compte GitHub avec acces repo `EntrepreneurGame`
- Domaine custom optionnel (EIC/UEMF)

## Etapes initiales (premier deploiement)

### 1. Lier le repo a Vercel
Option A (recommande) - Dashboard :
- Vercel.com -> Add New -> Project -> Import Git Repository -> selectionner `EntrepreneurGame`
- Framework Preset : detecte automatiquement Next.js
- Build & Output Settings : laisser par defaut (Vercel detecte `next build`)
- Install Command : `npm install`
- Output Directory : (laisser vide - Vercel sait servir Next 15 nativement)

Option B - CLI :
```bash
npm i -g vercel
vercel link
vercel --prod
```

### 2. Configurer env vars Vercel
Dashboard -> Project -> Settings -> Environment Variables :

| Variable | Valeur | Environments | Type |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | https://<ref>.supabase.co | Production, Preview, Development | Plain |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key Supabase) | Production, Preview, Development | Plain |
| `SUPABASE_SERVICE_ROLE_KEY` | (service role key Supabase) | **Production only** | **Secret/Sensitive** |
| `NEXT_PUBLIC_APP_URL` | https://entrepreneur-game-six.vercel.app | Production, Preview, Development | Plain |

SECURITY : `SUPABASE_SERVICE_ROLE_KEY` doit etre marque "Sensitive" et ne JAMAIS commencer par `NEXT_PUBLIC_`. Bypass RLS - server only.

### 3. Configurer Supabase Auth pour la prod
Supabase Dashboard -> Authentication -> URL Configuration :
- Site URL : `https://entrepreneur-game-six.vercel.app` (ou domaine custom)
- Redirect URLs : ajouter
  - `https://entrepreneur-game-six.vercel.app/auth/callback`
  - `https://entrepreneur-game-six.vercel.app/**` (preview deploys)
  - URL custom domain si applicable

Templates email (Authentication -> Email Templates -> Magic Link) :
- Verifier locale FR pour le sujet et corps
- {{ .ConfirmationURL }} pointe vers Site URL

### 4. Premier deploy
```bash
git push origin main
```
Vercel build + deploy auto. Attendre statut "Ready" dans le dashboard.

## Procedure deploy continu
- Push sur `main` -> Vercel build + deploy auto en Production
- Push sur autre branche / PR -> Preview deploy (tester avant merge)
- Logs : Vercel Dashboard -> Deployments -> selectionner deploy -> Function Logs

## Rollback

### Rollback code
- Vercel Dashboard -> Deployments
- Trouver deploy precedent stable
- "..." menu -> "Promote to Production"
- Effet immediat (~30s propagation CDN)

### Rollback DB
- Supabase Dashboard -> Database -> Backups
- Choisir snapshot pre-incident -> Restore
- ATTENTION : restore = perte des writes depuis le snapshot

## Variables critiques

| Var | Build/Runtime | Public | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Build + Runtime | Yes | URL Supabase, embedded client bundle |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build + Runtime | Yes | RLS-protected cote DB |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime server | **NO - Sensitive** | Bypass RLS, server actions only |
| `NEXT_PUBLIC_APP_URL` | Build + Runtime | Yes | Pour magic link redirects + emails |

## Domaine custom (optionnel)
1. Vercel -> Settings -> Domains -> Add `entrepreneur.eic.uemf.ac.ma` (exemple)
2. Configurer CNAME chez DNS UEMF vers `cname.vercel-dns.com`
3. Vercel verifie + provisionne cert TLS auto
4. Mettre a jour :
   - Supabase Auth Site URL = nouveau domaine
   - `NEXT_PUBLIC_APP_URL` env var = nouveau domaine
   - Trigger un nouveau deploy pour propager `NEXT_PUBLIC_APP_URL`

## Checklist post-deploy
- [ ] URL prod ouvre `/login` en HTTPS sans warning cert
- [ ] Magic link envoye -> email recu -> clic -> redirect vers `/journey` ou `/onboarding`
- [ ] Header securite present : `curl -I <url>` montre `X-Frame-Options: DENY`
- [ ] Region cdg1 (Paris) confirmee dans Vercel deploy summary
- [ ] Smoke test E2E (voir SMOKE-TEST-E2E.md)

## Smoke test post-deploy
Voir `.planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/SMOKE-TEST-E2E.md` pour la checklist complete a executer apres chaque deploy production majeur.

## Troubleshooting

### Build fail "Module not found"
- Verifier `package.json` lockfile a jour (`npm install` puis commit `package-lock.json`)
- Verifier alias `@/*` dans `tsconfig.json`

### Magic link redirige vers localhost en prod
- `NEXT_PUBLIC_APP_URL` mal configuree ou non rebuild apres changement
- Supabase Site URL non a jour
- Re-deploy apres avoir corrige

### "Not authenticated" sur toutes pages prod
- Cookies Supabase non set : verifier middleware actif (`middleware.ts` matcher correct)
- Verifier env vars `NEXT_PUBLIC_SUPABASE_*` presentes en runtime (pas seulement build)

### RLS errors "permission denied for table"
- Schema applique sans `triggers.sql` ou `rls.sql`
- Re-appliquer dans l'ordre exact : `schema -> triggers -> rls`
