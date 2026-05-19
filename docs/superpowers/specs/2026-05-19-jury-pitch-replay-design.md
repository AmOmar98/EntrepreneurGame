# Spec — Pitch mode + Replay refresh (Digi-Hackathon)

**Date** : 2026-05-19
**Auteur** : Omar + Claude (brainstorming)
**Cible** : Digi-Hackathon (événement courant post-AgreenTech)
**Status** : Validé, prêt pour implémentation
**Orchestration** : approche A — single `/gsd-quick` avec 3 waves parallèles (5-6 subagents `gsd-executor`)

---

## 1. Contexte

Le pilote AgreenTech (13-14 mai 2026) est livré et archivé sous `v0.2-pilot-ready`. L'événement courant est le **Digi-Hackathon** (cf. memory `project_digi_hackathon_13_deliverables.md`). Deux mockups HTML produits hors-Claude par Omar (Figma export, 5 MB chacun, dans `~/Downloads/`) servent de référence visuelle :

1. `Pitch en cours _ grille jury.html` — interface de notation jury en mode théâtre.
2. `Replay _ clôture du hack.html` — page de clôture / replay éditorial + cérémonie.

**Besoin exprimé par Omar** :

> « Same UI/UX! Just don't show to other jury or mentor notation before the end of all pitches (GameMaster activates mode pitch on/off). »

Traduction technique :

- Refresh visuel de `/jury?theater=1` (matching mockup 1) et `/results` + `/results/ceremony` (matching mockup 2).
- Ajout d'un **state machine global pitch mode** (`off | live | closed`) piloté par le GameMaster, qui gouverne la visibilité des scores jury.
- Export CSV results GM-only, gate `closed`.

## 2. Existant (point de départ)

| Surface | Composant | État |
|---|---|---|
| `/jury` standard | `app/jury/page.tsx` + `app/jury/jury-form.tsx` | OK, 5 critères 0-20, save via `savePitchScoreFlow` |
| `/jury?theater=1` | `JuryPitchTheater` + `JuryPitchTimer` + `JuryPitchDials` + `JuryPitchGrid` + `JuryPassageQueue` | Fonctionnel, **refresh UI** requis |
| `/results` | `app/results/page.tsx` — 4 branches (demo / non-GM-pending / non-GM-published / GM-published) | Fonctionnel, **refresh UI** + **integration state machine** requis |
| `/results/ceremony` | `app/results/ceremony/page.tsx` + `ResultsCeremonyScreen` | Podium top 3 GM-only, **refresh UI** requis |
| Pitch order | `lib/pitch-order.ts` + `AdminPitchOrderEditor` | OK, déjà piloté par GM |
| Publication | `events.results_published_at` + `publishResultsFlow` | OK, gate global existant |
| Visibilité jury | RLS `juror_id = auth.uid()` dans `lib/jury.ts:160` | OK pour vote, **manque garde inter-jury** |

## 3. État final visé

### Matrice de visibilité

| STATE | Player | Mentor | Jury (autres) | Jury (soi-même) | GM |
|---|---|---|---|---|---|
| `off` | rien spécial | rien spécial | rien | grille vide | dashboard prep |
| `live` | rien | rien | **rien** (zéro fuite) | SES scores en saisie | « qui a voté » (sans valeurs) |
| `closed` | écran « merci » | écran « merci » | scores + agrégé | scores + agrégé | tout + bouton publier |
| `published` (existant) | écran « merci » + cérémonie au vidéoproj | idem | ranking complet | ranking complet | ranking + cérémonie |

**Player et Mentor ne voient JAMAIS le ranking complet en accès direct.** Le top 3 est révélé au vidéoprojecteur via `/results/ceremony` (GM-only). Cohérent avec le paradigme existant `app/results/page.tsx:139-175`.

### Règles cardinales R1/R2/R3 (cf. `feedback_eic_cardinal_rules`)

- **R1** : la cérémonie reveal reste GM-only (route protégée). Player/Mentor `/results` = écran « merci » sans aucun chiffre. ✅
- **R2** : bandeau jury « vos notes restent privées » = `eic-locked-hint--amber`, jamais `error`. ✅
- **R3** : aucun blocage inter-mission introduit. Le state `live` n'impacte aucune progression Player. ✅

## 4. Architecture & découpe (subagents)

