# J2 · 15h50 · TICK · VERT

- PROD home : 307 · 223ms (redirect vers /login — cold-start absent, nominal)
- Vercel 5xx (15 min) : 0
- Supabase RLS denied (15 min) : announcements uniquement (faux positif definitif — NE PAS ESCALADER)
- mgmt-api errors : `created_at` column not exist (faux positif definitif mgmt-api)
- Slow queries : aucune detectee
- Auth errors (15 min) : 0 erreur reelle Player — log vide de 401/403 applicatifs
- Active sessions (15 min) : 3 (hausse vs 1 a J2-15h41 — activite en cours)
- Soumissions totales : 46 (stable vs tick precedent)
- Evaluations totales : 25 (stable vs tick precedent)
- Deploy status : non interroge (Vercel list_deployments 403 = faux positif connu) — dernier deploy connu hotfix ad86675 operationnel

**Verdict** : RAS · prochain tick J2-16h05
