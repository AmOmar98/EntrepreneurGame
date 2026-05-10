# Quick Task 260510-lu5 — B3 RÉTRO : Migrations Phase 8 + 9 appliquées en PROD

**Date :** 2026-05-10
**Status :** Complete — PROD apply confirmée
**Bloquant T-3 :** B3 rétro CLAUDE.md (T-3 Critical Gates) — runtime crashes au 13/05 8h30 si non appliqué.

---

## Résultat exécution

```
Connecting to remote database...
Applying migration 20260510140000_phase08_mentor_comments.sql...
NOTICE (00000): policy "evaluation_comments_member_or_mentor_select" for relation "public.evaluation_comments" does not exist, skipping
NOTICE (00000): policy "evaluation_comments_mentor_self_insert" for relation "public.evaluation_comments" does not exist, skipping
NOTICE (00000): policy "evaluation_comments_gm_delete" for relation "public.evaluation_comments" does not exist, skipping
Applying migration 20260510140001_phase09_gamemaster_live.sql...
NOTICE (00000): policy "announcements_authenticated_select" for relation "public.announcements" does not exist, skipping
NOTICE (00000): policy "announcements_audience_select" for relation "public.announcements" does not exist, skipping
NOTICE (00000): policy "announcements_gm_insert" for relation "public.announcements" does not exist, skipping
NOTICE (00000): policy "announcements_gm_update" for relation "public.announcements" does not exist, skipping
NOTICE (00000): policy "announcements_gm_delete" for relation "public.announcements" does not exist, skipping
Finished supabase db push.
```

NOTICEs `does not exist, skipping` = sortie normale des `drop policy if exists` (1ère apply, idempotency confirmée pour re-apply futur).

---

## Migration history post-apply

```
   Local          | Remote         | Time (UTC)
  ----------------|----------------|--------------------
   20260508222155 | 20260508222155 | 2026-05-08 22:21:55  ← stub local (alignement)
   20260508222224 | 20260508222224 | 2026-05-08 22:22:24  ← stub local (alignement)
   20260510140000 | 20260510140000 | 2026-05-10 14:00:00  ← Phase 8 — appliquée 2026-05-10
   20260510140001 | 20260510140001 | 2026-05-10 14:00:01  ← Phase 9 — appliquée 2026-05-10
```

---

## DDL appliqué en prod

### Phase 8 (MNT-03 + MNT-04)
- `CREATE TABLE public.evaluation_comments` — async tagged comments, RLS member_or_mentor SELECT / mentor INSERT / GM DELETE
- 2 indexes : `evaluation_comments_submission_idx` + `evaluation_comments_author_idx`
- `ALTER TABLE public.evaluations ADD COLUMN expected_action text` (nullable)
- CHECK constraint `evaluations_expected_action_required_for_request_v2` (NOT VALID — pilot tolerant pour rows legacy)

### Phase 9 (GMR-04 .. GMR-09 / Agent 9A)
- `ALTER TABLE public.deliverable_templates ADD COLUMN is_active boolean NOT NULL DEFAULT true`
- Index partiel `deliverable_templates_active_idx WHERE is_active = true`
- `CREATE TABLE public.announcements` — append-only ledger, kind/target_kind/target_ids/body/title
- 2 indexes : `announcements_event_created_idx` + `announcements_kind_idx`
- 4 RLS policies : `announcements_audience_select` (audience-aware) + `gm_insert` + `gm_update` + `gm_delete`

---

## Toolchain résumé

| Étape | Commande | Result |
|---|---|---|
| Install CLI | `npm install -g supabase` | ❌ Refused by postinstall — Supabase official policy |
| CLI alternative | `npx supabase --version` | ✅ v2.98.2 (run-on-demand, no global install) |
| Init scaffolding | `npx supabase init` | ✅ `supabase/config.toml` créé |
| Stage migrations | copy + alignment stubs | ✅ 4 files in `supabase/migrations/` |
| Dry-run | `npx supabase db push --linked --password $DB_PWD --dry-run` | ✅ "Would push these 2 migrations" |
| Real push | `npx supabase db push --linked --password $DB_PWD` | ✅ "Finished supabase db push" |
| Verify | `npx supabase migration list --linked --password $DB_PWD` | ✅ 4 entries Local=Remote |

---

## Manual smoke pour Omar (post-apply, optionnel)

1. **Phase 8 sanity** : naviguer `/mentor/submission/[id]` (en tant que mentor, après qu'un Player a soumis V1) → vérifier que le composer commentaire fonctionne (POST → row insertée dans `evaluation_comments`). Et que le verdict "request_v2" exige `expected_action` (form lock sinon).
2. **Phase 9 sanity** :
   - `/admin/deliverables` → toggle is_active sur un template → check que le Player ne le voit plus dans `/journey`.
   - `/admin/announce` → composer une annonce kind=info target_kind=all → vérifier qu'elle apparaît dans le strip Player sur `/journey`.

---

## Sécurité — actions post-session

⚠️ **À FAIRE PAR OMAR** :
1. **Révoquer le Personal Access Token Supabase** : https://supabase.com/dashboard/account/tokens → trouver le token utilisé (commence par `sbp_ef279...`) → "Revoke". Le PAT et le DB password sont restés dans le contexte de conversation (loggé Anthropic) — révocation = mitigation propre.
2. **Reset DB password** (optionnel, sensibilité élevée) : Dashboard > Project Settings > Database > "Reset database password". À faire seulement si tu juges que le risque d'exposition justifie le reset.
3. Le repo ne contient AUCUN secret committé (`.env.local`, `.temp/` exclus).

---

## Bloquants T-3 status final

- [x] B1 rétro (R1 leak /results) — 260510-kpw
- [x] B2 rétro (pondération 20/80) — 260510-l3m
- [x] **B3 rétro (migrations Phase 8+9 prod) — 260510-lu5**
- [x] B4 rétro (seed AgreenTech) — 260510-l68
- [ ] B5 rétro (member_emails 11/11 "À COMPLÉTER") — operator/data gate, hors scope code
