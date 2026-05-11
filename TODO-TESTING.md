# TODO Testing pré-pilote AgreenTech (13-14 mai 2026)

**Merge main** : `1159edc` (Ralph branch ralph/pre-pilot-phases-13-14 mergée 2026-05-11).
**Vercel deploy** : auto sur push main, vérifier https://entrepreneur-game-six.vercel.app après ~2 min.
**Cutoff exécution** : avant 13/05 8h30 (idéalement 12/05 dans la journée pour buffer).

---

## ✅ Pré-requis : apply migration Phase 14 en PROD Supabase

**Critique avant tout test** — sans cette migration, `players.score_engagement` reste à 0 et les badges Phase 14 ne se mettent pas à jour.

Option A — Cloud Studio SQL Editor :
1. Ouvrir https://supabase.com/dashboard/project/vzzbjxmfkmvqkaqxalhr/sql/new
2. Copier-coller le contenu de `database/migrations/202605110007_phase14_engagement_trigger.sql`
3. Exécuter (RUN).
4. Vérifier : query `select id, score_engagement from public.players limit 5` → valeurs reflétant l'historique des submissions/évaluations existantes (backfill idempotent inclus).

Option B — Supabase CLI :
```bash
supabase db push --db-url $SUPABASE_DB_URL
```

---

## 🧪 Tests prioritaires (~40 min total)

### Test 1 — Mentor flow E2E (15 min) — sub-task 13-01

**Compte** : `mentor1.agreentech@smoke.entrepreneurgame.local` / `Agreen2026!M01`

- [ ] Login M01 PROD
- [ ] Naviguer `/mentor` → vérifier liste 27 submissions P01/P02/P04
- [ ] Évaluer **submission 1** : P01 L1.1
  - [ ] Rubric 5 critères × 5 pts = 25
  - [ ] Feedback texte 3-4 lignes
  - [ ] Verdict `validate_v1`
  - [ ] Soumettre
- [ ] Évaluer **submission 2** : P02 L2.1 (ou autre)
  - [ ] Rubric mixte (ex: 4+3+5+4+3 = 19)
  - [ ] Verdict `request_v2`
  - [ ] Soumettre
- [ ] Logout, login P01 (`tadarti2004@gmail.com` / `Agreen2026!P01`)
- [ ] Naviguer `/journey/deliverable/[id]` validate_v1
  - [ ] **Attendu** : badges **Soumis ✓ + Lu par le mentor ✓ + Validé ✓** (couleurs reached EIC navy/rouge/vert)
  - [ ] Pas de chiffre, pas de note quality visible
- [ ] Logout, login P02
- [ ] Naviguer `/journey/deliverable/[id]` request_v2
  - [ ] **Attendu** : badges **Soumis ✓ + Lu par le mentor ✓** (Validé reste pending muted)
  - [ ] RevisionPanel actif avec checklist + bouton "Soumettre V2"

### Test 2 — Jury + publication (10 min) — sub-task 13-02

**Compte GM** : `o.ameur@ueuromed.org` / `Agreen2026!G01`

- [ ] Login G01 PROD
- [ ] Naviguer `/jury`
- [ ] Soumettre pitch_score P01 (5 critères 3-5)
- [ ] Soumettre pitch_score P02 (scores différents)
- [ ] Cloud Studio SQL :
  ```sql
  update public.events
     set results_published_at = now()
   where ends_at > now()
   returning id, name, results_published_at;
  ```
- [ ] Recharger `/results` côté GM → table complète (rank, pitchAvg, scoreProject, combined, **Engagement**)
- [ ] Logout, login P01
- [ ] Naviguer `/results` côté Player
  - [ ] **Attendu** : annonce qualitative EIC-validated (R1)
  - [ ] **Aucun** chiffre, **aucun** rang, **aucune** table de scores
- [ ] Optionnel : `update public.events set results_published_at = null where id = '<id>'` pour ne pas polluer le pilote

### Test 3 — Porteurs swarm (15 min sériel ou 5 min parallèle) — sub-task 13-03

