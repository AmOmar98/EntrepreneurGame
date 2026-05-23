# J2 · 14h40 · TICK · WARN

- PROD home : 307 · 1160ms
- Vercel 5xx (15 min) : 0 (Vercel MCP 403 faux-positif connu — smoke HTTP confirme 307 sain)
- Supabase RLS denied (15 min) : 2 x `permission denied for table announcements` — faux-positif DEFINITIF connu, ignoré
- Slow queries : aucune >1s detectee dans les logs postgres
- SQL applicatif : 3 x `column "created_at" does not exist` sur les 15 dernières min (timestamps ~13h37, ~13h37, ~13h25)
- Auth errors (15 min) : 0 — tous les /token et /user en 200, logins token MedNova + Omar OK
- Active sessions (15 min) : 2 (hausse vs 1 au tick J2-14h30)
- Soumissions totales : 45 (stable vs 45 tick precedent)
- Evaluations J2 (24h) : 11 (stable vs 11 tick precedent)
- Deploy status : pas de nouveau deploy detecte, dernier connu operationnel (hotfix ad86675)
- Advisors : 23 WARNs security pre-existants (function_search_path_mutable, anon/authenticated SECURITY DEFINER, leaked_password_protection) — tous connus, aucun nouveau

## Warnings (non-bloquant)

- SQL `column "created_at" does not exist` : 3 occurrences groupees sur ~15 min (13h25-13h37), toutes issues du mgmt-api Supabase (non de l'app Next.js). Vraisemblablement requetes internes Supabase Studio ou migration check. Aucune correlation avec erreur auth ou 5xx Vercel.
  → a surveiller au tick suivant. Si recurrence >5 dans 15 min suivantes → escalade WARN+.
- Latence PROD : 1160ms — dans la plage WARN (1000-3000ms), coherente avec les ticks precedents en fin d'apres-midi J2.

**Verdict** : WARN · prochain tick 15h00
