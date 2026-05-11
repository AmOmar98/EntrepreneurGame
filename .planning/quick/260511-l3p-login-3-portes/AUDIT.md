# Audit — Quick 260511-l3p

## Conformité plan

| Item | Statut | Détail |
|---|---|---|
| W1.1 `components/login-split-shell.tsx` | ✅ | Server component, 3 variants player/mentor/gm |
| W1.2 `app/login/page.tsx` refactor | ✅ | `searchParams.role`, validation enum, redirect `/landing` fallback |
| W1.3 `components/login-form.tsx` prop role | ✅ | Label conditionnel `Identifiant` / `Email mentor`, classe submit colorée |
| W1.4 `app/landing/page.tsx` 3 hrefs | ✅ | `/login?role=player|mentor|gm` |
| W2.5 `lib/i18n.ts` FR+EN | ✅ | 19 nouvelles clés × 2 locales |
| W2.6 `app/globals.css` section Login v2 | ✅ | 230+ lignes, responsive mobile, 3 variants |
| W3.7 typecheck/lint/build | ✅ | typecheck OK, lint OK, build OK (20 routes) |
| W3.8 smoke local | ✅ | 3 routes role → contenu + skin variant attendus, /login sans role → redirect /landing |

## Suppressions demandées par Omar

| Élément du mockup | Présent | Action | Vérif |
|---|---|---|---|
| Bouton "Continuer avec UEMF SSO" | Mockup uniquement | Non-implémenté | ✅ absent du HTML rendu |
| Séparateur "ou" | Mockup uniquement | Non-implémenté | ✅ absent du HTML rendu |
| Lien "Oublié ?" | Mockup uniquement | Non-implémenté | ✅ absent du HTML rendu |

## Citations remplacées

| Rôle | Mockup original | Implémenté (validé Omar) |
|---|---|---|
| Joueur | « Tu n'es pas seule. » | « Le premier pas vaut mille plans. » |
| Mentor | « Tes commentaires changeront leur trajectoire. » | « Une question juste vaut dix conseils. » |
| GM | « 12 équipes, 47 joueurs, une journée à orchestrer. » | « Chaque équipe compte. Chaque minute aussi. » |

## Cardinaux R1/R2/R3

N/A — pre-auth (cf `ADVISOR-VERDICT.md`). Aucun score/rang/validator/blocage dans la zone.

## Garde-fous CLAUDE.md

| Règle | Statut |
|---|---|
| Dual-mode demo preservé | ✅ Aucun `hasSupabaseEnv()`/`redirect("/login")` ajouté en amont de la page; middleware inchangé |
| Branche `polish/design-v2-match` | ✅ Confirmé via `git branch --show-current` |
| Pas de push, pas de merge | ✅ Local only |
| Convention quick orchestrator | ✅ 5 artefacts dans `.planning/quick/260511-l3p-login-3-portes/` |

## Risques résiduels

- **Mobile <900px** : layout stack vertical, hero compact 280px. Vérif manuel responsive recommandée si edge case.
- **Curl HEAD sur `/login` sans role** : retourne 200 avec body streaming (Next.js RSC). Comportement attendu — le client final navigue vers `/landing` via le streaming RSC.
- **Backend signIn()** : inchangé. Si Supabase auth rejette, le rôle URL est juste cosmétique, l'utilisateur reste sur la même skin (UX cohérent).
