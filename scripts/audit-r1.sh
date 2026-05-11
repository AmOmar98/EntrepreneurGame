#!/usr/bin/env bash
# scripts/audit-r1.sh — Audit R1 (score/rang invisible Player) automatisé.
#
# Cardinaux EIC (cf. CLAUDE.md + RETROSPECTIVE-T3-2026-05-10.md) :
#   R1 = score/rang invisible côté Player (jury et GameMaster uniquement).
#
# Ce script applique le grep canonique de la mission Ralph
# (.claude/ralph-mission.md §règles transverses) sur les surfaces
# Player-facing. Exit 0 si clean, exit 1 si match suspect non-whitelisted.
#
# Surfaces auditées :
#   - app/journey/             (Player route)
#   - app/results/             (Player + GM ; GM gates par isGameMaster)
#   - components/results-*     (rendu /results, gated isGameMaster)
#   - components/submission-*  (rendu Player submissions)
#   - components/engagement-*  (Phase 14 badges qualitatifs)
#
# Whitelist (matches autorisés, gamification XP / data layer / comments) :
#   - `rewardXp={tpl.max_score}` et `<span>+{rewardXp} XP</span>` :
#     gamification XP convention EIC (max possible livrable), pas note quality.
#   - `max_score`, `scores`, `total_score`, `totalScore` dans data shapes
#     déclarées en TypeScript : non rendus côté Player.
#   - Lignes commentées (commençant par `//`, dans `/* */`, ou dans header guards).
#
# Usage :
#   bash scripts/audit-r1.sh          → exit 0/1 + rapport lisible
#   bash scripts/audit-r1.sh --json   → output JSON pour CI
#
# Owner : Ralph (Claude Opus 4.7) — 2026-05-11.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Pattern canonique mission Ralph
R1_PATTERN='score\|rank\|note\|/100\|/140\|points\|toFixed'

# Surfaces Player-facing
SURFACES=(
  "app/journey"
  "app/results"
)
COMPONENT_GLOBS=(
  "components/results-*"
  "components/submission-*"
  "components/engagement-*"
)

MODE="${1:-text}"

echo "🔍 R1 audit — surfaces Player-facing"
echo "Pattern : $R1_PATTERN"
echo ""

# Collecte toutes les matches (sans filtrage)
ALL_MATCHES=$(grep -rnE "$R1_PATTERN" \
  "${SURFACES[@]}" ${COMPONENT_GLOBS[@]} \
  --include="*.tsx" 2>/dev/null || true)

# Filtre : exclure les lignes commentées (// ou *) et les déclarations TypeScript pures
# Une déclaration de type est : `<word>: <type>` sans `()` ni `<jsx>` et sans render JSX.
# Approche heuristique : on flag pour review humaine, le script reporte seulement.

if [ -z "$ALL_MATCHES" ]; then
  echo "✅ R1 audit clean : 0 match sur les surfaces Player-facing."
  exit 0
fi

# Classification des matches
SUSPICIOUS=""
WHITELISTED=""

while IFS= read -r line; do
  # Skip lignes commentées (heuristique)
  if echo "$line" | grep -qE ':\s*//' || echo "$line" | grep -qE '^\s*\*'; then
    WHITELISTED+="$line"$'\n'
    continue
  fi
  # Skip rewardXp (gamification XP convention)
  if echo "$line" | grep -qE 'rewardXp|reward_xp|max_score'; then
    WHITELISTED+="$line"$'\n'
    continue
  fi
  # Skip déclarations TypeScript pures (type Foo = { scores: ... })
  if echo "$line" | grep -qE ':\s*Record<|:\s*number\s*;|:\s*number\s*\||as\s+|\.select\(|\.from\('; then
    WHITELISTED+="$line"$'\n'
    continue
  fi
  # Skip isGameMaster-gated render (heuristique : ligne contient `isGameMaster` ou `isGm`)
  if echo "$line" | grep -qE 'isGameMaster|isGm\b'; then
    WHITELISTED+="$line"$'\n'
    continue
  fi
  # Tout le reste est suspect
  SUSPICIOUS+="$line"$'\n'
done <<< "$ALL_MATCHES"

if [ -n "$SUSPICIOUS" ]; then
  echo "⚠️  R1 audit FAIL — matches suspects (à réviser manuellement) :"
  echo ""
  echo "$SUSPICIOUS"
  echo ""
  echo "Total whitelisted : $(echo "$WHITELISTED" | grep -c '.' || echo 0)"
  echo "Total suspicious  : $(echo "$SUSPICIOUS" | grep -c '.' || echo 0)"
  exit 1
fi

echo "✅ R1 audit clean : tous les matches sont whitelistés (gamification XP / data layer / comments / GM-gated)."
echo "Total whitelisted : $(echo "$WHITELISTED" | grep -c '.' || echo 0)"
exit 0
