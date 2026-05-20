---
quick: 260520-124-jury-v1v3
date: 2026-05-20
---

# Deferred Items (intentionnels — hors scope ce quick)

1. ~~**Commentaire libre qualitatif**~~ → **FAIT** (V4 extension scope 2026-05-20) : `comment_c1..c5` + `comment_global` colonnes nullables ajoutées, persisted dans `savePitchScoreFlow`.
2. ~~**Drag rotatif SVG custom sur V3**~~ → **FAIT** (ext 2026-05-20) : `onPointerDown/Move/Up` natifs sur SVG, `atan2(dx, -dy)` mappe 0deg=top, -135..+135 → value 0..20. Input range reste KB-focusable (pointer-events:none).
3. ~~**Verdict pills**~~ → **FAIT** (ext 2026-05-20) : 4 boutons radio (Pas convaincu / À retravailler / Convaincu / Coup de cœur) sur V3 + V4 (V1 reste sobre). Persisté en DB via `verdict` text + CHECK constraint.
4. **Pondération customisable par critère** — actuellement 20% × 5 hardcodé (`*1.25` côté UI). Suffisant pour Digi-Hackathon 2026-05.
5. ~~**Bouton "Brouillon" séparé du "Valider"**~~ → **FAIT** (ext 2026-05-20) : 2 boutons submit `name="isDraft"` `value="true|false"` sur V1/V3/V4. Status badge ambre "BROUILLON" / vert "VOTE VALIDÉ" affiché si `existing` chargé. Toast message branche selon `isDraft`.
6. ~~**Clés i18n `jury_ui_toggle_slider` / `jury_ui_toggle_dial`**~~ → **FAIT** (V4 extension scope) : `jury_session_toggle_sliders` / `jury_session_toggle_dial` / `jury_session_toggle_session` ajoutés.
7. **Convention "Avoid accented characters"** appliquée partiellement — UI strings touchées (`équipes`, `Problème`, `Marché`, `Modèle éco.`, `règles`), mais mailto/CSV/server actions intacts. Si Omar veut généraliser les accents à tout le code-resident strings → quick séparé large.

## V4 extension scope (2026-05-20) — items résiduels

8. **`otherJurors` progress data** — actuellement `[]` (placeholder). Calcul = pour chaque autre juror du `jurors` table, compter `pitch_scores` rows authored sur le current player. Nécessite query supplémentaire dans `getJuryOverview` + RLS validation (juror voit-il les progress des autres ?). Hors scope MVP, quick séparé si Omar le demande.
9. ~~**`upNext` queue intelligente**~~ → **FAIT** (ext 2026-05-20) : sort dans `getJuryOverview` par level DESC + score_project DESC + name ASC quand `pitch_order_json` absent ; `pitch_order_json` prioritaire si défini. UpNext slice hérite automatiquement.
10. **Timer côté serveur synchronisé** — actuellement affichage statique `04:12/5:00` côté UI (cosmétique). Timer pilotable GM-side = phase plus large.
11. **Boutons Pause / Suivant** — disabled (cosmétique uniquement). Wiring GM-controlled hors scope.
12. **Profile `full_name` côté juror card** — actuellement `user.email` fallback. À enrichir via `profiles.full_name` fetch dédié dans `getJuryOverview`.
13. **F3 fix vérification PROD smoke** — page.tsx passe `pitchModeState` aux deux formes V1/V3, bannerLabel switche live↔closed. Smoke réel sur PROD avec injection `events.pitch_mode_state='closed'` côté Omar (Supabase MCP execute_sql).
14. **F4 fix vérification PROD smoke** — séparateur `·` ajouté entre `/100` et `score20 /20` côté V3 jury-dial-form. Smoke visuel à confirmer post-deploy.
15. **DB migration NEW.sql** — `.planning/quick/260520-124-jury-v1v3/NEW.sql` à appliquer via Supabase MCP `execute_sql` AVANT toute saisie V4 sur PROD. Sans la migration appliquée, l'upsert avec comments retournera erreur PostgreSQL ("column does not exist") visible côté juror dans le banner d'erreur. V1/V3 (sans comments) restent fonctionnels.
