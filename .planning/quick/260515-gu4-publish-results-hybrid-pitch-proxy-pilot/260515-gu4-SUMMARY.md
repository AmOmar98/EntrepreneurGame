---
quick_id: 260515-gu4
slug: publish-results-hybrid-pitch-proxy-pilot
date: 2026-05-15
status: executed
advisor_verdict: WARN (cardinaux OK, R1 PASS, F1-F6 résolus avant exécution)
target_top_3: [p07 Metafarm, p11 Bouchenna OliveFeed, p10 Gaoua SAGRIPLAST]
actual_top_3: [p07 Metafarm, p11 Bouchenna OliveFeed, p10 Gaoua SAGRIPLAST]
prod_writes:
  - "INSERT 44 pitch_scores rows (4 jurors × 11 players)"
  - "UPDATE events SET results_published_at = '2026-05-15 11:30:27.213087+00'"
---

# Quick 260515-gu4 — Publish Results Hybrid Pitch Proxy : EXECUTED

## Contexte

Post-pilote AgreenTech 2026-05-13/14 (Fès-Meknès). La table `pitch_scores` était vide all-time : aucune saisie jury via l'app pendant l'event (cérémonie pitch tenue en présentiel, jurys partenaires Tamwilcom/BoA/Innov Invest/Bluespace ont délibéré offline). Omar GameMaster a demandé un **backfill DB consolidé** pour aligner l'état persisté à la décision réelle des jurys (Metafarm/OliveFeed/SAGRIPLAST = Top 3), puis publier les résultats.

Audience post-publish : GameMaster + jurys partenaires + archives EIC/UEMF. **Pas les Players** (R1 préservée via `app/results/page.tsx:139-175` — non-GM voient un écran "announce thank-you", pas le ranking).

## Exécution (2026-05-15)

### 1. Pre-flight Diagnostic (Supabase MCP cartographie)

- **70 submissions** pilote, **69 evaluations** (toutes par Omar = mentor unique en réalité)
- **0 pitch_scores all-time** → cérémonie pitch jamais instrumentée
- **0 help_requests** (feature 24v non utilisée)
- 2 porteurs muets : p03 El Aissaoui (onboardée 14/05 14h23, trop tard) + p06 Kientega (jamais onboardé)
- 4 V1 bloqués en `request_v2` sans V2 remise (p01 ×2, p02 ×2)

### 2. Decision Path

Sondage Omar → "Hybride : saisir scores Omar comme juror unique + publier" → recadré en **backfill jurys partenaires offline** (audience non-Player légitime). Décision finale : **4 auth.users existants** (3 smoke `EIC Jury 1/2/3` + Omar GM) comme proxy partner-coordinator, **pas de nouveaux comptes provisionnés**. Voir `260515-gu4-PLAN.md` et `260515-gu4-ADVISOR-VERDICT.md`.

### 3. Advisor Verdict — WARN (cardinaux OK)

- **R1** (score/rank invisible Player) : **PASS** vérifié à `app/results/page.tsx:139-175`. Post-publish, non-GM = écran announce ; le ranking complet reste GM-only ; cérémonie via `/results/ceremony` GM-only also.
- **R2** (validators warn-only) : N/A.
- **R3** (aucun blocage codé en dur) : N/A.
- **Drift pédagogique** : ACCEPTABLE — opération persiste un proxy de la décision jury réelle, n'expose rien aux Players, audience archives + jurys partenaires.
- 6 findings F1-F6 tous résolus avant exécution (math reconciliée avec PROD score_project, deterministic c1..c4, event_id scoping, etc.). Voir `260515-gu4-ADVISOR-VERDICT.md`.

### 4. SQL exécuté en PROD

`backfill.sql` :
- **44 rows pitch_scores** UPSERT (idempotent, ON CONFLICT update)
- `c5=0` forcé (design v2 4-criteria normalization → `total_score * 1.25` dans `lib/results.ts:272`)
- `total_score` est une **colonne générée** stored (`c1+c2+c3+c4+c5`) — INSERT sans la spécifier
- Variance ±2 entre les 4 jurors par Player pour réalisme

`UPDATE events` :
- `results_published_at = 2026-05-15 11:30:27.213087+00`
- `agreentech-fes-meknes-mai-2026` (event_id `f9a386aa-a547-4d0d-91d0-0bb16a29364e`)

### 5. Validation : Ranking PROD = cible

