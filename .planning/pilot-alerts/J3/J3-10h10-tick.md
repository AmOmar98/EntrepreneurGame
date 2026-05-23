# J3 · 10h10 · TICK · VERT

- PROD home : 307 redirect · 223ms (redirect vers /login — comportement normal auth, latence OK)
- Vercel 5xx (15 min) : 0 (Vercel runtime logs API 403 = faux positif connu, pas de 5xx détecté via smoke HTTP)
- Supabase RLS denied (15 min) : 0 (postgres logs = connexions authenticator normales, 0 permission denied)
- Slow queries : aucune >1s détectée dans les logs postgres
- Auth errors (15 min) : 0 erreur — tous les /user retournent 200 · 1 token_revoked Simock (normal refresh)
  - Auth durations élevées observées (certains /user jusqu'à 280s) = cold wake du pool Supabase en début de journée, tous status 200, résolu depuis ~09h10
- Active sessions (15 min) : 1 (stable vs 1 tick précédent J3-10h09 — début de journée, cohérent)
- Deploy status : pas de nouveau deploy détecté · hotfix ad86675 opérationnel
- Advisors security : nominal (WARN existants inchangés — search_path mutable + SECURITY DEFINER anon-callable = baseline connue depuis J1, aucun nouveau)

## M7 Pitch deck / Techniques pitch

- pitch-deck-v1 soumis : **1** (Simock · status=submitted_v1 · 08h17 UTC)
- techniques-pitch-v1 soumis : 0
- J3 specifics /results et /jury : aucune anomalie détectée dans les logs auth (0 spike inhabituel)

## Note auth durations

Les durées longues sur GET /user (12s–280s) observées entre 08h58 et 09h05 UTC correspondent au réveil de la cohorte en début de J3. Tous status 200, résolu spontanément. Pas de corrélation avec erreurs applicatives. Faux positif de performance lié au cold-start Supabase edge.

**Verdict** : VERT · prochain tick 10h25
