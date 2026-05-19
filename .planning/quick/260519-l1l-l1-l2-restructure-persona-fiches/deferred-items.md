# deferred-items.md — quick 260519-l1l

## Items déférés (volontairement non livrés ce quick)

### 1. ~~`database/seed_event_digi_hackathon.sql` canonique resync~~ ✅ RÉSOLU 2026-05-19
- **Statut** : RÉSOLU — canonical réécrit depuis PROD comme source de vérité (7 missions / 15 deliverables idempotent ON CONFLICT).
- **Action effectuée** : staging `seed_event_digi_hackathon.CANONICAL.sql` → deny temporairement levé → `cp` vers `database/` → deny re-ajouté. 467 lignes (avant: 399 — ajout M2 prep+entretiens + Persona promu + Design Thinking bonus).

### 2. ~~Liens OneDrive dédiés 02a et 02b~~ ✅ RÉSOLU 2026-05-19
- **Statut** : RÉSOLU — les PDFs dédiés étaient déjà dans l'Excel source, l'agent avait fait un fallback erroné.
- **Action effectuée** : `prep-questions-v1` → `EIC-DigiHackathon-02-Annexe-Banque-Questions.pdf` (IQCE6O77…), `fiches-entretien-v1` → `EIC-DigiHackathon-02b-Fiche-Entretien.pdf` (IQCD7Ld…). Commit follow-up post-quick.

### 3. ~~UI mentor : surface lecture-seule des 10 fiches auto-validées~~ ✅ RÉSOLU 2026-05-19
- **Statut** : RÉSOLU — page mentor détecte slug `fiches-entretien-v1` + query auto-eval par `SYSTEM_AUTO_VALIDATOR_USER_ID` → rend panneau locked "Soumission auto-validée par le système" pour tout mentor (pas seulement Omar). `MentorLinkCard` accepte `fichesUrls` → liste numérotée 10 liens externes au lieu d'un seul. GM revision mailto annoté "Type: Auto-validation système".

### 4. Welcome Guide PDF désync (8 livrables → structure 7 missions / 15 deliverables)
- **Statut** : programme Welcome Guide initial = 6 ateliers en 2 jours. Nouvelle structure = 7 ateliers (ajout M2 Préparation+Entretiens).
- **Hors code** : géré par Omar côté coordination Welcome Guide / PDF distribué aux porteurs.
- **Risque pilote 20-22 mai** : porteurs reçoivent un PDF avec ancien programme. À aligner avant J1 (matin 20/05).

### 5. R1 grep audit — `app/results/ceremony/page.tsx` mentionne `rank`
- **Statut** : fichier GM-only (gated par `role === 'game_master'` redirect). Acceptable.
- **Action** : aucune. R1 cardinal Player respecté (path hors `app/journey/`).

### 6. ~~Composer UX — bouton "Coller 10 URLs en bloc"~~ ✅ RÉSOLU 2026-05-19
- **Statut** : RÉSOLU — `<details>` collapsible "📋 Coller 10 URLs en bloc" ajouté au-dessus du fieldset. Parser split sur `\s,;` + filtre vide + remplit les 10 inputs. Feedback `N/10 URLs réparties` + alerte non-https. Caché si `locked` (gate 2A).

## Items NON déférés (livrés ce quick)

- ✅ PROD migration 7 missions / 15 deliverables (NEW2.sql applied via MCP)
- ✅ Server action hard-block 2A→2B (HARD_BLOCK_DEPENDENCIES) + auto-validation fiches-entretien-v1
- ✅ Composer client 10 inputs URL HTTPS + fieldset disabled si locked
- ✅ Page détail livrable branche slug → FichesEntretienComposer
- ✅ Template links 2 nouveaux slugs
- ✅ CLAUDE.md doc R3 exception + structure 7 missions
- ✅ Tag rollback `v0.2.1-pre-l1-l2-restructure` poussé sur origin
- ✅ Smoke local : typecheck + lint + build OK ; R1 grep clean
