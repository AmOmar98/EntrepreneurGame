# J2 · 10h00 · TICK · VERT

- PROD home : 307 · 257ms (redirect vers /login — normal middleware auth, bien sous seuil 1200ms)
- Vercel 5xx (15 min) : 0
- Supabase RLS denied (15 min) : 2 (announcements — faux positif DEFINITIF, ignoré)
- Supabase SQL errors (mgmt-api) : `column "slug" does not exist` × 2 (app=mgmt-api, Supabase Studio — faux positif DEFINITIF)
- Slow queries : aucune >1s détectée dans les logs postgres
- Auth errors (15 min) : 0 erreur 401/403 Player. 2x `refresh_token_not_found` (HTTP 400) à 08h22 sur team-mednova — token expiré après reconnexion par password. Auto-résolu, pas de seuil atteint.
- Active sessions (15 min) : 1 (stable — début de séance J2, montée attendue 10h-11h)
- Nouvelles soumissions (15 min) : 0 — total cumulatif 27 (stable vs tick J2-09h56)
- Deploy status : dernier deploy opérationnel, hotfix ad86675 (M3-M5 access) actif
- Advisors security : 24 WARNs existants (function_search_path_mutable × 4, anon/authenticated SECURITY DEFINER × 19, auth_leaked_password_protection × 1) — tous présents depuis avant J1, aucun nouveau, pilot-grade accepté

**Logins actifs identifiés dans logs auth (08h00-10h00)** :
- team-mindbot@digi.uemf.ma — token refresh 08h57 (actif)
- team-bla-dwa@digi.uemf.ma — token refresh 08h45 (actif)
- team-fokusmind@digi.uemf.ma — token refresh 08h42 (actif)
- team-mednova@digi.uemf.ma — login password 08h22 (actif, refresh_token_not_found auto-résolu)
- +1 équipe non nommée IP 3.11.80.56 — login vers 08h21 (actif)

Minimum 4-5 équipes connectées en début de J2. Montée de session attendue 10h-11h.

**Verdict** : RAS · prochain tick J2-10h15
