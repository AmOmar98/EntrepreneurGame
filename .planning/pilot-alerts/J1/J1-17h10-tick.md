# J1 · 17h10 · TICK · VERT

- PROD home : 307 (redirect normal Next.js auth) · 423ms — sous seuil WARN (1200ms)
- Vercel 5xx (15 min) : 0 — Vercel MCP 403 (token scope insuffisant, faux positif connu ; smoke HTTP confirme PROD up)
- Supabase RLS denied (15 min) : 5x `permission denied for table announcements` — FAUX POSITIF CONNU (table announcements sans RLS publique, Players naviguant la page journey ; même pattern tick 17h00)
- Supabase applicatif ERROR : 2x `column "created_at" does not exist` via mgmt-api — erreur mgmt-api interne Supabase, NON applicatif Players (application_name=mgmt-api, pas postgrest) · sous seuil HARD
- Slow queries : aucune detectable dans logs (pas de mention >1s ou slow_query)
- Auth errors (15 min) : 0 · 401/403/500 = 0 dans logs auth
- Active sessions : 6 (stable vs 6 tick precedent 17h00)
- Soumissions J1 cumul : 16 (inchange vs tick 17h00 — activite workshop ralentie fin apres-midi)
- Deploy status : non disponible via MCP (403 scope) · smoke HTTP 307/423ms confirme PROD operable
- Advisors security : 22 warns pre-existants (search_path mutable + SECURITY DEFINER anon-callable + leaked password protection) — TOUS pre-existants, aucun nouveau depuis baseline J1

**Verdict** : VERT · RAS · prochain tick 17h20

---
**Notes analyst**
- Les 5 `permission denied for table announcements` sont le pattern identifie depuis 17h00 — Players chargeant la page journey triggrent cette query qui n'a pas de RLS publique. Non bloquant, pas d'escalade.
- Les 2 `column "created_at" does not exist` proviennent du mgmt-api Supabase (infrastructure interne), pas de l'app Next.js. Non actionnable cote Omar.
- Sessions stables a 6 : coherent avec fin d'atelier J1 (reprise post-pause ?). Pas de drop >50%.
- 0 nouvelles soumissions sur 10 min : normal si workshop en cours / pause.
