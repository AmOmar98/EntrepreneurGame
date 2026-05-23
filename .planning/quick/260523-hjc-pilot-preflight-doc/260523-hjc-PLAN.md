---
phase: 260523-hjc-pilot-preflight-doc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/PILOT-PREFLIGHT.md
autonomous: true
requirements:
  - POSTMORTEM-A
must_haves:
  truths:
    - "Omar peut, à J-2 de tout futur pilote, suivre une checklist actionnable pour renouveler ses tokens MCP Vercel + Supabase"
    - "La checklist inclut un smoke test MCP exécutable copier-coller (list_deployments + get_logs postgres + get_advisors security)"
    - "La checklist couvre les 5 étapes du post-mortem section A dans l'ordre (Vercel token, Supabase reconnect, smoke MCP, backup tokens, watcher dry-run)"
    - "Le critère de succès est explicite et quantifiable : tick 1 du prochain pilote = tous checks observabilité OK"
    - "Le ton est checklist (cases à cocher), pas un essai, cohérent solo dev Omar triple casquette"
  artifacts:
    - path: "docs/PILOT-PREFLIGHT.md"
      provides: "Checklist J-2 renouvellement tokens MCP + validation observabilité avant pilote"
      contains: "team_bMVjT78eJ6bKCCpFJiJLwT7o"
  key_links:
    - from: "docs/PILOT-PREFLIGHT.md"
      to: ".claude/agents/pilot-health-watcher.md"
      via: "référence explicite watcher dry-run + dépendance MCP tokens"
      pattern: "pilot-health-watcher"
    - from: "docs/PILOT-PREFLIGHT.md"
      to: ".planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md"
      via: "origine du fix (catégorie A)"
      pattern: "post-mortem"
---

<objective>
Créer `docs/PILOT-PREFLIGHT.md`, checklist actionnable J-2 que Omar exécute avant chaque pilote événementiel pour renouveler les tokens MCP (Vercel + Supabase) et valider l'observabilité du `pilot-health-watcher` avant J1.

Purpose: Fixer la catégorie A du post-mortem Digi-Hackathon. Lors du Digi-Hackathon (20-22 mai), les tokens MCP Vercel + Supabase ont expiré silencieusement à J1 10h37 → surveillance aveugle 3 jours. Aucune procédure pré-event n'existait. Cette doc empêche la récidive sans aucun code applicatif.

Output: 1 fichier markdown `docs/PILOT-PREFLIGHT.md` (~80-120 lignes), checklist Omar-first.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md
@.claude/agents/pilot-health-watcher.md

<interfaces>
<!-- Données de référence pour le contenu de la doc, extraites des fichiers source. -->

Tokens / IDs cités (post-mortem section A, lignes 34-36) :
- Vercel team ID : `team_bMVjT78eJ6bKCCpFJiJLwT7o`
- Vercel scopes minimum : `read:logs + read:deployment + read:project + team_bMVjT78eJ6bKCCpFJiJLwT7o`
- Vercel tokens URL : `https://vercel.com/account/tokens`
- Supabase project ID (référence post-mortem section A) : `lpcwlgbgwjynnfgrnnxr`
- Supabase project ID (watcher actuel, ligne 18) : `vzzbjxmfkmvqkaqxalhr` ← le watcher utilise CELUI-CI
  ⚠️ Note traçabilité : le post-mortem cite `lpcwlgbgwjynnfgrnnxr` mais le watcher en prod cite `vzzbjxmfkmvqkaqxalhr`. La doc DOIT documenter le project ID utilisé par le watcher (`vzzbjxmfkmvqkaqxalhr`) car c'est lui qui consomme les tokens. Mentionner l'autre comme legacy/à clarifier si besoin.

Outils MCP à smoke-tester (post-mortem ligne 36) :
- `mcp__claude_ai_Vercel__list_deployments`
- `mcp__plugin_supabase_supabase__get_logs(service="postgres")`
- `mcp__plugin_supabase_supabase__get_advisors(type="security")`

Watcher dry-run command (post-mortem ligne 38) :
- `/loop 15m use pilot-health-watcher subagent to run JX health tick` (1 itération = dry run)

Critère de succès (post-mortem ligne 40) :
- "Au prochain pilote, watcher reste VERT sur les checks observabilité dès le tick 1"

CLAUDE.md contraintes utiles :
- "Pas de débogage en live possible" (solo dev triple casquette code+setup+animation)
- Langue : français
- Convention quick : préfixe commit `quick(260523-hjc)` ou `(slug-retro)`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rédiger docs/PILOT-PREFLIGHT.md (checklist J-2 actionnable)</name>
  <files>docs/PILOT-PREFLIGHT.md</files>
  <action>
