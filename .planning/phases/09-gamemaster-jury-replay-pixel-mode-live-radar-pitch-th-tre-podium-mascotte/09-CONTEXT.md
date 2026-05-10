---
gathered: 2026-05-10
status: ready_for_planning
mode: auto-generated (skip_discuss=true)
---

# Phase 9: GameMaster + Jury + Replay + Pixel — Mode live + Radar + Pitch théâtre + Podium + Mascotte - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss=true)

<domain>
## Phase Boundary

GameMaster bascule `/admin` en mode live (radar pulsant fond sombre + bandeau status alert + mascotte Pixel), anime le pitch jury jour 2 en mode théâtre (timer 5 min + grille /5), publie le replay/podium éditorial, compose des annonces live ciblées, et active/désactive des deliverable_templates.

**Requirements couverts** : GMR-01, GMR-02, GMR-03, GMR-04, GMR-05, GMR-06, GMR-07, GMR-08, GMR-09

**Success Criteria** (ROADMAP.md résumés — 8 critères) :
1. Toggle « Mode live » dans topbar `/admin` : (standard) tableau cohorte v0.1 stylé v0.2 / (live) fond sombre + radar XP des équipes + fil du jeu textuel. Cercle taille = score Projet. Vibre + pulsations rouges si activité <5 min, gris/figé si inactif >5 min. Visibilité par défaut `gm_only`. **[GMR-01 + GMR-02 = 1 commit atomique]**
2. Click sur un cercle radar → vue Focus équipe : layout éditorial + numéro classement filigrane "01" + titre Baskervville surdimensionné + citation idée + avatars membres + stats vitales + barre activité verticale
3. Topbar bandeau status simple détectant 4 états : **serein** (vert) / **concentré** (bleu) / **inquiet** (rouge, ≥3 équipes silencieuses >15 min) / **euphorique** (orange). Micro-action contextuelle (ex: « Réveiller les 3 équipes »). Alimente Pixel mascot. **[GMR-08 AVANT GMR-07]**
4. `/jury` jour 2 toggle « Mode pitch » → page théâtre : fond sombre, équipe en cours grand format + timer 5 min décompte + file passage + grille /5 sur 5 critères + textarea commentaire + indicateur « X/5 jurés ont noté »
5. Publish results → tout le monde voit `/results` en mode Replay : fond ivoire, hero verdict éditorial, podium 3 marches (or/argent/bronze), strip 5 stats globales, classement complet, timeline moments forts (manuelle, seedée par GM), bandeau exports
6. Toggle on/off `deliverable_templates` via `/admin/deliverables` (ou intégré `/admin`). Schema = colonne `deliverable_templates.is_active boolean default true` + server action `toggleDeliverableActive(id)` + RLS GM-only. Compromis minimal (full v0.3)
7. Mascotte Pixel SVG (blob doux + oreilles + yeux) floating bottom-right `/admin` mode live, 4 humeurs (serein/concentré/inquiet/euphorique) reflet GMR-08, repliable en pill au clic
8. Annonces live `/admin/announce` : 4 types (info/urgence/célébration/appel), ciblage (toutes/par niveau/équipes/mentors), persistance table `announcements`, lecture Player via reload, pas de Realtime

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
Toutes décisions à la discrétion de Claude. Sources design :
- `.planning/design-v2/project/admin-screens.jsx` (1108 lignes) — `/admin` standard + live mode + radar + focus équipe + bandeau status
- `.planning/design-v2/project/gm-flows.jsx` (702 lignes) — flux GameMaster
- `.planning/design-v2/project/gm-screens.jsx` (619 lignes) — écrans GM additionnels
- `.planning/design-v2/project/jury-screens.jsx` (597 lignes) — `/jury` mode pitch théâtre + `/results` replay
- `.planning/design-v2/project/pixel-mascot.jsx` (352 lignes) — mascotte Pixel SVG 4 humeurs

### Couplages atomiques (DoD-bloquants Phase 9)
- **GMR-01 (toggle live) + GMR-02 (radar) = 1 commit atomique** (pulsations calibrées fond sombre)
- **GMR-08 (bandeau alert) AVANT GMR-07 (Pixel SVG)** — bandeau seul reste shippable

### Schema DB additions
- Colonne `deliverable_templates.is_active boolean not null default true`
- Table `announcements` :
  - `id uuid pk`
  - `event_id uuid fk → events(id)`
  - `kind text check (kind in ('info','urgence','celebration','appel'))`
  - `target_kind text check (target_kind in ('all','level','teams','mentors'))`
  - `target_ids text[]` (level_ids ou player_ids selon target_kind)
  - `body text not null`
  - `created_by_user_id uuid fk auth.users`
  - `created_at timestamptz default now()`
  - RLS : GM peut INSERT ; tous (auth.uid() not null) peuvent SELECT

Migration SQL : `database/migrations/09-gamemaster-live.sql` — DDL idempotent.

