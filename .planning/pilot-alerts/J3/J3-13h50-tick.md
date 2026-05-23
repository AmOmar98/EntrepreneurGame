# J3 · 13h50 · TICK · VERT

- PROD home : 307 (redirect normal vers /login) · 1000ms (dans seuil)
- Vercel 5xx (15 min) : 0 (Vercel runtime logs inaccessibles 403 — smoke HTTP confirme UP)
- Supabase RLS denied (15 min) : 0 (aucun `permission denied` dans postgres logs)
- SQL errors postgres (mgmt-api, ignorés) : ~8 erreurs de sonde mgmt-api (colonnes inconnues, relation inconnue) — pattern connu depuis J1, provient d'un outil externe qui sonde le schema, PAS applicatif
- Slow queries : aucune >1s détectée dans les logs 15 min
- Auth errors : 0 erreurs 401/403 Players (dernier login Omar 10h55 — token refresh OK 200)
- Active sessions (15 min) : 0 — cohérent pitch off-platform, Players non connectés
- pitch-deck-v1 soumissions (24h) : 1 (Simock · dernière soumission 08h17 UTC = 09h17 local) — stable vs tick 13h40
- pitch_scores évaluations (24h) : 0 — jury pas encore en session scoring PROD
- Submissions globales : 42 validated + 8 submitted_v1 (en attente review) — total stable
- Deploy status : Vercel list_deployments 403 (token scope limité) — smoke HTTP 307→redirect confirme PROD opérationnel · dernier deploy connu ad86675

**Verdict** : VERT · aucun seuil dépassé · PROD actif · pitch off-platform confirme faible activité session normale · prochain tick 14h05
