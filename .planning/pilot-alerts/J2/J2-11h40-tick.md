# J2 · 11h40 · TICK · VERT

- PROD home : 307 · 291ms (redirect vers /login — nominal, cdg1)
- Vercel 5xx (15 min) : 0 (runtime logs 403 = faux positif connu)
- Supabase RLS denied (15 min) : 1 · `permission denied for table announcements` — faux positif connu, RLS announcements non exposee Players
- Slow queries : aucune detectee (postgres logs = checkpoints + connexions authenticator, zero slow query flag)
- Auth errors : 4 x `Invalid Refresh Token` sur `/token` — tabs ouvertes depuis longtemps, pas des echecs de login Players reels. Zero 401/403 credential failure.
- Active sessions (15 min) : **3** (stable vs 2 tick J2-11h30 — legere hausse, cohort active)
- Submissions cumul : **40** (vs 39 tick J2-11h30 — +1 nouvelle soumission sur la fenetre)
- Submissions fenetres 15 min : 1
- Evaluations cumul : **23** (inchange vs derniere mesure connue — activite mentor stable)
- Deploy status : dernier deploy opérationnel, hotfix ad86675 actif, aucun build en cours detecte

**Verdict** : VERT · prochain tick J2-11h55