```
Wave 1 (parallel, 2 agents) — DB + types
├─ Agent #1 (DB)    : migration enum + colonnes events.pitch_mode_state + closed_at + RLS pitch_scores
└─ Agent #2 (types) : enum TS dans lib/types.ts + i18n keys dans lib/i18n.ts

Wave 2 (parallel, 3 agents) — Backend + UI
├─ Agent #3 (backend) : lib/pitch-mode.ts (helpers) + guards lib/jury.ts + lib/results.ts + setPitchModeStateFlow
├─ Agent #4 (UI jury) : refresh JuryPitchTheater + sous-composants matching mockup 1
└─ Agent #5 (UI results) : refresh ResultsReplay + ResultsCeremonyScreen matching mockup 2

Wave 3 (sequential) — GM toggle + CSV + audit
├─ Agent #6 (GM toggle + CSV) : AdminPitchModeToggle + integration /admin + /admin/export/results.csv
├─ Advisor eic-pedagogical-advisor : audit R1/R2/R3 — VERDICT obligatoire
└─ Smoke local + commits atomiques + push origin main
```

## 5. Détail des lots

### Lot 5.1 — DB migration (Agent #1)

**Fichier** : appliqué via `mcp__plugin_supabase_supabase__apply_migration` (cf. `feedback_database_deny_workaround`, edits `database/**` deny). Snapshot du SQL dans `.planning/quick/260519-XXX-pitch-mode/migrations/01-pitch-mode-state.sql` (text-only, pour traçabilité).

```sql
-- 1. Enum
CREATE TYPE pitch_mode_state AS ENUM ('off', 'live', 'closed');

-- 2. Colonnes events
ALTER TABLE events
  ADD COLUMN pitch_mode_state pitch_mode_state NOT NULL DEFAULT 'off',
  ADD COLUMN pitch_mode_closed_at timestamptz NULL;

-- 3. Trigger horodatage closed_at
CREATE OR REPLACE FUNCTION set_pitch_mode_closed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pitch_mode_state = 'closed' AND OLD.pitch_mode_state <> 'closed' THEN
    NEW.pitch_mode_closed_at := now();
  ELSIF NEW.pitch_mode_state <> 'closed' THEN
    NEW.pitch_mode_closed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_pitch_mode_closed_at
  BEFORE UPDATE OF pitch_mode_state ON events
  FOR EACH ROW EXECUTE FUNCTION set_pitch_mode_closed_at();

-- 4. RLS update pitch_scores (SELECT)
-- Avant : jurors voient leurs scores (juror_id = auth.uid()) + staff voit tout
-- Après : ajout d'une clause qui ouvre la lecture cross-juror UNIQUEMENT
-- quand pitch_mode_state = 'closed' ET le requester a le rôle 'mentor' (qui inclut les jurés).
DROP POLICY IF EXISTS pitch_scores_select_self ON pitch_scores;
CREATE POLICY pitch_scores_select_visibility ON pitch_scores
  FOR SELECT
  USING (
    juror_id = auth.uid()
    OR is_staff()
    OR (
      has_role('mentor')
      AND EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = pitch_scores.event_id
          AND e.pitch_mode_state = 'closed'
      )
    )
  );
```

**Validation** : SELECT `pg_catalog.pg_policies` après migration pour confirmer la policy active.

### Lot 5.2 — Types + i18n (Agent #2)

`lib/types.ts` :
```ts
export type PitchModeState = 'off' | 'live' | 'closed';
```

`lib/i18n.ts` (extrait fr) :
```ts
admin_pitch_mode_section_title: "Mode pitch",
admin_pitch_mode_off_label: "Préparation",
admin_pitch_mode_off_help: "Avant les pitches — jurys préparent leur grille",
admin_pitch_mode_live_label: "Pitches en cours",
admin_pitch_mode_live_help: "Les jurys notent. Notes invisibles entre jurés.",
admin_pitch_mode_closed_label: "Pitches clos",
admin_pitch_mode_closed_help: "Tous les pitches terminés. Jurys voient les agrégés. Bouton publier débloqué.",
admin_pitch_mode_toggle_confirm_live: "Démarrer les pitches en cours ?",
admin_pitch_mode_toggle_confirm_closed: "Fermer les pitches ? Les jurys verront l'agrégé.",
jury_pitch_mode_live_banner: "Vos notes restent privées jusqu'à la clôture des pitches.",
jury_pitch_mode_closed_banner: "Les pitches sont clos. Vous voyez maintenant la moyenne par équipe.",
results_export_csv_label: "Exporter le classement (CSV)",
results_export_csv_gate_message: "Disponible une fois tous les pitches clos.",
```

