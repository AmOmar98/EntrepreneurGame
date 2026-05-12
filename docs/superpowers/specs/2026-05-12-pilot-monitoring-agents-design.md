# Pilot Monitoring Agents — Design (J1/J2 AgreenTech 13-14 mai 2026)

> Status: **DRAFT** — to be approved by Omar before implementation plan.
> Author: Claude (brainstorming session 2026-05-12 evening).
> Target activation: 2026-05-13 ~08h00.

## 1. Goal

Donner à Omar (solo dev animant les workshops 13-14 mai) des **vigies automatiques** qui surveillent la santé technique de la PROD (`https://entrepreneur-game-six.vercel.app`) pendant qu'il ne peut pas regarder Vercel/Supabase lui-même, et qui **réparent en autonomie les pannes simples** ou queuent les pannes lourdes pour traitement nocturne manuel par Omar.

## 2. Priorité (cadrage de session)

1. **Santé technique** : 5xx, RLS denied, build status, Supabase logs, slow queries.
2. *Pas* monitoring R1/R2/R3 visuel (cardinal rules) — l'`eic-pedagogical-advisor` couvre déjà ce besoin en pre-edit.
3. *Pas* monitoring pacing pédagogique (qui est stuck) — humain (GameMasters) le couvre.
4. *Pas* monitoring crédibilité partenaires — fait par smoke pré-pilote.

## 3. Architecture — 2 agents

```
J1 (13/05) 8h30 → 18h  ·  J2 (14/05) 8h30 → 18h

  /loop 15m ─┐
             ▼
      ┌──────────────────────┐
      │ pilot-health-watcher │  observe seulement (zero edit code)
      │ (cadence 15 min)     │  ├─ curl PROD home
      │                      │  ├─ Vercel runtime logs
      │                      │  ├─ Supabase logs (postgres/auth/api)
      │                      │  └─ Supabase advisors
      └──────┬───────────────┘
             │  if HARD → PushNotif + spawn ▼
             │  if WARN → file `.planning/pilot-alerts/`
             ▼
      ┌──────────────────────┐
      │ pilot-hotfix-prepper │  triage + auto-fix LÉGER non-cardinal
      │ (event-driven)       │  ├─ Reproduit en local
      │                      │  ├─ Classifie léger/lourd × cardinal/non
      │                      │  ├─ LÉGER non-cardinal → fix + push main
      │                      │  ├─ LÉGER cardinal → diff prêt + ping
      │                      │  └─ LOURD → queue night (Omar le soir)
      └──────────────────────┘
```

Pas d'agent "night fixer" — Omar traite la queue de nuit lui-même.

## 4. Agent 1 — `pilot-health-watcher`

### Frontmatter à créer dans `.claude/agents/pilot-health-watcher.md`

```yaml
---
name: pilot-health-watcher
description: |
  Vigie technique J1/J2 AgreenTech. Lancée toutes les 15 min via /loop pendant
  le pilote (13-14 mai 2026). Observe PROD Vercel + Supabase, classe en VERT /
  WARN / HARD, écrit un tick reviewable dans .planning/pilot-alerts/. Spawne
  pilot-hotfix-prepper sur HARD. NE TOUCHE JAMAIS au code.
tools: Bash, Read, Glob, Write, PushNotification, mcp__claude_ai_Vercel__get_runtime_logs, mcp__claude_ai_Vercel__get_deployment_build_logs, mcp__claude_ai_Vercel__get_deployment, mcp__claude_ai_Vercel__list_deployments, mcp__plugin_supabase_supabase__get_logs, mcp__plugin_supabase_supabase__get_advisors, mcp__plugin_supabase_supabase__execute_sql, Agent
---
```

### Checks par tick (15 min)