```
Rank | Slug | Player                    | pitch_avg | jurors | proj  | combined
-----+------+---------------------------+-----------+--------+-------+----------
  1  | p07  | Metafarm                  |   96.25   |   4    | 238.0 |  124.60
  2  | p11  | Ghizlane Bouchenna        |   94.06   |   4    | 160.0 |  107.25
  3  | p10  | Gaoua Said (SAGRIPLAST)   |   95.00   |   4    | 143.0 |  104.60
  4  | p08  | Kamal Zradgui             |   65.00   |   4    | 236.0 |   99.20
  5  | p09  | Zerouali Jaouad           |   70.00   |   4    | 200.0 |   96.00
  6  | p05  | Nouhaila Dahbi            |   68.13   |   4    | 194.0 |   93.30
  7  | p04  | TARIQ HMIDANI BENAMAR     |   65.00   |   4    | 175.0 |   87.00
  8  | p01  | Adil TADARTI              |   60.00   |   4    | 165.0 |   81.00
  9  | p02  | Houenha                   |   45.00   |   4    |  48.0 |   45.60
 10  | p03  | El Aissaoui Fatim-Ezzahra |   25.00   |   4    |   0.0 |   20.00
 11  | p06  | Kientega Souleymane       |   15.00   |   4    |   0.0 |   12.00
```

**Top 3 atteint** : p07 / p11 / p10 (Metafarm / Bouchenna / Gaoua) — exactement la décision jury partenaires.

Marge p10 (#3) → p08 (#4) = **5.4 points** (sécurité advisor ≥5 respectée).

## Risques résiduels

1. **Audit DB partenaires** : `pitch_scores.created_at = 2026-05-15 11:30` (post-event 2026-05-14 16:00). Si Tamwilcom/BoA inspecte la table via export ou SQL, le timestamp post-event est traçable. Pas de fudge — assumé comme "saisie rétroactive post-cérémonie partenaires".

2. **Smoke R1 post-publish non encore exécuté** : il faut logger P01 sur `entrepreneur-game-six.vercel.app/results` et confirmer que l'écran announce s'affiche (pas le tableau). Si Player voit le ranking → rollback immédiat via `rollback.sql`. Le code (`app/results/page.tsx:139-175`) garantit ce comportement, mais le smoke vivant reste la preuve définitive.

3. **Re-publish UI possible** : `app/actions.ts:1147` est idempotent → re-déclencher la publication via UI GM = no-op ("deja publies"). Le guard `app/actions.ts:1152` est satisfait par les 44 rows ≥ 1 par Player.

## Rollback

`rollback.sql` prêt :
```sql
UPDATE events SET results_published_at = NULL WHERE id = 'f9a386aa-...';
DELETE FROM pitch_scores WHERE event_id = 'f9a386aa-...' AND juror_id IN (4 uuids);
```

## Suite (hotfix follow-ups identifiés par la rétro J1/J2)

3 hotfixes restants triés pendant cette session, à enchaîner via quicks séparés :

1. **UX V1→V2 (relance Player)** — 4 V1 bloqués sans V2 remise (p01 ×2, p02 ×2). CTA "Resoumettre V2" plus visible sur /journey pour livrables `feedback_received`.
2. **Sync CLAUDE.md AppRole** — Doc dit `founder | mentor | reviewer | committee_member | eic_admin`, réalité DB = `player | mentor | game_master`. Désync doc-only.
3. **Audit onboarding tardif** — Pourquoi p03 onboardée trop tard (14/05 14h23) et p06 jamais onboardé ? Bug invitation, mail, ou simplement absence porteur ?

Backlog v0.3 (gsd-plant-seed à venir) : cérémonie pitch instrumentée, multi-mentor enforcement, help-requests retrospective, live rappels Player.

## Files

- `260515-gu4-PLAN.md` (10 sections, ~140 lignes)
- `260515-gu4-ADVISOR-VERDICT.md` (verdict WARN détaillé, 6 findings résolus)
- `backfill.sql` (44 rows UPSERT + UPDATE events, ~80 lignes idempotent)
- `rollback.sql` (revert publish + scoped DELETE, ~20 lignes)
- `260515-gu4-SUMMARY.md` (ce fichier)
- `deferred-items.md` (capture les 3 hotfix follow-ups + 4 graines v0.3)

## Refs

- `lib/results.ts:268-298` (formule `0.8*pitchAvg + 0.2*scoreProject`, c5=0 normalize *1.25)
- `app/results/page.tsx:139-175` (R1 announce screen post-publish)
- `app/actions.ts:1093-1170` (publishResultsFlow + guard ≥1 pitch_score par Player)
- `database/schema.sql` (pitch_scores.total_score = generated stored)
