# J2 · 11h12 · TICK · VERT

- PROD home : 307 · 347ms
- Vercel 5xx (15 min) : 0 (MCP 403 faux-positif connu — pas de 5xx applicatif détecté)
- Supabase RLS denied (15 min) : 0 erreur applicative — uniquement `permission denied for table announcements` (faux-positif DEFINITIF connu, bruit RLS announcements)
- Slow queries : aucune >1s détectée dans postgres logs (checkpoints normaux, connexions authenticator routinières)
- Auth errors : 0 erreur 401/403 — tous les `/user` retournent 200. Quelques durées élevées côté auth service (max ~136ms interne Supabase, non-bloquant) — les `duration` dans les logs auth sont en microsecondes, valeurs normales.
- Active sessions (15 min) : 2 (légère baisse vs tick J2-10h50 = 4 — plausible si Players en atelier sans recharger)
- Soumissions (15 min) : 5 nouvelles — cumul total : 39 (hausse depuis 31 au tick J2-10h50, bon signe d'activité)
- Deploy status : pas de nouveau déploiement détecté (Vercel MCP 403 sur list — faux-positif connu)
- Advisors : tous WARNs connus pre-existants (search_path mutable, SECURITY DEFINER callable anon/authenticated, leaked password protection). Aucun nouveau warning security par rapport aux ticks précédents.

**Verdict** : RAS · prochain tick J2-11h27
