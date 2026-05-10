---
gathered: 2026-05-10
status: ready_for_planning
mode: auto-generated (skip_discuss=true)
---

# Phase 8: Mentor — Vue lien + Historique + Commentaires async tagués + Action attendue - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss=true)

<domain>
## Phase Boundary

Le Mentor évalue une soumission link-based (URL ou texte) avec commentaires async tagués (`remarque`/`à corriger`), historique V1/V2, champ « Action attendue » obligatoire en cas de demande V2, et confirmation post-évaluation explicite — sans aucun chat live ni Realtime.

**Requirements couverts** : MNT-01, MNT-02, MNT-03, MNT-04, MNT-05, MNT-06

**Success Criteria** (ROADMAP.md) :
1. Mentor sur `/mentor/submission/[id]` voit le lien soumis comme objet central : card avec type détecté (Google Docs / GitHub / Notion / autre selon hostname), URL cliquable, note jointe, bouton « Ouvrir ↗ » nouvel onglet
2. Mentor voit historique des liens (V1 puis V2) — file antichrono
3. Commentaires tagués (`remarque` neutre / `à corriger` rouge) au niveau livrable — async, list antichrono
4. Verdict=`revision` → champ « Action attendue » OBLIGATOIRE (server-side validation), persisté dans `evaluations.feedback_text` ou colonne dédiée
5. Toast confirmation post-évaluation : « Score envoyé · +X XP attribués à [équipe] · Player notifié »
6. Aucun chat live, aucun Realtime / WebSocket

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
Toutes les décisions d'implémentation sont à la discrétion de Claude. Source design : `.planning/design-v2/project/player-flows.jsx` (`MentorFeedback` lignes 203-359 — wireframe mentor-side, à porter en page Mentor).

### Décisions héritées (Phase 7 → Phase 8 dependencies)
- Composants partagés Phase 6 disponibles : `<Button>`, `<Pill>`, `<LevelBadge>`, `<ProgressBar>`, `<EICLogo>`
- Tokens EIC : `--eic-blue`, `--eic-green`, `--eic-cream`
- Polices : Baskervville titres + Montserrat corps
- Phase 7 a livré : journey-track, drawer, hero (côté Player). Pas d'impact direct sur Mentor flow sauf coté affichage `revision-panel.tsx` côté Player qui consomme les commentaires Mentor (PLR-07 dépend MNT-03)
- TODO Phase 7 ouvert : `mentor_assignments` table à créer + parsing structuré du feedback (mentor side) → cette phase peut le faire si pertinent

### Schema DB (à confirmer / créer si manquant)
- `evaluations.feedback_text` text — existe (Phase 3)
- Nouvelle table `evaluation_comments` recommandée :
  - `id uuid pk`
  - `submission_id uuid fk → submissions(id)` ou `evaluation_id uuid fk → evaluations(id)`
  - `author_user_id uuid fk → auth.users`
  - `tag` enum `('remarque', 'a_corriger')`
  - `body text`
  - `created_at timestamptz default now()`
  - RLS : Mentor + Player concerné peuvent lire ; Mentor peut écrire
- `evaluations.expected_action text` (nouvelle colonne) pour « Action attendue » verdict=revision — sinon réutiliser `feedback_text` avec prefix.

### Approche pragmatique (pas de chat live)
- Composer textarea + select tag (`remarque`/`a_corriger`) → server action `addEvaluationComment`
- Liste antichrono des comments via reload page (pas de Realtime)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/evaluation-form.tsx` — form Mentor existant (à refondre pour link-based + tagged comments)
- `components/submission-feedback-card.tsx` — affichage feedback côté Player (à adapter pour structured)
- `app/mentor/submission/[id]/page.tsx` — page Mentor existante
- `lib/types.ts` — types `Submission`, `Evaluation`, `RubricCriterion`
- `app/actions.ts` — `evaluateSubmission`, `evaluateSubmissionFlow` actions existantes
- `database/schema.sql` — schema actuel à étendre (commit DDL atomique séparé)
- Phase 6 primitives + Phase 7 i18n keys

### Established Patterns
- Server actions Zod-validated returning `WorkflowState = { ok, message, mailto? }`
- Mode dual : demo (lib/data.ts seed) + Supabase prod (env-gated)
- RLS pour gating Mentor/Player
- `revalidatePath` après chaque mutation
- Pas de Realtime / WebSocket — tout async via server actions

### Integration Points
- `/mentor` (liste players à évaluer)
- `/mentor/submission/[id]` (page evaluation refondue)
- Server actions à étendre : `evaluateSubmissionFlow` (verdict=revision → expected_action obligatoire), nouveau `addEvaluationCommentFlow`
- Schema : DDL pour `evaluation_comments` + colonne `expected_action`

### Source de vérité design
- `.planning/design-v2/project/player-flows.jsx` lignes 184-360 (`MentorFeedback`) — wireframe principal Phase 8
- Detection link types : Google Docs, GitHub, Notion, autre (par hostname)

</code_context>

<specifics>
## Specific Ideas

### Composants à créer
- `components/mentor-link-card.tsx` — card lien soumis (type detected + URL + note jointe + bouton "Ouvrir ↗")
- `components/mentor-submission-history.tsx` — liste V1/V2 antichrono
- `components/mentor-comments-list.tsx` — liste commentaires tagués
- `components/mentor-comment-composer.tsx` — composer comment (textarea + select tag) (client)
- `components/mentor-evaluation-panel.tsx` — refonte form évaluation avec rubric + verdict + action attendue
- `components/mentor-confirmation-toast.tsx` — toast post-soumission

### Helper
- `lib/link-type.ts` — `detectLinkType(url: string): { type: 'google-docs'|'github'|'notion'|'other', icon, color }`
- `lib/mentor-comments.ts` — fetch + add comments helpers

### DB migration
- `database/migrations/08-mentor-comments.sql` — `evaluation_comments` table + `expected_action` column + RLS

</specifics>

<deferred>
## Deferred Ideas

- Realtime sync des commentaires → différé v0.3 (current : reload page)
- Threading des commentaires → différé v0.3 (current : flat list)
- Notifications push Player → différé (current : reload)

</deferred>
