---
gathered: 2026-05-10
status: ready_for_planning
mode: imported (gsd-import --from)
source: C:\Users\omara\.claude\plans\glimmering-sauteeing-wilkinson.md
---

# Phase 10: T-3 Critical Gates + Design v2 Tail Sections - Context

**Gathered:** 2026-05-10
**Status:** Ready for execution
**Mode:** Imported from external plan via `/gsd-import --from`
**Source bundle design** : `https://api.anthropic.com/v1/design/h/I7NlTUTyicbeewAq3zcWOg` (identique au bundle `PG-1aljQekQKK5m01U-9Yw` après diff). Extraction dans `.planning/design-v2/` (déjà présent).

**Patch 2026-05-10** (quick session [`260510-l3a`](../../quick/260510-l3a-patch-phase-10-plan-roadmap-post-quick-s/)) : 0.2 + 0.7 marqués ✅ DONE post-quicks `260510-kpw` + `260510-j2j` ; 0.3 absorbe A2/B3/B4 data-side T3-IMPROVEMENTS.md ; ajout 0.10 (C3 ordre randomisé pitch) ; déclaration hors scope B5/C1/C2/C4 (cf. bloc `<scope>` ci-dessous).

<domain>
## Phase Boundary

Boucler v0.2 sur deux fronts en parallèle avant le pilote AgreenTech (T-3 jours, 13-14 mai 2026) :

1. **T-3 Critical Gates B1-B5** (rétro CLAUDE.md du 10/05) — bloquants go-live :
   - **B1** : percée R1 sur `/results` (`combined.toFixed(1)` rendu à TOUS les rôles)
   - **B2** : pondération AgreenTech 20/80 non implémentée (`DEFAULT_PITCH_WEIGHT = 0.5`)
   - **B3** : migrations SQL Phase 8 + 9 non appliquées en prod Supabase
   - **B4** : 7 missions AgreenTech absentes du seed (`L1 Hypothèse VP / L2.1 Persona / L2.2 Verbatims / L3 MoSCoW / L4 ROI/ha / L5 Plan acquisition / L6 Pitch + Bonus B`)
   - **B5** : `member_emails` à compléter manuellement (hors scope tech)

2. **5 sections design absentes du bundle Claude Design v2** :
   - **Section 10** · Pitch prep H-2 (compte à rebours, checklist 5 items, ordre passage, brief jury, 3 rappels)
   - **Section 11** · Coup de pouce (Player bloqué, timeline 5 actions, 3 portes de sortie : indice / mentor / pause)
   - **Section 12** · Profil joueur long-terme (stats vie, compétences signature, badges, mentors rencontrés)
   - **Section 13** · États système (Loading Pixel respire, Empty compte à rebours, 503 Pixel triste, Offline file de sync)
   - **Section 14** · Menu latéral slide-in + page Réglages (apparence, notifications, compte, avancé)

**Couplages atomiques** :
- Phase 0.1 (B2) + Phase 0.2 (B1) → 1 commit atomique (`/results` cohérent visiblement et arithmétiquement)
- Phase 0.3 (B4) + Phase 0.6 (R2 validators warn-only) → 1 commit atomique (seed + rubric AgriTech cohérent)
- Phase 1.1 (mood vars) + Phase 1.3 (extensions Pixel `loading`/`error`) → 1 commit atomique (refactor mascot)

</domain>

<decisions>
## Locked decisions (validated 2026-05-10)

- **Scope** : Tout (5 sections design absentes) — `Approve (Recommandé)` validé via AskUserQuestion.
- **Ticket `+100 XP` (R1)** : Spawn `eic-pedagogical-advisor` AVANT tout edit de `submission-ticket.tsx` — l'agent arbitre XP confirmé individuel vs score comparatif. Pas de modification unilatérale.
- **Pondération AgreenTech** : `pitchWeight = 0.80` par défaut + audit de tous les appelants. Mettre à jour `lib/results.ts:3` (commentaire `50/50` → `0.20/0.80`) ET REQUIREMENTS.md JURY-03 (« par défaut 50/50 » → « par défaut 0.20 projet + 0.80 pitch (AgreenTech) »).
- **Settings/Pitch-prep persistence** : `localStorage` (pas de migration SQL T-3).
- **Profil joueur** : route publique `/player/[slug]` mais gated par publication ranking (R1) — avant publication, page = `Profil disponible après le pitch` (réutilise SysEmpty).
- **B5 `member_emails`** : hors scope tech, signalé à Omar pour collecte manuelle AgreenTech.

