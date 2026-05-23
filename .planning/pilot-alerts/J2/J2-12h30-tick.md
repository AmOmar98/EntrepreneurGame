# J2 · 12h30 · TICK · VERT

- PROD home : 307 · 243ms (redirect vers /login, normal — <300ms excellent)
- Vercel 5xx (15 min) : 0 (MCP 403 contourne comme attendu — pas de 5xx smoke HTTP)
- Supabase RLS denied (15 min) : 9 x `permission denied for table announcements` — FAUX POSITIF DEFINITIF connu, ignore
- Supabase RLS denied autres tables : 0
- Slow queries : aucune signalée dans les logs postgres (checkpoints normaux, write=1.3s/2.4s — I/O background, non applicatif)
- Auth errors : 0 — 100% des requetes /user et /token = status 200
- Auth logins actifs identifies dans logs : Graph-Anomal (Fatima Zahra Tliji), FokusMind (Zahira Boulanouar) — au moins 2 equipes actives
- Active sessions (15 min) : **4** (hausse vs tick J2-12h25 = 2 — retour de pause dejeune confirme)
- Soumissions totales : 45 (+2 vs 43 hier soir), dont 43 sur les dernieres 24h
- Evaluations totales : 23 (stable)
- Deploy status : hotfix ad86675 operationnel — aucun build en cours detecte
- Advisors security : 25 WARNs — tous identiques aux ticks precedents (search_path mutable + SECURITY DEFINER functions + leaked password protection) — AUCUN NOUVEAU, pas d'escalade requise

**Verdict** : VERT · Sessions remontent post-dejeuner (2→4), trafic reprend · prochain tick 12h45