### Lot 5.3 — Backend (Agent #3)

**`lib/pitch-mode.ts`** (nouveau, ≈80 lignes) :
```ts
import { createClient } from "@/utils/supabase/server";
import type { AppRole } from "@/lib/types";

export type PitchModeState = 'off' | 'live' | 'closed';

export async function getCurrentPitchModeState(): Promise<{
  eventId: string | null;
  state: PitchModeState;
  closedAt: string | null;
}> {
  const supabase = await createClient();
  if (!supabase) return { eventId: null, state: 'off', closedAt: null };
  const { data } = await supabase
    .from("events")
    .select("id, pitch_mode_state, pitch_mode_closed_at")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return { eventId: null, state: 'off', closedAt: null };
  const row = data as { id: string; pitch_mode_state: PitchModeState; pitch_mode_closed_at: string | null };
  return { eventId: row.id, state: row.pitch_mode_state, closedAt: row.pitch_mode_closed_at };
}

/** Visibilité scores inter-jury : autorisée uniquement en `closed` ou `published`. */
export function canSeeOtherJurorsScores(state: PitchModeState, role: AppRole, publishedAt: string | null): boolean {
  if (role === 'game_master') return true;
  if (publishedAt !== null) return true;
  return state === 'closed' && role === 'mentor';
}

/** Visibilité ranking complet : GM toujours, autres uniquement après publish. */
export function canSeeRanking(role: AppRole, publishedAt: string | null): boolean {
  if (role === 'game_master') return true;
  // Player / Mentor : jamais (cf. matrice section 3). Juror = mentor → idem côté
  // ranking complet, ils voient leur agrégé via canSeeOtherJurorsScores.
  return false;
}
```

**`lib/jury.ts`** : enrichir retour de `getJuryOverview()` avec `pitchModeState` (la valeur courante) pour driver l'UI banner.

**`lib/results.ts:computeRanking()`** : ajouter argument `requesterRole`. Si `!canSeeRanking(role, publishedAt)` ET `role !== 'mentor'` → retourner `rows: []`. Mentor reste autorisé à voir l'agrégé en `closed`, qu'on traite via `canSeeOtherJurorsScores`.

**`app/results/page.tsx`** : refactor des 4 branches en s'appuyant sur `getCurrentPitchModeState()` + `canSeeRanking()` + `canSeeOtherJurorsScores()`. La branche « jury voit agrégé » devient explicite (avant elle était indirectement le « non-published » avec service-role bypass).

**`app/actions.ts`** — nouvelle action :
```ts
const pitchModeSchema = z.object({
  eventId: z.string().uuid(),
  next: z.enum(['off', 'live', 'closed']),
});

export async function setPitchModeStateFlow(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  // 1. Auth + role check (game_master only)
  // 2. Zod parse
  // 3. Transition allowed check (off↔live, live↔closed, closed→off rollback)
  // 4. UPDATE events SET pitch_mode_state = next (trigger gère closed_at)
  // 5. revalidatePath('/admin'), /jury, /results
  // 6. Return { ok: true, message: "Mode pitch ..." }
}
```

### Lot 5.4 — UI refresh jury theater (Agent #4)

**Cible** : `/jury?theater=1` matching mockup 1.

**Composants impactés** :
- `components/jury-pitch-theater.tsx` — refonte layout grid `[1fr_400px]` (zone pitch live | sticky notation)
- `components/jury-pitch-grid.tsx` — sliders 0-20 (ou +/- buttons) avec preview live du total /100
- `components/jury-passage-queue.tsx` — refresh visuel cards avec statut « notée » / « en cours » / « à venir »
- `components/jury-pitch-timer.tsx` — refresh visuel countdown
- **Nouveau bandeau** : si `pitchModeState === 'live'` → afficher `jury_pitch_mode_live_banner` (ambre, R2)
- **Nouveau champ commentaire** facultatif par équipe (TEXTAREA, sauvegardé via action existante — vérifier schéma `pitch_scores` actuel ou ajouter colonne `comment text` si manque)

