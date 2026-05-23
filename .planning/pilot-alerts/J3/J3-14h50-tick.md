# J3 · 14h50 · TICK · VERT

- PROD home : 307 · 879ms (redirect normal, sous seuil)
- PROD /journey : 307 · 948ms (stable)
- Vercel 5xx (15 min) : 0 (MCP 403 connu — ignoré per consigne)
- Supabase RLS denied (15 min) : 0 erreur permission denied
- Slow queries : aucune >1s dans fenetre 15 min
- Auth errors (15 min) : 0 erreur 401/403 Player ; 2 logins token OK (Omar + F. Fouad — normal)
- Active sessions (15 min) : 0 (cohort hors plateforme — pitch off-platform J3, attendu)
- Deploy status : non verifia via MCP (403) — dernier deploy connu OK hotfix ad86675
- M7 pitch-deck-v1 : 1 validated (stable vs tick 14h40)
- Advisors security : nominal (memes WARNs persistants function_search_path_mutable + anon SECURITY DEFINER — connus, pre-pilote, pas de nouveau)

### Notes postgres ERRORs observees (mgmt-api, hors app)
Les erreurs suivantes proviennent de connexions mgmt-api (Supabase Studio / tooling interne), pas de l'application :
- `invalid input value for enum submission_status: "submitted"` — mgmt-api sondant l'ancien enum (connu)
- `invalid input value for enum submission_status: "pending_review"` — idem
- `column p.display_name does not exist` — mgmt-api, schema mismatch interne
- `relation "team_members" does not exist` — mgmt-api
- `column "updated_at" / "submitted_at" / "created_at" does not exist` — mgmt-api
Toutes < seuil HARD (0 erreur app-facing dans les 15 min). A noter pour post-pilote cleanup.

**Verdict** : VERT · sessions a 0 normal (pitch off-platform) · pitch-deck stable 1 validated · prochain tick 15h05
