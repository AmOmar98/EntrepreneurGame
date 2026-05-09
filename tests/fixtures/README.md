# Test fixtures - CSV imports

Fixtures pour le smoke test E2E (Phase 5) et les tests d'import GameMaster (`/admin/players/import`).

Format CSV requis (cf. `lib/admin-import.ts`) :

```
team_name,project_name,project_pitch,leader_email,member_emails
```

`member_emails` accepte plusieurs adresses separees par `;`. Champ optionnel.

## Fichiers

| Fichier | Lignes | Usage |
|---|---|---|
| `startups-2-teams.csv` | 2 equipes | Template smoke E2E sections 1-9 (placeholder `*@example.com` a remplacer) |
| `startups-2-teams-test-creds.csv` | 2 equipes | **Smoke E2E pret-a-coller** : 4 comptes `@test.local` (cf. `test-credentials.md` pour les passwords) |
| `startups-6-teams.csv` | 6 equipes | Repetition J-1 (12 mai 2026) - seuil >=6 testeurs internes (placeholders) |
| `startups-malformed.csv` | 6 lignes (4 erreurs attendues) | Test resilience parser : team vide, email invalide, leader duplique, quoting |
| `test-credentials.md` | - | Table des 4 credentials test + procedure de pre-creation Supabase Auth + cleanup |

## Avant import en prod

- **`startups-2-teams-test-creds.csv`** : pre-creer d'abord les 4 comptes Supabase Auth ("Auto Confirm User" coche) selon `test-credentials.md`, puis coller le CSV. Aucun magic link n'est envoye (`@test.local` non routable). Login direct possible avec email + password.
- **`startups-2-teams.csv` / `startups-6-teams.csv`** : remplacer les emails `*@example.com` par les vraies adresses des testeurs avant de coller dans `/admin/players/import` (sinon les magic links partent dans le vide).

## Resultat attendu

Pour `startups-2-teams.csv` (placeholder template) :
- created=2, alreadyExisted=0
- membersAdded=5 (2 leaders + 3 members)
- invitesSent=5 si service role configure, sinon invitesSkipped=5

Pour `startups-2-teams-test-creds.csv` (apres pre-creation des 4 comptes Auth) :
- created=2, alreadyExisted=0
- membersAdded=4 (2 leaders + 2 members)
- invitesSent=0, invitesSkipped=0 (les 4 users existent deja -> pas d'invite)
- errors=[]

Pour `startups-malformed.csv` (apres parser) :
- rows.length=3 (Test Valid, Test Bad Member avec member email purge, Test Quoted)
- errors >=3 (empty team_name, invalid leader_email, invalid member email)
- Test Dup Leader filtre par dedupeCsvRows (meme leader_email que Test Valid)

## Tests parser inline

```bash
npx tsx lib/admin-import.ts
```

Doit afficher `ALL TESTS PASSED` (6 tests).
