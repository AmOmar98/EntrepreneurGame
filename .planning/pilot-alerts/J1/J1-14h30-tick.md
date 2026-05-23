# J1 · 14h30 · TICK · WARN

- PROD home : 307 · 285ms (redirect nominal, sous seuil)
- Vercel 5xx (15 min) : 0 (Vercel MCP 403 persistant — smoke HTTP utilisé)
- Supabase RLS denied announcements (15 min) : **2** (13:15:33 UTC + 13:20:00 UTC) · cumul J1 ~12-14 · hausse continue
- Supabase erreur isolée : `column "updated_at" does not exist` · 13:25:56 UTC · 1 occurrence · origine mgmt-api (connexion postgres) · probablement tick watcher SQL sessions précédent ou outil MCP interne — non applicatif
- Slow queries : aucune signalée
- Auth errors (401/403) : 0
- Active sessions (15 min) : **0** (vs 1 tick précédent) · normal inter-atelier · dernière activité = team-simock@digi.uemf.ma refresh token 13:15:22 UTC
- Activité Player : 1 refresh token Simock (DJE BI TRAZIE ENOCK) · session active en début de fenêtre
- Deploy status : non vérifié via MCP (403) · PROD smoke OK 307/285ms
- Advisors : nominal — tous pre-existants (search_path mutable, SECURITY DEFINER anon-callable, RLS init plan pitch_scores). Aucun nouveau.

## Warnings (non-bloquant)

- **announcements RLS denied** : 2 occ sur 15 min · cumul J1 estimé ~12-14 · tendance hausse régulière depuis J1-13h00. Seuil HARD = 5 sur 10 min. Pas atteint.
  → Surveiller au prochain tick. Si rafale ≥5 en 10 min → escalade HARD.
- **`column "updated_at" does not exist`** : 1 occurrence isolée mgmt-api 13:25:56 UTC. Contexte : connexion postgres scram-sha-256 — possiblement requête MCP tick watcher sessions. Non reproductible sur logs applicatifs. Pas d'impact fonctionnel détecté.
- **Sessions = 0** : inter-atelier probable (créneau ~14h15-14h30). Reprise attendue dès prochain atelier.

**Verdict** : WARN · prochain tick 14h40
