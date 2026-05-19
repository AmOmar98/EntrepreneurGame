# SMOKE PROD J-1 — Digi-Hackathon

**Date** : 2026-05-19 21h00–21h20 UTC (J-1 Digi-Hackathon 20-22 mai)
**Cible** : https://entrepreneur-game-six.vercel.app (région cdg1)
**Mode** : Playwright MCP, un seul navigateur, un user à la fois (login/logout entre rôles)
**Rôles joués** : Player P01 Simock, Mentor M01 Pr. Abebaw, Jury J01, GameMaster (`o.ameur@ueuromed.org`)

## Verdict global

| Severité | Count | Bloque pilote demain ? |
|---|---|---|
| **HARD** | 4 | OUI — 1 vrai bug RLS auto-eval + 3 wording obsolète/UX |
| **WARN** | 6 | NON — UX/sémantique à clarifier |
| **VERT** | 7 | — propagation MSU, bulk paste, hard-block L2, eval mentor, export CSV |

**Recommandation** : un fix RLS sur table `evaluations` est nécessaire avant J1 si l'auto-validation server-side est censée fonctionner (commit `afa7991`). Sinon le mentor verra le formulaire d'évaluation manuel des 10 fiches × 25 (250 max) pour CHAQUE livrable `fiches-entretien-v1` soumis demain, ce qui **détruit le bénéfice pédagogique** du livrable bulk-pasteable auto-validé.

## Findings HARD

### H1 — RLS policy bloque l'auto-evaluation de `fiches-entretien-v1` 🔴 **BLOCKER**

**Évidence** :
- Alert UI lors de submission Player : `"Submission OK, eval failed: new row violates row-level security policy for table 'evaluations'"`
- Confirmation SQL :
  ```
  submission_id 0b5f2e4e... | slug fiches-entretien-v1 | status validated | eval_id NULL | verdict NULL
  ```
- Mentor view sur cette submission affiche le **formulaire d'évaluation manuel complet** (10 critères × 25 = 250 pts max) au lieu du readonly auto-validation summary attendu (commit `afa7991`).

**Mécanisme** :
- Submission server-action insère bien dans `submissions` (status=`validated`)
- L'auto-insert dans `evaluations` est rejeté par RLS (probablement `evaluations` n'autorise pas le user.role `player` ou la role d'auto-eval ne match pas)
- Le UI mentor n'a pas de fallback "auto-validated sans eval row" → tombe sur le composer manuel

**Impact pilote** : 10 équipes × `fiches-entretien-v1` × possibilité de 10 fiches × 25 pts par critère = chaos d'évaluation manuelle pour les mentors. La pédagogie "10 entretiens terrain auto-validés" ne fonctionne pas.

**Screenshots** :
- `screenshots/07-HARD-rls-eval-failed.png` (alert UI)
- `screenshots/09-HARD-mentor-fiches-no-readonly-summary.png` (rendu mentor)

**Fix probable** : RLS policy sur `evaluations` doit autoriser l'auto-insert via service-role ou via une fonction security-definer appelée par le server-action de submission `fiches-entretien-v1`.

### H2 — Wording "AgreenTech" / "Welcome Guide AgreenTech" sur PROD Digi-Hackathon 🟠 **CRÉDIBILITÉ**

**Évidence** :
- `/journey` Player : `"Welcome Guide AgreenTech — brief porteur, regles du bootcamp, checklist 13-14 mai."`
- `/admin` GM : header `"EIC · UEMF · Régie AgreenTech"`
- URL OneDrive du Welcome Guide pointe vers le PDF AgreenTech (`/IQBNWS9VBk5URrInYsRtb5bSAcTs572O6KbUkFUo5a_tX08`)

**Impact pilote** : porteurs et partenaires (Tamwilcom, BoA Academy, Innov Invest, Bluespace) voient l'événement précédent affiché en J1. CLAUDE.md §Constraints stipule explicitement "aucune mention « démo » apparente, aucun seed ne doit fuiter".

**Fix** : remplacer copy par `"Welcome Guide Digi-Hackathon"` + dates 20-22 mai + nouveau lien PDF si disponible. Sinon enlever le badge.

**Screenshots** : `01-player-journey-index.png`, `11-gm-admin-cockpit.png`

