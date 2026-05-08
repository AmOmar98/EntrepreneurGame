# Phase 2 Smoke Test E2E - Procedure Manuelle

**Auteur :** Phase 2 Plan 05
**Cible :** Omar (solo dev) - executable seul, sans relire les plans
**Duree estimee :** 25-35 minutes
**Date de validation cible :** avant le 13 mai 2026 8h30 (premier login Player)

---

## Prerequis

### Infra Supabase prod

- [ ] Projet Supabase prod cree, env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans Vercel.
- [ ] Schema applique dans cet ordre via Supabase SQL Editor :
  1. `database/schema.sql`
  2. `database/triggers.sql`
  3. `database/rls.sql`
  4. `database/seed_event_hackdays.sql` (idempotent : 1 event + 1 cohort + 6 missions + 9 deliverable_templates)
- [ ] **NE PAS** appliquer `database/seed_bootcamp.sql` en prod.

### Comptes de test

Cree manuellement via Supabase Auth (Auth -> Users -> Add user) :

- [ ] **GameMaster** : `gm-test@example.com` / mot de passe au choix
  - Dans `profiles` : `app_role = 'game_master'`, `full_name = 'GameMaster Test'`
- [ ] **PlayerA** : `player-a@example.com` / mot de passe au choix
  - Dans `profiles` : `app_role = 'player'`, `full_name = 'Player A Test'`
- [ ] **PlayerB** : `player-b@example.com` / mot de passe au choix
  - Dans `profiles` : `app_role = 'player'`, `full_name = 'Player B Test'`

### Players factices et memberships

```sql
-- Recuperer la cohort_id (issue de seed_event_hackdays.sql)
select id from cohorts where slug = 'cohort-pilote' limit 1;
-- => COHORT_ID

-- Player A
insert into players (cohort_id, name, idea, current_level)
values ('COHORT_ID', 'Player A pre-onboarding', null, 'L0_diagnostic')
returning id;
-- => PLAYER_A_ID

-- Player B
insert into players (cohort_id, name, idea, current_level)
values ('COHORT_ID', 'Player B pre-onboarding', null, 'L0_diagnostic')
returning id;
-- => PLAYER_B_ID

-- Memberships
insert into player_members (player_id, user_id, role)
values
  ('PLAYER_A_ID', 'AUTH_USER_ID_A', 'lead'),
  ('PLAYER_B_ID', 'AUTH_USER_ID_B', 'lead');
```

(Recuperer `AUTH_USER_ID_A` et `_B` dans `auth.users` apres creation des comptes.)

### Verifier l'app demarree

- [ ] Deploy Vercel a jour (`master` push).
- [ ] URL prod accessible (ex. `https://entrepreneur-game.vercel.app`).
- [ ] `/login` rend le formulaire email/password.

---

## Scenario A - Onboarding (Player A)