| # | Check | Source | Seuil HARD | Seuil WARN |
|---|---|---|---|---|
| 1 | PROD home 200 | `curl -s -o /dev/null -w '%{http_code} %{time_total}' https://entrepreneur-game-six.vercel.app/` | ≥1 fail OR latence >3s | 1.5–3s |
| 2 | Vercel 5xx (15 min) | `get_runtime_logs` filter status≥500 | ≥3 | 1–2 |
| 3 | Vercel build status | `get_deployment` latest | failed | building >5 min |
| 4 | Supabase RLS denied (15 min) | `get_logs` service=postgres + grep `permission denied` | ≥5 | 1–4 |
| 5 | Slow queries | `get_logs` service=postgres + grep `slow query` | ≥1 query >5s | ≥3 queries >1s |
| 6 | Auth errors | `get_logs` service=auth | ≥5 401/403 | 1–4 |
| 7 | Active sessions count | `execute_sql` (**SELECT only** — voir note ci-dessous) sur auth.sessions where updated_at > now()-15min | <2 (suspect crash) | drop >50% vs tick précédent |
| 8 | Advisors changement | `get_advisors` security+performance | nouveau security WARN | nouveau perf WARN |

### Format de sortie — tick VERT

`.planning/pilot-alerts/J1-10h45-tick.md` :

```markdown
# J1 · 10h45 · TICK #11 · VERT

- PROD home : 200 · 412ms
- Vercel 5xx (15 min) : 0
- Supabase RLS denied (15 min) : 2 ← normal (Players testant boundaries)
- Slow queries : aucune >1s
- Auth errors : 0
- Active sessions : 14 (stable vs 13 tick précédent)
- Deploy status : ready (dernier deploy il y a 14h)

**Verdict** : RAS · prochain tick 11h00
```

### Format de sortie — tick HARD

```markdown
# J1 · 11h15 · TICK #12 · ⚠️ HARD

## Trigger
Vercel 5xx (15 min) : **7** (seuil HARD ≥3)

## Endpoints touchés
- POST /onboarding · 5x · TypeError: Cannot read property 'level' of undefined
- GET /journey/deliverable/[id] · 2x · timeout 30s

## Players impactés (best effort)
P03, P07 — d'après auth.uid dans logs

## Action prise
- PushNotification envoyée à Omar
- Spawn pilot-hotfix-prepper avec context ↑

## Prochaine étape
Voir `.planning/pilot-alerts/J1-11h15-hotfix-prep.md` quand le prepper aura fini (~2 min).
```

### Rétention

Aucune purge pendant J1/J2. Tous les ticks (VERT inclus) restent dans `.planning/pilot-alerts/`. Omar balaye après le pilote.

### Note sur `execute_sql` (check #7)

Le check Active sessions utilise `mcp__plugin_supabase_supabase__execute_sql` qui peut théoriquement écrire en base. Le prompt du watcher **DOIT** restreindre explicitement l'usage à des requêtes `SELECT` only. Patron exact à utiliser dans le prompt agent :

```sql
SELECT count(*) FROM auth.sessions WHERE updated_at > now() - interval '15 minutes';
```

Toute requête non-SELECT dans cet agent est un bug à signaler immédiatement à Omar via PushNotification HARD.

### Notification

- **VERT** : silent (juste le fichier).
- **WARN** : fichier uniquement.
- **HARD** : `PushNotification` ET fichier ET spawn hotfix-prepper.

## 5. Agent 2 — `pilot-hotfix-prepper`

### Frontmatter à créer dans `.claude/agents/pilot-hotfix-prepper.md`

```yaml
---
name: pilot-hotfix-prepper
description: |
  Triage + auto-fix LÉGER non-cardinal pour bugs détectés en J1/J2 par
  pilot-health-watcher. Travaille TOUJOURS sur branche `main`. Permissions
  bypass via .claude/settings.local.json. NE TOUCHE PAS aux zones cardinales
  R1/R2/R3 sans advisor + validation Omar. NE TOUCHE PAS au schéma SQL.
tools: Bash, Read, Edit, Write, Glob, Grep, ToolSearch, PushNotification, Agent, mcp__claude_ai_Vercel__get_runtime_logs, mcp__plugin_supabase_supabase__get_logs, mcp__plugin_supabase_supabase__execute_sql
---
```

### Pré-flight obligatoire en début d'agent

```bash
CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "main" ]; then
  git stash push -m "pilot-hotfix-auto-stash-$(date +%Y%m%d-%H%M)" --include-untracked
  git checkout main && git pull origin main
fi
```

L'agent **DOIT** être invoqué sans `isolation: "worktree"` — toutes ses modifs sont visibles dans le repo Omar voit (pas de worktree caché).

### Workflow interne

