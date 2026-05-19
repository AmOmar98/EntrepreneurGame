# Deferred items — 260519-rwi

## 1. Refactor "fenêtre paramétrée" (Option B de la review)

**Idée** : extraire les dates J1/J2/J3 + nom event + cohort numbers d'un fichier de config (`.planning/pilot-window.json`) lu par le watcher au début de chaque tick — élimine le drift event-après-event.

**Pourquoi backloggué** : à T-1 du Digi (19/05 soir), patch in-place suffit. Refactor structurel = surface de bug supplémentaire avec gain nul pour Digi.

**Trigger** : démarrage du prochain event post-Digi (= 5ème édition ou autre cohorte).

**Effort estimé** : 1h (fichier JSON + script `node` côté watcher pour parser + tests sur OFF-PILOT et fenêtre valide).

## 2. Checks J3-spécifiques (pitch jury)

**Idée** : le J3 = jour pitch = pattern de trafic différent (jurés qui notent simultanément, /results consulté en fin de journée). Ajouter au watcher une table de checks J3-only :
- spike auth jury (compter requêtes signées role=jury sur 15 min)
- `/jury/submission/[id]/score` POST latence p95
- `/results` GET count (R1 leak = doit rester 0 hors GameMaster)

**Pourquoi backloggué** : la note J3 ajoutée au watcher signale déjà ces zones aux yeux humains du watcher LLM ; checks automatisés = refactor de la table tick. Pas critique J3 si le watcher LLM observe activement.

**Trigger** : si J3 du Digi expose un trou de monitoring concret → quick post-pilote.

## 3. Hardcoder cohort dynamique

**Idée** : le watcher pourrait `SELECT count(*) FROM players p JOIN cohorts c ON c.id = p.cohort_id WHERE c.slug = 'cohorte-digi-mai-2026'` au démarrage pour calibrer le seuil HARD `<2 active sessions` (vs hardcoder 10P). Le drop relatif >50% deviendrait plus robuste sur les futurs events.

**Trigger** : avec (1) refactor fenêtre paramétrée.
