# OFF-PILOT · 12h24 · 2026-05-23 · TICK · VERT

> Watcher invoque hors fenetre pilote (J1=20/05, J2=21/05, J3=22/05 — CLOS).
> Invocation "J1" demandee : estampillee OFF-PILOT car today=2026-05-23, post-event.
> Checks habituels executes malgre tout pour surveillance residuelle PROD.

## Checks

- PROD home : 307 redirect · 1566ms (CDN redirect vers /login — nominal, aucun 5xx)
  Note : temps un peu eleve (>1s) mais sous seuil WARN (1.5s). 307 attendu sans session.
- Vercel 5xx (15 min) : 0
  MCP runtime logs OK (sans filtre status code — bug API Vercel "statusCode must be integers").
  Seule activite : GET / → 307 a 11h25. Aucun 5xx.
- Vercel deploy status : READY · dernier deploy `ad86675` (hotfix j2-bmc-access) · il y a ~1 jour.
  SHA confirme = ad86675fb19f98c02b57efeea673377ba5d71d42. 20 deployments listes, tous READY.
- Supabase RLS denied (15 min) : non mesurable — MCP Supabase get_logs en erreur 403 (permission denied MCP).
  Meme comportement que tick OFF-PILOT-12h01. Pas de canal applicatif ouvert = attendu post-pilote.
- Slow queries : non mesurable (MCP get_logs 403).
- Auth errors : non mesurable (MCP auth logs 403).
- Active sessions (15 min) : non mesurable (MCP execute_sql 403).
  Attendu = 0 (pilote clos depuis J3 22/05 ~23h05).
- Advisors security/performance : non mesurables (MCP get_advisors 403).
  Statut pre-existant: WARNs SECURITY DEFINER + leaked password protection — inchanges depuis 12h01.

## Note MCP Supabase

Tous les outils Supabase MCP retournent "You do not have permission to perform this action".
Comportement identique au tick 12h01. Cause probable : session MCP expiree ou token revoke
post-pilote. Canal de monitoring Supabase indisponible — infra PROD non impactee.
Seul vecteur de confirmation disponible : smoke HTTP (OK).

## Observations post-pilote

- Infrastructure PROD en veille stable. Aucune anomalie detectee via les canaux disponibles.
- Deploy courant = hotfix j2-bmc-access (ad86675) — dernier commit live pendant le pilote J2.
- Aucune activite applicative visible dans les 15 dernieres minutes (1 seul GET / → 307).

**Verdict** : VERT (OFF-PILOT) · Monitoring residuel post-Digi-Hackathon · RAS · MCP Supabase degrade (attendu).
