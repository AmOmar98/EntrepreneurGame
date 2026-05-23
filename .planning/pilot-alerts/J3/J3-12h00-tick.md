# J3 · 12h00 · TICK · VERT

> Heure locale : 12h00. Pilote J3 (22/05/2026) — post-pitch, plateforme en veille.

- PROD home : 307 (redirect auth) · 1793ms — sous seuil HARD 3000ms ; dans fenetre WARN 1500-2000ms (cold-start veille, acceptable)
- Vercel 5xx (15 min) : 0 — Vercel MCP 403 connu, pas de signal failure
- Supabase RLS denied (15 min) : 1 × `permission denied for table announcements` — ignore per consigne
- Postgres ERRORs mgmt-api : plusieurs (`column deliverable_slug does not exist`, `column template_id`, `relation projects`) — tous `application_name=mgmt-api`, faux positifs Supabase interne sur schema post-restructuration, connus
- Slow queries : aucune >1s
- Auth errors Players (15 min) : 0 erreur — token_refresh 200 pour FokusMind (23h05) + NAFAS (22h21) = activite veille normale
- Active sessions (15 min) : 0 (veille confirmee post-pitch J3)
- pitch-deck-v1 soumissions : 1 (stable vs J3-16h20)
- pitch_scores 24h : 0 nouvelle evaluation (jury ferme)
- Deploy status : hotfix ad86675 operationnel — Vercel MCP 403 sur list_deployments (connu), PROD repond normalement
- Advisors security : WARNs pre-existants stables (function_search_path_mutable x4, SECURITY DEFINER anon-callable x9, leaked password protection) — aucun nouveau

**Verdict** : VERT — plateforme en veille stable. Pilote Digi-Hackathon J3 clos. Aucune action requise.
