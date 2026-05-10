# Swarm PROD Runbook — AgreenTech 2026 Smoke "grandeur nature"

**Objet** : tester l'app EntrepreneurGame en PROD à pleine charge avec 11 porteurs simulés + 2 mentors simulés, avant le go-live du 13 mai 2026 8h30.

**Cible** : `https://entrepreneur-game-six.vercel.app` (Supabase PROD).

**Quand** : entre maintenant (T-3) et le 12/05 23h00. Le RESET PROD est planifié 12/05 23h00.

---

## ⚠️ Lessons learned du run pilote 2026-05-10

Le premier essai de swarm a révélé 2 limitations bloquantes :

1. **Playwright MCP mono-navigateur par défaut** : 1 seul profil Chrome, donc 1 seul agent à la fois. Le swarm parallèle 12 agents = `"Browser is already in use"`.
   - **Fix** : `.mcp.json` à la racine du projet (créé 2026-05-10) ajoute `--isolated` au server Playwright. Nécessite **redémarrage Claude Code** pour effet.
   - Sans `--isolated` : sérialiser (1 agent à la fois) — voir Étape 3 ci-dessous.

2. **Bug logout staff** : `StaffShell` n'avait pas de bouton signOut. Si un mentor/GM se trompait de compte, il était coincé (cookie httpOnly).
   - **Fix appliqué 2026-05-10** : `components/app-shell.tsx` `StaffShell` instancie maintenant `<form action={signOut}>` dans le sidebar.

3. **Pollution cookies entre runs** : autocomplete navigateur réinjectait les creds d'un user précédent.
   - **Fix appliqué dans les fichiers d'agent** : étape "Pre-clean session" obligatoire au boot.

---

## Pré-requis

- `.env.local` à la racine avec `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` valides PROD.
- `database/seed_event_hackdays.sql` déjà appliqué sur PROD (commit `28a306d` confirme).
- Migrations Phase 8 + 9 appliquées (commit `cd8482f` confirme).
- `cohorte-agreentech-creds.csv` à la racine (créé par le step ci-dessous).

---

## Étape 1 — Provisioning des 13 comptes (1 min)

```powershell
npm run provision:cohort
```

Ce script :
- Lit `cohorte-agreentech-creds.csv`.
- Crée 11 `auth.users` porteurs + 2 `auth.users` mentors (idempotent — re-run safe).
- Upsert 13 `profiles` avec le bon `app_role`.
- Crée 11 `players` (slug `p01`..`p11`) liés à `cohorte-mai-2026`, avec `idea` pré-remplie depuis `idea_seed`.
- Crée 11 `player_members` liant porteur → player en `team_role=owner`.
- Imprime un JSON sur stdout avec `user_id` + `player_id` par ligne.

**Vérification** :
```sql
-- Sur Supabase SQL editor :
select count(*) from public.players where cohort_id = (select id from public.cohorts where slug = 'cohorte-mai-2026');
-- → attendu : 11

select count(*) from public.profiles where app_role = 'mentor';
-- → attendu : ≥ 2
```

**Si ça plante** : vérifier `.env.local`. Si `cohorte-mai-2026 not found`, ré-appliquer `database/seed_event_hackdays.sql`.

---

## Étape 2 — Smoke 1 agent porteur (5 min)

Avant de scaler à 11, valider le harness avec 1 seul porteur via Claude Code :

```
Spawn agent porteur-projet-agreentech avec le prompt :

  project_code=P01
  holder_name=Adil TADARTI
  email=tadarti2004@gmail.com
  password=Agreen2026!P01
  city=Casablanca
  members=Mohamed Amine Boutsoudine
  idea_seed=Capteurs sol connectes pour irrigation goutte-a-goutte intelligente sur cultures maraicheres

  Fais le parcours complet : login, onboarding 3 etapes, soumission des 9 livrables L1-L6.
  Capture les screenshots dans screenshots/swarm-P01/.
  Reporte en fin.
```

