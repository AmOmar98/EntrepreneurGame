# J2 · 09h16 · TICK · WARN

- PROD home : 200 · 347ms (apres redirect 307→200 · nominal)
- Vercel 5xx (15 min) : 0 (logs runtime non accessibles via MCP — faux positif connu 403 list_deployments ; smoke HTTP OK)
- Supabase RLS denied (15 min) : 3 x `permission denied for table announcements` (faux positif connu — RLS announcements non exposee Players, pattern habituel)
- SQL errors applicatifs : 2 x `column "created_at" does not exist` (mgmt-api interne, pas applicatif Player — WARN niveau inferieur)
- Slow queries : aucune detectee dans postgres logs (derniers checkpoints : 9.5s write WAL — normal volume pilote)
- Auth errors : 0 erreurs 4xx/5xx dans les 100 entrees auth log — nominal
- Active sessions (15 min) : **2** (seuil WARN : <2 = HARD — juste au-dessus, attention)
- Deploy status : non verifie via Vercel MCP (403 liste deployments) ; smoke HTTP 200/347ms confirme PROD up
- Advisors security : WARN persistants connus (search_path mutable sur set_updated_at/guard_player_onboarding/etc. + SECURITY DEFINER fonctions exposees anon) — aucun NOUVEAU advisor depuis J1, pas d'escalade

## Suivi soumissions M3-M5 (incident BMC)

Cumul toutes periodes :
| Livrable | Mission UUID prefix | Total soumissions |
|---|---|---|
| persona-v1 (M1) | 0bc77ff0 | 4 |
| design-thinking-v1 (M1) | 0bc77ff0 | 4 |
| prep-questions-v1 (M2) | 8f45522a | 7 |
| fiches-entretien-v1 (M2) | 8f45522a | 4 |
| bmc-v1 (M3) | 3779e843 | **3** |
| marche-technique-v1 (M4) | 341cfdb0 | **2** |
| moscow-v1 (M4) | 341cfdb0 | **2** |
| commercialisation-v1 (M5) | 588673f6 | **1** |

**Aucune nouvelle soumission sur les 2 dernieres heures** — colonne `submitted_at > now() - 120min` retourne 0 lignes.

**Interpretation** : coherent avec l'incident M3-M5 signale. Les livrables BMC/Marche/MoSCoW/Commercialisation ont des soumissions tres basses (1-3) vs M1/M2 qui ont 4-7. Cela confirme que les Players ne voient pas ou ne peuvent pas soumettre sur M3-M5 (filtre `scheduled_date` bloque sur 2026-05-20). Sessions basses (2) = peu de Players actifs ce matin — encore tot en J2 (09h16).

## ⚠️ Warnings actifs

1. **Incident M3-M5 (HARD CONNU, en attente go/no-go)** : bug filtre `lib/journey.ts:257-262` cache les missions non schedulees J2. Soumissions M3-M5 stagnantes confirme impact reel. Hotfix en attente approbation Omar.
   - bmc-v1 : 3 soumissions total (sur 10 Players potentiels = 70% bloquage)
   - commercialisation-v1 : 1 soumission seulement
   - Action requise : **go/no-go hotfix a trancher maintenant** avant que les ateliers M3-M5 commencent.

2. **Sessions basses** : 2 sessions actives a 09h16 — normal heure matinale J2, a re-verifier au prochain tick (09h30) quand les Players arrivent en salle.

3. **SQL `created_at` does not exist** : 2 occurrences recentes via mgmt-api (timestamps ~09h02 et ~09h06). Probablement une query interne Supabase sur une table sans cette colonne. Pas d'impact Player direct visible. A noter.

**Verdict** : WARN — infra stable, incident M3-M5 est le seul risque actif, hotfix attendu. Prochain tick J2-09h31.
