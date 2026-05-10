// T3X-EXPANSION wave 3 / plan 08 — Player-facing bonus status badge.
// R1 STRICT : QUALITATIVE LABEL ONLY. Aucun chiffre, aucun multiplier_factor,
// aucune valeur de boost rendue Player. Si l'on doit un jour exposer plus
// d'info Player, ajouter une nouvelle prop typee literally (pas de number).
//
// Server component — aucun state runtime, juste un switch sur status.
import { dictionaries } from "@/lib/i18n";
import type { BonusStatus } from "@/lib/types";

const t = dictionaries.fr;

const STYLE_BY_STATUS: Record<
  BonusStatus,
  { background: string; color: string; border: string }
> = {
  draft: { background: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  submitted: { background: "#fef3c7", color: "#92400e", border: "#fcd34d" },
  validated: { background: "#dcfce7", color: "#166534", border: "#86efac" },
  rejected: { background: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
};

const LABEL_BY_STATUS: Record<BonusStatus, string> = {
  draft: t.bonus_status_submitted, // draft is rare — same label as submitted (en attente)
  submitted: t.bonus_status_submitted,
  validated: t.bonus_status_validated,
  rejected: t.bonus_status_rejected,
};

export function BonusStatusBadge({
  status,
  consumedAt,
}: {
  status: BonusStatus;
  consumedAt?: string | null;
}) {
  const style = STYLE_BY_STATUS[status];
  const label =
    status === "validated" && consumedAt !== null && consumedAt !== undefined
      ? `${t.bonus_status_validated} (consomme)`
      : LABEL_BY_STATUS[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        textTransform: "none",
        letterSpacing: 0,
      }}
      role="status"
      aria-label={label}
    >
      {label}
    </span>
  );
}
