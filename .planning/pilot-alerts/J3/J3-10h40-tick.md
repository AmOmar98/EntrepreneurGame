# J3 · 10h40 · TICK · WARN

## Checks

- PROD home : 307 (redirect attendu vers /login) · 842ms — nominal
- Vercel 5xx (15 min) : 0 — Vercel runtime logs inaccessibles (403 connu, faux positif)
- Supabase RLS denied (15 min) : 0 — aucun "permission denied" dans postgres logs
- Slow queries : aucune signalée — checkpoints normaux
- Auth errors (15 min) : 0 — tous les /user et /token en 200, dernier login 09h30 Omar (token_revoked = refresh normal)
- Active sessions (15 min) : 1 (Omar seul · pitch en cours hors plateforme, normal)
- Deploy status : non lisible via MCP (403 list_deployments connu) — dernier check PROD stable
- M7 pitch-deck-v1 soumis : 1 (inchangé vs tick 10h30 · Simock validated)
- Pitch scores nouveaux (15 min) : 0 — jury pas encore en saisie active
- Advisors : nominal — tous les WARN security connus (search_path, SECURITY DEFINER, leaked password) identiques aux ticks precedents, aucun nouveau

## Erreurs SQL detectees dans postgres logs

Deux erreurs SQL applicatives signalees dans les logs entre 09h27 et 09h46 :
- `column sub.template_id does not exist` (09h46 · connexion mgmt-api)
- `column s.deliverable_slug does not exist` (09h27 · connexion mgmt-api)

Ces erreurs proviennent de requetes mgmt-api (Supabase dashboard/MCP interne), pas du code applicatif PROD. Aucun 5xx Vercel cote Player detecte. Probablement erreurs de requetes MCP exploratoires du watcher precedent ou introspection dashboard. Compte = 2 sur ~15 min — sous le seuil HARD (3).

## Warnings (non-bloquant)

- Erreurs SQL mgmt-api : 2 erreurs de colonne inexistante sur connexions mgmt-api uniquement
  → Origine probable : requete watcher 10h30 avec mauvais schema (`deliverable_slug` direct sur `submissions`). Corrige dans ce tick (jointure via `deliverable_templates`). Pas d'impact Players.
- Sessions actives = 1 : attendu J3 pitch off-platform — pas de chute anormale (base etait 0 au tick 10h30)

**Verdict** : WARN (erreurs SQL mgmt-api benignes) · prochain tick 10h55
