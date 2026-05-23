# J1 · 14h40 · TICK · VERT

- PROD home : 307 · 263ms (redirect to /login — normal, Vercel SSR auth redirect)
- Vercel 5xx (10 min) : 0 (Vercel MCP token scope error — fallback: HTTP probe OK, no 5xx observed in Supabase auth logs)
- Supabase RLS denied (10 min) : 2 (`permission denied for table announcements` @ 13h20 + 13h20 — cumul J1 ~14-16)
- Slow queries : aucune visible dans logs postgres (seulement connexions authenticator + checkpoints normaux)
- Auth errors : 0 erreur 401/403 — 1 login token (user `team-simock`) + token_revoked normal @ 13h15 (refresh cycle)
- Active sessions (15 min) : 0 (inter-atelier confirmé — cohérent avec contexte 14h30)
- Nouvelles soumissions (10 min) : 0 · total J1 (24h) : 15 soumissions
- Deploy status : Vercel MCP token 403 (scope team) — pas bloquant, PROD répond 307/200 normalement
- Advisors security : nominaux (warnings SECURITY DEFINER pre-existants connus — pilot-grade acceptés, pas de nouveau)
- updated_at error (mgmt-api) : 1 occurrence confirmée @ 13h21 — identique tick 14h30, non-applicatif

## Notes d'observation

- Auth log montre `team-simock@digi.uemf.ma` (Simock — DJE BI TRAZIE ENOCK) actif @ 13h15 avec refresh token
  suivi d'une vague de `/user` checks depuis plusieurs IPs Vercel (cdg1 region) — comportement normal post-login
- Announcements RLS : 2 occurrences dans la fenetre, cumul J1 ~14-16 — sous seuil escalade (5/10min)
- 15 soumissions totales sur J1 (depuis minuit) — activite Player solide en matinee/debut apres-midi

**Verdict** : VERT · prochain tick 14h50
