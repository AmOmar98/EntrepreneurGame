# Advisor verdict — N/A

**Zone:** `app/login/`, `app/landing/`, `components/login-*`

**Décision:** eic-pedagogical-advisor **non spawné** — zone pre-auth, hors périmètre R1/R2/R3.

## Justification

Les règles cardinales EIC s'appliquent aux surfaces Player-facing post-auth:
- **R1** — score visible uniquement sur détail livrable (Player connecté)
- **R2** — validators warn-only (Player composant livrable)
- **R3** — pas de blocage inter-mission (Player parcours)

La page `/login` et la landing publique `/landing` sont visitées **avant** toute authentification:
- Aucun score, rang, classement, badge XP affiché
- Aucun validator de livrable
- Aucune notion de progression mission

→ Les 3 règles cardinales sont **structurellement non applicables**.

## Garde-fous restants

- ✅ Dual-mode demo préservé (pas de `hasSupabaseEnv()` / `redirect("/login")` ajouté avant fallback)
- ✅ Branche locale `polish/design-v2-match` (CLAUDE.md polish rule — pas de push/merge)
- ✅ Backend `signIn()` inchangé (signature email+password, détection rôle post-auth via Supabase profiles)
