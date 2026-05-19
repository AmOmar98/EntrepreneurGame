# Spec — Pitch mode + Replay refresh + Jurors table (Digi-Hackathon)

**Date** : 2026-05-19
**Auteur** : Omar + Claude (brainstorming)
**Cible** : Digi-Hackathon (événement courant post-AgreenTech)
**Status** : Validé, prêt pour implémentation
**Orchestration** : approche A — single `/gsd-quick` avec 3 waves parallèles (6-7 subagents `gsd-executor`)

---

## 1. Contexte

Le pilote AgreenTech (13-14 mai 2026) est livré et archivé sous `v0.2-pilot-ready`. L'événement courant est le **Digi-Hackathon** (cf. memory `project_digi_hackathon_13_deliverables.md`). Deux mockups HTML produits hors-Claude par Omar (Figma export, 5 MB chacun, dans `~/Downloads/`) servent de référence visuelle :

1. `Pitch en cours _ grille jury.html` — interface de notation jury en mode théâtre.
2. `Replay _ clôture du hack.html` — page de clôture / replay éditorial + cérémonie.

**Besoin exprimé par Omar** :

> « Same UI/UX! Just don't show to other jury or mentor notation before the end of all pitches (GameMaster activates mode pitch on/off). »
> « CREE ROLE JUROR OR TABLE DEDIE » → décision retenue : **table dédiée `jurors`** (cf. section 4.1 pour justification).

Traduction technique :

- Refresh visuel de `/jury?theater=1` (matching mockup 1) et `/results` + `/results/ceremony` (matching mockup 2).
- Ajout d'une **table dédiée `jurors(event_id, user_id)`** pour identifier qui est jury sur quel événement, indépendamment du rôle global `app_role`.
- Ajout d'un **state machine global pitch mode** (`off | live | closed`) piloté par le GameMaster, qui gouverne la visibilité des scores jury via RLS.
- **Correction d'une faille RLS existante** : `pitch_scores_member_or_mentor_select` (cf. `database/rls.sql:236-238`) autorise tout mentor à lire tous les `pitch_scores` — actuellement le filtre cross-juror est applicatif uniquement (`lib/jury.ts:160`), pas DB-enforced. La migration corrige au passage.
- Export CSV results GM-only, gate `closed`.

## 2. Existant (point de départ)

| Surface | Composant | État |
|---|---|---|
| **Rôles réels** | `lib/types.ts:7` → `"player" \| "mentor" \| "game_master"` | ⚠️ CLAUDE.md désync (mentionne `founder\|mentor\|reviewer\|committee_member\|eic_admin` — à corriger en passant) |
| `/jury` standard | `app/jury/page.tsx` + `app/jury/jury-form.tsx` | OK, 5 critères 0-20, save via `savePitchScoreFlow` |
| `/jury?theater=1` | `JuryPitchTheater` + sous-composants | Fonctionnel, **refresh UI** requis |
| `/results` | `app/results/page.tsx` — 4 branches | Fonctionnel, **refresh UI** + **integration state machine** requis |
| `/results/ceremony` | `app/results/ceremony/page.tsx` + `ResultsCeremonyScreen` | Podium top 3 GM-only, **refresh UI** requis |
| Pitch order | `lib/pitch-order.ts` + `AdminPitchOrderEditor` | OK |
| Publication | `events.results_published_at` + `publishResultsFlow` | OK, gate global existant |
| **RLS `pitch_scores`** | `database/rls.sql:236-260` — `is_mentor()` permet SELECT all | ⚠️ **Faille** : filtre cross-juror est applicatif, pas DB. À refondre. |
| Auth helpers | `is_my_player()`, `is_mentor()`, `is_game_master()` dans `database/rls.sql:1-50` | OK, on ajoute `is_juror(event_id)` |

## 3. État final visé

### Matrice de visibilité

Un **juror** = un user présent dans `public.jurors` pour l'event courant. Peut cumuler avec `app_role = 'mentor'` ou être un mentor non-juror.

