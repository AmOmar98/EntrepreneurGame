# Pilot Preflight — Checklist J-2

> Checklist actionnable à exécuter **2 jours ouvrés avant chaque pilote événementiel** (Hack-Days, Digi-Hackathon, ou tout autre event live ≥ 2 jours).
>
> **Pourquoi cette doc existe** : lors du Digi-Hackathon (20-22 mai 2026), les tokens MCP Vercel + Supabase ont expiré silencieusement à J1 10h37 → surveillance aveugle 3 jours (cf. `.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md` section A).
>
> **Contexte solo dev** : Omar code + setup + anime le workshop. Pas de débogage en live possible. Cette checklist sécurise l'observabilité AVANT que la salle se remplisse.

## Critère de succès

- [ ] Au tick 1 du JX (premier appel `pilot-health-watcher` du jour 1), tous les checks observabilité (Vercel runtime logs + Supabase postgres logs + advisors) retournent **VERT**.

---

## Étape 1 — Renouveler le token Vercel API

- [ ] Ouvrir `https://vercel.com/account/tokens`
- [ ] Créer un nouveau token avec scope minimum :
  - `read:logs`
  - `read:deployment`
  - `read:project`
  - Team : `team_pSzfPqCUMFSVOCzDhJTXxFHq` (confirmé live par erreur 403 du watcher 2026-05-23 — le post-mortem cite par erreur `team_bMVjT78eJ6bKCCpFJiJLwT7o`, l'ignorer)
- [ ] Expiration : 30 jours (ou minimum permis par Vercel — éviter "no expiration" pour limiter l'exposition)
- [ ] Coller le token dans la config MCP Claude Code (panel `/mcp` → plugin Vercel → reconnect)
- [ ] Révoquer l'ancien token dans le dashboard Vercel

## Étape 2 — Reconnecter Supabase MCP

- [ ] Ouvrir Claude Code → panel `/mcp`
- [ ] Plugin Supabase : déconnecter puis reconnecter
- [ ] Valider l'accès au projet PROD : `vzzbjxmfkmvqkaqxalhr` (West EU Ireland, projet utilisé par `pilot-health-watcher`)
  > Note : le post-mortem cite aussi `lpcwlgbgwjynnfgrnnxr`. Le project ID actif côté watcher est `vzzbjxmfkmvqkaqxalhr` — c'est celui qui doit fonctionner. Clarifier en post-pilote si l'autre ID est legacy.

## Étape 3 — Smoke test MCP (3 appels, doivent tous retourner OK)

Invoquer dans Claude Code, dans l'ordre :

- [ ] `mcp__claude_ai_Vercel__list_deployments` → doit retourner ≥1 deployment (dernier deploy main)
- [ ] `mcp__plugin_supabase_supabase__get_logs(service="postgres")` → doit retourner une réponse (même vide), pas une erreur auth
- [ ] `mcp__plugin_supabase_supabase__get_advisors(type="security")` → doit retourner la liste advisors (référence J0 pour diff post-event)

Si **un seul** des 3 échoue → retour Étape 1 ou 2 selon l'origine de l'erreur. Ne pas continuer.

## Étape 4 — Backup tokens dans gestionnaire de mots de passe

- [ ] Sauvegarder le nouveau token Vercel dans 1Password / Bitwarden
  - Champ "Date d'expiration" rempli
  - Champ "Scope" rempli (les 4 scopes ci-dessus)
- [ ] Sauvegarder l'état de la connexion Supabase MCP (date de reconnexion, projet `vzzbjxmfkmvqkaqxalhr`)
- [ ] Tag dans le password manager : `eic-pilot-preflight-YYYY-MM`

## Étape 5 — Watcher dry-run (1 itération)

- [ ] Dans Claude Code, lancer :
  ```
  /loop 15m use pilot-health-watcher subagent to run JX health tick
  ```
  → laisser tourner **1 seule itération** (interrompre après le 1er tick)
- [ ] Lire le fichier produit dans `.planning/pilot-alerts/OFF-PILOT-*-tick.md` (le watcher détecte qu'on est hors fenêtre J1/J2/J3 et écrit en mode OFF-PILOT)
- [ ] Vérifier que les 8 checks du watcher (PROD home, Vercel 5xx, Vercel build, Supabase RLS, Slow queries, Auth errors, Active sessions, Advisors) ont tous **un résultat** (pas "MCP unavailable" / "auth error")

> Si un check retourne "MCP unavailable" → un token n'est pas correctement attaché. Retour Étape 1/2/3.

---

## Annexes

### Référence post-mortem source

`.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md` — section A (lignes 26-42).

### Référence watcher

`.claude/agents/pilot-health-watcher.md` — le watcher dépend des tokens MCP renouvelés ci-dessus. Sans MCP frais, il dégrade gracieusement vers HTTP-only et perd 80% de sa valeur.

### Cadence de renouvellement

| Type d'event | Quand faire la preflight |
|---|---|
| Pilote 2-3 jours (Hack-Days, Digi-Hackathon) | J-2 ouvrés |
| Event 1 jour (workshop, jury) | J-1 ouvré |
| Démo partenaire ponctuelle | Veille suffit si tokens <14j |

### Historique des preflights

| Date | Event | Tokens renouvelés ? | Notes |
|---|---|---|---|
| _(à remplir au premier usage)_ | | | |
