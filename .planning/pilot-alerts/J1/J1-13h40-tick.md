# J1 · 13h40 · TICK · WARN

- PROD home : 307→200 · 340ms (redirect vers /login — normal, non-connecte) · OK
- Vercel 5xx (15 min) : 0 — MCP Vercel inaccessible (403 persistant), smoke HTTP confirme PROD up
- Supabase RLS denied (15 min) : 1 occurrence `permission denied for table announcements` visible dans fenetre (timestamp ~13h22) — RLS bug connu, non bloquant
- Supabase ERROR nouveau : `column s.updated_at does not exist` — 1 occurrence a 13h26 · VOIR WARN ci-dessous
- Supabase ERROR nouveau : `relation "projects" does not exist` — 1 occurrence a 13h26 · VOIR WARN ci-dessous
- Slow queries : aucune signalee dans les logs postgres (aucun slow query tag)
- Auth errors : 0 · tous les /user et /token retournent 200 · 1 login refresh token pour `team-bla-dwa@digi.uemf.ma` (Bla Dwa — Jriria Zakariae) a 13h31 — normal
- Active sessions (15 min) : 1 (baisse vs 5 tick precedent — WARN drop >50%)
- Submissions globales : submitted_v1=1 · validated=12 (stable vs tick precedent 1+12)
- Submissions 15 min : 1 submitted_v1 (1 nouvelle soumission dans la fenetre)
- Auth logs referer : `http://localhost:3000` sur toutes les requetes — indique trafic depuis env dev/test Omar (pas Players reels depuis vercel.app), OR c'est le referer Vercel SSR attendu
- Deploy status : non lisible (Vercel MCP 403) · smoke HTTP confirme PROD up
- Advisors security : WARNs existants (function_search_path_mutable, anon_security_definer) — tous connus, aucun nouveau

## Warnings (non-bloquant)

- **Sessions drop** : 1 session active (15 min) vs 5 tick precedent · drop >50% · possible creux d'apres-midi ou Players en atelier sans navigateur ouvert · non-bloquant a ce stade
- **ERROR `column s.updated_at does not exist`** (timestamp 1779280280004000 = ~13h26) : une requete en production reference `s.updated_at` qui n'existe pas dans la table `submissions` (colonnes reelles : id, player_id, deliverable_template_id, version, kind, proof_url, proof_text, status, submitted_by, submitted_at). Source probable : une query admin/mentor utilise `s.updated_at` comme alias ou colonne inexistante. 1 seule occurrence observee — si recurrence ou 5xx associes, escalader HARD.
- **ERROR `relation "projects" does not exist`** (timestamp 1779280272135000 = ~13h26) : requete referençant une table `projects` qui n'existe pas dans le schema PROD. Probablement une requete MCP ou admin mal ciblee (vestige AgreenTech ?). 1 seule occurrence. Surveiller.
- **announcements denied** : 1 occurrence (~13h22) — RLS bug connu, non bloquant, meme profil tick precedent

**Verdict** : WARN · sessions basses + 2 erreurs SQL ponctuelles a surveiller · prochain tick 13h50
