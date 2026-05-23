# J1 · 17h00 · TICK · VERT

- PROD home : 307 (redirect login) · 233ms — nominal, bien sous 1200ms
- Vercel 5xx (15 min) : 0 — Vercel MCP token hors scope equipe (403), smoke HTTP direct OK
- Supabase RLS denied (15 min) : 4 x `permission denied for table announcements` — faux positif connu, table vide sans RLS SELECT pour anon/authenticated, comportement stable depuis J1 matin
- Slow queries : aucune mentionnée dans postgres logs — checkpoints normaux (WAL recycle 2 fichiers, write ~1-2s)
- Auth errors : 0 — 100 entrées auth scannees, 0 invalid_credentials, 0 otp_expired, 0 401/403 Players reels
- Active sessions (15 min) : 6 — cohérent avec fin d'atelier J1, montée vs 0 du creux 16h50
- Deploy status : PROD repond 233ms, dernier commit d601409 (docs smoke V4) — pas de deploy en cours detecte
- Advisors security : WARNs pre-existants (search_path mutable sur 4 fonctions, SECURITY DEFINER accessibles anon/authenticated) — tous connus, inchanges depuis pre-pilote, aucun nouveau
- Advisors performance : WARNs pre-existants (auth_rls_initplan sur pitch_scores/help_requests/jurors, unindexed FK sur help_requests/jurors) — connus, inchanges, sans impact au volume pilote (< 30 sessions)
- Soumissions J1 cumul : 16 (stable vs historique 16h50)

**Notes**
- `column "created_at" does not exist` sur table `submissions` observe dans postgres logs (timestamp ~16h27) — requete mgmt-api Supabase interne, pas applicatif. A surveiller si recurrent.
- Faux positif Vercel MCP : token de scope equipe non configure pour ce projet. Smoke HTTP direct (curl) confirme PROD UP.

**Verdict** : RAS · prochain tick 17h10
