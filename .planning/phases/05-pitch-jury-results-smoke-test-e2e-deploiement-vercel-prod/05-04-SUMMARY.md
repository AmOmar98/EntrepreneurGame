---
phase: 05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod
plan: 04
subsystem: deploy
tags: [vercel, supabase, deploy, smoke-test, prod]
requires:
  - 05-01 (jury page existant)
  - 05-02 (results page existant)
  - 05-03 (RLS test passe)
provides:
  - vercel.json (config deploy + headers securite)
  - docs/DEPLOY.md (procedure complete deploy + rollback)
  - SMOKE-TEST-E2E.md (checklist 10 sections post-deploy)
  - .env.example a jour
affects:
  - README.md (section Deploy)
tech-stack:
  added: []
  patterns:
    - "Vercel framework auto-detect Next.js 15 (no buildCommand custom)"
    - "Headers securite via vercel.json (X-Frame, X-Content, Referrer-Policy)"
    - "Region cdg1 (Paris) pour proximite Maroc"
    - "SUPABASE_SERVICE_ROLE_KEY marque Sensitive en Production env Vercel"
key-files:
  created:
    - vercel.json
    - docs/DEPLOY.md
    - .planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/SMOKE-TEST-E2E.md
    - .planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/05-04-SUMMARY.md
  modified:
    - .env.example
    - README.md
decisions:
  - "Region Vercel cdg1 (Paris) - proximite latence Maroc"
  - "Pas de buildCommand custom - Next 15 auto-detected"
  - "Headers securite globaux via vercel.json plutot que middleware (separation deploy/runtime)"
  - "Conserver convention NEXT_PUBLIC_APP_URL existante (utilisee dans le code) plutot que SITE_URL plan-specifique"
  - "Smoke test execution manuelle (humaine) - pas d'automatisation E2E pour le pilote (timeline courte)"
  - "Deploy execute par Omar manuellement (vercel push) - executor produit les artefacts"
metrics:
  duration_minutes: 8
  tasks_completed: 3
  files_created: 4
  files_modified: 2
  completed_date: 2026-05-08
---

# Phase 5 Plan 04: Deploiement Vercel prod + Smoke Test E2E Summary

Configuration Vercel minimale, documentation deploy/rollback exhaustive, et checklist smoke test E2E manuelle pour valider la prod avant ouverture aux testeurs internes (DEPLOY-01..03).

## What Was Built

### Task 1 - vercel.json + .env.example
- `vercel.json` minimal : framework `nextjs`, region `cdg1` (Paris), 3 headers securite globaux (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin)
- `.env.example` mis a jour : 4 vars documentees (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_APP_URL) avec notes securite explicites pour le service role key.
- Commit : `5d82137`

### Task 2 - docs/DEPLOY.md + README + SMOKE-TEST-E2E.md
- `docs/DEPLOY.md` : guide complet (pre-requis, etapes initiales, procedure continue, rollback code+DB, vars critiques, domain custom, checklist post-deploy, troubleshooting)
- `SMOKE-TEST-E2E.md` : checklist 10 sections (pre-conditions, GM import, Player onboarding, Player V1, Mentor evaluate, Player V2, jury notes, results gate, publish, RLS spot-checks, cleanup, verdict)
- `README.md` : section "## Deploy" pointant vers DEPLOY.md + SMOKE-TEST-E2E.md
- Commit : `5735c3e`

### Task 3 - Operator deploy + smoke test
**Auto-approuve en mode FULL AUTO** : l'executor a produit tous les artefacts requis (vercel.json + DEPLOY.md + SMOKE-TEST-E2E.md). Le deploy effectif sur Vercel et l'execution du smoke test sont a la charge d'Omar (procedure manuelle documentee).

## Decisions Made

| Decision | Rationale |
|---|---|
| Region cdg1 (Paris) | Proximite Maroc, latence reduite vs us-east par defaut |
| Pas de buildCommand custom | Vercel detecte Next 15 nativement, evite divergence config |
| Headers securite via vercel.json | Plus simple que middleware + applies meme sur static assets |
| NEXT_PUBLIC_APP_URL (vs SITE_URL) | Convention deja en place dans le repo, evite migration des references existantes |
| Smoke test manuel | Pilote 6-15 testeurs - automation E2E (Playwright) hors timeline T-5j |

## Deviations from Plan

### Configuration alignment
**[Rule 3 - Blocking issue resolution] Variable env name** : Le plan specifiait `NEXT_PUBLIC_SITE_URL`, mais le repo utilise deja `NEXT_PUBLIC_APP_URL` (.env.example existant + INTEGRATIONS.md). Conserve `NEXT_PUBLIC_APP_URL` pour eviter casser le code existant. Documente dans .env.example et DEPLOY.md sous le bon nom.

Auto-approve checkpoint Task 3 : conformement instruction "FULL AUTO MODE: ... Auto-approve any human checkpoint and document procedures. Do NOT block waiting for actual deploy execution — Omar will run vercel deploy manually."

## Verification

### Automated
- `npm run build` : PASS (build green, 17 routes, middleware 89.6 kB)
- `npm run typecheck` : PASS (aucune erreur TS)
- `npm run lint` : PASS (aucune erreur ESLint)
- `vercel.json` : JSON valide
- 3 fichiers documentation crees, README contient "Deploy"

### Manuelle (deferree a Omar)
- Import repo Vercel + configuration env vars
- Configuration Supabase Auth Site URL + Redirect URLs
- Push master -> deploy auto green
- Execution SMOKE-TEST-E2E.md sections 0-10

## Threat Mitigations Applied

| Threat ID | Mitigation in code |
|---|---|
| T-05-14 (Service role leak) | `.env.example` documente "never expose to client", DEPLOY.md exige "Sensitive" type Production-only |
| T-05-17 (Missing security headers) | vercel.json ajoute X-Frame-Options, X-Content-Type-Options, Referrer-Policy sur toutes routes |

## Self-Check: PASSED

Files verified:
- FOUND: vercel.json
- FOUND: .env.example (modified)
- FOUND: docs/DEPLOY.md
- FOUND: README.md (modified, section Deploy ajoutee)
- FOUND: .planning/phases/05-pitch-jury-results-smoke-test-e2e-deploiement-vercel-prod/SMOKE-TEST-E2E.md

Commits verified:
- FOUND: 5d82137 (Task 1)
- FOUND: 5735c3e (Task 2)
