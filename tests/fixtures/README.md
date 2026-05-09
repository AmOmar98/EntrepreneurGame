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
| `startups-2-teams.csv` | 2 equipes | Smoke E2E sections 1-9 (Player A + Player B) |
| `startups-6-teams.csv` | 6 equipes | Repetition J-1 (12 mai 2026) - seuil >=6 testeurs internes |
| `startups-malformed.csv` | 6 lignes (4 erreurs attendues) | Test resilience parser : team vide, email invalide, leader duplique, quoting |

## Avant import en prod

**Remplacer les emails `*@example.com`** par les vraies adresses des testeurs avant de coller dans `/admin/players/import` (sinon les magic links partent dans le vide).

## Resultat attendu

Pour `startups-2-teams.csv` :
- created=2, alreadyExisted=0
- membersAdded=5 (2 leaders + 3 members)
- invitesSent=5 si service role configure, sinon invitesSkipped=5

Pour `startups-malformed.csv` (apres parser) :
- rows.length=3 (Test Valid, Test Bad Member avec member email purge, Test Quoted)
- errors >=3 (empty team_name, invalid leader_email, invalid member email)
- Test Dup Leader filtre par dedupeCsvRows (meme leader_email que Test Valid)

## Tests parser inline

```bash
npx tsx lib/admin-import.ts
```

Doit afficher `ALL TESTS PASSED` (6 tests).
