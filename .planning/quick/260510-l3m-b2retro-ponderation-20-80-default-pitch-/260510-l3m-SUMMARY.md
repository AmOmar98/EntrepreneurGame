# Quick Task 260510-l3m — B2 RÉTRO : Pondération 20/80 AgreenTech

**Date :** 2026-05-10
**Status :** Complete
**Bloquant T-3 :** B2 rétro CLAUDE.md (T-3 Critical Gates)
**Commits :** 1 atomique (fix code) + 1 docs (orchestrator)

---

## Décision implémentée

`final_score = projet × 0.2 + pitch × 0.8` (AgreenTech 2026, EIC manager rétro 2026-05-10)

Avant : `pitch × 0.5 + projet × 0.5` (`DEFAULT_PITCH_WEIGHT = 0.5`)
Après : `pitch × 0.8 + projet × 0.2` (`DEFAULT_PITCH_WEIGHT = 0.8`)

Cohérent T3-IMPROVEMENTS.md ligne 11 :
> Calcul `final_score` dans logique scoring `/admin` : `final = projet * 0.2 + pitch * 0.8`

---

## Implementation

### Fichier modifié (1)

`lib/results.ts` :
- ligne 3-7 : commentaire header mis à jour (50/50 → 20/80 + référence rétro)
- ligne 30 : `export const DEFAULT_PITCH_WEIGHT = 0.8` (était 0.5)

### Propagation

`computeRanking(opts?: { pitchWeight?: number })` accepte un override mais n'est appelé qu'à `app/results/page.tsx:113` SANS opts → utilise `DEFAULT_PITCH_WEIGHT` directement. Donc changer la constante propage automatiquement à tout le ranking.

`clampWeight()` (ligne 78) clamp 0..1 et fallback à `DEFAULT_PITCH_WEIGHT` — comportement inchangé fonctionnellement.

---

## Audits

| Check | Result |
|---|---|
| `npm run typecheck` | PASS (0 errors) |
| `npm run lint` | PASS (0 warnings) |
| `npm run build` | PASS (15/15 routes, /results 1.79 kB) |
| `git diff --name-only HEAD~1 HEAD` | `lib/results.ts` exactement |
| Pre-edit guards CLAUDE.md (zone sensible) | Conformité documentée dans le commit body — décision figée par EIC manager, pas de jugement EIC pédagogique advisor à porter sur la pondération elle-même. R1 (visibilité chiffres) déjà colmaté par B1 rétro 260510-kpw, recalibrage interne uniquement. Dual-mode demo intact (la fonction retourne `{rows: []}` quand !supabase). |

---

## Impact recalibrage

**Côté GameMaster** (visible) : tous les chiffres `combined` du ranking changent. Une équipe avec `pitch=80, projet=60` :
- Avant 50/50 : `combined = 0.5 * 80 + 0.5 * 60 = 70`
- Après 20/80 : `combined = 0.8 * 80 + 0.2 * 60 = 76`

**Côté Player** (gated par B1 rétro) : aucun chiffre visible, seul le podium nominatif des lauréats s'affiche. Le recalibrage n'a donc PAS d'impact UI Player — c'est purement la décision interne de classement.

---

## Manual smoke pour Omar (optionnel — la propagation est mécanique)

1. `npm run dev`
2. Se logguer comme GameMaster, naviguer `/results`
3. Vérifier que les chiffres `combined` du ranking ont été recalibrés (les équipes au pitch fort montent, les équipes au pitch faible descendent)
4. Vérifier que le podium top 3 reflète bien l'ordre 20/80 (peut différer de l'ordre 50/50 ancien)

---

## Bloquants T-3 restants

- [x] B1 rétro (R1 leak /results) — 260510-kpw
- [x] **B2 rétro (pondération 20/80) — 260510-l3m**
- [ ] B3 rétro (migrations SQL Phase 8+9)
- [ ] B4 rétro (seed AgreenTech 7 missions)
- [ ] B5 rétro (member_emails) — operator
