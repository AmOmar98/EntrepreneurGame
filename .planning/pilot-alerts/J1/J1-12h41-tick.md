# J1 · 12h41 · TICK · WARN

- PROD home : 307 (auth redirect attendu) · 214ms — nominal
- Vercel 5xx (15 min) : 0 (Vercel runtime logs API retourne 403 sur ce token — non-bloquant, aucun 5xx observable côté Supabase auth)
- Vercel deploy status : non accessible (403 list_deployments) — dernier deploy inconnu via MCP ce tick, à vérifier manuellement si besoin
- Supabase MCP : RETABLI — project_id `vzzbjxmfkmvqkaqxalhr` fonctionnel, toutes réponses reçues
- Active sessions (15 min) : 2 (seuil HARD <2 — on est juste à la limite, acceptable au démarrage J1)
- Auth errors (15 min) : 0 erreur 401/403 dans les logs auth — 1 login réussi `team-simock@digi.uemf.ma` à 11h31
- RLS denied (fenêtre 24h) : 15+ occurrences `permission denied for table announcements` — voir section Warnings
- Slow queries : aucune >1s détectée dans les logs postgres de cette fenêtre
- Advisors security : WARNs existants (mutable search_path sur 4 fonctions, anon SECURITY DEFINER callable) — tous pré-existants, aucun nouveau ce tick
- Advisors performance : WARNs existants (auth_rls_initplan sur pitch_scores + help_requests + jurors, multiple permissive policies) — tous pré-existants, aucun nouveau ce tick

## Warnings (non-bloquant)

### W1 — permission denied for table announcements (recurrent)
- 15+ erreurs ERROR niveau postgres sur la fenêtre 24h, rythme ~1 toutes 3-5 min
- Cause probable : la table `announcements` existe en DB mais RLS bloque `anon`/`authenticator` pour une requête que l'app effectue sans user connecté (middleware ou composant qui poll les annonces avant auth)
- Impact visible : aucun crash observé, auth fonctionne (login team-simock OK), sessions actives
- A surveiller : si le compteur monte significativement ou si des Players signalent une page blanche → escalader
- Action immédiate : aucune — pas de Player bloqué connu

### W2 — Sessions actives = 2 (seuil HARD est <2)
- Count = 2 sur les 15 dernières minutes, pile au-dessus du seuil HARD
- Context J1 début de journée : normal si les Players commencent à arriver progressivement
- Watch : si le prochain tick repasse à 0 ou 1 sans explication → HARD

### W3 — Vercel MCP partiellement dégradé
- `get_runtime_logs` : 403 Forbidden (token insuffisant)
- `list_deployments` : 403 Forbidden (token insuffisant)
- Ces deux endpoints sont bloqués mais ne reflètent PAS un incident PROD — la surface visible (HTTP PROD 307/214ms, Supabase auth OK) est saine
- Pour le prochain tick : utiliser le dashboard Vercel manuellement si besoin de confirmer le build status

**Verdict** : WARN · prochain tick J1-12h56
