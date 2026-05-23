# OFF-PILOT · 12h51 · TICK · WARN
> Date : 2026-05-23 (hors fenêtre J1/J2/J3). Dry-run #2 post fix-A (reconnexion MCP).

---

## Checks

| # | Check | Résultat | Statut |
|---|---|---|---|
| 1 | PROD home | 307 · 841ms (redirect auth attendu) | OK |
| 2 | Vercel 5xx (15 min) | MCP Vercel toujours 403 Forbidden | WARN — token non résolu |
| 3 | Vercel build status | MCP Vercel toujours 403 Forbidden | WARN — token non résolu |
| 4 | Supabase RLS denied | 0 `permission denied` sur 15 min. Note : `permission denied for table announcements` visible dans logs mais horodaté ~23h05 hier (hors fenêtre) | OK |
| 5 | Slow queries | 0 slow query >1s sur 15 min. Connexions mgmt-api normales (checkpoint toutes ~30 min) | OK |
| 6 | Auth errors | 0 erreur 401/403 dans auth logs sur 15 min. Dernière activité : token_revoked FokusMind 23:05 hier, NAFAS 22:21 hier — normal post-hackathon | OK |
| 7 | Active sessions (15 min) | 0 (`SELECT count(*) FROM auth.sessions WHERE updated_at > now() - interval '15 minutes'`) — normal hors pilote | OK |
| 8 | Advisors sécurité | WARNs pré-existants (search_path mutable, anon SECURITY DEFINER) — identiques aux ticks précédents, aucun nouveau | OK — connu |
| 8b | Advisors perf | WARNs pré-existants (auth_rls_initplan sur pitch_scores/help_requests/jurors, multiple permissive policies) — identiques aux ticks précédents, aucun nouveau | OK — connu |

---

## Anomalies notables dans les logs Supabase

- **ERROR `column "deliverable_slug" does not exist`** — apparu 2x (timestamps ~13h26 et ~10h11 aujourd'hui, heures UTC). Probablement une requête MCP ou admin qui référence une ancienne colonne. Ne bloque pas les Players (hackathon terminé), mais à noter pour post-mortem.
- **ERROR `column s.template_id does not exist`** — 1x (~10h11 UTC). Même type, requête admin obsolète.
- **ERROR `column "created_at" does not exist`** — 1x (~10h11 UTC). Idem.
- Ces 3 ERRORs sont groupés dans la fenêtre 10h-14h UTC du 23/05 — probablement liés à des sessions MCP de diagnostic/exploration, pas des erreurs runtime Players.

---

## Warnings (non-bloquant)

### Vercel MCP : toujours 403 après reconnexion fix-A

Le token Vercel retourne encore `403 Forbidden — Not authorized: Trying to access resource under scope "team_5Wqr0eiNPHsUEGUNLfTGCzrw"` sur :
- `get_runtime_logs`
- `list_deployments`

**Delta vs tick 12h46** : aucun changement. Le fix-A a résolu Supabase MCP (qui répond maintenant avec des données complètes) mais **pas Vercel MCP**.

**Action suggérée** : vérifier que le token Vercel MCP dispose du scope `team` et non juste `personal`. Dans le panel Vercel > Settings > Tokens, s'assurer que le token est de type "Team" pour `team_5Wqr0eiNPHsUEGUNLfTGCzrw` (ou que le token personnel a été ajouté comme membre du team avec les bonnes permissions).

---

## Statut reconnexion MCP — Verdict fix-A

| MCP | Tick 12h46 | Tick 12h51 (ce tick) | Delta |
|---|---|---|---|
| Supabase | 403 / erreur | **Fonctionnel** — logs, SQL, advisors OK | FIX-A VALIDE |
| Vercel | 403 | **Toujours 403** | FIX-A INCOMPLET |

---

**Verdict** : WARN (Vercel MCP hors service, Supabase MCP restauré).
Prochain tick sur demande ou au prochain dry-run après fix Vercel token.
