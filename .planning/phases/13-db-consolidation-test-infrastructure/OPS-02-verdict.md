# OPS-02 — Verdict DIGI-08 (backfill pitch_scores event Digi)

**Date :** 2026-06-11
**Statut : PENDING-LIVE-CHECK** — décision pré-arbitrée, en attente d'une requête read-only PROD (les outils MCP Supabase n'ont pas pu être propagés dans les sessions du 11/06 malgré 4 tentatives OAuth + 1 restart ; voir Annexe pour la requête à exécuter au checkpoint).

## Question (héritée de v0.3, DIGI-08)

L'event **Digi-Hackathon** (20-22 mai 2026) a tenu sa cérémonie de pitch. Le seul publish documenté dans les artefacts est celui du **15/05** (quick `260515-gu4`) — qui concernait l'event **AgreenTech** (44 pitch_scores en proxy + `results_published_at`). Pour l'event Digi : des pitch_scores live ont-ils été saisis via `/jury` pendant l'event (le quick `260520-124-jury-v1v3` a livré le flow jury pendant J1) ? Les résultats Digi ont-ils été publiés ? Faut-il un backfill ?

## Éléments documentés (sans accès live)

- Post-mortem v0.3 (`2026-05-23-digi-hackathon-fixes-design.md`) : « DIGI-08 non satisfait : pas de backfill pitch_scores post-event avec les vrais scores live ; seul le publish pré-event du 15/05 via proxy existe. À confirmer côté PROD. »
- Le flow jury + pitch mode a été livré et smoke-testé pendant l'event (quicks `260519-jpr`, `260520-124`) — des saisies live sont donc **possibles** mais non confirmées.
- Audience des résultats : GM + jurys + archives (R1 : jamais les Players).

## Décision pré-arbitrée (à confirmer par la requête)

| Constat live (event slug ~ digi) | Verdict | Action |
|---|---|---|
| `ps_rows > 0` ET `results_published_at` non null | **SUFFICIENT** | Aucune action — clore DIGI-08. |
| `ps_rows > 0` ET `results_published_at` null | **PUBLISH-ONLY** | Publier (UPDATE `events.results_published_at`) après accord Omar — pas de backfill de scores. |
| `ps_rows = 0` | **OMAR-DECIDE** | Soit backfill proxy à la gu4 (pattern `backfill.sql` ON CONFLICT, gated Omar), soit clore en « cérémonie hors-app assumée » et documenter. v0.4 n'en dépend pas. |

**Rationale :** aucune perte de données possible dans les 3 cas (lecture seule par défaut, toute écriture gated Omar). La valeur archivistique des scores Digi est réelle mais non bloquante pour le moteur v0.4 — la grille jury paramétrable (Phase 16, JURY-08) préservera les classements archivés quel que soit l'état.

## Annexe — Requête de décision (read-only, SQL Editor Supabase)

```sql
select e.slug, e.results_published_at, e.pitch_mode_state, e.pitch_mode_closed_at,
       (select count(*) from pitch_scores ps where ps.event_id = e.id) as ps_rows,
       (select count(distinct ps.juror_id) from pitch_scores ps where ps.event_id = e.id) as ps_jurors
from events e
order by e.starts_at desc;
```

Une fois le résultat connu, mettre à jour ce fichier : remplacer PENDING-LIVE-CHECK par le verdict de la table ci-dessus + coller l'évidence.
