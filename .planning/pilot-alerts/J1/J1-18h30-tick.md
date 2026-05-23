# J1 · 18h30 · TICK · WARN

- PROD home : 307 · 240ms (redirect login normal, latence nominale)
- Vercel 5xx (15 min) : 0
- Supabase RLS denied (15 min) : 3 (table announcements — faux positif cosmétique connu, widget invisible)
- Slow queries : aucune >1s
- Auth errors : 0 · 2 re-logins normaux (FokusMind, Simock — token refresh fin atelier)
- Active sessions (15 min) : 0 (baisse vs 2 tick precedent — fin journee J1, atelier termine ~18h)
- Deploy status : READY · commit d601409 · derniere deploy il y a ~1h (smoke docs)
- Advisors : non re-execute ce tick (nominal depuis dernier check)
- Cumul soumissions J1 : **27** (vs 19 a 18h20 — +8 soumissions en fin de session)

## Warnings (non-bloquant)

- Sessions a 0 : normal fin J1 (les ateliers sont clos). A surveiller si remonte sur J2 matin.
- RLS denied x3 announcements : faux positif confirme (identique ticks precedents). Aucune action.
- DB ERROR x2 `column "created_at" does not exist` sur table submissions : visible dans logs postgres a 17:15 et 17:17 UTC. Origine : requete mgmt-api / Supabase dashboard, PAS l'app Next.js (l'app utilise correctement `submitted_at`). Sous le seuil HARD (3). A surveiller J2 si recurrence depuis l'app.

**Verdict** : WARN (fin de journee nominale) · cumul J1 = 27 soumissions · prochain tick J2-09h00 si invoque en debut J2
