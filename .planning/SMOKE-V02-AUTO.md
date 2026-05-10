---
smoke_run: 2026-05-10
mode: demo (Supabase env stripped, fake data seed)
dev_port: 3002 (3000 was occupied by stale Next process)
pages_total: 12
pages_passed: 3
pages_partial: 0
pages_failed: 0
pages_blocked: 9
console_errors_total: 0
network_errors_total: 0
status: partial
---

# Smoke v0.2 Auto — Rapport

## Résumé exécutif

Smoke E2E full-auto sur 12 surfaces v0.2 en mode demo (fake data seed), Chrome DevTools MCP. **Aucune erreur console, aucune erreur réseau (4xx/5xx)** — le code est techniquement clean. Mais une régression structurelle vs v0.1 empêche d'auditer visuellement 9 surfaces sur 12 en mode demo : les pages auth-gated (`/journey`, `/mentor`, `/admin*`, `/jury*`, `/results`) **redirigent toutes vers `/login`** côté serveur car `getCurrentUser()` retourne `null` quand Supabase env est absent.

Surfaces réellement rendues : `/`, `/login`, `/onboarding` (3/12).
Surfaces redirigées vers /login : 9/12.

Aucune erreur 500 / aucun crash. Le rendu propre des surfaces accessibles + le redirect propre (pas de boucle, pas d'erreur) confirme que la base est saine.

## Setup

- Backup `.env.local` → `.env.local.bak` ✓
- `.env.local` réécrit avec valeurs Supabase vides (mode demo) ✓
- `npm run dev` lancé en background → port 3000 occupé, fallback auto port 3002 ✓
- Server ready en ~2.5s ✓
- Outils Chrome DevTools MCP chargés via ToolSearch ✓

## Surfaces testées

### 1. `/` (root) — ✅ PASS
- HTTP : 307 redirect vers `/login` (comportement attendu)
- Screenshot desktop 1440x900 : `screenshots/smoke-v02-auto/01-root-desktop-1440.png`
- Console : 0 messages
- Network : 16 requests, tous 200 OK
- Verdict : conforme (rendu /login après redirect)

### 2. `/login` — ✅ PASS
- HTTP : 200 OK
- Screenshots : `02-login-desktop-1440.png`, `02-login-mobile-390.png`
- Console : 0 messages
- Network : 15 requests, 200/304 (logos partenaires en cache 304)
- Verdict : ✅ Phase 6 EIC branding rendu — logos 6 partenaires (tamwilcom, bank-of-africa, innov-invest, bluespace, eic, uemf) chargés OK

### 3. `/journey` — ⚠ BLOCKED (auth-gated)
- HTTP : 307 redirect vers `/login`
- Cause : `getCurrentUser()` retourne null en demo mode → `redirect("/login")` côté serveur (`app/journey/page.tsx:27-30`)
- Screenshots : `03-journey-desktop-1440.png`, `03-journey-mobile-390.png` (montrent /login)
- Console : 0
- Network : 0 erreurs
- Verdict : **non testable visuellement en mode demo**

### 4. `/onboarding` — ✅ PASS
- HTTP : 200 OK (la seule page non-publique qui rend en demo)
- Screenshots : `04-onboarding-desktop-1440.png`, `04-onboarding-mobile-390.png`
- Console : 0 messages
- Network : 10 requests, 0 erreurs
- Verdict : Phase 7 stepper rendu

### 5. `/mentor` — ⚠ BLOCKED (auth-gated)
- HTTP : 307 → /login
- Screenshot : `05-mentor-desktop-1440.png` (montre /login)
- Console : 0 / Network : 0 erreurs

### 6. `/admin` (standard) — ⚠ BLOCKED (auth-gated)
- HTTP : 307 → /login
- Screenshot : `06-admin-desktop-1440.png`

### 7. `/admin?live=1` — ⚠ BLOCKED (auth-gated)
- HTTP : 307 → /login
- Screenshot : `07-admin-live-desktop-1440.png`

### 8. `/admin/deliverables` — ⚠ BLOCKED (auth-gated)
- HTTP : 307 → /login
- Screenshot : `08-admin-deliverables-desktop-1440.png`

### 9. `/admin/announce` — ⚠ BLOCKED (auth-gated)
- HTTP : 307 → /login
- Screenshot : `09-admin-announce-desktop-1440.png`

### 10. `/jury` (standard) — ⚠ BLOCKED (auth-gated)
- HTTP : 307 → /login
- Screenshot : `10-jury-desktop-1440.png`

### 11. `/jury?theater=1` — ⚠ BLOCKED (auth-gated)
- HTTP : 307 → /login
- Screenshot : `11-jury-theater-desktop-1440.png`

### 12. `/results` — ⚠ BLOCKED (auth-gated)
- HTTP : 307 → /login
- Screenshot : `12-results-desktop-1440.png`

## Régression v0.1 (CRITIQUE)

CLAUDE.md décrit le mode demo comme : *« when env vars are absent, all reads come from the in-memory seed in `lib/data.ts` … The app is fully navigable without a backend. »*

**Constat** : ce contrat n'est plus respecté en v0.2.

- ✅ `middleware.ts` no-ope correctement quand `hasSupabaseEnv()` est faux
- ❌ Mais les pages elles-mêmes (`app/journey/page.tsx`, et par symétrie probable les autres dashboards) appellent désormais `getCurrentUser()` puis `redirect("/login")` si `user === null` — court-circuitant le mode seed
- Conséquence : 9/12 surfaces v0.2 ne peuvent plus être testées visuellement sans une vraie session Supabase

`/onboarding` est la seule page non-publique qui rend en demo (vérifié — page rendue 200 OK).

## Findings

### Top 1 — `journey/page.tsx:27-30` court-circuite le mode demo
Code : `const user = await getCurrentUser(); if (!user) redirect("/login");` — exécuté avant le check `data.empty`. En mode demo `user` est toujours null, donc on n'atteint jamais `getJourneyData()`.
Impact : impossible de captures visuelles automatisées sans Supabase. Smoke auto v0.1 montrait /journey en seed → cette voie est fermée.
Sévérité : **medium** (régression du contrat dual-mode documenté). Pas un bloquant pilote car la prod tournera avec Supabase activé.

### Top 2 — Port 3000 occupé par un process Next stale (500 errors)
Probe `curl http://localhost:3000/login` → 500 *« missing required error components »*. Process 52492 toujours en RAM. N'impacte pas le smoke (port 3002 utilisé) mais à nettoyer côté Omar.
Sévérité : **low** (env dev local).

### Top 3 — Aucune erreur console / aucune erreur réseau
Sur les 3 pages réellement rendues + 9 redirects, **0 console errors, 0 4xx/5xx**. C'est rassurant : le code build/runtime est sain en demo mode.

## Cleanup

- Background dev server arrêté ✓ (Stop-Process PID 53396, port 3002 libéré)
- `.env.local` restauré depuis backup ✓ (vérifié : URL Supabase prod présente)
- `.env.local.bak` supprimé ✓
- Aucun fichier source modifié

## Recommendation

**human review** — pas un bloquant pilote, mais audit visuel à compléter.

Le smoke auto démontre que :
- Le code est techniquement sain (0 erreur)
- Le mode demo est cassé pour les pages auth-gated v0.2 (régression contrat)
- Le pilote tournera avec Supabase prod activé donc cette régression n'impacte pas le 13 mai

Pour valider visuellement les 9 surfaces v0.2 bloquées, deux options :
1. Re-run le smoke avec une session Supabase réelle (login auto via cookie injection ou compte test seedé)
2. Restaurer le contrat dual-mode : modifier les pages pour fallback sur le seed `lib/data.ts` quand `getCurrentUser()` est null (cohérent avec CLAUDE.md)

## TODOs Omar (gates pré-pilote 13 mai)

1. **Vérifier visuellement les 9 surfaces v0.2 bloquées** sur prod Vercel (entrepreneur-game-six.vercel.app) avec une session de chacun des 3 rôles : player, mentor, game_master. Captures attendues :
   - /journey (player) : barre verticale L0→L7, hero, drawer
   - /mentor (mentor) : liste players + queue submissions
   - /admin (gm) standard + ?live=1 : cohorte + radar
   - /admin/deliverables (gm) : table toggles is_active
   - /admin/announce (gm) : composer 4×4
   - /jury (committee) standard + ?theater=1
   - /results : « Résultats à venir » ou ranking
2. **Décider** : restaurer le contrat dual-mode demo seed (modifier `app/*/page.tsx` pour fallback sur `lib/data.ts` quand user null) OU mettre à jour CLAUDE.md pour refléter le nouveau comportement (auth obligatoire). Recommandation : option 2 (mode demo n'a plus de valeur stratégique à T-3j).
3. **Nettoyer** le process Next stale sur port 3000 (PID 52492 visible au démarrage du smoke).
4. **Smoke prod final** post-Vercel deploy avec vraies sessions — checklist écrite dans cette section pour faciliter le run.
