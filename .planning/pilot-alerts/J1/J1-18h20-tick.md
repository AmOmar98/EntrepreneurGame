# J1 · 18h20 · TICK · WARN

- PROD home : 307 (redirect) · 255ms — nominal (Next.js middleware redirect vers /login pour visiteur non-auth)
- Vercel build status : API 403 Forbidden — accès Vercel MCP non autorisé pour ce projet ; fallback smoke HTTP OK
- Vercel 5xx (15 min) : 0 visible dans API logs — tous les appels REST retournent 200 sauf announcements (403 RLS attendu, voir ci-dessous)
- Supabase RLS denied (15 min) : **`announcements` table — 5x permission denied** (17h03 → 17h21 sur GET /rest/v1/announcements) — pattern connu (Players sans policy SELECT sur cette table) ; aucun `permission denied` sur submissions/players/missions
- Slow queries : 1 erreur SQL applicative `column "created_at" does not exist` (query mgmt-api sur submissions, ~17h11 — source interne Supabase, pas utilisateur)
- Auth errors (15 min) : 0 erreur 401/403 côté auth — tous les /token et /user retournent 200 ; 2 refresh_token OK (FokusMind 17h12, Simock 17h08)
- Active sessions (15 min) : **2** (seuil minimum atteint = 2, stable vs tick 18h10 qui indiquait 6 sessions au total)
- Soumissions J1 cumul : **19** (stable — aucune nouvelle soumission depuis le dernier tick)
- Advisors security : WARNs connus pré-pilote (function_search_path_mutable x4, anon SECURITY DEFINER exposees x10) — aucun nouveau
- Advisors performance : WARNs connus (auth_rls_initplan sur pitch_scores/help_requests/jurors, multiple_permissive_policies) — aucun nouveau
- Equipes actives identifiees dans logs (17h03→17h26) : **NAFAS** (login 17h01), **Simock** (token refresh 17h08), **FokusMind** (token refresh 17h12)

## Warnings (non-bloquant)

- **`announcements` 403 x5 sur 15 min** — Players essayant de lire la table announcements ; RLS ne leur accorde pas SELECT. Comportement attendu si la politique n'a pas ete ouverte aux Players. Impact : widget announcements ne s'affiche pas pour les Players, pas de blocage fonctionnel (journey/submissions non affectes). A verifier avec Omar si announcements doivent etre visibles Players — sinon ignorer.
- **Sessions actives = 2** — en baisse vs 6 au tick 18h10. Peut indiquer fin de session en salle ou pause (fin de journee J1). Non-bloquant, surveiller au tick suivant pour confirmer tendance.
- **Erreur SQL `column "created_at"`** — detectee dans postgres logs (17h11, source mgmt-api). Non reproductible cote applicatif (submissions utilise `submitted_at`). Probable query interne Supabase dashboard, pas un bug app. A surveiller si se repete.

**Verdict** : WARN · prochain tick J1-18h30
