# J1 · 15h20 · TICK · WARN

- PROD home : 307 · 1065ms (redirection attendue — code non-200 mais infra OK, sous seuil HARD)
- Vercel 5xx (15 min) : 0 (API MCP 403 — accès runtime logs limité, pas d'erreur côté prod constatée)
- Supabase RLS denied (15 min) : 1 (`permission denied for table announcements` — 1 occurrence, ~15h13)
- Slow queries : aucune >1s détectée dans les logs postgres
- Auth errors : 0 (tous les /user et /token retournent 200 ; 1 login token Simock/DJE BI TRAZIE ENOCK à 13h15 — normal)
- Active sessions (15 min) : 0 — inter-atelier, cohérent avec tick 15h10
- Soumissions dernières 10 min : 0 nouvelles
- Soumissions cumul J1 (24h) : **15** — stable vs tick precedent
- Deploy status : Vercel list_deployments 403 (droits MCP insuffisants) — pas d'alerte build entrante
- Advisors security : WARNs connus pre-pilote (search_path mutable, SECURITY DEFINER anon-callable) — aucun nouveau
- Advisors perf : WARNs connus (RLS initplan pitch_scores/help_requests/jurors, unindexed FK help_requests/jurors) — aucun nouveau

## Note DB ERRORs recurrents
Deux types d'erreurs postgres apparaissent recurrentes (pas nouvelles ce tick) :
- `column "created_at" does not exist` — 2 occurrences dans la fenetre
- `column "updated_at" does not exist` — 1 occurrence dans la fenetre
Ces erreurs proviennent probablement de queries MCP management-api, pas du code app. A surveiller : si count augmente ou si elles apparaissent en contexte /user app, escalader.

## Warnings (non-bloquant)

- PROD home retourne 307 (redirect vers /login ou /journey) — comportement attendu pour la racine sans session. Latence 1065ms dans la fourchette WARN (>1s, <3s). Meme pattern que tick 15h10 (975ms).
- 1 `permission denied for table announcements` — sous seuil WARN (1-4). RLS boundaries test probable (Players explorant announcements sans acces). Surveiller si monte vers 5 occ/10min.
- Sessions = 0 : inter-atelier confirme. Pas de drop brutal (etait 0 au tick precedent aussi).

**Verdict** : WARN · prochain tick 15h30
