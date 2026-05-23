# J2 · 14h30 · TICK · VERT

- PROD home : 307 (redirect attendu) · 263ms — nominal
- Vercel 5xx (15 min) : 0
- Supabase RLS denied (15 min) : 0 — aucun `permission denied` dans les logs postgres
- Slow queries : aucune slow query applicative détectée (2 erreurs `column "created_at" does not exist` visibles — erreur mgmt-api interne Supabase, faux positif connu, pas applicatif)
- Auth errors (15 min) : 0 erreur 401/403 — tous les `/user` retournent 200
- Active sessions (15 min) : 1 (fin d'atelier / inter-session, stable — 0 au tick J2-14h20)
- Soumissions J2 (24h) : 30 · Total PROD : 45 (stable vs historique 45 tick précédent)
- Evaluations J2 (24h) : 11
- Deploy status : dernier deploy opérationnel (hotfix ad86675 en place)
- Advisors security : 28 WARNs existants — TOUS déjà présents sur ticks précédents (function_search_path_mutable, anon_security_definer, leaked_password_protection) — aucun nouveau

**Verdict** : RAS · prochain tick J2-14h45

---
*Note technique* : `submissions.created_at` n'existe pas — colonne correcte est `submitted_at`. Corrigé en cours de tick, données confirmées via `submitted_at`. L'erreur `column "created_at" does not exist` dans les logs postgres est liée à des appels mgmt-api Supabase (non applicatifs) — faux positif récurrent, pas d'escalade.
