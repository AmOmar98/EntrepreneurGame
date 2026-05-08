# Smoke Test E2E - Phase 5 / DEPLOY-03

**Environnement** : prod URL = ____________________
**Date** : ____________________
**Operateur** : Omar
**Build commit SHA** : ____________________

Objectif : valider le flux complet bout-en-bout sur l'URL prod avant ouverture aux testeurs internes / au pilote du 13 mai.

## 0. Pre-conditions
- [ ] Build Vercel green (Deployments -> Ready)
- [ ] Env vars configurees (3 Supabase vars + NEXT_PUBLIC_APP_URL)
- [ ] Schema DB applique (`schema.sql` -> `triggers.sql` -> `rls.sql`)
- [ ] Tables seedees : events (1 row Hack-Days), missions, deliverable_templates
- [ ] RLS test (Plan 03 - DATA-02) ALL PASS sur prod DB
- [ ] `/login` accessible HTTPS, banniere partenaires visible (Tamwilcom, Bank of Africa, Innov Invest, Bluespace)
- [ ] Headers securite verifies : `curl -I <url>` -> `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`

## 1. GameMaster import CSV
- [ ] Login GM via `/login` (magic link envoye au compte GM seedé)
- [ ] Aller sur `/admin` -> tableau cohorte vide
- [ ] `/admin/players/import` -> coller CSV de 2 equipes test (format : team_name,leader_email,leader_name,member2_name,member2_email,...)
- [ ] Verifier rapport import (created=2, invites=N selon emails fournis)
- [ ] Magic links recus dans inbox des leaders (verifier 2 boites mail differentes)

## 2. Player A onboarding
- [ ] Cliquer magic link Player A -> redirect vers `/onboarding`
- [ ] Remplir form (team_name, idee_pitch, 5 questions Likert, members) -> submit
- [ ] Verifier redirect `/journey`, header montre niveau (L0/L1) + score 0
- [ ] Voir timeline ateliers + liste deliverables avec statut "A rendre"

## 3. Player A submit V1
- [ ] Cliquer "Soumettre" sur premier deliverable -> `/journey/deliverable/[id]`
- [ ] Choisir proof_url, coller `https://example.com/test-deliverable-A`
- [ ] Submit -> retour `/journey`, statut affiche "Soumis V1"
- [ ] Verifier en DB : row `submissions` avec version=1, status submitted

## 4. Mentor evaluate
- [ ] Logout Player, login Mentor (autre compte / autre browser/incognito)
- [ ] `/mentor` -> voir Player A avec 1 deliverable en attente
- [ ] Cliquer evaluer -> `/mentor/submission/[id]`
- [ ] Remplir scores rubric (5 criteres), feedback texte, verdict "Demander V2" -> submit
- [ ] Retour `/mentor`, pending=0 pour cette submission specifique
- [ ] Verifier : email/notif (si configure) au Player

## 5. Player A V2
- [ ] Logout Mentor, login Player A
- [ ] `/journey` -> deliverable status "Feedback recu" + bouton "Re-soumettre V2"
- [ ] Cliquer -> voir feedback Mentor + scores precedents affiches
- [ ] Soumettre V2 avec nouvelle URL `https://example.com/test-deliverable-A-v2` -> statut "Soumis V2"

## 6. Mentor jury (JURY-01, JURY-02)
- [ ] Logout Player, login Mentor
- [ ] `/jury` -> voir liste Players (au moins Player A et Player B)
- [ ] Saisir 5 notes pour Player A (ex: 15, 16, 14, 17, 15 sur 20) -> total 77 -> submit
  - [ ] Confirmation message OK
- [ ] Saisir 5 notes pour Player B (ex: 12, 13, 14, 15, 16) -> submit OK
- [ ] Re-saisir notes Player A avec valeurs differentes (ex: 18, 17, 16, 15, 14) -> submit
  - [ ] Verifier en DB : UNE SEULE row `pitch_scores` pour (juror_id Mentor, player_id Player A) - upsert respect contrainte unique

## 7. Results gate (JURY-04)
- [ ] Login Player B -> `/results` -> doit afficher "Resultats a venir" (pas le tableau)
- [ ] Login Mentor -> `/results` -> doit afficher "Resultats a venir" (non-GM, non-publie)
- [ ] Login GM -> `/results` -> doit voir tableau classement (preview/draft mode visible GM seulement)

## 8. Publish (JURY-05)
- [ ] GM clique "Publier les resultats" -> confirm dialog -> OK
- [ ] Verifier en DB : `events.results_published_at` est set (timestamp now)
- [ ] Login Player A -> `/results` -> voir le tableau classement complet
- [ ] Verifier rang base sur formule : `combined = 0.5*pitchAvg + 0.5*scoreProject`
- [ ] Verifier que les 2 Players apparaissent avec leur rang correct

## 9. RLS spot-checks
- [ ] Player A connecte : tenter direct URL `/journey/deliverable/<id-de-Player-B>` -> 404 ou redirect (pas de fuite)
- [ ] Network tab DevTools : aucune requete leak donnees Player B chez Player A
- [ ] Player A : tenter `/mentor` -> redirect ou 403
- [ ] Mentor : verifier acces `/jury` OK, mais pas `/admin/players/import` (GM only)

## 10. Cleanup pilote
- [ ] Supprimer comptes test si demandes au pilote reel
- [ ] DROP rows `pitch_scores` test si confusion possible avec donnees reelles
- [ ] DROP rows `submissions` test
- [ ] Reset `events.results_published_at = NULL` si reuse de l'event
- [ ] Verifier que les seeds demo (`atlas-soil`, etc.) ne sont PAS en prod

## Verdict
- [ ] **PASS** - prod prete pour 13 mai 2026
- [ ] **FAIL** - bloquants : ____________________________________________

## Notes / observations
_Espace libre pour noter toute anomalie, lenteur, UX bizarre meme non-bloquante_
