# Pilot J1/J2 Runbook — AgreenTech 13-14 mai 2026

> **Pour Omar le matin du 13/05 et du 14/05.** Garder cet onglet ouvert. Les commandes sont prêtes à copier-coller dans Claude Code.

## J1 — Mardi 13 mai 2026

### Pré-flight 7h45 → 8h25 (40 min de marge)

Ouvre un terminal dans `C:\Users\omara\Desktop\EntrepreneurGame`. Vérifie d'abord que tu es sur `main` à jour :

```bash
git checkout main
git pull origin main
git status                  # working tree clean attendu
```

Lance la batterie de gates locaux + smoke prod :

```bash
npm run typecheck && npm run lint && npm run build
curl -sf https://entrepreneur-game-six.vercel.app/ > /dev/null && echo "PROD UP ✅"
git tag --list | grep v0.2-pilot-ready    # rollback dispo
```

Si **tout vert**, vérifie les agents sont présents :

```bash
ls .claude/agents/pilot-*.md
# Doit lister :
#   pilot-health-watcher.md
#   pilot-hotfix-prepper.md
```

Vérifie que les dossiers d'alerte existent :

```bash
ls -la .planning/pilot-alerts/ .planning/quick/night-queue/
```

### Lancement à 8h30

Ouvre Claude Code (CLI ou IDE). Dans le prompt, colle **exactement** :

```
/loop 15m use pilot-health-watcher subagent to run J1 health tick
```

À partir de là, toutes les 15 min un nouveau fichier apparaît dans `.planning/pilot-alerts/` :
- `J1-08h30-tick.md` puis `J1-08h45-tick.md` puis ...
- VERT = silencieux (juste le fichier).
- WARN = fichier seul, à scanner entre 2 ateliers.
- HARD = PushNotification + spawn pilot-hotfix-prepper en background → un fichier `J1-HHhMM-hotfix-prep.md` apparaît ~2 min après.

### Pendant la journée

**Si tu reçois une PushNotification HARD** :
1. Ouvre le tick file le plus récent (`.planning/pilot-alerts/J1-HHhMM-tick.md`).
2. Attends ~2 min, ouvre le hotfix-prep file (`J1-HHhMM-hotfix-prep.md`).
3. Selon le verdict :
   - ✅ **PUSHED** → le bug est fixé en autonomie. Lis le diff pour info, retourne animer.
   - ⏸️ **ATTEND OMAR** → diff cardinal prêt, à valider. Ouvre `J1-HHhMM-needs-omar-greenlight.md`, vérifie l'advisor verdict, copie-colle les commandes prêtes si OK.
   - 📋 **QUEUED NIGHT** → traitement ce soir, retourne animer.
   - ❌ **ABORT** → le prepper n'a pas pu fixer, intervention manuelle requise. Lis le report pour comprendre.

**Si tu vois 2 PushNotifications HARD consécutives sans résolution** : signal d'un problème systémique. Considère un rollback :
```bash
git revert HEAD --no-edit && git push origin main   # rollback du dernier commit
# OU pour rollback complet au tag pilot-ready :
git reset --hard v0.2-pilot-ready                    # ⚠️ destructif local
git push origin main --force-with-lease              # ⚠️ destructif remote
```
Le rollback "nucléaire" exige `--force-with-lease` qui n'est PAS dans l'allowlist — Claude Code te demandera permission avant de l'exécuter.

### Fin de J1 (~18h30)

Dans Claude Code :
```
/loop cancel
```

Puis traitement de la night queue :
```bash
ls .planning/quick/night-queue/J1-*.md
```

Pour chaque fichier (par ordre de priorité HARD > MEDIUM > LOW) :
- Lis le report.
- Si simple, applique le diff esquissé manuellement (Edit + commit + push).
- Si complexe, lance `/gsd-quick` sur le slug.

Avant d'aller dormir, smoke final :
```bash
npm run typecheck && npm run lint && npm run build
git tag v0.2.1-pre-J2 && git push origin v0.2.1-pre-J2
curl -sf https://entrepreneur-game-six.vercel.app/ > /dev/null && echo "PROD UP for J2 ✅"
```

## J2 — Mercredi 14 mai 2026

Idem J1, sauf :

### Pré-flight 7h45 → 8h25

```bash
git checkout main
git pull origin main
git log --oneline v0.2.1-pre-J2..HEAD    # liste des fixes appliqués cette nuit
npm run typecheck && npm run lint && npm run build
curl -sf https://entrepreneur-game-six.vercel.app/ > /dev/null && echo "PROD UP ✅"
```

### Lancement à 8h30

```
/loop 15m use pilot-health-watcher subagent to run J2 health tick
```

### Fin de J2 (~18h30) — debrief

```
/loop cancel
```

**Revert du patch settings (important !)** :
```bash
git checkout HEAD -- .claude/settings.local.json
# Ou si tu veux garder la version pilote pour archive :
git log --oneline --grep "pilot-bypass" -1
```

**Archive des alertes** :
```bash
mkdir -p .planning/milestones/v0.2-pilot-J1J2-alerts
mv .planning/pilot-alerts/* .planning/milestones/v0.2-pilot-J1J2-alerts/
mv .planning/quick/night-queue/* .planning/milestones/v0.2-pilot-J1J2-alerts/night-queue/ 2>/dev/null || true
git add .planning/milestones/v0.2-pilot-J1J2-alerts/
git commit -m "archive(pilot): J1/J2 alerts + night queue"
git push origin main
```

## Garde-fous mentaux

| Situation | Reflex |
|---|---|
| PushNotification HARD pendant que tu animes | Termine ton atelier en cours (≤5 min). Ne regarde pas le téléphone en plein discours. |
| Hotfix-prepper te demande validation cardinal | Lis l'advisor verdict EN PREMIER. Si advisor BLOCK, ignore le diff. |
| Tu ne comprends pas le diff proposé | NE PUSH PAS. Mets en attente, regarde plus tard. La queue night a une option pour ça. |
| Le watcher se tait depuis >30 min | `/loop status` pour vérifier qu'il tourne. Si crashé, `/loop 15m use pilot-health-watcher subagent to run J1 health tick` relance. |
| Vercel est down (pas le code) | Hors scope du watcher. Vérifie status.vercel.com, c'est temporaire. |
| Tu veux pause le monitoring (pause déj) | `/loop cancel` puis relance après. Pas de honte. |

## Tag rollback

Disponible en local + remote : `v0.2-pilot-ready` (commit `ccdc2bc`).
Reset local : `git reset --hard v0.2-pilot-ready` (destructif).
Reset remote : nécessite `git push --force-with-lease origin main` (Claude Code te demandera permission — c'est volontaire).

## Contacts d'urgence (non technique)

- 🙋 Toi (Omar) — animation salle
- 📧 Liste partenaires Tamwilcom / Bank of Africa / Innov Invest / Bluespace → tableau workshop séparé
- 📞 Support Vercel (status page only, pas de hotline)
- 📞 Support Supabase (status page only)
