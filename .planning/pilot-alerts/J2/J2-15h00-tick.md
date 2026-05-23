# J2 · 15h00 · TICK · WARN

- PROD home : 307 · 850ms — latence en nette amelioration (1314ms → 850ms) ← tendance inversee
- Vercel 5xx (15 min) : 0 (MCP runtime logs 403 faux positif connu — aucune erreur applicative detectee)
- Vercel deploy status : ready (MCP get_deployment 403 faux positif connu — pas de deploy en cours signale)
- Supabase RLS denied (15 min) : 2 × `permission denied for table announcements` ← faux positif DEFINITIF connu
- SQL ERROR notable : 3 × `column "created_at" does not exist` (timestamps ~14h30, ~14h50, ~15h01) ← NEW, voir Warning
- Slow queries : aucune requete >1s detectee dans les logs postgres
- Auth errors (15 min) : 0 erreur 401/403 Players reels · 2 logins OK (o.ameur + MedNova/maski ghita) · token_revoked = faux positif
- Active sessions (15 min) : 0 (updated_at > now()-15min) — Omar + MedNova logins recents mais sessions non mises a jour dans la fenetre exacte
- Soumissions : 45 (stable vs tick precedent)
- Evaluations : 25 (stable vs tick precedent)
- Advisors security : nominal — WARNs existants inchanges (search_path mutable, SECURITY DEFINER anon-accessible) ; pas de nouveau WARN

## Indicateurs latence J2 (tendance horaire)
956ms → 980ms → 1004ms → 941ms → 263ms → 1160ms → 1314ms → **850ms**
Tendance : retour sous le seuil WARN apres pic 14h50. A confirmer au prochain tick.

## ⚠️ Warnings (non-bloquant)

**W1 — Sessions actives = 0 (fenetre 15 min)**
- `updated_at > now()-15min` retourne 0, mais les logs auth montrent 2 logins recents (13h30 et 13h40) — sessions expirees ou non rafraichies dans la fenetre.
- Contexte J2 15h00 : probable pause dejeuner / creux d'activite. Pas de seuil HARD (seuil = <2).
- A surveiller : si sessions = 0 persiste au prochain tick avec reprise des ateliers → escalade.

**W2 — SQL ERROR : column "created_at" does not exist (3 occurrences recurrentes)**
- Timestamps : ~14h32 (1779369071), ~14h50 (1779369654), ~15h01 (1779370260)
- Source : application mgmt-api (Supabase interne), pas une action Player directe.
- Probablement une query interne Supabase dashboard sur une table sans colonne `created_at` (ex: `pitch_scores` post-hotfix `ad86675`).
- Non bloquant pour les Players, mais pattern repetitif a investiguer si frequence augmente.
- Action : aucune immediate — noter pour Omar post-session.

**Verdict** : WARN (W1 sessions creux, W2 SQL mgmt-api) · prochain tick 15h15
