# PLAN — Quick 260519-jpr : pitch-mode + jurors table + replay refresh

**Date** : 2026-05-19
**Spec source** : `docs/superpowers/specs/2026-05-19-jury-pitch-replay-design.md` (v5, commit `a09c98d`)
**Tag de sécurité** : `v0.2.2-pre-pitch-mode-jpr` sur `a09c98d` (pushé)
**Convention** : approche A (single quick, 3 waves, 6-7 subagents)
**Commit pattern** : `(quick-260519-jpr) <type>: <scope>` — 3 commits atomiques prévus

## Découpe waves

### Wave 1 — DB + types (∥ 2 agents)

**Agent #1 — DB migration via MCP** (subagent_type=`gsd-executor`)
- Appelle `mcp__plugin_supabase_supabase__apply_migration` ×3 séquentiel :
  - Part A : table `jurors` + helper `is_juror(event_id)` + 2 policies
  - Part B : enum `pitch_mode_state` + colonnes `events` + trigger `set_pitch_mode_closed_at`
  - Part C : DROP 3 policies actuelles `pitch_scores` + CREATE 4 nouvelles (corrige faille)
- Valide via `mcp__plugin_supabase_supabase__execute_sql` : `SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('pitch_scores', 'jurors')` → attend 6 policies
- Écrit snapshot SQL dans `.planning/quick/260519-jpr-pitch-mode-replay/migrations/01-jurors-and-pitch-mode.sql` (text-only, traçabilité — pas appliqué depuis ce fichier)
- Aucun commit (DB-only)

**Agent #2 — Types + i18n** (subagent_type=`gsd-executor`)
- Edit `lib/types.ts` : ajout `PitchModeState` (string union) + `Juror` (4 champs camelCase)
- Edit `lib/i18n.ts` : ajout 16 keys FR (extraites du spec section 5.2)
- `npm run typecheck` doit passer
- Commit atomique : `(quick-260519-jpr) feat(types,i18n): PitchModeState + Juror + 16 keys`

