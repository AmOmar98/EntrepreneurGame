# J2 · 14h20 · TICK · VERT

- PROD home : 307 · 941ms (redirect vers /login — nominal, sous seuil WARN 1200ms)
- Vercel 5xx (15 min) : 0
- Supabase RLS denied (15 min) : 0 (logs postgres = connexions mgmt-api + checkpoints uniquement)
- Slow queries : aucune >1s visible dans logs postgres
- SQL applicatif ERROR : 1 occurrence isolée `column "created_at" does not exist` sur submissions — faux positif connu, colonne s'appelle `submitted_at`. Erreur interne watcher, pas une erreur applicative Players.
- Auth errors (15 min) : 0 erreur 401/403. Logs auth = burst reconnexions 12h06-12h13 entierement resolues (toutes status 200). Faux positif DEFINITIF confirme.
- Active sessions (15 min) : **0** — normal en periode inter-atelier (historique : 0 confirme au tick J2-14h10)
- Soumissions totales : **45** (stable vs 45 au tick J2-14h10)
- Soumissions J2 (24h glissantes) : **30** — progression solide depuis matin
- Evaluations J2 (24h glissantes) : **11**
- Deploy status : dernier deploy operationnel (hotfix ad86675 confirme operationnel)
- Advisors security : nominal — memes WARNs connus depuis J1 (search_path mutable sur 4 fonctions, SECURITY DEFINER callable anon/authenticated sur helpers RLS, leaked password protection off). Aucun nouvel advisor. Pas d'escalade.

**Verdict** : RAS · prochain tick J2-14h35
