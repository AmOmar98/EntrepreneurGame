# J1 · 15h10 · TICK · WARN

- PROD home : 307 · 975ms (redirect vers /login — normal, pas de session cookie depuis curl)
- Vercel 5xx (15 min) : 0 (Vercel MCP 403 token scope — fallback smoke HTTP OK)
- Supabase RLS denied (15 min) : 1 · `permission denied for table announcements` (timestamp 15h00 env., 1 occurrence)
- Slow queries : aucune >1s visible dans logs postgres (fenetre 15 min)
- Auth errors : 0 erreur · 1 login token_refresh OK (team-simock@digi.uemf.ma · 15h15)
- Active sessions (15 min) : 0 (inter-atelier — stable, identique tick 15h00)
- Soumissions nouvelles (15 min) : 0
- Cumul soumissions J1 : **15** (inchange depuis 14h50)
- Deploy status : Vercel MCP scope 403 — impossible de verifier le build status direct.
  Smoke HTTP 307/975ms sans erreur 5xx = PROD fonctionnel.
- Advisors security : WARNs existants (search_path mutable x4, anon SECURITY DEFINER x9,
  leaked-password-protection) — tous anterieurs, aucun nouveau depuis dernier tick.
- Advisors perf : WARNs existants (auth_rls_initplan pitch_scores x3, help_requests x1,
  jurors x1 ; unindexed FKs help_requests x3, jurors x1 ; multiple permissive policies x2 ;
  unused indexes x9) — tous anterieurs, aucun nouveau.

## Warnings (non-bloquant)

- `permission denied for table announcements` : 1 occurrence dans la fenetre ~15h00.
  Pattern recurrant signale depuis tick 15h00 (2 occ/fenetre anterieures).
  Ce tick = 1 occurrence visible dans les logs postgres, en baisse vs tick precedent.
  Cause probable : query anonyme ou Player sans RLS SELECT sur `announcements`.
  Seuil HARD = 5 occ/10 min — non atteint. A surveiller.
- Vercel MCP token scope 403 : impossible de lire build logs / deployment status via MCP.
  Workaround actif : smoke HTTP direct. Impact = pas de visibilite deploy status formel.

**Verdict** : WARN · 1 RLS denied announcements (sous seuil) · prochain tick 15h20
