# J2 · 08h50 · TICK · VERT

- PROD home : 200 · 417ms (307 redirect → 200 final, ~208ms TCP + render)
- Vercel 5xx (15 min) : 0 — Vercel MCP substituté par smoke HTTP (403 list_deployments connu)
- Supabase RLS denied (15 min) : 1 × `announcements` → faux positif connu, ignoré
- Slow queries : aucune — postgres logs = checkpoints + connexions mgmt-api uniquement
- Auth errors (401/403) : 2 entrées sur fenêtre 24h, niveau info, path=/user (session refresh normale) — 0 erreur Players réels
- Active sessions (15 min) : 1 (pré-ouverture ateliers J2, montée attendue dans ~30 min)
- Deploy status : ready (smoke 200 confirmé)
- Soumissions J2 : 1 nouvelle (total cumulé : 27 — stable vs J1 clos)
- Advisors sécurité : WARNs connus et stables (search_path mutable, SECURITY DEFINER exposés anon) — présents depuis v0.2, aucun nouveau
- Advisors performance : WARNs connus (pitch_scores RLS initplan × 3, help_requests multiple permissive, unindexed FK help_requests/jurors) — présents depuis v0.2, aucun nouveau

**Notes pré-ouverture J2**
- Session count = 1 : normal à 08h50, Players pas encore connectés. Attendre spike entre 09h00 et 09h30.
- 1 soumission J2 déjà enregistrée : probablement un GM ou un Player matinal.
- `column "created_at" does not exist` dans postgres logs (1 occurrence, application_name=mgmt-api) : faux positif Supabase Studio interne, ignoré.

**Verdict** : RAS · prochain tick 09h05
