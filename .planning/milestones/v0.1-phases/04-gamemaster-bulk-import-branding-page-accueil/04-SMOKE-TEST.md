# Phase 4 - GameMaster Smoke Test Checklist

**Status:** Template ready for manual GM walkthrough
**Auto-mode:** Tâche 2 du plan 04-06 auto-approuvée — checklist documentée pour exécution manuelle par l'opérateur (Omar) avant déploiement staging.
**Date du run:** _______________
**Operator:** _______________
**Commit / build:** _______________

## Pre-requisites

- [ ] `npm run dev` running on `http://localhost:3000` (or `:3001`).
- [ ] `.env.local` configured with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `SUPABASE_SERVICE_ROLE_KEY` recommended (otherwise step 5 reports `invitesSkipped`).
- [ ] At least one Supabase user with `app_role = 'game_master'` (GM credentials).
- [ ] An empty (or pristine) `hack-days-mai-2026` cohort attached to the latest event.
- [ ] Browser dev console open (catch hydration / runtime errors).

## Walkthrough (10 steps)

### 1. Anon root + login redirect
- Open private window → visit `http://localhost:3000/`.
- **Expected:** redirected to `/login` (server-side `redirectForRole()`).
- **Result:** [ ] PASS  [ ] FAIL — notes: _______________

### 2. Login partner banner
On `/login`, verify:
- [ ] EIC logo visible at top of card.
- [ ] Title "Entrepreneur Game".
- [ ] Subtitle "Hack-Days Fes-Meknes - 13 & 14 mai 2026".
- [ ] 6 partner logos visible in order: **Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace, EIC, UEMF**.
- [ ] Footnote caption: "En partenariat avec Tamwilcom, Bank of Africa Academy, Innov Invest, Bluespace - EIC / UEMF".
- [ ] No mention of "atlas-soil", "EIC Venture Journey", "demo".
- **Result:** [ ] PASS  [ ] FAIL — notes: _______________

### 3. Login as game_master
- Enter GM credentials → submit.
- **Expected:** redirected to `/admin`.
- **Result:** [ ] PASS  [ ] FAIL — notes: _______________

### 4. Cohort dashboard `/admin`
Verify:
- [ ] Header `Pilotage cohorte` with subtitle.
- [ ] 3 counters: `Livrables soumis ... sur ...`, `En attente revue`, `Valides`.
- [ ] Cohort table with one row per Player (or empty state `Aucun Player dans la cohorte. Importez un CSV pour demarrer.`).
- [ ] Action buttons: `Importer un CSV` and `Exporter players.csv`.
- **Result:** [ ] PASS  [ ] FAIL — notes: _______________

### 5. Import CSV (first run)
- Click `Importer un CSV` → `/admin/players/import`.
- Paste this 2-row CSV (or upload as file):
  ```
  team_name,project_name,project_pitch,leader_email,member_emails
  Equipe Test,Projet Test,Un pitch court,test+leader@example.com,test+member@example.com
  ```
- Submit.
- **Expected report:** `created=1`, `membersAdded=1 or 2`, `invitesSent=2` (or `invitesSkipped=2` if no `SUPABASE_SERVICE_ROLE_KEY`).
- **Result:** [ ] PASS  [ ] FAIL — notes: _______________

### 6. Idempotency (second run)
- Re-submit the SAME CSV.
- **Expected:** `created=0`, `alreadyExisted=1`, `membersAdded=0`.
- **Result:** [ ] PASS  [ ] FAIL — notes: _______________

### 7. Player detail
- Back to `/admin`, click on the new Player row.
- **Expected:** `/admin/players/<id>` shows team header (slug + status), member list (1-2 emails), section "Aucune soumission".
- **Result:** [ ] PASS  [ ] FAIL — notes: _______________

### 8. Export CSV
- Back to `/admin`, click `Exporter players.csv`.
- **Expected:** file `players.csv` downloads. First line is header. Rows readable in spreadsheet (RFC 4180 quoting).
- **Result:** [ ] PASS  [ ] FAIL — notes: _______________

### 9. Sidebar branding
- Verify EIC logo visible in sidebar on `/admin`, `/admin/players/import`, `/admin/players/<id>`.
- No "EIC Venture Journey" / "demo" wording anywhere in the shell.
- **Result:** [ ] PASS  [ ] FAIL — notes: _______________

### 10. 403 on export (anon)
- Open private window → hit `http://localhost:3000/admin/export/players.csv` directly.
- **Expected:** 403 Forbidden (not a download). _Note:_ if running in demo mode (no Supabase env), the route returns the header-only CSV by design.
- **Result:** [ ] PASS  [ ] FAIL — notes: _______________

## Automated checks (already green at plan close)

- [x] `npm run typecheck` — clean.
- [x] `npm run lint` — clean.
- [x] `npm run build` — success, 14 routes compiled (`/admin`, `/admin/players/[id]`, `/admin/players/import`, `/admin/export/players.csv`, `/login` static, `/onboarding`, `/journey`, `/mentor`, …).
- [x] i18n parity: 195 FR keys / 195 EN keys, zero divergence.
- [x] Anti-leak grep on `app/`, `components/`, `lib/`, `public/`: zero matches outside `lib/seed/*.ts` guard comments (intentional, never rendered).

## Sign-off

- [ ] All 10 manual steps PASS.
- [ ] Operator name + date: _______________
- [ ] Approved for staging deploy / Phase 5.

If any step fails → describe in the corresponding "notes" line and open a fix loop before progressing to Phase 5 (jury + deploy).
