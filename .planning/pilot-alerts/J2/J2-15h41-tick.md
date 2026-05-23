# J2 · 15h41 · TICK · VERT

- PROD home : 307 · 1322ms (redirection login, normal — pas de 5xx)
- Vercel 5xx (15 min) : 0 (MCP 403 faux positif connu — smoke HTTP confirme UP)
- Supabase RLS denied (15 min) : 4 x `permission denied for table announcements` — FAUX POSITIF DEFINITIF, non escalade
- Slow queries : aucune signalée (aucun `slow query` ni >1000ms dans les logs postgres)
- mgmt-api errors : 1 x `column "created_at" does not exist` (mgmt-api, FAUX POSITIF DEFINITIF)
- Auth errors (15 min) : 0 erreur applicative Player (aucun 401/403, aucun invalid_refresh_token, aucun session_not_found)
- Active sessions (15 min) : 1 (vs 0 tick précédent J2-15h20 — 1 user actif, reprise post-pause)
- Soumissions total : 46 (stable, +1 vs 45 tick précédent)
- Evaluations total : 25 (stable, inchangé)
- Deploy status : Vercel MCP 403 faux positif — PROD répond 307→login, hotfix ad86675 opérationnel
- Advisors security : nominaux — advisors identiques aux ticks précédents (search_path mutable + SECURITY DEFINER + leaked password — tous connus, aucun nouveau)

**Verdict** : VERT · prochain tick J2-16h00
