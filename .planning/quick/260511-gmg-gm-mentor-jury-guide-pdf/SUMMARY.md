# Quick gmg — Guide pilote AgreenTech PDF (GameMaster · Mentor · Jury)

**Date** : 2026-05-11
**Type** : livrable documentaire (pas de modification de code applicatif)
**Demandé par** : Omar (`omar.ameur98@gmail.com`)

## Output

- `Guide-Pilote-AgreenTech-2026.pdf` — 1.71 MB, ~9 pages A4, brandé EIC navy `#0B2545` / gold `#C9A227`
- `guide.html` — source HTML autonome (CSS inline, images locales en `img/`)
- `img/` — 9 captures embarquées (authentifiées, dédupliquées vs set v02-auto qui contenait des doublons)

## Contenu

1. **Cover page** — branding EIC/UEMF + Entrepreneur Game, pilote 13-14 mai 2026
2. **Avant J1 / Onboarding** — URL login, credentials format `EIC-<mot>-<digits>`, checklist pré-pilote, déroulé J1/J2, les 3 règles cardinales R1/R2/R3
3. **Rôle GameMaster** — cockpit `/admin`, mode live, queue deliverables, annonces, écrans clés, check-lists J1 matin / J2 après-midi, vue `/results` (GameMaster only)
4. **Rôle Mentor** — dashboard `/mentor`, rubric 5×5=25, verdict `validate_v1`, check-list
5. **Rôle Jury** — accès via compte mentor, écran `/jury` + mode theater, rubric pitch, check-list
6. **Beta · Remontées** — screenshot + email Omar (pas de formulaire ni DB), template de message rapide, typologie bugs / gênes / suggestions / cardinaux cassés
7. **Annexes** — table des URLs, glossaire, contact

## Captures intégrées (9)

| Capture | Source |
| --- | --- |
| Login | `screenshots/phase-06-smoke/01-login-desktop-1440.png` |
| Cockpit admin | `screenshots/phase-06-smoke/09-admin-after-logo-fix.png` |
| Vue cohorte | `screenshots/smoke-...-t3-auth/13-regression-overview-admin.png` |
| Queue deliverables | `screenshots/smoke-...-t3-auth/10-admin-deliverables.png` |
| Annonces | `screenshots/smoke-...-t3-auth/09-admin-announce.png` |
| Mentor dashboard | `screenshots/smoke-...-t3-auth/11-mentor-list.png` |
| Mentor submission | `screenshots/smoke-...-t3-auth/12-mentor-submission.png` |
| Jury scoring | `screenshots/phase-06-smoke/06c-jury.png` |
| Results GM | `screenshots/smoke-...-t3-auth/08-results-gm-view.png` |

Note : la suite `smoke-v02-auto` initialement candidate contenait 8 PNG identiques (hash `5B3F8E649B1F`) — probablement smoke non authentifié redirigé sur `/login`. Remplacée par les captures `smoke-t3-auth` + `phase-06-smoke` authentifiées.

## Pas de commit / pas de push

- Aucun fichier hors `.planning/quick/260511-gmg-.../` n'a été modifié.
- Conforme à la politique « polish post-pilot-ready · branche locale isolée NO MERGE » (memory `feedback_polish_isolated_branch`).
- Main reste à `v0.2-pilot-ready` (`ccdc2bc`).

## Pipeline de génération

```powershell
chrome --headless=new --disable-gpu --no-pdf-header-footer ^
  --print-to-pdf="Guide-Pilote-AgreenTech-2026.pdf" ^
  "file:///.../guide.html"
```

Mise à jour ultérieure : éditer `guide.html`, relancer la commande Chrome. Aucun build ni serveur requis.
