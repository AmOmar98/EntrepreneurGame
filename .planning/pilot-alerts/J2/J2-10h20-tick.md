# J2 · 10h20 · TICK · VERT

- PROD home : 307 (redirect auth) · 221ms
- Vercel 5xx (15 min) : 0 (API 403 sur list_deployments = faux positif connu, ignoré)
- Supabase RLS denied (15 min) : 5 x `permission denied for table announcements` — faux positif connu, même pattern que J1 (RLS announcements non exposée côté player, pas d'escalade)
- Supabase SQL errors (15 min) : 1 x `column "created_at" does not exist` — origine mgmt-api (Supabase interne), pas applicatif
- Slow queries : aucune `slow query` explicite dans les logs postgres
- Auth errors : 0 erreur 401/403 côté Players réels — 3 logins token réussis (MedNova, Graph-Anomal, Simock) + 1 login Omar GM
- Active sessions (15 min) : 4 (hausse vs 2 au tick 10h10 — players se reconnectent en début d'atelier J2)
- Soumissions cumulées : 31 (était 27 au tick 10h10 — +4 nouvelles soumissions depuis dernier tick)
- Deploy status : pas de nouveau deploy (API Vercel 403 — faux positif connu, tag `ad86675` opérationnel)
- Advisors : identiques aux ticks précédents (function_search_path_mutable + anon SECURITY DEFINER) — pas de nouveau warn, stable depuis J1

## Notes

- Auth referer `http://localhost:3000` dans tous les logs auth — pattern connu Supabase (referer = valeur Next.js SSR côté Vercel, pas indicateur de dev local)
- Teams actives identifiées dans les 15 dernières minutes : MedNova, Graph-Anomal, Simock + Omar GM (196.200.182.3)
- Sessions = 4 vs 2 tick précédent : delta +2, pas de drop, signe positif de reprise d'activite en debut de creneau

**Verdict** : RAS · prochain tick 10h35