## Cardinal rules (R1/R2/R3) à respecter sans exception

- **R1** : Score invisible côté Player avant fin du Hack-Days (sauf XP confirmé individuel post-soumission, sous arbitrage advisor).
- **R2** : Validators côté Player en `severity: "warn"` non-bloquants — jamais `"error"` ni `blocking: true`.
- **R3** : Pas de blocage inter-mission codé en dur — tooltip ambre warn-only, pas `disabled` ni `pointer-events: none`.

## EIC pedagogical advisor (obligatoire)

Spawn `.claude/agents/eic-pedagogical-advisor.md` AVANT toute édition des zones sensibles :
- `lib/seed/missions.ts` deliverable_templates + scoring rubric (Phase 0.3)
- `database/seed_event_hackdays.sql` (Phase 0.3)
- `components/submission-ticket.tsx` (Phase 0.5)
- `components/results-podium.tsx`, `components/results-replay.tsx` (Phase 0.2)
- `app/jury/page.tsx`, `app/results/page.tsx` (Phase 0.2)
- Tout fichier touchant journey gating (Phase 0.7)
- Tout fichier mentionnant XP côté Player (Phases 3, 4)

</decisions>

<scope>
## Sub-phases

- **Phase 0** — T-3 Critical Gates (B1-B5) — PRIORITÉ ABSOLUE
- **Phase 1** — Patch design system (mood vars Pixel + `.eic-toast` + extensions Pixel)
- **Phase 2** — Section 13 États système (Loading / Empty / 503 / Offline)
- **Phase 3** — Section 11 Coup de pouce (Player bloqué) — sensible R1
- **Phase 4** — Section 10 Pitch prep H-2 (Player J-1 pitch)
- **Phase 5** — Section 12 Profil joueur (long-terme)
- **Phase 6** — Section 14 Menu latéral + Réglages
- **Phase 7** — Smoke E2E + commits

Détail complet : voir `10-01-PLAN.md`.

## Hors scope (traité par /gsd-quick séparé ou v0.3)

Confirmé patch 2026-05-10 (quick session `260510-l3a`) — éléments T3-IMPROVEMENTS.md NE seront PAS traités dans Phase 10 :

- **B5** — 2 classements internes Excellence + Trajectoire (formule `Score_traj = Score_final - Score_présélection × 5`, filtre Trajectoire = équipes Idée + Premier Prototype) → ref `T3-IMPROVEMENTS.md` ligne 62. Quick séparé post-pilote.
- **C1** — Notation jury différée + révisable (brouillons pendant pitch, réajustement ±10pts post-session) → ref `T3-IMPROVEMENTS.md` ligne 68. Quick séparé OU v0.3.
- **C2** — Décomposition obligatoire 5 critères × /20 + affichage σ jury en temps réel → ref `T3-IMPROVEMENTS.md` ligne 69. Quick séparé OU v0.3.
- **C4** — Lettre retour personnalisée signée jury (template 3 champs `[force]/[risque]/[next step]` + export PDF) → ref `T3-IMPROVEMENTS.md` ligne 71 + section G template lignes 257-280. Quick séparé post-pilote (canal officiel feedback chiffré, peut être manuel au pilote).

**Décision** : ces 4 items sont reportés pour préserver la priorité absolue Phase 10 (B1-B4 + 5 sections design absentes). Ils n'impactent pas le go-live AgreenTech 13/05.

**Sous-tâche AJOUTÉE en Phase 0 (post-patch)** : `0.10 — C3 ordre randomisé pitch + équipes ancres milieu` (cf. `10-01-PLAN.md` Phase 0). Couplée à `0.3` (même seed event).

</scope>

<dependencies>
## Depends on

- Phase 6 (Design System EIC) ✅ — tokens utilisés partout
- Phase 7 (Joueur barre charge L0→L7 + Onboarding + Ticket SOUMIS) ✅ — modifie `submission-ticket.tsx` (sous garde advisor)
- Phase 8 (Mentor commentaires async) ✅ — migration SQL `08-mentor-comments.sql` à appliquer (Phase 0.4)
- Phase 9 (GameMaster live + Jury théâtre + Replay + Pixel) ✅ — modifie `pixel-mascot.tsx`, `results-podium.tsx`, `results-replay.tsx` (sous garde advisor)

## Operator gates (manuel)

- **B5 `member_emails`** : Omar collecte les emails des 11 lignes de `cohorte-agreentech.csv` AVANT de lancer l'import CSV bulk pour les magic links. Ce gate ne dépend pas du code.

</dependencies>
