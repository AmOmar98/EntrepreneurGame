# Test deliverable links — Smoke E2E fake URLs

Liens factices `https://` pour les 2 équipes test (`Test Alpha` / `Test Beta`) couvrant les 10 livrables AgriTech (L1 → L5).

Tous les liens passent la validation Zod `httpsUrl` (préfixe `https://`) — aucune ressource réelle n'est requise, les domaines sont des outils plausibles utilisés en pilote (Google Docs / Sheets, Miro, Trello, Notion, Canva).

## Test Alpha — AgriPilot

| # | Mission | Slug | Lien factice |
|---|---|---|---|
| L1.1 | Persona AgriTech | `personae-v1` | https://docs.google.com/document/d/test-alpha-personae-v1/edit |
| L1.2 | Hypothèse VP | `probleme-v1` | https://docs.google.com/document/d/test-alpha-probleme-v1/edit |
| L2.1 | BMC 9 blocs | `esquisse-solution-v1` | https://miro.com/app/board/test-alpha-bmc-v1 |
| L2.2 | MoSCoW Kanban | `fiche-produit-plan-dev-v1` | https://trello.com/b/test-alpha/moscow-v1 |
| L3.1 | Concurrence + carte | `etude-marche-v1` | https://docs.google.com/document/d/test-alpha-concurrence-v1/edit |
| L3.2 | TAM/SAM/SOM | `tam-sam-som-v1` | https://docs.google.com/spreadsheets/d/test-alpha-tam-sam-som-v1/edit |
| L4.1 | ROI/ha + portage | `bmc-v1` | https://docs.google.com/spreadsheets/d/test-alpha-roi-v1/edit |
| L4.2 | Coûts agronomiques | `couts-previsions-v1` | https://docs.google.com/spreadsheets/d/test-alpha-couts-v1/edit |
| L4.3 | Plan acquisition | `strategie-commerciale-v1` | https://notion.so/test-alpha/plan-acquisition-v1 |
| L5 | Pitch deck final | `pitch-deck-v1` | https://canva.com/design/test-alpha-pitch-deck-v1/view |

## Test Beta — EduFlow

| # | Mission | Slug | Lien factice |
|---|---|---|---|
| L1.1 | Persona AgriTech | `personae-v1` | https://docs.google.com/document/d/test-beta-personae-v1/edit |
| L1.2 | Hypothèse VP | `probleme-v1` | https://docs.google.com/document/d/test-beta-probleme-v1/edit |
| L2.1 | BMC 9 blocs | `esquisse-solution-v1` | https://miro.com/app/board/test-beta-bmc-v1 |
| L2.2 | MoSCoW Kanban | `fiche-produit-plan-dev-v1` | https://trello.com/b/test-beta/moscow-v1 |
| L3.1 | Concurrence + carte | `etude-marche-v1` | https://docs.google.com/document/d/test-beta-concurrence-v1/edit |
| L3.2 | TAM/SAM/SOM | `tam-sam-som-v1` | https://docs.google.com/spreadsheets/d/test-beta-tam-sam-som-v1/edit |
| L4.1 | ROI/ha + portage | `bmc-v1` | https://docs.google.com/spreadsheets/d/test-beta-roi-v1/edit |
| L4.2 | Coûts agronomiques | `couts-previsions-v1` | https://docs.google.com/spreadsheets/d/test-beta-couts-v1/edit |
| L4.3 | Plan acquisition | `strategie-commerciale-v1` | https://notion.so/test-beta/plan-acquisition-v1 |
| L5 | Pitch deck final | `pitch-deck-v1` | https://canva.com/design/test-beta-pitch-deck-v1/view |

## Usage

- **Smoke manuel** : copier le lien dans le champ "URL preuve" du livrable, puis soumettre. Le draft `mailto:` s'ouvre — fermer sans envoyer (les 4 comptes `@test.local` ne sont pas routables).
- **Smoke Playwright (swarm)** : les agents `porteur-projet-agreentech` peuvent puiser dans ce fichier comme source de vérité pour les URLs.
- **Aucune ressource n'est réellement servie** sur ces URLs — c'est volontaire, le but est juste de passer la validation Zod `httpsUrl` et de remplir la chaîne soumission → review → score.

## Convention

- Prefix `test-alpha-` ou `test-beta-` pour distinguer les 2 équipes.
- Suffix `-v1` aligné avec la convention des slugs templates (`personae-v1`, `bmc-v1`, …).
- Domaines plausibles → ne déclenchent pas d'alerte de sécurité humaine en review.
