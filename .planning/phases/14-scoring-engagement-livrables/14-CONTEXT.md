---
name: Phase 14 — Context (Scoring d'engagement livrables : paliers 100/25/50)
phase: 14
slug: scoring-engagement-livrables
gathered: 2026-05-10
status: draft-context (à enrichir via /gsd-discuss-phase 14)
source: décision live owner (Omar) 2026-05-10 post-rétro T-3 — ajout d'une couche d'engagement au scoring livrables
---

# Phase 14 : Scoring d'engagement livrables — Context

**Date** : 2026-05-10 (post-rétro T-3)
**Statut** : DRAFT CONTEXT — pas de plan technique. À discuter via `/gsd-discuss-phase 14` avant tout code.
**Cible** : post-pilote AgreenTech (13-14 mai 2026) sauf décision contraire en discuss.
**Source** : conversation owner ↔ Claude Code 2026-05-10 — owner valide la pondération 80/20 actuelle, demande l'ajout d'un **deuxième axe de scoring** côté engagement.

> Ce CONTEXT.md capte uniquement **l'intention pédagogique** et les **règles de scoring**. Le mapping vers `lib/score.ts`, `database/triggers.sql`, `players.score_engagement`, visibilité UI, etc. sera tranché en `/gsd-discuss-phase 14` puis `/gsd-plan-phase 14`.

---

## 1. Intention pédagogique (en mots simples)

Le scoring actuel récompense la **qualité** des livrables (note rubric 5×5=25 par livrable). Owner veut **rajouter une couche qui récompense l'engagement** : avoir soumis, avoir été lu par un mentor, avoir été validé. Trois paliers d'effort, chacun visible, qui ne dépendent pas de la note de qualité.

**Pourquoi** : un porteur qui livre tout en temps et heure mais avec une note moyenne doit voir sa persévérance reconnue. Inversement, un porteur qui ne soumet rien ne peut pas être récompensé par un coup de chance au pitch.

---

## 2. Règles de scoring (locked par owner)

### 2.1 Garder le système actuel (rubric qualité)
- 1 livrable = note 0..25 (5 critères × 5 points) attribuée par mentor.
- Agrégat → `players.score_project` (best-per-template, trigger DB existant `recalc_player_score`).
- **Ne pas toucher.**

### 2.2 Ajouter le scoring d'engagement (NEW)

Pour chaque livrable, trois paliers cumulatifs :

| Palier | Déclencheur | Points |
|---|---|---|
| **Soumis** | porteur a soumis (v1 ou v2 — palier atteint à la première soumission) | **+100** |
| **Reviewed** | mentor a posté une évaluation (peu importe verdict) | **+25** |
| **Validé** | verdict `validate_v1` ou `validate_v2` | **+50** |

**Total par livrable validé** : 100 + 25 + 50 = **175 pts d'engagement** (en plus de la note qualité 0..25).

### 2.3 Convention cumulative

- **Cumulatif** : franchir un palier ne remplace pas le précédent — un livrable validé vaut bien 175 pts (pas 50).
- **Unique par livrable** : chaque palier est atteint **une seule fois** par livrable. Une soumission v2 après une v1 ne redonne pas +100. Une 2e évaluation par un autre mentor ne redonne pas +25.
- **Réversibilité** : à trancher en discuss — si un livrable validé est ensuite invalidé, perd-on les 50 pts ? les 25 ? Idem si une soumission est supprimée (cas très rare).

---

## 3. Questions ouvertes (à trancher en /gsd-discuss-phase 14)

Ces questions sont **pédagogiques** (pas tech) — elles déterminent comment la logique se branche dans le produit. À répondre avant tout PLAN.

### Q1 — Visibilité côté Player (critique R1)
La règle cardinale R1 dit : **score/rang invisible Player**. Mais ces 100/25/50 ressemblent à un feedback de progression (« tu as franchi un palier »), distinct d'une note de qualité ou d'un rang.

- **Option A** : Player voit chaque palier franchi par livrable (« Soumis ✓ +100 », « Mentor a lu ✓ +25 », « Validé ✓ +50 ») mais **jamais le total cumulé** et **jamais comparé aux autres équipes**. R1 préservé si pas de classement.
- **Option B** : Player voit le total `score_engagement` cumulé sur son tableau de bord (chiffre brut). Risque R1 si ce nombre permet de deviner son rang.
- **Option C** : Invisible Player, visible GameMaster/jury uniquement (cohérent total avec R1 actuel mais perd la valeur motivationnelle pour le porteur).

**Recommandation EIC advisor à demander** avant trancher.

### Q2 — Entre-t-il dans le ranking final ?
La pondération `combined = 0.8 × pitch + 0.2 × project` est lockée (décision EIC manager 2026-05-10, B2 retro).

- **Option A** : `score_engagement` reste **hors ranking** (juste affichage motivation). Pondération 80/20 inchangée.
- **Option B** : nouveau combined `0.7 × pitch + 0.2 × project + 0.1 × engagement_normalisé` (à débattre).
- **Option C** : `score_engagement` remplace partiellement `score_project` dans le combined (refonte profonde — éviter pré-pilote).

**Recommandation par défaut** : Option A (hors ranking) pour ne pas casser la décision pédagogique lockée.

### Q3 — Stockage
- `players.score_engagement` existe déjà (colonne `numeric(6,2)` dans `database/schema.sql`) mais n'est alimentée par aucun trigger.
- Option naturelle : créer trigger `recalc_player_engagement(p_player_id)` sur `submissions` (insert) + `evaluations` (insert/update verdict).

### Q4 — Avant ou après le pilote 13-14 mai ?
- **Pré-pilote (T-2/T-1)** : risque de régression sur surfaces critiques (lib/score.ts, triggers DB, dashboard Player). Très peu de marge de smoke.
- **Post-pilote (v0.3)** : safer, mais le pilote 13-14 ne bénéficiera pas de cette gamification supplémentaire.

**Recommandation par défaut** : **post-pilote**, sauf si owner veut prendre le risque T-1 (à arbitrer en discuss).

### Q5 — Réversibilité (cf 2.3)
Que se passe-t-il si un livrable validé est **re-évalué** plus tard avec `reject` (cas rare mais possible) ? Perd-il les +50 ? Garde-t-il +100 et +25 ?

---

## 4. Périmètre Phase 14 (à confirmer en discuss)

**In scope (probable)** :
- Trigger DB `recalc_player_engagement` + colonne déjà existante `players.score_engagement`.
- Helper TS `sumPlayerScoreEngagement(submissions, evaluations)` dans `lib/score.ts` (miroir DB pour UI).
- Surface Player : badges "Soumis / Lu / Validé" par livrable (si Q1 = A ou B).
- Surface GameMaster : total `score_engagement` colonne admin.

**Out of scope (Phase 14)** :
- Modification de `combined` dans `lib/results.ts` (sauf décision Q2 = B/C).
- Refonte rubric qualité (intact).
- Modification pondération 80/20 (intact).
- Tout système de "streak" / "combo" / multiplier d'engagement (extension future possible).

---

## 5. Pré-edit guards (rappel CLAUDE.md)

Avant tout edit en exécution, spawn **`eic-pedagogical-advisor`** pour audit R1/R2/R3 :
- `lib/score.ts` (zone sensible)
- `lib/results.ts` (si Q2 = B/C)
- `lib/seed/` (probable si seed mis à jour)
- `database/triggers.sql` (nouveau trigger)
- Tout composant Player-facing affichant les paliers

Grep R1 obligatoire post-edit côté Player-facing : aucun match attendu pour `score`, `rank`, `/100`, `/140`, `toFixed` côté `app/journey/` et `app/results/` Player view.

---

*Last updated: 2026-05-10 — CONTEXT initial, à enrichir via `/gsd-discuss-phase 14` puis `/gsd-plan-phase 14`. Aucun code écrit pour cette phase à date.*
