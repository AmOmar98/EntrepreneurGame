# Rétrospective T-3 — Pilote AgreenTech 13-14 mai 2026

> **Date** : 2026-05-10 (T-3 jours)
> **Scope** : derniers ~60 commits, artefacts `.planning/quick/260510-*`, smoke E2E v0.2, alignement pédagogique EIC.
> **Synthèse de 4 agents** : git-history · planning-docs · qualité/smoke · eic-pedagogical-advisor.
> **À lire avant chaque session jusqu'au 14/05 soir.** Les items 🔴 sont **BLOQUANTS** pour le go-live.

---

## 🔴 BLOQUANTS — à patcher avant le 13/05 8h30 (ou avant J2 17h pour /results)

| # | Item | Fichier:ligne | Trigger | Effort |
|---|------|---------------|---------|--------|
| **B1** | **R1 percée sur `/results`** : `combined.toFixed(1)` rendu à **tous les rôles** authentifiés post-publication. Honte directe devant Tamwilcom/BoA/Innov Invest/Bluespace pour les 6 non-lauréats. | `components/results-podium.tsx:64-66`, `components/results-replay.tsx:126-134` | Gater sur `isGameMaster` ; remplacer côté Player par annonce qualitative (3 Excellence + 2 Trajectoire + 2 Wildcards, sans chiffres). | 2h |
| **B2** | **Pondération 20/80 non implémentée** — `DEFAULT_PITCH_WEIGHT = 0.5`. Lauréats annoncés J2 17h selon mauvaise formule, contestation possible. | `lib/results.ts:30` | Passer à `0.8` ou propager `pitchWeight: 0.8` depuis `app/results/page.tsx`. | 1h |
| **B3** | **Migrations SQL Phase 8 + 9 non appliquées en prod Supabase** — `addEvaluationCommentFlow` et `/admin/announce` crashent runtime au 13/05 8h30. | `database/migrations/08-mentor-comments.sql`, `database/migrations/09-gamemaster-live.sql` | Apply via Supabase dashboard SQL editor + verify RLS announcements (`target_kind='teams'` post-`8352ffc`). | 30min |
| **B4** | **7 missions AgreenTech absentes du seed** — porteurs verront missions génériques (`L1 Probleme & Personae` etc.) au lieu de `L1 hypothèse VP / L2.1 Persona / L2.2 Verbatims / L3 MoSCoW / L4 ROI/ha / L5 Plan acquisition / L6 Pitch + Bonus B`. Décalage avec animation mentor et brief AAP envoyé. | `database/seed_event_hackdays.sql` | Régénérer avec les 7 missions + rubric AgriTech (Innovation/Faisabilité/Modèle éco/Qualité × 5pts) + bonus B. | 3-4h |
| **B5** | **`member_emails` "À COMPLÉTER" sur 11/11 lignes** — magic links bulk impossible sans collecte préalable. | `EIC-MANAGER-ANSWERS-AGREENTECH.md:22` | Demande aux porteurs / Fatimaezzahra avant 12/05 23h. | 1h ops |

---

## ✅ Worked — patterns à pérenniser

