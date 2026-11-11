---
quick_id: 260519-t3a
title: Audit ship-vs-gap T3-IMPROVEMENTS.md vs codebase post-pilote
date: 2026-05-19
auditor: Claude (subagent ship-vs-gap)
source_doc: T3-IMPROVEMENTS.md (créé 2026-05-10 T-3)
reference_state:
  - tag v0.2-pilot-ready (commit ccdc2bc, 2026-05-11)
  - milestone v0.2 archivé (audit .planning/milestones/v0.2-MILESTONE-AUDIT.md)
  - pilote AgreenTech LIVE 13-14/05/2026 OK
  - pivot Digi-Hackathon 2026-05-19 (commit c71156c) — 11 deliverables Welcome Guide
---

# Audit ship-vs-gap T3-IMPROVEMENTS.md

## Synthèse

| Verdict | Compte |
|---|---:|
| ✅ SHIPPED | 11 |
| ⚠️ PARTIAL | 4 |
| ❌ MISSING | 4 |
| 🚫 CADUQUE | 9 |
| 🔍 UNKNOWN | 0 |
| **Total items audités** | **28** |

**Score global SHIPPED + PARTIAL livré au pilote** : 15/28 = 54 %.
**Score actionable hors caduques** : 15/19 = 79 % (pilote sauvé sans les schemas L1..L6 AgreenTech).

Les 3 règles cardinales R1/R2/R3 sont **enforced en prod** (cf. memory `feedback_eic_cardinal_rules`, harness Playwright quick `260517-psd`, baseline `docs/validator-severity-baseline.md`).

Les **9 caduques** sont principalement les schemas JSON L1-L6 AgreenTech (section F + reliquats B3/B4 attachés) : la pivot Digi-Hackathon (commit `c71156c`, 11 livrables santé mentale jeunesse alignés sur 8 PDF Welcome Guide) a remplacé toute la pédagogie agriculture (persona agriculteur, ROI/ha, ORMVA, etc.).

---

## Détail par item

