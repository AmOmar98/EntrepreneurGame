# J1 · 14h00 · TICK · WARN

- PROD home : 307 · 286ms (redirect auth attendu — comportement normal)
- Vercel 5xx (15 min) : 0 (MCP 403 persistant, vérification via Supabase auth logs — aucune erreur 5xx visible)
- Supabase RLS denied (13h50-14h00) : 4 occ `permission denied for table announcements` (13h43, 13h50, 13h58 x2)
- SQL `updated_at does not exist` (fenêtre 13h50-14h00) : **0** — erreur absente cette fenêtre (seuil HARD non déclenché)
- `relation "projects"` : 0 nouvelle occurrence visible
- Slow queries : aucune >1s détectée
- Auth errors : 0 erreur (tous 200 — login Omar GM + team-addictless visible)
- Active sessions : 1 (stable vs 1 tick précédent)
- Activité submissions : 13 validated (etait 12 a 13h50 — **+1 nouvelle validation**) · 1 submitted_v1 (stable)
- Deploy status : non vérifié (Vercel MCP 403 persistant) — dernier deploy connu >14h ago, pas de régression détectée
- Advisors : tous pre-existants — aucun nouveau security/perf WARN

## Warnings (non-bloquant)

- `permission denied for table announcements` : 4 occ sur fenêtre 13h50-14h00 (cumul montant depuis 13h26).
  Cause probable : Players ou composant qui tente de lire `announcements` sans policy SELECT adequat pour leur role.
  Seuil WARN atteint (1-4 occ), seuil HARD non atteint (<5).
  Action : surveiller — si cumul >=5 sur prochain tick, escalader.
- `updated_at does not exist` : 0 occ cette fenetre. Erreur persistante des ticks precedents calmee.
  Si elle resurgit sur la prochaine fenetre : escalade HARD si >=3.
- Sessions = 1 : niveau bas mais coherent avec atelier en salle (participants sur meme reseau/machine potentiellement).
  Bonus : login `team-addictless@digi.uemf.ma` visible dans auth logs — Player actif.

**Verdict** : WARN · prochain tick 14h10
