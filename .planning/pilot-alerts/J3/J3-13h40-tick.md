# J3 · 13h40 · TICK · VERT

- PROD home : 307 · 981ms (redirect normal, <1500ms)
- Vercel 5xx (15 min) : 0 (MCP 403 sur list/runtime — connue, ignorée)
- Supabase RLS denied (15 min) : 0
- Postgres ERRORs visibles : plusieurs `column/relation does not exist` — tous issus de `application_name=mgmt-api` (Supabase interne), pas de trafic applicatif. Non-bloquant.
- Slow queries : aucune détectée
- Auth errors (15 min) : 0 · dernier login = 10h55 Omar local (localhost:3000)
- Active sessions (15 min) : 0 — attendu post-pitch, aucun Player actif
- M7 pitch-deck-v1 : 1 submission (stable — Simock, inchangé vs J3-13h30)
- Advisors security : WARNs pre-existants (SECURITY DEFINER functions, mutable search_path, leaked password) — baseline pilote, aucun nouveau
- Deploy status : dernier deploy opérationnel (hotfix ad86675), list_deployments 403 ignoré

**Verdict** : RAS · prochain tick J3-13h55
