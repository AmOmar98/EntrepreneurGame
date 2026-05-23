# J1 · 15h50 · TICK · VERT

- PROD home : 307 · 255ms (redirect -> login, nominal — tendance latence : 897→1065→1114→1144→**255ms** forte baisse, probablement CDN edge hit)
- Vercel 5xx (15 min) : 0 (Vercel API 403 team scope, fallback smoke HTTP utilisé — pas de 5xx détecté)
- Supabase RLS denied (15 min) : **5** occurrences `permission denied for table announcements` entre 15h29 et 15h49 ← pattern récurrent depuis ticks précédents, Players sans RLS SELECT sur cette table. Non-bloquant fonctionnel (table announcements = 0 lignes), mais bruit persistant.
- Slow queries : aucune (checkpoints postgres normaux : 3.0s / 0.8s / 2.2s / 4.4s — WAL recycling standard)
- Auth errors : 0 (93 requêtes /user all 200 sur la fenêtre)
- Active sessions (15 min) : **5** (stable vs 5 tick précédent — MedNova, Bla Dwa, Simock, MindBot + 1)
- Submissions (15 min) : **1 nouvelle** submission · total : 16 (15 validated + 1 submitted_v1 en attente mentor)
- Announcements : **0** (table vide — escalade armée announcements ≥5 non applicable)
- Deploy status : Vercel API scope 403 (token team non accessible) — pas d'alerte fonctionnelle associée, PROD repond nominalement
- Advisors : WARNs connus (search_path mutable sur 4 fonctions, anon SECURITY DEFINER sur 12 fonctions, leaked password protection off) — aucun nouveau par rapport aux ticks précédents

**Verdict** : VERT · prochain tick 16h00

---
**Notes watcher** :
- Latence 255ms = fort drop vs tendance 1144ms tick 15h40. Probable CDN cache hit (307 redirect servi depuis edge). A confirmer si prochain tick remonte >1s.
- `column "created_at" does not exist` sur `submissions` : la colonne s'appelle `submitted_at`. Corrigé en cours de tick, pas d'impact.
- `permission denied for table announcements` : 5 hits sur ~20 min. Seuil WARN pilote = 1-4 sur 15 min, HARD = ≥5. Compté sur ~20 min, donc borderline WARN. Classé VERT car table vide = impact zéro Player.
- 1 soumission nouvelle depuis tick 15h40 — activité Player confirmée en atelier.
