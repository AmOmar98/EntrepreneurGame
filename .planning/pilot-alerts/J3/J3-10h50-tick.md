# J3 · 10h50 · TICK · VERT

- PROD home : 307 · 975ms (stable, en dessous de 1.5s)
- Vercel 5xx (15 min) : 0 (aucune erreur applicative postgrest dans les logs)
- Supabase RLS denied (15 min) : 0 (aucun `permission denied` postgrest)
- Slow queries : aucune >1s detectee
- Auth errors : 0 erreur 401/403 — tous les events auth sont 200 (token refresh Omar + sessions Vercel SSR normales)
- Active sessions (15 min) : 0 (pitch off-platform en cours, normal — plus personne n'interagit avec l'app)
- M7 pitch-deck-v1 soumissions : 1 (stable, inchange vs tick 10h40)
- pitch_scores recents (3h) : 0 (jury scorait off-platform, attendu)
- Deploy status : non requete (token scope 403 connu) — dernier deploy operationnel hotfix ad86675
- Advisors security : memes WARNs structurels que ticks precedents (search_path mutable, SECURITY DEFINER callable anon/authenticated, leaked password protection off) — tous pre-existants, aucun nouveau, post-pilote uniquement

**Faux positifs ignores (comme convenu)** :
- Erreurs mgmt-api : `column "deliverable_slug" does not exist`, `column sub.template_id does not exist` — originent du Supabase Studio, pas du postgrest applicatif

**Verdict** : VERT · Sessions a zero attendu (pitch off-platform) · Donnees integres · prochain tick 11h05
