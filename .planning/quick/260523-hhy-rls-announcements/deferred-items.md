# Deferred items — 260523-hhy-rls-announcements

## Observation reportée (smoke confirmation)

- **Vérifier 0 erreur `permission denied for table announcements` au prochain event live.** En OFF-PILOT post-Digi (2026-05-23), il n'y a pas de trafic anon réel qui génèrerait l'erreur. La vraie validation se fera au prochain pilote (TBD automne 2026 ou avant si test sur PROD avec session vidée + RSC hit).
- Critère de succès au prochain event : `mcp__plugin_supabase_supabase__get_logs(service="postgres")` sur fenêtre 24h post-J1 = **0 occurrence** `permission denied for table announcements`.

## Backlog

- **Audit RLS étendu hors announcements** : suite à la découverte de la trap `rls.sql:266 revoke all`, d'autres tables pourraient avoir le même pattern policy-sans-grant. Un quick `gsd-secure-phase` plus tard pour scanner les policies anon orphelines (policy existe mais grant manque) serait utile. Non urgent — `announcements` était le seul cas signalé en logs pendant l'event.

- **Documenter l'ordre des grants dans rls.sql** : le bloc `revoke all on schema public from anon` + re-grants est subtil. Une note d'architecture en haut de `database/rls.sql` expliquant la séquence top-to-bottom et les implications pour les futurs ajouts éviterait des pièges. À faire lors de la prochaine refonte schema (milestone v0.4 seed SEED-001).

- **Sanity check à inclure dans tous futurs quicks RLS anon** : ajouter `has_table_privilege(role, table, op)` au plan template du planner pour zone `database/**`. Le planner l'a fait spontanément ici grâce à la lecture de `rls.sql:266`, mais c'est un anti-pattern qui mérite d'être systématisé.
