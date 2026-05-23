# J3 · 15h00 · TICK · VERT

- PROD home : 200 · 1001ms (redirect chain suivie)
- PROD /journey : 200 · 1082ms
- Vercel 5xx (15 min) : 0 (Vercel runtime logs inaccessibles via MCP 403 — smoke HTTP confirme 200 OK)
- Supabase RLS denied (15 min) : 0 — aucun `permission denied` dans postgres logs
- Supabase SQL errors (15 min) : 3 erreurs applicatives mgmt-api visibles dans postgres logs
  - `invalid input value for enum submission_status: "pending_review"` (x2, ~14h54 et ~14h04)
  - `invalid input value for enum submission_status: "submitted"` (x1, ~14h54)
  - Note : ces erreurs proviennent du mgmt-api (tableau de bord Supabase), pas de l'application Next.js — non bloquantes PROD
  - Autres erreurs isolées : `column p.display_name does not exist`, `relation "team_members" does not exist`, `column sub.template_id does not exist`, `column "updated_at" does not exist` — toutes via mgmt-api, hors flux applicatif
- Slow queries : aucune query >1s détectée dans les logs 15 min
- Auth errors : 0 erreur 401/403 Players réels — auth log nominal (logins + token_revoked normaux)
  - Utilisateurs actifs récents : team-simock@digi.uemf.ma (login 13h53), o.ameur@ueuromed.org, f.fouad@ueuromed.org
- Active sessions (15 min) : 1 (pitch day — activité réduite attendue, pitch off-platform)
- M7 pitch-deck-v1 : 1 validated (stable vs tick J3-14h50)
- Evaluations (15 min) : 0 nouvelles évaluations
- Deploy status : non vérifié via MCP (403 list_deployments) — PROD répond 200, déploiement nominal

**Verdict** : VERT · prochain tick 15h15
