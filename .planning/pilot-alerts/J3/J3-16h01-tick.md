# J3 · 16h01 · TICK · VERT

- PROD home : 307 (redirect sain) · 955ms
- Vercel 5xx (15 min) : 0
- Supabase RLS denied (15 min) : 0
- Slow queries : aucune detectee dans les logs postgres
- Auth errors (15 min) : 0 · derniere activite 13h54 (team-simock refresh token OK)
- Active sessions (15 min) : 0 — normal, pitch off-platform termine, equipes deconnectees
- Evaluations J3/24h : 17 (stable vs tick 15h50)
- Evaluations (15 min) : 0 — cohort en pause post-pitch
- pitch-deck-v1 validated : schema submissions incompatible avec requete slug directe (colonne deliverable_slug absente) — cf. erreurs postgres mgmt-api recurrentes ci-dessous
- Deploy status : non verifie via MCP (list_deployments 403 ignore per consigne) — PROD repond OK

## Notes techniques

**Erreurs postgres recurrentes (source mgmt-api, non-applicatives) :**
Les logs postgres affichent plusieurs ERROR sur la periode :
- `column "deliverable_slug" does not exist` — x2 sur periode
- `column s.template_id does not exist` — x2 sur periode
- `column s.deliverable_id does not exist` — x1 sur periode
- `relation "projects" does not exist` — x1 sur periode
- `invalid input value for enum submission_status: "submitted"` — x2 sur periode
- `invalid input value for enum submission_status: "pending_review"` — x1 sur periode

Ces erreurs sont toutes source `application_name=mgmt-api` (Supabase dashboard/studio, NON applicatives). Elles correspondent a des requetes exploratives du dashboard studio sur le schema actuel — pas des erreurs Player. Seuil HARD applicatifs >= 3/10 min non declenche.

**Advisors security :** 24 WARNs existants (mutable search_path, SECURITY DEFINER public, leaked password protection) — tous connus et pre-existants depuis J1. Aucun nouveau advisor. Pilot-grade accepte.

**Verdict** : RAS · pitch J3 off-platform termine · DB en repos · prochain tick 16h16