**Échelle conservée** : 0-20 par critère, total /100 (Q latérale validée).

**Tokens CSS** : réutiliser `eic-*` tokens existants + ajout d'une feuille `app/jury/theater.css` ou extension de `globals.css` pour le layout split-view.

### Lot 5.5 — UI refresh results replay + ceremony (Agent #5)

**Cible** : `/results` (GM) + `/results/ceremony` matching mockup 2.

**`components/results-replay.tsx`** — restructurer en sections verticales narratives :
1. Hero éditorial (titre Baskervville + sub stats)
2. `<ResultsPodium>` (refresh hauteurs/animations stagger)
3. `<ResultsStatsStrip>` (libellés revus)
4. Classement complet (table existante, accordéon collapsible)
5. `<ResultsTimelineMoments>` (verticale, refresh visuel)
6. Exports (CTA CSV + CTA Cérémonie)

**`components/results-ceremony-screen.tsx`** — refresh :
- Background sombre théâtre
- Reveal staggered 3e → 2e → 1er (CSS `animation-delay` motion-safe)
- Confetti CSS only (pas de lib externe)
- Footer logos partenaires (vérifier présence dans `public/partners/`)
- Bouton retour `/results`

**Écran « merci » Player/Mentor** (`app/results/page.tsx:139-175`) — refresh visuel cohérent avec hero du mockup 2, **aucun chiffre** (R1).

### Lot 5.6 — GM toggle + CSV export (Agent #6)

**`components/admin-pitch-mode-toggle.tsx`** (nouveau) :
- Client component, `useActionState(setPitchModeStateFlow, ...)`
- 3 boutons segmentés colorés (bleu/ambre/vert) avec état actif
- `confirm()` pour `live` et `closed` (transitions sensibles)
- Affichage compteur : « N/total jurys ont noté l'équipe en cours »

**Integration `app/admin/page.tsx`** : après `<AdminStatusBanner>`, avant `<AdminPitchOrderEditor>` (ordre logique : prep → ordre → switch live).

**`app/admin/export/results.csv/route.ts`** (nouveau) :
```ts
export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Auth + role check (game_master only) — sinon 403
  // 2. getCurrentPitchModeState() — si state !== 'closed' && publishedAt === null → 403 + message
  // 3. computeRanking({ requesterRole: 'game_master' })
  // 4. Colonnes : rank, team, idea, pitchAvg, scoreProject, combined, juror_count
  // 5. csvResponse('results-digi-hackathon.csv', toCsv(rows))
}
```

## 6. Critères d'acceptation

- [ ] Migration DB appliquée sur PROD via MCP, policy `pitch_scores_select_visibility` visible dans `pg_policies`
- [ ] `setPitchModeStateFlow` accessible uniquement aux GM, transitions illégales rejetées
- [ ] Pendant `live` : un juror authentifié qui requête `/results` ne voit AUCUN score d'un autre juror (test SQL : `SET ROLE authenticated; SET request.jwt.claims TO ...; SELECT * FROM pitch_scores WHERE juror_id <> '<self>';` → 0 lignes)
- [ ] Pendant `closed` : ce même juror voit l'agrégé (mais pas le ranking complet)
- [ ] Player et Mentor sur `/results` voient écran « merci » dans TOUS les états sauf cérémonie GM-only (R1 cardinal)
- [ ] `/results/ceremony` redirect non-GM vers `/results`
- [ ] `/admin/export/results.csv` renvoie 403 tant que `state !== 'closed'` ET `publishedAt === null`
- [ ] `npm run typecheck && npm run lint && npm run build` passent
- [ ] Audit R1 grep : `grep -rn "score\|rank\|note\|/100\|points" app/results --include="*.tsx" | grep -v "(GM)"` n'expose aucun chiffre sur écran Player/Mentor
- [ ] Smoke local 2P + 1M + 1GM (cf. `feedback_smoke_minimal_2p_1m_1gm`)
- [ ] Verdict `eic-pedagogical-advisor` : `OK` ou `WARN with notes` — pas de `BLOCK`

