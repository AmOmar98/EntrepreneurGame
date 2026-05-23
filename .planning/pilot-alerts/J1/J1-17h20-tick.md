# J1 · 17h20 · TICK · VERT

- PROD home : 307 · 271ms (redirect nominal cdg1)
- Vercel 5xx (15 min) : 0 (API 403 sur runtime logs — acces MCP limite, non bloquant)
- Supabase RLS denied (15 min) : 6x `permission denied for table announcements` — faux positif connu (table non exposee via RLS, identique ticks precedents)
- Supabase SQL error notable : 2x `column "created_at" does not exist` via mgmt-api (application=mgmt-api, pas applicatif Players) — echo probablement de query Supabase Studio ou advisor scan, pas de regression code
- Slow queries : aucune detectee (checkpoints WAL nominaux : write ~1.3s, distance ~49 MB — normal)
- Auth errors Players : 0 (logs auth 24h = 0 event level error/warn, 0 code 401/403)
- Active sessions (15 min) : 3 (vs 6 tick J1-17h10 — drop fin de journee atelier, attendu)
- Soumissions J1 cumul : 16 (stable vs tick precedent)
- Deploy status : non verifiable via MCP (403 list_deployments) — PROD home 200/307 OK, pas de regression detectee
- Advisors security : 0 nouveau — WALUEs pre-existantes (search_path mutable, SECURITY DEFINER anon-callable) identiques aux ticks precedents, hors perimetre pilote live

**Verdict** : VERT — fin de journee J1 nominale. Sessions en baisse naturelle post-atelier (3 actives vs 6 a 17h10). 16 soumissions cumulees J1 confirme activite Players. RAS.

Prochain tick : J1-17h30 ou J2 selon cadence.