```
1. CONTEXT      ← read alert file fourni par le watcher
2. REPRO        ← grep code, identify fichier(s) suspect(s), reproduire local
3. CLASSIFY     ← matrice 2×2

                              │ NON-cardinal R1/R2/R3 │ Cardinal R1/R2/R3
              ──────────────┼───────────────────────┼───────────────────────
              ≤1 fichier    │ LÉGER · auto-fix      │ LÉGER-S · diff+ping
              ≤30 lignes    │ + push direct main    │ (attend validation
              (pas SQL)     │                       │ Omar 30 sec)
              ──────────────┼───────────────────────┼───────────────────────
              >1 fichier    │ LOURD · queue night   │ LOURD · queue night
              OU >30 lignes │                       │ + ping HARD
              OU schema SQL │                       │

4. ACT          ← selon classify
5. REPORT       ← .planning/pilot-alerts/JX-HHhMM-hotfix-prep.md
                  + PushNotif si action prise
```

### Identification "cardinal R1/R2/R3"

Une zone est **cardinale** si le fichier touché est dans :
- `app/journey/`, `app/onboarding/`, `app/mission/`, `app/jury/`, `app/results/`
- `components/results-*`, `components/submission-*`
- `lib/score.ts`, `lib/results.ts`, `lib/seed/`
- `database/**`
- `lib/types.ts`

(Liste dérivée de la section "Pre-edit guards" du CLAUDE.md.)

Si cardinal → l'agent **DOIT** spawner `eic-pedagogical-advisor` avant tout `Edit`.

### Path LÉGER non-cardinal (auto-fix + push)

```bash
# Pré-conditions vérifiées (sur main, working tree clean)
# Edit le ou les fichiers
npm run typecheck   # gate 1
npm run lint        # gate 2
npm run build       # gate 3
# Si un gate fail → ABORT, ne pas commit, écrire report ROUGE + ping
git add <fichier>
git commit -m "fix(pilote-J1): <one-liner>"
git push origin main
sleep 90   # attendre redeploy Vercel
curl -sf https://entrepreneur-game-six.vercel.app/ > /dev/null && echo "OK"
# Report ✅ PUSHED
```

### Path LÉGER cardinal (diff prêt, attend validation)

1. Spawn `eic-pedagogical-advisor` avec le diff proposé.
2. Si verdict OK → écrit `.planning/pilot-alerts/JX-HHhMM-needs-omar-greenlight.md` avec :
   - Diff complet
   - Commandes prêtes à coller : `git apply <patch>` + `git push origin main`
   - Verdict advisor inline
3. `PushNotification` : `"Cardinal fix prêt, ta validation. Voir <file>"`.
4. **NE PUSH PAS** — Omar décide entre deux ateliers.

### Path LOURD (queue night)

**Escalade vers LOURD dans 4 cas** :
- Critères matrice 2×2 (>1 fichier, >30 lignes, OU schema SQL).
- L'agent **ne parvient pas à reproduire** le bug en local après 5 min — escalade systématique pour éviter un fix "à l'aveugle".
- Un gate (typecheck/lint/build) fail sur le diff candidat → escalade.
- L'eic-advisor renvoie verdict BLOCK sur diff cardinal candidat.

Actions :

1. Écrit `.planning/quick/night-queue/JX-HHhMM-<slug>.md` avec :
   - Context du bug
   - Repro steps
   - Diff esquissé (suggestion, pas applicable directement)
   - Files touched
   - Advisor notes si cardinal
2. `PushNotification` si HARD seulement (sinon silent — Omar voit la queue le soir).
3. **PAS DE TOUCHE AU CODE**.

### Format report agent

`.planning/pilot-alerts/JX-HHhMM-hotfix-prep.md` exemple LÉGER auto-fixé :

```markdown
# J1 · 11h17 · HOTFIX-PREP · LÉGER non-cardinal · ✅ PUSHED

## Trigger
TypeError sur POST /onboarding (5x sur 15 min) — voir J1-11h15-tick.md

## Classification
- Fichier touché : `app/actions.ts` (1 fichier, 4 lignes modifiées)
- Cardinal R1/R2/R3 : non
- Verdict : LÉGER non-cardinal → auto-fix activé

## Diff appliqué
\`\`\`diff
- if (parsed.data.level === "L0") {
+ if (parsed.data?.level === "L0") {
\`\`\`

## Gates passés
- typecheck : ✅
- lint : ✅
- build : ✅ (4.2s)
- push origin main : ✅ commit 8a3f2c1
- Vercel redeploy : ✅ (90s wait + curl 200)

## Verdict
Bug fixé. Watcher continuera le monitoring tick suivant.
```

