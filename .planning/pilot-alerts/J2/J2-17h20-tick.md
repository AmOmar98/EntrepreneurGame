# J2 · 17h20 · TICK · VERT

- PROD home : 307 (redirect attendu) · 206ms — nominal
- Vercel 5xx (15 min) : 0 — API logs 100% 200/101/HEAD 200
- Supabase RLS denied (15 min) : `permission denied for table announcements` · 3 occurrences — FAUX POSITIF DEFINITIF, ne pas escalader
- Slow queries : aucune detectee dans les logs postgres sur la fenetre
- Auth errors : 0 — token refresh 200 OK, auth/v1/user 200 partout
- Active sessions (15 min) : 4 (vs 1 tick J2-17h15 — remontee normale, Players actifs en soiree)
- Soumissions totales : 47 (stable vs J2-17h15)
- Evaluations totales : 25 (stable vs J2-17h15)
- Deploy status : Vercel MCP 403 faux positif connu — pas de build en cours detectable
- Advisors security : 26 WARNs connus (function_search_path_mutable + anon/authenticated SECURITY DEFINER) — aucun nouveau par rapport aux ticks precedents, pre-dates hotfix ad86675, post-pilote backlog

**Verdict** : RAS · prochain tick J2-17h35
