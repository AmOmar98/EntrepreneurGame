# J1 · 17h40 · TICK · VERT

- PROD home : 307 (redirect vers /login, comportement normal auth) · 267ms
- Vercel 5xx (15 min) : 0 — aucune erreur runtime détectée
- Vercel deploy status : READY · SHA d601409 · age ~15.5h (deploy ce matin 02h09 UTC)
- Supabase RLS denied (15 min) :
  - `permission denied for table announcements` : 7 occurrences dans la fenêtre — faux positif connu (RLS announcements non accordée aux Players, identique aux ticks précédents, aucune action)
  - `column "created_at" does not exist` : 1 occurrence source `mgmt-api` (requête interne Supabase, non applicative)
- Slow queries : aucune query lente visible dans logs postgres
- Auth errors (15 min) : 0 erreur 401/403 dans logs auth — tous status 200 sur /user (sessions actives normales)
- Active sessions (15 min) : **2** (stable vs 2 tick précédent 17h30)
- Submissions cumul J1 : **17 total** · 1 nouvelle soumission dans les 15 dernières minutes (activite positive fin de journee)
- Advisors security : WARNs connus pre-existants (search_path mutable sur set_updated_at/guard_player_onboarding/etc, SECURITY DEFINER callables anon) — tous identiques aux ticks précédents, aucun nouveau

**Verdict** : VERT · prochain tick 17h50

---
_Equipes actives J1 : Simock, MindBot, MedNova, Bla Dwa, FokusMind, Graph-Anomal (6 equipes confirmees)_
_Sessions = 2 actives / cumul J1 = 17 soumissions_
