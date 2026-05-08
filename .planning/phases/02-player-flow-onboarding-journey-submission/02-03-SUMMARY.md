---
phase: 02-player-flow-onboarding-journey-submission
plan: 03
subsystem: player-submission-flow
tags: [submission, deliverable, server-action, zod, rls, ownership]
requires:
  - 02-01
  - 02-02
provides:
  - submitDeliverable server action (V1)
  - /journey/deliverable/[id] page
  - components/submission-form.tsx
  - components/submission-readonly.tsx
affects:
  - app/actions.ts
  - lib/i18n.ts
tech-stack:
  added: []
  patterns:
    - useActionState for form lifecycle + router.refresh() on success
    - Zod superRefine for kind-conditional validation (proof_url XOR proof_text)
    - notFound() instead of forbidden for foreign player_id (RLS returns 0 rows)
key-files:
  created:
    - app/journey/deliverable/[id]/page.tsx
    - components/submission-form.tsx
    - components/submission-readonly.tsx
  modified:
    - app/actions.ts
    - lib/i18n.ts
decisions:
  - Block all re-submits in Plan 03 (Phase 3 will gate V2 on feedback_received verdict)
  - Use notFound() for foreign player_id - hides existence rather than 403 (consistent with RLS-empty result)
  - router.refresh() after success - server page re-renders in readonly mode without client-side state
metrics:
  duration: 172s
  completed: 2026-05-08
  tasks_completed: 2
  files_changed: 5
---

# Phase 02 Plan 03: Player Submission V1 Summary

