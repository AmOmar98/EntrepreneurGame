# Milestones — Entrepreneur Game

Changelog des milestones livrés. Détails dans `milestones/<vX.Y>-MILESTONE-AUDIT.md`.

---

## ✅ v0.3 Digi-Hackathon (livré 2026-05-23)

**Goal livré** : Pilote Digi-Hackathon 3 jours (20-22 mai 2026) sur base PROD AgreenTech restructurée 13 livrables alignés 8 PDFs Welcome Guide. Event 0 downtime, 1 hotfix mineur, R1/R2/R3 préservés.

**Tag** : `v0.3-pilot-shipped`

**Mode** : T-1 (zéro phases formelles, ~20 quicks via `.planning/quick/`).

**Score** : 8/9 DIGI requirements satisfaits + DIGI-09 via audit. DIGI-08 (backfill post-event) deferred v0.4.

**Tech debt v0.4** : Catégorie B post-mortem (schema drift mgmt-api Studio cleanup).

- Audit : `milestones/v0.3-MILESTONE-AUDIT.md`
- Roadmap archive : `milestones/v0.3-ROADMAP.md`
- Requirements archive : `milestones/v0.3-REQUIREMENTS.md`

---

## ✅ v0.2 EIC Design v2 Refresh (livré 2026-05-11)

**Goal livré** : Refonte visuelle complète design v2 EIC + AppShell + Login branded + parcours Joueur/Mentor/GameMaster repensés sur base v0.1 pilot-ready.

**Tag** : `v0.2-pilot-ready` (commit `ccdc2bc`)

**Scope** : 4 phases (Design System / Joueur / Mentor / GameMaster), 26 plans, 23 requirements (DSY×7 + PLR×8 + MNT×6 + GMR×9), 33 commits.

**Post-livraison** : pilote AgreenTech 13-14 mai 2026 exécuté avec succès. MSU RLS fix `f9939b4` propagation verdict→submissions livré 2026-05-12.

- Audit : `milestones/v0.2-MILESTONE-AUDIT.md`
- Roadmap archive : `milestones/v0.2-ROADMAP.md`
- Requirements archive : `milestones/v0.2-REQUIREMENTS.md`
- Review archive : `milestones/v0.2-REVIEW.md`
- Smoke archives : `milestones/v0.2-SMOKE-AUTO.md`, `milestones/v0.2-PLAN-SMOKE-AUTO.md`

---

## ✅ v0.1 Pilot Hack-Days Fès-Meknès (livré 2026-05-08)

**Goal livré** : Plateforme fonctionnelle pour pilote 13-14 mai 2026 (auth, onboarding, journey, submissions, mentor evaluation, jury, results), Supabase + Vercel déployé.

**Tag** : `v0.1-pilot-ready` (commit `8176419`)

**Scope** : 5 phases (Foundation / Player / Mentor / GameMaster / Pitch+Deploy), 26 plans.

- Audit : `milestones/v0.1-MILESTONE-AUDIT.md`
- Phases archive : `milestones/v0.1-phases/`
