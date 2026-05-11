"use client";

import { useActionState, useState } from "react";
import { savePitchScoreFlow, type WorkflowState } from "@/app/actions";
import type { dictionaries } from "@/lib/i18n";
import type { PitchScore, Player } from "@/lib/types";

const initialState: WorkflowState = { ok: false, message: "" };

type Dict = (typeof dictionaries)["fr"];

type Props = {
  player: Player;
  existing: PitchScore | null;
  eventId: string;
  dict: Dict;
};

const inputStyle: React.CSSProperties = {
  width: 64,
  padding: "6px 8px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 12,
  color: "#475569",
};

function clamp(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 20) return 20;
  return v;
}

export function JuryForm({ player, existing, eventId, dict }: Props) {
  const [state, formAction, pending] = useActionState(savePitchScoreFlow, initialState);
  const [c1, setC1] = useState<number>(existing?.c1 ?? 0);
  const [c2, setC2] = useState<number>(existing?.c2 ?? 0);
  const [c3, setC3] = useState<number>(existing?.c3 ?? 0);
  const [c4, setC4] = useState<number>(existing?.c4 ?? 0);
  const [c5, setC5] = useState<number>(existing?.c5 ?? 0);

  const total = clamp(c1) + clamp(c2) + clamp(c3) + clamp(c4) + clamp(c5);

  const fields: { key: "c1" | "c2" | "c3" | "c4" | "c5"; label: string; help: string; value: number; setter: (n: number) => void }[] = [
    { key: "c1", label: dict.jury_c1_label, help: dict.jury_c1_help, value: c1, setter: setC1 },
    { key: "c2", label: dict.jury_c2_label, help: dict.jury_c2_help, value: c2, setter: setC2 },
    { key: "c3", label: dict.jury_c3_label, help: dict.jury_c3_help, value: c3, setter: setC3 },
    { key: "c4", label: dict.jury_c4_label, help: dict.jury_c4_help, value: c4, setter: setC4 },
    { key: "c5", label: dict.jury_c5_label, help: dict.jury_c5_help, value: c5, setter: setC5 },
  ];

  return (
    <form action={formAction}>
      <input type="hidden" name="playerId" value={player.id} />
      <input type="hidden" name="eventId" value={eventId} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        {fields.map((f) => (
          <label key={f.key} style={labelStyle}>
            <span>{f.label}</span>
            {/* JRY-02 a11y: aria-describedby links to help text; aria-label removed
                (input is inside <label> so visible text is already its accessible name). */}
            <input
              type="number"
              name={f.key}
              min={0}
              max={20}
              step={1}
              required
              value={f.value}
              onChange={(e) => f.setter(clamp(Number(e.target.value)))}
              style={inputStyle}
              aria-describedby={`${f.key}-help`}
            />
            <span
              id={`${f.key}-help`}
              style={{ fontSize: 10, color: "#64748b", lineHeight: 1.3 }}
            >
              {f.help}
            </span>
          </label>
        ))}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 12,
            color: "#0f172a",
            fontWeight: 600,
          }}
        >
          <span>{dict.jury_total_label}</span>
          <span style={{ fontSize: 18 }}>{total}/100</span>
        </div>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "8px 16px",
            background: "#0f172a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? dict.jury_saving : dict.jury_save}
        </button>
      </div>
      {state.message ? (
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: state.ok ? "#16a34a" : "#dc2626",
          }}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
