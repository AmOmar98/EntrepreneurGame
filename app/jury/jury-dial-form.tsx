"use client";

// quick-260520-124 — V3 molettes rotatives SVG.
// 4 critères affichés (c1..c4) sous forme de dials, c5=0 envoyé en hidden.
// Pas de drag rotatif custom : input range invisible par-dessus chaque SVG
// pour KB+a11y + boutons +/- visibles. Décision plan ligne 241.
// Score total double affichage : /100 (canonique) + /20 (cosmétique).

import { useActionState, useRef, useState } from "react";
import { savePitchScoreFlow, type WorkflowState } from "@/app/actions";
import type { dictionaries } from "@/lib/i18n";
import type { JuryAggregate, PitchScoreWithComments } from "@/lib/jury";
import type { Player, PitchModeState } from "@/lib/types";
import { JuryVerdictPills } from "@/components/jury-verdict-pills";

const initialState: WorkflowState = { ok: false, message: "" };

type Dict = (typeof dictionaries)["fr"];

type Props = {
  player: Player;
  // quick-260520-124 ext — switched to PitchScoreWithComments for isDraft/verdict.
  existing: PitchScoreWithComments | null;
  eventId: string;
  dict: Dict;
  /** Cross-juror aggregate, populated only when pitch_mode_state === 'closed'. */
  aggregate?: JuryAggregate | null;
  /** quick-260520-124 F3 — banner state mapping (live vs closed). */
  pitchModeState?: PitchModeState;
};

function clamp(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 20) return 20;
  return v;
}

// ---------------------------------------------------------------------------
// Dial subcomponent — SVG 120x120, arc 270° de -135° à +135°.
// ---------------------------------------------------------------------------

type DialProps = {
  id: string;
  name: "c1" | "c2" | "c3" | "c4";
  label: string;
  help: string;
  value: number;
  onChange: (n: number) => void;
};

const DIAL_RADIUS = 44;
const ARC_TOTAL_DEG = 270; // de -135° à +135°
const ARC_START_DEG = -135;

// Stroke-dasharray total length pour un arc de 270° sur un cercle r=44.
const ARC_CIRCUMFERENCE = (2 * Math.PI * DIAL_RADIUS * ARC_TOTAL_DEG) / 360;

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

// quick-260520-124 ext (Task 4) — angle -> value mapping (clockwise -135..+135).
// Knob centre is at 90deg in SVG referentiel ; we re-base so 12 o'clock = mid.
function angleToValue(angleDeg: number): number {
  // Wrap to -180..+180
  let a = angleDeg;
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  // Dead zone : top half (angle outside [-135, +135]) → clamp to nearest end.
  if (a < -135) {
    // top-left → snap depending on which side closer to -135 or to +135 wrap
    return a < -157.5 ? 20 : 0;
  }
  if (a > 135) {
    return a > 157.5 ? 0 : 20;
  }
  return Math.round(((a + 135) / 270) * 20);
}

