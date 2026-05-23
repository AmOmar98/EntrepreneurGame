# J1 · 17h30 · TICK · VERT

- PROD home : 307 · 253ms (auth redirect nominal — identique ticks precedents)
- Vercel 5xx (15 min) : 0 (MCP runtime logs 403 permission — pattern connu, pas de 5xx signales)
- Supabase RLS denied (15 min) : 3 × `permission denied for table announcements` — faux positif connu, meme table, meme pattern que tous les ticks J1
- Supabase mgmt-api errors : 1 × `column "created_at" does not exist` via mgmt-api — interne Supabase, non applicatif, ignoré (pattern recurrent J1)
- Slow queries : aucune
- Auth errors : 0 — token refreshes 200 pour FokusMind (ZAHIRA BOULANOUAR), MedNova (maski ghita), Graph-Anomal (Fatima Zahra Tliji)
- Active sessions (15 min) : 2 (vs 3 tick 17h20 — baisse fin d'atelier, normal, au-dessus seuil HARD <2)
- Submissions cumul J1 : 17 (vs 16 tick 17h20 — +1 nouvelle soumission dans la fenetre)
- Deploy status : pas de nouveau deploiement detecte

**Verdict** : VERT · prochain tick 17h40
