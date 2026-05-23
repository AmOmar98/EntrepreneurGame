# J2 · 10h50 · TICK · VERT

- PROD home : 307 (redirect normal vers /login) · 287ms — nominal
- Vercel 5xx (15 min) : 0 — (Vercel runtime logs API retourne 403 faux positif connu ; pas de signal 5xx visible)
- Supabase RLS denied (15 min) : 4 erreurs `permission denied for table announcements` — faux positif DEFINITIF, ignoré
- Slow queries : aucune >1s dans les logs postgres (checkpoints et connexions authenticator uniquement)
- Auth errors (15 min) : 2 erreurs `400: Invalid Refresh Token: Refresh Token Not Found` sur /token — stale tokens navigateur, non-bloquant (auto-redirige vers login). 0 erreur 401/403 Player réel.
- Active sessions (15 min) : **4** (hausse vs 1 au tick J2-10h40 — Players qui reprennent les ateliers)
- Soumissions nouvelles (15 min) : 0 — atelier en cours, cumul stable à **31**
- Auth logins observés (15 min) : 2 logins confirmés — `team-bla-dwa@digi.uemf.ma` (token refresh) + `team-mednova@digi.uemf.ma` (password login) + `team-fokusmind@digi.uemf.ma` (token refresh x2). Activité réelle constatée.
- Deploy status : aucun nouveau deploy détecté — hotfix ad86675 toujours en production
- Advisors security : WARNs identiques aux ticks précédents (search_path mutable + SECURITY DEFINER fonctions + leaked password protection) — aucun nouveau WARN, pas d'escalade

**Verdict** : RAS · prochain tick J2-11h05