## 6. Permissions bypass — patch `.claude/settings.local.json` (J1/J2 uniquement)

Patch à appliquer **le 13/05 vers 07h45** avant lancement du watcher, à revert le **14/05 ~18h30**.

```jsonc
{
  "permissions": {
    "allow": [
      // --- Watcher (lecture seule monitoring) ---
      "Bash(curl -s*:*entrepreneur-game-six.vercel.app/*)",
      "Bash(curl -sf*:*entrepreneur-game-six.vercel.app/*)",
      "Bash(curl -sI*:*entrepreneur-game-six.vercel.app/*)",
      "mcp__claude_ai_Vercel__get_runtime_logs",
      "mcp__claude_ai_Vercel__get_deployment_build_logs",
      "mcp__claude_ai_Vercel__get_deployment",
      "mcp__claude_ai_Vercel__list_deployments",
      "mcp__plugin_supabase_supabase__get_logs",
      "mcp__plugin_supabase_supabase__get_advisors",
      "mcp__plugin_supabase_supabase__execute_sql",
      "Write(.planning/pilot-alerts/**)",
      "Write(.planning/quick/night-queue/**)",

      // --- Hotfix-prepper (auto-fix sur main) ---
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git branch*)",
      "Bash(git stash*)",
      "Bash(git checkout main*)",
      "Bash(git pull origin main*)",
      "Bash(git add*)",
      "Bash(git commit -m*)",
      "Bash(git push origin main*)",
      "Bash(npm run typecheck*)",
      "Bash(npm run lint*)",
      "Bash(npm run build*)",
      "Bash(sleep *)",
      "Edit(app/**)",
      "Edit(components/**)",
      "Edit(lib/**)",
      "Edit(utils/**)",
      "Edit(middleware.ts)",
      "Write(.planning/pilot-alerts/**)",

      // --- PushNotification ---
      "PushNotification"
    ],
    "deny": [
      // Garde-fous absolus
      "Bash(git push --force*)",
      "Bash(git reset --hard*)",
      "Bash(rm -rf*)",
      "Bash(git checkout --*)",
      "Edit(database/**)",
      "Edit(.env*)",
      "Edit(vercel.json)",
      "Edit(CLAUDE.md)"
    ]
  }
}
```

**Revert post-pilote (14/05 ~18h30)** : `git checkout HEAD -- .claude/settings.local.json` (le patch sera commité séparément avec tag `pilot-bypass-J1J2`).

## 7. Commandes start/stop

### J1 (13/05)

Pré-flight 07h45–08h00 :
```bash
git checkout main && git pull origin main
git status                                        # working tree clean
npm run typecheck && npm run lint && npm run build
curl -sf https://entrepreneur-game-six.vercel.app/ > /dev/null && echo "PROD UP"
git tag --list | grep v0.2-pilot-ready            # rollback dispo
# Appliquer le patch settings.local.json
```

Lancement :
```
/loop 15m use pilot-health-watcher subagent to run J1 health tick
```

Arrêt fin J1 (~18h30) :
```
/loop cancel
```

Soir 13/05 → matin 14/05 — Omar :
1. Liste `.planning/quick/night-queue/J1-*.md`
2. Traite chaque item manuellement (Edit + commit + push, ou /gsd-quick si gros)
3. Smoke `npm run typecheck && npm run lint && npm run build`
4. Tag `v0.2.1-pre-J2` localement + push tag
5. Au dodo

### J2 (14/05)

