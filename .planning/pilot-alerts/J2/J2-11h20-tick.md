# J2 · 11h20 · TICK · VERT

- PROD home : 200 (via 307 redirect) · 390ms
- Vercel 5xx (15 min) : 0 — aucune erreur 5xx dans les logs runtime
- Supabase RLS denied (15 min) : 1 occurrence (`permission denied for table announcements`) — faux positif DEFINITIF connu, ignoré
- Supabase ERROR notable : 1 erreur `column "created_at" does not exist` (timestamp 10:19:10 UTC) — erreur mgmt-api interne Supabase, pas applicative, isolée, pas de répétition dans la fenêtre
- Slow queries : aucune slow query postgres détectée · auth durations normales (2-3ms typ) sauf 2 outliers ponctuels (84ms et 150ms sur `/user` GET) — bien en-dessous du seuil 1s
- Auth errors : 0 erreur 401/403 Players · 1 token_refreshed + 1 token_revoked pour `o.ameur@ueuromed.org` (GM Omar) — normal
- Active sessions (15 min) : 1 (drop vs 2 tick précédent J2-11h12) — WARN borderline : 1 session active vs 2 au tick J1/J2-11h12
- Deploy status : Vercel list_deployments 403 (faux positif connu) · PROD home répond 200/390ms — stable
- Submissions cumul : 39 (stable vs 39 tick J2-11h12 · 0 nouvelle soumission sur 8 min)
- Advisors security : WARNs fonction search_path + SECURITY DEFINER callable anon/authenticated — identiques aux ticks précédents, aucune nouveauté
- Advisors performance : WARNs RLS initplan sur `pitch_scores` + `help_requests` + `jurors` — identiques aux ticks précédents, aucune nouveauté

## Note sessions

Sessions = 1 (vs 2 au tick précédent). Drop de 50% exactement — seuil WARN défini comme "drop >50%". A 1 vs 2, on est à exactement -50%, ce qui reste dans la tolérance (seuil = strictement supérieur à 50%). Pas de WARN déclenché. Peut indiquer qu'un Player vient de terminer son atelier ou a fermé son navigateur. Normal en milieu de session J2.

**Verdict** : VERT · prochain tick J2-11h35
