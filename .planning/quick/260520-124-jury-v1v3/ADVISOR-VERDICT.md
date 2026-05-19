---
quick: 260520-124-jury-v1v3
advisor: eic-pedagogical-advisor (inlined verdict — single-agent context)
date: 2026-05-20
verdict: WARN_NOTES
---

# EIC Pedagogical Advisor — Verdict

## Brief reçu
Remplacer `app/jury/jury-form.tsx` par 2 variations UI :
- **V1 défaut** : sliders horizontaux 0-20 + récap `/100` + `/20 pondéré`
- **V3 toggle `?ui=dial`** : molettes SVG rotatives, grille 4 cols desktop / 2x2 mobile
- Garder `savePitchScoreFlow` (c1..c5), c5=0 hidden (legacy retired)
- Mobile responsive, branding EIC pro (pas de "Atlas/Maraya")

## R1 (score visible)
**OK.** Surface jury légitime : le juré DOIT voir SA propre grille de notation. Aucun rang/classement entre équipes affiché. Banner `jury_pitch_mode_live_banner` ("Vos notes restent privées jusqu'à la clôture des pitches.") conservé. Cohérent avec R1 révisée 11/05.

## R2 (validators warn-only)
**OK.** Aucun nouveau validator Zod. `pitchScoreSchema` intact (c1..c5 min(0).max(20)). Pattern warn 0/0/0/0 client-side conservé (severity warn, non bloquant).

## R3 (pas de blocage inter-mission)
**Sans objet.** Cette zone est `/jury`, pas une mission Player.

## Branding EIC
**OK avec note.** Utiliser `player.name` + `player.idea` réels en mode Supabase. Pas de "Atlas/Maraya" placeholder. Mention "démo" tolérée UNIQUEMENT via clé i18n `jury_demo_disabled` existante ("Données indisponibles — contactez le support") — ce qui est DÉJÀ neutre, pas de mention "démo" littérale visible côté partenaire.

## Cohérence pédagogique V3 molettes
**WARN_NOTES.** Le ton "molettes régie audio" peut paraître ludique. Devant Tamwilcom / Bank of Africa Academy / Innov Invest / Bluespace :
- **Recommandation** : V1 sliders RESTE le défaut, V3 molettes accessible uniquement via `?ui=dial` (deep-link), pas exposé visiblement aux partenaires par défaut.
- Le toggle dans le header (lien "↔ Molettes") doit rester **discret** (eic-button standard, pas eic-button--primary qui est réservé à "Mode pitch théâtre" plus important).
- Pas de "Coup de cœur" / "Pas convaincu" pills émotionnelles côté V3 → déjà exclu par constraint 11.
- Le label central de la molette doit afficher la **valeur numérique** (`{value}`) en typo Baskervville sobre, pas un emoji ou un mood.

## Notes incorporables Task 1/2/3
1. Toggle V1↔V3 dans le header : utiliser `eic-button` (pas `eic-button--primary`), discret à côté du bouton théâtre.
2. Labels toggle : "Sliders" / "Molettes" (français sobre, pas d'emoji ↔ comme dans le plan — remplacer par texte simple ou flèche unicode discrète si visuel nécessaire).
3. Banner anonymat : afficher au-dessus de la grille de cards (pas dans chaque card), DÉJÀ le pattern existant si `pitchModeState !== 'closed'`. Vérifier qu'il reste affiché dans la nouvelle structure.
4. V3 molettes : pas de drag rotatif custom (constraint 9 du plan déjà OK, on utilise input range invisible — accessibility-first).
5. Pas d'inflation de copy : ne PAS ajouter de "Coup de cœur" / emojis / pills émotionnelles. Sobriété EIC.

## Verdict final
**WARN_NOTES → procéder Task 1+2+3 avec les 5 notes ci-dessus appliquées.**
