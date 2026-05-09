# Test credentials - Smoke E2E sections 1-9

4 comptes test factices pour executer le smoke E2E sur prod (https://entrepreneur-game-six.vercel.app) sans solliciter de testeurs reels. Domaine `@test.local` non routable -> AUCUN magic link n'est envoye, pas de pollution mail.

## Comptes a creer manuellement dans Supabase Auth

Dashboard -> Authentication -> Users -> "Add user" -> "Create new user" -> cocher "Auto Confirm User" (skip email verification).

| # | Role | Team | Email | Password | Display name |
|---|------|------|-------|----------|--------------|
| 1 | Player Leader | Test Alpha | `alpha.leader@test.local` | `AlphaLead2026!` | Alpha Leader |
| 2 | Player Member | Test Alpha | `alpha.team@test.local` | `AlphaTeam2026!` | Alpha Team |
| 3 | Player Leader | Test Beta | `beta.leader@test.local` | `BetaLead2026!` | Beta Leader |
| 4 | Player Member | Test Beta | `beta.team@test.local` | `BetaTeam2026!` | Beta Team |

**Important** : "Auto Confirm User" doit etre coche - sinon Supabase exige le clic email de confirmation et `signInWithPassword` echoue en `Email not confirmed`.

## Pourquoi `@test.local` au lieu de Gmail+alias

- Domaine reserve RFC 6761 -> non routable -> pas de risque de bounce/spam
- Pattern deja utilise dans le projet (`mentor@test.local`, `gm@test.local`, cf. `RLS-TEST-RESULTS.md`)
- Aucune dependance a une boite mail externe -> Omar peut tester offline

## CSV d'import correspondant

`tests/fixtures/startups-2-teams-test-creds.csv` :

```csv
team_name,project_name,project_pitch,leader_email,member_emails
Test Alpha,AgriPilot,Solution agritech d'irrigation intelligente pour exploitations cerealieres,alpha.leader@test.local,alpha.team@test.local
Test Beta,EduFlow,Plateforme edtech collaborative pour etudiants UEMF,beta.leader@test.local,beta.team@test.local
```

## Procedure smoke § 1 (T8)

1. **Pre-creer les 4 comptes** dans Supabase Auth Dashboard (table ci-dessus, "Auto Confirm User" coche).
2. **Login GM** : https://entrepreneur-game-six.vercel.app/login -> `omar.ameur98@gmail.com` + `EICGame2026!HackDays` (rotater au 1er login).
3. Aller sur `/admin/players/import`.
4. Coller le CSV ci-dessus.
5. Submit -> attendu :
   - `created=2` (Test Alpha + Test Beta)
   - `alreadyExisted=0`
   - `membersAdded=4` (4 player_members lies)
   - `invitesSent=0` (les 4 users existent deja apres step 1)
   - `invitesSkipped=0`
   - `errors=[]`

Si `invitesSkipped > 0` : `SUPABASE_SERVICE_ROLE_KEY` n'est pas configure sur Vercel ; sans cle, les emails inconnus sont skipped au lieu d'inviter. Dans notre cas (users pre-crees step 1), ce n'est pas bloquant.

## Login Player apres import

- Player A (leader) : `alpha.leader@test.local` / `AlphaLead2026!` -> `/journey` (apres onboarding)
- Player A (member) : `alpha.team@test.local` / `AlphaTeam2026!` -> `/journey` (l'equipe est partagee)
- Player B (leader) : `beta.leader@test.local` / `BetaLead2026!` -> `/journey`
- Player B (member) : `beta.team@test.local` / `BetaTeam2026!` -> `/journey`

## Cleanup post-smoke (T17)

```sql
-- Supabase SQL editor :
delete from public.player_members where player_id in (
  select id from public.players where slug in ('test-alpha', 'test-beta')
);
delete from public.players where slug in ('test-alpha', 'test-beta');
delete from public.profiles where email in (
  'alpha.leader@test.local','alpha.team@test.local',
  'beta.leader@test.local','beta.team@test.local'
);
```

Puis Supabase Auth Dashboard -> Users -> supprimer les 4 comptes `*.test.local`.