| # | Etape | Critere PASS |
|---|-------|--------------|
| A1 | Naviguer `/login`, saisir `player-a@example.com` + mdp, soumettre | Redirect automatique declenche |
| A2 | Verifier l'URL apres redirect | `/onboarding` (pas `/journey`) |
| A3 | Le form affiche : champ `Nom d'equipe`, textarea `Idee de projet`, 5 questions Likert (q1-q5), checkbox membres | Tous les champs visibles |
| A4 | Remplir : nom = `Equipe A Test`, idee = `Une plateforme de cours en ligne pour les etudiants UEMF en sciences cognitives` (>= 10 chars), Likert q1=3 q2=3 q3=3 q4=3 q5=3, cocher au moins le membre soi-meme | Pas d'erreur de validation |
| A5 | Cliquer `Valider et demarrer` | Toast de status visible puis redirect |
| A6 | Verifier l'URL apres submit | `/journey` |
| A7 | SQL : `select onboarded_at, name, idea, score_engagement from players where id = 'PLAYER_A_ID';` | `onboarded_at` NOT NULL, `name = 'Equipe A Test'`, `idea` non vide, `score_engagement = 10` |
| A8 | Re-visiter `/onboarding` (taper l'URL directe) | Redirect automatique vers `/journey` (idempotence middleware + page) |

**PASS / FAIL :** ____  **Timestamp :** ____

---

## Scenario B - Journey display (Player A)

| # | Etape | Critere PASS |
|---|-------|--------------|
| B1 | Sur `/journey`, header visible | Affiche : `Equipe / Equipe A Test`, `Niveau / L0` (ou L1), `Score Projet / 0` |
| B2 | Section `Ateliers du jour` | Si on est le 13 ou 14 mai 2026 -> liste les missions du jour avec heure (ex. `09:00 A venir Atelier 1 - Probleme & Personae`). Sinon -> message `Aucun atelier prevu aujourd'hui.` |
| B3 | Section `Livrables a rendre` | Si on est le 13/14 mai 2026 : 9 entries au total visibles avec badge `A rendre`. Sinon : message `Aucun livrable a rendre aujourd'hui.` |
| B4 | Aucune mention `demo`, `atlas`, `Tamwilcom`, `Bank of Africa`, `Innov Invest`, `Bluespace` visible | Inspection visuelle clean |
| B5 | Aucun bloc JSON / `pre` / `debug` visible (ex. ancien `user.email | role`) | Inspection visuelle clean |

**Note B2/B3 :** pour tester avant le 13 mai, modifier temporairement `missions.scheduled_at` a la date du jour, ou se contenter de verifier le message d'etat vide.

**PASS / FAIL :** ____  **Timestamp :** ____

---

## Scenario C - Submit V1 (Player A)

| # | Etape | Critere PASS |
|---|-------|--------------|
| C1 | Click sur le 1er deliverable de la liste (ex. `Fiche Personae`) -> URL `/journey/deliverable/<id>` | Page detail rendue avec titre + description + rubric (4 criteres x 25) |
| C2 | Selectionner `Type de preuve = Lien`, saisir `https://example.com/test-personae` | URL acceptee (pattern `https://`) |
| C3 | Cliquer `Soumettre V1` | Toast status `ok`, page se rafraichit |
| C4 | Apres refresh : banniere bleue `Livrable verrouille - en attente du feedback Mentor.` visible | Form remplace par readonly card |
| C5 | F5 (refresh navigateur) | Etat readonly persiste |
| C6 | SQL : `select status, version, kind, proof_url from submissions where player_id = 'PLAYER_A_ID' order by submitted_at desc limit 1;` | `status='submitted_v1'`, `version=1`, `kind='proof_url'`, `proof_url='https://example.com/test-personae'` |
| C7 | (test validation Zod) Sur le 2e deliverable, tenter URL `http://example.com/foo` (HTTP non HTTPS) | Soumission refusee, message d'erreur visible (Zod `httpsUrl`) |
| C8 | Tenter de re-soumettre le 1er deliverable via POST direct (devtools console) avec un autre proof_url | Refus action : message `Une soumission V1 existe deja. Attendez le feedback du Mentor.` |
| C9 | Tester `Type = Texte` sur le 2e deliverable, saisir au moins 10 chars markdown | Submit OK, etat passe en readonly |

**PASS / FAIL :** ____  **Timestamp :** ____

---

## Scenario D - RLS (Player B isolation)

| # | Etape | Critere PASS |
|---|-------|--------------|
| D1 | Logout PlayerA (cookie cleared / `/login`) | Redirect `/login` |
| D2 | Login PlayerB (`player-b@example.com`) | Redirect `/onboarding` (PlayerB pas encore onboarde) |
| D3 | Completer onboarding PlayerB rapidement (form complet) | Redirect `/journey` |
| D4 | Sur `/journey`, header affiche `Equipe / [nom_equipe_B]` (PAS celui de A) | Donnees de B uniquement |
| D5 | Section deliverables : tous au statut `A rendre` (PlayerB n'a aucune submission de A) | Aucun statut `Soumis V1` herite de A |
| D6 | Tenter directement l'URL `/journey/deliverable/<id_du_template_soumis_par_A>` | Page rendue, formulaire vide affiche (template public) MAIS aucune submission de A visible |
| D7 | SQL en role anon (via Supabase Studio comme PlayerB) : `select * from submissions where player_id = 'PLAYER_A_ID';` | Resultat vide (RLS bloque la lecture cross-Player) |
| D8 | PlayerB submit son propre proof_url sur ce template | Insert reussit pour `player_id = PLAYER_B_ID`. Ne touche pas A. |
| D9 | SQL : `select count(*) from submissions where deliverable_template_id = '<TPL_ID>';` | Retourne 2 (1 pour A + 1 pour B) |

**PASS / FAIL :** ____  **Timestamp :** ____

---

## Scenario E - Anti-leak (DATA-03)

| # | Etape | Critere PASS |
|---|-------|--------------|
| E1 | Inspection visuelle `/journey`, `/journey/deliverable/[id]`, `/onboarding` (PlayerA et PlayerB) | Aucune mention `demo`, `atlas`, `atlas-soil`, `Tamwilcom`, `Bank of Africa`, `Innov Invest`, `Bluespace` |
| E2 | View source (Ctrl+U) sur `/journey` | Aucune fuite des chaines ci-dessus dans le HTML rendu |
| E3 | SQL : `select count(*) from events where slug = 'hack-days-fes-meknes-mai-2026';` | Retourne `1` |
| E4 | SQL : `select count(*) from events where slug = 'atlas-soil';` | Retourne `0` |
| E5 | SQL : `select count(*) from missions m join events e on m.event_id = e.id where e.slug = 'hack-days-fes-meknes-mai-2026';` | Retourne `6` |
| E6 | SQL : `select count(*) from deliverable_templates dt join missions m on dt.mission_id = m.id join events e on m.event_id = e.id where e.slug = 'hack-days-fes-meknes-mai-2026';` | Retourne `9` |
| E7 | grep applicatif (en local sur la branche deployee) : `grep -ri "atlas-soil\|Tamwilcom\|Bank of Africa\|Innov Invest\|Bluespace" app/ components/ utils/ middleware.ts` | Aucun match (commentaires DATA-03 dans `lib/seed/*` autorises mais pas concernes par ce grep restreint) |

**PASS / FAIL :** ____  **Timestamp :** ____

---

## Recapitulatif Final

| Scenario | Statut | Timestamp | Notes |
|----------|--------|-----------|-------|
| A - Onboarding | ____ | ____ | |
| B - Journey display | ____ | ____ | |
| C - Submit V1 | ____ | ____ | |
| D - RLS | ____ | ____ | |
| E - Anti-leak | ____ | ____ | |

**Resultat global :** ____ (PASS si 5/5, sinon FAIL avec scenarios bloquants listes)

---

## En cas de FAIL

1. Logger precisement le scenario + l'etape (ex. `C5 FAIL : refresh perd l'etat readonly`).
2. Capturer un screenshot de l'erreur visible.
3. Verifier les logs Vercel (Functions logs) + Supabase logs (Auth + DB).
4. Reporter la regression dans un nouveau plan Phase 2.5 ou Phase 3.

## Cleanup post-test

- Supprimer les comptes test `gm-test`, `player-a`, `player-b` de `auth.users`.
- Supprimer les `players` et `submissions` lies (CASCADE devrait operer).
- Re-verifier `select count(*) from submissions;` = 0 avant le pilote reel.
