# J1 - 14h10 - TICK - WARN

## Checks

- PROD home : 307 (redirect vers /login — comportement normal middleware auth) · 290ms · OK
- Vercel 5xx (15 min) : Vercel MCP non disponible (403 persistant) — fallback HTTP OK
- Vercel deploy status : non accessible via MCP · PROD fonctionnel (curl 290ms confirme)
- Supabase RLS denied — `announcements` (fenetre 14h00-14h10 locale) : **2 occurrences**
  - 14h08:39 locale · `permission denied for table announcements`
  - 14h04:59 locale · `permission denied for table announcements`
  - Cumul depuis 13h26 : ~6 occ totales sur la session J1 (hausse continue)
  - Seuil HARD >=5 sur 10 min : NON atteint (2 sur fenetre 14h00-14h10)
- SQL errors `updated_at` / `projects` : aucune dans les logs de ce tick · calme
- Slow queries : aucune query >1s visible dans les logs postgres
- Auth errors (401/403) : 0 · tous les /user et /token en 200
- Active sessions (SQL) : **0** (vs 1 tick precedent J1-14h00 — drop 100%)
  - Note : session `team-addictless` avait token_revoked a 14h42 locale (12h42 UTC) · refresh OK enregistre · la session peut etre idle mais toujours valide cote app
  - Omar (o.ameur@ueuromed.org) : login token refresh a 12h52 UTC (13h52 locale) · actif
- Validated submissions : **13** (stable vs tick 14h00)
- Nouvelles soumissions sur 15 min : **0**
- Auth logins recents : team-addictless (12h42 UTC), Omar UEMF (12h52 UTC) — 2 users actifs cette session
- Advisors security : nominal — memes WARNs existants (search_path mutable, anon SECURITY DEFINER) · pre-existants · pilot-grade accepte · aucun nouveau

## Warnings

- `announcements denied` : 2 occ sur 14h00-14h10 (WARN 1-4, HARD >=5 non atteint)
  - Tendance a la hausse depuis 13h26 (4 occ cumul precedent + 2 nouvelles = 6 total J1)
  - Cause probable : composant front qui tente de charger les annonces sans RLS SELECT autorise pour le role player · aucun impact bloquant confirme (app fonctionne, auth 200)
  - A surveiller : si le prochain tick depasse 5 occ sur 10 min → escalade HARD
- Active sessions SQL = 0 : le compteur `updated_at > now() - 15min` ne voit pas de refresh recent · les sessions peuvent etre idle (Players entre deux ateliers) · pas de drop applicatif confirme · Omar actif a 13h52 locale
- Vercel MCP 403 : persistant depuis J1-matin · monitoring HTTP seul disponible · non bloquant

**Verdict** : WARN · prochain tick J1-14h20
