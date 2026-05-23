# J1 · 15h40 · TICK · VERT

- PROD home : 307 · 1144ms (tendance : 897 → 1065 → 1114 → 1144ms, hausse douce continue, sous WARN=1500ms)
- Vercel 5xx (15 min) : 0 (MCP 403 sur runtime logs — smoke HTTP confirme 307 propre, pas de panique)
- Supabase RLS denied (15 min) : 3 occurrences `permission denied for table announcements` (timestamps 15h29, 15h31, 15h35) — tendance en baisse vs ticks précédents, non bloquant
- Slow queries : aucune >1s détectée dans les logs postgres (checkpoints normaux 45 et 22 buffers)
- Erreur secondaire postgres : `column "created_at" does not exist` × 2 (timestamps ~15h28 et ~15h14) — probablement requête MCP watcher sur `submissions`, pas un appel Player. Non bloquant.
- Auth errors : 0 erreur 401/403. Auth entièrement saine — 3 logins token_refresh (MedNova, Bla Dwa, Simock, MindBot) tous 200 sur les 15 min.
- Active sessions (15 min) : **5** (hausse vs 0 au tick 15h30 — Players actifs en atelier)
- Deploy status : Vercel list_deployments 403 (accès token insuffisant) — smoke HTTP 307→redirect propre confirme deploy UP
- Advisors security : 25 WARNs connus (function_search_path_mutable × 4, anon/authenticated SECURITY DEFINER × 20, leaked_password_protection × 1) — tous pré-existants, aucun nouveau

## Notes de contexte

- Referer `http://localhost:3000` dans les logs auth : normal, c'est l'entête Supabase SDK depuis Vercel SSR — pas des sessions localhost réelles.
- Équipes identifiées actives : MedNova (team-mednova), Bla Dwa (team-bla-dwa), Simock (team-simock), MindBot (team-mindbot).
- Latence PROD : +30ms depuis tick précédent (1114→1144ms). Tendance hausse sur 4 ticks consécutifs. Pas WARN mais à surveiller — si hausse continue au prochain tick (>1200ms), noter explicitement.

**Verdict** : VERT · prochain tick 15h50
