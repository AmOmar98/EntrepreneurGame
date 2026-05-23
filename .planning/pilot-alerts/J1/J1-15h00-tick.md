# J1 · 15h00 · TICK · WARN

- PROD home : 307 (redirect vers /login — attendu) · 915ms
- Vercel 5xx (15 min) : 0 (MCP runtime logs inaccessible 403 — Vercel RBAC, pas d'anomalie signalée)
- Supabase RLS denied (15 min) : **2** · `permission denied for table announcements` (13h20:13 + 13h15:33) — sous le seuil HARD (5), mais pattern récurrent depuis ticks précédents
- Slow queries : aucune detectée dans postgres logs (les seules ERRORs = colonnes manquantes, pas de slow query)
- Auth errors : 0 erreur 401/403 dans auth logs · 1 login token refresh observé (`team-simock@digi.uemf.ma` · 13h15:22) — normal J1 atelier
- Active sessions (15 min) : **0** (inter-atelier · stable vs tick précédent 0)
- Deploy status : inaccessible via MCP (403 Vercel RBAC) — PROD répond donc pas de deploy cassé
- Soumissions cumul J1 : **15** (inchangé vs tick 14h50 = 15) · 1 soumission dans la dernière heure
- Advisors security : WARNs préexistants (search_path mutable, anon SECURITY DEFINER) — inchangés vs ticks précédents, pilot-grade accepté

## Points DB notables (non-bloquants)

- `column "created_at" does not exist` (postgres log 13h44:24) + `column "updated_at" does not exist` (13h32:36) — erreurs MCP watcher sur schema check, pas d'impact Players. Colonnes correctes sur submissions = `submitted_at`.
- Announcements RLS denied : 2 occurrences sur 10 min — reste sous seuil HARD (5). Si ce pattern passe a 5+ au prochain tick, escalade automatique.

## Warnings (non-bloquants)

- Announcements RLS denied : 2 occ/10 min. Pattern recurrent J1. Seuil HARD = 5 occ/10 min. A surveiller.
- Sessions actives = 0 : cohérent avec inter-atelier 15h00. Pas de drop car stable depuis le tick 14h50.
- PROD latence 915ms : dans la plage normale (seuil WARN > 1500ms). Pas d'alerte.

**Verdict** : WARN · prochain tick 15h10
