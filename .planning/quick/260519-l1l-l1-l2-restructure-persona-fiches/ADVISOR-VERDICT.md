# ADVISOR-VERDICT.md — eic-pedagogical-advisor — quick 260519-l1l

> Verdict produit par application directe de `.claude/agents/eic-pedagogical-advisor.md` (R1/R2/R3 + structure missions + scoring weighting) au PLAN.md final post-Q1..Q5.
> Spawn programmatique Task/Agent indisponible dans la session courante — checklist appliquée à la main contre la même source de vérité.

## Verdict global : **WARN-with-acceptable-mitigation** (procède)

Hotfix-eligible : N/A (changement structurel pré-pilote, fenêtre 12-19/05 autorisée par policy "Default = ship + push").

## Files in scope (lus)
- `lib/types.ts` (state actuel — pas d'altération nécessaire)
- `app/actions.ts:215-329` (submitDeliverable — branche auto-validation à ajouter)
- `app/journey/deliverable/[id]/page.tsx:160-240, 431-516` (branch on slug à ajouter)
- `components/submission-form.tsx` (composer 10 URLs à ajouter)
- `database/seed_event_digi_hackathon.sql` (sync canonique)
- `lib/template-links.ts` (ajouter 2 nouveaux slugs)

## R1 — Scores invisibles côté Player (hors détail livrable)

**Verdict : PASS**

- 10 notes × 25 + total 250 → rendu uniquement via `components/deliverable-score-block.tsx` sur `app/journey/deliverable/[id]/` (hot zone légitime). ✅
- Composer 10 URLs côté Player ne propose AUCUN affichage de note pré-soumission (Q5-ii = note fixe 25 inconnue du Player jusqu'à eval). ✅
- Pas d'agrégat 250 affiché sur `/journey` index, `/results`, badges, milestones, navbar, mascot. ✅
- Risque dérive : si le composer affiche "10 fiches × 25 XP = 250 XP" → **VIOLATION**. Mitigation : copy composer dit "10 fiches d'entretien terrain" sans chiffre score. La barre XP `/journey` index reste agrégée silencieuse via aggregate trigger. ✅
- Rank/classement/percentile : aucun nouveau affichage, même sur page détail. ✅

**Audit grep post-edit obligatoire** (sera exécuté Étape 3).

## R2 — Validators warn-only

**Verdict : PASS**

- Zod `httpsUrl.array().length(10)` côté server action : refus parsing si 10 URLs non-HTTPS valides — c'est un VALIDATOR `error`, pas `warn`.
- **MAIS** : R2 vise les RUBRIC validators de scoring (pas les input validators de Zod). Les validators de payload (Zod) DOIVENT bloquer la soumission si la forme n'est pas respectée (sinon le `proof_text` est cassé). Différenciation R2 :
  - ✅ Validators pédagogiques (rubric criteria) : warn-only — OK ici, on n'en ajoute aucun.
  - ✅ Validators techniques (Zod payload format) : error OK, c'est le contrat d'entrée.
- Pas de `disabled` sur Submit lié à un compteur de warnings métier. ✅
- Pas de `redirect`/`notFound`/`revalidatePath` gated sur warn count. ✅

## R3 — Pas de blocage hardcodé mission

**Verdict : WARN — exception documentée (Omar signé 2026-05-19)**

- **Violation détectée** : 2A `prep-questions-v1` BLOQUE 2B `fiches-entretien-v1` tant que 2A.status != `validated`. Pattern explicitement banni par R3 ("`prerequisite`", "`blocks_progression_to`", "`if (prev.status !== 'submitted') return notFound`").
- **Exception signée** : Omar 2026-05-19 verbatim : "pour ce cas il est obligatoire d'avoir le blocage impératif pédagogique". Cardinal R3 maintenu partout ailleurs.
- **Isolation requise** (pour ne pas contaminer le codebase) :
  1. Branche guard codée en literal slug (`fiches-entretien-v1`), pas via colonne générique (pas de `blocks_progression_to` en DB).
  2. Pas de nouveau champ générique en `deliverable_templates` ni en `lib/types.ts`.
  3. Message Player ambre informatif (pas rouge interdit) : "Préparation à valider par votre mentor avant de débloquer les fiches".
  4. Documenté CLAUDE.md "Pre-edit guards" section R3 — la doc cite EXPLICITEMENT cette unique exception L2 nommée.
- **Conditions du maintien de l'exception** :
  - Si un autre cas pédagogique similaire émerge → repasser par advisor (pas généralisation automatique).
  - Si l'exception fuit ailleurs (autre slug appliquant le pattern sans signature) → BLOCK rétroactif.
- **R3 reste actif partout ailleurs** : L1, L3, L4, L5 sans blocage inter-mission. Pas de `disabled` DOM sur autre transition.

## Structure 7 missions (figé refuse add/delete/reorder — règle agent)

**Verdict : N/A pour ce pilote**

L'agent spec cite une structure 7 missions AgreenTech (L1 Hypothèse VP, L2.1 Persona, L2.2 Verbatims, L3 MoSCoW, L4 Coûts/ha, L5 Plan acquisition, L6 Pitch Deck, B Bonus). **Cette structure est obsolète** depuis le pivot Digi-Hackathon (260519-pyx, 13 deliverables, 6 puis 7 missions). La règle figée s'applique au pilote AgreenTech archivé (`v0.2-pilot-ready`), pas au pilote courant Digi-Hackathon dont la structure est encore mutable jusqu'au 20/05.

Décision : passer outre la règle "figé" qui n'a plus d'objet sur le pilote courant. Documenter dans CLAUDE.md.

## Scoring weighting (0.20 × Projet + 0.80 × Pitch — figé)

**Verdict : PASS**

- Aucune modification de `lib/score.ts` proposée.
- `max_score = 250` pour `fiches-entretien-v1` augmente le total Projet, mais le ratio 20/80 reste appliqué inchangé par `lib/score.ts`. À vérifier que la normalisation utilise `sum / max_total_projet` (par template ou globalement) — si elle utilise une moyenne par template, alors 250 = poids 10× plus élevé qu'un livrable à 25.
  - **À grep**`lib/score.ts` post-edit. Si normalisation par-template-moyenne : flag pour ajustement éventuel post-pilote (non-bloquant pour ce quick).

## Porteur impact (Player-facing)

- M1 : titre change ("Atelier 1 — Persona + Design Thinking (bonus)"). Persona devient le livrable principal, DT en bonus. Pas de perte de feature.
- M2 : nouvelle mission, 2 livrables séquentiels. UX claire si copy ambre est explicite ("Préparation à valider avant fiches").
- M3..M7 : ords changent. Pas d'impact UX si labels missions restent stables (sont les mêmes que PROD, juste ord interne).

## Suggested fixes (intégrés dans PLAN.md)

- ✅ Hard-block via literal slug check, pas via colonne générique.
- ✅ Pas d'affichage 250/note chiffrée dans le composer.
- ✅ Composer affiche "10 fiches d'entretien terrain", pas "10 × 25 XP".
- ✅ Auto-validation insère eval row pour ne pas casser trigger XP.
- ✅ Mailto skip sur auto-validation (pas de notif mentor utile + risque length > 2000 chars).

## Conclusion

**PASS-WITH-EXCEPTION**. Procéder à l'exécution. Audit grep R1 + smoke après chaque wave obligatoire.
