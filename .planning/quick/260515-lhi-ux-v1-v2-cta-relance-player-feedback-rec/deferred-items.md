# Quick 260515-lhi — Deferred Items

## Aucun item différé pour ce quick

Le fix est complet et atomique (3 lignes effectives + 2 clés i18n × 2 locales). Tous les `must_haves` du PLAN ont été livrés.

## Suite de la rétro pilote (héritée de 260515-gu4)

Les 2 autres hotfixes post-pilote restent à enchaîner via quicks séparés :

1. **Sync CLAUDE.md AppRole** — Doc dit `founder | mentor | reviewer | committee_member | eic_admin`, réalité DB = `player | mentor | game_master`. Désync doc-only, pas de risque code. Quick docs simple ~5 min.
2. **Audit onboarding tardif p03/p06** — Investigation : p03 El Aissaoui onboardée 2026-05-14 14h23 (event ends 16h00) → bug invitation/mail/absence ? p06 Kientega jamais onboardé (idea null, current_level L0). Lecture-seule ~15 min.

## Backlog v0.3 (à semer via `gsd-plant-seed` séparé)

- Cérémonie pitch instrumentée
- Multi-mentor enforcement
- Help-requests retrospective
- Live rappels Player inactifs pendant event
