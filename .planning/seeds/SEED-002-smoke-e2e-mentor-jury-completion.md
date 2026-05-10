---
id: SEED-002
status: dormant
planted: 2026-05-10
planted_during: T-3 / pré-pilote AgreenTech 13-14 mai 2026
trigger_when: avant 12/05 23h00 reset PROD OU début prochaine session Claude Code après restart (--isolated actif)
scope: Medium
---

# SEED-002: Compléter smoke E2E mentor + jury + porteurs manquants avant pilote AgreenTech 13/05

## Why This Matters

Le smoke Option C séquentiel du 2026-05-10 a validé le harness applicatif côté Player (R1, R3, B4 AgreenTech v2, login, onboarding 3 étapes, 9 livrables × 3 porteurs = 27 submissions) mais a laissé trois trous critiques avant le go-live du 13/05 8h30 :

1. **Flux mentor non testé E2E** — la rubric AgreenTech 5×5=25, les verdicts `validate_v1` / `request_v2`, les `mentor_comments` (Phase 9), la propagation côté Player après évaluation, et la règle R2 warn-only n'ont jamais été exercés en PROD avec un compte mentor réel.
2. **Pitch + jury + publication résultats non testés** — `/jury` (notation pitch sur la rubric pitch_score), `/results` avec `events.results_published_at`, pondération 20/80 effective côté affichage final n'ont pas été validés en bout-en-bout.
3. **8 porteurs sur 11 non couverts** — P03 (Fès argan), P05 (El Hajeb compostage), P06 (Rabat SaaS élevage), P08 (Oued Zem météo), P09 (Agadir aquaponie), P10 (Souss Massa biocontrôle), P11 (Meknès vision IA) — diversité d'idées AgriTech non simulée. Faille en cas de comportement template-spécifique.

**Risque concret si non résolu** :
- 13/05 14h00, premier mentor Tamwilcom/BoA Academy ouvre `/mentor`, clique sur une submission, soumet un score → si bug rubric ou RLS announcement (commit 8352ffc), aucune capacité de debug live (Omar en triple casquette workshop).
- 14/05 17h00, publication `/results` côté podium → si bug pondération 20/80 ou affichage rang/scores Player (régression R1 percée), perte de crédibilité partenaires.

## When to Surface

**Trigger** : avant 12/05 23h00 reset PROD OU début prochaine session Claude Code après restart `.mcp.json --isolated`.

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches any of these conditions:
- Toute session ouverte entre 2026-05-10 19h00 et 2026-05-12 23h00 (fenêtre pré-reset)
- Mention de "swarm parallèle", "smoke test", "PROD", "pilote 13/05", "AgreenTech go-live"
- Modification de `.mcp.json`, redémarrage Claude Code récent
- Commande `/gsd-progress` ou `/gsd-resume-work` exécutée pendant cette fenêtre

## Scope Estimate

**Medium** — 1 à 2 sessions de 1h chacune, dépend du choix d'option :

**Format smoke standard à privilégier — 2P + 1M + 1GM (~30-40 min)** :
- 2 porteurs séquentiels couvrant 2 villes/idées différentes (ex. P05 El Hajeb compostage + P09 Agadir aquaponie pour combler les villes manquantes du smoke 2026-05-10)
- 1 mentor M01 batch sur les ~18 submissions générées + les 27 PROD existantes si pas reset (eval rubric 5×5 mix 80% validate_v1 / 20% request_v2)
- 1 game_master G01 (Omar UEMF) ouvre `/jury`, soumet 1-2 pitch_scores tests, met `events.results_published_at` puis audit R1 podium
- Cf. mémoire `feedback_smoke_minimal_2p_1m_1gm.md`

**Option alternative — Swarm parallèle 11 (~30 min, requiert restart Claude Code)** :
- Si Omar veut couverture exhaustive (tous porteurs + tous templates AgriTech), restart pour activer `.mcp.json --isolated`
- Spawn 11 porteurs + 1 mentor dans un seul message
- À réserver aux cas où la couverture diversité est critique — sinon le format 2P+1M+1GM suffit

**Option fallback — Tests manuels Omar (~20 min)** :
- Si pas le temps d'orchestrer agents : Omar login M01 + login G01 + clics manuels suffisent pour valider R2 + jury + R1 podium

## Breadcrumbs

Related code and decisions found in the current codebase:

- `.planning/quick/260510-smk-smoke-prod-option-c-3porteurs-27-livr/260510-smk-SUMMARY.md` — rapport smoke complet 2026-05-10
- `docs/SWARM-PROD-RUNBOOK.md` — runbook Étape 3 (Option A parallèle, B sériel, C smoke réduit) + Étape 4 mentor + Étape 5 smoke check post-swarm
- `cohorte-agreentech-creds.csv` — 11 porteurs + 2 mentors + 4 game_masters provisionnés
- `database/_reset_pre_event.sql` — script reset à exécuter 12/05 23h00
- `lib/results.ts:30` `DEFAULT_PITCH_WEIGHT = 0.8` — pondération 20/80 (B2 fixé `8199fb1`)
- `lib/score.ts` — rubric AgreenTech 5×5=25 (B4 fixé `06624a3` + `28a306d`)
- `app/mentor/`, `app/mentor/submission/[id]/` — flux mentor à valider
- `app/jury/`, `app/results/` — flux pitch + publication
- `components/results-podium.tsx`, `components/results-replay.tsx` — gating `isGameMaster` (B1 fixé `c740d48`)
- `components/app-shell.tsx` — bouton "Se déconnecter" `type="submit"` à fix (bug accessoire P04)
- `screenshots/swarm-P01/`, `screenshots/swarm-P02/`, `screenshots/swarm-P04/`, `screenshots/swarm-P07/` — preuves visuelles smoke
- Mémoire `project_smoke_prod_t3.md` — synthèse résultats
- Mémoire `feedback_playwright_mcp_swarm_restart.md` — leçon contention MCP

## Notes

**Actions résiduelles annexes** (à inclure dans la même session de complétion) :

1. **Fix bouton logout `type="submit"`** dans `components/app-shell.tsx` (StaffShell + AppShell) → `type="button"` ou hors `<form>`. ~2 min, hors zone sensible.
2. **SQL diagnostic Pouls cohorte "Diagnostic 0/1"** : vérifier si `deliverable_templates` a un enregistrement avec `level = 'L0_diagnostic'` ou si le pouls compte un livrable absent.
   ```sql
   select level, slug, title from public.deliverable_templates order by level, slug;
   select count(*) filter (where level = 'L0_diagnostic') as l0_count from public.deliverable_templates;
   ```
3. **Documenter restart-Claude-Code prerequisite** dans `docs/SWARM-PROD-RUNBOOK.md` Étape 3 Option A en gras / encadré (déjà mentionné mais pas suffisamment visible — P07 a été perdu malgré la note existante).
4. **Investiguer 4 erreurs console `/journey`** vues par P02 mais pas par P04 (timing/session-state probable).

**Pollution résiduelle PROD** : 2 agents tués mid-flight (P01-parallèle, P09) ont peut-être écrit des données via Supabase REST API direct — le reset 12/05 23h00 nettoiera, donc non bloquant tant que le reset s'exécute.

**Cutoff merge `main`** : mardi 12/05 23h00 (cf. CLAUDE.md). Si fix `type=submit` ou autre code change, doit être mergé avant.