Pré-flight 07h45–08h00 (idem J1 + s'assurer que les fixes nuit sont déployés sur Vercel).

Lancement :
```
/loop 15m use pilot-health-watcher subagent to run J2 health tick
```

Arrêt fin J2 (~18h30) :
```
/loop cancel
```

Soir 14/05 :
- Revert patch settings : `git checkout HEAD -- .claude/settings.local.json`
- Archive `.planning/pilot-alerts/` dans `.planning/milestones/v0.2-pilot-J1J2-alerts/`
- Post-mortem

## 8. Risques et garde-fous

| Risque | Mitigation |
|---|---|
| Faux positif HARD → push d'un fix cassé | 3 gates (typecheck/lint/build) AVANT commit, smoke curl APRÈS push. Si rouge → l'agent rollback `git revert HEAD` automatique et ping HARD. |
| Auto-fix sur zone cardinale | Liste explicite des paths cardinaux dans `pilot-hotfix-prepper.md`. Tout edit cardinal → eic-advisor obligatoire → diff+ping (jamais auto-push). |
| Loop crash entre deux ticks | Pas critique — les ticks sont indépendants. Omar relance `/loop` si silence >30 min. Fallback `/schedule` disponible. |
| Token budget explose | Tick VERT = très court (~500 tokens). Tick HARD spawn hotfix-prepper = quelques k tokens. J1 attendu : 32 ticks × ~1k token avg = ~32k tokens (négligeable). |
| Quelqu'un d'autre push sur main pendant un auto-fix | Très peu probable (Omar seul dev). Mais l'agent fait `git pull --rebase` avant chaque commit. Si conflit → ABORT + ping HARD. |
| Permission bypass pendant J2 oubli revert | Tâche dans le pilot-debrief checklist 14/05 soir + tag commit `pilot-bypass-J1J2` pour retrouver facilement. |

## 9. Inventaire des artefacts à créer (plan d'implémentation)

1. `.claude/agents/pilot-health-watcher.md` — frontmatter + corps du prompt
2. `.claude/agents/pilot-hotfix-prepper.md` — frontmatter + corps du prompt
3. Patch `.claude/settings.local.json` — allow/deny lists (commit séparé taggué `pilot-bypass-J1J2`)
4. `.planning/pilot-alerts/.gitkeep` — créer le dossier
5. `.planning/quick/night-queue/.gitkeep` — créer le dossier
6. `docs/PILOT-J1J2-RUNBOOK.md` — checklist pré-flight + commandes start/stop pour Omar (réduction du risque cognitif le 13/05 matin)

## 10. Non-objectifs

- Pas de dashboard web ni de UI custom — tout passe par fichiers markdown et PushNotification.
- Pas de monitoring R1/R2/R3 visuel automatique (lourd, faux positifs risqués). Si Omar repère un leak score live, il fait un `/gsd-quick` manuel.
- Pas d'intégration externe (Slack, email, Sentry). PushNotification + fichiers suffisent.
- Pas de surveillance applicative côté Player (parcours pédagogique stuck) — humain (GameMasters) le voit en salle.
- Pas de "night fixer" agent — Omar gère la queue de nuit manuellement.

## 11. Critères d'acceptation

Le design est livrable quand :
- [ ] J1 09h00 → premier tick VERT écrit dans `.planning/pilot-alerts/J1-09h00-tick.md`
- [ ] Toutes les 15 min ± 30 sec, un nouveau fichier `J1-HHhMM-tick.md` apparaît
- [ ] Aucun prompt permission n'interrompt Omar entre 08h00 et 18h30
- [ ] Si un 5xx est injecté en test pré-pilote (curl HEAD vers route inexistante), le watcher détecte au tick suivant et spawn le hotfix-prepper
- [ ] Hotfix-prepper testé sur un faux bug léger non-cardinal en pré-flight → commit + push sur main réussit sans intervention humaine
- [ ] `/loop cancel` arrête proprement le watcher

## 12. Décisions actées en session

| # | Décision | Raison |
|---|---|---|
| D1 | Priorité = santé technique | Choix explicite Omar — autres dimensions couvertes humainement |
| D2 | Auto-fix activé pour LÉGER non-cardinal | "auto-fix et si heavy work leave for night" — Omar |
| D3 | LOURD reporté à la nuit, traité par Omar manuellement | "leave for night" + pas de night-fixer agent |
| D4 | Cadence 15 min (loop dynamique) | "check en continue live if not possible each 15 min" — Omar |
| D5 | Notification = PushNotification + fichier | "Les deux (push + fichier)" — Omar |
| D6 | Bypass permissions ciblé via settings.local.json | "make sure that for fix activated bypass permissions is" — Omar |
| D7 | Travail systématique sur `main` (pas de worktree) | "and that he work on main" — Omar |
| D8 | Pas de night-fixer agent | Omar gère la queue lui-même |