| STATE | Player | Mentor (non-juror) | Juror (autres) | Juror (soi-même) | GM |
|---|---|---|---|---|---|
| `off` | rien | rien | rien | grille vide | dashboard prep |
| `live` | rien | rien | **rien** (zéro fuite RLS) | SES scores en saisie | « qui a voté » (sans valeurs) |
| `closed` | écran « merci » | rien | scores + agrégé | scores + agrégé | tout + bouton publier |
| `published` (existant) | écran « merci » + cérémonie au vidéoproj | écran « merci » + cérémonie | ranking complet | ranking complet | ranking + cérémonie GM-only |

**Règles dures** :
- Player et Mentor non-juror ne voient JAMAIS le ranking complet en accès direct. Le top 3 est révélé au vidéoprojecteur via `/results/ceremony` (GM-only).
- Mentor non-juror n'est pas concerné par le flux jury (n'apparaît pas sur `/jury`).
- Juror et Mentor sont des dimensions **indépendantes** : un user peut être mentor + juror, mentor seul, juror seul (peu probable mais autorisé).

### Règles cardinales R1/R2/R3 (cf. `feedback_eic_cardinal_rules`)

- **R1** : cérémonie reveal GM-only ; Player/Mentor `/results` = écran « merci » sans aucun chiffre. ✅
- **R2** : bandeau jury « vos notes restent privées » = `eic-locked-hint--amber`, jamais `error`. ✅
- **R3** : aucun blocage inter-mission introduit. State `live` n'impacte aucune progression Player. ✅

## 4. Architecture & découpe (subagents)

### 4.1 Justification table `jurors` vs enum `juror`

| | Rôle `juror` (enum) | Table `jurors(event_id, user_id)` ✅ |
|---|---|---|
| Migration | `ALTER TYPE app_role ADD VALUE 'juror'` + backfill | `CREATE TABLE jurors` (additif pur) |
| Multi-événements | Un juror reste juror pour toujours | Scopé par event |
| Cumul mentor + juror | Exclusif (1 seul `app_role` par user) | Cumulable |
| RLS granularité | `has_role('juror')` global | `is_juror(event_id)` scoped à la ligne |
| Modèle métier | Juror = identité permanente | Juror = invité d'un événement |

### 4.2 Découpe waves / subagents

```
Wave 1 (parallel, 2 agents) — DB + types
├─ Agent #1 (DB)    : migration table jurors + helper is_juror + pitch_mode_state
│                     + refonte 3 policies pitch_scores (corrige faille)
└─ Agent #2 (types) : types TS Juror + PitchModeState dans lib/types.ts
                       + i18n keys dans lib/i18n.ts

Wave 2 (parallel, 3 agents) — Backend + UI
├─ Agent #3 (backend) : lib/pitch-mode.ts (helpers) + lib/jurors.ts
│                       + guards lib/jury.ts + lib/results.ts
│                       + setPitchModeStateFlow + addJurorFlow / removeJurorFlow
├─ Agent #4 (UI jury) : refresh JuryPitchTheater + sous-composants (mockup 1)
└─ Agent #5 (UI results) : refresh ResultsReplay + ResultsCeremonyScreen (mockup 2)

Wave 3 (sequential) — GM toggles + CSV + audit
├─ Agent #6 (GM admin) : AdminPitchModeToggle + AdminJurorsManager (mini UI)
│                        + integration /admin + /admin/export/results.csv
├─ Advisor eic-pedagogical-advisor : audit R1/R2/R3 — VERDICT obligatoire
└─ Smoke local + commits atomiques + push origin main
```

## 5. Détail des lots

### Lot 5.1 — DB migration (Agent #1)

**Application** : via `mcp__plugin_supabase_supabase__apply_migration` (cf. `feedback_database_deny_workaround` — edits `database/**` deny). Snapshot SQL pour traçabilité dans `.planning/quick/260519-XXX-pitch-mode/migrations/01-jurors-and-pitch-mode.sql`.