**Critères de succès du smoke #1** :
- Login OK.
- Onboarding 3 étapes complété, redirect `/journey`.
- ≥ 7/9 livrables soumis (les 2 dernières peuvent échouer si verrouillage R3 résiduel — c'est un bug à signaler).
- Aucun score visible côté Player (R1 OK).
- Aucun crash 500.

**Si KO** : analyser le rapport, fixer le harness ou l'app, re-run.

---

## Étape 3 — Swarm 11 porteurs (parallèle ou sériel selon config MCP)

### Option A — Parallèle (15 min, requis : `.mcp.json` `--isolated` + restart Claude Code)

Vérifie d'abord :
```powershell
# Le projet doit avoir .mcp.json à la racine avec --isolated
type .mcp.json
# Si la session Claude Code n'a pas été redémarrée depuis l'ajout de .mcp.json, FAIS-LE.
# Sinon les 12 agents vont se battre pour le seul profil Chrome.
```

Une fois le smoke #1 vert ET la session Claude Code redémarrée, lancer le swarm complet via un **seul message** avec **11 invocations Agent simultanées** :

```
Tool: Agent
Subagent_type: porteur-projet-agreentech
Description: Swarm porteur P01..P11 en parallele

Invocations (1 par projet) avec les prompts ci-dessous :
- P01 : ... (cf CSV)
- P02 : ...
- ...
- P11 : ...
```

⚠️ **Important** : les 11 Agent doivent être appelés dans **un seul message** pour s'exécuter en parallèle. Sinon ils s'exécutent séquentiellement (110 min au lieu de 15 min).

Pendant le swarm :
- Surveiller https://supabase.com/dashboard pour voir les inserts arriver.
- Surveiller https://entrepreneur-game-six.vercel.app/admin (avec un compte game_master) pour voir le scoreboard évoluer.

### Option B — Sériel (3-4 heures, fonctionne sans `--isolated`)

Si la session n'a pas été redémarrée après l'ajout de `.mcp.json`, OU si tu veux éviter le risque parallèle, lance les agents UN PAR UN :

```
Spawn agent porteur P01 (en foreground, attendre fin)
Spawn agent porteur P02 (en foreground, attendre fin)
...
Spawn agent porteur P11 (en foreground, attendre fin)
Spawn agent mentor M01 (en foreground, batch toutes les évaluations)
```

Le `--isolated` n'est pas requis — chaque agent termine et libère le profil avant le suivant.

### Option C — Smoke minimal 2P + 1M + 1GM (30-40 min, **format standard à privilégier**)

**Convention 2026-05-10 (post-rétro Option C 3 porteurs trop longue)** : tout smoke E2E PROD doit être réduit à **2 porteurs séquentiels + 1 mentor batch + 1 game_master jury/results** par défaut.

**Composition** :
- **2 porteurs séquentiels** couvrant 2 villes/idées différentes pour diversité AgriTech (ex. P05 El Hajeb compostage + P09 Agadir aquaponie, ou P01 Casablanca + P02 Fès si jamais testés). ~15-20 min × 2 = 30-40 min.
- **1 mentor M01 batch** sur les ~18 submissions générées par les 2 porteurs (rubric 5×5=25, mix 80% validate_v1 / 20% request_v2). ~10 min.
- **1 game_master G01 (Omar UEMF)** ouvre `/jury`, soumet 1-2 `pitch_scores` tests, met `events.results_published_at` (SQL editor), audit R1 podium côté Player. ~5 min.

**Couverture validée** :
- Login porteur + onboarding 3 étapes
- 9 livrables × 2 = 18 submissions
- Eval mentor (rubric AgreenTech 5×5 + verdicts validate_v1/request_v2 + propagation côté Player → R2 warn-only)
- Pitch + jury + publication `/results` (pondération 20/80, gating `isGameMaster` → R1)
- R1/R2/R3 audit côté Player (rubric, score, rang, /100, /140 → 0 match attendu)
- Trigger XP recalc + progression niveau

**Pourquoi ce format remplace l'ancien Option C 3 porteurs** :
- 3 porteurs ont pris ~60 min (smoke 2026-05-10) sans tester mentor ni jury — trous critiques.
- 2 porteurs suffisent pour la diversité (ville + idée), libèrent du temps pour mentor + GM.
- Mentor + GM systématiques comblent les trous J1 (eval) et J2 (publication résultats).

**Quand basculer vers swarm parallèle (Option A)** : seulement si Omar exige couverture exhaustive 11 porteurs. Sinon le format 2P+1M+1GM suffit.

Voir mémoire `feedback_smoke_minimal_2p_1m_1gm.md`.

---

## Étape 4 — Mentor evaluator en parallèle (10-60 min)

**Note importante** : `database/rls.sql:38` `is_mentor()` retourne `true` pour `mentor` ET `game_master`. Donc les 4 GM (G01–G04) peuvent aussi évaluer via `/mentor`. Mais leur redirect post-login va vers `/admin` (cf. `lib/auth.ts:pathForRole`) — l'agent doit naviguer manuellement vers `/mentor`.

**Option A — Pendant le swarm (recommandé)** : lancer 1 ou 2 invocations de `mentor-evaluateur-agreentech` dans le **même message** que les 11 porteurs. Le mentor patientera si la liste `/mentor` est vide, et évaluera au fur et à mesure que les submissions arrivent.

**Option B — Après le swarm** : lancer le mentor une fois les 11 porteurs terminés. Plus simple à debug, mais ne teste pas la concurrence soumission ↔ évaluation.

**Choix du compte évaluateur** :
- `M01`/`M02` (mentor pur) → privilèges minimaux, idéal pour smoke automatisé. Recommandé.
- `G01..G04` (game_master) → privilèges étendus, attention navigation possible vers `/admin` ou `/players/[id]`. Réserver pour des tests manuels d'Omar/Fouad/Bouhlal/Bousmaha le 13/05.

```
Tool: Agent
Subagent_type: mentor-evaluateur-agreentech

Prompt (smoke automatise) :
  mentor_code=M01
  mentor_name=EIC Mentor Sim 1
  email=mentor1.agreentech@smoke.entrepreneurgame.local
  password=Agreen2026!M01
  app_role=mentor

  Evalue toutes les submissions disponibles. 80% validate_v1, 20% request_v2.
  Distribution scores cible 3.5-4.0 par critere.
```

**Variante avec GM (si Omar veut tester son propre compte)** :
```
  mentor_code=G01
  mentor_name=Omar Ameur (UEMF)
  email=o.ameur@ueuromed.org
  password=Agreen2026!G01
  app_role=game_master
```

---

## Étape 5 — Smoke check post-swarm (5 min)

Sur PROD avec un compte `game_master` (création manuelle ou via SQL), vérifier :

1. **`/admin`** :
   - 11 players actifs visibles.
   - Total submissions ≈ 99 (11 × 9).
   - Total évaluations ≈ 60-80 (selon ce que les mentors ont eu le temps de faire).
2. **`/admin/players/[id]`** pour P01 et P05 :
   - 9 submissions visibles.
   - Score project recalculé (somme max evals validées par template).
   - `current_level` reflète la progression.
3. **`/results`** :
   - Sans `events.results_published_at` → page « pas encore publiée » (correct, R1).
   - Si tu fais un test publish : podium visible, scores visibles côté game_master uniquement.
4. **Sanity audit R1** :
   ```bash
   # Connecte-toi en P01 sur PROD, ouvre /journey, /results, et fais ce grep dans le HTML rendu :
   # Aucun match attendu pour : /\d+\.\d+/ dans des contextes "score" ou "rank"
   ```

---

## Étape 6 — RESET PROD (12/05 23h00, 5 min)

Une fois la validation faite, **avant le go-live**, purger toutes les données de smoke pour partir blanc.

### Procédure

1. Ouvrir le SQL editor Supabase PROD.
2. Coller le contenu de `database/_reset_pre_event.sql`.
3. Exécuter (le script est dans une `BEGIN; ... COMMIT;`, atomique).
4. Vérifier le bloc diagnostic en bas du fichier : tous les compteurs doivent être à 0.

### Ce qui est gardé après RESET

- 11 `auth.users` porteurs + 2 mentors (creds toujours valides).
- 13 `profiles` (app_role intact).
- 11 `players` (slug, name, idea préservés — les vrais porteurs vont les ré-onboarder).
- 11 `player_members`.
- Events / cohorts / missions / deliverable_templates / levels.

### Ce qui est purgé

- `submissions` → 0.
- `evaluations` → 0.
- `pitch_scores` → 0.
- `players.score_project` → 0.
- `players.score_engagement` → 0.
- `players.current_level` → `L0_diagnostic`.
- `players.onboarded_at` → `NULL` (les porteurs reverront `/onboarding` au premier login le 13/05).
- `events.results_published_at` → `NULL`.
- `announcements` / `mentor_comments` → 0 (Phase 9 tables).

### ⚠️ Garde-fou

**NE PAS RUN ce script le 13/05 ou le 14/05.** Il détruirait les vraies données participants.

Le 12/05 23h00 est la fenêtre prévue. Après ça, le PROD est figé pour go-live.

---

## Annexe — Diagnostic rapide PROD

```sql
-- Combien de soumissions / évaluations en cours ?
select
  (select count(*) from public.submissions)               as submissions_total,
  (select count(*) from public.submissions where status = 'submitted_v1') as v1_pending_eval,
  (select count(*) from public.submissions where status = 'validated')    as validated,
  (select count(*) from public.evaluations)               as evaluations_total,
  (select count(*) from public.players where current_level <> 'L0_diagnostic') as players_progressed;

-- Distribution scores par template (smoke health check)
select
  dt.slug,
  count(e.*)            as evals_count,
  round(avg(e.total_score), 1) as avg_score,
  min(e.total_score)    as min_score,
  max(e.total_score)    as max_score
from public.deliverable_templates dt
left join public.submissions s on s.deliverable_template_id = dt.id
left join public.evaluations e on e.submission_id = s.id
group by dt.slug
order by dt.slug;
```

---

## Annexe — Fail-safes en cas de catastrophe

- **Si le RESET le 12/05 23h plante** : restaurer un snapshot Supabase PROD (via dashboard → Backups). Les snapshots Supabase sont quotidiens (rétention 7j sur free tier).
- **Si un porteur réel ne peut pas se logger le 13/05 8h30** : re-run `npm run provision:cohort` (idempotent — reset le password à la valeur du CSV, garde tout le reste).
- **Si le mailto: bug pendant le pilote** : c'est purement client-side (server action ne dépend pas de l'email). Les soumissions arrivent en DB indépendamment.
