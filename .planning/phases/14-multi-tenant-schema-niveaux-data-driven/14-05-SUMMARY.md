---
phase: 14-multi-tenant-schema-niveaux-data-driven
plan: "05"
status: complete
requirements: [TENANT-01, TENANT-02, TENANT-04, LEVELS-02]
completed: 2026-06-11
executor: orchestrator-inline
---

# Plan 14-05 — PROD apply + vérification + mirror déclaratif : COMPLETE

## Task 1 — Apply PROD (checkpoint opérateur résolu par délégation CLI)

- Omar a autorisé l'agent à exécuter l'apply lui-même via le CLI Supabase authentifié (« tu peux le faire, tu as les autorisations »).
- Tag de sécurité `v0.4.0-pre-phase14-migrate` poussé avant apply.
- **Réparation d'historique préalable** (le push était bloqué) : 14 versions remote-only marquées `reverted`, 7 fichiers locaux pré-phase-14 déjà en PROD marqués `applied` (dont `20260519120000_jurors_and_pitch_mode` créé en phase 13). Dry-run post-repair = exactement les 4 migrations phase 14.
- `supabase db push --linked` : **4 migrations appliquées sans erreur** (NOTICEs idempotents seulement).

## Task 2 — Vérification (14-VERIFICATION.md, status: passed)

- TENANT-01 : organizations=1 (EIC), events=2 adoptés (backfill transactionnel).
- TENANT-03 : index unique partiel créé sans erreur → invariant ≤1 event actif prouvé.
- TENANT-02 : preuve structurelle (is_in_org secdef + 5 policies) — runtime multi-org déféré staging (mono-org, conforme plan).
- TENANT-04 : aucun UPDATE/DELETE de colonnes préexistantes dans les migrations ; volumes inchangés.
- LEVELS-02 : levels_v2=8=levels ; backfills text transactionnels (players=10, missions=13).
- SC-4 (W-1) : critère « plus d'enum PG » satisfait par la bascule du chemin de lecture ; colonnes enum dormantes, DROP différé post-juillet.
- Bonus : signal DIGI-08 — pitch_scores ≈ 0 rows (scénario OMAR-DECIDE pré-arbitré).

## Task 3 — Mirror déclaratif database/ (pattern Node-script autorisé — FLAGGED)

- **`database/schema.sql` et `database/rls.sql` modifiés via `scripts/mirror-phase14-declarative.cjs`** (le pattern autorisé par Omar — database/** est Write/Edit-deny pour les outils agent). Script committé et idempotent.
- Ajouts : organizations + events.organization_id/is_active + levels_v2 + colonnes text + index (schema.sql) ; is_in_org + grants + 5 policies (rls.sql — extraits verbatim de la migration).
- **Drift résiduel non traité (scope guard du plan)** : les 6 objets PARTIAL préexistants (jurors, help_requests, announcements, evaluation_comments, is_active templates, pitch_order) restent hors vue déclarative — reconciliation = chantier séparé (noté depuis OPS-01).
- Gate : typecheck ✅ lint ✅ test:unit 16/16 ✅ (e2e via CI au push).

## Items ouverts (non bloquants, regroupés)

1. Spot-checks runtime : NULL-counts exacts + recompute classements archivés (requêtes dans 14-05-PLAN Task 1).
2. DIGI-08 : `select count(*) from pitch_scores` exact + décision Omar (scénario 3 probable).