**Commit consolidé W1** (orchestrateur, post-W1) : `(quick-260519-jpr) feat(db,types): jurors table + pitch_mode_state + i18n` (squash de l'agent #2 + ajout note migration DB SHA)

---

### Wave 2 — Backend + UI (∥ 3 agents)

**Agent #3 — Backend guards + actions** (subagent_type=`gsd-executor`)
- Nouveau `lib/pitch-mode.ts` (~90 lignes — code dans spec section 5.3)
- Nouveau `lib/jurors.ts` (~60 lignes — helpers `getJurorsForEvent`, `isCurrentUserJuror`, `addJurorByEmail`, `removeJuror`)
- Edit `lib/jury.ts` : early return `{ rows: [], notInvited: true }` si !juror
- Edit `lib/results.ts` : signature étendue `{ requesterRole, isJuror }`, utilise `canSeeFullRanking()`
- Edit `app/actions.ts` : +3 actions Zod (`setPitchModeStateFlow`, `addJurorFlow`, `removeJurorFlow`)
- `npm run typecheck` + `npm run lint`

**Agent #4 — UI jury theater** (subagent_type=`gsd-executor`)
- Refresh `components/jury-pitch-theater.tsx` : layout grid `[1fr_400px]` (split jury|pitch)
- Refresh `components/jury-pitch-grid.tsx` : sliders 0-20 + total live /100
- Refresh `components/jury-passage-queue.tsx` : cards statut « notée/en cours/à venir »
- Refresh `components/jury-pitch-timer.tsx` : visuel countdown
- Ajout bandeau ambre live + bandeau vert closed + garde not-invited
- Edit `app/jury/page.tsx` : passe `pitchModeState` + `notInvited`
- Référence mockup : `~/Downloads/Pitch en cours _ grille jury.html` (5 MB, ignorer images base64, analyse texte de l'agent Explore disponible dans le transcript)

**Agent #5 — UI results replay + ceremony** (subagent_type=`gsd-executor`)
- Refresh `components/results-replay.tsx` : sections verticales (hero / podium / stats / classement collapsible / timeline / exports)
- Refresh `components/results-podium.tsx` : hauteurs décroissantes 200/160/120 + anim stagger
- Refresh `components/results-stats-strip.tsx` : libellés revus
- Refresh `components/results-timeline-moments.tsx` : verticale
- Refresh `components/results-ceremony-screen.tsx` : background théâtre + reveal staggered 3→2→1 + confetti CSS + footer logos partenaires
- Refactor `app/results/page.tsx` : 4 branches selon matrice spec section 3
- Référence mockup : `~/Downloads/Replay _ cl_ture du hack.html`

**Commit W2** : `(quick-260519-jpr) feat(jury,results): pitch_mode visibility + UI refresh mockups`

---

### Wave 3 — GM tooling + provisioning + audit (sequential)

**Agent #6 — GM admin + CSV + script provisioning** (subagent_type=`gsd-executor`)
- Nouveau `components/admin-pitch-mode-toggle.tsx` (3 boutons segmentés + `confirm()`)
- Nouveau `components/admin-jurors-manager.tsx` (liste + ajout email + retrait)
- Edit `app/admin/page.tsx` : intégrer 2 nouveaux composants après `<AdminStatusBanner>`
- Nouveau `app/admin/export/results.csv/route.ts` (GM-only, gate `closed`, colonnes spec section 5.6)
- Nouveau `scripts/create-digi-hackathon-jurors.ts` (logique spec section 5.7, idempotent, append `cohorte-digi-hackathon-creds.csv`)
- Edit `CLAUDE.md` : corriger `AppRole` désync (3 rôles `player|mentor|game_master`)
- `npm run typecheck && npm run lint && npm run build`

**Provisioning auto** (orchestrateur, post-Agent #6) :
```bash
# Pré-check
SROLE=$(grep -c "^SUPABASE_SERVICE_ROLE_KEY=" .env.local)
if [ "$SROLE" -eq 1 ]; then
  npx tsx scripts/create-digi-hackathon-jurors.ts
  # Vérifier cohorte-digi-hackathon-creds.csv passe de 23 → 27 lignes
  test $(wc -l < cohorte-digi-hackathon-creds.csv) -eq 27 || echo "WARN: count != 27"
else
  echo "Skip provisioning : SUPABASE_SERVICE_ROLE_KEY absent"
fi
```

**Advisor** (subagent_type=`eic-pedagogical-advisor`)
- Audit R1 : grep Player/Mentor non-juror sur `/results` → 0 chiffre attendu
- Audit R2 : bandeaux `eic-locked-hint--amber`, pas d'`error`
- Audit R3 : aucun nouveau blocage inter-mission
- Produit `ADVISOR-VERDICT.md` : `OK` | `WARN with notes` | `BLOCK`

**Smoke local** (orchestrateur) — minimal 2P+1J+1M+1GM cf. memory `feedback_smoke_minimal_2p_1m_1gm` :
- npm run dev (port 3000)
- Login 1 Player → /journey OK, /results → écran « merci »
- Login J01 (créé par script) → /jury → vue théâtre, bandeau live ambre si state=live
- Login 1 Mentor non-juror → /jury → écran « pas invité »
- Login GM → /admin → toggle visible, AdminJurorsManager montre J01..J04
- Cycle off → live → closed → /results GM voit ranking, jury voit agrégé
- CSV : tenter `/admin/export/results.csv` avant et après `closed`

**Commit W3** : `(quick-260519-jpr) feat(admin,jurors): GM toggle + jurors manager + CSV + 4 jurys provisionnés`

---

## Critères d'acceptation par wave

### Post-W1
- [ ] Migration appliquée : 6 policies attendues dans `pg_policies` (jurors_gm_all, jurors_self_select, pitch_scores_select_visibility, pitch_scores_juror_self_insert, pitch_scores_juror_self_update, pitch_scores_gm_delete)
- [ ] `lib/types.ts` exporte `PitchModeState` + `Juror`
- [ ] `lib/i18n.ts` contient les 16 nouvelles keys
- [ ] `npm run typecheck` passe
- [ ] Snapshot SQL dans `.planning/quick/260519-jpr-*/migrations/01-jurors-and-pitch-mode.sql`

### Post-W2
- [ ] `lib/pitch-mode.ts` + `lib/jurors.ts` créés
- [ ] `lib/jury.ts` et `lib/results.ts` mis à jour (signatures étendues)
- [ ] `app/actions.ts` : 3 nouvelles actions
- [ ] Composants UI jury + results refresh (visuel cohérent mockups)
- [ ] `npm run typecheck && npm run lint && npm run build` passent

### Post-W3
- [ ] AdminPitchModeToggle visible dans `/admin`
- [ ] AdminJurorsManager visible et fonctionnel
- [ ] `/admin/export/results.csv` répond 403 hors `closed`, 200 OK en `closed`
- [ ] Script provisioning lancé → `cohorte-digi-hackathon-creds.csv` = 27 lignes
- [ ] 4 rows dans `auth.users` (J01..J04 @digi.uemf.ma) + 4 rows dans `jurors`
- [ ] Verdict advisor : OK ou WARN with notes
- [ ] Smoke 2P+1J+1M+1GM OK

## Rollback (si W1/W2/W3 échoue)

1. **DB rollback** : `mcp__plugin_supabase_supabase__execute_sql` avec :
   ```sql
   DROP POLICY "pitch_scores_select_visibility" ON pitch_scores;
   DROP POLICY "pitch_scores_juror_self_insert" ON pitch_scores;
   DROP POLICY "pitch_scores_juror_self_update" ON pitch_scores;
   -- Recréer les 3 policies originales depuis database/rls.sql:236-260
   ALTER TABLE events DROP COLUMN pitch_mode_state, DROP COLUMN pitch_mode_closed_at;
   DROP TRIGGER trg_set_pitch_mode_closed_at ON events;
   DROP FUNCTION set_pitch_mode_closed_at();
   DROP TABLE jurors;
   DROP FUNCTION is_juror(uuid);
   DROP TYPE pitch_mode_state;
   ```
2. **Code rollback** : `git reset --hard v0.2.2-pre-pitch-mode-jpr` (tag local pointe sur a09c98d)
3. **CSV rollback** : `head -n 23 cohorte-digi-hackathon-creds.csv > .tmp && mv .tmp cohorte-digi-hackathon-creds.csv`
4. **Auth users rollback** : `for email in jury-j0{1,2,3,4}@digi.uemf.ma; do supa.auth.admin.deleteUser(...); done` (manuel via MCP execute_sql sur auth.users)

## Estimation timing

| Wave | Agents | Estim |
|---|---|---|
| W1 | 2 ∥ | 30-45 min |
| W2 | 3 ∥ | 60-90 min |
| W3 | 1 + advisor + smoke | 30-45 min |
| **Total** | | **~2h-3h30** |

## Notes

- **MCP Supabase déjà configuré** : pointe sur PROD Digi-Hackathon (preuve usage récent : memory `project_msu_rls_status_propagation_fix.md` 2026-05-12).
- **SUPABASE_SERVICE_ROLE_KEY** : présent dans `.env.local` (vérifié 2026-05-19 via `grep -c` → 1).
- **Mockups HTML** : 5 MB chacun, images base64 inline à ignorer. L'analyse texte de l'agent Explore (transcript) suffit pour reproduire les sections + libellés FR.
- **Pas de feature flag** : la migration DB rend la garde immédiatement effective. Si Wave 2 plante en cours, /jury devient temporairement non-fonctionnel pour les mentors non-jurés (qui n'existent pas encore en jurors → bloqués). Pas d'impact car aucun mentor n'est invité comme juror pour Digi-Hackathon avant Wave 3.
- **Ordre strict** : W1 DB ASAP (les composants W2 dépendent du schéma) ; W2 backend → UI ; W3 GM tooling + provisioning en dernier.
