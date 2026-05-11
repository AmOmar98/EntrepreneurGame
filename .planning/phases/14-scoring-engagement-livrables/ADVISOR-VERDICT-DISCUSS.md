# Phase 14 — Verdict EIC Pedagogical Advisor (discuss)

**Date** : 2026-05-11
**Advisor** : `eic-pedagogical-advisor`
**Phase** : 14 — Scoring d'engagement livrables (paliers 100/25/50)
**Branche** : `ralph/pre-pilot-phases-13-14` · base `fcac3f9`
**Cutoff cible** : 2026-05-12 23h00 (T-1 main freeze AgreenTech)
**Sources de vérité relues** : `EIC-MANAGER-ANSWERS-AGREENTECH.md` §3 (scoring + R1) + `T3-IMPROUVEMENTS.md` §A/B/F + `14-CONTEXT.md`

---

## Verdict global Phase 14 : **WARN — GO sous conditions strictes**

Phase 14 est **pédagogiquement saine** et compatible avec R1/R2/R3 **à condition** de retenir les options recommandées ci-dessous. La couche engagement comble une vraie carence pédagogique (récompenser la persévérance, pas seulement la qualité, pour une cohorte hétérogène Idée → Clients) et arrive à temps pour le pilote.

**Conditions de GO (cumulatives)** :
1. Q1 = **Option A** (paliers qualitatifs côté Player, **zéro chiffre brut** — voir détail ci-dessous).
2. Q2 = **Option A** (engagement HORS combined ranking 80/20).
3. Q3 = **Option A** (trigger DB) avec helper TS miroir pour UI dual-mode.
4. Q5 = **Option A** (réversibilité partielle : palier "Validé" recalculable, paliers "Soumis"/"Reviewed" irréversibles).
5. Audit grep R1 obligatoire post-exécution sur tous les composants Player-facing affichant les 3 paliers — aucun `score`, `pts`, `+100`, `+25`, `+50`, `/175`, `toFixed` ne doit fuiter côté Player.
6. Pas de touche à `lib/results.ts:269` (formule `combined`) ni à `DEFAULT_PITCH_WEIGHT = 0.8` (`lib/results.ts:32`). Phase 14 ajoute, ne remplace pas.
7. Smoke régression demo mode + mode Supabase après dernier commit, focus sur `/journey` (badges paliers), `/mentor` (verdicts ne cassent rien), `/admin` (colonne `score_engagement` visible GM), `/results` (R1 inchangé).

Risque résiduel T-2 : moyen mais contenu si les 7 conditions sont tenues. Le tag `v0.2.2-pre-ralph-13` mentionné dans CONTEXT §3 Q4 est le filet de sécurité — ne pas l'omettre.

---

## Q1 — Visibilité Player : **Option A (paliers qualitatifs, zéro chiffre)**

### Verdict : Option A **obligatoire**. B refusée. C écartée.

### Justification

**R1 (`EIC-MANAGER-ANSWERS-AGREENTECH.md` §3 lignes 111-117, `T3-IMPROVEMENTS.md` §R1 lignes 24-28)** est explicite :

> ❌ INTERDIT Player : note /140, classement live, score pitch, Z-score, percentile, "vous êtes #3 sur 11"
> ✅ OK Player (gamification non-comparative) : XP de progression (badges niveaux), compteur "X/N champs remplis" perso, Cohort Pulse Bar

Les paliers `+100 / +25 / +50` **sont des chiffres**. Les afficher en chiffres bruts côté Player constitue une violation R1 directe — même sans rang affiché, le porteur peut :
- Faire le calcul mental "j'ai 350, mon voisin parle de son 525" → ranking informel reconstitué dans la salle.
- Comparer son total à un plafond théorique (`6 livrables × 175 = 1050`) → percentile auto-déduit.
- Sentir la pression "il me manque 50 pts" pendant un atelier → stress + course aux paliers, exactement l'effet anti-pédagogique que R1 cherche à neutraliser.

**Option B est donc une violation R1 caractérisée. Refusée.**

**Option C** (invisible Player) respecte R1 mais perd la valeur motivationnelle — or le pilote AgreenTech repose sur la gamification visible côté porteur (cf. `EIC-MANAGER-ANSWERS-AGREENTECH.md` §3 ligne 116 : XP, badges, Cohort Pulse Bar sont explicitement OK). C est défensive mais sous-optimale.

### Spec Option A (à figer en PLAN-phase)

Pour chaque livrable, le Player voit **3 badges qualitatifs** dans la carte de mission, **sans valeur numérique, sans total cumulé, sans comparaison cohorte** :

