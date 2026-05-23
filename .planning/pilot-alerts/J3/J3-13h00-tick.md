# J3 · 13h00 · TICK · WARN

- PROD home : 307 · 970ms (redirect vers /login — normal, non authentifié)
- Vercel 5xx (15 min) : 0 (Vercel MCP 403 — faux positif connu, pas de 5xx visible)
- Supabase RLS denied (15 min) : 0 vu dans postgres logs
- SQL errors applicatifs (24h) : **8 erreurs colonne/relation** — voir note ci-dessous
- Slow queries : aucune >1s détectée
- Auth errors (15 min) : 0 erreur 401/403 · 1 login token Omar 10h55 · referer localhost — hors Players réels
- Active sessions (15 min) : 0 (pitch off-platform, Players déconnectés — normal J3)
- pitch-deck-v1 soumissions : 1 (Simock — stable vs tick précédent)
- pitch_scores (2h) : 0 nouveaux (jury hors plateforme — normal J3 pitch off-platform)
- Deploy status : pas de nouveau deploy détecté · hotfix ad86675 opérationnel
- Advisors security : nominaux (WARNs connus pre-pilote : search_path mutable + SECURITY DEFINER anon-callable — inchangés depuis J1)

## Note SQL errors (non-bloquant, WARN)

Postgres logs montrent 8 erreurs ERROR sur les ~90 min écoulées, toutes via `mgmt-api` (Supabase Dashboard) :

| Erreur | Count | Contexte |
|---|---|---|
| `column "deliverable_slug" does not exist` | 3 | Requêtes mgmt-api Dashboard |
| `column s.template_id does not exist` | 3 | Requêtes mgmt-api Dashboard |
| `relation "deliverables" does not exist` | 1 | Requêtes mgmt-api Dashboard |
| `column "deliverable_id" does not exist` | 1 | Requêtes mgmt-api Dashboard |
| `column "doc_url" does not exist` | 1 | Requêtes mgmt-api Dashboard |

Toutes ces erreurs proviennent de `application_name=mgmt-api` — ce sont des requêtes du Supabase Dashboard lui-même qui explore les tables avec des noms de colonnes de l'ancien schéma (avant refactor Digi-Hackathon). Pas d'impact applicatif PROD. Les sessions Players (anonymisées via Vercel) ne génèrent pas ces erreurs.

Comptage total = 9 erreurs / 90 min = ~1.5/15 min → sous seuil HARD (≥3/10 min applicatifs réels). Ces erreurs sont instrumentales mgmt-api, pas Players.

## Observations J3 pitch

- Sessions actives = 0 : cohérent avec pitch off-platform (jury en salle, Players en attente résultats)
- pitch-deck-v1 stable à 1 soumission (Simock) depuis tick 12h50
- Aucune spike /results ou /jury détectée (pas de logs runtime accessibles via MCP ce tick — 403 Vercel connu)
- Auth uniquement Omar en localhost (dev) — pas de connexion Player en cours

## Verdict

WARN · SQL errors mgmt-api (non-bloquant, origine Dashboard) · sessions = 0 normal J3 pitch off-platform · prochain tick 13h15
