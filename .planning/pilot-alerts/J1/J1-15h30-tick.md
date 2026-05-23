# J1 · 15h30 · TICK · VERT

- PROD home : 307 · 1114ms (redirect normal, latence stable vs 1065ms tick 15h20 — delta +49ms, dans la marge)
- Vercel 5xx (15 min) : 0 (API Vercel 403 sur runtime logs — acces token insuffisant ; aucune 5xx visible via Supabase auth logs)
- Supabase RLS denied (15 min) : 0 (postgres logs = uniquement connexions mgmt-api + authenticator, aucun permission denied)
- Slow queries : 0 (postgres logs : erreurs `created_at`/`updated_at` = faux-positifs mgmt-api MCP connus, ignores)
- Auth errors : 0 (auth logs = 100% 200 sur /user + /token · 1 login token_revoked normal — team-simock@digi.uemf.ma refresh token, statut 200)
- Active sessions (15 min) : 0 (stable — pattern identique ticks precedents, Players en session longue non comptabilises dans la fenetre 15 min)
- Soumissions cumul : 15 (stable, aucune nouvelle soumission depuis tick 15h20)
- Deploy status : Vercel API 403 (token scope insuffisant) — pas de signal d'echec, PROD repond normalement
- Advisors security : 24 WARNs connus (function_search_path_mutable x4 + anon/authenticated SECURITY DEFINER x19 + leaked_password_protection x1) — inchanges vs ticks precedents, pre-existants au pilote, aucun nouveau

**Verdict** : VERT · prochain tick 15h40

---
Notes operationnelles :
- Latence 307 : 1114ms, tendance legere hausse depuis 15h05 (897ms → 1065ms → 1114ms) — reste sous le seuil WARN de 1500ms, a surveiller
- token_revoked team-simock = comportement normal refresh session, pas une anomalie
- 0 nouvelle soumission sur 10 min = normal en fin d'atelier, les equipes sont probablement en train de finaliser