## 7. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| RLS policy mal écrite → fuite cross-juror en `live` | Moyenne | **Critique** (biais notes) | Test SQL explicite avant push ; default fail-closed |
| Refresh UI casse smoke prod existant | Moyenne | Élevé | Tag `v0.X.Y-pre-pitch-mode` avant edits ; smoke 2P+1M+1GM post-merge |
| Migration enum sur PROD avec données existantes | Faible | Élevé | DEFAULT `'off'` sur ALTER ADD COLUMN ; aucune row n'a besoin de backfill |
| GM ferme `closed` par erreur en plein pitch | Moyenne | Moyen | `confirm()` JS + transition reversible `closed→live` autorisée |
| Suppression du bypass service-role dans `computeRanking` casse `/results` post-publish | Faible | Élevé | Garder service-role pour `published` uniquement ; tester avec `publishedAt` set |
| Mockup HTML pas reproductible 1:1 (5 MB inutile à parser) | Élevée | Faible | Subagents UI reçoivent analyse texte de l'agent Explore + libellés FR ; pas besoin des pixels |

## 8. Out of scope (explicitement reporté)

- Exports PDF (47 certificats joueur + rapport 12 pages)
- Replay vidéo automatique avec voix off
- Page publique `eic.ma/hack-26`
- Affichage `pitch_mode_state` dans la mascotte Pixel (idée seed pour `gsd-plant-seed`)
- Migration de l'échelle 0-20 vers 1-5 étoiles
- Granularité per-pitch (current_pitch_id pointer)
- Visibilité partielle pour les mentors non-jurés (tous les mentors ont la même policy)

## 9. Annexes

### A. Convention quick orchestrator

Dossier `.planning/quick/260519-XXX-pitch-mode-replay/` avec les 5 artefacts standards :
- `PLAN.md` (waves + agents + commits prévus)
- `AUDIT.md` (smoke 2P+1M+1GM)
- `ADVISOR-VERDICT.md` (R1/R2/R3 par `eic-pedagogical-advisor`)
- `SUMMARY.md` (SHA commits + résultat)
- `deferred-items.md` (out-of-scope ci-dessus)
- `migrations/01-pitch-mode-state.sql` (snapshot SQL appliqué via MCP)

### B. Références fichiers existants à modifier

- `lib/types.ts` (+1 type)
- `lib/i18n.ts` (+12 keys)
- `lib/jury.ts` (enrichir retour)
- `lib/results.ts` (param `requesterRole`)
- `lib/pitch-mode.ts` (**nouveau**, ≈80 lignes)
- `app/actions.ts` (+1 action `setPitchModeStateFlow`)
- `app/admin/page.tsx` (intégrer `<AdminPitchModeToggle>`)
- `app/admin/export/results.csv/route.ts` (**nouveau**)
- `app/results/page.tsx` (refactor branches + refresh visuel announce screen)
- `app/jury/page.tsx` (passer `pitchModeState` à `JuryPitchTheater`)
- `components/admin-pitch-mode-toggle.tsx` (**nouveau**)
- `components/jury-pitch-theater.tsx` (refresh layout)
- `components/jury-pitch-grid.tsx` (refresh sliders)
- `components/jury-passage-queue.tsx` (refresh cards)
- `components/jury-pitch-timer.tsx` (refresh visuel)
- `components/results-replay.tsx` (restructure sections)
- `components/results-podium.tsx` (refresh hauteurs/anim)
- `components/results-stats-strip.tsx` (libellés revus)
- `components/results-timeline-moments.tsx` (refresh visuel)
- `components/results-ceremony-screen.tsx` (refresh théâtre + reveal staggered)

Total estimé : ~600 lignes de diff réparties sur 20 fichiers, dont 3 nouveaux. Soit 2 commits atomiques (1 backend+DB+actions, 1 UI refresh+CSV) ou 3 si on découpe Mockup 1 / Mockup 2.

### C. Liens connexes

- Memory `feedback_eic_cardinal_rules.md` (R1/R2/R3)
- Memory `project_digi_hackathon_13_deliverables.md` (événement courant)
- Memory `feedback_database_deny_workaround.md` (MCP apply_migration vs edit local)
- Memory `feedback_smoke_minimal_2p_1m_1gm.md` (smoke standard)
- Memory `feedback_quick_orchestrator_convention.md` (5 artefacts)
- CLAUDE.md section « Default = ship + push »
