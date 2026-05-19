---
name: Phase 16 — Findings hors-scope découverts pendant T-01 ADV
phase: 16
gathered: 2026-05-11
status: documented — defer fix to post-Phase 16 (quick ou Phase 13/14)
---

# Phase 16 — Findings annexes

Ce fichier capture les **findings inattendus** découverts pendant l'exécution T-01 (audit adversarial inputs). Ils sont **hors-scope Phase 16** (M3 read-only audits) mais critiques pré-pilote AgreenTech 13-14/05.

## F-16-01 — Bug RLS `evaluation_comments` : mentor ne peut PAS commenter sa propre évaluation

**Sévérité** : 🔴 BLOQUANT pilote — casse le flow d'animation mentor pendant le bootcamp.

**Symptôme observé** (PROD, 2026-05-11 ~19:00 UTC, session M01) :
- M01 ouvre `/mentor/submission/<id>` d'une submission V1 SOUMIS de P11
- M01 crée une evaluation V1 avec verdict `request_v2` → ✅ **201 OK** (POST `/rest/v1/evaluations`)
- M01 tente d'ajouter un commentaire async via composer "remarque/à corriger" → ❌ **403 permission denied**
- Banner rouge affiché : `permission denied for table evaluation_comments`

**Reproduction (logs Supabase API)** :
```
POST | 403 | /rest/v1/evaluation_comments — author_user_id=8676f6c5-...c11d8 (M01)
GET  | 403 | /rest/v1/evaluation_comments?submission_id=eq.334d…c337 — 3× tentatives
POST | 201 | /rest/v1/evaluations — même M01, même submission → OK
```

**Hypothèse** : la policy RLS Phase 8 (`08-mentor-comments.sql`) exige probablement un lien `mentor↔team` (table `mentor_assignments` ou similaire) qui n'est pas peuplé en PROD pour la cohorte AgreenTech swarm. M01 a le `app_role=mentor` (sinon il ne pourrait pas créer d'évaluation) mais pas le link team-spécifique.

**Impact pilote 13-14/05** : pendant les ateliers Hack-Days, les mentors devront commenter les livrables (composer V2 du mentor "remarque" / "à corriger"). Si la RLS reste cassée → mentors muets côté async, dégrade massivement l'expérience pédagogique.

**Recommandation** : ouvrir un quick `/gsd-quick` avant 12/05 23h00 :
1. Lire la policy RLS actuelle : `select * from pg_policies where tablename='evaluation_comments';`
2. Comparer avec `database/migrations/08-mentor-comments.sql`
3. Si la policy attend un `mentor_assignments` row → soit peupler la table pour M01/M02 ↔ cohort AgreenTech, soit relaxer la policy pour `app_role='mentor'` global (acceptable pilote-grade).
4. Apply fix RLS via Supabase MCP `apply_migration`.

**Cardinaux préservés** : R1/R2/R3 — fix RLS est server-side, n'introduit pas de surface visible Player ni de gating bloquant.

## F-16-02 — V-15 ownership bypass impossible à tester via console JS

**Sévérité** : 🟢 INFORMATIONAL — pas un bug, juste une limitation de la méthode de test.

**Symptôme** : modification de `<input name="deliverableTemplateId" value=...>` via `document.querySelector(...).value = 'forged-uuid'` dans la console DevTools → la modif est **écrasée par le re-render React** dès que le state du formulaire change (ex: click radio "Coller du texte" → re-render → `value={prop}` réécrase).

**Vérification DB** : la submission test `a2a59a97-9a73-4aa1-821e-9483267b2160` a été enregistrée avec l'UUID **original** (`8bcd5217-3234-4c0d-8781-44a3e788e13f` — vrai livrable de P11), pas le UUID forgé. Aucune corruption.

**Conséquence** : V-15 marqué PASS-by-construction via audit statique :
- `app/actions.ts:240-250` ownership check via `player_members`
- FK constraint DB : `submissions_deliverable_template_id_fkey REFERENCES deliverable_templates(id) ON DELETE RESTRICT` (confirmé via `pg_constraint` query)
- RLS submissions par player_id

**Recommandation v0.3** : si besoin de tester V-15 réellement, utiliser curl avec session cookies extraits manuellement (cf. `scripts/adversarial-inputs-checklist.md` § "Procédure type curl") pour bypasser totalement la couche React.

## Données de test laissées en PROD

Une submission de test a été créée pendant T-01 mais n'a pas été cleanée (M3 acceptance criteria ne l'exige pas pour T-01 contrairement à T-02) :

| ID | Player | Template | proof_text | Statut |
|----|--------|----------|------------|--------|
| `a2a59a97-9a73-4aa1-821e-9483267b2160` | P11 (`7e11e547-...c47c`) | `8bcd5217-...e13f` (BMC 9 blocs) | `test ownership bypass adversarial check` | `submitted_v1` |

**Action recommandée** : si Omar souhaite cleanup avant pilote → `delete from submissions where id='a2a59a97-9a73-4aa1-821e-9483267b2160';` via Cloud Studio. Sinon laisser tel quel (submission légitime, ne polluera pas le ranking).

## Cross-références

- Logs Supabase API timestamps `1778498885..1778499073` (24h window pré-T-01 = activité E2E P11/M01)
- `database/migrations/08-mentor-comments.sql` (RLS evaluation_comments à auditer)
- `database/schema.sql` (FK constraint submissions confirmée)
- `app/actions.ts:240-273` (ownership check + duplicate V1 gate, audit statique)