| ID | Titre | Verdict | Evidence | Reliquat actionable |
|----|------|---------|----------|---------------------|
| **R1** | Score JAMAIS visible Player (sauf détail livrable) | ✅ SHIPPED | Memory `feedback_eic_cardinal_rules` · commit `2864bd5` (scope R1 → page détail OK) · `c1eca29` (expose score livrable) · harness Playwright `tests/smoke/r2-warn-only.spec.ts` + scripts `scripts/check-r2-severity.{ps1,sh}` | — |
| **R2** | Validators warn-only non-bloquants | ✅ SHIPPED | `docs/validator-severity-baseline.md` · `app/actions.ts:1844, 1980, 2026` (severity "warn") · quick `260517-vsa` (commit `d2ba037`) | — |
| **R3** | Plus de blocage codé en dur (tooltip ambre) | ✅ SHIPPED | `components/journey-client.tsx:192-206` · `components/journey-drawer.tsx:140-161` · `components/journey-level-node.tsx:6-10` · classe `.eic-locked-hint--amber` · commit `260510-j2j` | — |
| **A1** | Auto-save 8s + pastille footer | ✅ SHIPPED | `components/auto-save-badge.tsx` (commit `6d8d141` — "feat(a1): auto-save 8s + badge footer") · `hooks/use-auto-save.ts` | — |
| **A2** | Validators blacklist L1 + ROI cohérence L4↔L2.1 | 🚫 CADUQUE | `grep` blacklist mots `agriculteurs|fermiers|exploitants` → 0 hit `app/actions.ts` / `lib/`. Cible filière agricole obsolète post-pivot santé mentale | Caduque — refactor warn-list à la cible Digi-Hackathon si besoin (cf. backlog v0.3) |
| **A3** | Champ "Hypothèse à invalider" L1 (Lean Startup) | 🚫 CADUQUE | `grep hypothese_invalider` → 0 hit `app/`/`lib/`/`components/`. Champ jamais ajouté au schema. L1 a été remplacé par 'design-thinking-v1' (Empathize+Define+Ideate+Prototype) cf. `database/seed_event_digi_hackathon.sql:146` | Caduque — pédagogie Lean remplacée par Stanford d.school dans Digi-Hackathon |
| **A4** | Compteur X/N champs + coche pop | ✅ SHIPPED | `components/field-completion-counter.tsx` (commit `cf28807` — "feat(a4): compteur Y/N champs header form + coche pop (T3-IMPROVEMENTS A4)") | — |
| **A5** | Pixel mascotte 3 triggers événementiels | ✅ SHIPPED | `hooks/use-pixel-trigger.ts` (commit `2a55abb`, header explicite "T3-A5") · `components/pixel-mascot-player.tsx` · trigger first delivery + stagnation 15min + (verbatim n°2 caduque) | ⚠️ Trigger (c) verbatim n°2 obsolète post-pivot (pas de M2.2 verbatim card dans Digi-Hackathon) — vérifier code mort |
| **B1** | Cohort Pulse Bar anonymisée | ✅ SHIPPED | `components/cohort-pulse.tsx` (commit `dfe2173` — "feat(b1): add CohortPulse") · `lib/cohort-pulse.ts` · monté sur `/journey` (commit `311dd78` "feat(b1): mount CohortPulse + R1 audit") | — |
| **B2** | L3 verrouillage retiré → tooltip ambre | ✅ SHIPPED | Identique R3 — `components/journey-drawer.tsx:140-161` · classe `.eic-locked-hint--amber` · commits `260510-j2j` | — |
| **B3** | L1 "Hypothèse révisée après L2.2" + flag mentor V0=V1 | 🚫 CADUQUE | `grep hypothese_revisee` → 0 hit. Dépend du schema L1 v2 (A3) jamais shippé. Schema L1 Digi-Hackathon utilise rubrique 'design-thinking-v1' sans champ révision | Caduque — concept Lean (révision hypothèse) absent du Welcome Guide santé mentale |
| **B4** | Bouton "Citer ce verbatim" L6 slide 4 (helper UI) | ⚠️ PARTIAL | Helper `cite_from_M2.2` mentionné dans SQL seeds `database/seed_event_hackdays.sql` + `seed_event_digi_hackathon.sql:382` (rubrique slide 4 = verbatim/chiffre). Côté UI : aucun composant `Slide4Editor` ni bouton "Citer ce verbatim" trouvé (`grep "Citer ce verbatim"` → 0 hit `.tsx`) | Concept gardé en rubrique scoring (mentor évalue) mais helper UI Player non livré. Backlog v0.3 si soumission L6 via formulaire structuré |
| **B5** | 2 classements Excellence + Trajectoire (`/admin` `/jury`) | ❌ MISSING | `grep -E "Excellence\|Trajectoire\|Wildcard"` dans `app/` `components/` `lib/` → 0 hit. `lib/admin-live.ts` + `components/admin-leaderboard-live.tsx` ne font qu'un classement unique par `scoreProject desc` | Caduque AgreenTech-specific (SagriPlast hors Trajectoire) mais concept "trajectoire = progression normalisée" reste un Big Bet v0.3 backlog |
| **C1** | Notation différée + révisable (brouillons + ±10pts) | ❌ MISSING | `grep "draft\|brouillon\|réajust\|reajust"` dans `app/jury` `components/jury-*` → 0 hit. `components/jury-pitch-dials.tsx` enregistre directement via `savePitchScoreFlow` (pas de phase brouillon) | Big Bet v0.3 — backlog jury async (Digi-Hackathon jury identique structurellement) |
| **C2** | Décomposition 5 critères × /20 + σ live | ⚠️ PARTIAL | `components/jury-pitch-dials.tsx` confirme **4 critères × /20** (commit `a2e4a20` "feat(jury): switch to 4-criteria scoring"), pas 5. c5 forcé à 0 (cf. header `jury-pitch-dials.tsx:5`). σ live (écart-type temps réel) **non livré** (`grep sigma\|σ` 0 hit jury) | Décision Omar : 4 critères validés. σ live = polish v0.3 |
| **C3** | Ordre randomisé pitch + ancres en milieu | ✅ SHIPPED | `lib/pitch-order.ts` (commentaire ligne 1 "Phase 10 / 0.10 — C3 T3-IMPROVEMENTS") · `components/admin-pitch-order-editor.tsx` (commit `dd11aa8` "feat(admin): GM pitch order editor") · seed PRNG xorshift testable | — |
| **C4** | Lettre retour jury 3 champs + PDF gen | ❌ MISSING | `grep -l "lettre"` dans `components/*.tsx` `app/**/*.tsx` → 0 hit. Aucun composant lettre, aucun PDF gen | Backlog v0.3 — utile pour Digi-Hackathon jury 22/05 si livrable similaire attendu |
| **D1** | Replay Mode timeline 90s exportable IG/LI | ⚠️ PARTIAL | `components/results-replay.tsx` + `components/results-timeline-moments.tsx` existent (Phase 9) mais export Instagram/LinkedIn non implémenté | Polish v0.3 (replay déjà visuel, manque export vidéo/gif) |
| **D2** | Plateforme post-bootcamp M8+/M9+/M10+ J+15/J+30/J+90 | ❌ MISSING | Aucun composant ou seed mission post-bootcamp J+15/30/90 | Big Bet v0.3 — concept "entrepreneuriat ≠ événement" |
| **D3** | Z-score normalisation mentor | 🚫 CADUQUE (explicit) | Doc T3 ligne 77 dit "Trop tard pour 13/05". Pas livré, pas pilote-bloquant. Avec pondération 80% pitch, impact mentor leniency ≤ ±4pts | Reste v0.3 backlog si scale post-Digi-Hackathon |
| **E** | Wildcard AAP (2 équipes fast-track Tamwilcom) | 🚫 CADUQUE | Décision politique pilote AgreenTech avec partenaires nominaux (Tamwilcom, Fatimaezzahra). Post-pilote 14/05 → exécutée en cérémonie. Mécanique 100% offline (pas de code) | — |
| **F-L1** | Schema L1 v2 PhraseATrous (cible/besoin/offre/différenciation + hypothese_invalider/revisee) | 🚫 CADUQUE | Seed `database/seed_event_digi_hackathon.sql` ligne 75-146 : L1_problem mappé sur 'design-thinking-v1' (Empathize/Define/Ideate/Prototype) — pas phrase à trous agriculteur | Pédagogie agriculture → santé mentale jeunesse |
| **F-L2.1** | Schema L2.1 v2 FicheStructurée persona (filière/zone/ORMVA) | 🚫 CADUQUE | Pas de persona agriculteur dans Digi-Hackathon. Persona est un bonus (`persona-v1`) santé mentale, pas une fiche structurée filière/zone | Refactor schema persona pour santé mentale = sous-task v0.3 si pertinent |
| **F-L2.2** | Schema L2.2 v2 CartesRépétables verbatims (blocs_progression retiré) | 🚫 CADUQUE | Pas de mission M2.2 verbatim card répétable séparée dans Digi-Hackathon. Verbatims fusionnés dans `design-thinking-v1` rubrique Empathize (cf. `seed_event_digi_hackathon.sql:148`) | Caduque structurellement |
| **F-L3** | Schema L3 v2 MoSCoW + severity warn | ✅ SHIPPED | `database/seed_event_digi_hackathon.sql:225` (slug `moscow-v1`, annexe livrable 04b). UI : `components/moscow-kanban.tsx` (commit `4dc2b91`) + `components/moscow-card.tsx`. Warn-only severity confirmé `app/actions.ts:1844` | — |
| **F-L4** | Schema L4 v2 Coûts/ha + ROI agricole | 🚫 CADUQUE | Remplacé par `unit-economics-v1` (CAC/LTV/Churn/MRR/Payback SaaS) cf. `seed_event_digi_hackathon.sql:347-348`. ROI/ha + CAPEX/OPEX agricole obsolète | — |
| **F-L5** | Schema L5 v2 Canaux écosystème (ORMVA/COPAG/ONCA) | 🚫 CADUQUE | Remplacé par `commercialisation-v1` (Funnel AARRR + canaux digitaux/communautaires santé mentale) | — |
| **F-L6** | Schema L6 v2 Pitch Deck + Slide 4 cite verbatim/chiffre | ✅ SHIPPED | `database/seed_event_digi_hackathon.sql:382-385` rubric `preuve_slide4` "verbatim OU chiffre terrain sourcé (anti-fabrication)". Concept anti-fabrication conservé | Helper UI "Citer ce verbatim" reste manquant (cf. B4) |
| **G** | Template lettre retour jury Markdown | ❌ MISSING | Aucune trace template dans `components/`, `lib/`, `docs/` | Backlog v0.3 (cf. C4) |
| **H** | Checklist mar 12/05 23h | ⚠️ PARTIAL (méta) | 11/22 cases shippées (cf. ci-dessus) — checklist remplie partiellement, milestone v0.2 archivé pilot-ready | — |

