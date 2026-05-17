---
quick_id: 260517-g02
slug: pitch-order-secdef-or-codepath
date: 2026-05-17
status: deferred-skeleton
advisor_verdict: REQUIRED (zone R1 cardinal + code refactor multi-files)
origin: spawn de quick 260517-rlh G-02 finding (R1 breach CONFIRMÉ PROD)
must_haves:
  truths:
    - "G-02 confirmé EXPLOITABLE en PROD via probe 2026-05-17 : events_authenticated_select USING(true) expose pitch_order_json à tout authenticated avant publish"
    - "Column-level GRANT REVOKE SELECT (pitch_order_json) FROM authenticated CASSE 3 callsites lecture qui utilisent JWT user et non service_role : lib/pitch-prep.ts:94, lib/jury.ts:105, app/admin/page.tsx:62"
    - "L'app fait déjà le gating R1 client-side dans lib/pitch-prep.ts:105 (ternary sur pitch_order_published_at) mais cela ne protège QUE le rendu — la donnée brute fuite via Supabase JS direct"
    - "GM admin a besoin de lire pitch_order_json même pre-publish (pour editor) → fix RLS row-level qui hide la row = casse aussi le reste de l'UX events"
  artifacts:
    - "PLAN.md (ce fichier)"
    - "ADVISOR-VERDICT.md (a produire — R1 cardinal)"
    - "AUDIT.md (a produire — comparer 3 options)"
    - "SUMMARY.md (a produire)"
    - "supabase/migrations/YYYYMMDDHHMMSS_events_pitch_order_secdef_or_grant.sql (a creer apres decision)"
  key_links:
    - "lib/pitch-prep.ts:92-107 (Player read)"
    - "lib/jury.ts:103-115 (Jury read)"
    - "app/admin/page.tsx:60-69 (GM read)"
    - "app/actions.ts:1920-1935 (GM write)"
    - ".planning/quick/260517-rlh-rls-hardening/260517-rlh-AUDIT.md (G-02 entry)"
    - "database/MANIFEST.md (Option A — toute new migration dans supabase/migrations/)"
---

# Quick 260517-g02 — Pitch order R1 breach fix (SKELETON)

## Status

**deferred-skeleton** — non execute. Capture le scope pour reprise.

## Why deferred

G-02 est un R1 breach **EXPLOITABLE PROD** (probé 2026-05-17). Mais le fix simple `REVOKE SELECT (pitch_order_json) FROM authenticated` casse 3 lectures légitimes parce qu'elles passent par le JWT user, pas par service_role. Le fix correct nécessite **soit** un refactor code (changer les lectures pour utiliser service_role ou une SECURITY DEFINER function), **soit** un design DB plus subtil (view masking). Trop large pour un quick au fil de l'eau.

## Options à comparer (en discuss-phase)

### Option A — SECURITY DEFINER function + column GRANT

```sql
CREATE FUNCTION public.get_event_pitch_order(p_event_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE v_json jsonb; v_pub timestamptz;
BEGIN
  SELECT pitch_order_json, pitch_order_published_at INTO v_json, v_pub
  FROM public.events WHERE id = p_event_id;
  IF is_game_master() OR v_pub IS NOT NULL THEN RETURN v_json; END IF;
  RETURN NULL;
END $$;

REVOKE SELECT (pitch_order_json) ON public.events FROM authenticated;
GRANT SELECT (id, slug, name, starts_at, ends_at, pitch_order_published_at,
              results_published_at, created_at, updated_at) ON public.events TO authenticated;
```

**Pro :** propre, gating native côté DB, GM passe via la function aussi.
**Con :** 3-4 callsites à refactorer (`.select("pitch_order_json")` → `.rpc("get_event_pitch_order")`).

### Option B — Server-action via service_role + column GRANT

Garde `REVOKE SELECT (pitch_order_json) FROM authenticated`. Toute lecture passe par une server action qui crée un client service_role :
- `lib/pitch-prep.ts` → server action `getPitchOrderForPlayer(playerId)` qui gate `is_game_master() OR published`
- `lib/jury.ts` → idem `getPitchOrderForJury(eventId)`
- `app/admin/page.tsx` → server action `getPitchOrderForGM(eventId)` (no gate, GM only)

**Pro :** pas de SQL function, tout en TypeScript, type-safe.
**Con :** plus de surface code modifiée, risque de manquer un callsite. Nécessite SUPABASE_SERVICE_ROLE_KEY dispo en prod (déjà le cas).

### Option C — SECURITY INVOKER view masquante

```sql
ALTER TABLE public.events RENAME TO events_raw;
CREATE VIEW public.events AS SELECT id, slug, name, starts_at, ends_at,
  CASE WHEN is_game_master() OR pitch_order_published_at IS NOT NULL
       THEN pitch_order_json ELSE NULL END AS pitch_order_json,
  pitch_order_published_at, results_published_at, created_at, updated_at
FROM public.events_raw;
```

**Pro :** zero changement code (view a le même nom que la table).
**Con :** renommage de table affecte triggers, RLS policies, FKs. Risque élevé de régression invisible. INSERT/UPDATE via view nécessite INSTEAD OF triggers.

## Recommandation à débattre

**Option A** semble le meilleur compromis (un commit DB + un refactor TS limité de 3 callsites). Option B si on préfère tout en TS. Option C si on veut zero-code-change mais c'est risqué.

## Tasks (à planifier en discuss-phase)

| # | Task | Files | Verify | Done |
|---|------|-------|--------|------|
| 1 | Spawn eic-pedagogical-advisor sur les 3 options | (review) | ADVISOR-VERDICT.md | TODO |
| 2 | Décision Omar entre A/B/C | — | annotée dans ADVISOR-VERDICT.md | TODO |
| 3 | Écrire migration `supabase/migrations/YYYYMMDDHHMMSS_events_pitch_order_*.sql` | supabase/migrations/ | apply via MCP + verify probe | TODO |
| 4 | Refactor callsites (selon option) | lib/pitch-prep.ts, lib/jury.ts, app/admin/page.tsx | typecheck + smoke local | TODO |
| 5 | Probe runtime : Player JWT cannot SELECT pitch_order_json directly | (SQL test) | permission denied | TODO |
| 6 | Probe runtime : GM session lit toujours pitch_order_json | (smoke local) | data renvoyée | TODO |
| 7 | Commit atomique + push origin | git | commit hash | TODO |

## R1/R2/R3

**R1 cardinal direct** : pitch_order_json est exactement le type de donnée que R1 protège (rank/score-adjacent visible Player). L'avis advisor est OBLIGATOIRE.

## Notes

- Bug **EXPLOITABLE en PROD** mais pilote terminé donc pas live-blocking. À traiter dans la fenêtre calme post-pilote, avant le prochain event.
- Tester en local d'abord (dual-mode demo + supabase env de test si dispo) avant apply PROD.
