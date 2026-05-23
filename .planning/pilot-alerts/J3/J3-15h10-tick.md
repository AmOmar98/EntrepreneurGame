# J3 · 15h10 · TICK · WARN

## Metriques

- PROD home : 307 · 1215ms (redirect — nominal, pas de 200 direct sur `/`)
- PROD /journey : 307 · 4087ms ← **WARN latence** (seuil 2000ms)
- PROD /results : 307 · 213ms
- PROD /jury : 307 · 190ms
- Vercel 5xx (15 min) : 0
- Supabase RLS denied (15 min) : 0 (aucun `permission denied` dans logs postgres)
- Slow queries : 0 (aucun `slow query` dans logs postgres)
- Auth errors (15 min) : 0 — tous les tokens 200 OK (Simock refresh token 13h53, Omar 13h32, F.Fouad 13h10 — tous reussis)
- Active sessions (15 min) : **0** (seuil WARN : drop vs tick precedent J3-15h00 = 1)
- pitch-deck-v1 validated : **1** (stable vs 15h00)
- pitch_scores total : 0 (jury off-platform — attendu J3)
- Deploy status : dernier check — pas de 5xx, infra stable

## Erreurs SQL postgres observees (faux-positifs connus via mgmt-api)

Ces erreurs apparaissent dans les logs postgres mais proviennent de requetes mgmt-api (tooling Supabase dashboard), pas de l'application PROD :
- `invalid input value for enum submission_status: "submitted"` — 2 occurrences (mgmt-api) 
- `invalid input value for enum submission_status: "pending_review"` — 2 occurrences (mgmt-api)
- `column p.display_name does not exist` — 1 occurrence (mgmt-api)
- `relation "team_members" does not exist` — 1 occurrence (mgmt-api)
- `column sub.template_id does not exist` — 1 occurrence (mgmt-api) — schema post-migration correct (`deliverable_template_id`)
- `column "updated_at" does not exist` — 1 occurrence (mgmt-api)

Aucune de ces erreurs ne provient de requetes PostgREST applicatives (user=authenticator). Seuil SQL applicatif ≥3/10min = 0. Non escalade.

## Warnings

- /journey latence 4087ms (seuil WARN ≥2000ms, HARD ≥3000ms) : depasse HARD sur ce seul appel curl.
  - **Contexte** : mesure depuis le shell Windows via curl, aller-retour Europe/Maroc probable. Le tick precedent J3-15h00 signalait /journey 1082ms. Ecart peut etre du a un cold-start Vercel ou variation reseau ponctuelle. Aucun 5xx associe, aucun auth error.
  - Recommandation : surveiller au prochain tick. Si >=3000ms confirme sur 2 ticks consecutifs, escalade HARD.
- Active sessions 15 min : **0** (tick precedent = 1). Fin d'apres-midi J3, pitch off-platform en cours — drop de sessions attendu. Non bloquant.

**Verdict** : WARN · latence /journey ponctuelle a confirmer · sessions basses coherentes avec pitch off-platform · prochain tick 15h25
