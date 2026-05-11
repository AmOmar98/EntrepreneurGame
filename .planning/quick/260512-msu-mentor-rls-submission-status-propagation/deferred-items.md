# Deferred items — Quick 260512-msu

## Smoke 6 statuts deliverable score block (commits c1eca29 + 2864bd5)

**Reporté post-pilote** (14/05 soir) per choix explicite Omar pendant cette session ("fix complet mais sans smoke").

Le pending smoke documenté dans memory `polish-deliverable-score-pending-smoke.md` reste valide. Les statuts 1-2 ont été partiellement validés visuellement (screenshots `smoke-state1-no-submission.png` + `smoke-state2-submitted-v1.png`) avant de découvrir le bug RLS. Les statuts 3-6 nécessitent un cycle mentor complet — désormais débloqué par cette quick.

À reprendre après merge polish/design-v2-match → main (14/05 soir+) sur le smoke E2E swarm standard 2P+1M+1GM (cf. memory `feedback_smoke_minimal_2p_1m_1gm`).

## Cleanup éventuel `app/actions.ts:525-528`

Le code applicatif fait toujours :

```ts
const { error: updErr } = await supabase
  .from("submissions")
  .update({ status: nextStatus })
  .eq("id", submission.id);
```

Pour mentor : no-op silencieux (RLS bloque). Pour GM : actif (policy l'autorise).

**Pas un blocker** : redondance harmless. Le trigger est désormais canonique. Cleanup possible post-pilote pour clarifier que la status-propagation passe par le trigger, mais cette session ne touche PAS au code app (limite à DB-only pour minimiser le risque pre-pilote).

## RLS policy widening (rejeté)

Approche alternative envisagée puis rejetée : ajouter `or public.is_mentor()` à `submissions_member_self_update`. Risque sécurité : mentor pourrait alors UPDATE n'importe quelle colonne (proof_url, version, …). Trigger SECURITY DEFINER avec mapping canonique verdict→status est plus propre.
