# Deferred items — 260523-hjc-pilot-preflight-doc

## Backlog

- **Coquille post-mortem section A — Supabase project ID** : cité `lpcwlgbgwjynnfgrnnxr` mais le vrai project ID Digi actif (memory + watcher 121 ticks) est `vzzbjxmfkmvqkaqxalhr`. À corriger dans le post-mortem doc plus tard (non urgent — la doc préflight est correcte).
  - Fichier concerné : `.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md` lignes 35 et 72.
  - La doc `docs/PILOT-PREFLIGHT.md` documente la divergence explicitement (Étape 2 + note traçabilité).

- **Coquille post-mortem section A — Vercel team ID** (découverte 2026-05-23 12h46 via dry-run watcher post-fix-A) : cité `team_bMVjT78eJ6bKCCpFJiJLwT7o` mais le vrai team scope (révélé par l'erreur 403 du MCP Vercel) est `team_pSzfPqCUMFSVOCzDhJTXxFHq`. Plus grave que la coquille Supabase parce que Omar copie-colle cet ID dans le scope du nouveau token Vercel.
  - Fichier concerné : `.planning/post-mortem/2026-05-23-digi-hackathon-fixes-design.md` ligne 34.
  - **Hotfixé dans `docs/PILOT-PREFLIGHT.md` Étape 1** (commit suivant le commit initial 260523-hjc).
  - Source de vérité : tick `.planning/pilot-alerts/OFF-PILOT-12h46-tick.md` (Vercel `list_deployments` 403 `Not authorized: Trying to access resource under scope team_pSzfPqCUMFSVOCzDhJTXxFHq`).

- **Action future consolidée** : un quick doc `(quick-XXX-postmortem-ids-fix)` pour aligner le post-mortem sur les vrais IDs (Supabase + Vercel team). Non urgent — la doc préflight est désormais correcte.
