# J3 · 12h30 · TICK · VERT

- PROD home : 307 (redirect auth attendu) · 997ms — nominal
- Vercel 5xx (15 min) : 0 — API MCP 403 faux-positif connu, ignoré
- Supabase RLS denied (15 min) : 0
- SQL errors applicatifs (15 min) : present dans les logs mais tous via mgmt-api
  - `relation "deliverables" does not exist` × 1 (mgmt-api probe, non-applicatif)
  - `column s.template_id does not exist` × 3 (mgmt-api probe, non-applicatif)
  - `column "deliverable_slug" does not exist` × 3 (mgmt-api probe, non-applicatif)
  - `column "doc_url" does not exist` × 1 (mgmt-api probe, non-applicatif)
  - `invalid input value for enum submission_status: "not_started"` × 1 (mgmt-api probe)
  - → Toutes ces erreurs viennent du user=postgres application_name=mgmt-api (Supabase Studio/dashboard), pas du code applicatif. Pas de 5xx côté app.
- Slow queries : aucune >1s détectée
- Auth errors : 0 (dernière auth = Omar 10h55 depuis localhost:3000, token refresh normal)
- Active sessions (15 min) : 0 — attendu en fin de journée pitch off-platform
- Deploy status : ready · dernière auth login 10h55 (Omar GM)
- pitch-deck-v1 (M7) : 1 soumission (stable vs tick 12h20 = 1, Simock)
- Advisors sécurité : 23 WARNs connus (function_search_path_mutable × 4, anon/authenticated SECURITY DEFINER × 18, leaked_password_protection × 1) — baseline inchangée depuis J1, pilot-grade accepté

**Verdict** : RAS · prochain tick 12h45