```sql
-- ============================================================================
-- Part A : Table jurors + helper is_juror()
-- ============================================================================

CREATE TABLE public.jurors (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at timestamptz NOT NULL DEFAULT now(),
  invited_by uuid REFERENCES auth.users(id),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX idx_jurors_user ON public.jurors(user_id);
CREATE INDEX idx_jurors_event ON public.jurors(event_id);

CREATE OR REPLACE FUNCTION public.is_juror(p_event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.jurors
    WHERE event_id = p_event_id AND user_id = auth.uid()
  )
$$;

ALTER TABLE public.jurors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jurors_gm_all" ON public.jurors
  FOR ALL TO authenticated
  USING (public.is_game_master())
  WITH CHECK (public.is_game_master());

CREATE POLICY "jurors_self_select" ON public.jurors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- Part B : Enum pitch_mode_state + colonnes events
-- ============================================================================

CREATE TYPE public.pitch_mode_state AS ENUM ('off', 'live', 'closed');

ALTER TABLE public.events
  ADD COLUMN pitch_mode_state public.pitch_mode_state NOT NULL DEFAULT 'off',
  ADD COLUMN pitch_mode_closed_at timestamptz NULL;

CREATE OR REPLACE FUNCTION public.set_pitch_mode_closed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.pitch_mode_state = 'closed' AND (OLD.pitch_mode_state IS DISTINCT FROM 'closed') THEN
    NEW.pitch_mode_closed_at := now();
  ELSIF NEW.pitch_mode_state <> 'closed' THEN
    NEW.pitch_mode_closed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_pitch_mode_closed_at
  BEFORE UPDATE OF pitch_mode_state ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_pitch_mode_closed_at();

-- ============================================================================
-- Part C : Refonte RLS pitch_scores (corrige la faille existante)
-- ============================================================================

-- Drop des policies actuelles (database/rls.sql:236-260)
DROP POLICY IF EXISTS "pitch_scores_member_or_mentor_select" ON public.pitch_scores;
DROP POLICY IF EXISTS "pitch_scores_mentor_self_insert" ON public.pitch_scores;
DROP POLICY IF EXISTS "pitch_scores_mentor_self_update" ON public.pitch_scores;

-- SELECT : matrice de visibilité section 3
CREATE POLICY "pitch_scores_select_visibility" ON public.pitch_scores
  FOR SELECT TO authenticated
  USING (
    -- GM voit tout
    public.is_game_master()
    -- Juror voit SES propres notes en tout temps (off/live/closed/published)
    OR (juror_id = auth.uid() AND public.is_juror(pitch_scores.event_id))
    -- Juror voit les notes des AUTRES jurors uniquement en 'closed' ou published
    OR (
      public.is_juror(pitch_scores.event_id)
      AND EXISTS(
        SELECT 1 FROM public.events e
        WHERE e.id = pitch_scores.event_id
          AND (e.pitch_mode_state = 'closed' OR e.results_published_at IS NOT NULL)
      )
    )
    -- Player ne voit PAS ses propres pitch_scores (R1 cardinal — Player ne voit
    -- aucun chiffre de jury, juste l'écran "merci"). Cohérent avec la matrice.
    -- Mentor non-juror : aucune ligne (couvert par les clauses ci-dessus).
  );

-- INSERT : seuls les jurors invités sur l'event peuvent voter
CREATE POLICY "pitch_scores_juror_self_insert" ON public.pitch_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    (juror_id = auth.uid() AND public.is_juror(event_id))
    OR public.is_game_master()
  );

-- UPDATE : idem (un juror peut corriger ses notes tant que ce n'est pas publié)
CREATE POLICY "pitch_scores_juror_self_update" ON public.pitch_scores
  FOR UPDATE TO authenticated
  USING (
    (juror_id = auth.uid() AND public.is_juror(event_id))
    OR public.is_game_master()
  )
  WITH CHECK (
    (juror_id = auth.uid() AND public.is_juror(event_id))
    OR public.is_game_master()
  );

-- DELETE : GM only (déjà existant database/rls.sql:259-260 mais on re-déclare au cas où)
DROP POLICY IF EXISTS "pitch_scores_gm_delete" ON public.pitch_scores;
CREATE POLICY "pitch_scores_gm_delete" ON public.pitch_scores
  FOR DELETE TO authenticated
  USING (public.is_game_master());
```