function pointerToAngle(
  clientX: number,
  clientY: number,
  svgEl: SVGSVGElement,
): number {
  const rect = svgEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  // atan2 returns radians from +X axis (3 o'clock). We want 12 o'clock = 0deg,
  // clockwise positive. So: angle_from_12 = atan2(dx, -dy) (since y inverted).
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

function Dial({ id, name, label, help, value, onChange }: DialProps) {
  const cx = 60;
  const cy = 60;
  const progressLength = (value / 20) * ARC_CIRCUMFERENCE;
  const indicatorAngle = ARC_START_DEG + (value / 20) * ARC_TOTAL_DEG;
  const [ix, iy] = polar(cx, cy, DIAL_RADIUS - 4, indicatorAngle);

  // quick-260520-124 ext (Task 4) — native drag rotatif on SVG knob.
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    draggingRef.current = true;
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore — Safari may throw on non-element target.
    }
    const a = pointerToAngle(e.clientX, e.clientY, svgRef.current);
    onChange(clamp(angleToValue(a)));
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current || !svgRef.current) return;
    const a = pointerToAngle(e.clientX, e.clientY, svgRef.current);
    onChange(clamp(angleToValue(a)));
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    draggingRef.current = false;
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: 8,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--wf-ink, #0f172a)",
          textAlign: "center",
        }}
      >
        {label}
      </span>

      <div
        style={{
          position: "relative",
          width: 120,
          height: 120,
        }}
      >
        <svg
          ref={svgRef}
          width={120}
          height={120}
          viewBox="0 0 120 120"
          aria-hidden="true"
          style={{ display: "block", touchAction: "none", cursor: "grab" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            <radialGradient id={`${id}-grad`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="var(--wf-paper-deep, #f1f5f9)" />
            </radialGradient>
          </defs>

          {/* Outer ring */}
          <circle
            cx={cx}
            cy={cy}
            r={54}
            fill="none"
            stroke="var(--wf-line, #e2e8f0)"
            strokeWidth={1}
          />

          {/* Track arc (background) */}
          <circle
            cx={cx}
            cy={cy}
            r={DIAL_RADIUS}
            fill="none"
            stroke="var(--wf-paper-deep, #f1f5f9)"
            strokeWidth={6}
            strokeDasharray={`${ARC_CIRCUMFERENCE} ${2 * Math.PI * DIAL_RADIUS}`}
            strokeLinecap="round"
            transform={`rotate(${ARC_START_DEG + 90} ${cx} ${cy})`}
          />

          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={DIAL_RADIUS}
            fill="none"
            stroke="var(--wf-blue, #1d4ed8)"
            strokeWidth={6}
            strokeDasharray={`${progressLength} ${2 * Math.PI * DIAL_RADIUS}`}
            strokeLinecap="round"
            transform={`rotate(${ARC_START_DEG + 90} ${cx} ${cy})`}
          />

          {/* Knob center */}
          <circle
            cx={cx}
            cy={cy}
            r={32}
            fill={`url(#${id}-grad)`}
            stroke="var(--wf-line, #e2e8f0)"
            strokeWidth={1}
          />

          {/* Indicator line (centre → bord du knob) */}
          <line
            x1={cx}
            y1={cy}
            x2={ix}
            y2={iy}
            stroke="var(--wf-blue, #1d4ed8)"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Value text centre */}
          <text
            x={cx}
            y={cy + 7}
            textAnchor="middle"
            fontFamily='"Baskervville", Georgia, serif'
            fontSize={22}
            fill="var(--wf-blue, #1d4ed8)"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </text>
        </svg>

        {/* quick-260520-124 ext (Task 4) — Input range KB-focusable mais sous
            le SVG (pointer-events: none) : drag rotatif natif sur SVG, fleches
            clavier toujours possibles via Tab. */}
        <input
          id={id}
          type="range"
          name={name}
          min={0}
          max={20}
          step={1}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          aria-label={label}
          aria-describedby={help ? `${id}-help` : undefined}
          aria-valuemin={0}
          aria-valuemax={20}
          aria-valuenow={value}
          inputMode="numeric"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* +/- buttons sage fallback */}
      <div
        style={{
          display: "flex",
          gap: 4,
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          aria-label={`Diminuer ${label}`}
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            border: "1px solid var(--wf-line, #e2e8f0)",
            background: "var(--wf-paper, #fff)",
            color: "var(--wf-ink, #0f172a)",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          −
        </button>
        <span
          style={{
            fontSize: 10,
            color: "var(--wf-ink-faint, #94a3b8)",
            minWidth: 32,
            textAlign: "center",
          }}
        >
          /20
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          aria-label={`Augmenter ${label}`}
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            border: "1px solid var(--wf-line, #e2e8f0)",
            background: "var(--wf-paper, #fff)",
            color: "var(--wf-ink, #0f172a)",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {help ? (
        <p
          id={`${id}-help`}
          style={{
            fontSize: 10,
            color: "var(--wf-ink-faint, #64748b)",
            lineHeight: 1.4,
            margin: 0,
            textAlign: "center",
          }}
        >
          {help}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JuryDialForm — top recap + 4 dials grid + submit.
// ---------------------------------------------------------------------------

export function JuryDialForm({
  player,
  existing,
  eventId,
  dict,
  aggregate,
  pitchModeState,
}: Props) {
  const [state, formAction, pending] = useActionState(savePitchScoreFlow, initialState);
  const [c1, setC1] = useState<number>(existing?.c1 ?? 0);
  const [c2, setC2] = useState<number>(existing?.c2 ?? 0);
  const [c3, setC3] = useState<number>(existing?.c3 ?? 0);
  const [c4, setC4] = useState<number>(existing?.c4 ?? 0);
  // quick-260520-124 F3 — pick the banner string based on pitch mode state.
  const bannerLabel =
    pitchModeState === "closed"
      ? dict.jury_pitch_mode_closed_banner
      : dict.jury_pitch_mode_live_banner;

  const total = clamp(c1) + clamp(c2) + clamp(c3) + clamp(c4);
  const score100 = Math.round(total * 1.25);
  const score20 = (total / 4).toFixed(1);

  const fields: ReadonlyArray<{
    key: "c1" | "c2" | "c3" | "c4";
    label: string;
    help: string;
    value: number;
    setter: (n: number) => void;
  }> = [
    { key: "c1", label: dict.jury_c1_label, help: dict.jury_c1_help, value: c1, setter: setC1 },
    { key: "c2", label: dict.jury_c2_label, help: dict.jury_c2_help, value: c2, setter: setC2 },
    { key: "c3", label: dict.jury_c3_label, help: dict.jury_c3_help, value: c3, setter: setC3 },
    { key: "c4", label: dict.jury_c4_label, help: dict.jury_c4_help, value: c4, setter: setC4 },
  ];

  return (
    <form action={formAction} className="eic-jury-form-v3">
      <input type="hidden" name="playerId" value={player.id} />
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="c5" value={0} />

      {/* Top recap */}
      <div
        style={{
          background: "var(--wf-paper-deep, #f8fafc)",
          border: "1px solid var(--wf-line, #e2e8f0)",
          borderRadius: 8,
          padding: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "var(--wf-ink-soft, #475569)",
              margin: 0,
            }}
          >
            {dict.jury_total_label}
          </p>
          <p
            style={{
              fontFamily: '"Baskervville", Georgia, serif',
              fontSize: 28,
              color: "var(--wf-blue, #1d4ed8)",
              margin: "2px 0 0",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.1,
            }}
            aria-live="polite"
          >
            {score100}
            <span style={{ fontSize: 14, color: "var(--wf-ink-faint, #94a3b8)" }}>
              /100
            </span>
            {/* quick-260520-124 F4 — visible separator + bullet to break the
                cramped "0/1000.0 /20" rendering seen during smoke. */}
            <span
              aria-hidden="true"
              style={{
                color: "var(--wf-ink-faint, #cbd5e1)",
                margin: "0 8px",
                fontFamily: "inherit",
              }}
            >
              ·
            </span>
            <span
              style={{
                fontSize: 13,
                color: "var(--wf-ink-soft, #475569)",
                fontFamily: "inherit",
              }}
            >
              {score20}
              <span style={{ color: "var(--wf-ink-faint, #94a3b8)" }}> /20</span>
            </span>
          </p>
        </div>

        {aggregate ? (
          <div
            style={{
              background: "var(--wf-blue-tint, #dbeafe)",
              border: "1px solid var(--wf-blue, #1d4ed8)",
              borderRadius: 6,
              padding: "6px 10px",
            }}
            aria-label={dict.jury_pitch_aggregate_label}
          >
            <span
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "var(--wf-blue, #1d4ed8)",
                fontWeight: 600,
                display: "block",
              }}
            >
              {dict.jury_pitch_aggregate_label}
            </span>
            <span
              style={{
                fontFamily: '"Baskervville", Georgia, serif',
                fontSize: 18,
                color: "var(--wf-blue, #1d4ed8)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {aggregate.avg100.toFixed(1)}
              <span style={{ fontSize: 11, color: "var(--wf-ink-soft, #475569)" }}>
                /100
              </span>
            </span>
            <span
              style={{
                fontSize: 9,
                color: "var(--wf-ink-soft, #475569)",
                display: "block",
              }}
            >
              {dict.jury_pitch_aggregate_juror_count.replace(
                "{n}",
                String(aggregate.jurorCount),
              )}
            </span>
          </div>
        ) : null}
      </div>

      {/* Dials grid */}
      <div className="eic-jury-form-v3__grid">
        {fields.map((f) => (
          <Dial
            key={f.key}
            id={`${f.key}-dial-${player.id}`}
            name={f.key}
            label={f.label}
            help={f.help}
            value={f.value}
            onChange={f.setter}
          />
        ))}
      </div>

      {/* quick-260520-124 ext (Task 5) — Verdict pills (V3 only). */}
      <JuryVerdictPills initial={existing?.verdict ?? null} dict={dict} />

      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* quick-260520-124 ext (Task 6) — Brouillon / Valider dual submit. */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="submit"
            name="isDraft"
            value="true"
            disabled={pending}
            className="eic-button"
            style={{
              flex: "1 1 140px",
              padding: "10px 16px",
              fontSize: 13,
              cursor: pending ? "not-allowed" : "pointer",
              opacity: pending ? 0.6 : 1,
            }}
          >
            {dict.jury_save_draft}
          </button>
          <button
            type="submit"
            name="isDraft"
            value="false"
            disabled={pending}
            className="eic-button eic-button--primary"
            style={{
              flex: "1 1 140px",
              padding: "10px 16px",
              fontSize: 14,
              cursor: pending ? "not-allowed" : "pointer",
              opacity: pending ? 0.6 : 1,
            }}
          >
            {pending ? dict.jury_saving : dict.jury_save}
          </button>
        </div>

        {existing ? (
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              margin: 0,
              padding: "4px 8px",
              borderRadius: 4,
              background:
                existing.isDraft === false ? "#dcfce7" : "#fef3c7",
              color:
                existing.isDraft === false ? "#15803d" : "#92400e",
              border:
                existing.isDraft === false
                  ? "1px solid #86efac"
                  : "1px solid #fde68a",
              textAlign: "center",
            }}
          >
            {existing.isDraft === false
              ? dict.jury_status_validated
              : dict.jury_status_draft}
          </p>
        ) : null}

        <p
          style={{
            fontSize: 10,
            color: "var(--wf-ink-faint, #94a3b8)",
            margin: 0,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          {bannerLabel}
        </p>
      </div>

      {total === 0 && (
        <p
          className="eic-jury-form__warn"
          role="status"
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#92400e",
            background: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: 6,
            padding: "6px 10px",
          }}
        >
          &#9888; Vérifie : tous les critères sont à 0
        </p>
      )}
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