### Approche pragmatique mode live (pas de Realtime)
- Toggle live mode = state local (useState) ou query param `?live=1`
- Activité <5 min = computed depuis `last_activity_at` côté server, recalculé sur reload
- Pulsations CSS pure (animations keyframes), pas de re-render React par tick
- Pas de Realtime pour radar — refresh page ou `revalidatePath` sur events

### Approche pragmatique annonces
- Server action `createAnnouncementFlow` → insert row
- Lecture Player : reload page principale (pas de notification push)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/admin/page.tsx` — admin dashboard existant (table cohorte)
- `app/admin/players/[id]/page.tsx` — détail player
- `app/admin/players/import/page.tsx` — bulk import CSV
- `app/admin/export/players.csv/route.ts` — export CSV
- `app/jury/page.tsx` — page jury existante
- `app/results/page.tsx` — page results existante
- `components/csv-import-form.tsx` — form import CSV
- `app/actions.ts` — actions existantes
- `lib/types.ts` — types existants
- Composants Phase 6 : Button, Pill, LevelBadge, ProgressBar, EICLogo
- Phase 7 : i18n keys + journey-* components
- Phase 8 : evaluation_comments + mentor flow

### Established Patterns
- Server actions Zod-validated returning WorkflowState
- Mode dual demo / Supabase
- RLS gating via `is_staff()` SQL helper
- AppShell variant="staff" pour admin (sidebar dark green Phase 6)
- `revalidatePath` après mutation
- French content avec accents OK

### Integration Points
- `/admin` (refonte mode live + radar)
- `/admin/deliverables` (NEW : toggle is_active)
- `/admin/announce` (NEW : composer annonces)
- `/jury` (refonte mode pitch théâtre toggle)
- `/results` (refonte mode replay éditorial)
- Server actions : `toggleDeliverableActiveFlow`, `createAnnouncementFlow`
- Schema migration `09-gamemaster-live.sql`

### Source de vérité design
- 5 fichiers JSX dans `.planning/design-v2/project/` totalisant ~3400 lignes — porter en TSX clean

</code_context>

<specifics>
## Specific Ideas

### Composants à créer
- `components/admin-live-toggle.tsx` (client) — toggle mode standard/live
- `components/admin-radar.tsx` (client) — radar SVG des équipes (cercles XP)
- `components/admin-team-circle.tsx` — cercle équipe avec pulsations CSS
- `components/admin-team-focus.tsx` — vue Focus équipe (au click cercle)
- `components/admin-status-banner.tsx` — bandeau 4 états (serein/concentré/inquiet/euphorique) **GMR-08**
- `components/pixel-mascot.tsx` (client) — mascotte SVG 4 humeurs **GMR-07**
- `components/admin-game-flow.tsx` — fil du jeu textuel (events feed)
- `components/jury-pitch-theater.tsx` (client) — mode pitch jour 2
- `components/jury-pitch-timer.tsx` (client) — timer 5 min countdown
- `components/jury-pitch-grid.tsx` — grille notation /5 5 critères
- `components/results-replay.tsx` — page replay éditorial (hero + podium + stats + classement + timeline)
- `components/results-podium.tsx` — podium 3 marches (or/argent/bronze)
- `components/results-timeline.tsx` — timeline moments forts (manuelle, seedée GM)
- `components/admin-deliverables-table.tsx` — table deliverable_templates avec toggle is_active
- `components/admin-announce-composer.tsx` (client) — composer annonces (4 types + ciblage)
- `components/admin-announcements-list.tsx` — liste annonces récentes côté Player

### Helpers
- `lib/team-activity.ts` — `computeTeamActivityState(team, now)` retourne { active, lastActivityMs, isStale }
- `lib/hack-status.ts` — `computeHackStatus(teams, now)` retourne `'serein'|'concentre'|'inquiet'|'euphorique'` selon distribution activité
- `lib/admin-radar.ts` — calculs positions cercles + tailles selon score

### Pages à créer / modifier
- `app/admin/page.tsx` (refonte avec toggle + radar + status banner + mascotte)
- `app/admin/deliverables/page.tsx` (NEW : table + toggle is_active)
- `app/admin/announce/page.tsx` (NEW : composer annonces)
- `app/jury/page.tsx` (toggle mode pitch théâtre)
- `app/results/page.tsx` (mode replay si results published)

### Server actions
- `toggleDeliverableActiveFlow(templateId)` — Zod uuid, GM-only, flip is_active, revalidatePath
- `createAnnouncementFlow(formData)` — Zod kind/target/body, GM-only, insert row, revalidatePath
- `submitPitchScoreFlow` (déjà Phase 5) — vérifier compat avec mode théâtre
- `markPitchTeamCompleteFlow` (NEW si nécessaire) — pour avancer la file de passage

</specifics>

<deferred>
## Deferred Ideas

- Realtime sync radar → différé v0.3 (current : reload manuel)
- Push notifications annonces → différé v0.3
- Undo annonce → différé
- Édition deliverable_templates (full CRUD) → différé v0.3 (current : juste toggle on/off)
- Animations radar avancées (Framer Motion) → différé (current : CSS pure)
- Vrais avatars membres équipe (upload photo) → différé (current : initiales)

</deferred>
