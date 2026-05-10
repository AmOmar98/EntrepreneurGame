# Smoke PROD Option C — 3 porteurs séquentiels (T-3, 2026-05-10)

**Statut** : ✅ harness applicatif validé · ❌ flux mentor non testé · 🟢 GO conditionnel pour 13/05 8h30

**Cible** : `https://entrepreneur-game-six.vercel.app` (Supabase PROD `cohorte-mai-2026`)

**Cohorte** : 11 porteurs provisionnés (`cohorte-agreentech-creds.csv`), 2 mentors, 4 game_masters

**Durée test** : ~2h00 (17h00–19h00 UTC)

---

## Contexte — Bascule swarm parallèle → Option C

Tentative initiale : **swarm 12 agents parallèles** (11 porteurs + 1 mentor) dans un seul message, exploitant `.mcp.json --isolated`.

**Échec** :
- Session Claude Code non redémarrée après ajout de `.mcp.json` → flag `--isolated` non actif côté MCP server runtime
- Tous les agents ont partagé un seul contexte Chrome → contention critique
- Preuve : P07 a vu en console les credentials de P01 (`email: tadarti2004@gmail.com`)
- P07 verdict : **0/9 livrables, 13 min perdues**
- Décision Omar : kill 10 agents restants, bascule **Option C séquentiel**

10 agents stoppés mid-flight (notes de surface) :
- P01 et P09 tentaient des **workarounds Supabase REST API** direct (admin API session token, soumission via REST). Données partielles possibles → reset 12/05 23h les nettoiera.
- 8 autres bloqués sur "Browser is already in use".

---

## Résultats Option C séquentielle (3 porteurs + 0 mentor)

### Synthèse

| Porteur | Ville | Idée | Livrables | Durée | Verdict |
|---|---|---|---|---|---|
| **P01** Adil TADARTI | Casablanca | Capteurs sol IoT irrigation | **9/9** | ~25 min | ✅ |
| **P02** Houenha A.H. Evaeme | Fès | Drone arbres fruitiers | **9/9** | ~17 min | ✅ |
| **P04** Tariq Hmidani | Meknès | Marketplace B2B Saiss | **9/9** | ~17 min | ✅ |
| **TOTAL** | | | **27/27** | ~59 min | ✅ |

### Détail livrables (titres UI confirmés AgreenTech v2)

| Slug DB legacy | Titre UI AgreenTech v2 | XP |
|---|---|---|
| `personae-v1` | Persona AgriTech | 25 |
| `probleme-v1` | Hypothèse VP cible | 25 |
| `esquisse-solution-v1` | Solution & MoSCoW v1 | 25 |
| `fiche-produit-plan-dev-v1` | 3 verbatims terrain agriculteurs | 25 |
| `etude-marche-v1` | MoSCoW prototype agricole | 25 |
| `bmc-v1` | ROI/ha + modèle portage | 25 |
| `couts-previsions-v1` | Coûts agronomiques CAPEX/OPEX/ha | 25 |
| `strategie-commerciale-v1` | Plan acquisition AgriTech | 25 |
| `pitch-deck-v1` | Pitch deck AgriTech | 25 |

**B4 status** : ✅ contenu/titres/rubric AgreenTech v2 actifs en PROD · ⚠️ slugs DB restés legacy (cosmétique non bloquant)

---

## Validation règles cardinales EIC

