# Quick 260515-gu4 — Deferred Items

## Hotfix follow-ups (à enchaîner via quicks séparés)

1. **UX V1→V2 (relance Player)** — 4 V1 bloqués sans V2 remise (p01 ×2, p02 ×2 sur deliverable BMC + persona). CTA "Resoumettre V2" plus visible sur `/journey` pour livrables en statut `feedback_received`.
2. **Sync CLAUDE.md AppRole** — Doc dit `founder | mentor | reviewer | committee_member | eic_admin`, réalité DB = `player | mentor | game_master`. Désync doc-only, pas de risque code.
3. **Audit onboarding tardif** — Investigation : p03 El Aissaoui onboardée 2026-05-14 14h23 (event ends 16h00) → bug invitation / mail / absence ? p06 Kientega jamais onboardé → idea_seed null, current_level L0_diagnostic.

## Graines v0.3 (à semer via `gsd-plant-seed` séparé)

- **Cérémonie pitch instrumentée** : forcer la création d'au moins N pitch_scores via UI jury avant que `publish_results` soit accessible. Flow GM/jury robuste (live composer, real-time sync, persistance partielle).
- **Multi-mentor enforcement** : alerter quand 1 seul evaluator porte 100% des évals (signal de risque opérationnel). Dashboard GM "mentor coverage".
- **Help-requests retrospective** : feature 24v `FAB Call mentor` n'a pas servi (0 help_requests pendant J1/J2). Analyser pourquoi (FAB invisible ? formation porteurs ? bouton mal placé ?).
- **Live rappels Player** : notifications mail/in-app quand un porteur n'a rien soumis depuis X heures pendant un event actif (aurait évité le trou p03 onboardée à J2 14h23).

## Smoke à exécuter post-publish (NON encore fait)

- **R1 confirmation P01 PROD** : login P01 sur `entrepreneur-game-six.vercel.app/results` → confirmer écran announce (PAS le tableau ranking). Si Player voit le ranking → rollback via `rollback.sql`.