**Validation post-apply** :
```sql
-- 1. Policies actives
SELECT policyname, cmd, qual FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('pitch_scores', 'jurors');

-- 2. Test cross-juror leak (à exécuter via SET LOCAL request.jwt.claims)
-- Devrait retourner 0 lignes pour un juror "live"
-- Devrait retourner N lignes pour un juror "closed"

-- 3. Pas de backfill auto ici. Pour Digi-Hackathon : 4 jurys dédiés sont
--    provisionnés en amont via Lot 5.7 (script create-jurors.ts). Les 3 mentors
--    AgreenTech historiques NE sont PAS insérés dans `jurors` pour Digi-Hackathon
--    — ils restent mentor sur leurs cohorts mais ne notent pas le hackathon.
```

### Lot 5.2 — Types + i18n (Agent #2)

`lib/types.ts` :
```ts
export type PitchModeState = 'off' | 'live' | 'closed';

export type Juror = {
  eventId: string;
  userId: string;
  invitedAt: string;
  invitedBy: string | null;
};
```

`lib/i18n.ts` (extrait fr, 16 nouvelles keys) :
```ts
// Pitch mode toggle (admin)
admin_pitch_mode_section_title: "Mode pitch",
admin_pitch_mode_off_label: "Préparation",
admin_pitch_mode_off_help: "Avant les pitches — jurys préparent leur grille",
admin_pitch_mode_live_label: "Pitches en cours",
admin_pitch_mode_live_help: "Les jurys notent. Notes invisibles entre jurés.",
admin_pitch_mode_closed_label: "Pitches clos",
admin_pitch_mode_closed_help: "Tous les pitches terminés. Jurys voient les agrégés. Publication débloquée.",
admin_pitch_mode_toggle_confirm_live: "Démarrer les pitches en cours ?",
admin_pitch_mode_toggle_confirm_closed: "Fermer les pitches ? Les jurys verront l'agrégé.",

// Jurors manager (admin)
admin_jurors_section_title: "Jury de l'événement",
admin_jurors_help: "Seuls les users listés ici peuvent voter sur /jury.",
admin_jurors_add_label: "Ajouter un juror (email)",
admin_jurors_remove_label: "Retirer",
admin_jurors_empty: "Aucun juror invité — personne ne pourra noter les pitches.",

// Jury surface
jury_pitch_mode_live_banner: "Vos notes restent privées jusqu'à la clôture des pitches.",
jury_pitch_mode_closed_banner: "Les pitches sont clos. Vous voyez maintenant la moyenne par équipe.",
jury_not_invited: "Vous n'êtes pas invité comme juror sur cet événement.",

// Results / CSV
results_export_csv_label: "Exporter le classement (CSV)",
results_export_csv_gate_message: "Disponible une fois tous les pitches clos.",
```

### Lot 5.3 — Backend (Agent #3)

**`lib/pitch-mode.ts`** (nouveau, ≈90 lignes) :
```ts
import { createClient } from "@/utils/supabase/server";
import type { AppRole, PitchModeState } from "@/lib/types";

export async function getCurrentPitchModeState(): Promise<{
  eventId: string | null;
  state: PitchModeState;
  closedAt: string | null;
  publishedAt: string | null;
}> {
  const supabase = await createClient();
  if (!supabase) return { eventId: null, state: 'off', closedAt: null, publishedAt: null };
  const { data } = await supabase
    .from("events")
    .select("id, pitch_mode_state, pitch_mode_closed_at, results_published_at")
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return { eventId: null, state: 'off', closedAt: null, publishedAt: null };
  const row = data as {
    id: string;
    pitch_mode_state: PitchModeState;
    pitch_mode_closed_at: string | null;
    results_published_at: string | null;
  };
  return {
    eventId: row.id,
    state: row.pitch_mode_state,
    closedAt: row.pitch_mode_closed_at,
    publishedAt: row.results_published_at,
  };
}

/**
 * Visibilité des scores des AUTRES jurés (en sus de soi-même).
 * Doublonne la RLS côté UI pour empêcher l'affichage spéculatif côté server.
 */
export function canSeeOtherJurorsScores(
  state: PitchModeState,
  isJuror: boolean,
  isGameMaster: boolean,
  publishedAt: string | null,
): boolean {
  if (isGameMaster) return true;
  if (publishedAt !== null) return isJuror; // jurors voient le détail post-publish
  return state === 'closed' && isJuror;
}

/**
 * Visibilité du ranking complet (table classée + scores combinés).
 * R1 cardinal : Player et Mentor non-juror jamais.
 */
export function canSeeFullRanking(
  isJuror: boolean,
  isGameMaster: boolean,
  publishedAt: string | null,
): boolean {
  if (isGameMaster) return true;
  if (publishedAt !== null && isJuror) return true;
  return false;
}
```