- **Cadence GSD** : Phases 7+8+9 livrées avec PLAN → execute atomique → `VERIFICATION.md` (`5fa44c7` 9/9, `711b3ab` 6/6, `52165f6` 8/8 PLR).
- **Commits atomiques scopés** : préfixes `(06)/(07)/(08)/(09)/(db)`, ID `quick-260510-XXX`. Lecture `git log` lisible.
- **Garde-fous EIC actifs** : R1/R2/R3 invoqués explicitement (`1291f94` rubric pts cachés, `4733406` switch hard-stop → ambre warn-only, `25f830e` retire `disabled` DOM). L'advisor `eic-pedagogical-advisor` a recadré au moins 2 patches (banner L3 hard-stop démonté).
- **Code review v0.2** : 28 commits / 63 files audités (`REVIEW-V02.md`), REV-HIGH-01 (column drift `lib/admin-live.ts`) + REV-HIGH-02 (RLS leak announcements) **fixés** (`8352ffc`). Bug DB silencieux attrapé avant prod.
- **Smoke E2E full-auto Chrome DevTools MCP** : 12 surfaces / 0 erreur / 24 screenshots versionnés (`bcb7162`, `e0ec2ef`).
- **Audits a11y/perf rétro** : tap-targets ≥44px (`02fe09d`), reduced-motion guard (`9b613db`), modal autoFocus (`39accc0`), no-Realtime grep clean.
- **Protocole orchestrator quick** `YYMMDD-XXX-slug` + 4 artefacts (PLAN / AUDIT / ADVISOR-VERDICT / SUMMARY) + `deferred-items.md` — 4 quicks propres en 1 jour (heu, hzv, iee, j2j).
- **Protocole EIC manager Q&A** : `EIC-MANAGER-QUESTIONS.md` court (89 lignes, MUST/NICE) + `ANSWERS-AGREENTECH.md` long (387 lignes argumentés) + `T3-IMPROVEMENTS.md` checklist code → chaîne traçable Q→arbitrage→tâche.
- **Dual-mode demo systématiquement vérifié** dans chaque advisor verdict (interdiction d'edit `lib/types.ts`, `app/actions.ts`, `database/`, `utils/supabase/` sans gate).

## ❌ Didn't — à corriger ou ne plus refaire

- **Régression dual-mode demo** : `app/journey/page.tsx:27-30` appelle `getCurrentUser()` puis `redirect("/login")` avant le check seed → **9/12 surfaces v0.2 NON testables visuellement** sans Supabase. Contrat CLAUDE.md « fully navigable without backend » cassé.
- **Banner L3 rouge ajouté au design v2 (8/05) puis retiré 2 jours plus tard** : `EIC-MANAGER-ANSWERS-AGREENTECH.md:191` (variant `E.bloqué` + banner rouge) contredisait R3 énoncé 100 lignes plus haut. Quick `260510-j2j` a dû le démonter (3 commits, 5 fichiers). Symptôme d'un design v2 conçu **avant** figeage des règles cardinales.
- **Pattern UI guidé v2** (`phrase_a_trous`, `fiche_structuree`, `cartes_repetables`, `moscow_prototype`) **absent du code** — ne reste que texte libre + URL pour les Players. Mentor débordé en review de 77 blobs creux.
- **Bonus AAP (+5/+2/+3) jamais calculés** dans `lib/score.ts` ; B5 (classements Excellence + Trajectoire) absent ; C4 (lettre retour jury PDF) inexistant — 6 non-lauréats sans canal officiel de feedback chiffré.
- **Drift de scope vers v0.3** : `1b0f1c2` SEED-001 v0.3 schemas refacto planté à T-3, `dfe15d3` rename `TODO Phase 8 → TODO v0.3` (TODOs Phase 8 livrée mais codés à moitié). Distraction mentale.
- **Aucun test unitaire/intégration committé** — pas de jest/vitest/playwright. Logique XP/score/journey-progression repose sur lecture humaine. REV-HIGH-01 (column drift) attrapé par review humaine, pas par CI.
- **CLAUDE.md sync tardif** (`bedf685`, T-3) : helpers fantômes (`bonusRules`, `committeeDossierRows`) traînaient depuis Phase 6-9.
- **Findings smoke 2026-05-09 pendants** : Finding 2 (libellé "Soumission V1" hardcoded `components/submission-readonly.tsx`) + Finding 3 (doc SMOKE-TEST-E2E.md 5 critères vs seed 4) NOT FIXED.
- **Console-log-auth.txt warnings** : 2× Next/Image LCP `/brand/logo-eic.svg` sans `priority` + ratio cassé. Cosmetic mais above-the-fold.

## 🛠️ How-to — conventions opérables

1. **Avant tout edit zone Player-facing** (`app/journey/`, `app/onboarding/`, `app/mission/`, `app/jury/`, `app/results/`, `components/results-*`, `components/submission-*`) → spawn `eic-pedagogical-advisor`.
2. **Audit grep R1 obligatoire** post-edit : `grep -rn "score\|rank\|note\|/100\|/140\|points\|toFixed" app/journey app/results components/results-* components/submission-* --include="*.tsx"`.
3. **Severity de validators figée à `"warn"`** (R2). `"error"` doit lever review humain.
4. **Aucun `disabled` DOM ni `blocks_progression_to` actif** sur les nodes mission (R3) — utiliser `eic-locked-hint--amber` / tooltip ambre.
5. **Convention orchestrator quick** `.planning/quick/YYMMDD-XXX-slug/` avec PLAN / AUDIT / ADVISOR-VERDICT / SUMMARY / deferred-items.
6. **VERIFICATION.md par phase** avec count must-haves + human gates.
7. **Smoke E2E Chrome DevTools MCP** post-phase (template `.env.local.bak` + restore garanti).
8. **Format Q&A asymétrique** : QUESTIONS court (MUST/NICE) + ANSWERS long argumenté + T3-IMPROVEMENTS checklist code.

## ⚠️ Risks (T-3 jours)

- **Vélocité** : 28+38 commits sur 09-10/05 (dont 4h sommeil 03:26→12:44). REV-HIGH-01 column drift est exactement le type de bug qui passe à 02:58.
- **Aucun test régression auto sur server actions** — à T-3, **freeze feat()** et passer en mode test+smoke.
- **`260510-iee` A1+A4** ajoutent 264 lignes (`use-auto-save.ts` + `field-completion-counter.tsx` + DOM walker + MutationObserver) sans test → risque hydration mismatch / SSR / quota localStorage.
- **6 gates Omar humains pendants** (cités `8ac2822`) : 2 SQL migrations + visual review prod + smoke régression + Lighthouse + cleanup. Hors GSD, leur absence ne bloque pas le workflow autonome → piège classique.
- **Pas de CI** — typecheck/lint/build manuels, dépendance browser MCP pour vérifier visuellement.
- **9/12 surfaces v0.2 jamais vues visuellement en demo** — Omar doit re-smoke prod avec 3 sessions player/mentor/gm.
- **Aucun monitoring prod live** — pas de Sentry/LogRocket. Si crash Hack-Days, debug post-mortem only via Vercel logs.
- **RLS pilot-grade pas re-validé post-grants service_role** (commit `7bcf666`) — risque drift avec migrations 08+09.
- **Logos partenaires SVG non livrés** : 6 placeholders texte en prod.
- **Wifi salle non testé** (planifié 12/05 14h) : 3 missions sur 7 (L3, L4, L6) dépendent URL externe Canva/Drive.
- **A2/A3/A5/B1/B3/B4/B5 + page `/jury` C1-C4 majoritairement à 0** dans `T3-IMPROVEMENTS.md:285-294`.
- **Convention ASCII** étendue par erreur aux libellés UI mission (`Probleme`, `Marche`, `Couts`) → perception "pas pro" côté Tamwilcom. À arbitrer : ASCII réservé à mailto/CSV, UTF-8 pour UI.

---

## Ordre d'attaque T-3 recommandé (lun 11/05 → mar 12/05 23h)

1. **(30min)** B3 — Apply migrations 08 + 09 sur Supabase prod, vérifier RLS announcements.
2. **(1h)** B2 — `lib/results.ts:30` `DEFAULT_PITCH_WEIGHT = 0.8` + audit appelants.
3. **(2h)** B1 — Gater `ResultsReplay` + `ResultsPodium` sur `isGameMaster` ; créer `ResultsAnnouncement` qualitatif côté Player.
4. **(3-4h)** B4 — Régénérer `seed_event_hackdays.sql` avec 7 missions AgreenTech + bonus B + rubric AgriTech.
5. **(1h ops)** B5 — Collecte `member_emails` 11/11 lignes.
6. **(2h)** Re-smoke prod avec 3 sessions player/mentor/gm post-migrations.
7. **(1h)** Décisions Omar : (a) lettre retour jury C4 = scope pilote ou +24h post-J2 ? (b) ASCII vs UTF-8 libellés mission ?
8. **Freeze feat()** : pas de SEED-001 v0.3, pas de refacto v0.3, pas de A2/A3 si non-bloquant. Tag `v0.2.0`, branche `v0.3-seeds` parquée.
9. **(30min)** Bloquer slot calendaire pour les 6 gates humains avant le 13.

---

## Sources

- Agent A (git-history) : 60 derniers commits, 27 feat / 13 docs / 6 chore / 5 fix / 3 test.
- Agent B (planning-docs) : `T3-IMPROVEMENTS.md`, `EIC-MANAGER-Q/A`, `Frontend-Recap-v2-Design-Brief.md`, `.planning/quick/260510-{heu,hzv,iee,j2j,jm8}/`, `STATE.md`, `REVIEW-V02.md`.
- Agent C (qualité/smoke) : `SMOKE-V02-AUTO.md`, `PLAN-SMOKE-V02-AUTO.md`, `REVIEW-V02.md`, `screenshots/phase-06-smoke/`, `.planning/ui-reviews/`, mémoires `project_smoke_findings`/`project_v02_status`.
- Agent D (eic-pedagogical-advisor) : EIC manager Q&A, T3-IMPROVEMENTS, `lib/results.ts`, `lib/score.ts`, `app/results/`, `app/jury/`, `components/results-*`, `database/seed_event_hackdays.sql`, mémoires `feedback_eic_cardinal_rules` + `project_agreentech_pilot`.
