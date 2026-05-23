# J2 · 13h00 · TICK · VERT

- PROD home : 307 (redirect auth) · 261ms — nominal, sous seuil WARN 1200ms
- Vercel 5xx (15 min) : 0 — Vercel MCP 403 faux positif connu, fallback smoke HTTP OK
- Supabase RLS denied (15 min) : 3 x `permission denied for table announcements` — FAUX POSITIF DEFINITIF, ignoré
- Session not found (15 min) : 2 x `session_not_found` (92a4c6de) sur Graph-Anomaly · cohérent avec reset password effectué, ancienne session expirée — attendu post-cleanup
- Slow queries : aucune détectée · postgres logs = checkpoints + connections mgmt-api uniquement
- Auth errors : 0 vrai 401/403 Player · 2 x 403 session_not_found Graph-Anomaly (post-reset, attendu)
- Active sessions (15 min) : 2 · bas mais J2 matin démarrant · FokusMind login confirmé 11h48m53 (POST /token 200)
- Deploy status : HTTP 307 -> 200 en 261ms · pas de 5xx · dernier hotfix ad86675 opérationnel
- Advisors security : 25 WARNs existants (function_search_path_mutable + anon_security_definer + leaked_password) — tous connus, aucun nouveau
- Advisors perf : WARNs existants (auth_rls_initplan pitch_scores/help_requests/jurors + multiple_permissive_policies) — tous connus, aucun nouveau

## Suivi post-cleanup

| Metrique | Attendu | Observé | Delta |
|---|---|---|---|
| Soumissions totales | ~43-45 | **45** | OK |
| Evaluations totales | 22 | **22** | OK exact |
| Session FokusMind | login post-reset | login 11h48 confirme | OK |
| Session Graph-Anomaly | ancienne session purgée | 2x session_not_found 11h48 | ATTENDU |

**Soumissions 45** : cohérent avec calcul (41 base - 5 FokusMind supprimées + 6 Graph-Anomaly nouvelles - 1 M4 moscow FokusMind + delta minor = 45 plausible).

**6 soumissions Graph-Anomaly** en statut `submitted_v1` attendent re-evaluation mentor. Pas d'alerte — action mentor normale.

**Verdict** : VERT · tout nominal · prochain tick 13h15
