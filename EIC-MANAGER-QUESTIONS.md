# Brief EIC manager — info opérationnelle Hack-Days 13-14 mai 2026

> **Contexte** : T-3 jours du pilote. v0.1 pilot-ready déployé sur Vercel. Cohorte cible 6-15 équipes, 2-4 mentors, 1 GameMaster.
>
> **Légende** : **MUST** = bloquant pour le 13 mai matin. **NICE** = amélioration / post-pilote.

---

## 1. Cohorte & comptes (MUST — gate du CSV import)

- Combien d'équipes finales (entre 6 et 15) ?
- Pour chaque équipe : `team_name`, `project_name`, `project_pitch` (1 phrase), `leader_email`, `member_emails` (jusqu'à 4) — fournir en CSV ou tableur partagé
- Liste des Mentors (2-4) : nom + email + équipes qu'ils suivent (ou affectation aléatoire ?)
- GameMaster(s) : juste Omar ou un binôme côté EIC qui doit aussi avoir le rôle ?
- Date d'envoi des magic links : J-2 (11 mai), J-1, ou matin du 13 ?

## 2. Programme & livrables (MUST — seed event)

Le code attend 6 missions + ~9 `deliverable_templates`. Le programme PDF Tamwilcom est daté 16-17 avril (modifié en 13-14 mai). Besoin de la version finale :

- **Programme jour 1 minute par minute** : 6 ateliers, qui anime quoi, durée, pauses
- **Liste finale des livrables par atelier** (ateliers 3-4-5 marqués « à confirmer » dans la spec) :
  - Atelier 1 → BMC ?
  - Atelier 2 → Étude marché + Personae ?
  - Atelier 3-4-5 → ?
  - Atelier 6 → Coûts / pricing / canaux ?
- **Heure butoir** (`due_at`) de chaque livrable dans la journée
- **Programme jour 2** : créneau pitch (5 min/équipe par défaut), ordre de passage, qui pose les questions

## 3. Critères d'évaluation (MUST — `scoring_rubric` figée en seed)

- **Par livrable** : 4-5 critères pondérés à valider. EIC veut-il une rubric standard EIC ou je propose ?
- **Pitch jury jour 2** : 5 critères × 20 points actuellement = clarté pitch / structure deck / crédibilité / qualité roadmap / qualité oral. À garder tel quel ou substituer par les critères EIC officiels ?
- **Pondération classement final** : 50% score Projet / 50% score Pitch (configurable). EIC valide ce ratio ou veut autre chose (60/40, 70/30) ?

## 4. Branding / assets (MUST — placeholders texte actuellement en prod)

Les 6 logos partenaires + logo EIC sont aujourd'hui des **placeholders texte** sur `/login`. Crédibilité partenaires impactée :

- Logos SVG officiels (chemins imposés) : `public/brand/logo-eic.svg` + `public/brand/partners/{tamwilcom,bank-of-africa,innov-invest,bluespace,eic,uemf}.svg`
- Format demandé : SVG vectoriel de préférence, sinon PNG ≥ 400px
- Validation palette EIC (`#1B3A5C` / `#2E7D32` / `#F6F1E8`) et polices (Baskervville titres + Montserrat corps) — conforme à la charte EIC ou à corriger ?

## 5. Logistique salle (MUST — confort animation)

- **Wifi** : débit estimé, mot de passe communiqué quand ? (Players soumettent des liens https://, blocage = blocage soumission)
- **Écran de projection** : oui/non ? Si oui, j'affiche le tableau cohorte `/admin` en live
- **Salle pitch** : configuration scène + jury, micros, ordre fixé seedé en DB (drag-to-reorder différé)
- **Comptes laptop équipes** : chaque équipe a son laptop ou laptops EIC fournis ?

## 6. Communication aux équipes (MUST — onboarding réussi)

- **Email de bienvenue type** envoyé avant le 13 : qui rédige (EIC ou moi) ? Besoin du texte
- **5 questions Likert diagnostic Niveau 0** : à utiliser tel quel ou EIC fournit son questionnaire pédagogique ?
- **CGU / mention data** : EIC a-t-il un texte de consentement à intégrer côté `/onboarding` ou login ?

## 7. Publication & cérémonie (MUST jour 2)

- **Heure exacte publication résultats** (la page `/results` est gatée par bouton GM)
- **Cérémonie podium** : prévue ? format ? (le replay/podium UI est en v0.2, pas garanti pour le 13)
- **Récompenses / certificats** : prévues ? format ? (les exports CSV existent, certificats individuels = à scripter en plus)
- **Photos / live tweets partenaires** : autorisé ? mention spécifique ?

## 8. Contingence (NICE — anticipation)

- Mentor absent jour J → qui prend le relais sur ses équipes ?
- Équipe abandonnée en cours → on la garde dans le classement avec score partiel ou exclusion ?
- Problème technique majeur (Vercel/Supabase down 30 min) → plan B papier prévu ?

## 9. Post-pilote (NICE — oriente v0.2/v0.3)

- Rapport / debrief partenaires attendu ? Format ?
- Réutilisation pour cohortes EIC futures (autres écoles, autres dates) → oriente le chantier multi-event v0.3
- Conservation des données joueurs au-delà du pilote (RGPD / archivage) ?

---

## Priorité d'envoi

| Bloc | Sections | Deadline réponse |
|---|---|---|
| Bloquant 13 mai matin | 1 + 2 + 3 + 4 | au plus tôt — idéalement 11 mai |
| Bloquant J-1 | 5 + 6 + 7 | 12 mai soir |
| Asynchrone | 8 + 9 | post-pilote OK |

---

*Document généré le 2026-05-10 (T-3) à partir de `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/v0.1-MILESTONE-AUDIT.md`.*
