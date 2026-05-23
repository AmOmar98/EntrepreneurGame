# J2 · 11h53 · TICK · VERT

- PROD home : 307 · 221ms (redirect middleware vers /login — nominal, non authentifié)
- Vercel 5xx (15 min) : 0 (MCP Vercel 403 faux positif connu — pas de 5xx applicatif dans auth logs)
- Supabase RLS denied (15 min) : 0
- Postgres errors : 2x `column "created_at" does not exist` — source mgmt-api interne Supabase dashboard, pas app
- Slow queries : aucune >1s détectée
- Auth errors : 4x `Invalid Refresh Token` depuis 13.40.131.158 (Vercel edge node) — faux positif definitif
- 1 login réel : F. Fouad (UEMF) 10h35 — statut 200 OK
- Active sessions (15 min) : 0 — creux inter-atelier normal
- Soumissions : 40 (stable vs tick précédent 40)
- Evaluations : 23 (stable vs tick précédent 23)
- Deploy status : non interrogeable (Vercel MCP 403) — dernier deploy connu opérationnel (hotfix ad86675)
- Advisors : identiques baseline pilote — aucun nouveau item sécurité

**Verdict** : RAS · prochain tick 12h08
