# J2 · 10h40 · TICK · VERT

- PROD home : 307 · 256ms (redirect vers login, nominal)
- Vercel 5xx (15 min) : 0 (Vercel MCP 403 connu — faux positif definitif)
- Supabase RLS denied (15 min) : 6 occurrences "permission denied for table announcements" — FAUX POSITIF DEFINITIF (connu depuis J1)
- Slow queries : aucune dans les logs postgres (checkpoints reguliers, pas de slow query flag)
- Auth errors (15 min) : 0 erreur 401/403 — tous les /user et /token retournent 200. 1 token_revoked + login pour "team-nafas@digi.uemf.ma" (NAFAS — AMRI Mohammed Ouassim) — normal, refresh token de session active.
- Active sessions (15 min) : 1 (stable, debut atelier J2 — Players en ecoute)
- Soumissions totales : 31 (stable vs tick J2-10h30 = 31, aucune nouvelle soumission sur la periode)
- Deploy status : non interrogeable (Vercel MCP 403 connu) — dernier deploy operationnel hotfix ad86675
- Advisors : nominal — tous les WARNs security/perf sont pre-existants et connus (search_path mutable, SECURITY DEFINER anon-callable, RLS initplan pitch_scores/help_requests/jurors, unused indexes). Aucun nouvel advisor.

**Verdict** : RAS · prochain tick J2-10h55
