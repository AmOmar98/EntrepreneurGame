# deferred-items.md — quick 260519-l1l

## Items déférés (volontairement non livrés ce quick)

### 1. `database/seed_event_digi_hackathon.sql` canonique resync
- **Statut** : désync vs PROD. PROD = 7 missions / 15 deliverables. Fichier canonical = 6 missions / 13 deliverables.
- **Raison** : deny-list `Write/Edit(database/**)` actif dans `.claude/settings.local.json`.
- **Workaround** : `.planning/quick/260519-l1l-l1-l2-restructure-persona-fiches/seed_event_digi_hackathon.NEW2.sql` contient le diff complet appliqué via MCP `execute_sql`. À mergerver dans le canonical post-pilote.
- **Action post-pilote** : lever deny + copier NEW2.sql → `database/seed_event_digi_hackathon.sql` + commit `chore(seed): resync canonical with PROD 7-missions structure`.

### 2. Liens OneDrive dédiés 02a et 02b
- **Statut** : `prep-questions-v1` et `fiches-entretien-v1` pointent actuellement vers le PDF parent `EIC-DigiHackathon-02-Design-Thinking` (`DESIGN_THINKING_URL`).
- **Raison** : pas de PDF dédié 02a (Préparation) ni 02b (Fiche-Entretien) dans le source de vérité `Links Templates Livrables Digi-Hackathon.xlsx`.
- **Action** : si Omar produit 2 PDFs séparés (02a + 02b), update `lib/template-links.ts` lignes 25-37 avec les nouveaux templateUrl + labels.

### 3. UI mentor : surface lecture-seule des 10 fiches auto-validées
- **Statut** : la submission auto-validée est insérée en DB avec evaluation associée. Le mentor peut ouvrir `mentor/submission/[id]` mais l'affichage actuel est pensé pour les rubrics manuels.
- **Action** : vérifier rendu côté mentor (`/mentor/submission/[id]/page.tsx` + `mentor-evaluation-panel.tsx`) pour les submissions avec verdict `validate_v1` + scores `fiche_1..10=25`. Probablement le rubric "Fiche entretien N (URL preuve)" s'affiche déjà via `rubric` jsonb. Smoke à confirmer.

### 4. Welcome Guide PDF désync (8 livrables → structure 7 missions / 15 deliverables)
- **Statut** : programme Welcome Guide initial = 6 ateliers en 2 jours. Nouvelle structure = 7 ateliers (ajout M2 Préparation+Entretiens).
- **Hors code** : géré par Omar côté coordination Welcome Guide / PDF distribué aux porteurs.
- **Risque pilote 20-22 mai** : porteurs reçoivent un PDF avec ancien programme. À aligner avant J1 (matin 20/05).

### 5. R1 grep audit — `app/results/ceremony/page.tsx` mentionne `rank`
- **Statut** : fichier GM-only (gated par `role === 'game_master'` redirect). Acceptable.
- **Action** : aucune. R1 cardinal Player respecté (path hors `app/journey/`).

### 6. Composer UX — bouton "Coller 10 URLs en bloc"
- **Statut** : composer impose saisie URL par URL (10 inputs). Lourd si le porteur a déjà ses 10 URLs dans Notion en liste.
- **Action** : pourra être ajouté en v2 (textarea "coller liste" + parser auto vers les 10 inputs).

## Items NON déférés (livrés ce quick)

- ✅ PROD migration 7 missions / 15 deliverables (NEW2.sql applied via MCP)
- ✅ Server action hard-block 2A→2B (HARD_BLOCK_DEPENDENCIES) + auto-validation fiches-entretien-v1
- ✅ Composer client 10 inputs URL HTTPS + fieldset disabled si locked
- ✅ Page détail livrable branche slug → FichesEntretienComposer
- ✅ Template links 2 nouveaux slugs
- ✅ CLAUDE.md doc R3 exception + structure 7 missions
- ✅ Tag rollback `v0.2.1-pre-l1-l2-restructure` poussé sur origin
- ✅ Smoke local : typecheck + lint + build OK ; R1 grep clean