**`lib/jurors.ts`** (nouveau, ≈60 lignes) :
```ts
export async function getJurorsForEvent(eventId: string): Promise<Juror[]>;
export async function isCurrentUserJuror(eventId: string): Promise<boolean>;
export async function addJurorByEmail(eventId: string, email: string): Promise<{ ok: boolean; message: string }>;
export async function removeJuror(eventId: string, userId: string): Promise<{ ok: boolean; message: string }>;
```

**`lib/jury.ts:getJuryOverview()`** : early return `{ rows: [], notInvited: true }` si `!isCurrentUserJuror(eventId)`. Le composant affiche `jury_not_invited`.

**`lib/results.ts:computeRanking()`** : signature étendue à `{ requesterRole, isJuror, eventOverride? }`. Utilise `canSeeFullRanking()` pour décider si on retourne `rows: []`. Mentor non-juror → toujours `rows: []` hors `published`.

**`app/results/page.tsx`** : refactor 4 branches selon matrice section 3. Player/Mentor non-juror = écran « merci ». Juror en `closed` = ranking visible. GM = toujours.

**`app/actions.ts`** — 3 nouvelles actions :
- `setPitchModeStateFlow(eventId, next)` — GM-only, transitions `off↔live`, `live↔closed`, `closed→off`
- `addJurorFlow(eventId, email)` — GM-only, lookup user via `auth.users.email`, INSERT, revalidatePath('/admin', '/jury')
- `removeJurorFlow(eventId, userId)` — GM-only, DELETE, revalidate

### Lot 5.4 — UI refresh jury theater (Agent #4)

**Cible** : `/jury?theater=1` matching mockup 1.

