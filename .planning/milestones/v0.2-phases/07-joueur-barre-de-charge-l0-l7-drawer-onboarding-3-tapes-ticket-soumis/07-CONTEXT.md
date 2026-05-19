---
gathered: 2026-05-10
status: ready_for_planning
mode: auto-generated (skip_discuss=true)
---

# Phase 7: Joueur — Barre de charge L0→L7 + Drawer + Onboarding 3 étapes + Ticket SOUMIS - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss=true)

<domain>
## Phase Boundary

Le Player vit le journey refondu — barre verticale L0→L7 (descendante desktop, ascendante mobile), hero unique « Prochaine étape » avec drawer livrables, onboarding 3 étapes éditoriales, ticket SOUMIS avec stamp, écran révision V2 pédagogique.

**Requirements couverts** : PLR-01, PLR-02, PLR-03, PLR-04, PLR-05, PLR-06, PLR-07, PLR-08

**Success Criteria** (de ROADMAP.md) :
1. Player desktop (≥1100px) voit la barre verticale L0→L7 **descendante** ; mobile (<1100px) **ascendante**. Niveau courant pulsé bleu, faits verts, locked grisés/dashed.
2. Hero unique « Prochaine étape » avec UN seul CTA primaire visible (prochain livrable OU « Voir le feedback »). Hover/clic sur niveau ouvre drawer latéral (~400px desktop, full-width mobile) avec missions/livrables, code `M3.1`, titre FR, statut pill, reward XP, bouton action contextuel. **[PLR-03 + PLR-04 = 1 commit atomique]**
3. Player en première session (`onboarded_at IS NULL`) traverse 3 étapes éditoriales sur `/onboarding` : (1) bienvenue + chiffres clés Hack-Days, (2) ton équipe avec coéquipiers, (3) 3 règles du jeu en numéros éditoriaux. Soumission finale = redirect `/journey`.
4. Player après soumission V1 voit l'écran SOUMIS éditorial : fond cream avec sunburst rays, gros « +XP » en gradient, ticket avec stamp « SOUMIS » rotated, sentence soumise, CTA primaire « Retour au journey ».
5. Player après verdict `revision` voit `/journey/deliverable/[id]` avec : message mentor en haut, checklist « Ce qui passe ✓ / Ce qui manque ⚠ », bandeau vert pédagogique « Votre V1 est conservé. Le V2 affine, il ne remplace pas votre démarche initiale. », CTA « Soumettre un nouveau lien ».
6. Player après V1 (avant verdict) voit dans le drawer la card livrable en état « En revue » avec timestamp + nom mentor assigné (ex: « Sami K. · soumis il y a 8 min »).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
Toutes les décisions d'implémentation sont à la discrétion de Claude — discuss skipped (workflow.skip_discuss=true). Source de vérité design : `.planning/design-v2/` (bundle Claude Design exporté 2026-05-08).

### Décisions héritées (Phase 6 — DSY-01..07 livrés)
- Tokens EIC : `--eic-blue` (#1B3A5C), `--eic-green` (#2E7D32), `--eic-cream` (#F6F1E8) — **utiliser exclusivement**
- Polices : Baskervville (titres h1-h4) + Montserrat (corps) self-hosted via `next/font/google`
- Primitives partagées disponibles dans `components/ui/` : `<Button variant="primary|success|ghost">`, `<Pill tone="blue|green|amber|rose">`, `<LevelBadge state="done|current|locked">`, `<ProgressBar value={0..1}>`, `<EICLogo>`
- AppShell variant Player = topbar légère + tab bar mobile bottom (sidebar retirée chez Player)
- Pas d'inline `style={...}` ad hoc dans les pages refondues
- Tokens v0.1 legacy `--brand-*`, `--green`, `--blue` restent en parallèle pour ne pas casser les composants v0.1 non touchés
- Glass effect avec fallback `@supports not (backdrop-filter)` rend en blanc 92% opaque
- Aurora doux disponible via classe utilitaire `.eic-aurora`

### Couplages atomiques (DoD-bloquants Phase 7)
- **PLR-03 (hero unique) + PLR-04 (drawer) = 1 commit atomique** (couplage explicite ROADMAP.md)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/Button.tsx`, `Pill.tsx`, `LevelBadge.tsx`, `ProgressBar.tsx`, `EICLogo.tsx` (Phase 6)
- `components/app-shell.tsx` avec variant prop (player/staff)
- `components/proof-workflow.tsx` — flux de soumission link-based existant (à réutiliser)
- `lib/data.ts` — types `Stage` (L0_diagnostic..L7_pitch — à vérifier), `DeliverableStatus`
- `lib/i18n.ts` — dictionnaire FR/EN à étendre
- `app/journey/page.tsx` — page actuelle à refondre
- `app/journey/deliverable/[id]/page.tsx` — page deliverable existante
- `app/onboarding/page.tsx` — page onboarding actuelle (1 étape) à refondre en 3 étapes
- Server actions disponibles dans `app/actions.ts` : `submitDeliverable`, `submitDeliverableFlow`, `saveOnboardingKyc`

### Established Patterns
- App Router server-first ; client components seulement pour interactivité (drawer, animations)
- Server actions Zod-validated returning `WorkflowState = { ok, message, mailto? }`
- Mode dual : demo (lib/data.ts seed) + Supabase prod (env-gated)
- Path alias `@/*` → repo root
- French primary, ASCII strings (no diacritics in code)
- `revalidatePath` après chaque mutation (no `revalidateTag`)

### Integration Points
- `/journey` (page principale Player)
- `/journey/deliverable/[id]` (page deliverable individuel)
- `/onboarding` (3 étapes pour first session)
- AppShell variant=player (topbar légère + tab bar mobile)
- Server actions `submitDeliverable*`, `saveOnboardingKyc` pour persistance
- Schema DB existant : `players.onboarded_at`, `submissions.status`, `deliverable_templates`, `evaluations.feedback_text`

### Source de vérité design
- `.planning/design-v2/` — bundle Claude Design exporté 2026-05-08
- README + chats/chat1.md + project/ — décrivent les composants visuels attendus

</code_context>

<specifics>
## Specific Ideas

### Composants à créer (suggérés par ROADMAP)
- `<JourneyTrack>` : barre verticale L0→L7 (responsive desktop descendante / mobile ascendante)
- `<DeliverableDrawer>` : panneau latéral 400px desktop / full-width mobile
- `<OnboardingStepper>` : navigation ← Précédent / Suivant → entre 3 écrans
- `<SubmissionTicket>` : ticket SOUMIS rotated + sunburst rays + +XP gradient
- `<RevisionPanel>` : message mentor + checklist passe/manque + bandeau pédagogique vert
- `<MentorAssignmentBadge>` : « Sami K. · soumis il y a 8 min »

### Comportements clés
- Pulse animation niveau courant (CSS keyframes, prefers-reduced-motion guard)
- Drawer animation ouverture latérale (transform translate)
- Ticket stamp rotated (CSS rotate -8deg)

</specifics>

<deferred>
## Deferred Ideas

- Gamification avancée (badges, achievements) → différé v0.3
- Animations Lottie/Framer Motion → différé v0.3 (CSS keyframes suffisent v0.2)
- Multi-langue EN complète → priorité FR pour le pilote, EN différé

</deferred>
