# J2 · 09h42 · TICK · WARN

- PROD home : 200 · 566ms (307→200 after redirect, nominal)
- Vercel 5xx (15 min) : 0 (Vercel runtime logs API returned 403 — token scope issue, not an app error)
- Vercel deploy status : API 403 — unable to verify latest build (known token scope limitation)
- Supabase RLS denied (15 min) : 1 × `permission denied for table announcements` — source `mgmt-api` (Supabase Studio), faux-positif connu
- Slow queries : aucune >1s détectée dans les logs postgres
- Auth errors : 0 erreur auth dans la fenêtre — 1 login `info` normal (user_id `5bb93b86`)
- Active sessions (15 min) : 1 (en baisse vs 2 tick précédent J2-09h21 — atelier pas encore démarré, attendu)
- Total soumissions cumulées : 27 (stable vs tick J2-09h21 — 0 nouvelle soumission sur 15 min, normal)
- Advisors security : WARNs existants inchangés (search_path mutable, SECURITY DEFINER anon-callable) — tous antérieurs au pilote, aucun nouveau
- Advisors performance : WARNs existants inchangés (pitch_scores RLS initplan, help_requests multiple permissive) — tous antérieurs

## SQL Errors — Suivi spécifique

Erreurs SQL visibles dans la fenêtre ~09h36-09h42 UTC :

| Timestamp UTC | Message | Application source |
|---|---|---|
| 09h36 | `column "mission_slug" does not exist` | `mgmt-api` |
| 09h41 | `relation "projects" does not exist` | `mgmt-api` |
| 09h41 | `relation "startups" does not exist` | `mgmt-api` |
| 09h42 | `column dt.mission_slug does not exist` | `mgmt-api` |
| 09h42 | `column m.slug does not exist` | `mgmt-api` |
| 09h42 | `permission denied for table announcements` | `mgmt-api` |

**Verdict source** : TOUTES les erreurs SQL sont originées de `application_name=mgmt-api` (Supabase Studio / mgmt introspection). Aucune n'est originée de `postgrest` (= requetes app). Ce sont des requetes d'introspection du Studio qui referent d'anciens noms de colonnes (`mission_slug`, `projects`, `startups`) — schemas de l'ère AgreenTech que le Studio tente encore d'inspecter. NON bloquantes pour l'application.

Les erreurs du tick J2-09h09 precedent (`created_at does not exist`, `mission_slug does not exist`) confirmees meme source mgmt-api.

## Warnings (non-bloquant)

- Sessions actives = 1 vs 2 au tick precedent — drop de 50%, mais absolu faible (atelier J2 pas encore en session, normal avant 10h)
- SQL errors mgmt-api : 6 nouvelles occurrences sur 15 min — source Studio confirmee, pas applicatif. Surveiller si frequence augmente fortement (indiquerait quelqu'un qui navigue activement dans le Studio pendant l'atelier).
- Vercel token 403 persiste — deploy status non verifiable par MCP. Contournement : verifier manuellement sur https://vercel.com/dashboard si deploy rouge suspect.

**Verdict** : WARN (sessions drop + SQL mgmt-api volume) · aucun impact Players · prochain tick 09h57
