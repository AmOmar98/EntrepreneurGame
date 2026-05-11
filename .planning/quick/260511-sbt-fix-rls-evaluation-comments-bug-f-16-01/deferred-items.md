# Deferred items — quick-260511-sbt

Items decouverts pendant l'execution mais hors scope (F-16-01 only). A traiter post-pilote (milestone v0.3) :

1. **`supabase/migrations/20260511000000_reapply_seed_t3_polish_refonte.sql` — SQL syntax error (42601).**
   Postgres rejette le fichier sur les literaux E-string concatenes ('E\'...\nE\'...'). La migration a deja ete appliquee en PROD via SQL editor lors du sprint T-3 (260510-l68 / 260511-* batch) ; seul le mirror local est casse. Pour debloquer le push de notre fix F-16-01, on l'a marquee `applied` via `supabase migration repair --linked --status applied 20260511000000`. **A reparer** : reecrire le fichier en concatenation || ou en string $$...$$, et re-checker `supabase migration list --linked`.

2. **4 migrations remote-only sans mirror local.**
   `20260510193421`, `20260510193439`, `20260510230211`, `20260511003139`. Appliquees directement en SQL editor pendant T-3, jamais committees comme fichiers. Marquees `reverted` via `supabase migration repair --linked --status reverted ...` pour debloquer notre push (donnent l'illusion qu'elles n'existent pas cote remote, mais leur effet schema/RLS persiste). **A reparer** : `supabase db pull --linked` pour re-extraire le SQL et committer 4 fichiers mirror, puis `supabase migration repair --linked --status applied` pour les remettre dans l'historique.

Aucun autre item differe. Le fix F-16-01 est complet et autonome.
