# J2 · 11h30 · TICK · VERT

- PROD home : 307 · 265ms (redirect vers /login — comportement normal, auth middleware actif)
- Vercel 5xx (15 min) : 0 (MCP runtime logs inaccessible 403 — faux positif connu ; aucun signal d'erreur côté Supabase auth)
- Supabase RLS denied (15 min) : 1 · `permission denied for table announcements` — faux positif définitif connu
- Slow queries : aucune `slow query` explicite dans les logs postgres ; checkpoints normaux (32-49 MB distance)
- Auth errors (15 min) : 0 erreur · 1 login réussi (`i.bousmaha@ueuromed.org` 10h29) + 1 token refresh réussi (NAFAS — AMRI Mohammed Ouassim 10h27) · tous status 200
- Active sessions (15 min) : **2** (stable vs 1 au tick J2-11h20)
- Soumissions (15 min) : requête SQL échouée — colonne `created_at` absente sur `public.submissions` (schema utilise probablement `submitted_at`) — non-bloquant pour le monitoring
- Deploy status : non interrogé (list_deployments 403 — faux positif connu) ; dernier commit `d601409` en place
- Advisors sécurité : 20+ WARN existants (functions search_path mutable + SECURITY DEFINER anon-callable) — identiques aux ticks précédents, aucun nouveau

**Verdict** : VERT · 2 sessions actives · 1 login mentor Bousmaha en cours · prochain tick J2-11h45

---
_Note technique_ : la colonne de timestamp sur `public.submissions` n'est pas `created_at` — à confirmer avec `submitted_at` si le suivi des soumissions temps-réel est souhaité.
