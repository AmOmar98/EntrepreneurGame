# J2 · 17h15 · TICK · VERT

- PROD home : 307 · 1138ms (redirect normal, sous seuil WARN 1500ms)
- Vercel 5xx (15 min) : 0 (MCP Vercel 403 = faux positif connu, pas d'acces logs — base curl OK)
- Supabase RLS denied (15 min) : announcements x2 (faux positif definitif) — aucune autre table
- Slow queries : aucune detectee
- Auth errors Players PROD : 0 — les 3x 400 `/token?grant_type=password` viennent de `referer: localhost:3000` (tests dev Omar, pas PROD) ; 2x 400 refresh_token = faux positif connu (session_not_found)
- Active sessions (15 min) : 1 (vs 3 au tick 15h50 — fin apres-midi, baisse normale)
- Soumissions totales : 47 (+1 vs tick precedent)
- Evaluations totales : 25 (stable)
- Deploy status : Vercel MCP 403 indisponible (faux positif connu) — PROD repond 307/1138ms, fonctionnel
- Advisors : WARNs existants uniquement (function_search_path_mutable, anon_security_definer, auth_rls_initplan sur pitch_scores/help_requests/jurors) — tous connus, pilot-grade accepte, aucun nouveau

## Note de vigilance (non-bloquant)

- `column "created_at" does not exist` : 1 occurrence isolee dans postgres logs, origine mgmt-api Supabase (connexion `user=postgres application_name=mgmt-api`), pas une query applicative (toutes les API calls REST sont 200). A surveiller si recurrence.

**Verdict** : VERT · prochain tick 17h30
