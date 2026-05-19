# ADVISOR-VERDICT — Quick 260519-jpr

**Date** : 2026-05-20
**Auditeur** : Orchestrateur (audit manuel — agent `eic-pedagogical-advisor` retiré commit `2fec455`)
**Scope** : Wave 1 + 2 + 3 cumulés (commits 8b4afc3 → 60268e8)
**Verdict global** : **OK**

## Méthode

Audit grep ciblé sur les 3 surfaces critiques :
1. `app/results/page.tsx` — pour R1 (visibilité Player/Mentor)
2. `app/actions.ts` — pour R2 (severity error vs warn)
3. `components/admin-pitch-mode-toggle.tsx` — pour R3 (blocages introduits)

## R1 — Score invisible Player/Mentor non-juror

**Statut : OK**

Branches Player/Mentor non-juror routent vers `<ThankYouScreen />` :
- `app/results/page.tsx:140` (branche B : non-GM non-juror non-publié)
- `app/results/page.tsx:147` (branche B' : non-GM non-juror PUBLIÉ — R1 strict)

`ThankYouScreen` (lignes 367-377) rend uniquement :
- `t.results_announce_title` (texte)
- `t.results_announce_body` (texte)
- `<Sparkle />` (animation CSS)

Aucun appel à `ResultsReplay`, `ResultsPodium`, `ResultsStatsStrip`. Aucun `ranking.rows.map`. Aucun `toFixed`. ✅

Les mentions de `score|rank|toFixed|pitchAvg|combined|scoreProject` ailleurs dans le fichier sont toutes dans :
- SQL queries internes (pas de JSX rendu)
- Branches GM (autorisées)
- Branches Juror state=closed ou published (autorisées par matrice)

Audit grep zero-fuite :
```bash
grep -E "score|rank|toFixed|/100|points" app/results/page.tsx | grep -E "ThankYou|announce|merci"
# → 0 résultats
```

## R2 — Validators warn-only

**Statut : OK**

`severity: "error"` apparaît 6 fois dans `app/actions.ts` :
- Ligne 1346, 2123, 2135, 2141, 2154, 2187 — toutes pour **erreurs d'authentification ou de configuration** (`"Backend non configuré"`, `"Non authentifié"`, etc.). Ce sont des erreurs de sécurité/infra légitimes, **pas des validators pédagogiques**.

Les validators pédagogiques (Lots 5.4, 5.5) utilisent :
- Bandeau jury `jury_pitch_mode_live_banner` → classe CSS ambre (`wf-pill is-amber` ou `eic-locked-hint--amber`)
- Bandeau jury `jury_pitch_mode_closed_banner` → classe CSS verte
- Bouton "Valider" disabled si total === 0 → tooltip warn (Agent #4 rapport)

Aucun nouveau `severity: "error"` introduit dans le scope quick-260519-jpr. ✅

## R3 — Pas de blocage inter-mission codé en dur

**Statut : OK**

Seul `disabled=` introduit par le quick : `components/admin-pitch-mode-toggle.tsx:122` (`disabled={isDisabled}` sur le bouton transition `live` quand `jurorCount === 0`).

Justification : c'est un **toggle GM** (surface admin staff), pas un blocage Player. Sert à empêcher le GM de passer en `live` sans aucun juror invité (sinon les jurys ne peuvent rien voter et le pitch est cassé). Pattern UX safe-guard, pas R3.

Aucun nouveau `HARD_BLOCK_DEPENDENCIES`, `blocks_progression_to`, ou redirection Player codée en dur. L'exception unique L2 prep→entretien (mentioned in CLAUDE.md, signée Omar 2026-05-19) n'est pas touchée. ✅

## Tests RLS (cf. spec section 6 critères acceptation)

À valider via SQL après smoke :
- [ ] Un mentor non-juror : `SELECT * FROM pitch_scores` → 0 lignes (faille historique corrigée)
- [ ] Un juror en `live` : `SELECT * FROM pitch_scores WHERE juror_id <> '<self>'` → 0 lignes
- [ ] Un juror en `closed` : même requête → N lignes

Tests automatisables via MCP execute_sql en simulant les contextes JWT, mais hors scope quick (laissé en deferred-items).

## Recommandations post-merge

1. **Smoke prod** : Omar se connecte avec un compte mentor non-juror (par ex. M01 Pr. Abebaw Degu Workneh) et vérifie que `/jury` affiche bien l'écran "pas invité".
2. **Test live → closed flow** : GM passe au `live`, J01 vote 1 équipe, vérifier que J02 ne voit pas la note de J01. GM passe à `closed`, vérifier que J02 voit maintenant l'agrégé.
3. **Mémoriser** : `display_name` n'existe pas dans `profiles` (c'est `full_name`) — mettre à jour le spec et CLAUDE.md si nécessaire.

## Verdict final

**OK — pas de BLOCK.** Quick autorisé à merger (déjà mergé sur main). Smoke et tests RLS recommandés post-merge mais non-bloquants.
