# Deferred items — Quick 260519-jpr

Items explicitement reportés hors quick (cf. spec section 8).

## Reportés en backlog

- [ ] Exports PDF : 47 certificats joueur + rapport global 12 pages
- [ ] Replay vidéo automatique avec voix off (4 min)
- [ ] Page publique `eic.ma/hack-26`
- [ ] Mascotte Pixel affichant `pitch_mode_state` (idée seed)
- [ ] Migration échelle scoring 0-20 → 1-5 étoiles
- [ ] Granularité per-pitch (`current_pitch_id` pointer, reveal pitch par pitch)
- [ ] Page dédiée `/admin/jurors` autonome (le composant inline dans `/admin` suffit pour le pilote)
- [ ] Notifications email aux jurors lors de l'invitation (Edge Function Supabase)
- [ ] Logs d'audit `pitch_mode_state` transitions (au-delà du `closed_at`)
- [ ] `app_role='juror'` enum dédié (refusé au profit de la table)
- [ ] Backfill auto mentors → jurors (refusé au profit des 4 jurys dédiés provisionnés)

## À traiter dans le quick

(Vide à la création — sera rempli si nouvelles découvertes pendant l'exécution.)

## Quick wins post-quick (si temps)

- [ ] Mise à jour `.env.example` pour documenter `SUPABASE_SERVICE_ROLE_KEY` (utilisé par le script provisioning)
- [ ] Mise à jour `CLAUDE.md` section AppRole (déjà prévu dans Wave 3)
- [ ] Ajout test SQL automatisé pour la faille RLS (smoke prod régulier)
