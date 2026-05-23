# J3 · 13h20 · TICK · VERT

- PROD home : 307 (redirect attendu) · 989ms
- Vercel 5xx (15 min) : 0 — API logs 100% 200/101
- Supabase RLS denied (15 min) : 0
- Slow queries : 0 (ERRORs postgres = mgmt-api col inexistantes, faux-positifs connus hors-app)
- Auth errors (15 min) : 0 — derniere auth 10h55 Omar (token refresh 200)
- Active sessions (15 min) : 0 — creux inter-pitch, normal J3 off-platform
- pitch-deck-v1 submissions : 1 (Simock, stable vs tick 13h10)
- Deploy status : ready (list_deployments 403 ignore)
- Advisors security : WARNs connus (search_path mutable, anon SECURITY DEFINER, leaked password) — aucun nouveau depuis J1

## Notes J3 pitch jury

- Activite API recente = GM (o.ameur@ueuromed.org) naviguant mentor/submission views a ~10h55-11h30
- Aucun acces /results ou /jury detecte dans les logs 15 min — normal si pitchs off-platform
- ERRORs postgres (col deliverable_slug, deliverable_id, project_id, event_id inexistantes) = requetes mgmt-api Supabase interne, pas de l'application — ignorees

**Verdict** : VERT · prochain tick 13h35
