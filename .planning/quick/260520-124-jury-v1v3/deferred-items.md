---
quick: 260520-124-jury-v1v3
date: 2026-05-20
---

# Deferred Items (intentionnels — hors scope ce quick)

1. **Commentaire libre qualitatif** (mockup V1 ligne 105) — nécessite extension `pitchScoreSchema` + colonne DB. Quick séparé si demandé.
2. **Drag rotatif SVG custom sur V3** — actuellement input range invisible (a11y-first). Drag natif quick séparé si feedback partenaire.
3. **Verdict pills** ("Pas convaincu / À retravailler / Convaincu / Coup de cœur" mockup V3 ligne 388-391) — nécessite champ DB séparé + R1 review (risque émotionnel). Volontairement skip (sobriété EIC).
4. **Pondération customisable par critère** — actuellement 20% × 5 hardcodé (`*1.25` côté UI). Suffisant pour Digi-Hackathon 2026-05.
5. **Bouton "Brouillon" séparé du "Valider"** — `useActionState` ne distingue pas, hors scope.
6. **Clés i18n `jury_ui_toggle_slider` / `jury_ui_toggle_dial`** — pour l'instant strings inline "Sliders" / "Molettes" dans `app/jury/page.tsx`. Ajout i18n quick séparé si besoin.
7. **Convention "Avoid accented characters"** appliquée partiellement — UI strings touchées (`équipes`, `Problème`, `Marché`, `Modèle éco.`, `règles`), mais mailto/CSV/server actions intacts. Si Omar veut généraliser les accents à tout le code-resident strings → quick séparé large.
