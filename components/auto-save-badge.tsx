"use client";
// A1 — Auto-save status badge (T3-IMPROVEMENTS.md A1)
// Displays one of three FR states:
//   null        → "Pas encore sauvegarde"
//   < 2s ago    → "Sauvegarde a l'instant"
//   >= 2s ago   → "Sauvegarde il y a Ns"
//
// Wording validated by eic-pedagogical-advisor (ADVISOR-VERDICT.md):
//   - No accents (consistent with lib/i18n.ts existing convention)
//   - R1 PASS: no score/rank/note/percentile
//   - R2 PASS: no validation warning, no blocking
//   - aria-live="polite" + role="status" for a11y
//
// The component re-renders every second via a lightweight setInterval to
// keep the elapsed-time label accurate. Interval is only active when
// lastSavedAt is non-null (cleared on unmount automatically).

import { useEffect, useState } from "react";

export function AutoSaveBadge({ lastSavedAt }: { lastSavedAt: Date | null }) {
  // Dummy state used solely to trigger re-render each second.
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!lastSavedAt) return;
    const id = window.setInterval(() => forceRender((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [lastSavedAt]);

  let label: string;
  if (!lastSavedAt) {
    label = "Pas encore sauvegarde";
  } else {
    const seconds = Math.max(0, Math.floor((Date.now() - lastSavedAt.getTime()) / 1000));
    if (seconds < 2) {
      label = "Sauvegarde a l'instant";
    } else {
      label = `Sauvegarde il y a ${seconds}s`;
    }
  }

  return (
    <p aria-live="polite" className="eic-autosave-badge" role="status">
      {label}
    </p>
  );
}
