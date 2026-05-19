# EIC Pedagogical Advisor — Verdict Phase 11

**Date** : 2026-05-10
**Reviewer** : eic-pedagogical-advisor
**Sources lues** : `EIC-MANAGER-ANSWERS-AGREENTECH.md`, `T3-IMPROVEMENTS.md`, `11-01-PLAN.md`, `AUDIT-DESIGN-V2-VS-IMPL-2026-05-10.md`, `app/page.tsx`, `app/journey/page.tsx`, `components/journey-track.tsx`, `components/journey-client.tsx`, `app/results/page.tsx`, `components/results-podium.tsx`, `.planning/design-v2/project/player-screens.jsx`.

---

## Per-item verdicts

### Wave A — CSS-only

| ID | Verdict | Rationale |
|---|---|---|
| A1 shimmer cap | **OK** | Pur visuel sur `.eic-track__fill`. Aucun chiffre, aucun rang, aucun blocage. R1/R2/R3 neutres. |
| A2 mount keyframe | **OK** | Animation barre charge, motion-safe. Aucun impact cardinal. |
| A3 node stagger | **OK** | Stagger d'apparition seulement. Vérifier `prefers-reduced-motion` présent (déjà exigé Wave A acceptance). |
| A4 topbar pills | **OK avec note** | "Pitch · 17h00" + "Mentor disponible" sont temps/disponibilité, pas score. Si l'audit révèle aussi `TOTAL_XP / 2000` dans `topbar-lite.tsx` (cf. `player-screens.jsx:71`), **REFUSER de porter le dénominateur** — R1 violation. À auditer en même temps. |

### Wave B — Animation/scroll

| ID | Verdict | Rationale |
|---|---|---|
| B1 smooth-scroll hero | **OK** | Scroll comportemental, hero CTA déjà dépourvu de score. Reduced-motion guard à confirmer. |
| B2 mobile scroll-snap | **OK** | CSS only mobile. Neutre cardinal. |
| B3 IO reveal `/results` | **OK** | Vérifié : `components/results-podium.tsx:65-67` gate déjà `entry.combined.toFixed(1)` derrière `isGameMaster`. Le reveal ne change pas le DOM, il anime un noeud déjà gaté. **Condition** : ne pas hisser le score hors du `{isGameMaster ? ... : null}` lors du wiring `is-revealed`. Idem pour `results-stats-strip` (déjà clean, 0 match `score/rank/toFixed`) et `results-timeline-moments`. Audit grep R1 post-edit obligatoire. |
| B4 GM radar dashed | **OK** | Page GM only (`/admin`), R1 ne s'applique pas. |
| B5 hero compact mobile | **OK** | Layout responsive, neutre. |

### Wave C — Logic/UX

| ID | Verdict | Rationale |
|---|---|---|
| C1 public landing 3 portes | **OK avec contraintes** | `landing.jsx` absent du bundle (`Glob` confirme : 11 jsx, pas de `landing.jsx`). C1 est donc une **création** Plan-side, pas un port pixel-perfect. Contraintes R1 : (a) bulle Pixel = copy qualitative ("Bienvenue", "Choisis ta porte"), **interdit** "Tu es classé X", "11 équipes en lice", "score moyen 67/100". (b) Kicker AgreenTech = mention dates + 4 partenaires, **interdit** "voir le classement", "résultats du pilote précédent". (c) 3 portes = labels rôle, **interdit** badges chiffrés ("Player · 240 XP"). Le mascot n'est jamais un canal de feedback chiffré (canal officiel = lettre jury PDF). Pas de mention "démo" visible (cf. CLAUDE.md crédibilité partenaires). |
| C2 dual-mode guard `/journey` | **OK** | Le fix proposé (`if (hasSupabaseEnv()) { if (!user) redirect } else { seed fallback }`) est **conforme** à `feedback_dual_mode_demo_guard.md`. Vérifié `app/journey/page.tsx:29-31` : actuellement `redirect("/login")` AVANT toute vérif env — c'est précisément la régression v0.2 documentée. Préserve swarm harness + démo partenaires. **Note** : `lib/auth.ts:getCurrentUser()` doit rester court-circuité en demo (à vérifier) — sinon le wrap externe ne suffit pas. |
| C3 locked click softening | **OK — fix R3 explicite** | C'est exactement le pattern T3-IMPROVEMENTS section R3 : "Plus de banner rouge → variant E.recommandé" + tooltip ambre. Conditions : (a) le drawer ouvert sur niveau locked **ne doit pas** déclencher de progression XP, ni d'incrément `currentLevel`, ni de mutation server. Lecture seule + tooltip. (b) Conserver `aria-disabled` ou équivalent pour AT (pas `disabled` DOM). (c) Copy tooltip = `T3-IMPROVEMENTS.md` section R3 verbatim "Astuce : compléter L2.2 améliore L3" — pas inventer une formulation. (d) Supprimer `cursor:not-allowed` côté CSS sur les nodes locked, remplacer par `cursor:pointer` + désaturation légère (no opacity drop). |

### Wave D — Cardinal rules audit

| ID | Verdict | Rationale |
|---|---|---|
| D1 R1 protective comment | **OK** | Wording recommandé sur `journey-client.tsx:122` : `// R1 (CARDINAL) — DO NOT add a "/{totalXpMax}" denominator here. Showing a max creates a comparison/ranking frame forbidden Player-side. XP gauge is progression-only. Ref: T3-IMPROVEMENTS.md R1.` |

---

## Verdict global Phase 11

**OK avec 4 conditions bloquantes** :

1. **A4 audit** : si `topbar-lite.tsx` contient déjà ou ajoute `TOTAL_XP / 2000`, refuser le port — R1 violation directe (cf. audit ligne 165-166).
2. **B3 grep post-edit** : exécuter `grep -rn "score\|rank\|/100\|/140\|toFixed" components/results-* --include="*.tsx"` après wiring IO. Tout match hors `{isGameMaster ? ... : null}` = BLOCK.
3. **C1 copy review** : faire valider la copy 3 portes + bulle Pixel + kicker par advisor avant commit (subagent re-spawn). Aucun chiffre, aucun rang, aucun "X équipes en lice".
4. **C3 absence de mutation** : confirmer en code review que cliquer un niveau locked ne déclenche aucune action serveur (`useState` open seulement, pas de `submitDeliverable*` ni revalidate).

Aucun item ne nécessite un `BLOCK` outright. Wave A + D peuvent merger sans review supplémentaire. Wave B/C nécessitent re-spawn advisor item-par-item conformément au plan (Wave C acceptance §69-71).

**Hors scope confirmé non-touché** : pondération 20/80 (`lib/results.ts`), bonus AAP (+5/+2/+3), 7 missions seed, jury workflow, lettre retour PDF.
