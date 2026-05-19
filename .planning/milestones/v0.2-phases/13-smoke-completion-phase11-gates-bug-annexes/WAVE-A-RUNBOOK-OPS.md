# Wave A — Runbook ops manuel pour Omar (13-01 / 13-02 / 13-03)

**Cible** : exécuter les 3 sub-tasks Wave A Phase 13 que Ralph n'a pas pu boucler en session (Playwright MCP disconnect + necessitate creds PROD).
**Estimé total** : ~40 min ops (peut-être moins si parallélisation 13-03).
**Cutoff** : avant 13/05 8h30 (idéalement 12/05 dans la journée).
**Pré-requis** : creds dans `cohorte-agreentech-creds.csv` (gitignored, root repo).

---

## 13-01 — SEED-002 M01 mentor batch (~15 min)

**But** : valider E2E que le flux mentor fonctionne sur PROD : ouvrir une submission, remplir rubric 5×5=25, soumettre verdict, vérifier propagation Player.

**Compte mentor** : `mentor1.agreentech@smoke.entrepreneurgame.local` / `Agreen2026!M01`.

**Étapes** :

1. Ouvrir https://entrepreneur-game-six.vercel.app/login en navigation privée.
2. Login M01.
3. Naviguer `/mentor` → liste des submissions disponibles (P01/P02/P04 = 27 livrables soumis lors smoke T-3 2026-05-10).
4. Cliquer sur ≥2 submissions distinctes parmi les 27 :
   - **Submission 1** : choisir P01 L1.1 → ouvrir `/mentor/submission/[id]` → remplir 5 critères rubric (5 pts chacun = total 25) → ajouter feedback texte (3-4 lignes) → verdict `validate_v1` → soumettre.
   - **Submission 2** : choisir P02 L2.1 ou similaire → rubric mixte (par ex. 4+3+5+4+3 = 19) → feedback → verdict `request_v2` → soumettre.
5. Vérifier sur `/mentor` que les 2 submissions évaluées sont marquées (status changé).
6. **Cross-check Player propagation** :
   - Logout M01.
   - Login P01 (`tadarti2004@gmail.com` / `Agreen2026!P01`).
   - Naviguer `/journey/deliverable/[id]` de la submission évaluée validate_v1.
   - **Attendu** : badges Phase 14 affichent **Soumis ✓ + Lu par le mentor ✓ + Validé ✓** (couleurs reached EIC navy/rouge/vert). Status submission = "validated". Feedback texte visible.
   - Logout, login P02.
   - Naviguer `/journey/deliverable/[id]` de la submission évaluée request_v2.
   - **Attendu** : badges **Soumis ✓ + Lu par le mentor ✓** (Validé reste pending muted). Status = "feedback_received". RevisionPanel actif avec checklist + bouton "Soumettre V2".
7. **R1 check sur le passage** : aucune note numérique mentor visible côté Player (le composant `SubmissionFeedbackCard` était dead code et a été supprimé en `8f17b13`, le rendu se fait via `RevisionPanel` qui ne montre que verdict + feedback texte + expectedAction).

**Acceptance** : 2 submissions évaluées, propagation Player visible (badges Phase 14 + feedback texte), R1 strict respecté.

---

## 13-02 — G01 jury pitch_score + publication (~10 min)

**But** : valider E2E flux jury + publication results + cross-check R1 podium (Player annonce qualitative vs GM scores numériques).

**Compte GM** : `o.ameur@ueuromed.org` / `Agreen2026!G01`.

**Étapes** :

1. Login G01 sur https://entrepreneur-game-six.vercel.app/login.
2. Naviguer `/jury`.
3. Soumettre 1-2 pitch_scores test :
   - Sélectionner P01 → 5 critères pitch (clarté, originalité, viabilité, équipe, traction) → noter 3-4-5-3-4 par exemple → bouton "Enregistrer".
   - Idem P02 avec scores différents.
4. **SQL Cloud Studio Supabase** (ou via `supabase` CLI) :
   ```sql
   -- Publier les résultats du seul event actif (assumption : 1 event pilote)
   update public.events
      set results_published_at = now()
    where ends_at > now()  -- événement courant
   returning id, name, results_published_at;
   ```
