---
quick_id: 260510-rxa
date: 2026-05-10
---

# Quick 260510-rxa — Deferred Items

## In scope ce quick

- Plan 12-04 `apply-migrations-gate` cree (Wave 1.5 blocking)
- PLAN-CHECK §1, §2, §8, verdict + punch list patches
- STATE.md update

## Reportes (toujours TODO, hors scope quick)

Issus de la punch list `12-PLAN-CHECK.md` apres ce patch :

1. **Tag pre-phase 12** — `git tag v0.2.X-pre-phase12 && git push --tags` AVANT Plan 01. Ownership : Omar, juste avant `/gsd-execute-phase 12`. Cf §7 PLAN-CHECK.
2. **CONTEXT.md `<specifics>` cleanup** — retirer `database/schema.sql` / `triggers.sql` / `rls.sql` des specifics (freeze SEED-001 explicite, mais CONTEXT.md trompeur). Ownership : a faire post-execution Plan 01 (qui revele le contour reel des fichiers touches). Cf §4 PLAN-CHECK.
3. **Doc `--legacy-peer-deps`** Plan 09 si overrides choisi : tracer dans CLAUDE.md ops. Ownership : Plan 09 executor + post-commit doc. Cf §7 PLAN-CHECK.

Ces 3 items sont des **WARN** (pas BLOCK) — ne necessitent pas un quick dedie, peuvent etre absorbees lors de l'execution Phase 12 ou en post-mortem.

## Hors scope structurel

- Pas d'apply effectif des migrations en prod (c'est l'objet du Plan 12-04 lui-meme, declenche par `/gsd-execute-phase 12`).
- Pas de smoke runtime (Plan 12 final s'en charge).
- Pas de modification code source.
