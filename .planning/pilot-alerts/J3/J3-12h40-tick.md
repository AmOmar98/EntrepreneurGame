# J3 · 12h40 · TICK · VERT

- PROD home : 307 · 984ms (redirect, nominal)
- Vercel 5xx (15 min) : 0
- Supabase RLS denied (15 min) : 0 (aucun `permission denied` dans postgres logs)
- Slow queries : aucune >1s detectee dans logs postgres (logs domines par mgmt-api connections + ERRORs schema — voir note ci-dessous)
- Auth errors (15 min) : 0 erreur 401/403 Player — derniere activite auth = token_revoked Omar 10h55 (localhost, hors-scope Players)
- Active sessions : 0 (stable vs 0 tick precedent J3-12h30 — pitch off-platform, normal)
- pitch-deck-v1 soumis : 1 (Simock, stable — aucune nouvelle soumission depuis J3-12h30)
- Evaluations (derniere heure) : 0 nouvelles evaluations
- Deploy status : ready (dernier deploy hotfix ad86675, operationnel)
- Advisors : WARNs connus pre-existants (function_search_path_mutable x4, anon/authenticated SECURITY DEFINER x12, leaked_password_protection) — AUCUN nouveau warning securite depuis tick precedent

## Note : SQL ERRORs dans postgres logs (faux positifs mgmt-api)

Plusieurs ERRORs vus dans les logs postgres proviennent de `application_name=mgmt-api` (interface Supabase Dashboard),
PAS de l'application PROD :
- `relation "deliverables" does not exist` — requete dashboard sur ancien nom de table
- `column s.template_id does not exist` — idem
- `column "deliverable_slug" does not exist` — idem
- `column "doc_url" does not exist` — idem
- `invalid input value for enum submission_status: "not_started"` — exploration dashboard

Ces ERRORs sont generees par des sessions mgmt-api (Supabase Studio / advisor scan), pas par des Players.
Aucun de ces ERRORs ne correspond a une requete applicative. Classification : faux positifs connus.

**Verdict** : VERT · J3 pitch off-platform, sessions nulles attendues · prochain tick J3-12h55
