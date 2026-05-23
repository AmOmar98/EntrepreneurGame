# J3 · 12h20 · TICK · VERT

- PROD home : 307 redirect · 1076ms (nominal — redirect vers /login attendu)
- Vercel 5xx (15 min) : 0 (MCP runtime logs inaccessible 403 — faux positif connu, pas de signal 5xx)
- Supabase RLS denied (15 min) : 0
- Slow queries : aucune
- Auth errors : 0 (seuls events = token refresh Omar + GET /user 200 bulk depuis middleware Vercel)
- Active sessions (15 min) : 0 — pitch off-platform J3 midi, attendu
- pitch-deck-v1 soumissions : 1 (Simock — stable vs tick 12h10)
- Evaluations nouvelles (15 min) : 0 — jury off-platform
- Deploy status : non verifie (403 Vercel list_deployments — faux positif connu)
- Advisors : nominaux — memes WARNs pre-existants (search_path mutable x4, SECURITY DEFINER anon-accessible x10+, leaked password protection) · aucun nouveau

## Note SQL mgmt-api

Logs postgres montrent ~10 ERROR sur 15 min (colonnes manquantes : `deliverable_slug`, `s.template_id`, `doc_url`, `invalid enum not_started`). Source systematique = application_name=mgmt-api (Supabase Studio dashboard queries), pas code app. Pre-existant depuis J1. Non applicatif — exclu des seuils HARD per politique faux positifs.

**Verdict** : VERT · prochain tick 12h35
