---
id: SEED-001
status: dormant
planted: 2026-05-10
planted_during: v0.2 EIC Design v2 Refresh (implementation_complete_pending_human_verification)
trigger_when: Post-pilote AgreenTech 13-14 mai 2026 — milestone v0.3 ouverte (≥ 2026-05-15)
scope: Large
related_milestones: [v0.3]
related_quick_tasks: [260510-heu, 260510-hzv]
---

# SEED-001 : Schemas v2 architectural refacto (T3-IMPROVEMENTS section F)

## Why This Matters

Le pilote AgreenTech 13-14 mai 2026 tourne avec les schemas v1 actuels (rubrique simpliste 4 critères × max). Le brief T3-IMPROVEMENTS.md section F (lignes 89-251) définit des schemas v2 beaucoup plus riches qui :

- Activent les **règles cardinales R2** (validators warn-only, jamais blockers) via le champ `validation_rules: [{rule, severity, message}]`
- Activent les **validators anti-creux T-3 A2** (liste noire L1 cible, cross-check ROI L4↔L2.1, min mots qualifiants) actuellement impossibles
- Donnent à chaque mission un `type` pédagogique cohérent (`phrase_a_trous`, `fiche_structuree`, `cartes_repetables`, `moscow_prototype`, `hybrid`) au lieu d'un formulaire générique
- Intègrent **A3** (champ "Hypothèse à invalider" L1) dans son contexte natif (`extra_fields.hypothese_invalider`) plutôt qu'absorbé en quick task isolée
- Préparent **B3** (L1 "Hypothèse révisée" qui apparaît quand L2.2 soumise) via le mécanisme `appears_at`
- Préparent **B4** (bouton "Citer ce verbatim" en L6 slide 4) via `ui_helper: "cite_from_M2.2"`
- Suppriment le hard-block L2.2→L3 codé en dur (R3 strict) — remplacé par `soft_recommends_before` informatif

Sans ce refacto, les règles cardinales R2/R3 reposent uniquement sur l'absence de blocking validators dans le code (vérifié sprint quick 260510-heu) et sur le mentor humain qui flag tech-without-farmer (ping 14h00 J1). Le pilote tient sur cette discipline humaine + l'audit R1 fait 2026-05-10. Mais en v0.3 (cycles plus longs, multi-cohortes), le moteur de validation devient nécessaire.

## When to Surface

**Trigger:** Post-pilote AgreenTech 13-14 mai 2026 — milestone v0.3 ouverte (≥ 2026-05-15)

This seed should be presented during `/gsd-new-milestone` when the milestone scope matches any of these conditions :

- v0.2 milestone marqué complet (verify + ship + retro pilote 13-14 mai)
- Mention "schemas v2", "T3-IMPROVEMENTS section F", "validators warn", "moteur validation", "form rendering 5 types", "phrase_a_trous", "fiche_structuree", "cartes_repetables", "moscow_prototype"
- Mention activation A2 / A3 / B3 / B4 (T3-IMPROVEMENTS sections A et B)
- Mention "hard-block L2.2→L3", "soft_recommends_before"

## Scope Estimate

**Large** — phase complète multi-couches, plusieurs jours de dev :

1. Étendre type TS `DeliverableTemplate` (`lib/types.ts:73-82`) avec nouveaux champs + types union `MissionTemplateType`
2. Migration SQL `database/migrations/10-deliverable-templates-v2.sql` (probablement colonne JSON `schema` pour flexibilité, sinon N colonnes typées)
3. Update `database/schema.sql` reference + `database/seed_event_hackdays.sql` re-seed avec schemas v2 des 7 missions L1→L6
4. Form rendering : 5 nouveaux composants côté Player UI pour les 5 `type` (phrase_a_trous template, fiche_structuree, cartes_repetables, moscow_prototype, hybrid)
5. Moteur de validation côté serveur (et/ou client) qui :
   - Lance les `validation_rules` au submit
   - Surface les warnings (sev:warn) dans l'UI Player + flag mentor
   - **NE BLOQUE JAMAIS** la soumission au pilote (R2 strict)
6. Inclure **A3** "Hypothèse à invalider" L1 dans `extra_fields.hypothese_invalider`
7. Re-test E2E complet, conservation dual-mode (demo + Supabase)

## Breadcrumbs

Source de vérité du brief :
- `T3-IMPROVEMENTS.md` section F lignes 89-251 (schemas JSON v2 ready-to-seed) — contient L1, L2.1, L2.2, L3, L4, L5, L6 complets

Code actuel à étendre / remplacer :
- `lib/types.ts:73-82` — `DeliverableTemplate` v1 minimaliste
- `lib/types.ts:67-71` — `RubricCriterion` (à conserver, peut coexister avec extra_fields v2)
- `lib/seed/deliverableTemplates.ts:1-38` — demo seed neutre 2 templates (header note `database/seed_event_hackdays.sql` détient les vrais)
- `database/seed_event_hackdays.sql` — seed réel des 7 missions Hack-Days
- `database/schema.sql` — DDL `deliverable_templates` table à étendre
- `lib/journey.ts` — consume des templates côté Player
- `lib/admin-deliverables.ts`, `lib/admin-player-detail.ts`, `lib/admin.ts`, `lib/mentor.ts` — consume admin/mentor
- `app/journey/deliverable/[id]/page.tsx` — form rendering Player (zone R1 patché 2026-05-10 commit `1291f94`)
- `app/actions.ts` — server actions à étendre avec moteur de validation warn

Décisions et historique :
- 2026-05-10 (sprint quick 260510-heu) : audit R1 fait, score invisible Player respecté — pré-requis ok pour schemas v2
- 2026-05-10 (sprint quick 260510-hzv) : CLAUDE.md sync lib/ refactor v0.2 — `lib/data.ts` retiré des refs (n'existait plus depuis Phases 6-9)
- 2026-05-10 (cette décision) : sprint quick 260510-? schemas v2 abandonné car incompatible quick scope, pivoté vers cette phase v0.3

## Notes

**Pré-requis avant ouvrir v0.3 :**
- Pilote AgreenTech 13-14 mai 2026 terminé
- v0.2 milestone complété via `/gsd-complete-milestone` (verify + ship)
- Retro pilote intégrée (feedback porteurs/mentors/jury sur missions et rubriques)

**Risques à anticiper en planning v0.3 :**
- Migration data : les soumissions existantes du pilote doivent rester lisibles avec schemas v1 (compatibilité descendante)
- Moteur de validation côté serveur vs client : décider en v0.3 où s'exécutent les rules (perf + offline considerations)
- 5 nouveaux types de form = 5 composants à styler EIC v2 — réutiliser tokens design-system Phase 6

**Bonus / opportunités à intégrer en planning v0.3 :**
- Permettre éditeur de schemas côté `/admin` (GameMaster crée/édite missions sans toucher au code)
- I18n des labels de schema (fr/en) dans `lib/i18n.ts` plutôt que hardcoded dans seed SQL

**Décision date :** 2026-05-10 — pivot validé par Omar via AskUserQuestion option C ("planifier vraie phase v0.3").
