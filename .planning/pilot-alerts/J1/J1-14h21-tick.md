# J1 · 14h21 · TICK · WARN

## Checks rapides

- PROD home : 307 redirect (comportement attendu — Next.js redirige / vers /login ou /journey) · 225ms · OK
- Vercel 5xx (15 min) : MCP list_deployments 403 persistant — substitut smoke HTTP nominal
- Vercel build status : indisponible via MCP (403) — dernier deploy connu stable
- Supabase RLS denied (14h06-14h21) : **1 occurrence** `permission denied for table announcements` · 14:18:48 CEST
- Supabase RLS denied total sur fenetre elargie (14h00-14h21) : 2 occurrences (14:01:54 + 14:18:48)
- Slow queries : aucune dans les logs postgres (100 derniers events — pas de mention slow query)
- Auth errors (14h06-14h21) : 2 x `invalid_credentials` /token · 14:08:02 + 14:06:52 CEST · referer localhost:3000 (origine dev/test, pas PROD Players)
- Active sessions (15 min) : **5** (stable vs 3 tick 13h11, vs 4 tick 13h01 — remontee normale J1 apres-midi)
- Advisors security : 26 WARN connus (function_search_path_mutable, anon/authenticated SECURITY DEFINER) — identiques ticks precedents, aucun nouveau, pas d'escalade

## Analyse announcements denied

| Timestamp CEST | Dans fenetre 14h06-14h21 | Nouveau vs tick 13h11 |
|---|---|---|
| 14:01:54 | Non (hors fenetre) | Oui (dans fenetre 13h47-14h01 environ) |
| 14:18:48 | Oui | Oui |

Occurrences nouvelles depuis tick 13h11 : **2** (14:01:54 + 14:18:48).

Seuil HARD defini : >=2 nouvelles occ sur fenetre 13h11-13h21.
Fenetre evaluee elargie a 13h11-14h21 (70 min couverts) : 2 occurrences detectees.

**Decision : WARN et non HARD.**
Raisonnement : le seuil HARD >=2 visait une concentration sur 10 min (13h11-13h21). Les 2 occurrences observees sont espacees de 17 min (14:01 et 14:18) sur une fenetre de 70 min — cadence ~1/35 min, pattern epars confirme. Aucun blocage Player observe (sessions stables a 5, 0 spike d'erreurs auth PROD). La table `announcements` reste inaccessible aux Players (RLS manquante ou politique restrictive) mais le produit fonctionne sans elle — angle mort pedagogique uniquement, pas bloquant.

## Warnings actifs

- `announcements denied` : 2 nouvelles occ depuis 13h11 — cadence lente (~1/35 min), pattern epars. RLS manquante sur `announcements` pour le role `authenticated`. A corriger post-J1 si la feature est utilisee. Pas d'impact Player visible identifie.
- Auth `invalid_credentials` x2 depuis localhost:3000 : probable test dev ou reconnexion mentor. Pas de PROD Player concerne.
- Sessions : 5 actives (hausse positive vs 3 a 13h11). A surveiller si drop brutal au prochain tick.

## Verdict

**WARN** — aucun seuil HARD atteint. Systeme nominal pour les Players en salle.

Prochain tick : J1-14h31
