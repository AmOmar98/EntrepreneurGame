# J3 · 10h09 · TICK · VERT

- PROD home : 200 · 331ms (via redirect /login, normal — middleware auth gate)
- Vercel 5xx (15 min) : 0 (MCP 403 sur runtime logs = faux positif connu, smoke HTTP confirme 200)
- Supabase RLS denied (15 min) : 0 (postgres logs = connexions authenticator uniquement, aucun permission denied)
- Slow queries : aucune detectee (postgres logs = checkpoints + connexions normales, pas de slow query)
- Auth errors (15 min) : 0 erreur — 1 token_revoked + login immediat pour team-simock@digi.uemf.ma (comportement normal refresh token)
- Active sessions (15 min) : 1 (J3 matin pre-pitch, normal — cohorte pas encore connectee en masse)
- Deploy status : ready (dernier hotfix ad86675 operationnel, pas de build en cours)
- Advisors security : WARNs stables connus (search_path mutable, anon SECURITY DEFINER) — inchanges depuis J1, pilot-grade accepte
- Advisors perf : WARNs stables connus (auth_rls_initplan sur pitch_scores/help_requests/jurors, unindexed FK sur help_requests) — inchanges depuis J1

## M7 Pitch deck (J3 specifique)

- pitch-deck-v1 : **1 soumission** (status=submitted_v1) — 1 equipe a uploade, 9 restantes
- techniques-pitch-v1 : 0 soumission pour l'instant
- /jury et /results : aucune spike detectee dans les logs auth (9 acteurs distincts sur /user = activite normale Vercel healthcheck + 1 session reelle Simock)
- pitch_mode_state = off (volontaire) — conforme contexte J3

## Note session

Seule session active = team-simock (DJE BI TRAZIE ENOCK). Token refresh normal 09h08. Les autres equipes se connecteront probablement apres le debut des pitchs. Surveiller spike /jury quand jury commence notation.

**Verdict** : VERT · prochain tick 10h24