5. Recharger `/results` côté GM → **attendu** : table complète avec rank, pitchAvg, scoreProject, combined (toutes colonnes numériques visibles puisque `isGm=true`).
6. **R1 cross-check Player** : logout G01, login P01.
   - Naviguer `/results`.
   - **Attendu** : annonce qualitative EIC-validated (cf. fix B1 RETRO 2026-05-10, commits `c740d48` + `16aa0f7` + `5647606`). **Pas** de chiffres, **pas** de rang, **pas** de table de scores.
7. **Optionnel** : revert `events.results_published_at = null` si test, pour ne pas polluer le pilote 13/05. Sinon, garder publié et le pilote utilisera le même event.

**Acceptance** : pitch_scores persistés + publication propagée + R1 podium clean Player vs scores visibles GM.

---

## 13-03 — Porteurs P03/P05/P09 swarm (~15 min sériel, ~5 min parallèle si Claude Code redémarré avec .mcp.json --isolated)

**But** : compléter les 8 porteurs manquants du smoke T-3 (P03/P05/P06/P08/P09/P10/P11) en commençant par les 3 critiques P03+P05+P09 (3 villes-clés Maroc).

**Stratégie A : Claude Code redémarré + MCP isolated**

1. Redémarrer Claude Code (close + reopen) pour activer `.mcp.json --isolated` (cf. memory `feedback_playwright_mcp_swarm_restart.md`).
2. Spawn 3 instances `porteur-projet-agreentech` en parallèle :
   - P03 Fès argan : `omarbakkali2003@gmail.com` / `Agreen2026!P03` (idée seed argan/cosmétique-bio).
   - P05 El Hajeb compostage : `<email P05>` / `Agreen2026!P05` (compostage déchets agricoles).
   - P09 Agadir aquaponie : `<email P09>` / `Agreen2026!P09` (aquaponie tomates+poissons).
3. Chaque agent : login → onboarding 3 étapes → 9 livrables L1..L6 + Bonus B générés cohérents avec idea_seed et ville.
4. Vérifier dans `/admin` (login GM G01) que les 3 porteurs apparaissent avec submissions actives.

**Stratégie B : sériel manuel par Omar (~25 min)**

Si pas le temps de redémarrer Claude Code, Omar peut exécuter en manuel pour 1-2 porteurs (P03 + P09 idéalement, 2 villes différentes) en suivant le même schéma porteur-projet-agreentech (cf. `.claude/agents/porteur-projet-agreentech.md` pour le scénario complet).

**Acceptance** : ≥2 porteurs supplémentaires (P03 + P09 minimum) avec 9 livrables AgreenTech soumis et propagation Pouls cohorte visible côté Player (Pouls L1..L5 doit augmenter).

---

## Post-Wave A : tag + smoke final

Après les 3 sub-tasks Wave A + apply migration Phase 14 (cf. `RALPH-FINAL.md` §"Procédure d'application PROD") :

1. Smoke final consolidé : login P01 → `/journey/deliverable/[id]` → badges Phase 14 visibles + R1 clean. Login G01 → `/admin` cohort → colonne Engagement non zéro.
2. Tag :
   ```bash
   git tag v0.2.3-phase14-engagement
   git push origin v0.2.3-phase14-engagement
   ```
3. Merge `ralph/pre-pilot-phases-13-14` → `main` (review puis merge classique).
4. Vercel deploy automatique. Vérifier https://entrepreneur-game-six.vercel.app/admin colonne Engagement présente.

---

## Notes

- **R1 obligatoire** à chaque étape : si jamais un chiffre note quality (mentor totalScore, ranking combined) apparaît côté Player, **STOP** et open issue. Ne pas commencer le pilote sans correction.
- **R2 warn-only** : si un validator déclenche une erreur bloquante au lieu d'un warn, idem STOP. Le mentor doit toujours pouvoir soumettre verdict même si rubric incomplète (le validator doit warn, pas error).
- **R3 zéro blocage inter-mission** : si un livrable apparaît `disabled` parce qu'un autre livrable n'est pas validé → STOP. Tous les livrables doivent rester accessibles (UI hint amber `eic-locked-hint--amber` est OK, blocage DOM hard non).

**Estimated total ops Omar** : 40 min (15+10+15) si stratégie A. 30 min si stratégie B (sériel manuel 1-2 porteurs).
