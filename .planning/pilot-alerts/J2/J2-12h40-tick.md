# J2 · 12h40 · TICK · VERT

- PROD home : 307 (redirect) · 302ms
- Vercel 5xx (15 min) : 0 (Vercel MCP 403 faux positif connu — smoke HTTP confirme UP)
- Supabase RLS denied (15 min) : 1 · `announcements` table — faux positif definitif connu
- SQL errors (15 min) : 1 · `column "created_at" does not exist` via mgmt-api — non-applicatif, emission mgmt interne Supabase, non bloque Players
- Slow queries : aucune >1s detectable (postgres logs = connexions normales, checkpoints propres)
- Auth errors : 0 · tous statuts 200 · token_revoked/refreshed normaux (Graph-Anomal + Omar/GM)
- Active sessions (15 min) : 3 (retour pause dejeuner — etait 4 au tick J2-12h30, drop de 1 normal)
- Soumissions totales : 45 (stable vs tick precedent)
- Evaluations totales : 23 (stable vs tick precedent)
- Deploy status : Vercel list_deployments 403 faux positif connu · PROD home repondant 307→200 confirme deploy ready
- Advisors security : WARN connus (function_search_path_mutable, anon SECURITY DEFINER, leaked_password_protection) — tous pre-existants, aucun nouveau
- Advisors performance : WARN connus (auth_rls_initplan pitch_scores + help_requests + jurors, multiple_permissive_policies) — pre-existants, aucun nouveau

**Verdict** : VERT · prochain tick 12h55
