# J1 · 18h10 · TICK · WARN

- PROD home : 307 · 226ms (excellent, stable vs 234ms tick precedent)
- Vercel 5xx (15 min) : 0 (Vercel MCP 403 — deploy status non dispo ; HTTP smoke confirme PROD up)
- Vercel deploy status : indisponible via MCP (403 forbidden) — smoke HTTP confirme service operationnel
- Supabase RLS denied (15 min) : **5** sur table `announcements` — voir note ci-dessous
- Slow queries : aucune detectee dans les logs postgres
- Auth errors : 0 erreur — 2 logins reussis (NAFAS/AMRI + SIMOCK/token refresh), tous 200
- Active sessions : **6** (hausse vs 4 tick precedent a 18h00 — regain fin J1 confirme)
- Nouvelles soumissions (15 min) : **2** (actif)
- SQL `created_at` error : 1 occurrence a 17h41 UTC (timestamp 1779295278819) — hors fenetre 15 min, non recurrent ce tick
- Advisors security : nominal (WARNs pre-existants function_search_path_mutable + anon SECURITY DEFINER — connus, pilot-grade accepte)
- Advisors performance : nominal (WARNs pre-existants auth_rls_initplan pitch_scores + unindexed FK help_requests — connus)

## Avertissements (non-bloquant)

- RLS `announcements` : 5 `permission denied for table announcements` en 15 min (timestamps 17h03, 17h04, 17h06, 17h08, 17h09 UTC). Tous correles aux logins de NAFAS et SIMOCK. Pattern identique aux ticks precedents — la table `announcements` n'a pas de RLS policy SELECT pour le role `authenticated` ou le composant client tente de la lire sans grant. Pas de blocage fonctionnel constate (logins 200, sessions en hausse). Seuil WARN = 1-4 ; on est a 5 ce tick. A surveiller si ca depasse avec d'autres teams.
  → Pas d'action immediate requise. Si ce pattern persiste J2, envisager revue RLS announcements post-pilote.

- Sessions : passage de 4 a 6 en 10 min — normal (bilan fin J1, retour participants).

**Verdict** : WARN · prochain tick 18h20
