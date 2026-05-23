# J1 · 13h31 · TICK · WARN

- PROD home : 307→/login · 266ms (normal auth redirect)
- PROD /login : 200 · 263ms
- Vercel 5xx (15 min) : 0 (MCP 403 persiste — smoke HTTP substitut, aucune erreur visible)
- Supabase RLS denied (10 min) : 5 occurrences `permission denied for table announcements`
  - Timestamps relevés : 12h18, 12h22, 12h23, 12h28, 12h31 UTC (espacées, ~11 min)
  - CONNU : backlog post-J1 fix RLS announcements — Players ne voient pas les annonces mais ne sont pas bloqués
- Slow queries : aucune
- Auth errors (401/403) : 0 — tous les events auth sont des token refreshes normaux
- Active sessions (15 min) : **5** (stable vs 5 tick 14h21)
- Deploy status : pas de build en cours ou failed visible
- Advisors : WARN pré-existants (function_search_path_mutable x4, anon_security_definer x10, leaked_password_protection) — aucun nouveau

## Activite Players/Mentors visible

Equipes actives identifiees dans les logs auth :
- **FokusMind** (ZAHIRA BOULANOUAR) — token refresh 12h20 + 12h22 UTC
- **MedNova** (maski ghita) — token refresh 12h23 UTC
- **MindBot** (El Mehdi Nali) — token refresh 12h20 UTC

Soumissions sur 30 min (5 total) :
- 12h31 UTC — 1x `submitted_v1` (nouvelle soumission en attente de review)
- 12h18-12h23 UTC — 3x `validated` (evaluations mentor actives)
- 12h01 UTC — 1x `validated`

Signal fort : J1 afternoon en regime actif, livrables soumis et evalues en temps reel.

## Warnings (non-bloquant)

- `announcements denied` : 5 occurrences en 11 min — au-dessus du seuil indicatif de 4
  concentrees, mais c'est le bug RLS connu (backlog post-J1). Players ne sont pas bloques
  sur leur parcours. Pas d'escalade — a corriger apres J1.
  Remediation : fix RLS `announcements` table (ajouter policy SELECT pour `authenticated`).

**Verdict** : WARN · prochain tick 13h41
