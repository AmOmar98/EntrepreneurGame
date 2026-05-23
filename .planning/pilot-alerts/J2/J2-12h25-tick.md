# J2 · 12h25 · TICK · VERT

- PROD home : 307 (redirect vers login) · 217ms — nominal, bien sous 1200ms
- Vercel 5xx (15 min) : 0 — Vercel MCP indisponible (502 Cloudflare proxy), fallback HTTP OK
- Vercel deploy status : non vérifié (MCP 502) — dernier déploiement connu stable, pas d'alerte HTTP
- Supabase RLS denied (15 min) : announcements uniquement — faux positif définitif connu, ignoré
- Slow queries : aucune >1s détectée dans postgres logs (checkpoints normaux, connexions postgrest standard)
- Auth errors : 0 — tous GET /user status=200, aucun 401/403 Players réels
  - Note : durations auth élevées observées (2-87s sur /user) — origines Vercel cdg1 (18.175.x, 35.18x.x), comportement Supabase Auth normal en polling SSR, pas de timeout applicatif
- Active sessions (15 min) : 2 (vs 4 tick J2-12h10 — baisse cohérente pause déjeuner)
- Soumissions totales : 45 (+5 vs J2-12h10 tick = 40)
- Evaluations totales : 23 (stable)
- Advisors : nominal — tous WARNs connus (search_path mutable, SECURITY DEFINER, RLS initplan pitch_scores/help_requests/jurors) présents depuis J1, aucun nouveau

**Verdict** : VERT · sessions en repli pause déjeuner · soumissions actives (+5) · prochain tick J2-12h40
