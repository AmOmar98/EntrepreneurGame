---
quick_id: 260512-24v
status: conditional
date: 2026-05-12
advisor: eic-pedagogical-advisor
---

# Advisor Verdict — FAB Call Mentor

## R1/R2/R3 Cardinal Check

- **R1: NA** — La feature ne touche ni `evaluations`, ni `submissions`, ni scoring. Aucun score/rang/percentile exposé Player. À garder NA tant que le composer n'affiche pas "tu as N/100" ou un classement de demandes d'aide.
- **R2: NA** — Pas de validator côté livrable. La limite 500 chars est un input constraint UI, pas un validator de soumission de mission. Si vous ajoutez un Zod `.max(500)` côté server action, gardez-le en hard `.max()` côté help_requests (différent du R2 — R2 vise les validators de `deliverable_templates`).
- **R3: OK** — Scope demandé = FAB toujours actif, indépendant du level/mission/progression. Aucune condition `if (player.level >= Lx)` ou `if (stuck_minutes > N)`. Refus catégorique de toute future variante "FAB débloqué après L2" ou "désactivé pendant ceremony" — ça réintroduirait R3.

## Verdict

**CONDITIONAL** — feature alignée cardinaux, 6 conditions à respecter avant merge.

## Conditions

1. **Composer obligatoire avant insert** — pas de quick-send au clic FAB. Le clic ouvre un modal/sheet avec textarea + bouton "Envoyer". Évite spam accidentel à 11 Players × 2 jours.
2. **Privacy stricte RLS** — policy `help_requests` :
   - Player : `INSERT` own (`player_id = auth.uid()`), `SELECT` own only.
   - Mentor : `SELECT` toutes (cohorte pilote = 11, pas d'assignation 1:1 fiable pour J1).
   - GameMaster/admin : `SELECT` + `UPDATE` status.
   - Jamais de `SELECT` cross-player. Aucun feed public, aucune liste agrégée côté Player.
3. **Pas de surcharge `/journey/help` existant** — le FAB ouvre un modal léger "Call mentor" (1 textarea + envoi). La page `/journey/help` (3 portes indice/mentor/pause) reste l'entrée pédagogique riche. Modal ≠ duplique : modal = canal direct mentor, page = self-help structuré. Sinon merger les deux dans un seul flow et supprimer l'un.
4. **Copy empathique non-culpabilisante** — aucune mention "XP", "pénalité", "tu es en retard". Suggestions FR :
   - FAB label/aria: `Appeler un mentor`
   - Modal titre: `Besoin d'un coup de pouce ?`
   - Sous-titre: `Un mentor te répond dès qu'il voit ton message. C'est privé.`
   - Textarea placeholder: `Sur quelle mission tu bloques ? (ex: L2.2 verbatims, j'ai 2 agriculteurs sur 3)`
   - Bouton: `Envoyer au mentor` (pas "Demander de l'aide" qui infantilise)
   - Confirmation post-send: `Message envoyé. Un mentor te rejoint.` (pas "Ton appel a été enregistré").
5. **Bell badge discret** — compteur unread numérique simple côté `/mentor` et `/admin`. Interdits : son, browser notification, toast rouge clignotant, `bg-red-*` agressif. Style : badge ambre/neutre, taille discrète, position en-tête nav.
6. **Lifecycle status explicite** — enum `help_request_status` = `open | acknowledged | resolved`. Transitions :
   - `open` : insert Player.
   - `acknowledged` : mentor a ouvert (auto au premier `SELECT` mentor OU bouton "Vu").
   - `resolved` : mentor clos manuellement après échange en présentiel.
   Pas d'auto-expire J1 → J2 (un Player qui call à 17h J1 doit rester visible J2 matin).

## Pedagogical Notes

- **Demander de l'aide = signal sain, pas faiblesse.** Toute trace UI suggérant "ça compte contre toi" est à proscrire. Le FAB doit être aussi neutre qu'un bouton "Aide" dans un soft pro.
- **Visibilité sociale = zéro.** En présentiel 11 Players dans la même salle, savoir que P03 a calé un mentor humilie P03. RLS strict + aucun affichage cross-player même anonymisé (pas de "3 équipes ont appelé un mentor aujourd'hui").
- **Volume risque pilote** — 11 Players × FAB persistant = potentiel 50+ requests/jour. Mentors (2) peuvent saturer. Mitigation : placeholder structurant (cf. condition 4) qualifie la demande → mentor priorise en présentiel. Pas de queue/throttle artificiel (réintroduirait friction R3-like).
- **Différenciation `/journey/help`** — actuel = self-service (3 portes). FAB = canal humain direct. Coherent si vous précisez dans le modal "Pour des astuces auto, voir [Coup de pouce](/journey/help)". Ne pas cannibaliser la page existante.
- **Cohérence /mentor vs /admin badge** — même composant badge, même seed RLS. Évite divergence visuelle J1 sous stress.

## Recommandations Bonus

- **Champ optionnel `mission_context`** côté `help_requests` : `text` nullable, le composer pré-remplit avec la mission courante détectée via pathname (`L2.2` si Player sur `/journey/deliverable/<id>` correspondant). Aide le mentor à contextualiser sans charger le Player. Pas un blocker si trop scope J-1.
- **Pas de migration RLS bricolée en prod J1** — la table `help_requests` + RLS doit être appliquée **ce soir 12/05 avant 23h00**, smoke E2E 1 Player + 1 Mentor obligatoire, sinon shipper sans la feature et la repousser v0.3. Pas d'`apply_migration` à 8h25 demain matin.
- **Tag pre-merge** `v0.2.1-pre-fab-mentor` avant le merge polish/* — rollback distant possible si bell badge casse `/mentor` durant le pilote (déjà fait : tag `v0.2.1-pre-cfm` 2026-05-12).
- **Out of scope v0.3** : assignation Player↔Mentor 1:1, thread bidirectionnel (mentor répond dans l'app), historique côté Player. J1/J2 = présentiel, le mentor répond en marchant vers la table.

---

**Verdict final : CONDITIONAL — approved si 6 conditions ci-dessus respectées + smoke ce soir. Sinon BLOCK et report v0.3.**
