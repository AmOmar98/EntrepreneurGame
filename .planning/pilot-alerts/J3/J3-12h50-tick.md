# J3 · 12h50 · TICK · VERT

- PROD home : 307 · 937ms (redirect attendu, bien sous seuil WARN 2000ms)
- Vercel 5xx (15 min) : 0 (MCP logs 403 = faux positif connu)
- Supabase RLS denied (15 min) : 0
- SQL ERRORs postgres : 4 visibles dans la fenetre — tous issus de requetes mgmt-api/MCP watcher (colonnes stale `deliverable_slug`, `template_id`, `doc_url`, relation `deliverables`) — pas de l'app PROD. Faux positifs watcher.
- Slow queries : aucune >1s detectee
- Auth errors : 0 — uniquement token refresh Omar (o.ameur@ueuromed.org, localhost, INFO)
- Active sessions : 0 (coherent J3 pitch off-platform)
- pitch-deck-v1 soumis : 1 (Simock — stable vs J3-12h40)
- Deploy status : non verifie (Vercel MCP 403) — dernier hotfix ad86675 operationnel
- Advisors security : WARNs recurrents connus (search_path mutable x4, anon SECURITY DEFINER x10) — aucun nouveau

**Verdict** : RAS · prochain tick J3-13h05
