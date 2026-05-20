"use client";

// quick-260520-124 ext (Task 5, 2026-05-20) — verdict pills shared component.
// 4 boutons radio single-select : not_convinced / needs_work / convinced / favorite.
// Posted via hidden input name="verdict". V3 + V4 only ; V1 reste sobre.
//
// R1 OK : verdict est cote jury, pas Player-facing.
// R2 OK : pas de validator nouveau.

import { useState } from "react";
import type { Verdict } from "@/lib/jury";
import type { dictionaries } from "@/lib/i18n";

type Dict = (typeof dictionaries)["fr"];

type Props = {
  initial?: Verdict | null;
  dict: Dict;
};

type Option = {
  value: Verdict;
  label: keyof Dict;
  icon: string;
  bg: string;
  bgActive: string;
  border: string;
  color: string;
};

const OPTIONS: ReadonlyArray<Option> = [
  {
    value: "not_convinced",
    label: "jury_verdict_not_convinced",
    icon: "👎",
    bg: "#f1f5f9",
    bgActive: "#cbd5e1",
    border: "#94a3b8",
    color: "#475569",
  },
  {
    value: "needs_work",
    label: "jury_verdict_needs_work",
    icon: "🤔",
    bg: "#fef3c7",
    bgActive: "#fde68a",
    border: "#f59e0b",
    color: "#92400e",
  },
  {
    value: "convinced",
    label: "jury_verdict_convinced",
    icon: "✓",
    bg: "#dbeafe",
    bgActive: "#1d4ed8",
    border: "#1d4ed8",
    color: "#1d4ed8",
  },
  {
    value: "favorite",
    label: "jury_verdict_favorite",
    icon: "★",
    bg: "#dcfce7",
    bgActive: "#16a34a",
    border: "#16a34a",
    color: "#15803d",
  },
];

export function JuryVerdictPills({ initial, dict }: Props) {
  const [verdict, setVerdict] = useState<Verdict | null>(initial ?? null);

  return (
    <div
      role="radiogroup"
      aria-label={dict.jury_verdict_label}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginTop: 12,
      }}
    >
      <span
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontWeight: 600,
          color: "var(--wf-ink-soft, #475569)",
        }}
      >
        {dict.jury_verdict_label}
      </span>
      <input type="hidden" name="verdict" value={verdict ?? ""} />
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {OPTIONS.map((opt) => {
          const isActive = verdict === opt.value;
          const labelText = dict[opt.label] as string;
          const activeText =
            opt.value === "convinced" || opt.value === "favorite"
              ? "#ffffff"
              : opt.color;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setVerdict(isActive ? null : opt.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 16,
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                background: isActive ? opt.bgActive : opt.bg,
                color: isActive ? activeText : opt.color,
                border: `1px solid ${opt.border}`,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                transition: "background 0.12s ease, color 0.12s ease",
              }}
            >
              <span aria-hidden="true">{opt.icon}</span>
              <span>{labelText}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
