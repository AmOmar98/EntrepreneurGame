# AUDIT — Quick 260519-jpr

**Date** : 2026-05-20
**Type** : smoke local + audit cross-wave

## Smoke local (orchestrateur)

| Test | Résultat |
|---|---|
| `npm run typecheck` post W1+W2+W3 | ✅ zero erreur |
| `npm run lint` post W1+W2+W3 | ✅ zero erreur |
| `npm run build` post W1+W2+W3 | ✅ /jury 6.36 kB, /results 2.86 kB, /results/ceremony 1.45 kB |
| `node --check scripts/create-digi-hackathon-jurors.cjs` | ✅ syntax OK |
| Script provisioning run 1 (display_name bug) | ❌ J04 créé orphan |
| Cleanup MCP `DELETE auth.users WHERE id=e34488f0...` | ✅ J04 supprimé proprement |
| Script provisioning run 2 (full_name fix) | ✅ 4/4 jurys provisionnés |
| Validation DB jurors x event_id | ✅ 4 rows confirmées |
| CSV cohorte-digi-hackathon-creds.csv | ✅ J04 appendé (J01..J03 inchangés) |

## Smoke clic-driven (à exécuter par Omar avant Digi-Hackathon)

Non exécuté automatiquement — nécessite Omar dans le navigateur. Checklist recommandée (cf. memory `feedback_smoke_minimal_2p_1m_1gm`) :

### Mode `off` (état initial post-deploy)
- [ ] Login GM → `/admin` → `<AdminPitchModeToggle>` visible avec bouton "Préparation" actif (bleu)
- [ ] `<AdminJurorsManager>` visible avec 4 jurys listés
- [ ] Login `jury-01@digi.uemf.ma` (password depuis CSV) → `/jury` → grille vide cliquable
- [ ] Login mentor non-juror (par ex. `a.deguworkneh@ueuromed.org` M01) → `/jury` → écran "pas invité"
- [ ] Login Player (P01..P10) → `/journey` normal, `/results` → écran "merci"

### Transition `off` → `live`
- [ ] GM clique "Pitches en cours" → `confirm()` → bandeau success
- [ ] J01 rafraîchit `/jury` → bandeau ambre "Vos notes restent privées..."
- [ ] J01 vote 1 équipe → `savePitchScoreFlow` OK
- [ ] J02 va sur `/jury` → ne voit PAS la note de J01 (filtrage applicatif + RLS DB)

### Transition `live` → `closed`
- [ ] GM clique "Pitches clos" → `confirm()` → bandeau success
- [ ] J02 rafraîchit `/jury` → bandeau vert "Les pitches sont clos..."
- [ ] J02 voit l'agrégé par équipe
- [ ] `/admin/export/results.csv` (GM) → 200 OK avec CSV téléchargé

### Cérémonie + publish
- [ ] GM clique "Publier" → publication OK
- [ ] GM clique "Mode cérémonie" → `/results/ceremony` plein écran sombre
- [ ] Reveal staggered 3e (0s) → 2e (3s) → 1er (6s) avec confetti
- [ ] Player rafraîchit `/results` → toujours écran "merci" (R1 cardinal, ranking jamais visible)
- [ ] Logos partenaires Tamwilcom / Bank of Africa / Innov Invest / Bluespace visibles en footer

### Tests RLS DB (SQL via MCP)
- [ ] Mentor M01 (non-juror) authenticated : `SELECT * FROM pitch_scores` → 0 lignes
- [ ] Juror J01 en `live` : `SELECT * FROM pitch_scores WHERE juror_id <> '<J01-id>'` → 0 lignes
- [ ] Juror J02 en `closed` : `SELECT * FROM pitch_scores WHERE juror_id <> '<J02-id>'` → N lignes

## Notes pour Omar

- **Creds jurys** dans `cohorte-digi-hackathon-creds.csv` :
  - J01 jury-01@digi.uemf.ma · `4TU7wBzvPI5p` (placeholder pré-existant)
  - J02 jury-02@digi.uemf.ma · `aWQ75Na489kq` (placeholder pré-existant)
  - J03 jury-03@digi.uemf.ma · `3bLFX5tG1oEC` (placeholder pré-existant)
  - J04 jury-04@digi.uemf.ma · `hjw9KraqaaA` (nouveau, généré par script run 2)
- **full_name** assignés : J01=Tamwilcom, J02=Bank of Africa Academy, J03=Innov Invest, J04=Bluespace
- **Format CSV** : J04 est appendé au format Players (7 colonnes) alors que J01..J03 sont au format Jury (4 colonnes). Cosmétique, Omar lit le CSV manuellement.
