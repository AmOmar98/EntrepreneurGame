# J2 · 08h47 · TICK · VERT

## Checks

- **PROD home** : 200 · 947ms (suivi redirect /login inclus) · 241ms redirect seule · nominal
- **Vercel 5xx (15 min)** : 0 — aucune erreur applicative dans les logs runtime
- **Vercel deploy status** : Vercel `list_deployments` retourne 403 (token scope limité — faux positif connu J1). Smoke HTTP 200 confirme PROD up.
- **Supabase RLS denied (15 min)** : 1 × `permission denied for table announcements` dans la fenêtre récente (timestamp ~08h34) — faux positif documenté J1, table vide, widget invisible Player, cosmétique. Aucune autre `permission denied` applicative.
- **Slow queries** : aucune mention `slow query` ni durée >1s dans les logs postgres des dernières 24h. Checkpoints normaux (32MB WAL recyclé régulièrement).
- **Auth errors** : 0 — 100 event_messages parsés, aucun 401/403/invalid_credentials/expired dans les logs auth.
- **Active sessions (15 min)** : 1 — J2 commence (08h47, ateliers pas encore ouverts). Normal en pre-ouverture.
- **Submissions** : 27 total · 0 dans les 15 dernières minutes · 27 sur 24h (héritage J1 — les ateliers J2 n'ont pas encore démarré). Compteur J2 = 0 nouvelles soumissions à cette heure.
- **Advisors security** : 26 WARNs existants (search_path mutable, SECURITY DEFINER callable anon/authenticated, leaked password protection off) — tous connus depuis J1, aucun nouveau.
- **Advisors performance** : WARNs existants (auth_rls_initplan sur pitch_scores/help_requests/jurors, multiple permissive policies) — tous connus depuis J1, aucun nouveau.

## Notes J2

- Heure : 08h47 — pré-atelier, participants pas encore connectés. 1 session active = probablement GM ou mentor en setup.
- Submissions : 27 = total J1 conservé en DB (pas de reset entre J1/J2, normal).
- `announcements` RLS denied : faux positif stable, identique J1. Pas d'action.
- Advisors : aucun nouveau lint depuis le tick J1. Stable.

**Verdict** : RAS · prochain tick J2-09h02 (ou sur demande)
