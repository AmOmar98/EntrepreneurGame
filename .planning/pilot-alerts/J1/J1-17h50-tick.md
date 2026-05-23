# J1 · 17h50 · TICK · VERT

- PROD home : 307 · 951ms (sous seuil WARN 1200ms)
- Vercel 5xx (15 min) : 0 (API Vercel 403 — pas de logs runtime accessibles, smoke HTTP confirme 307 sain)
- Deploy status : stable — dernier deploy connu d601409 (READY, inchangé vs tick 17h40)
- Supabase RLS denied (15 min) : faux positifs connus uniquement
  - `permission denied for table announcements` : 5 occurrences (mgmt-api interne, pattern récurrent toute la journée — faux positif confirmé)
  - `column "created_at" does not exist` : 2 occurrences via mgmt-api (pattern connu, pas applicatif)
  - Aucun `permission denied` sur tables Players (submissions, projects, profiles, deliverables)
- Slow queries : aucune requête lente détectée dans les logs postgres sur la fenêtre
- Auth errors : 0 — 100 entrées auth parsées, zéro erreur 401/403/invalid/expired/denied Player
- Active sessions (15 min) : 1 (vs 2 tick 17h40 — légère baisse, fin de journée J1 normale)
- Advisors : non interrogés ce tick (aucun changement DDL détecté)

**Notes faux positifs stables :**
- `announcements` denied = mgmt-api Supabase interne, pas de RLS Player
- `created_at does not exist` = requête mgmt-api sur table sans cette colonne, pas applicatif

**Verdict** : RAS · J1 fin de journée nominal · prochain tick 18h00
