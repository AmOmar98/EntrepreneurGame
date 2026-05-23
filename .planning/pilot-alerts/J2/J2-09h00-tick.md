# J2 · 09h00 · TICK · WARN

- PROD home : 200 · 1074ms (307 redirect suivi → 200 final)
- Vercel 5xx (15 min) : 0 — MCP 403 faux positif connu, smoke HTTP confirme 200 OK
- Vercel deploy status : non accessible via MCP (403) — dernière info PROD stable connue (J1 operationnel sans incident)
- Supabase RLS denied (15 min) : 1 × `permission denied for table announcements` — faux positif connu (widget vide cosmétique)
- Supabase SQL errors : 2 × `column "created_at" does not exist` — source = application_name=mgmt-api (Supabase Studio interne), pas l'app Next.js. Faux positif.
- Slow queries : aucune >1s
- Auth errors : 0 Players — 2 events GET /user level=info depuis localhost:3000 (env dev Omar), non-bloquant
- Active sessions (15 min) : 0 — pre-ouverture J2 normale, montee attendue 09h00-09h30
- Submissions total : 27 (stable vs tick J2-08h50 = 27, aucune nouvelle nuit)
- Deploy status : nominal (smoke HTTP 200)
- Advisors securite : pre-existants, aucun nouveau — set identique J1 (function_search_path_mutable × 4, anon_security_definer × 11, auth_leaked_password_protection × 1)

## Warnings (non-bloquant)

- Perf advisor : `pitch_scores` RLS policies (`pitch_scores_juror_self_insert`, `pitch_scores_juror_self_update`, `pitch_scores_select_visibility`) triggent `auth_rls_initplan` — auth() reevalue par ligne.
  → Apparu apres deploy jury V3/V4 (commits 95f8532/c8f80fd). Volume pilote ~30 sessions max, impact negligeable aujourd'hui. A corriger post-J3.
- Latence : 1074ms (seuil WARN = ≥1200ms non atteint, dans la vert — note a surveiller si elle monte avec affluence 09h00-09h30)

**Verdict** : WARN (perf advisor pitch_scores nouveau post-jury-deploy) · pas d'action immediate requise · prochain tick J2-09h15
