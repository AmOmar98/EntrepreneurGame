# J3 · 11h56 · TICK · VERT

- PROD home : 307 · 1483ms (redirect vers /login — nominal)
- Vercel 5xx (15 min) : 0 (runtime logs 403 = faux positif connu, pas de 5xx observable)
- Vercel deploy status : non interrogeable (list_deployments 403 = faux positif connu)
- Supabase RLS denied (15 min) : 0 erreur `permission denied` dans postgres logs
- Supabase SQL errors mgmt-api : 3 erreurs `column does not exist` (template_id / deliverable_slug / sub.template_id) — faux positifs connus, source=mgmt-api, pas applicatif
- Slow queries : aucune slow query detectee dans logs postgres
- Auth errors (15 min) : 0 erreur 401/403 — uniquement logins/refresh reussis (token_revoked=refresh normal, user_id=Omar GM)
- Active sessions (15 min) : **1** (Omar GM — localhost:3000, token refresh 10h55) — Players=0, coheret pitch off-platform
- pitch_scores recents (15 min) : 0 (jury off-platform, pitch_mode_state=off — attendu)
- M7 pitch-deck-v1 soumissions total : **1** (Simock — stable vs tick 10h50)
- Advisors security : nominal — memes WARNs recurrents (search_path mutable, SECURITY DEFINER anon-callable, leaked password protection). Pas de nouveau warning depuis ticks precedents.

**Verdict** : VERT · prochain tick 12h11

---
*Contexte J3 pitch-day : sessions Players=0 attendu pendant pitch jury off-platform. Plateforme en veille active. 1 seule soumission M7 (Simock) confirmee depuis J2.*