### H3 — Login `o.ameur98@gmail.com` ne fonctionne pas 🟡

**Évidence** : test-credentials.md L37 indique `omar.ameur98@gmail.com / EICGame2026!HackDays` comme login GM ; PROD répond `Invalid login credentials`. Le compte GM fonctionnel est `o.ameur@ueuromed.org / Agreen2026!G01` (cohorte-agreentech-creds.csv L24).

**Impact pilote** : aucun (le bon compte fonctionne). Mais la doc `test-credentials.md` est obsolète, risque de confusion au prochain smoke.

**Fix** : mettre à jour `tests/fixtures/test-credentials.md` avec les vraies creds Digi-Hackathon GM.

### H4 — Vue Mentor : tous les mentors voient les 10 équipes 🟡

**Évidence** : M01 Pr. Abebaw connecté voit la table de toutes les 10 équipes (AddictLess, Bla Dwa, FokusMind…). Le brief login dit `"Trois équipes t'attendent."`

**Impact pilote** : si l'assignment mentor↔équipes n'est pas configuré, les mentors devront se coordonner manuellement pour ne pas double-évaluer. Avec 5 mentors × 10 équipes c'est gérable mais brouille la responsabilité.

**À clarifier** : assignment volontairement absent ou bug RLS / config manquante ? Si voulu, ajuster le copy "Trois équipes" → "Toutes les équipes".

## Findings WARN

| ID | Description | Évidence | Fix |
|---|---|---|---|
| W1 | Description M1 `persona-v1` hardcodée "santé mentale ado/jeune" — étroit pour P02 Graph-Anomal / P04 AddictLess / P05 NAFAS / P10 Bla Dwa si projets hors mental health | snapshot `/journey/deliverable/cbf79d02...` | vérifier que tous les 10 projets sont santé mentale (sinon généraliser seed) |
| W2 | Typo "Q1 demotion 2026-05-19" au lieu de "promotion" dans bonus DT M1 | `02-player-m1-submitted.png` et journey card | corriger seed `bonus_design_thinking` |
| W3 | Référence "Livrable 02/8 Welcome Guide" alors que PROD a 7 missions (PDF désync) | tous les livrables | déjà connu (memory `project_digi_hackathon_13_deliverables`) — Omar gère hors-code |
| W4 | Mascotte affiche `Pixel · L4` dans le menu Player — peut être interprété comme niveau Player (≠ niveau mascotte) | snapshot menu hamburger | clarifier ou enlever |
| W5 | Login Jury redirige sur `/mentor` au lieu de `/jury` | flow Task #5 | redirect `/jury` si role=`reviewer` |
| W6 | Pas de bouton "Jury" sur `/landing` — accès URL seulement | snapshot landing | ajouter card Jury (cf. brief 3 jurys) |

## Findings VERT

| ID | Constat |
|---|---|
| V1 | **R1 audit `/results` OK** : "Resultats a venir. Le classement sera publie par le GameMaster a la fin du jour 2." — aucun score/rang Player. |
| V2 | **R1 audit `/journey` OK** : aucun score/note Player. "PROGRESSION . XP" est XP cumulé (gamification, autorisé). |
| V3 | **R3 exception L2 hard-block OK** : avant validation mentor `prep-questions-v1`, fiches-entretien composer affiche 10 inputs `[disabled]` + bouton `"Préparation 2A requise" [disabled]` + status banner "Préparation 2A à valider…". |
| V4 | **MSU RLS fix `f9939b4` OK** : après verdict mentor `validate_v1` sur prep-questions, le composer fiches-entretien est débloqué (10 inputs enabled). Propagation status submission fonctionne. |
| V5 | **Bulk paste UX `247c77e` OK** : 10 URLs collées en bloc → "10/10 URLs réparties." + répartition dans les 10 inputs + bouton submit activé. |
| V6 | **Eval mentor OK** : rubric 3 critères (8+10+7=25) + verdict `validate_v1` + feedback texte + lien mailto "Demander revision GameMaster" généré correctement. |
| V7 | **Export CSV GM OK** : `/admin/export/players.csv` télécharge 10 lignes propres avec `current_level, score_project, submissions_count, validated_count`. Simock Player avec activité = `4 / 2 / score_project=20 / score_engagement=475`. |

## Audit cardinal rules (CLAUDE.md)

