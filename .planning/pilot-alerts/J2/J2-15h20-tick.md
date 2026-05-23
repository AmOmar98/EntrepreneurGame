# J2 · 15h20 · TICK · VERT

- PROD home : 307 (redirect normal Vercel) · 1017ms — sous seuil WARN 1200ms
- Vercel 5xx (15 min) : 0 — API logs clean, tous 200
- Supabase RLS denied (15 min) : announcements uniquement (3x) — faux-positif definitif
- mgmt-api errors : 3x `column "created_at" does not exist` — faux-positif definitif, non escalade
- Slow queries : aucune >1s
- Auth errors : 0 erreur 401/403 — logins/refresh tous 200 (MedNova + Omar 13h40, mentor 12h13)
- Active sessions (15 min) : 0 — identique tick J2-15h10 (pause inter-atelier probable)
- Submissions : 45 (stable vs tick precedent)
- Evaluations : 25 (stable vs tick precedent)
- Deploy status : Vercel list_deployments 403 (faux-positif connu) — pas de build en cours detecte
- Advisors : non recheck ce tick (RAS precedent, pas de DDL depuis)

**Verdict** : VERT · prochain tick J2-15h35
