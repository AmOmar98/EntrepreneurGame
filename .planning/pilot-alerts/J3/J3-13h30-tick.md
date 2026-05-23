# J3 · 13h30 · TICK · VERT

- PROD home : 307 · 979ms (redirect normal — sous seuil WARN 2000ms)
- Vercel 5xx (15 min) : 0 (MCP 403 connu — pas de signal erreur applicatif)
- Supabase RLS denied (15 min) : 0
- Slow queries : aucune signalée (erreurs postgres = requetes mgmt-api sur ancien schema — faux positifs connus, hors app)
- Auth errors (15 min) : 0 erreur · derniere auth = o.ameur@ueuromed.org 10h55 (refresh token OK)
- Active sessions (15 min) : 0 — plateau post-pitch, J3 pitch off-platform confirme
- pitch-deck-v1 (M7) : 1 submission total (Simock, stable — pas de nouveau depot)
- pitch_scores evaluations : colonne submitted_at absente (jury score via is_draft/verdict — table OK, schema V4)
- Deploy status : non accessible via MCP (403) — PROD operationnel confirme par HTTP 307/979ms
- Advisors security : WARNs pre-existants (function_search_path_mutable x4, anon_security_definer x10, leaked_password_protection) — aucun nouveau depuis ticks precedents, pilote-grade accepte

**Verdict** : VERT · prochain tick 13h45
