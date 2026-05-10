# Test fixtures - CSV imports

Fixture pour les tests d'import GameMaster (`/admin/players/import`) et le smoke E2E.

Format CSV requis (cf. `lib/admin-import.ts`) :

```
team_name,project_name,project_pitch,leader_email,member_emails
```

`member_emails` accepte plusieurs adresses separees par `;`. Champ optionnel.

## Fichiers

| Fichier | Lignes | Usage |
|---|---|---|
| `startups-2-teams-test-creds.csv` | 2 equipes | **Smoke E2E pret-a-coller** : 4 comptes `@test.local` (cf. `test-credentials.md` pour les passwords) |
| `test-credentials.md` | - | Table des 4 credentials test + procedure de pre-creation Supabase Auth + cleanup |

## Avant import en prod

- **`startups-2-teams-test-creds.csv`** : pre-creer d'abord les 4 comptes Supabase Auth ("Auto Confirm User" coche) selon `test-credentials.md`, puis coller le CSV. Aucun magic link n'est envoye (`@test.local` non routable). Login direct possible avec email + password.

## Resultat attendu

Pour `startups-2-teams-test-creds.csv` (apres pre-creation des 4 comptes Auth) :
- created=2, alreadyExisted=0
- membersAdded=4 (2 leaders + 2 members)
- invitesSent=0, invitesSkipped=0 (les 4 users existent deja -> pas d'invite)
- errors=[]

## Tests parser inline

```bash
npx tsx lib/admin-import.ts
```

Doit afficher `ALL TESTS PASSED` (6 tests).
