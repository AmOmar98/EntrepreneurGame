# J3 · 16h10 · TICK · VERT

- PROD home : 307 (redirect auth) · 1010ms — nominal, sous seuil WARN 2000ms
- Vercel 5xx (15 min) : 0 — MCP 403 connu, smoke HTTP confirme PROD UP
- Supabase RLS denied (15 min) : 0 — aucun `permission denied` dans postgres logs
- Slow queries : aucune >1s detectee — logs postgres = mgmt-api connections uniquement
- Auth errors : 0 Player reel (13h53 dernier login = team-simock token refresh 200, 13h32 Omar refresh 200, 13h10 F.Fouad refresh 200) — aucun 401/403
- Active sessions (15 min) : 0 — coherent avec J3 pitch off-platform termine, seules des pauses token
- Evaluations J3/24h : 17 (stable vs 17 tick precedent J3 16h01)
- M7 pitch-deck soumissions (total) : 1 — normal post-pitch off-platform
- Deploy status : ready — hotfix ad86675 operationnel, aucun build en cours
- Advisors security : 22 WARNs persistants (function_search_path_mutable x4, anon/authenticated SECURITY DEFINER x18) — tous connus pre-pilote, pas de nouveau warning

## Notes postgres applicatives

Erreurs mgmt-api visibles dans logs (NON applicatives, hors perimetre player) :
- `column s.template_id does not exist` x3
- `column "deliverable_slug" does not exist` x2
- `invalid input value for enum submission_status: "pending_review"` x1
- `invalid input value for enum submission_status: "submitted"` x1
- `relation "projects" does not exist` x1
- `column s.deliverable_id does not exist` x1

Ces erreurs proviennent du mgmt-api Supabase (introspection interne), pas de requetes Player.
Seuil applicatif SQL : 0/10min — sous seuil HARD (3/10min).

**Verdict** : VERT · J3 post-pitch calme · prochain tick 16h25