---

## Reliquat actionable consolidé

### Cible : Digi-Hackathon 22/05 (urgence pilote suivant)

| ID | Action | Effort | Note |
|----|--------|-------|------|
| **C2 σ live** | Afficher écart-type live jury (4 critères, pas 5) | S | Polish — aide jury à utiliser l'échelle |
| **B4 UI** | Composant `Slide4Editor` avec bouton "Citer ce verbatim" pré-rempli depuis rubrique Empathize | M | Rubrique scoring déjà en place (`preuve_slide4`), manque le helper Player |
| **A5 cleanup** | Vérifier trigger (c) verbatim n°2 dans `hooks/use-pixel-trigger.ts` → adapter ou retirer (pas de M2.2 verbatim dans Digi-Hackathon) | XS | Risque mascotte ne se déclenche jamais sur cohorte santé mentale |

### Cible : v0.3 backlog (post-Digi-Hackathon 22/05)

| ID | Action | Big Bet ? |
|----|--------|-----------|
| **B5** | 2 classements internes Excellence + Trajectoire | Oui — concept progression normalisée transférable |
| **C1** | Notation différée + révisable (brouillons jury) | Oui — qualité jury async |
| **C4 + G** | Lettre retour jury 3 champs + PDF gen + template | Oui — canal feedback chiffré privé (R1-safe) |
| **D1 export** | Replay 90s exportable Instagram/LinkedIn | Polish — composants base présents |
| **D2** | Plateforme post-bootcamp J+15/30/90 | Big Bet — signal "entrepreneuriat ≠ événement" |
| **D3** | Z-score normalisation mentor (calibration croisée) | Big Bet — utile si scale >15 équipes |