| État | Badge visible Player | Wording recommandé (FR, sans diacritique technique mais accents OK pour copy) |
|---|---|---|
| 0 — pas soumis | grisé, contour pointillé | "À soumettre" |
| 1 — soumis | vert plein, coche | "Soumis ✓" |
| 2 — lu mentor | + chevron bleu | "Lu par le mentor ✓" |
| 3 — validé | + étoile EIC | "Validé par le mentor ✓" |

**Aucun "+100"**, aucun "175 pts engagement", aucun "x/6 livrables validés en chiffres" (le compteur agrégé tombe sous R1 — même règle que Cohort Pulse Bar : si on l'affiche, il doit être *non-comparatif* et qualitatif).

**Cohort Pulse Bar engagement** (analogue à `T3-IMPROVEMENTS.md` §B1) **acceptable** : `7/11 équipes ont eu leur L3 validée` — chiffre cohorte anonymisé, pas nominatif, pas individuel. À distinguer strictement du total perso de l'équipe.

**Mascotte Pixel** (`T3-IMPROVEMENTS.md` §A5) peut réagir à un palier franchi (`"Première validation !"`) — message éditorial, **pas de chiffre**.

### Audit grep R1 obligatoire post-exécution

```
grep -rn "score_engagement\|+100\|+25\|+50\|/175\|engagement.*pts\|toFixed" `
  app/journey app/onboarding app/mission components/submission-* `
  components/results-* --include="*.tsx"
```
Aucun match attendu côté Player. Matchs autorisés uniquement dans `app/admin/`, `app/jury/`, `app/mentor/`.

---

## Q2 — Combined ranking : **Option A (engagement HORS combined)**

### Verdict : Option A **obligatoire**. B nécessite re-validation Omar (escalade). C explicitement écartée par CONTEXT §3 Q2.

### Justification

La pondération `combined = 0.8 × pitch + 0.2 × project_quality` est **LOCKÉE** par décision Omar 2026-05-10 (B2 retro, statut `FIXÉ` dans `CLAUDE.md` §T-3 Critical Gates). C'est une décision politique vis-à-vis des 4 bailleurs (Tamwilcom / BoA Academy / Innov Invest / Bluespace) : elle minimise l'effet Matthew sur la cohorte hétérogène (`EIC-MANAGER-ANSWERS-AGREENTECH.md` §3 lignes 105-109) et la décision a été cadrée comme **non-révisable à T-3**.

**Option B** (`0.7 × pitch + 0.2 × project + 0.1 × engagement`) :
- Casse le contrat 80/20 communiqué (au moins implicitement) à l'EIC manager.
- Introduit un risque d'optimisation cynique : un porteur peut "farmer" l'engagement (soumettre 6 livrables médiocres pour gratter +175×6 = 1050 pts normalisés à 10% = +10 pts combined) au détriment de la qualité.
- N'est pas calibrée — l'engagement max possible (175 × N_livrables) n'est pas du même ordre que pitch 0..100. Risque de saturation ou de domination en fonction de la normalisation choisie. Pas de temps pour la modéliser proprement à T-2.
- **Exige escalade Omar** — l'advisor ne peut pas trancher unilatéralement un changement de ratio locké.

**Option C** (engagement remplace partiellement project) : refonte profonde explicitement écartée par CONTEXT.

### Recommandation finale

Option A : `score_engagement` reste **strictement décoratif** côté Player (qualitatif) et **opérationnel** côté admin (colonne GameMaster + lecture jury pour départager ex-aequo informellement). Le combined `0.8/0.2` reste inchangé.

**Bénéfice pédagogique conservé** : un porteur qui soumet tout et est validé partout aura une narrative forte en lettre retour jury (`T3-IMPROVEMENTS.md` §G) — "Votre force distinctive : équipe ayant livré l'intégralité du parcours, avec validation mentor sur 6/6 missions". Le chiffre sert la délibération privée, pas le rang public.

### Garde-code

- **Ne pas modifier** `lib/results.ts:269` (`combined = pitchWeight * pitchAvg + projectWeight * scoreProject`).
- **Ne pas modifier** `lib/results.ts:32` (`DEFAULT_PITCH_WEIGHT = 0.8`).
- Tout PR qui touche ces lignes en Phase 14 = BLOCK automatique.

---

## Q3 — Stockage : **Option A (trigger DB) + helper TS miroir**

### Verdict : Option A avec helper TS miroir dual-mode (Option B partielle conservée pour la cohérence demo).

### Justification

**Option A pure (trigger DB)** :
- Cohérent avec l'architecture existante : `recalc_player_score` est déjà un trigger DB (`database/triggers.sql`), pas un calcul TS. Mirroir exact = cohérence pédagogique pour les futurs contributeurs.
- Performance : aggregate calculé une fois sur write, pas N fois sur read.
- Source de vérité unique : la colonne `players.score_engagement` (existante, `numeric(6,2)`) est alimentée canoniquement par la DB. Pas de drift possible entre TS et DB.

**Option B pure (lazy TS)** :
- Casse la cohérence avec `recalc_player_score`.
- Force chaque consumer (admin page, jury, futures vues) à recharger submissions + evaluations pour recalculer — coût SQL × N consumers.
- Pas adapté à un usage en RLS post-publish (cf. pattern `lib/results.ts:182` qui contourne RLS via service-role).

### Combinaison recommandée

1. **Trigger DB `recalc_player_engagement(p_player_id uuid)`** dans `database/triggers.sql`, calé sur le pattern existant de `recalc_player_score`. Hook sur :
   - `AFTER INSERT ON submissions` (palier "Soumis" : +100 si première soumission validée du template).
   - `AFTER INSERT OR UPDATE OF verdict ON evaluations` (paliers "Reviewed" : +25 si première eval ; "Validé" : +50 si verdict ∈ {`validate_v1`, `validate_v2`}).
2. **Helper TS miroir** `sumPlayerScoreEngagement(submissions, evaluations)` dans `lib/score.ts` — **pour le mode demo uniquement** (cf. `lib/supabase-status.ts:hasSupabaseEnv()` dual-mode). En mode Supabase, l'UI lit `player.scoreEngagement` directement (déjà alimenté par trigger). En mode demo, l'UI appelle le helper sur le seed.
3. **Migration** : créer un fichier `database/migrations/2026XXXX_phase14_engagement_trigger.sql` (pas modifier `schema.sql` directement, conformément au flow B3 retro). Appliquer en PROD via Supabase MCP **après typecheck + lint + build clean local**.

### Garde-code

- Le trigger doit être **idempotent** : recalcul complet `score_engagement` à partir du delta, jamais d'incrément naïf (sinon double-fire = double comptage).
- Convention cumulative stricte (CONTEXT §2.3) : `score_engagement = SUM_per_template(palier_max_atteint × points)`. Une 2e soumission v2 ou un 2e mentor ne re-déclenche **pas** un palier déjà atteint.
- Test smoke obligatoire : créer 1 player, soumettre 1 livrable, vérifier `+100` ; ajouter eval `request_v2`, vérifier `+25` (pas +50) ; ajouter eval `validate_v1`, vérifier `+50` (total 175) ; ajouter eval `request_v2` d'un 2e mentor (cas Q5), voir verdict Q5.

---

## Q5 — Réversibilité : **Option A (réversibilité partielle ciblée)**

### Verdict : Option A. Option B refusée.

### Justification

**Option B (irréversibilité totale)** :
- Crée des incohérences pédagogiques : un livrable rejeté garde +50 "Validé" — un mentor regardant le dashboard verra un player à 175/livrable alors que son verdict actuel est `reject`. Bug perçu → perte de confiance mentor dans l'outil.
- Ouvre la porte à un cas tordu : mentor valide par erreur, corrige immédiatement à `reject`, le player garde son +50 "fantôme". Game-able involontairement.

**Option A (réversibilité partielle)** :
- **Palier "Soumis" (+100)** : irréversible. Le fait d'avoir soumis est un événement historique — supprimer une soumission est un cas administratif extrême qui doit déclencher un recalcul manuel par le GM, pas une mécanique courante.
- **Palier "Reviewed" (+25)** : irréversible. Une eval écrite existe — peu importe qu'elle soit mise à jour, l'événement "mentor a regardé" est consommé.
- **Palier "Validé" (+50)** : **recalculable** sur UPDATE de verdict. Si le verdict courant du dernier eval (par template) est ∈ {`validate_v1`, `validate_v2`} → +50. Sinon → 0. Le trigger doit donc lire l'**eval la plus récente par template**, pas "une eval validate quelconque a existé".

### Spec trigger

```
score_engagement(player) = SUM_per_template_de_ce_player(
  100 × (∃ submission validated)
  + 25  × (∃ eval)
  + 50  × (verdict_le_plus_recent ∈ {'validate_v1','validate_v2'})
)
```

Recalculé sur INSERT submission, INSERT eval, UPDATE eval.verdict. Pas sur DELETE (cas admin manuel hors flow normal).

### Cas limite à documenter

- **Re-soumission v2 après reject** : le palier "Soumis" reste à +100 (déjà acquis), nouvelle eval déclenche éventuellement nouveau +50 ou pas selon verdict. Comportement cumulatif sur paliers acquis + recalcul du palier "Validé" — cohérent avec la pédagogie "on récompense la persévérance, pas la note".
- **2 mentors évaluent le même livrable** : 2e mentor n'ajoute pas un 2e +25 (palier "Reviewed" unique par template). Le palier "Validé" = verdict du dernier eval temporellement (ou logique "best wins" à trancher en PLAN — recommandation : `last wins` pour cohérence avec workflow async mentor).

---

## Cardinaux R1/R2/R3 — Statut post-Phase 14 (projection)

| Règle | Statut projeté | Garde-code Phase 14 |
|---|---|---|
| **R1** score/rang invisible Player | Préservé si Q1=A | Audit grep obligatoire ; aucun `+100`/`+25`/`+50`/`/175`/`pts` en composant Player |
| **R2** validators warn-only | Non affecté (Phase 14 ne touche pas validators) | — |
| **R3** zéro blocage inter-mission hardcodé | Non affecté (Phase 14 ne crée pas de blocage) | Vérifier qu'aucun `if (scoreEngagement < X) disabled` n'apparaît côté Player |

**Risque caché à surveiller** : si quelqu'un implémente un "Tu as débloqué la mission L4 grâce à ton engagement" basé sur `score_engagement`, on retombe sur R3. **Aucun gating de mission sur `score_engagement`** au pilote.

---

## Recommandations PLAN-phase

Quand `/gsd-plan-phase 14` est lancé, le PLAN doit inclure :

1. **Commit 1** : migration SQL `database/migrations/2026XXXX_phase14_engagement_trigger.sql` (trigger + fonction `recalc_player_engagement`). Appliquer en local Supabase d'abord, puis PROD via MCP.
2. **Commit 2** : `lib/score.ts` — ajouter `sumPlayerScoreEngagement(submissions, evaluations)` helper TS miroir (dual-mode demo). **Ne pas modifier** `combineScores` (déjà présent ligne 41-49 mais reflète la sémantique actuelle — le tester avant édit pour ne pas casser).
3. **Commit 3** : seed `lib/seed/` mis à jour si nécessaire pour exposer `scoreEngagement` non-nul en mode demo (cohérence visuelle pour Omar quand il teste).
4. **Commit 4** : UI Player — 3 badges qualitatifs dans la carte mission (`components/journey/*` ou équivalent). **Zéro chiffre.** Tester via grep R1 avant push.
5. **Commit 5** : UI Mentor/GM — colonne `score_engagement` en chiffres dans `app/admin/` + dashboard mentor. Visibilité gated `isGameMaster` (pattern existant `app/results/page.tsx` post-B1 fix).
6. **Smoke régression** : demo mode `/journey` + Supabase mode `/admin` + audit grep R1 final.
7. **Tag** : `v0.2.3-phase14-engagement` après merge clean. Push immédiat (cf. `CLAUDE.md` §Default = ship + push).

---

## Escalades à Omar nécessaires

1. **Si Q2 dérive vers Option B** (intégrer engagement dans combined) : escalade obligatoire — décision 80/20 lockée par Omar, pas par advisor.
2. **Si le PLAN propose un mode "leaderboard engagement" Player** (même qualitatif "top 3 engagés") : escalade — frôle R1 par comparaison nominative.
3. **Si découverte tardive de couplage** entre `score_engagement` et un comportement de gating mission existant : escalade — R3 en jeu.

---

## Décision finale

**Verdict global Phase 14 : WARN — GO sous conditions (Q1=A, Q2=A, Q3=A+helper, Q5=A)**

L'advisor approuve l'exécution pré-pilote sous réserve stricte des 7 conditions listées en tête. Phase 14 est un bon ajout pédagogique au pilote AgreenTech à condition de ne pas franchir la frontière R1 par tentation de "rendre le chiffre visible pour motiver". Le levier motivationnel est dans les **3 badges qualitatifs + mascotte Pixel + Cohort Pulse Bar engagement anonymisé**, pas dans les chiffres bruts.

Bonne exécution. Tag avant, ship + push après chaque commit, smoke après dernier merge.

— `eic-pedagogical-advisor`, 2026-05-11
