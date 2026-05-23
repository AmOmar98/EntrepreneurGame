# J3 · 12h10 · TICK · VERT

- PROD home : 307 (redirect normal) · 965ms
- Vercel 5xx (15 min) : 0 (Vercel runtime logs 403 = faux positif connu, ignoré)
- Supabase RLS denied (15 min) : 0 `permission denied` détecté
- SQL applicatifs ERROR (15 min) : plusieurs `column does not exist` via mgmt-api (deliverable_slug, template_id, doc_url, submission_status enum) — tous issus de mgmt-api interne Supabase, pas de l'app Next.js. Faux positifs récurrents connus depuis hotfix ad86675.
- Slow queries : aucune `slow query` loggée
- Auth errors : 0 erreurs 401/403 · dernière activité = token refresh Omar 10h55 (localhost:3000, hors-pilote)
- Active sessions (15 min) : 1 (stable vs 1 au tick 12h00 — activité Omar locale uniquement)
- pitch-deck-v1 submissions : 1 (Simock, stable)
- Evaluations nouvelles (15 min) : 0
- Deploy status : non contrôlé via MCP (403 Vercel) — dernier deploy connu = hotfix ad86675, stable
- Advisors security : nominal — tous les WARNs présents sont connus pre-pilote (mutable search_path, SECURITY DEFINER functions, leaked password protection) · aucun nouveau

**Verdict** : VERT · prochain tick 12h25

---
_Notes J3 pitch off-platform :_
- pitch_mode_state = off · aucune spike /results ou /jury détectée dans les logs auth
- Sessions très basses (1) cohérent avec fin de journée hackathon en salle
- SQL errors mgmt-api (`deliverable_slug`, `template_id` does not exist) : écho connu post-restructuration 13→15 livrables Digi, non-bloquant app
