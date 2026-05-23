# J2 · 09h56 · TICK · VERT

- PROD home : 307 redirect · 975ms (infra normale — redirect vers /login, pas d'erreur)
- Vercel 5xx (15 min) : 0 (MCP runtime logs 403 = faux positif connu, smoke HTTP substitut)
- Vercel deploy status : MCP 403 connu — pas d'alerte (dernier deploy opérationnel hotfix ad86675)
- Supabase RLS denied (15 min) : 2 × `permission denied for table announcements` — faux positif connu (widget cosmétique table vide, ignoré)
- SQL errors mgmt-api : `slug`, `mission_slug`, `startups`, `projects` — faux positifs définitifs Supabase Studio ancien schema AgreenTech, ignorés
- Slow queries : aucune >1s dans les logs postgres 24h
- Auth errors Players : 2 × `400 /token refresh_token_not_found` — tokens expirés côté client (navigateur resté ouvert), pas d'erreur login active. Seuil WARN = 5, seuil HARD = 5 sur 15 min. Total = 2 → RAS.
- Auth logins actifs (sample log) : token_revoked × 2 + login × 1 (MedNova/maski ghita) — activité normale pré-atelier
- Active sessions (15 min) : **2** (montée attendue 10h-11h — stable vs tick J2-09h42 = 1, progression saine)
- Soumissions J2 (24h glissantes) : **27** (stable vs tick précédent — aucune nouvelle soumission depuis 09h42, normal pré-atelier)

**Verdict** : VERT · prochain tick 10h11