### Polish opportuniste (no rush)

| ID | Action | Note |
|----|--------|------|
| A2 (post-pivot) | Refactor warn-list cible Digi-Hackathon (mots seuls santé mentale ?) | À discuter pédago — pas de doctrine équivalente identifiée |

---

## Caduques explicites

| ID | Raison |
|----|--------|
| **A2** | Liste noire mots agriculteurs/fermiers/exploitants spécifique filière agricole — Digi-Hackathon pivot santé mentale jeunesse |
| **A3** | Champ Lean Startup "hypothese_invalider" jamais ajouté — pédagogie Lean remplacée par Stanford d.school (`design-thinking-v1`) |
| **B3** | "Hypothèse révisée après L2.2" : dépend A3 + M2.2 verbatim séparée (n'existe plus) |
| **D3** | Z-score mentor : explicitement "trop tard 13/05" dans doc T3 ligne 77 |
| **E** | Wildcard AAP Tamwilcom : décision politique pilote AgreenTech, exécutée offline 14/05 cérémonie |
| **F-L1** | Schema PhraseATrous cible/besoin/offre/différenciation agriculteur → remplacé par design-thinking-v1 4 phases d.school |
| **F-L2.1** | FicheStructurée persona filière/zone/ORMVA agricole → persona-v1 bonus santé mentale |
| **F-L2.2** | CartesRépétables verbatims séparée → fusionnés dans rubrique Empathize design-thinking-v1 |
| **F-L4** | Coûts/ha + ROI agricole CAPEX/OPEX → unit-economics-v1 SaaS (CAC/LTV/Churn/MRR/Payback) |
| **F-L5** | Canaux ORMVA/COPAG/ONCA/coopératives → commercialisation-v1 Funnel AARRR canaux digitaux/communautaires |

---

## Notes méthodologiques

- Audit grep ciblé : commits, fichiers `components/`, `lib/`, `app/actions.ts`, seeds SQL `database/seed_event_*.sql`.
- Memory entries consultées : `project_pilot_status`, `project_v02_status`, `project_digi_hackathon_13_deliverables`, `feedback_eic_cardinal_rules`.
- Source ref T3 retrouvée explicitement dans 7 commits :
  - `6d8d141 feat(a1)` · `cf28807 feat(a4)` · `2a55abb feat(a5)` · `dfe2173 feat(b1)` · `260510-j2j feat(b2/R3)` · `dd11aa8 feat(C3 admin)` · `a2e4a20 feat(C2 4-criteria)`.
- Doc archivée `RETROSPECTIVE-T3-2026-05-10.md` listée en `D` git status (non lue, mais SHA pilote-ready `ccdc2bc` confirmé via audit milestone).
