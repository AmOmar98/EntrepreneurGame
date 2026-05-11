---
id: SEED-003
status: dormant
planted: 2026-05-11
planted_during: v0.1 — Pilot Hack-Days AgreenTech (Phases 1-5 complete, 100%)
trigger_when: Prochain pilote (v1.0) — préparation 2e cohort hack-days post-AgreenTech
scope: small
---

# SEED-003: Bonus in-kind — minutes de pitch supplémentaires fonction du score/XP

## Why This Matters

**Renforcer engagement amont.** Aujourd'hui le 20% deliverables (L1-L6 + bonus B)
est calculé en backend mais reste invisible côté Player jusqu'au résultat final.
Les porteurs n'ont aucun feedback tangible immédiat sur l'impact de leurs
livrables sur leur pitch.

L'idée : convertir le capital XP/score accumulé pendant J1-J2 en **temps de pitch
supplémentaire** devant le jury. Le porteur qui soigne ses livrables gagne des
secondes/minutes de parole — récompense ressentie, narrative cohérente, et
moteur d'engagement permanent sur les 2 jours.

**Storytelling EIC :** « Ton effort cumulé devient ton capital pitch. »

## When to Surface

**Trigger:** Prochain pilote (v1.0) — quand on prépare un 2e cohort hack-days
post-AgreenTech.

Ce seed doit être présenté lors de `/gsd-new-milestone` si la milestone touche :
- Préparation d'un nouveau pilote / cohort hack-days
- Refonte des mécaniques de récompense / gamification
- Refonte du module pitch / jury / timer

## Scope Estimate

**Small** — quelques heures.

Tweak ciblé :
1. Fonction `pitchBonusFromScore(player)` dans `lib/score.ts` ou nouveau
   `lib/pitch-bonus.ts` — lit le score amont (livrables L1-L6 + bonus B) et
   retourne un offset en secondes (ex. paliers : 0 / +30s / +60s / +90s).
2. Affichage côté Player avant pitch : « Tu as débloqué +60s de pitch grâce à
   tes livrables » (banner motivationnel, conforme R1 — pas de score brut).
3. Lecture côté jury timer (`components/jury-pitch-timer.tsx`) : `baseDuration
   + bonusSeconds`.
4. Communication GameMaster : surface visible cockpit admin.

**Garde-fous R1/R2/R3 :**
- **R1** : afficher le bonus en minutes/secondes débloquées, **pas** le score
  source côté Player. Le jury peut voir la décomposition.
- **R2** : pas de validator concerné — pure mécanique d'affichage et timer.
- **R3** : ne pas bloquer le pitch si bonus = 0 (tout le monde a la base time).

## Breadcrumbs

Code et décisions liées trouvés dans la base actuelle :

- `lib/results.ts` — `DEFAULT_PITCH_WEIGHT = 0.8` (pondération 20/80 active depuis B2)
- `lib/pitch-prep.ts` — préparation côté porteur (point d'extension naturel)
- `lib/score.ts` — calcul score amont 20% (livrables + bonus B)
- `components/jury-pitch-timer.tsx` — composant timer jury (point de lecture du bonus)
- `components/jury-pitch-theater.tsx` — UI jury, affichage de la décomposition
- `database/migrations/10-pitch-order.sql` — précédent pour migration légère côté pitch
- `lib/i18n.ts` — clés copy à ajouter (FR par défaut)
- Mémoire utilisateur `feedback_eic_cardinal_rules.md` — R1 invisible Player

## Notes

- Idée plantée pendant v0.1 final (T-2 avant pilote AgreenTech 13-14 mai 2026).
  Pas le moment de l'implémenter — fenêtre 11→12 mai réservée aux 6 gates
  humains pendants + smoke E2E.
- Sera observée empiriquement pendant le pilote AgreenTech : si les porteurs
  expriment frustration de « ne pas savoir où ils en sont » côté livrables,
  ce seed sera prioritaire pour v1.0.
- Variante à explorer au moment de l'implémentation : bonus inverse pour
  équilibrer (les porteurs en retard reçoivent un coup de pouce ?) — à
  trancher avec mentor pédagogique.
- Alternative in-kind à explorer dans la même veine : ordre de passage choisi,
  slot Q&A étendu, accès prioritaire mentor en J2. À regrouper potentiellement
  sous un futur seed « catalogue bonus in-kind ».
