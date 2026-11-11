# Quick Task `261111-iwb` — Archive Historical Data, Complete UX-01/DATA-01/EVT-01 & Provision Bootcamp Idea'Wave (16–17 Nov 2026)

- **Date :** `2026-11-11`
- **Branche :** `milestone/v0.4-scale-foundation` → `main`

## 1. Archivage Intégral Pré-Idea'Wave
- Export JSON complet de toutes les tables publiques du projet Supabase `vzzbjxmfkmvqkaqxalhr` dans `.planning/exports/archive-pre-ideawave-2026-11-11/full-dump.json` (hors-Git / RGPD, `132 598 octets`, `SHA-256: 7aa57111e2a383dd042b8143889f18ee8a48fb53ce220f1f826bfad08b517042`).
- Manifeste structurel sans PII versionné dans `.planning/ops-ledger/archives/ARCHIVE-20261111-pre-ideawave.md`.
- Désactivation (`is_active = false`) de `hack-days-fes-meknes-mai-2026` sans suppression d'aucune ligne historique (10 équipes, 50 soumissions, 42 évaluations conservées intactes en lecture seule aux côtés de `agreentech-fes-meknes-mai-2026`).

## 2. Correctifs P0/P1 (`UX-01`, `DATA-01`, `EVT-01`)
- **`UX-01` (`hooks/use-auto-save.ts`, `components/submission-form.tsx`, `components/revision-panel.tsx`, `app/journey/deliverable/[id]/page.tsx`) :**
  - Clé de brouillon `localStorage` isolée par `(playerId, deliverableTemplateId, version)` via `buildDraftStorageKey` (avec migration transparente depuis l'ancienne clé `eg_draft_<id>`).
  - Restauration de l'état React contrôlé (`kind`, `proofUrl`, `proofText`) au montage + flush automatique au démontage.
- **`EVT-01` (`lib/player-membership.ts`, `lib/journey.ts`, `app/journey/page.tsx`, `app/journey/deliverable/[id]/page.tsx`, `app/onboarding/page.tsx`, `app/actions.ts`, `lib/announcements.ts`, `lib/help-requests.ts`, `lib/cohort-pulse.ts`, `lib/pitch-prep.ts`) :**
  - Résolution multi-événements (`resolveActivePlayerIdForUser`) qui sélectionne en priorité le `player_id` rattaché à l'événement actif (`events.is_active = true`).
  - Lookup du prérequis `prep-questions-v1` (exception R3 `fiches-entretien-v1`) scopé en priorité sur le `mission_id` courant pour éviter toute collision entre événements.
  - Exposition et affichage dynamique de `xpFirstSubmission` (depuis `event_settings`) sur le hero de `/journey`.
- **`DATA-01` (`app/actions.ts`) :**
  - `activateEventFlow` : vérification préalable de l'événement cible et restauration automatique de l'ancien événement actif si l'étape d'activation échoue.
  - `cloneEventFlow` : helper de nettoyage complet `rollbackPartialClone` en cas d'erreur intermédiaire + clonage de `event_settings` et `pitch_criteria`.
  - `evaluateSubmission` : réconciliation idempotente de `submissions.status` si la ligne `evaluations` existe déjà suite à un essai précédent interrompu.

## 3. Provisioning Bootcamp Idea'Wave (16 & 17 Novembre 2026)
- Événement créé et activé en base (`vzzbjxmfkmvqkaqxalhr`) :
  - `id = 7d553162-1c1e-44d9-9845-9f7b1c58f619`
  - `slug = ideawave-bootcamp-nov-2026`
  - `starts_at = 2026-11-16T08:30:00+01:00`, `ends_at = 2026-11-17T18:00:00+01:00`
  - Cohorte `cohorte-ideawave-nov-2026`, `event_settings` par défaut, 4 `pitch_criteria`, 7 missions planifiées sur les 16 et 17 novembre 2026, et 15 `deliverable_templates` EIC.
- Outillage & documentation : `database/seed_ideawave_bootcamp_nov2026.sql`, `scripts/provision-ideawave-bootcamp.mjs`, `docs/IDEAWAVE_BOOTCAMP_16_17_NOV.md`.
