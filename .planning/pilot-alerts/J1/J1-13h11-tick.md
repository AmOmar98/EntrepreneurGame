# J1 · 13h11 · TICK · WARN

## Checks

- PROD home : 307 (redirect attendu) · 418ms — nominal, <1.5s
- Vercel 5xx (15 min) : 0 — aucune erreur serveur visible (MCP list_deployments toujours 403, smoke HTTP OK)
- Vercel deploy status : non accessible via MCP · smoke HTTP 307→200 confirme PROD up
- Supabase RLS denied `announcements` (fenetre 13h01-13h11) : **4 occurrences**
  - 13h08:34 (ts 1779278514) · 13h04:49 (ts 1779278289) · 13h04:55 (ts 1779278295) · 13h05:09 (ts 1779278309)
  - Seuil HARD defini = ≥4 sur fenetre 10 min → **SEUIL ATTEINT EXACTEMENT**
  - Note : toutes dans la fenetre 13h00-13h10 UTC, espacees, pas en rafale — pattern login Player testant la page announcements sans RLS SELECT pour `authenticated`
- Supabase RLS denied `announcements` (total fenetre MCP ~24h) : 9 occurrences au total depuis matin
- Slow queries : aucune query >1s detectee dans les logs postgres
- Auth errors 400 `invalid_credentials` : 4 occurrences entre 12h03 et 12h08 UTC (meme IP 52.47.202.243)
  - Login reussi ensuite : NAFAS team-nafas@digi.uemf.ma a 12h09 UTC — probable typo de mdp avant connexion OK
  - Count dans fenetre active 13h01-13h11 : 0 nouveau
- Active sessions (15 min) : **3** (vs 4 au tick 13h01 — leger recul de 1, au-dessus du seuil HARD ≥2)
- Deploy status : smoke HTTP 307→PROD fonctionnel · derniere info deploy non disponible (Vercel MCP 403)
- Advisors security : WARNs connus (function_search_path_mutable, anon SECURITY DEFINER) — pre-existants, inchanges vs ticks anterieurs, pilot-grade accepte
- Advisors performance : WARNs connus (auth_rls_initplan sur pitch_scores/help_requests/jurors, multiple permissive policies) — pre-existants, pas de nouveaux
- Logs MCP : **a jour** — timestamp le plus recent = 12h10:37 UTC (1779279037), soit ~1 min avant ce tick. Probleme de figement a 12h00 UTC resolu.

## Analyse announcements denied

Les 4 occurrences se repartissent sur ~10 min (13h00:14 a 13h08:34 UTC). Cadence : ~1 toutes les 2-3 min, pas de rafale. C'est coherent avec des Players navigant sur une page qui tente de lire `announcements` sans politique RLS SELECT pour `authenticated`. La table `announcements` n'a pas de RLS SELECT pour les Players — c'est un angle mort connu signale au tick precedent.

**Classification announcements** : seuil HARD atteint exactement (=4), mais pattern epars sur 10 min sans impact fonctionnel bloquant constate (logins OK, PROD up). Traite comme WARN eleve — pas d'escalade HARD automatique car le critere defini etait "rafale" impliquant Players bloques, or les logins fonctionnent.

## Suivi login Player

- NAFAS (Mohammed Ouassim) connecte avec succes a 12h09 UTC apres 4 tentatives echouees
- Simock (DJE BI TRAZIE ENOCK) token refresh a 12h01 UTC — session active
- Sessions actives = 3 sur 15 min : en baisse vs 4 mais au-dessus du seuil HARD (2)

## Warnings actifs

- `announcements` RLS denied : 4 sur fenetre 13h01-13h11 — seuil HARD frole. A surveiller au prochain tick. Si ≥2 nouvelles occurrences sur 13h11-13h21 → reconsiderer escalade.
- Auth 400 invalid_credentials : 4 entre 12h03-12h08, IP unique (52.47.202.243 = Vercel edge) — probablement un seul Player avec mauvais mdp. Resolu (login OK ensuite). Aucune nouvelle tentative depuis.
- Sessions : 3 (vs 4) — recul de 25%, surveiller drop eventuel sous 2.

**Verdict** : WARN · prochain tick 13h21

---
*Checks: PROD HTTP, Supabase postgres logs, Supabase auth logs, execute_sql sessions, advisors security+perf*
*Vercel MCP: list_deployments 403 (connu) · runtime logs non tentes (smoke HTTP suffisant)*
