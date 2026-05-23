# Baseline snapshot — Quick 260523-hhy (RLS announcements)

**Date** : 2026-05-23
**Project Supabase** : `vzzbjxmfkmvqkaqxalhr` (Digi PROD)
**MCP status** : Supabase reconnecté (tick `OFF-PILOT-12h51-tick.md`), Vercel encore KO (non bloquant pour ce quick).

---

## 1. Policies `public.announcements` (pré-fix)

4 policies actuelles, **toutes restreintes à `{authenticated}`** :

| policyname | roles | cmd | qual |
|---|---|---|---|
| `announcements_audience_select` | `{authenticated}` | SELECT | `is_game_master() OR (is_mentor() AND target_kind IN ('all','mentors')) OR target_kind='all' OR (target_kind='level' AND EXISTS join player_members…) OR (target_kind='teams' AND EXISTS join player_members…)` |
| `announcements_gm_delete` | `{authenticated}` | DELETE | `is_game_master()` |
| `announcements_gm_insert` | `{authenticated}` | INSERT | `null` (USING omitted → WITH CHECK enforced ailleurs ?) |
| `announcements_gm_update` | `{authenticated}` | UPDATE | `is_game_master()` |

**Diagnostic** : aucune policy SELECT pour `anon`. Confirme la racine du faux positif RLS observé J1+J2 — le RSC initial Player (avant cookie session) interroge `announcements` en tant que `anon`, RLS refuse → log `permission denied for table announcements`.

---

## 2. Erreurs récentes (logs postgres, 24h)

### Erreurs cibles ce quick

- 2 × `ERROR: permission denied for table announcements` (timestamps 1779491137 et 1779488471 — 2026-05-22 fin J3 / matin J3, soit pendant clôture event)

### Erreurs hors scope (fix B)

- 2 × `ERROR: column "deliverable_slug" does not exist`
- 1 × `ERROR: column "created_at" does not exist`
- 1 × `ERROR: column s.template_id does not exist`

Toutes émises par `application_name=mgmt-api` (Supabase Studio polling). Non touchées par ce quick.

---

## 3. Advisors security baseline (pré-fix)

**Total** : 26 WARN.

### `function_search_path_mutable` (4)
- `public.set_updated_at`
- `public.guard_player_onboarding`
- `public.set_help_requests_updated_at`
- `public.set_pitch_mode_closed_at`

### `anon_security_definer_function_executable` (11)
- `current_app_role`, `fn_auto_eval_fiches_entretien`, `is_game_master`, `is_juror(p_event_id uuid)`, `is_mentor`, `is_my_player(p_player_id uuid)`, `on_evaluation_change`, `on_evaluation_engagement_change`, `on_submission_engagement_change`, `recalc_player_engagement(p_player_id uuid)`, `recalc_player_score(p_player_id uuid)`

### `authenticated_security_definer_function_executable` (10)
Mêmes functions sauf `fn_auto_eval_fiches_entretien` côté authenticated. (En réalité 11, je recompte : oui 11 listées par MCP, 10 différentes — `fn_auto_eval_fiches_entretien` est listé en authenticated aussi.)

### Cosmétique config Auth (1)
- `auth_leaked_password_protection` disabled

**Note** : aucun de ces advisors n'est touché par le quick C. Ils restent en baseline pour le quick D (fix advisors triple migration).

---

## 4. Critère de smoke post-fix

Après application de la policy `announcements_anon_select` :

- `pg_policies WHERE tablename='announcements'` doit retourner **5 lignes** (4 existantes + 1 nouvelle).
- La nouvelle ligne : `policyname='announcements_anon_select'`, `roles='{anon}'`, `cmd='SELECT'`, `qual='true'`.
- `get_logs(postgres)` à T+15 min : **0 nouvelle erreur** `permission denied for table announcements` (les 2 erreurs historiques resteront dans la fenêtre 24h jusqu'à expiration naturelle).
- Advisors security : doit toujours être 26 WARN (pas de nouvelle alerte introduite par la policy permissive `anon` SELECT).