- ✅ **R1 score-invisible-Player** : 0 score / rang / note visible côté Player sur 27 soumissions, 3 sessions distinctes. Le "0 XP" affiché = XP en attente validation mentor (pas un score).
- ✅ **R3 pas-de-blocage-codé-en-dur** : tooltips ambres "Astuce : completez les niveaux precedents" présents sur niveaux 1-7 verrouillés. P04 confirme `disabled=false` réel — clic fonctionne, navigation possible. Hint pédagogique conforme.
- ⚠️ **R2 warn-only** : non testé (pas d'évaluation mentor effectuée → pas de warn validator déclenché).

---

## Bugs et anomalies

### Bloquants

Aucun bloquant fonctionnel identifié sur le flux porteur.

### À corriger avant 13/05

1. **Bouton "Se déconnecter" `type="submit"`** (`components/app-shell.tsx`) → un selector générique `button[type="submit"]` peut accidentellement déclencher logout. P04 a subi 1 incident (récupéré). Fix : `type="button"` ou hors `<form>`. **2 min, zone non sensible**.

### À investiguer

2. **Erreurs console incohérentes** : P02 a vu 4 erreurs sur `/journey`, P04 a vu 0. Probable état session/timing. Pas de message utilisateur visible.
3. **Pouls cohorte "Diagnostic 0/1"** post-soumission des 9 livrables : ambigu — le L0 Diagnostic onboarding ne compte peut-être pas comme `deliverable_template`, ou mapping seed manquant. SQL diagnostic à faire.

### Infra/harness

4. **Contention Playwright MCP** : `.mcp.json --isolated` ignoré tant que session Claude Code non redémarrée. Bloquant pour tout swarm parallèle.
5. **Processus Chrome zombies** entre runs : P01 a dû kill 7 PIDs au boot. **Fix appliqué P02/P04** : `browser_close()` systématique en fin d'agent.

---

## État PROD Supabase post-test

```
players onboarded     : 3   (P01, P02, P04 — cohort cohorte-mai-2026)
submissions submitted : 27  (3 × 9, status submitted_v1)
evaluations           : 0
xp en attente         : 675 (27 × 25)
xp confirmé           : 0
```

⚠️ **Pollution résiduelle possible** des 2 agents tués mid-flight (P01-parallèle, P09) qui tentaient REST API direct. Reset 12/05 23h00 via `database/_reset_pre_event.sql` les nettoiera.

---

## Tests non couverts

| Flux | Statut | Risque go-live |
|---|---|---|
| Évaluation mentor rubric 5×5=25 | ❌ non testé | 🔴 critique J1 14h |
| Verdict validate_v1 vs request_v2 | ❌ non testé | 🔴 critique J1 14h |
| Pitch + jury (`/jury`) | ❌ non testé | 🟠 J2 |
| Publication résultats (`/results` + `results_published_at`) | ❌ non testé | 🟠 J2 17h |
| Concurrence soumission ↔ éval (run swarm réel) | ❌ non testé | 🟡 (11 PCs séparés J-day) |
| 8 porteurs non couverts | ❌ | 🟡 (idées variées non simulées) |

---

## Verdict T-3

**🟢 Confiance harness applicatif** : flux porteur (login + onboarding 3 étapes + 9 livrables + R1/R3) opérationnel en PROD pour la cible AgreenTech 13/05.

**🔴 Trous critiques restants** :
- Mentor eval flow non simulé en bout-en-bout (rubric 5×5=25 + verdicts) → **action obligatoire avant 13/05**
- Pitch + jury + publication résultats non simulés → action recommandée pré-J2

**Préconisation Omar** : tester manuellement le flux mentor le 11/05 ou 12/05 (login M01 + ouvrir 1-2 submissions des P01/P02/P04 + soumettre eval) avant le reset 12/05 23h00. ~15 min, valide R2 + le storage des comments + la propagation côté Player.

---

## Recommandations prochaine session

1. **Redémarrer Claude Code** → activer `.mcp.json --isolated` → swarm parallèle 11 agents possible (~15-20 min). Permet de couvrir les 8 villes/idées non testées.
2. **Sinon Option C étendue** : enchaîner :
   - M01 mentor batch sur les 27 submissions PROD encore disponibles avant reset 12/05 23h
   - P05 El Hajeb compostage + P09 Agadir aquaponie (couvre 2 villes manquantes : ~35 min)
3. **Fix bouton logout `type="submit"`** : 2 min, hors zone sensible.
4. **SQL diagnostic** Diagnostic L0 0/1 : vérifier `deliverable_templates.level` pour L0_diagnostic.
5. **Documenter restart-Claude-Code prerequisite** dans `docs/SWARM-PROD-RUNBOOK.md` Étape 3 Option A (présent mais à mettre en gras / encadré rouge).

---

## Annexe — Screenshots disponibles

```
screenshots/swarm-P01/   25 screenshots (login → 9 submits → état final)
screenshots/swarm-P02/   ~20 screenshots
screenshots/swarm-P04/   ~20 screenshots
screenshots/swarm-P07/   3 screenshots (login + after-login bref + BLOCKED)
```

---

## Annexe — Agent IDs tués (10)

```
P01-parallèle  a9fbf799cb76d0f18  (workaround REST API tenté)
P02-parallèle  a9abb3afa8c9b86cc
P03            a6bdc22bb5e8a0aba
P04-parallèle  af24db480657989c8
P05            a5c753adbe0df6b39
P06            a07c929475fd6be07
P08            a61f5c8271399e918
P09            a1d2ba5a894b313ba  (workaround REST API tenté — onboarding marked complete)
P10            a5097ecefcd4d2709
P11            a3e0600c143053e7f
M01-parallèle  ab71266d8190df703
```

(P07 `a270213a513561d18` complété naturellement avec verdict KO contention)
