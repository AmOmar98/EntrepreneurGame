# Quick 260511-l3p — Login 3 portes (split-screen joueur/mentor/GM)

**Branch:** `polish/design-v2-match` (locale, NO push, NO merge — CLAUDE.md polish rule)
**Source designs:** 3 mockups Downloads/Login _*.html (joueur bleu / mentor vert / maître du jeu rouge)
**User asks:** retirer "Continuer avec UEMF SSO" + retirer "Oublié ?" + remplacer citations d'inspiration.

## Décisions

- Architecture: une seule route `/login` skinnée par `?role=player|mentor|gm`. `/landing` (déjà 3 portes) route vers `/login?role=...`. Pas de nouvelle route.
- "← retour" du mockup pointe vers `/landing`.
- `signIn()` backend intact — la sélection de rôle est purement cosmétique (Supabase auth détecte rôle réel post-auth via `profiles.role`).
- Citations validées par Omar:
  - Joueur: « Le premier pas vaut mille plans. »
  - Mentor: « Une question juste vaut dix conseils. »
  - GM: « Chaque équipe compte. Chaque minute aussi. »

## Wave 1 — structure
1. `components/login-split-shell.tsx` (nouveau) — layout 2-col hero/form
2. `app/login/page.tsx` (refactor) — lit `searchParams.role`, fallback redirect `/landing` si absent
3. `components/login-form.tsx` (prop `role`) — label "Identifiant" (player/gm) ou "Email mentor"
4. `app/landing/page.tsx` (edit 3 hrefs) — `/login?role=player|mentor|gm`

## Wave 2 — i18n + CSS
5. `lib/i18n.ts` (FR + EN) — clés: `login_role_player|mentor|gm`, `login_hero_player|mentor|gm`, `login_quote_player|mentor|gm`, `login_identifier`, `login_email_mentor`, `login_back`
6. `app/globals.css` — nouvelle section "Login v2": `.eic-login-v2-shell`, `.eic-login-v2-hero` + variants `--player|--mentor|--gm`, `.eic-login-v2-panel`, `.eic-login-v2-back`, responsive

## Wave 3 — vérif
7. `npm run typecheck && npm run lint && npm run build`
8. Smoke local: `/landing` → cliquer porte → vérifier 3 skins → tester signIn sans Supabase env
9. Commit atomique `polish(login): split-screen 3 roles (joueur/mentor/gm)`
10. **NO push, NO merge**

## Garde-fous
- Pre-auth → eic-pedagogical-advisor N/A (pas de zone Player-facing R1/R2/R3)
- Dual-mode preservé: aucun `hasSupabaseEnv()` / `redirect()` ajouté en haut de la page (auth gérée par middleware)
- Branche locale `polish/design-v2-match`
- Convention quick: 5 artefacts (PLAN/AUDIT/ADVISOR-VERDICT/SUMMARY/deferred-items)

## Hors-scope
- ❌ SSO UEMF
- ❌ Mot de passe oublié (reset = GameMaster manuel)
- ❌ Pas de changement backend `signIn()`
- ❌ Pas de migration DB