**Pré-requis swarm parallèle** : Claude Code redémarré avec `.mcp.json --isolated`.

- [ ] Spawn 3 instances `porteur-projet-agreentech` parallèle :
  - [ ] P03 Fès argan : `Agreen2026!P03`
  - [ ] P05 El Hajeb compostage : `Agreen2026!P05`
  - [ ] P09 Agadir aquaponie : `Agreen2026!P09`
- [ ] Chaque agent : login → onboarding 3 étapes → 9 livrables L1..L6 + Bonus B
- [ ] Login GM → `/admin` cohort → vérifier 3 porteurs avec submissions actives
- [ ] Pouls cohorte côté Player doit augmenter (L1..L5)

### Test 4 — Visual /admin radar dashed (5 min)

- [ ] Login GM PROD
- [ ] Naviguer `/admin?live=1` avec ≥2 teams `state=active` simultanées
- [ ] **Attendu** : lignes en pointillés (dashed) entre les paires d'équipes actives
- [ ] Capturer screenshot `05-admin-radar.png` pour archive

### Test 5 — Mobile 390 (5 min)

- [ ] Chrome DevTools → device iPhone 14 (390×844)
- [ ] Login P01 PROD
- [ ] Naviguer `/landing`
  - [ ] **Attendu** : pas d'overflow horizontal
- [ ] Naviguer `/journey`
  - [ ] **Attendu** : topbar compact (pills info+amber + brand-sub cachés < 420px)
  - [ ] Pas d'overflow horizontal
- [ ] Naviguer `/journey/deliverable/[id]`
  - [ ] **Attendu** : 3 badges engagement responsive

### Test 6 — Phase 14 PROD end-to-end (10 min)

**Vérifier le scoring engagement fonctionne en PROD** :

- [ ] Login GM → `/admin` cohort overview
  - [ ] **Attendu** : nouvelle colonne **Engagement** avec valeurs non-zéro pour porteurs avec submissions
- [ ] Login P01 → `/journey/deliverable/[id]` d'un livrable validé
  - [ ] **Attendu** : 3 badges qualitatifs Soumis ✓ + Lu ✓ + Validé ✓
- [ ] Naviguer un livrable non encore soumis
  - [ ] **Attendu** : 3 badges tous pending (•)

---

## 🏷️ Post-tests : tag + monitoring

- [ ] Tag :
  ```bash
  git tag v0.2.3-phase14-engagement
  git push origin v0.2.3-phase14-engagement
  ```
- [ ] Vérifier déploiement Vercel : https://entrepreneur-game-six.vercel.app
- [ ] Monitoring runtime logs Vercel pendant 30 min post-deploy
- [ ] Vérifier Cloud Studio Supabase : pas d'erreur trigger après quelques submissions tests

---

## 🚨 STOP conditions (interrompre tests + open issue)

- **R1 violé** : note quality numérique mentor ou rang `combined` visible côté Player
- **R2 violé** : validator bloque soumission avec `severity: "error"` au lieu de warn-only
- **R3 violé** : livrable apparaît `disabled` parce qu'un autre n'est pas validé
- **Migration trigger fail** : insert submission ne met pas à jour `score_engagement`
- **Build fail Vercel** : déploiement rouge

---

## Références

- `RALPH-FINAL.md` — récap session Ralph (14 commits, deferred items)
- `.planning/phases/13-smoke-completion-phase11-gates-bug-annexes/SUMMARY.md`
- `.planning/phases/13-smoke-completion-phase11-gates-bug-annexes/WAVE-A-RUNBOOK-OPS.md`
- `.planning/phases/14-scoring-engagement-livrables/SUMMARY.md`
- `.planning/phases/14-scoring-engagement-livrables/ADVISOR-VERDICT-DISCUSS.md`
- `database/migrations/202605110007_phase14_engagement_trigger.sql`
- `scripts/audit-r1.sh` — R1 audit script automatisé
- Comptes GM : voir `GM-CREDS.local.md` (gitignored, créé en local)
- Comptes Players : `cohorte-agreentech-creds.csv` (gitignored)
