# J1 · 16h40 · TICK · WARN

- PROD home : 307 · 1094ms (redirect vers /login attendu, nominal — seuil WARN 1200ms non atteint)
- /login direct : 200 · 913ms (en dessous de 1200ms)
- Vercel 5xx (15 min) : 0 (Vercel MCP API 403 — token hors scope ; smoke HTTP nominal confirme pas de 5xx visible)
- Vercel deploy status : MCP non accessible (403), HTTP/307+200 OK = deploy actif et stable
- Supabase RLS denied (fenetre recente) : 1 occurrence (`permission denied for table announcements`) — faux positif connu, meme table que tick 16h30
- SQL errors mgmt-api : 2 ERROR visibles dans postgres logs (`column "created_at" does not exist` x2, `invalid input value for enum submission_status: "pending"` x1) — application_name=mgmt-api, non applicatifs (dashboard Supabase), patron identique tick precedent
- Slow queries : aucune requete >1s visible dans postgres logs
- Auth errors : 0 erreur 401/403 — tous les evenements auth sont 200 (logins + token refreshes)
- Active sessions (15 min) : 0 (creux post-atelier attendu — meme valeur que tick 16h30)
- Soumissions cumul J1 : 16 (stable, inchange depuis 15h06 UTC)
- Dernieres activites auth visibles : Simock (14h47), MindBot (14h45), MedNova (14h39), Bla Dwa (14h37) + Omar GM (15h05)
- Advisors security : 25 WARN pre-existants (search_path mutable x4, SECURITY DEFINER anon/authenticated callable x10+10, leaked password protection disabled x1) — aucun nouveau, stock stable, pilot-grade accepte

## Warnings (non-bloquant)

- Vercel MCP inaccessible (403 forbidden sur team_placeholder) : incapacite a lire les runtime logs et deploy status via MCP. Smoke HTTP compense — pas de 5xx detecte. A corriger hors pilote (token Vercel a reconfigurer).
- Sessions = 0 : creux attendu en fin d'apres-midi J1. A surveiller au prochain tick — si toujours 0 a 17h00 alors que Players devaient continuer, interroger.
- Latence home 1094ms : dans la plage normale (seuil WARN = 1200ms), legere hausse vs 957ms tick precedent. Pas d'action.

**Verdict** : WARN · prochain tick J1-16h50 (ou cadence commandee)

---
*Checks executes : HTTP smoke (home+login), Supabase postgres logs, Supabase auth logs, execute_sql sessions, execute_sql submissions count, Supabase security advisors*
*Vercel MCP : 403 sur tous les endpoints — fallback HTTP OK*