**Composants impactés** :
- `components/jury-pitch-theater.tsx` — layout grid `[1fr_400px]` (pitch live | sticky notation)
- `components/jury-pitch-grid.tsx` — sliders 0-20 (preview live total /100)
- `components/jury-passage-queue.tsx` — cards avec statut « notée » / « en cours » / « à venir »
- `components/jury-pitch-timer.tsx` — refresh visuel countdown
- **Nouveau bandeau live** : si `pitchModeState === 'live'` → `jury_pitch_mode_live_banner` (ambre, R2)
- **Nouveau bandeau closed** : si `pitchModeState === 'closed'` → `jury_pitch_mode_closed_banner` (vert)
- **Garde not-invited** : si `notInvited === true` → écran simple « Vous n'êtes pas invité comme juror »
- Champ commentaire facultatif par équipe (vérifier si colonne `pitch_scores.comment` existe — si non, l'ajouter dans migration Lot 5.1 Part B bis)

**Échelle conservée** : 0-20 par critère, total /100.

### Lot 5.5 — UI refresh results replay + ceremony (Agent #5)

**Cible** : `/results` (GM + juror post-published) + `/results/ceremony` matching mockup 2.

**`components/results-replay.tsx`** — sections verticales narratives :
1. Hero éditorial (titre Baskervville + sub stats)
2. `<ResultsPodium>` (refresh hauteurs/animations stagger)
3. `<ResultsStatsStrip>` (libellés revus)
4. Classement complet (table existante, accordéon collapsible)
5. `<ResultsTimelineMoments>` (verticale, refresh)
6. Exports (CTA CSV + CTA Cérémonie)

**`components/results-ceremony-screen.tsx`** — refresh :
- Background sombre théâtre
- Reveal staggered 3e → 2e → 1er (CSS `animation-delay` motion-safe)
- Confetti CSS only
- Footer logos partenaires (vérifier `public/partners/` durant exécution)
- Bouton retour `/results`

**Écran « merci » Player/Mentor non-juror** (`app/results/page.tsx:139-175`) — refresh visuel cohérent, aucun chiffre (R1).

### Lot 5.6 — GM admin (toggle + jurors manager + CSV) (Agent #6)

**`components/admin-pitch-mode-toggle.tsx`** :
- Client component, `useActionState(setPitchModeStateFlow, ...)`
- 3 boutons segmentés colorés (bleu/ambre/vert), `confirm()` JS pour `live` et `closed`

**`components/admin-jurors-manager.tsx`** (mini UI) :
- Liste actuelle des jurors (nom + email + bouton retirer)
- Champ input email + bouton « Ajouter »
- Affichage `jurors_empty` si vide
- Garde : empêche `setPitchModeStateFlow(live)` si 0 juror (warn ambre)

**Integration `app/admin/page.tsx`** : après `<AdminStatusBanner>`, avant `<AdminPitchOrderEditor>` :
```
[Status banner]
[Pitch mode toggle] ← nouveau
[Jurors manager] ← nouveau
[Pitch order editor] (existant)
[Leaderboard pré-pitch] (existant)
```

**`app/admin/export/results.csv/route.ts`** (nouveau) :
- GM-only (check role + `dynamic = 'force-dynamic'`)
- Gate : `pitch_mode_state === 'closed'` OU `published`, sinon 403
- Colonnes : `rank, team, idea, pitch_avg, score_project, combined, juror_count`
- Sérialisé via `lib/csv.ts:csvResponse('results-digi-hackathon.csv', ...)`

### Lot 5.7 — Provisioning 4 jurys dédiés (Agent #6, post-DB)

**Décision Omar** : pour Digi-Hackathon, on créé 4 comptes juror dédiés (J01..J04) avec creds aléatoires, distribués physiquement aux jurys partenaires en début d'événement. Pas de backfill auto depuis les mentors AgreenTech.

**Script** : `scripts/create-digi-hackathon-jurors.ts` (Node script Supabase admin, type `tsx scripts/...`). À exécuter une fois en amont via :
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/create-digi-hackathon-jurors.ts
```

**Logique** :
```ts
// scripts/create-digi-hackathon-jurors.ts (squelette)
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const JURORS = [
  { slug: 'J01', name: 'Jury Tamwilcom', email: 'jury-j01@digi-hackathon.eic.ma' },
  { slug: 'J02', name: 'Jury Bank of Africa', email: 'jury-j02@digi-hackathon.eic.ma' },
  { slug: 'J03', name: 'Jury Innov Invest', email: 'jury-j03@digi-hackathon.eic.ma' },
  { slug: 'J04', name: 'Jury Bluespace', email: 'jury-j04@digi-hackathon.eic.ma' },
];

const eventId = '<DIGI_HACKATHON_EVENT_UUID>'; // récupéré via supa.from('events').select().limit(1)

const lines = ['slug,name,email,password'];
for (const j of JURORS) {
  const password = randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12); // 12 chars
  // 1. Create auth user
  const { data, error } = await supa.auth.admin.createUser({
    email: j.email, password, email_confirm: true,
  });
  if (error) throw error;
  const userId = data.user.id;

  // 2. Insert profile (app_role='mentor' — choix validé Omar 2026-05-19)
  await supa.from('profiles').upsert({ user_id: userId, app_role: 'mentor', display_name: j.name });

  // 3. Insert into jurors table (active is_juror() pour event Digi-Hackathon)
  await supa.from('jurors').insert({ event_id: eventId, user_id: userId, invited_at: 'now()' });

  lines.push(`${j.slug},${j.name},${j.email},${password}`);
}

