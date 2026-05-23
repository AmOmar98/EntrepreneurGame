# J3 · 15h40 · TICK · VERT

- PROD home : 307 · 1080ms (stable, sous seuil WARN 2000ms)
- Vercel 5xx (15 min) : 0
- Vercel build status : non interrogé (list_deployments 403 connu — ignoré)
- Supabase RLS denied (15 min) : 0 — aucun `permission denied` dans les logs postgres récents
- Slow queries : aucune >1s détectée dans la fenêtre
- Erreurs SQL applicatives (15 min) : 4 ERROR postgres visibles sur la fenêtre élargie
  - `column s.deliverable_id does not exist` (×1 ~15h31)
  - `column s.template_id does not exist` (×1 ~15h31)
  - `column "deliverable_slug" does not exist` (×1 ~15h31)
  - `invalid input value for enum submission_status: "submitted"` (×2 ~15h08 et ~14h48)
  - `invalid input value for enum submission_status: "pending_review"` (×1 ~14h31)
  - Note : ces erreurs proviennent du mgmt-api Supabase Studio (requêtes exploratives), pas de l'app Next.js — pas de seuil HARD applicatif atteint
- Auth errors (15 min) : 0 — tous les /token et /user retournent 200, 2 token_revoked normaux (refresh)
  - Sessions actives connues : team-simock (refresh 13h53) + Omar GM (refresh 13h32) + F. Fouad (refresh 13h10)
- Active sessions (15 min) : 0 (fenetre stricte 15 min — normal en creux post-pitch, jury off-platform)
- M7 pitch-deck-v1 : 1 validated (stable vs tick 15h30 = 1 validated)
- M7 techniques-pitch-v1 : 0 soumissions en base (inchangé)
- Advisors security : nominal — tous les WARNs (function_search_path_mutable, anon_security_definer) sont connus et pre-existants, aucun nouveau depuis tick precedent

**Verdict** : VERT · prochain tick 15h55