| Règle | Verdict | Détail |
|---|---|---|
| **R1** (score visible Player UNIQUEMENT sur détail livrable) | ✅ **OK** | `/journey`, `/results`, menu = pas de score. Détail livrable affiche "+25 XP" / "+100 XP" — c'est gain XP, pas note. Mentor/GM voient "Score Projet" partout (autorisé). |
| **R2** (validators warn-only) | ✅ **OK** | Aucune erreur bloquante côté validators rencontrée. Bulk paste warning "10/10 URLs réparties" = positif. |
| **R3** (pas de blocage inter-mission codé en dur — exception L2) | ✅ **OK** | Exception L2 `prep-questions-v1` → `fiches-entretien-v1` fonctionne (hard-block visuel + DOM disabled + bouton). Aucune autre transition de niveau bloquée DOM-side. Boutons niveaux supérieurs `[disabled]` sont navigation, pas composer. |

## Données injectées en PROD (à nettoyer si nécessaire)

- Submissions P01 Simock : 4 livrables soumis avec URLs `https://test-smoke-j1.example.com/*`
  - `persona-v1` (submission `b4666faf...`, status `submitted_v1`, eval none)
  - `design-thinking-v1` bonus (submission `b2de50dc...`, status `submitted_v1`, eval none)
  - `prep-questions-v1` (submission `26a8c058...`, status `validated`, eval `c426ec9f...` verdict `validate_v1` total 20)
  - `fiches-entretien-v1` (submission `0b5f2e4e...`, status `validated`, **eval NULL** — bug H1)
- Score Projet Simock = 20 (de l'eval prep-questions)
- Engagement Simock = 475 XP

**Nettoyage SQL** (optionnel, à exécuter avant J1 si Omar veut PROD propre) :
```sql
delete from evaluations where submission_id in (
  select id from submissions where lien_url like 'https://test-smoke-j1.example.com%'
);
delete from submissions where lien_url like 'https://test-smoke-j1.example.com%';
-- Reset progression Simock manuellement si nécessaire
```

## Screenshots disponibles

```
screenshots/01-player-journey-index.png         — /journey P01 fresh
screenshots/02-player-m1-submitted.png          — détail M1 post-submit
screenshots/03-player-results-r1-audit.png      — /results R1 audit OK
screenshots/04-player-fiches-hard-block.png     — L2 hard-block confirmé
screenshots/05-mentor-eval-saved.png            — eval prep-questions enregistrée
screenshots/06-player-bulk-paste-filled.png     — 10/10 URLs réparties
screenshots/07-HARD-rls-eval-failed.png         — HARD H1 alert RLS
screenshots/08-player-journey-after-fiches.png  — /journey progression 470 XP
screenshots/09-HARD-mentor-fiches-no-readonly-summary.png — HARD H1 rendu mentor
screenshots/10-jury-dashboard.png               — espace jury 10 équipes
screenshots/11-gm-admin-cockpit.png             — admin GM AgreenTech wording
players-export.csv                              — export CSV GM (10 lignes)
```

## Prochaines actions recommandées (avant J1 demain 9h00)

1. **PRIORITÉ 1 — Fix RLS H1** : décider si on (a) corrige la policy `evaluations` pour autoriser l'auto-insert depuis submission server-action `fiches-entretien-v1`, ou (b) on accepte le fallback formulaire manuel mentor et on brief les 5 mentors là-dessus.
2. **PRIORITÉ 2 — Wording H2** : remplacer "AgreenTech" par "Digi-Hackathon" dans (a) Welcome Guide banner `/journey`, (b) header `/admin` "Régie AgreenTech". Quick fix copy.
3. **PRIORITÉ 3 — Nettoyage PROD** : delete des 4 submissions test Simock + reset progression P01 si visibilité demain.
4. **OPTIONNEL — Tag pré-événement** : `git tag v0.3-pre-digi-hackathon && git push --tags` pour rollback chirurgical.
5. **OPTIONNEL — Snapshot DB Supabase** : via dashboard, avant 9h00 demain.

---

**Smoke effectué par** : Claude Code (Opus 4.7) via Playwright MCP, 2026-05-19 21h03–21h20 UTC.
**Durée totale** : ~17 min (vs ~45 min planifiés).
**Tasks GSD** : 7/7 complétées.
