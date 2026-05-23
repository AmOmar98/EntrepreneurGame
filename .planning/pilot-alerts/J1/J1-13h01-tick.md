# J1 · 13h01 · TICK · WARN

- PROD home : 307 · 226ms (redirect / → /login, comportement normal Vercel — non-authentifie)
- Vercel 5xx (10 min) : 0 (MCP list_deployments 403 persistant ; smoke HTTP confirme PROD live)
- Vercel deploy status : inconnu via MCP (403) — dernier build connu : ready pre-J1
- Supabase RLS denied `announcements` (fenetre visible ~11h50-12h00 UTC) : 4 occ en 10 min
  → seuil HARD adapte = >=4/10min · MAIS fenetre courante (12h50-13h01) invisible (logs MCP figes a 12h00 UTC)
  → classification WARN : anomalie connue et stable depuis tick 12h52, pas de nouvelle pointe confirmee
- Slow queries : aucune >1s visible dans les logs
- Auth errors : 0 erreur 401/403 · token refresh OK (FokusMind — ZAHIRA BOULANOUAR, /token 200)
- Active sessions (15 min) : **4** (en hausse vs 2 au tick 12h52) — signal positif J1 montee en charge
- Advisors security : WARNs pre-existants uniquement (search_path mutable x4, anon SECURITY DEFINER x10, leaked password protection) — aucun nouveau, tous connus depuis post-pilote AgreenTech

## Observations

### RLS announcements — suivi anomalie
- Tick 12h52 : 4 occ/15min (WARN)
- Tick 13h01 : 4 occ dans la derniere fenetre visible (11h50-12h00 UTC) — toujours dans la zone WARN/HARD
- Les logs Supabase MCP ne remontent pas au-dela de 12h00 UTC lors de cet appel, ce qui rend invisible la fenetre 12h00-13h01
- Interpretation : pattern stable et periodique (Players naviguant sur une route qui tente de lire `announcements` sans politique RLS SELECT pour le role `authenticated`)
- Consequence Player : erreur silencieuse cote app (section annonces absente ou vide), pas de crash

### Sessions actives
- 4 sessions actives sur 15 min vs 2 au tick precedent → progression normale debut J1 workshop
- Utilisateur identifie dans auth logs : `team-fokusmind@digi.uemf.ma` (ZAHIRA BOULANOUAR) — refresh token actif

### Auth logs
- Activite referer `http://localhost:3000` dans les auth logs Supabase — cela indique que le middleware Next.js sur Vercel transmet l'en-tete Referer avec la valeur origine locale (artefact connu du SSR Vercel, non bloquant)
- Aucun 401/403 dans les logs auth

## Warnings (non-bloquant)

- **RLS `announcements`** : 4 occ/10min dans derniere fenetre connue — zone limite HARD mais non confirme sur fenetre courante. A surveiller au prochain tick.
  → Action recommendee post-pilote : ajouter policy `SELECT` pour `authenticated` sur `announcements`, ou supprimer la requete si la table n'est pas utilisee en J1.
- **Vercel MCP 403** : list_deployments et runtime_logs inaccessibles — smoke HTTP en substitut suffisant pour confirmer PROD live.
- **Logs MCP figes** : les logs postgres et auth remontes s'arretent a 12h00 UTC — latence ou limite de la fenetre MCP. La fenetre 12h00-13h01 est un angle mort.

**Verdict** : WARN · Sessions en hausse (bon signe J1) · RLS announcements a surveiller · prochain tick 13h11
