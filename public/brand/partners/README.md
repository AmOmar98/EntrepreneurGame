# Partner logos

Ce dossier contient les logos des partenaires affiches sur la page `/login`.

Les fichiers actuels sont des **placeholders textuels** (SVG simples avec le nom
du partenaire centre sur fond gris clair). Ils ne contiennent aucune marque
graphique officielle.

Avant le deploiement pilote (13 mai 2026), Omar doit remplacer chaque fichier
par le logo officiel correspondant, en conservant **exactement** les memes
noms de fichiers :

- `tamwilcom.svg` (Tamwilcom)
- `bank-of-africa.svg` (Bank of Africa Academy)
- `innov-invest.svg` (Innov Invest)
- `bluespace.svg` (Bluespace)
- `eic.svg` (EIC)
- `uemf.svg` (UEMF)

Le composant `components/partner-banner.tsx` lit les fichiers depuis ce dossier
via `next/image` (mode `unoptimized`). Format SVG recommande, ratio approchant
200x80, avec une `<title>` accessible. Pas de modification de code requise lors
du remplacement.