writeFileSync('jurors-digi-hackathon-creds.csv', lines.join('\n'));
console.log('✓ 4 jurys created, creds → jurors-digi-hackathon-creds.csv (gitignored)');
```

**Output** : fichier `jurors-digi-hackathon-creds.csv` à la racine repo (à **gitignorer**, cf. `.gitignore` ajout `jurors-*-creds.csv` au passage). Format identique à `cohorte-agreentech-creds.csv` (cf. memory `reference_cohort_csvs`).

**Distribution** : Omar imprime/transmet les creds physiquement aux 4 jurys avant l'event (carte format A6 par juror, comme les Players).

**Rollback** : `DELETE FROM jurors WHERE event_id = '<DIGI>'; DELETE FROM profiles WHERE user_id IN (...); supa.auth.admin.deleteUser(...)` si besoin de recréer.

## 6. Critères d'acceptation

- [ ] Migration appliquée sur PROD via MCP, `pg_policies` confirme les 4 policies (`jurors_gm_all`, `jurors_self_select`, `pitch_scores_select_visibility`, `pitch_scores_juror_self_insert`, `pitch_scores_juror_self_update`, `pitch_scores_gm_delete`)
- [ ] **Test RLS faille corrigée** : un mentor authentifié non-juror exécute `SELECT * FROM pitch_scores` → 0 lignes (vs 100% des lignes actuellement)
- [ ] **Test RLS live** : juror authentifié exécute `SELECT * FROM pitch_scores WHERE juror_id <> '<self>'` pendant `live` → 0 lignes
- [ ] **Test RLS closed** : même juror après `closed` → N lignes (autres jurors visibles)
- [ ] **4 jurys provisionnés** : J01..J04 visibles dans `auth.users` + `profiles` (app_role=mentor) + `jurors` (event=Digi-Hackathon)
- [ ] **CSV creds gitignored** : `jurors-digi-hackathon-creds.csv` existe à la racine et est listé dans `.gitignore` (pattern `jurors-*-creds.csv`)
- [ ] **Test login juror** : connexion `jury-j01@digi-hackathon.eic.ma` + password → redirect `/jury`, vue théâtre accessible, autres jurys notes invisibles
- [ ] Player et Mentor non-juror sur `/results` voient écran « merci » dans tous les états sauf cérémonie GM-only
- [ ] `/results/ceremony` redirect non-GM vers `/results`
- [ ] `/admin/export/results.csv` renvoie 403 tant que `state !== 'closed'` ET `publishedAt === null`
- [ ] `/jury` affiche `jury_not_invited` pour un mentor non-juror (ex : un des 3 mentors AgreenTech historiques)
- [ ] `setPitchModeStateFlow(live)` rejette quand 0 juror invité (sécurité — ne devrait jamais arriver si Lot 5.7 a tourné)
- [ ] `npm run typecheck && npm run lint && npm run build` passent
- [ ] Audit R1 grep : pas de chiffre sur écran Player/Mentor non-juror
- [ ] Smoke local 2P + 1J(j01) + 1M(non-juror) + 1GM
- [ ] Verdict `eic-pedagogical-advisor` : `OK` ou `WARN with notes` — pas de `BLOCK`
- [ ] CLAUDE.md AppRole désync corrigée en passant (3 rôles `player|mentor|game_master`)

## 7. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| RLS policy mal écrite → fuite cross-juror | Moyenne | **Critique** | Test SQL explicite avant push ; fail-closed par défaut |
| Migration faille RLS casse smoke prod existant | Moyenne | Élevé | Tag `v0.X.Y-pre-pitch-mode` avant edits ; backfill jurors immédiat pour préserver flux mentor jury |
| Script provisioning oublié → 0 juror → `live` impossible | Élevée | Critique | Garde `setPitchModeStateFlow(live)` rejette si 0 juror + checklist runbook avant event |
| GM ferme `closed` par erreur | Moyenne | Moyen | `confirm()` JS + rollback `closed→live` autorisé |
| CSV creds leakés sur git | Moyenne | **Critique** | Ajout pattern `jurors-*-creds.csv` dans `.gitignore` avant exécution du script ; vérif `git status` ne mentionne pas le fichier |
| Mentor AgreenTech historique tente de noter Digi-Hackathon | Faible | Faible | Garde `jury_not_invited` UI + RLS DB-enforced (pas de fuite) |
| Email collision si script relancé | Faible | Moyen | `ON CONFLICT DO NOTHING` sur jurors ; `auth.admin.createUser` échoue gracieusement sur email dup |
| Service-role bypass dans `computeRanking` casse `/results` post-publish | Faible | Élevé | Garder bypass pour `published`, tester avec `publishedAt` set |
| Mockup HTML pas reproductible 1:1 | Élevée | Faible | Subagents UI reçoivent l'analyse texte de l'agent Explore + libellés FR |
| Page `/admin/jurors` manquante pour bootstrap | Faible | Moyen | `AdminJurorsManager` intégré directement dans `/admin` (pas de route séparée) |

## 8. Out of scope (explicitement reporté)

- Exports PDF (47 certificats joueur + rapport 12 pages)
- Replay vidéo automatique avec voix off
- Page publique `eic.ma/hack-26`
- Mascotte Pixel affichant `pitch_mode_state` (idée seed)
- Migration échelle 0-20 → 1-5 étoiles
- Granularité per-pitch (`current_pitch_id` pointer)
- Page dédiée `/admin/jurors` autonome (composant inline dans `/admin` suffit pour le pilote)
- Notifications email aux jurors lors de l'invitation
- Logs d'audit `pitch_mode_state` transitions (au-delà du `closed_at`)

## 9. Annexes

### A. Convention quick orchestrator

Dossier `.planning/quick/260519-XXX-pitch-mode-replay/` avec les 5 artefacts standards :
- `PLAN.md` (waves + agents + commits prévus)
- `AUDIT.md` (smoke 2P + 1M-juror + 1M-non-juror + 1GM)
- `ADVISOR-VERDICT.md` (R1/R2/R3 par `eic-pedagogical-advisor`)
- `SUMMARY.md` (SHA commits + résultat)
- `deferred-items.md` (out-of-scope ci-dessus)
- `migrations/01-jurors-and-pitch-mode.sql` (snapshot SQL appliqué via MCP)

### B. Références fichiers à modifier

**Nouveaux** :
- `lib/pitch-mode.ts` (~90 lignes)
- `lib/jurors.ts` (~60 lignes)
- `components/admin-pitch-mode-toggle.tsx`
- `components/admin-jurors-manager.tsx`
- `app/admin/export/results.csv/route.ts`
- `scripts/create-digi-hackathon-jurors.ts` (Lot 5.7, one-shot)
- `jurors-digi-hackathon-creds.csv` (root, **gitignored**)

**Modifiés** :
- `lib/types.ts` (+2 types `PitchModeState`, `Juror`)
- `lib/i18n.ts` (+16 keys)
- `lib/jury.ts` (early return not-invited, retourne `pitchModeState`)
- `lib/results.ts` (param `requesterRole`, `isJuror`)
- `app/actions.ts` (+3 actions : `setPitchModeStateFlow`, `addJurorFlow`, `removeJurorFlow`)
- `app/admin/page.tsx` (intégrer 2 nouveaux composants)
- `app/results/page.tsx` (refactor 4 branches selon matrice)
- `app/jury/page.tsx` (passer `pitchModeState` + `notInvited`)
- `components/jury-pitch-theater.tsx` (refresh layout + bandeaux state)
- `components/jury-pitch-grid.tsx` (refresh sliders)
- `components/jury-passage-queue.tsx` (refresh cards)
- `components/jury-pitch-timer.tsx` (refresh visuel)
- `components/results-replay.tsx` (restructure sections)
- `components/results-podium.tsx` (refresh hauteurs/anim)
- `components/results-stats-strip.tsx` (libellés revus)
- `components/results-timeline-moments.tsx` (refresh visuel)
- `components/results-ceremony-screen.tsx` (refresh théâtre + reveal staggered)
- `.gitignore` (ajout pattern `jurors-*-creds.csv`)
- `CLAUDE.md` (corriger AppRole : `player | mentor | game_master`)

Total estimé : ~750 lignes de diff sur 23 fichiers (5 nouveaux + 18 modifiés). Soit **3 commits atomiques** :
1. `feat(jurors): table jurors + RLS refonte + pitch_mode_state` (DB + types + i18n + helpers)
2. `feat(jury,results): pitch_mode visibility guards + UI refresh mockups` (lib/jury, lib/results, app/* pages, components/*)
3. `feat(admin): pitch mode toggle + jurors manager + CSV export` (GM tooling)

### C. Liens connexes

- Memory `feedback_eic_cardinal_rules.md` (R1/R2/R3)
- Memory `project_digi_hackathon_13_deliverables.md` (événement courant)
- Memory `feedback_database_deny_workaround.md` (MCP apply_migration vs edit local)
- Memory `feedback_smoke_minimal_2p_1m_1gm.md` (smoke standard)
- Memory `feedback_quick_orchestrator_convention.md` (5 artefacts)
- Memory `feedback_postgresql_plpgsql_pitfalls.md` (IS DISTINCT FROM dans le trigger plpgsql)
- CLAUDE.md section « Default = ship + push »
