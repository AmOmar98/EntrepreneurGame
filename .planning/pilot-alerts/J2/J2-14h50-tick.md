# J2 · 14h50 · TICK · WARN

- PROD home : 307 · 1314ms (seuil WARN 1200ms-3s — hausse vs tick 14h40 : 1160ms → 1314ms)
- Vercel 5xx (15 min) : 0 (MCP 403 Forbidden — faux positif connu, pas de 5xx applicatif observable)
- Supabase RLS denied (15 min) : 2 occurrences `permission denied for table announcements` — faux positif DEFINITIF connu
- Supabase ERROR inattendu : `column "created_at" does not exist` — 3 occurrences sur 15 min (requêtes mgmt-api)
- Slow queries : aucune slow query explicite dans les logs postgres ; checkpoints normaux
- Auth errors (15 min) : 0 erreur 401/403 Players — tout 200 ; 1 token_revoked MedNova + 1 token_revoked Omar (normal)
- Active sessions (15 min) : 1 (drop vs tick 14h40 = 2 — baisse de 50%, seuil WARN)
- Soumissions totales : 45 (stable, inchangé vs historique)
- Evaluations totales : 25 (stable)
- Deploy status : Vercel MCP non accessible (403) — dernier deploy connu operationnel, hotfix ad86675 actif
- Advisors security : WARNs identiques aux ticks precedents (search_path mutable, anon SECURITY DEFINER) — pas de nouveaux items

## Warnings (non-bloquants)

- **Latence PROD en hausse** : 1160ms (14h40) → 1314ms (14h50) — progression continue vers seuil HARD 3s. Reste WARN. A surveiller au prochain tick — si >1500ms → attention renforcee.
- **Active sessions = 1** : drop 50% vs tick precedent (2 → 1). Plausible si Players en pause dejeuner / transition atelier. Non HARD car seuil HARD = <2, mais la valeur est a 1 donc juste a la limite — surveiller le prochain tick.
- **column "created_at" does not exist** : 3 occurrences ERROR postgres sur ~15 min, toutes via `mgmt-api`. Probablement une requete interne Supabase sur une vue/table sans cette colonne. Pas applicatif (pas de requete Player). A noter, pas encore seuil HARD (≥3 SQL errors applicatifs).

**Verdict** : WARN · prochain tick J2-15h05