Créer le fichier `docs/PILOT-PREFLIGHT.md` (nouveau, n'existe pas). Vérifier d'abord que le répertoire `docs/` existe (il existe : `docs/DEPLOY.md` y est référencé dans CLAUDE.md).

Structure attendue :

```markdown
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
  - Team : `team_bMVjT78eJ6bKCCpFJiJLwT7o`
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
```

Notes éditoriales importantes :
- Ton checklist (cases `- [ ]`), pas essai.
- Solo dev Omar-first : pas de "we", pas de jargon enterprise.
- Français cohérent avec CLAUDE.md et post-mortem source.
- Documenter explicitement la divergence project ID Supabase (`vzzbjxmfkmvqkaqxalhr` actif vs `lpcwlgbgwjynnfgrnnxr` cité post-mortem) car c'est une trap dormante détectée lors de la lecture des sources.
- Aucun code applicatif. Aucune modif `lib/` `app/` `database/` `components/`. UNIQUEMENT `docs/PILOT-PREFLIGHT.md`.
- Pas d'accents dans les commandes shell mais OK dans le texte explicatif.
  </action>
  <verify>
    <automated>powershell -Command "if (Test-Path docs/PILOT-PREFLIGHT.md) { $c = Get-Content docs/PILOT-PREFLIGHT.md -Raw; if ($c -match 'team_bMVjT78eJ6bKCCpFJiJLwT7o' -and $c -match 'vzzbjxmfkmvqkaqxalhr' -and $c -match 'list_deployments' -and $c -match 'get_logs' -and $c -match 'get_advisors' -and $c -match 'pilot-health-watcher' -and $c -match 'Étape 1' -and $c -match 'Étape 5' -and $c -match 'tick 1') { Write-Output 'OK' } else { Write-Error 'Contenu incomplet' } } else { Write-Error 'Fichier manquant' }"</automated>
  </verify>
  <done>
- `docs/PILOT-PREFLIGHT.md` existe.
- Les 5 étapes du post-mortem section A sont présentes dans l'ordre (Vercel token → Supabase reconnect → smoke MCP → backup tokens → watcher dry-run).
- Critère de succès quantifiable explicite : "tick 1 du prochain pilote = tous checks observabilité OK".
- Référence `team_bMVjT78eJ6bKCCpFJiJLwT7o` présente.
- Référence project Supabase `vzzbjxmfkmvqkaqxalhr` présente (avec note divergence vs post-mortem documentée).
- Les 3 outils smoke MCP cités explicitement : `list_deployments`, `get_logs`, `get_advisors`.
- Lien vers `.claude/agents/pilot-health-watcher.md` présent.
- Lien vers `.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md` présent.
- Aucune autre modification de fichier (pas de `lib/`, `app/`, `database/`, `components/`).
- Langue : français.
- Ton checklist (cases à cocher) cohérent solo dev Omar.
  </done>
</task>

</tasks>

<verification>
- `docs/PILOT-PREFLIGHT.md` créé, lisible, structuré en 5 étapes + critère de succès + annexes.
- Aucun autre fichier modifié (vérifier `git status` ne montre que cet ajout).
- Pas de régression : aucun code applicatif touché, donc `npm run typecheck` / `npm run lint` / `npm run build` non requis pour ce quick doc-only.
- Convention quick respectée : artefact dans `.planning/quick/260523-hjc-pilot-preflight-doc/` (PLAN.md créé ici, AUDIT/SUMMARY/deferred-items à produire post-exécution).
</verification>

<success_criteria>
- [ ] Fichier `docs/PILOT-PREFLIGHT.md` existe et contient les 5 étapes ordonnées.
- [ ] Critère de succès quantifiable explicite dans la doc : "tick 1 du prochain pilote = tous checks observabilité OK".
- [ ] team ID Vercel (`team_bMVjT78eJ6bKCCpFJiJLwT7o`) et project ID Supabase actif (`vzzbjxmfkmvqkaqxalhr`) présents.
- [ ] Les 3 commandes MCP smoke test (`list_deployments`, `get_logs`, `get_advisors`) référencées copier-coller.
- [ ] Référence explicite à `.claude/agents/pilot-health-watcher.md` (dépendance) et au post-mortem source.
- [ ] Aucune modification hors `docs/PILOT-PREFLIGHT.md`.
- [ ] Ton checklist français Omar-first respecté.
</success_criteria>

<output>
After completion, create:
- `.planning/quick/260523-hjc-pilot-preflight-doc/AUDIT.md`
- `.planning/quick/260523-hjc-pilot-preflight-doc/SUMMARY.md` (avec SHA du commit)
- `.planning/quick/260523-hjc-pilot-preflight-doc/deferred-items.md` (même vide)

Convention `/gsd-quick` standard (5 artefacts, cf. CLAUDE.md). ADVISOR-VERDICT non requis ici : zone non Player-facing (doc ops/preflight).

Commit attendu : `quick(260523-hjc): add docs/PILOT-PREFLIGHT.md (fix post-mortem catégorie A)`.
</output>
