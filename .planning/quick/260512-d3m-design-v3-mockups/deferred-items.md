# Quick 260512-d3m · Deferred items

Items reportés post-pilote (cf. user instruction "fais sans si beaucoup de travail").

## Backend / Data

- **Champ `assignedMentor` sur `AdminLiveTeam`** : pour afficher la carte "mentor assigné" du Mockup 3 (vue Focus équipe). Demanderait :
  - Nouvelle query `mentor_assignments` ou `coach_assignments` (selon le schéma existant)
  - Type `AdminLiveTeam.assignedMentor: { id, name, initials, isOnline }`
  - UI : carte avec avatar mentor + "● en ligne" pill (status à dériver de `auth.users.last_sign_in_at`)

- **Compteur "N mentors en ligne"** dans top bar `/admin` : nécessite query sur `auth.users` filtrée par rôle `mentor` + `last_sign_in_at` récent (<15min). À implémenter dans `lib/admin.ts` ou directement dans `app/admin/page.tsx`.

- **Timer "Pitch dans Xh Xmin"** dans top bar `/admin` : `hackStatus` actuel ne calcule pas le temps restant jusqu'au pitch. Demanderait :
  - Lire `events.starts_at` + `events.pitch_offset_minutes` (à ajouter au schéma OU calcul hardcodé J2 15h00)
  - Ticker client-side mis à jour chaque minute

## UX / Workflow

- **Auto-trigger Achievement Unlocked sur level-up** : actuellement déclenché manuellement par bouton "🎉 Célébrer" dans Focus modal. Pour auto-trigger :
  - Ajouter `kind: "level_unlocked"` à `GameFlowEntry`
  - Dans `lib/admin-live.ts`, détecter les transitions de niveau (compare `current_level` vs précédent — exige tracking ou trigger DB)
  - Côté `AdminLiveView`, useEffect surveille snapshot.gameFlow, montre overlay sur nouvelle entry level_unlocked

- **Bouton "Annoncer dans le live"** du Mockup 2 : actuellement visuel uniquement (close on click). Pour vrai wiring :
  - Server action `announceAchievement(teamId, levelTag, comboCount)` qui push une entry dédiée dans le fil du jeu
  - Pour M.A.J live : revalidatePath ou ajouter à une `announcements` table que `getAdminLiveSnapshot` lit

## Visuel (polish supplémentaire)

- **Numéros timeline level pointent vers entries activité spécifiques** (Mockup 3 right column) : actuellement timeline + activity cards sont 2 listes parallèles non liées. Pour relier visuellement :
  - Map chaque activity entry à une position Y selon timestamp ou level
  - Tracer un lien SVG entre cercle level et carte activité
  - Risque medium (calcul positions, overlap, responsive)

- **Animation toast "in/out"** : entrée déjà animée (`eic-live-toast-in`). Sortie (auto-dismiss après N secondes) non implémentée. Pour smoothness : `setTimeout` + fade-out class.

## Décision merge / pilote

Si pilote 13-14/05 OK et tag `v0.2-pilot-ready` reste stable, ces items peuvent être consolidés dans une phase `v0.3-design-v3` post-pilote, avec impact data (nouvelle table `mentor_assignments` ou colonnes additionnelles) acceptable hors fenêtre critique.
