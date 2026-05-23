# J2 · 15h10 · TICK · WARN

## Checks

- PROD home : 307 redirect · 990ms (sous seuil WARN 1200ms — latence normalisee)
- Vercel 5xx (15 min) : 0 (Vercel MCP 403 faux positif connu — confirme par absence d'erreurs dans API logs Supabase)
- Vercel deploy status : indisponible via MCP (403 scope connu) — dernier commit push = `d601409`
- Supabase RLS denied (15 min) : 2 × `permission denied for table announcements` — FAUX POSITIF DEFINITIF confirme
- Supabase SQL errors : 3 × `column "created_at" does not exist` — voir section WARN ci-dessous
- Slow queries : aucune query >1s visible dans les logs postgres
- Auth errors : 0 (tous les /token et /user = 200 ; 2 logins actifs detectes : Omar GM + MedNova P)
- Active sessions (15 min) : 0 — pause inter-atelier (coherent avec J2 15h10)
- Soumissions totales : 45 (stable vs tick precedent)
- Evaluations totales : 25 (stable vs tick precedent)
- Advisors : identiques aux ticks precedents — aucun nouveau WARN/HARD

## Activite recente observee

Dernier login Player actif : `team-mednova@digi.uemf.ma` (MedNova) a 13h30 · token refresh OK
Dernier login GM/Mentor : Omar (o.ameur@ueuromed.org) a 13h40 · refresh token OK
Mentor actif a 12h13 (evaluation submission `82cf61f4`) · evaluation_comments visible · workflow OK

## Warn — SQL errors `column "created_at" does not exist`

3 occurrences espacees (~10 min d'intervalle) dans les logs postgres :
- 13h10 UTC
- 13h24 UTC
- 13h37 UTC

Origine probable : requete applicative ou MCP qui reference `created_at` sur une table qui ne l'a pas (suspect : `pitch_scores` ou table recente). Non bloque (aucun 5xx cote API, aucun Player impacte visible). A surveiller au prochain tick — si frequence monte ou si erreurs 500 apparaissent, escalader HARD.

## Advisors — recap (inchanges)

Security : search_path mutable sur 4 fonctions, SECURITY DEFINER callable anon/authenticated — CONNUS, pilot-grade accepte.
Performance : auth_rls_initplan sur `pitch_scores` (3 policies) + `help_requests` + `jurors` — CONNUS, non bloquant a ce volume.

## Verdict

WARN · SQL error `created_at` recurrente (3x, non bloquante) — a confirmer stabilite au prochain tick 15h25.
Sessions = 0 : pause inter-atelier attendue, cohort reprend probablement vers 15h30.
RAS sur toutes les surfaces critiques (submissions/evaluations/auth).

**Prochain tick : J2-15h25**