Livre la page `/journey/deliverable/[id]` et l'action serveur `submitDeliverable` qui permet a un Player de soumettre la V1 d'un livrable (proof_url https:// OU proof_text markdown), avec verrouillage post-soumission et garde d'ownership applicative + RLS.

## What Was Built

### Task 1 — `submitDeliverable` server action (`app/actions.ts`)

Schema Zod avec `superRefine` :
- `proof_url` requiert `httpsUrl` (URL valide ET prefixe `https://`)
- `proof_text` requiert un texte trim >= 10 caracteres, max 4000

Sequence d'execution :
1. Garde `hasSupabaseEnv()` + `createClient()` (mode demo refuse).
2. `safeParse` → `WorkflowState.message` sur erreur (DATA-04, jamais de `return;` silencieux).
3. `auth.getUser()` → refus si pas de session.
4. **Ownership check applicatif** : SELECT `player_members.player_id WHERE user_id = auth.uid()`. Si null → "Aucun Player rattache".
5. **Verrouillage SUBMIT-02** : SELECT `submissions WHERE (player_id, template_id)`. Si une ligne existe deja (toute version) → refus "Une soumission V1 existe deja. Attendez le feedback du Mentor."
6. INSERT `submissions` avec `version=1, status='submitted_v1', submitted_by=user.id`.
7. `revalidatePath("/journey")` + `revalidatePath("/journey/deliverable/${id}")`.

**Note Phase 3** : la verification "v2 autorisee si verdict=request_v2" sera ajoutee dans `app/actions.ts` quand l'action `evaluateSubmission` du Mentor sera livree. Pour l'instant, V2 est completement bloquee.

### Task 2 — Page detail + form/readonly switch

**`app/journey/deliverable/[id]/page.tsx`** (server component) :
- Resolve user → role gate `player` (sinon `pathForRole`).
- `hasSupabaseEnv()` absent → message "Mode demo : soumission desactivee".
- Resolve `player_members.player_id` (sinon `notFound()`).
- Fetch `deliverable_templates` par `id` (sinon `notFound()`).
- Fetch derniere `submissions WHERE (player_id, template_id) ORDER BY version DESC LIMIT 1`.
- Routing UI :
  - status ∈ {`submitted_v1`, `submitted_v2`, `validated`, `rejected`} → `<SubmissionReadonly />`
  - status = `feedback_received` → bandeau "V2 a venir Phase 3"
  - sinon → `<SubmissionForm deliverableTemplateId={id} />`

**`components/submission-form.tsx`** ("use client") :
- `useActionState(submitDeliverable, initialState)`.
- Toggle radio `kind` (proof_url / proof_text) avec rendu conditionnel (input url vs textarea max=4000).
- hidden `deliverableTemplateId`.
- `useEffect` : `if (state.ok) router.refresh()` → la page server re-render en lecture seule.
- Bouton disabled pendant `pending`.
- Affichage `state.message` avec `role="alert"` ou `role="status"`.

**`components/submission-readonly.tsx`** (server) :
- Banniere bleue "Livrable verrouille - en attente du feedback Mentor" si `status='submitted_v1'`.
- Carte affichant statut, date FR (`toLocaleString("fr-FR")`), kind, et soit `<a target="_blank" rel="noopener noreferrer">` (proof_url), soit un `<pre>` whitespace-preserving (proof_text).

**`lib/i18n.ts`** : 23 nouvelles cles `submission_*` ajoutees dans les deux dictionnaires FR + EN, sans diacritiques (convention ASCII du projet).

## Mecanisme de Verrouillage Exact

Le verrouillage opere a deux niveaux :

1. **Cote action serveur** : la requete `existing.length > 0` refuse toute insertion tant qu'une ligne (V1 ou V2) existe pour `(player_id, deliverable_template_id)`. Pour Plan 03, c'est binaire : aucune V1 → autorisee, V1 existe → refus. Phase 3 introduira un branchement sur le verdict d'evaluation pour autoriser V2 quand `feedback_received` est present.
2. **Cote UI** : la page server re-fetch la submission a chaque rendu. Apres le `router.refresh()` post-submit, le composant rendu est `<SubmissionReadonly>`, pas `<SubmissionForm>` — il n'y a donc aucun moyen pour le Player d'invoquer l'action une seconde fois via l'UI sans crafter manuellement un POST (qui sera de toutes facons refuse au niveau action).

La contrainte SQL `UNIQUE (player_id, deliverable_template_id, version)` agit en defense-in-depth : meme un POST direct contournant la verification applicative echouerait au niveau DB.

## Comportement notFound vs Forbidden (Foreign Player Access)

Quand un Player A tente d'acceder a `/journey/deliverable/<id-d-un-template-pour-Player-B>` :

- Le template existe → `deliverable_templates_authenticated_select` (RLS) le retourne (les templates sont publics aux Players authentifies, c'est attendu).
- Le SELECT `submissions WHERE player_id = playerA.id AND deliverable_template_id = id` retourne 0 rows (RLS + filtre WHERE).
- La page rend donc le `<SubmissionForm>` pour ce template.
- Mais si Player A soumet : l'action calcule `membership.player_id = playerA.id`, INSERT avec ce player_id, RLS `submissions_member_self_insert` autorise (`is_my_player(player_id)`), donc l'INSERT reussit MAIS sur Player A, pas sur Player B. C'est correct : Player A ne peut JAMAIS ecrire sur Player B.

Pour le cas "Player accedant a un id qui n'existe pas du tout" → `notFound()` rend la page 404 standard de Next.js.

Pour le cas "Player sans membership" (compte Player orphelin sans `player_members`) → `notFound()` egalement, car aucun parcours n'a de sens sans Player rattache.

**Choix de design** : on prefere `notFound()` plutot qu'un `403 forbidden` pour ne pas reveler l'existence de templates/IDs. C'est aussi coherent avec la facon dont la RLS Postgres "cache" les lignes inaccessibles plutot que de retourner une erreur explicite.

## Strategie router.refresh() Apres Submit

`SubmissionForm` utilise `router.refresh()` plutot que de gerer un etat client local pour basculer en mode readonly :

```tsx
useEffect(() => {
  if (state.ok) {
    router.refresh();
  }
}, [state.ok, router]);
```

Pourquoi :
- Le serveur a deja `revalidatePath` dans l'action → la prochaine requete pour `/journey/deliverable/[id]` re-execute le data fetching.
- `router.refresh()` cote client force le re-render du segment server avec les nouvelles donnees.
- La page server detecte la nouvelle submission V1 et bascule sur `<SubmissionReadonly>` automatiquement.
- Aucun etat client a synchroniser : pas de risque de divergence entre form local et DB.

C'est le pattern Next.js App Router idiomatique pour un form qui modifie des donnees server-rendered.

## Deviations from Plan

None - plan executed exactly as written.

Quelques ajouts conservateurs cote UX/securite, tous alignes avec les conventions du projet :
- Bouton `disabled={pending}` pendant la soumission (evite double-clic involontaire).
- `pattern="https://.*"` cote HTML pour validation client preliminaire (defense-in-depth, la vraie validation reste cote serveur).
- `whiteSpace: "pre-wrap"` sur la description du template + le proof_text readonly pour preserver les sauts de ligne.

## Authentication Gates

Aucune — le pilote Supabase est deja configure (mode prod), aucune intervention manuelle requise.

## Verification

| Critere | Status |
|---------|--------|
| `npm run typecheck` | ✓ Clean |
| `npm run lint` | ✓ Clean |
| `npm run build` | ✓ Clean — route `/journey/deliverable/[id]` 1.77 kB |
| SUBMIT-01 (Zod proof_url https:// OR proof_text <=4000) | ✓ |
| SUBMIT-02 (verrouillage post-V1) | ✓ — refus DB + UI |
| SUBMIT-04 (RLS + check applicatif) | ✓ — `player_members` lookup |
| DATA-04 (pas de swallow) | ✓ — `WorkflowState.message` partout |

## Self-Check: PASSED

Files verified to exist:
- `app/actions.ts` (modified, includes `submitDeliverable`)
- `app/journey/deliverable/[id]/page.tsx` (created)
- `components/submission-form.tsx` (created)
- `components/submission-readonly.tsx` (created)
- `lib/i18n.ts` (modified, 23 `submission_*` keys added)

Commits verified:
- `27f5a6c` feat(02-03): add submitDeliverable server action with Zod validation
- `7da1d35` feat(02-03): add /journey/deliverable/[id] page with form/readonly switch
