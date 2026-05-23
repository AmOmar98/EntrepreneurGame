# J1 · 12h52 · TICK · WARN

- PROD home : 307 (redirect vers /login — attendu non-auth) · 218ms
- PROD /login : 200 · 304ms · bien sous seuil
- Vercel runtime logs : MCP partiellement 403 (limitation connue) — remplacé par smoke HTTP direct
- Vercel 5xx (15 min) : 0 visible via smoke HTTP
- Vercel build status : MCP 403 — non vérifié ce tick (dernier deploy connu stable)
- Supabase RLS denied (15 min) : 4 occ `permission denied for table announcements`
  (timestamps 11h41, 11h40, 11h38×2 — sous seuil HARD ≥5, seuil WARN 1-4)
- Slow queries : aucune >1s dans les logs postgres
- Auth errors : 0 erreurs 401/403 — 2 logins positifs (Omar `o.ameur@ueuromed.org` 11h51, MindBot token refresh 11h49)
- Active sessions : **2** (stable vs 2 tick précédent — au seuil mais stable)
- Advisors security : WARNs pre-existants (`function_search_path_mutable` ×4, `anon_security_definer` ×11) — aucun nouveau
- Advisors perf : WARNs `auth_rls_initplan` sur `pitch_scores` (3 policies) + `help_requests` + `jurors` — nouveaux liés au merge jury V3/V4 (commits 95f8532/c8f80fd). Niveau INFO/WARN, pas HARD.

## Suivi anomalies

### #1 — permission denied for table announcements
- 15 min window (11h37–11h52) : **4 occurrences** (WARN, sous seuil HARD ≥5)
- Cadence : ~1 toutes les 3 min, pattern régulier
- Interpretation : requetes non-auth du frontend qui tentent de lire `announcements` avant session etablie — RLS fait son travail, pas d'escalade
- Tendance vs tick 12h41 : stable, pas de surge

### #2 — sessions actives
- Actuellement : **2** (inchangé vs tick precedent)
- 1 login actif identifie : Omar `o.ameur@ueuromed.org` 11h51 (depuis localhost:3000 — test local)
- 1 refresh token : MindBot `team-mindbot@digi.uemf.ma` 11h49
- Verdict : sessions reelles = 2, au seuil HARD (<2) mais pas en-dessous — WARN maintenu

## Advisors perf nouveaux (pitch_scores RLS initplan)
- Tables `pitch_scores` : 3 policies avec `auth.uid()` non optimise (→ `(select auth.uid())`)
- Tables `help_requests`, `jurors` : meme pattern
- Lié au merge jury V3/V4 du 20/05 — pas bloquant au volume pilote (≤30 sessions)
- A adresser post-pilote via migration RLS

**Verdict** : WARN · anomalie #1 stable (4/15min, pas de surge) · anomalie #2 stable (2 sessions) · prochain tick 13h07
