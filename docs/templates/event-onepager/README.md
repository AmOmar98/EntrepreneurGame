# Event One-pager Template

Template réutilisable pour générer **N cartes d'onboarding PDF imprimables** (1 par équipe) lors d'un event EIC : Digi-Hackathon, AgreenTech, Hack-Days, futurs cohorts.

## Résultat

1 PDF A4 paysage par équipe contenant : identité équipe (code + nom + lead) · accès plateforme (URL/email/mdp) · mockup desktop `/journey` · WiFi sur place · lieu · coachs (mentors + GameMasters fusionnés) · organisateurs/partenaires. Charte EIC navy `#0B2545` + gold `#C9A227`.

Référence : Digi-Hackathon 2026-05-19 a produit 10 cartes en ~30 min via cette pipeline.

## Fichiers fournis

- `template.html` — gabarit HTML A4 paysage canonique (équipe Simock P01 du Digi-Hackathon comme exemple concret). À cloner pour chaque équipe avec les 5-6 substitutions ciblées.
- `generate-pdfs.mjs` — Playwright headless qui itère sur `*.html` du dossier de travail et produit `*.pdf` correspondants (`preferCSSPageSize: true` + `printBackground: true`).
- `capture-screenshots.mjs` — Playwright headless qui login PROD avec creds team et capture `/journey` en desktop 1280×800 + mobile iPhone 13. À adapter par event (URL PROD, email/mdp d'une équipe test).
- `assets/logo-eic.png` — logo Euromed Innovation Center officiel.
- `assets/logo-uemf.png` — logo UEMF officiel (arabe / tifinagh / français).

## Pipeline (5 phases)

### 1. Sourcing data

- Lire le Welcome Guide PDF officiel de l'event (organisateurs, partenaires, WiFi SSID+mdp, lieu, programme). Format type : `C:\Users\omara\Desktop\Omar's Work\UEMF\Work\Entrepreneuriat - EIC\Partenariats\<Event>\Templates\*-Welcome-Guide.pdf`.
- Lire le cohort CSV `cohorte-<event>-creds.csv` (gitignored, root repo) : `team_id, team_slug, team_name, lead_name, email, password` + section mentors + section jury.
- Si descriptions/idées projets manquent, accepter cartes génériques sans pitch (juste identité + accès).

### 2. Build template P01 manuellement

```bash
mkdir -p .planning/quick/YYMMDD-XXX-onepagers/v2/assets
cp docs/templates/event-onepager/template.html .planning/quick/YYMMDD-XXX-onepagers/v2/p01-<slug>.html
cp docs/templates/event-onepager/assets/* .planning/quick/YYMMDD-XXX-onepagers/v2/assets/
cp docs/templates/event-onepager/generate-pdfs.mjs .planning/quick/YYMMDD-XXX-onepagers/v2/
cp docs/templates/event-onepager/capture-screenshots.mjs .planning/quick/YYMMDD-XXX-onepagers/v2/
```

Puis adapter manuellement le contenu :
- **Badge édition** : `Digi-Hackathon 4ème édition · 20-22 mai 2026` → `<Votre event · dates>`
- **Coachs** : grille 3×N avec pastille navy + initiales gold. Ne pas distinguer mentor/GM/jury — tous "Coachs". Titres `Pr.` / `Dr.` selon CV réels.
- **Organisateurs** : flat list à puces gold, sans tags `Organisateur`/`Partenaire`/`Avec l'appui de` — juste nom officiel + détail.
- **WiFi** : du Welcome Guide PDF.
- **Lieu** : adresse complète.
- **Footer** : adapter mention thématique event.

### 3. Capture screenshots PROD

Adapter `capture-screenshots.mjs` :
- `URL_PROD` = URL PROD de l'event (Vercel).
- `EMAIL` + `PWD` = creds d'une équipe (typiquement P01).
- Login form requiert `?role=player` query param (sinon redirect `/landing`).

```bash
node .planning/quick/YYMMDD-XXX-onepagers/v2/capture-screenshots.mjs
```

Sortie : `assets/screenshot-desktop.png` (+ `screenshot-mobile.png` si conservé dans le layout).

### 4. Dispatch N-1 subagents en parallèle

Après validation utilisateur du P01 :
- Spawn N-1 agents `general-purpose` en **`run_in_background: true`**, single message multi tool-use.
- Chaque prompt : Read P01 template, Write clone verbatim avec UNIQUEMENT 5-6 substitutions ciblées (title, h1 nom, h1 code, lead name, email, password). Aucune autre modification (CSS, logos, mockup, coachs, organisateurs sont identiques).
- Tracker via TaskCreate (1 task / équipe + 1 task verify + 1 task PDFs).
- Attendre les notifications de fin (PAS de sleep / poll).

### 5. Génération PDF + vérification

```bash
node .planning/quick/YYMMDD-XXX-onepagers/v2/generate-pdfs.mjs
```

Le script itère sur `*.html` du dossier, lance Chromium headless, `page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true })`. `preferCSSPageSize: true` est crucial — respecte le `@page size: A4 landscape` du CSS.

Vérification finale :
- Grep résidus template (`<TeamP01>`, `<LeadP01>`, `<emailP01>`, `<pwdP01>`) → doit retourner **uniquement P01**.
- Grep champ unique présent partout (ex: `Dr. Fatimaezzahra` ou WiFi `UEMF_2`) → doit retourner 1× dans chaque fichier.
- Tailles PDF doivent varier de < 1.5 KB entre fichiers (juste les diffs noms).

### 6. Distribution

```bash
# Local repo (gitignored si creds visibles)
mkdir -p digi-hackathon/
cp .planning/quick/YYMMDD-XXX-onepagers/v2/p*.pdf digi-hackathon/

# Partage collègues (OneDrive EIC)
DEST="/c/Users/omara/Desktop/Omar's Work/UEMF/Work/Entrepreneuriat - EIC/Partenariats/<Event>/One-pagers"
mkdir -p "$DEST"
cp .planning/quick/YYMMDD-XXX-onepagers/v2/p*.pdf "$DEST/"
```

## Erreurs évitées (retours Digi-Hackathon 19/05)

- **Template trop dense** (v1 portrait avec programme détaillé + tableau 13 livrables + 3 règles cardinales) → user a demandé épuration → "info utile uniquement".
- **Login form sans `?role=player`** → redirect `/landing` → ajouter le param.
- **Logos placeholder SVG ugly** (`public/brand/partners/uemf.svg` = juste texte gris) → préférer `uemf.png` officiel (logo réel avec arabe / tifinagh).
- **Distinguer mentor / GM** → fusion en "Coachs" unique.
- **Tags Organisateur / Partenaire / Avec l'appui** → flat list.
- **Mockup mobile** → desktop seul suffit pour la version finale.

## Convention

Travail piloté via `/gsd-quick` : `.planning/quick/YYMMDD-XXX-onepagers/v2-<event>/` puis copy finale dans `digi-hackathon/` ou `<event>/` racine repo + OneDrive partagé.
