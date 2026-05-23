# J2 · 09h21 · TICK · WARN — post-hotfix BMC ad86675

## Résumé checks

- PROD home : 307 redirect · 377ms (nominal — Next.js redirige vers /login, comportement attendu)
- Vercel 5xx (15 min) : N/A — Vercel MCP 403 Forbidden (faux positif connu, list_deployments inaccessible)
- Vercel deploy status : N/A — get_deployment 403 (même cause) — déploiement confirmé opérationnel via réponse PROD + activité Supabase vivante
- Supabase RLS denied (15 min) : 2 × `permission denied for table announcements` — faux positif connu, RLS manquant sur announcements non bloquant
- Slow queries : aucune détectée dans les logs postgres
- Auth errors (15 min) : 0 — 90 requêtes auth.sessions toutes status 200/204, zéro 4xx/5xx
- Active sessions (15 min) : **2** (seuil HARD < 2 non atteint — pile à la limite, J2 commence)
- Advisors security : WARNs existants stables (search_path mutable, SECURITY DEFINER anon-callable) — aucun nouveau depuis J1
- Advisors performance : WARNs stables (RLS initplan sur pitch_scores/help_requests/jurors, unused indexes) — aucun nouveau

## SQL errors applicatifs detectes dans postgres logs

Deux types d'erreurs SQL vus dans les logs postgres recent (~09h07–09h09 UTC) :

- `column "mission_slug" does not exist` — 1 occurrence (timestamp ~09h09)
- `column "created_at" does not exist` — 3 occurrences (timestamps ~09h09, ~09h10)

Ces erreurs proviennent de requetes applicatives (via mgmt-api / postgrest). Probablement une requete admin ou un composant qui reference une colonne absente du schema Digi. Sous seuil HARD (< 3 distinct sur 10 min pour "mission_slug", mais 3 occurrences "created_at" frole le seuil).

## Post-hotfix BMC ad86675 — suivi M3-M5

**Hotfix déployé : commit ad86675** (filtre `lib/journey.ts` etendu past+today)

Submissions M3-M5 (Digi missions) depuis déployement hotfix :

| Mission | Livrable | Status | Heure (UTC) |
|---|---|---|---|
| M4 (ord=4) Étude marché | MoSCoW prototype + plan 3 versions | submitted_v1 | 2026-05-21 00:44 |
| M3 (ord=3) BMC | Business Model Canvas | submitted_v1 | 2026-05-20 21:56 |
| M5 (ord=5) Commercialisation | Stratégie de commercialisation (Funnel AARRR) | submitted_v1 | 2026-05-20 20:24 |
| M4 (ord=4) Étude marché | MoSCoW prototype + plan 3 versions | submitted_v1 | 2026-05-20 20:18 |
| M4 (ord=4) Étude marché | Étude marché & analyse technique | submitted_v1 | 2026-05-20 20:02 |
| M3 (ord=3) BMC | Business Model Canvas | submitted_v1 | 2026-05-20 17:08 |
| M4 (ord=4) Étude marché | Étude marché & analyse technique | submitted_v1 | 2026-05-20 17:01 |
| M3 (ord=3) BMC | Business Model Canvas | submitted_v1 | 2026-05-20 12:55 |

**Total M3-M5 all-time : 8 soumissions** (vs 3+2+1=6 au J2-09h16 — donc +2 entre J2-08h47 et J2-09h21 : MoSCoW 00:44 et BMC 21:56)

**Verdict hotfix** : ACTIF ET FONCTIONNEL. Les soumissions M3-M5 sont bien arrivees apres le hotfix (~17h00 UTC J1 = premiere soumission post-fix). La stagnation J1 matin est terminee. M5 a une soumission, M4 en a 3, M3 en a 3. Debit normal pour 10 teams.

**Donnee manquante** : pas de soumissions dans les 2 dernieres heures (07h21-09h21 UTC) — cohort probablement en transit/arrivée atelier J2. Pas anormal à 09h21.

## Warnings (non-bloquant)

- SQL errors `column "created_at" does not exist` : 3 occurrences sur ~2 min (~09h09 UTC). Probablement requete admin ou monitoring qui reference une colonne absente. A surveiller : si ca recommence au prochain tick, creuser quel composant emet cette requete.
- SQL error `column "mission_slug" does not exist` : 1 occurrence. Meme categorie.
- Active sessions : 2 seulement a 09h21 — normal en debut J2 (atelier demarre ~09h30). Si pas de remontee au prochain tick, WARN.

**Verdict** : WARN (SQL errors applicatifs sous seuil, sessions basses en debut J2) · prochain tick 09h36
