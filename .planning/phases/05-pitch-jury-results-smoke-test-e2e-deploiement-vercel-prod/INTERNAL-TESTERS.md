# Internal testers - Phase 5

Liste des 6-15 testeurs internes recevant un magic link pour la repetition la veille du pilote (12 mai 2026, J-1 du Hack-Days Fes-Meknes).

**Objectif** : valider, sur l'env Vercel prod + Supabase prod, que le flow magic link -> onboarding -> dashboard joueur fonctionne avec de vrais comptes Supabase Auth, avant l'ouverture aux 6-15 vraies equipes le 13 mai 8h30.

## Players

| # | Team name | Project name | Project pitch | Leader email | Member emails | Magic link envoye | Login confirme | Onboarding complete |
|---|-----------|--------------|---------------|--------------|----------------|-------------------|----------------|----------------------|
| 1 | Test Alpha | Projet Alpha | Pitch test 1 | omar.ameur98@gmail.com | | [ ] | [ ] | [ ] |
| 2 | Test Beta | Projet Beta | Pitch test 2 | | | [ ] | [ ] | [ ] |
| 3 | Test Gamma | Projet Gamma | Pitch test 3 | | | [ ] | [ ] | [ ] |
| 4 | Test Delta | Projet Delta | Pitch test 4 | | | [ ] | [ ] | [ ] |
| 5 | Test Epsilon | Projet Epsilon | Pitch test 5 | | | [ ] | [ ] | [ ] |
| 6 | Test Zeta | Projet Zeta | Pitch test 6 | | | [ ] | [ ] | [ ] |
| 7 | (optionnel) | | | | | [ ] | [ ] | [ ] |
| 8 | (optionnel) | | | | | [ ] | [ ] | [ ] |
| 9 | (optionnel) | | | | | [ ] | [ ] | [ ] |
| 10 | (optionnel) | | | | | [ ] | [ ] | [ ] |
| 11 | (optionnel) | | | | | [ ] | [ ] | [ ] |
| 12 | (optionnel) | | | | | [ ] | [ ] | [ ] |
| 13 | (optionnel) | | | | | [ ] | [ ] | [ ] |
| 14 | (optionnel) | | | | | [ ] | [ ] | [ ] |
| 15 | (optionnel) | | | | | [ ] | [ ] | [ ] |

## Mentors

| Email | Magic link envoye | Login confirme |
|-------|-------------------|----------------|
| | [ ] | [ ] |
| | [ ] | [ ] |

## GameMaster

| Email | Login confirme |
|-------|----------------|
| omar.ameur98@gmail.com | [ ] |

## Procedure d'invitation

1. **Remplir la table Players ci-dessus** : 6 lignes minimum, 15 maximum. Colonnes obligatoires : `Team name`, `Project name`, `Project pitch`, `Leader email`. `Member emails` est facultatif (CSV separe par `;`).

2. **Convertir en CSV** au format attendu par `lib/admin-import.ts` :
   ```csv
   team_name,project_name,project_pitch,leader_email,member_emails
   Test Alpha,Projet Alpha,Pitch test 1,omar.ameur98@gmail.com,
   Test Beta,Projet Beta,Pitch test 2,leader2@example.com,member1@example.com;member2@example.com
   ```

3. **Importer via /admin/players/import** (URL prod Vercel, connecte en GameMaster) :
   - Coller le CSV dans le textarea ou uploader le fichier.
   - Submit -> le report d'import (Phase 4 : `import_report_invites`) liste les magic links generes par Supabase Auth.
   - Cocher la colonne "Magic link envoye" pour chaque ligne du report.

4. **Mentor / GameMaster invitation** :
   - Mentor : creer manuellement dans Supabase Auth + UPDATE profiles SET app_role='mentor' WHERE user_id=...; envoyer magic link via Supabase Dashboard.
   - GameMaster : compte deja existant.

5. **Demander a chaque testeur** :
   - Cliquer le lien dans l'email.
   - Atteindre `/onboarding` -> completer le formulaire KYC.
   - Confirmer arrivee sur `/journey` (Player) ou `/jury` + `/results` (Mentor).

6. **Cocher "Login confirme"** apres confirmation manuelle (capture d'ecran ou message Slack).

## Status global

- [ ] >= 6 testeurs Players ont login confirme
- [ ] >= 1 Mentor a login confirme
- [ ] GameMaster login confirme (Omar)
- [ ] Repetition pilote 12 mai 2026 effectuee avec succes

## Notes

(Ajouter ici tout incident d'invitation, magic link non recu, bug onboarding, etc.)
